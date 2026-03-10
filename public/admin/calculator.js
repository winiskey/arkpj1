let currentTab = "team";
let calculatorBootstrap = { teams: [], matches: [], scoreSheets: [], aggregates: [] };
let activeSheetId = null;
let activeSheetStatus = "draft";
let teamAggregateCache = null;

const THEME_LABELS = {
    team: "????",
    sami: "????????",
    sarkaz: "????????",
    sui: "??????",
};

const STATUS_LABELS = {
    draft: "??",
    final: "???",
    published: "???",
    empty: "???",
};

const gv = (id) => parseFloat(document.getElementById(id)?.value || 0) || 0;
const gc = (id) => !!document.getElementById(id)?.checked;
const sumChecked = (selector) => {
    let sum = 0;
    document.querySelectorAll(selector).forEach((el) => {
        sum += parseFloat(el.value) || 0;
    });
    return sum;
};

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatScore(value) {
    const rounded = Math.round((Number(value) || 0) * 100) / 100;
    const hasFraction = Math.abs(rounded - Math.round(rounded)) > 1e-6;
    return rounded.toLocaleString("en-US", {
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: 2,
    });
}

function inferThemeCodeFromMember(member) {
    if (!member?.theme) {
        return null;
    }
    if (member.theme.includes("???")) {
        return "sarkaz";
    }
    if (member.theme.includes("??") || member.theme.includes("?")) {
        return "sui";
    }
    return "sami";
}

function getSelectedTeam() {
    const teamId = document.getElementById("meta-team")?.value || "";
    return calculatorBootstrap.teams.find((team) => team.id === teamId) || null;
}

function getSelectedMember() {
    const team = getSelectedTeam();
    const memberId = document.getElementById("meta-member")?.value || "";
    return team?.members.find((member) => member.id === memberId) || null;
}

function getCurrentThemeCode() {
    return currentTab === "team" ? null : currentTab;
}

async function apiFetch(path, options = {}) {
    const response = await fetch(path, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    const rawText = await response.text();
    const data = rawText ? JSON.parse(rawText) : {};

    if (!response.ok) {
        throw new Error(data?.error?.message || `???? (${response.status})`);
    }

    return data;
}

function setToolbarMessage(message, isError = false) {
    const toolbar = document.getElementById("toolbar-message");
    if (toolbar) {
        toolbar.textContent = message;
        toolbar.style.color = isError ? "#ffc7c2" : "var(--text-sub)";
    }

    const syncText = document.getElementById("sync-text");
    if (syncText) {
        syncText.textContent = message;
        syncText.style.color = isError ? "#ffc7c2" : "var(--text-sub)";
    }
}

function setSheetStatus(status, customLabel) {
    activeSheetStatus = status;
    const chip = document.getElementById("sheet-status-chip");
    if (!chip) {
        return;
    }
    chip.dataset.status = status;
    chip.textContent = customLabel || STATUS_LABELS[status] || status;
}

function updateIdentityText() {
    const team = getSelectedTeam();
    const member = getSelectedMember();
    const themeLabel = THEME_LABELS[currentTab] || "???";
    const parts = [];
    if (team) {
        parts.push(team.name);
    }
    if (member) {
        parts.push(member.name);
    }
    parts.push(themeLabel);
    document.getElementById("identity-text").textContent = team ? parts.join(" / ") : "????????";
}

function populateTeamOptions() {
    const select = document.getElementById("meta-team");
    const currentValue = select.value;
    const options = ['<option value="">?????</option>'];

    calculatorBootstrap.teams.forEach((team) => {
        options.push(`<option value="${escapeHtml(team.id)}">${escapeHtml(team.name)}</option>`);
    });

    select.innerHTML = options.join("");
    if (calculatorBootstrap.teams.some((team) => team.id === currentValue)) {
        select.value = currentValue;
    } else if (calculatorBootstrap.teams[0]) {
        select.value = calculatorBootstrap.teams[0].id;
    }
}

function populateMemberOptions(teamId) {
    const select = document.getElementById("meta-member");
    const currentValue = select.value;
    const team = calculatorBootstrap.teams.find((entry) => entry.id === teamId);
    const options = ['<option value="">?????</option>'];

    (team?.members || []).forEach((member) => {
        options.push(`<option value="${escapeHtml(member.id)}">${escapeHtml(member.name)}</option>`);
    });

    select.innerHTML = options.join("");
    if (team?.members.some((member) => member.id === currentValue)) {
        select.value = currentValue;
    } else if (team?.members?.[0]) {
        select.value = team.members[0].id;
    }
}

function populateMatchOptions(teamId) {
    const select = document.getElementById("meta-match");
    const currentValue = select.value;
    const teamMatches = calculatorBootstrap.matches.filter((match) => match.teamId === teamId);
    const options = ['<option value="">?????</option>'];

    teamMatches.forEach((match) => {
        const label = `${match.id} ? ${match.phase} ? ${match.startTime}`;
        options.push(`<option value="${escapeHtml(match.id)}">${escapeHtml(label)}</option>`);
    });

    select.innerHTML = options.join("");
    if (teamMatches.some((match) => match.id === currentValue)) {
        select.value = currentValue;
    } else if (teamMatches[0]) {
        select.value = teamMatches[0].id;
    }
}

function collectCurrentSnapshot() {
    if (currentTab === "team") {
        return {};
    }

    const area = document.getElementById(currentTab);
    const snapshot = {};
    area.querySelectorAll("input[id], select[id]").forEach((el) => {
        if (el.type === "checkbox") {
            snapshot[el.id] = el.checked;
        } else if (el.type === "number") {
            snapshot[el.id] = Number(el.value || 0);
        } else {
            snapshot[el.id] = el.value;
        }
    });
    return snapshot;
}

function clearCurrentThemeForm(shouldRecalculate = true) {
    if (currentTab === "team") {
        return;
    }

    const area = document.getElementById(currentTab);
    area.querySelectorAll("input, select").forEach((el) => {
        if (el.type === "checkbox") {
            el.checked = false;
        } else if (el.type === "number") {
            el.value = 0;
        } else if (el.tagName === "SELECT") {
            el.selectedIndex = 0;
        } else {
            el.value = "";
        }
    });

    if (shouldRecalculate) {
        calc();
    }
}

function restoreCurrentSnapshot(snapshot) {
    clearCurrentThemeForm(false);
    const area = document.getElementById(currentTab);
    area.querySelectorAll("input[id], select[id]").forEach((el) => {
        if (!(el.id in snapshot)) {
            return;
        }
        if (el.type === "checkbox") {
            el.checked = Boolean(snapshot[el.id]);
        } else {
            el.value = snapshot[el.id];
        }
    });
    calc();
}

function renderComplianceBoard(summary) {
    const host = document.getElementById("team-compliance-board");
    if (!summary) {
        host.innerHTML = '<div class="tips-text">??????</div>';
        return;
    }

    const sections = [
        `<div class="summary-row"><div class="summary-main"><strong>???</strong><div class="summary-meta">${escapeHtml(summary.roster.pressureMemberName || "???")}</div></div><div class="summary-value">${summary.roster.pressureRoleValid ? "???" : "???"}</div></div>`,
        `<div class="summary-row"><div class="summary-main"><strong>??????</strong><div class="summary-meta">?? ${summary.sharedIngots.limit} ?</div></div><div class="summary-value">${summary.sharedIngots.spent}</div></div>`,
        `<div class="summary-row"><div class="summary-main"><strong>????</strong><div class="summary-meta">?? ${summary.coachCalls.maxCount} ???? ${summary.coachCalls.maxMinutesPerCall} ??</div></div><div class="summary-value">${summary.coachCalls.totalCount}</div></div>`,
        `<div class="summary-row"><div class="summary-main"><strong>????</strong><div class="summary-meta">?? ${summary.blockingIssues.length} ? / ?? ${summary.warnings.length} ?</div></div><div class="summary-value">${summary.blockingIssues.length > 0 ? "???" : "??"}</div></div>`,
    ];

    if (summary.blockingIssues.length) {
        sections.push(`<div class="warning-box">${summary.blockingIssues.map((item) => `? ${escapeHtml(item)}`).join("<br>")}</div>`);
    }
    if (summary.warnings.length) {
        sections.push(`<div class="highlight-box">${summary.warnings.map((item) => `? ${escapeHtml(item)}`).join("<br>")}</div>`);
    }

    host.innerHTML = sections.join("");
}

function renderTeamAggregate(aggregate) {
    teamAggregateCache = aggregate;
    document.getElementById("team-status").textContent = aggregate?.status?.label || "?????";
    document.getElementById("team-progress").textContent = aggregate ? `${aggregate.scoredCount} / ${aggregate.memberCount}` : "0 / 0";
    document.getElementById("team-raw-total").textContent = aggregate?.formatted?.rawTotal || "0";
    document.getElementById("team-pressure-bonus").textContent = aggregate?.formatted?.pressureBonus || "0";
    document.getElementById("team-final-total").textContent = aggregate?.formatted?.teamTotal || "0";

    const membersBoard = document.getElementById("team-members-board");
    if (!aggregate) {
        membersBoard.innerHTML = '<div class="tips-text">??????????????????????</div>';
        renderComplianceBoard(null);
        return;
    }

    membersBoard.innerHTML = aggregate.members.map((member) => {
        const statusLabel = member.sheet ? (STATUS_LABELS[member.sheet.status] || member.sheet.status) : "???";
        const note = member.sheet?.note ? `<div class="summary-meta">???${escapeHtml(member.sheet.note)}</div>` : "";
        return `
            <div class="summary-row">
                <div class="summary-main">
                    <strong>${escapeHtml(member.name)}</strong>
                    <div class="summary-meta">${escapeHtml(member.expectedTheme)} / ${escapeHtml(statusLabel)}${member.pressureApplied ? " / ???" : ""}</div>
                    ${note}
                </div>
                <div class="summary-value">
                    <div>${formatScore(member.adjustedScore)}</div>
                    <div class="summary-meta">?? ${formatScore(member.score)}</div>
                </div>
            </div>
        `;
    }).join("");

    renderComplianceBoard(aggregate.compliance);
}

async function refreshTeamAggregate(showMessage = true) {
    const team = getSelectedTeam();
    if (!team) {
        renderTeamAggregate(null);
        calc();
        syncActionButtons();
        return;
    }

    const aggregate = await apiFetch(`/api/admin/teams/${team.id}/aggregate`);
    renderTeamAggregate(aggregate);
    if (showMessage && currentTab === "team") {
        setToolbarMessage("??????????");
    }
    calc();
    syncActionButtons();
}

function calcTeam() {
    if (!teamAggregateCache) {
        return { total: 0, formula: "?????????????" };
    }
    return {
        total: teamAggregateCache.teamTotal,
        formula: `???? = ${teamAggregateCache.formatted.rawTotal} + ????? ${teamAggregateCache.formatted.pressureBonus}`,
    };
}

function calcSami() {
    let raw = gv("sa-score") + gv("sa-items") * 10 + gv("sa-plates") * 5 + gv("sa-6s") * 50 + gv("sa-5s") * 20 + gv("sa-4s") * 10;
    raw += sumChecked(".sa-stage:checked");
    if (gc("sa-combo")) raw += 50;
    if (gc("sa-gardener-nl")) raw += 50;
    if (gc("sa-sentinel-nl")) raw += 100;
    raw += gv("sa-end-link");
    if (gc("sa-gift")) raw += 70;
    return { total: raw, formula: `(${raw.toFixed(2)})` };
}

function calcSarkaz() {
    let raw = gv("sk-score") + gv("sk-items") * 5 + gv("sk-6s") * 50 + gv("sk-5s") * 20 + gv("sk-4s") * 10;
    if (gc("sk-memory-violate")) raw -= 17.5;
    if (gc("sk-babel-miss")) raw -= 500;
    raw += sumChecked(".sk-stage:checked");
    const hasKarma = gc("sk-karma");
    let ending = 0;
    if (gc("sk-n1-done")) {
        let value = hasKarma ? 120 : 50;
        if (gc("sk-n1-conf")) value += hasKarma ? 50 : 20;
        if (hasKarma && gc("sk-n1-perf")) value += 80;
        ending += value;
    }
    if (gc("sk-n2-done")) {
        let value = hasKarma ? 200 : 50;
        if (gc("sk-n2-conf")) value += hasKarma ? 50 : 20;
        ending += value;
    }
    if (gc("sk-n3-done")) {
        let value = hasKarma ? 300 : 100;
        if (gc("sk-n3-conf")) value += hasKarma ? 50 : 20;
        ending += value;
    }
    if (gc("sk-n5-done")) {
        let value = 500;
        if (gc("sk-n5-conf")) value += 100;
        if (gc("sk-boss")) value += 300;
        ending += value;
    }
    if (gc("sk-n4-done")) {
        let value = 400;
        if (gc("sk-n4-conf")) value += 200;
        const relic = document.getElementById("sk-end-relic").value;
        if (hasKarma) {
            if (relic === "bone") {
                if (gc("sk-n4-perf")) value += 100;
            }
            if (relic === "body") {
                if (gc("sk-n4-perf")) value += 100;
                value *= 1.1;
            }
            if (relic === "reality") {
                if (gc("sk-n4-perf")) value += 150;
                value *= 1.5;
            }
        } else {
            if (relic === "bone") value *= 0.6;
            if (relic === "body") value *= 0.8;
        }
        ending += value;
    }
    if (gc("sk-roll")) ending *= 1.2;
    raw += ending;
    return { total: raw * 0.75, formula: `(${raw.toFixed(2)} ? 0.75)` };
}

function calcSui() {
    const items = Math.max(0, gv("sui-items"));
    const steps = Math.max(0, gv("sui-steps"));
    if (gc("sui-rule-violate") || steps > 150) {
        return { total: 0, formula: "????????0?" };
    }

    let raw = gv("sui-score") + Math.min(items, 120) * 5 + gv("sui-6s") * 50 + gv("sui-5s") * 20 + gv("sui-4s") * 10;
    raw += sumChecked(".sui-stage:checked");

    const hasXM = gc("sui-it-xm");
    const hasWS = gc("sui-it-ws");
    const hasYYQ = gc("sui-it-yyq");
    const hasWF = gc("sui-it-wf");

    if (gc("sui-stage-posz")) { if (hasXM) raw += 50; if (hasWS) raw += 30; if (hasYYQ) raw += 30; if (hasWF) raw += 50; }
    if (gc("sui-stage-xzry")) { if (hasXM) raw += 100; if (hasWS) raw += 50; if (hasYYQ) raw += 50; if (hasWF) raw += 50; }
    if (gc("sui-stage-tsjy")) { if (hasXM) raw += 50; if (hasWS) raw += 30; }
    if (gc("sui-stage-wxny")) { if (hasXM) raw += 100; if (hasWS) raw += 50; }
    if (gc("sui-stage-msz")) { if (hasXM) raw += 50; if (hasWF) raw += 50; }
    if (gc("sui-stage-ms")) { if (hasXM) raw += 50; if (hasWS) raw += 50; }

    const endMap = {
        dqk: { base: 400, perf: 200 },
        dqk_dby: { base: 800, perf: 200 },
        zb_hzf: { base: 800, perf: 250 },
        zb_scx: { base: 900, perf: 300 },
        zb_gdy: { base: 800, perf: 250 },
        zb_sjl: { base: 700, perf: 200 },
        zb_yqs: { base: 1200, perf: 0 },
    };

    const ending = document.getElementById("sui-ending").value;
    if (ending !== "none") {
        raw += endMap[ending].base;
        if (ending === "zb_yqs") raw += gv("sui-beast-loss");
        else if (gc("sui-end-perf")) raw += endMap[ending].perf;
        if (hasWS) raw += 100;
        if (hasYYQ) raw += 100;
        if (hasWF) raw += 50;
    }

    raw -= Math.max(0, steps - 100) * 1.5;
    raw -= Math.max(0, items - 120) * 7.5;

    let multiplier = 0.4 * (1 + (gc("sui-item-a") ? 0.2 : 0) + (gc("sui-item-b") ? 0.2 : 0));
    if (gc("sui-pen-1")) multiplier *= 0.5;
    if (gc("sui-pen-2")) multiplier *= 0.5;

    return { total: raw * multiplier, formula: `(${raw.toFixed(2)} ? ${multiplier.toFixed(2)})` };
}

function calculateCurrentResult() {
    if (currentTab === "team") return calcTeam();
    if (currentTab === "sami") return calcSami();
    if (currentTab === "sarkaz") return calcSarkaz();
    if (currentTab === "sui") return calcSui();
    return { total: 0, formula: "????" };
}

function calc() {
    const result = calculateCurrentResult();
    document.getElementById("total-score").innerText = Number(result.total || 0).toFixed(2);
    document.getElementById("formula-text").innerText = result.formula;
}

function resetSection(button) {
    if (currentTab === "team") {
        refreshTeamAggregate();
        return;
    }

    const card = button.closest(".section-card");
    if (!card) {
        return;
    }

    card.querySelectorAll("input,select").forEach((el) => {
        if (el.type === "checkbox") el.checked = false;
        else if (el.type === "number") el.value = 0;
        else if (el.tagName === "SELECT") el.selectedIndex = 0;
        else el.value = "";
    });
    calc();
}

function syncActionButtons() {
    const team = getSelectedTeam();
    const member = getSelectedMember();
    const expectedTheme = inferThemeCodeFromMember(member);
    const canEditSheet = currentTab !== "team" && team && member && expectedTheme === currentTab;

    document.getElementById("save-btn").disabled = !canEditSheet;
    document.getElementById("final-btn").disabled = !canEditSheet;
    document.getElementById("publish-btn").disabled = !(teamAggregateCache && teamAggregateCache.publishReady);
}

async function loadSheetForCurrentSelection() {
    updateIdentityText();

    if (currentTab === "team") {
        await refreshTeamAggregate(false);
        return;
    }

    const team = getSelectedTeam();
    const member = getSelectedMember();
    if (!team || !member) {
        activeSheetId = null;
        clearCurrentThemeForm();
        setSheetStatus("draft", "?????");
        setToolbarMessage("?????????????", true);
        syncActionButtons();
        return;
    }

    const expectedTheme = inferThemeCodeFromMember(member);
    if (expectedTheme !== currentTab) {
        activeSheetId = null;
        clearCurrentThemeForm();
        setSheetStatus("draft", `??? ${THEME_LABELS[expectedTheme]}`);
        setToolbarMessage(`???? ${member.name} ?????? ${THEME_LABELS[expectedTheme]}?`, true);
        syncActionButtons();
        return;
    }

    const params = new URLSearchParams({
        teamId: team.id,
        memberId: member.id,
        theme: currentTab,
    });
    const matchId = document.getElementById("meta-match").value;
    if (matchId) {
        params.set("matchId", matchId);
    }

    const data = await apiFetch(`/api/admin/score-sheets?${params.toString()}`);
    if (data.sheet) {
        activeSheetId = data.sheet.id;
        document.getElementById("meta-note").value = data.sheet.note || "";
        restoreCurrentSnapshot(data.sheet.snapshot || {});
        setSheetStatus(data.sheet.status);
        setToolbarMessage("????????");
    } else {
        activeSheetId = null;
        document.getElementById("meta-note").value = "";
        clearCurrentThemeForm();
        setSheetStatus("draft", "???");
        setToolbarMessage("???????????????");
    }

    await refreshTeamAggregate(false);
    syncActionButtons();
}

async function saveSheetWithStatus(nextStatus) {
    if (currentTab === "team") {
        await refreshTeamAggregate();
        return;
    }

    const team = getSelectedTeam();
    const member = getSelectedMember();
    if (!team || !member) {
        setToolbarMessage("??????????", true);
        return;
    }

    const expectedTheme = inferThemeCodeFromMember(member);
    if (expectedTheme !== currentTab) {
        setToolbarMessage(`???? ${member.name} ???? ${THEME_LABELS[currentTab]}?`, true);
        return;
    }

    const result = calculateCurrentResult();
    const payload = {
        id: activeSheetId || undefined,
        teamId: team.id,
        memberId: member.id,
        matchId: document.getElementById("meta-match").value || null,
        theme: currentTab,
        snapshot: collectCurrentSnapshot(),
        previewScore: Number((result.total || 0).toFixed(2)),
        formulaText: result.formula,
        note: document.getElementById("meta-note").value.trim(),
        status: nextStatus,
        calculatorVersion: "jingchuge-html-v1",
    };

    const data = await apiFetch("/api/admin/score-sheets/upsert", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    activeSheetId = data.sheet.id;
    setSheetStatus(data.sheet.status);
    renderTeamAggregate(data.aggregate);
    calc();
    syncActionButtons();
    setToolbarMessage(nextStatus === "final" ? "?????????" : "?????????");
}

async function saveDraft() {
    await saveSheetWithStatus("draft");
}

async function finalizeSheet() {
    await saveSheetWithStatus("final");
}

async function publishTeam() {
    const team = getSelectedTeam();
    if (!team) {
        setToolbarMessage("???????", true);
        return;
    }

    const data = await apiFetch(`/api/admin/teams/${team.id}/publish`, {
        method: "POST",
    });

    renderTeamAggregate(data.aggregate);
    setToolbarMessage("???????????");
    if (currentTab !== "team") {
        await loadSheetForCurrentSelection();
    } else {
        calc();
    }
    syncActionButtons();
}

function switchTab(id, button) {
    currentTab = id;
    document.querySelectorAll(".tab-btn").forEach((el) => el.classList.remove("active"));
    document.querySelectorAll(".content-area").forEach((el) => el.classList.remove("active"));
    if (button) button.classList.add("active");
    document.getElementById(id).classList.add("active");
    updateIdentityText();
    if (id === "team") refreshTeamAggregate();
    else loadSheetForCurrentSelection();
    calc();
    syncActionButtons();
}

async function handleIdentityChange() {
    updateIdentityText();
    if (currentTab === "team") await refreshTeamAggregate(false);
    else await loadSheetForCurrentSelection();
}

async function handleTeamChange() {
    const team = getSelectedTeam();
    populateMemberOptions(team?.id || "");
    populateMatchOptions(team?.id || "");
    updateIdentityText();
    if (currentTab === "team") await refreshTeamAggregate(false);
    else await loadSheetForCurrentSelection();
}

async function handleMemberChange() {
    updateIdentityText();
    if (currentTab === "team") await refreshTeamAggregate(false);
    else await loadSheetForCurrentSelection();
}

function copyScore() {
    const score = document.getElementById("total-score").innerText;
    navigator.clipboard.writeText(score).then(() => {
        setToolbarMessage("??????????");
    });
}

function resetForm() {
    if (currentTab === "team") {
        refreshTeamAggregate();
        return;
    }
    if (!confirm("????????????????")) {
        return;
    }
    activeSheetId = null;
    document.getElementById("meta-note").value = "";
    clearCurrentThemeForm();
    setSheetStatus("draft", "???");
    setToolbarMessage("?????????????????????????");
    syncActionButtons();
}

async function loadBootstrap() {
    try {
        calculatorBootstrap = await apiFetch("/api/admin/calculator/bootstrap");
        populateTeamOptions();
        const team = getSelectedTeam();
        populateMemberOptions(team?.id || "");
        populateMatchOptions(team?.id || "");
        updateIdentityText();
        await refreshTeamAggregate(false);
        if (currentTab !== "team") {
            await loadSheetForCurrentSelection();
        } else {
            calc();
        }
        setToolbarMessage("????????????");
    } catch (error) {
        console.error(error);
        setToolbarMessage(error instanceof Error ? error.message : "?????", true);
    }
    syncActionButtons();
}

calc();
loadBootstrap();
