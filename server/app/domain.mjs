export const SCORE_SHEET_STATUSES = ["draft", "final", "published"];
export const THEME_CODES = ["sami", "sarkaz", "sui"];
export const MATCH_STATUSES = ["IN_PROGRESS", "PENDING", "FINISHED"];
export const MEMBER_RUN_STATUSES = ["LIVE", "PENDING", "FINISHED"];
export const BROADCAST_STATUSES = ["LIVE", "UPCOMING", "OFFLINE"];
export const SCHEDULE_SLOT_TONES = ["default", "alert", "featured"];
export const ruleVersion = "jingchuge-2-docx-2026-03-12";

const STATUS_WEIGHT = {
  draft: 0,
  final: 1,
  published: 2,
};

const THEME_CODE_SET = new Set(THEME_CODES);
const SCORE_STATUS_SET = new Set(SCORE_SHEET_STATUSES);

export const tournamentConfig = Object.freeze({
  roster: {
    teamSize: 4,
    requiredPressureRoleCount: 1,
    totalBattleHours: 14,
  },
  sharedIngots: {
    maxNetSpend: 200,
  },
  coachCalls: {
    maxCount: 3,
    maxMinutesPerCall: 3,
  },
  uniqueSixStars: {
    enabled: true,
    excludeTemporaryRecruit: true,
  },
  coefficientTracking: {
    enabled: true,
    initialValue: 1,
    overtimeStepMinutes: 20,
    overtimePenaltyPerStep: 0.05,
    duplicateSixStarPenalty: 0.1,
    extraShopSpendPenalty: 0.01,
  },
});

function nowIso() {
  return new Date().toISOString();
}

function parseNumber(value, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function roundTo(value, precision = 4) {
  const factor = 10 ** precision;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function stringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeOperatorDraft(entry) {
  const draft = plainObject(entry);
  return {
    id: typeof draft.id === "string" ? draft.id : "",
    memberId: typeof draft.memberId === "string" ? draft.memberId : "",
    operatorName: typeof draft.operatorName === "string" ? draft.operatorName : "",
    rarity: Math.max(0, parseNumber(draft.rarity, 0)),
    isTemporaryRecruit: Boolean(draft.isTemporaryRecruit),
    note: typeof draft.note === "string" ? draft.note : "",
    createdAt: typeof draft.createdAt === "string" ? draft.createdAt : nowIso(),
  };
}

function normalizeCoachCall(entry) {
  const call = plainObject(entry);
  return {
    id: typeof call.id === "string" ? call.id : "",
    requestedByMemberId: typeof call.requestedByMemberId === "string" ? call.requestedByMemberId : "",
    targetMemberId: typeof call.targetMemberId === "string" ? call.targetMemberId : "",
    durationMinutes: Math.max(0, parseNumber(call.durationMinutes, 0)),
    note: typeof call.note === "string" ? call.note : "",
    createdAt: typeof call.createdAt === "string" ? call.createdAt : nowIso(),
  };
}

function normalizeComplianceRecord(teamId, record = {}) {
  const next = plainObject(record);
  return {
    teamId,
    pressureMemberId: typeof next.pressureMemberId === "string" ? next.pressureMemberId : null,
    openingIngots: Math.max(0, parseNumber(next.openingIngots, 0)),
    currentIngots: Math.max(0, parseNumber(next.currentIngots, 0)),
    overtimeMinutes: Math.max(0, parseNumber(next.overtimeMinutes, 0)),
    operatorDrafts: Array.isArray(next.operatorDrafts) ? next.operatorDrafts.map(normalizeOperatorDraft) : [],
    coachCalls: Array.isArray(next.coachCalls) ? next.coachCalls.map(normalizeCoachCall) : [],
    notes: stringArray(next.notes),
    updatedAt: typeof next.updatedAt === "string" ? next.updatedAt : nowIso(),
  };
}

function isValidScoreSheet(sheet) {
  return (
    sheet
    && typeof sheet === "object"
    && !Array.isArray(sheet)
    && typeof sheet.id === "string"
    && sheet.id.trim()
    && typeof sheet.teamId === "string"
    && sheet.teamId.trim()
    && typeof sheet.memberId === "string"
    && sheet.memberId.trim()
    && typeof sheet.theme === "string"
    && THEME_CODE_SET.has(sheet.theme)
  );
}

function normalizeScoreSheet(sheet) {
  return {
    id: sheet.id,
    teamId: sheet.teamId,
    memberId: sheet.memberId,
    matchId: typeof sheet.matchId === "string" && sheet.matchId.trim() ? sheet.matchId : null,
    theme: sheet.theme,
    snapshot: plainObject(sheet.snapshot),
    previewScore: parseNumber(sheet.previewScore, 0),
    formulaText: typeof sheet.formulaText === "string" ? sheet.formulaText : "",
    note: typeof sheet.note === "string" ? sheet.note : "",
    status: SCORE_STATUS_SET.has(sheet.status) ? sheet.status : "draft",
    calculatorVersion: typeof sheet.calculatorVersion === "string" ? sheet.calculatorVersion : "jingchuge-html-v1",
    createdAt: typeof sheet.createdAt === "string" ? sheet.createdAt : nowIso(),
    updatedAt: typeof sheet.updatedAt === "string" ? sheet.updatedAt : nowIso(),
  };
}

export function createEmptyPublicContent() {
  return {
    siteMeta: {
      eventName: "",
      eventCode: "",
      subtitle: "",
      description: "",
      startDate: "",
      locationLabel: "",
      prizePool: [],
      highlights: [],
      ctaLinks: [],
    },
    overviewPanels: [],
    liveBroadcast: {
      title: "",
      subtitle: "",
      platform: "bilibili",
      status: "OFFLINE",
      startTimeLabel: "",
      href: "",
      roomLabel: "",
      notice: "",
    },
    matches: [],
    eventSchedule: [],
    leaderboard: [],
    judgeNotices: [],
    teams: [],
    ruleSections: [],
    themeRules: [],
  };
}

export function createDefaultOpsState(publicContent = createEmptyPublicContent()) {
  const timestamp = nowIso();
  return {
    version: 1,
    updatedAt: timestamp,
    complianceByTeam: Object.fromEntries(
      (publicContent.teams ?? []).map((team) => [team.id, normalizeComplianceRecord(team.id, { updatedAt: timestamp })]),
    ),
  };
}

export function createDefaultScoreSheetsState() {
  return {
    version: 1,
    updatedAt: nowIso(),
    sheets: [],
  };
}

export function syncOpsStateWithTeams(publicContent, opsState = createDefaultOpsState(publicContent)) {
  const nextState = plainObject(opsState);
  const complianceByTeam = plainObject(nextState.complianceByTeam);

  for (const team of publicContent.teams ?? []) {
    complianceByTeam[team.id] = normalizeComplianceRecord(team.id, complianceByTeam[team.id]);
  }

  return {
    version: parseNumber(nextState.version, 1),
    updatedAt: typeof nextState.updatedAt === "string" ? nextState.updatedAt : nowIso(),
    complianceByTeam,
  };
}

export function syncScoreSheetsState(state = createDefaultScoreSheetsState()) {
  const nextState = plainObject(state);
  const sheets = Array.isArray(nextState.sheets) ? nextState.sheets.filter(isValidScoreSheet).map(normalizeScoreSheet) : [];

  return {
    version: parseNumber(nextState.version, 1),
    updatedAt: typeof nextState.updatedAt === "string" ? nextState.updatedAt : nowIso(),
    sheets,
  };
}

export function formatScore(value) {
  const rounded = Math.round(parseNumber(value, 0) * 100) / 100;
  const hasFraction = Math.abs(rounded - Math.round(rounded)) > 1e-6;

  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

export function inferThemeCodeFromLabel(label) {
  const value = String(label ?? "");
  if (value.includes("萨卡兹")) {
    return "sarkaz";
  }

  if (value.includes("界园") || value.includes("岁")) {
    return "sui";
  }

  return "sami";
}

export function assertThemeCode(theme) {
  if (!THEME_CODE_SET.has(theme)) {
    throw new Error(`theme must be one of ${THEME_CODES.join(", ")}.`);
  }
}

export function assertScoreSheetStatus(status) {
  if (!SCORE_STATUS_SET.has(status)) {
    throw new Error(`status must be one of ${SCORE_SHEET_STATUSES.join(", ")}.`);
  }
}

export function findTeam(publicContent, teamId) {
  return publicContent.teams.find((team) => team.id === teamId) ?? null;
}

export function findMatch(publicContent, matchId) {
  return publicContent.matches.find((match) => match.id === matchId) ?? null;
}

export function findMember(team, memberId) {
  return team.members.find((member) => member.id === memberId) ?? null;
}

export function assertThemeMatchesMember(team, memberId, theme) {
  const member = findMember(team, memberId);
  if (!member) {
    throw new Error(`Member ${memberId} does not exist on team ${team.name}.`);
  }

  const expectedTheme = inferThemeCodeFromLabel(member.theme);
  if (expectedTheme !== theme) {
    throw new Error(`Member ${member.name} must submit under ${expectedTheme}.`);
  }
}

export function assertMatchBelongsToTeam(publicContent, teamId, matchId) {
  if (matchId == null || matchId === "") {
    return null;
  }

  const match = findMatch(publicContent, matchId);
  if (!match) {
    throw new Error(`Match ${matchId} was not found.`);
  }

  if (match.teamId !== teamId) {
    throw new Error(`Match ${matchId} does not belong to team ${teamId}.`);
  }

  return match;
}

function normalizeOperatorName(value) {
  return String(value ?? "").trim().toLowerCase();
}

function groupDuplicateSixStars(operatorDrafts) {
  const grouped = new Map();

  for (const draft of operatorDrafts ?? []) {
    if (draft.rarity !== 6) {
      continue;
    }

    if (draft.isTemporaryRecruit && tournamentConfig.uniqueSixStars.excludeTemporaryRecruit) {
      continue;
    }

    const key = normalizeOperatorName(draft.operatorName);
    const entries = grouped.get(key) ?? [];
    entries.push(draft);
    grouped.set(key, entries);
  }

  return Array.from(grouped.values())
    .filter((entries) => entries.length > 1)
    .map((entries) => ({
      operatorName: entries[0].operatorName,
      memberIds: entries.map((entry) => entry.memberId),
      entries,
    }));
}

function countDuplicateSixStarSelections(duplicateSixStars) {
  return duplicateSixStars.reduce((sum, group) => sum + Math.max(group.entries.length - 1, 0), 0);
}

function buildCoefficientBreakdown(compliance, duplicateSixStars, sharedIngotsSpent) {
  const overtimeSteps = Math.floor(
    Math.max(compliance.overtimeMinutes, 0) / tournamentConfig.coefficientTracking.overtimeStepMinutes,
  );
  const duplicateCount = countDuplicateSixStarSelections(duplicateSixStars);
  const extraShopSpend = Math.max(sharedIngotsSpent - tournamentConfig.sharedIngots.maxNetSpend, 0);

  const overtimeDelta = roundTo(-overtimeSteps * tournamentConfig.coefficientTracking.overtimePenaltyPerStep);
  const duplicateSixStarDelta = roundTo(
    -duplicateCount * tournamentConfig.coefficientTracking.duplicateSixStarPenalty,
  );
  const extraShopSpendDelta = roundTo(
    -extraShopSpend * tournamentConfig.coefficientTracking.extraShopSpendPenalty,
  );
  const totalDelta = roundTo(overtimeDelta + duplicateSixStarDelta + extraShopSpendDelta);
  const finalValue = roundTo(tournamentConfig.coefficientTracking.initialValue + totalDelta);

  return {
    initialValue: tournamentConfig.coefficientTracking.initialValue,
    overtime: {
      minutes: compliance.overtimeMinutes,
      stepMinutes: tournamentConfig.coefficientTracking.overtimeStepMinutes,
      steps: overtimeSteps,
      delta: overtimeDelta,
    },
    duplicateSixStars: {
      duplicateCount,
      groups: duplicateSixStars.map((group) => ({
        operatorName: group.operatorName,
        memberIds: group.memberIds,
      })),
      delta: duplicateSixStarDelta,
    },
    extraShopSpend: {
      spent: sharedIngotsSpent,
      limit: tournamentConfig.sharedIngots.maxNetSpend,
      excess: extraShopSpend,
      delta: extraShopSpendDelta,
    },
    totalDelta,
    finalValue,
  };
}

export function buildTeamComplianceSummary(team, rawCompliance = normalizeComplianceRecord(team.id)) {
  const compliance = normalizeComplianceRecord(team.id, rawCompliance);
  const pressureRoleAssigned = Boolean(compliance.pressureMemberId);
  const pressureRoleMemberExists = team.members.some((member) => member.id === compliance.pressureMemberId);
  const sharedIngotsSpent = Math.max(compliance.openingIngots - compliance.currentIngots, 0);
  const duplicateSixStars = groupDuplicateSixStars(compliance.operatorDrafts);
  const overDurationCalls = compliance.coachCalls.filter(
    (entry) => entry.durationMinutes > tournamentConfig.coachCalls.maxMinutesPerCall,
  );
  const missingMembers = Math.max(tournamentConfig.roster.teamSize - team.members.length, 0);

  const blockingIssues = [];
  const warnings = [];

  if (!pressureRoleAssigned) {
    blockingIssues.push("Pressure role is not assigned.");
  } else if (!pressureRoleMemberExists) {
    blockingIssues.push("Pressure role member is missing from the roster.");
  }

  if (missingMembers > 0) {
    blockingIssues.push(`Roster is short by ${missingMembers} member(s).`);
  }

  if (compliance.coachCalls.length > tournamentConfig.coachCalls.maxCount) {
    blockingIssues.push("Coach call count exceeds the rule limit.");
  }

  if (overDurationCalls.length > 0) {
    blockingIssues.push("At least one coach call exceeds the per-call duration limit.");
  }

  const coefficientBreakdown = buildCoefficientBreakdown(compliance, duplicateSixStars, sharedIngotsSpent);

  if (coefficientBreakdown.overtime.delta !== 0) {
    warnings.push(`Overtime coefficient penalty applied (${coefficientBreakdown.overtime.delta}).`);
  } else if (compliance.overtimeMinutes > 0) {
    warnings.push("Overtime minutes were recorded but did not reach the first 20-minute penalty step.");
  }

  if (coefficientBreakdown.duplicateSixStars.delta !== 0) {
    warnings.push(
      `Duplicate six-star coefficient penalty applied (${coefficientBreakdown.duplicateSixStars.delta}).`,
    );
  }

  if (coefficientBreakdown.extraShopSpend.delta !== 0) {
    warnings.push(
      `Extra shop spend coefficient penalty applied (${coefficientBreakdown.extraShopSpend.delta}).`,
    );
  }

  return {
    teamId: team.id,
    teamName: team.name,
    teamTag: team.tag,
    ruleConfig: tournamentConfig,
    roster: {
      expectedSize: tournamentConfig.roster.teamSize,
      actualSize: team.members.length,
      missingMembers,
      pressureMemberId: compliance.pressureMemberId,
      pressureMemberName: team.members.find((member) => member.id === compliance.pressureMemberId)?.name ?? null,
      pressureRoleValid: pressureRoleAssigned && pressureRoleMemberExists,
    },
    sharedIngots: {
      openingIngots: compliance.openingIngots,
      currentIngots: compliance.currentIngots,
      spent: sharedIngotsSpent,
      limit: tournamentConfig.sharedIngots.maxNetSpend,
      withinLimit: sharedIngotsSpent <= tournamentConfig.sharedIngots.maxNetSpend,
    },
    coachCalls: {
      totalCount: compliance.coachCalls.length,
      maxCount: tournamentConfig.coachCalls.maxCount,
      maxMinutesPerCall: tournamentConfig.coachCalls.maxMinutesPerCall,
      overDurationCalls,
      records: compliance.coachCalls,
    },
    operators: {
      duplicateSixStars,
      duplicateCount: coefficientBreakdown.duplicateSixStars.duplicateCount,
      records: compliance.operatorDrafts,
    },
    overtime: {
      minutes: compliance.overtimeMinutes,
    },
    notes: compliance.notes,
    coefficient: coefficientBreakdown.finalValue,
    coefficientBreakdown,
    blockingIssues,
    warnings,
  };
}

export function buildComplianceCollection(teams, complianceByTeam) {
  return teams.map((team) => buildTeamComplianceSummary(team, complianceByTeam?.[team.id]));
}

function parseTimestamp(value) {
  return value ? Date.parse(value) || 0 : 0;
}

function parseNumericScore(value) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value.replace(/,/g, "")) || 0;
  }

  return 0;
}

function pickLatestSheetForMember(teamSheets, member) {
  const expectedTheme = inferThemeCodeFromLabel(member.theme);
  const matches = teamSheets.filter((sheet) => sheet.memberId === member.id && sheet.theme === expectedTheme);
  if (!matches.length) {
    return null;
  }

  return [...matches].sort((left, right) => {
    const statusDiff = STATUS_WEIGHT[right.status] - STATUS_WEIGHT[left.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }

    return parseTimestamp(right.updatedAt) - parseTimestamp(left.updatedAt);
  })[0];
}

function deriveAggregateStatus(members) {
  if (!members.some((member) => member.sheet)) {
    return { key: "empty", label: "待录入" };
  }

  if (members.every((member) => member.sheet && member.sheet.status === "published")) {
    return { key: "published", label: "已发布" };
  }

  if (members.every((member) => member.sheet && (member.sheet.status === "final" || member.sheet.status === "published"))) {
    return { key: "final", label: "待发布" };
  }

  return { key: "draft", label: "录分中" };
}

export function buildTeamAggregate(team, rawCompliance, teamSheets) {
  const complianceRecord = normalizeComplianceRecord(team.id, rawCompliance);
  const compliance = buildTeamComplianceSummary(team, complianceRecord);
  const members = team.members.map((member) => {
    const sheet = pickLatestSheetForMember(teamSheets, member);
    const baseScore = sheet ? parseNumericScore(sheet.previewScore) : 0;
    const isPressureMember = complianceRecord.pressureMemberId === member.id;
    const pressureBonus = isPressureMember ? baseScore * 0.2 : 0;

    return {
      memberId: member.id,
      name: member.name,
      role: member.role,
      expectedTheme: member.theme,
      themeCode: inferThemeCodeFromLabel(member.theme),
      sheet,
      score: baseScore,
      pressureApplied: isPressureMember,
      pressureBonus,
      adjustedScore: baseScore + pressureBonus,
    };
  });

  const rawTotal = members.reduce((sum, member) => sum + member.score, 0);
  const pressureBonus = members.reduce((sum, member) => sum + member.pressureBonus, 0);
  const preCoefficientTotal = rawTotal + pressureBonus;
  const coefficient = compliance.coefficient;
  const finalTotal = roundTo(preCoefficientTotal * coefficient, 2);
  const status = deriveAggregateStatus(members);
  const finalizedCount = members.filter(
    (member) => member.sheet && (member.sheet.status === "final" || member.sheet.status === "published"),
  ).length;
  const publishedCount = members.filter((member) => member.sheet?.status === "published").length;
  const scoredCount = members.filter((member) => member.sheet).length;
  const nextPendingMember = members.find((member) => !member.sheet || member.sheet.status === "draft") ?? null;
  const publishBlockingIssues = [...compliance.blockingIssues];

  const updatedAt = members.reduce((latest, member) => {
    const candidate = member.sheet?.updatedAt ?? null;
    return parseTimestamp(candidate) > parseTimestamp(latest) ? candidate : latest;
  }, complianceRecord.updatedAt ?? null);

  return {
    teamId: team.id,
    teamName: team.name,
    teamTag: team.tag,
    status,
    memberCount: members.length,
    scoredCount,
    finalizedCount,
    publishedCount,
    publishReady: members.length > 0 && finalizedCount === members.length && publishBlockingIssues.length === 0,
    rawTotal,
    pressureBonus,
    preCoefficientTotal,
    coefficient,
    coefficientBreakdown: compliance.coefficientBreakdown,
    finalTotal,
    teamTotal: finalTotal,
    formatted: {
      rawTotal: formatScore(rawTotal),
      pressureBonus: formatScore(pressureBonus),
      preCoefficientTotal: formatScore(preCoefficientTotal),
      coefficient: formatScore(coefficient),
      finalTotal: formatScore(finalTotal),
      teamTotal: formatScore(finalTotal),
    },
    pressureMemberId: complianceRecord.pressureMemberId,
    pressureMemberName: members.find((member) => member.memberId === complianceRecord.pressureMemberId)?.name ?? null,
    nextPendingMemberName: nextPendingMember?.name ?? null,
    publishBlockingIssues,
    warnings: compliance.warnings,
    members,
    compliance,
    updatedAt,
  };
}

export function buildAllTeamAggregates(publicContent, opsState, scoreSheetsState) {
  return publicContent.teams.map((team) =>
    buildTeamAggregate(
      team,
      opsState.complianceByTeam?.[team.id],
      scoreSheetsState.sheets.filter((sheet) => sheet.teamId === team.id),
    ),
  );
}

function sortTeamsByAggregate(teams, aggregateMap) {
  return [...teams].sort((left, right) => {
    const rightScore = aggregateMap.get(right.id)?.finalTotal ?? aggregateMap.get(right.id)?.teamTotal ?? parseNumericScore(right.totalScore);
    const leftScore = aggregateMap.get(left.id)?.finalTotal ?? aggregateMap.get(left.id)?.teamTotal ?? parseNumericScore(left.totalScore);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return parseNumber(left.rank, 999) - parseNumber(right.rank, 999);
  });
}

export function applyAggregateToPublicContent(publicContent, aggregates) {
  const nextContent = structuredClone(publicContent);
  const aggregateMap = new Map(aggregates.map((aggregate) => [aggregate.teamId, aggregate]));
  const rankedTeams = sortTeamsByAggregate(nextContent.teams, aggregateMap);
  const rankByTeamId = new Map(rankedTeams.map((team, index) => [team.id, index + 1]));

  for (const team of nextContent.teams) {
    const aggregate = aggregateMap.get(team.id);
    if (aggregate) {
      team.totalScore = aggregate.formatted.finalTotal;
    }

    team.rank = rankByTeamId.get(team.id) ?? team.rank;
  }

  for (const entry of nextContent.leaderboard) {
    const aggregate = aggregateMap.get(entry.teamId);
    if (!aggregate) {
      continue;
    }

    entry.total = aggregate.formatted.finalTotal;
    entry.details = `${aggregate.finalizedCount}/${aggregate.memberCount} 已确认 · ${aggregate.status.label}`;
  }

  nextContent.leaderboard.sort((left, right) => {
    const rightScore = parseNumericScore(right.total);
    const leftScore = parseNumericScore(left.total);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return (rankByTeamId.get(left.teamId) ?? 999) - (rankByTeamId.get(right.teamId) ?? 999);
  });

  for (const match of nextContent.matches) {
    const aggregate = aggregateMap.get(match.teamId);
    if (aggregate) {
      match.totalScore = aggregate.formatted.finalTotal;
    }
  }

  return nextContent;
}

export function summariseScoreSheet(sheet) {
  return {
    id: sheet.id,
    teamId: sheet.teamId,
    memberId: sheet.memberId,
    matchId: sheet.matchId ?? null,
    theme: sheet.theme,
    status: sheet.status,
    previewScore: sheet.previewScore,
    formulaText: sheet.formulaText,
    updatedAt: sheet.updatedAt,
  };
}

export function validateScoreSheetPayload(payload, team, { matchIdOptional = true } = {}) {
  const body = plainObject(payload);

  if (typeof body.teamId !== "string" || !body.teamId.trim()) {
    throw new Error("teamId is required.");
  }

  if (body.teamId !== team.id) {
    throw new Error(`teamId ${body.teamId} does not match team ${team.id}.`);
  }

  if (typeof body.memberId !== "string" || !body.memberId.trim()) {
    throw new Error("memberId is required.");
  }

  if (!team.members.some((member) => member.id === body.memberId)) {
    throw new Error(`Member ${body.memberId} does not exist on team ${team.name}.`);
  }

  assertThemeCode(body.theme);

  if (!body.snapshot || typeof body.snapshot !== "object" || Array.isArray(body.snapshot)) {
    throw new Error("snapshot must be an object.");
  }

  if (!matchIdOptional && (typeof body.matchId !== "string" || !body.matchId.trim())) {
    throw new Error("matchId is required.");
  }

  if (body.matchId !== undefined && body.matchId !== null && typeof body.matchId !== "string") {
    throw new Error("matchId must be a string, null, or omitted.");
  }

  if (body.previewScore !== undefined && (typeof body.previewScore !== "number" || !Number.isFinite(body.previewScore))) {
    throw new Error("previewScore must be a finite number when provided.");
  }

  if (body.formulaText !== undefined && typeof body.formulaText !== "string") {
    throw new Error("formulaText must be a string when provided.");
  }

  if (body.note !== undefined && typeof body.note !== "string") {
    throw new Error("note must be a string.");
  }

  if (body.status !== undefined) {
    assertScoreSheetStatus(body.status);
  }

  if (body.id !== undefined && typeof body.id !== "string") {
    throw new Error("id must be a string when provided.");
  }

  if (body.calculatorVersion !== undefined && typeof body.calculatorVersion !== "string") {
    throw new Error("calculatorVersion must be a string when provided.");
  }
}

function getIdentityKey(sheet) {
  return [sheet.teamId, sheet.memberId, sheet.theme, sheet.matchId ?? ""].join("::");
}

export function findScoreSheet(state, filters = {}) {
  return (
    state.sheets.find((sheet) => {
      if (filters.id && sheet.id !== filters.id) {
        return false;
      }

      if (filters.teamId && sheet.teamId !== filters.teamId) {
        return false;
      }

      if (filters.memberId && sheet.memberId !== filters.memberId) {
        return false;
      }

      if (filters.theme && sheet.theme !== filters.theme) {
        return false;
      }

      if (Object.prototype.hasOwnProperty.call(filters, "matchId")) {
        const actualMatchId = sheet.matchId ?? null;
        const expectedMatchId = filters.matchId ?? null;
        if (actualMatchId !== expectedMatchId) {
          return false;
        }
      }

      if (filters.status && sheet.status !== filters.status) {
        return false;
      }

      return true;
    }) ?? null
  );
}

export function listScoreSheets(state, filters = {}) {
  return state.sheets.filter((sheet) => {
    if (filters.teamId && sheet.teamId !== filters.teamId) {
      return false;
    }

    if (filters.memberId && sheet.memberId !== filters.memberId) {
      return false;
    }

    if (filters.theme && sheet.theme !== filters.theme) {
      return false;
    }

    if (filters.status && sheet.status !== filters.status) {
      return false;
    }

    if (Object.prototype.hasOwnProperty.call(filters, "matchId")) {
      const actualMatchId = sheet.matchId ?? null;
      const expectedMatchId = filters.matchId ?? null;
      if (actualMatchId !== expectedMatchId) {
        return false;
      }
    }

    return true;
  });
}

export function upsertScoreSheet(state, payload, createId) {
  const nextState = syncScoreSheetsState(state);
  const timestamp = nowIso();

  const existingById = payload.id ? findScoreSheet(nextState, { id: payload.id }) : null;
  const existingByIdentity = existingById
    ? null
    : findScoreSheet(nextState, {
        teamId: payload.teamId,
        memberId: payload.memberId,
        theme: payload.theme,
        matchId: payload.matchId ?? null,
      });

  const existing = existingById ?? existingByIdentity;
  if (existing) {
    existing.matchId = payload.matchId ?? null;
    existing.snapshot = plainObject(payload.snapshot);
    existing.previewScore = payload.previewScore;
    existing.formulaText = payload.formulaText;
    existing.note = payload.note ?? existing.note ?? "";
    existing.status = payload.status ?? existing.status ?? "draft";
    existing.calculatorVersion = payload.calculatorVersion ?? existing.calculatorVersion ?? "jingchuge-html-v1";
    existing.updatedAt = timestamp;
    nextState.updatedAt = timestamp;

    return {
      state: nextState,
      sheet: existing,
      created: false,
    };
  }

  const nextSheet = normalizeScoreSheet({
    id: createId(),
    teamId: payload.teamId,
    memberId: payload.memberId,
    matchId: payload.matchId ?? null,
    theme: payload.theme,
    snapshot: payload.snapshot,
    previewScore: payload.previewScore,
    formulaText: payload.formulaText,
    note: payload.note ?? "",
    status: payload.status ?? "draft",
    calculatorVersion: payload.calculatorVersion ?? "jingchuge-html-v1",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  nextState.sheets.push(nextSheet);
  nextState.updatedAt = timestamp;

  return {
    state: nextState,
    sheet: nextSheet,
    created: true,
  };
}

export function updateScoreSheetStatus(state, sheetId, status) {
  assertScoreSheetStatus(status);
  const nextState = syncScoreSheetsState(state);
  const sheet = findScoreSheet(nextState, { id: sheetId });
  if (!sheet) {
    throw new Error(`Score sheet ${sheetId} was not found.`);
  }

  sheet.status = status;
  sheet.updatedAt = nowIso();
  nextState.updatedAt = sheet.updatedAt;

  return {
    state: nextState,
    sheet,
  };
}

export function replaceAllSheetsForTeamPublish(state, teamId) {
  const nextState = syncScoreSheetsState(state);
  const timestamp = nowIso();

  for (const sheet of nextState.sheets) {
    if (sheet.teamId === teamId && (sheet.status === "final" || sheet.status === "published")) {
      sheet.status = "published";
      sheet.updatedAt = timestamp;
    }
  }

  nextState.updatedAt = timestamp;
  return nextState;
}

export function buildAdminBootstrap(publicContent, opsState, scoreSheetsState) {
  return {
    publicContent,
    ruleVersion,
    tournamentConfig,
    opsState,
    scoreSheets: scoreSheetsState.sheets.map(summariseScoreSheet),
    compliance: buildComplianceCollection(publicContent.teams, opsState.complianceByTeam),
    aggregates: buildAllTeamAggregates(publicContent, opsState, scoreSheetsState),
  };
}

export function buildCalculatorBootstrap(publicContent, opsState, scoreSheetsState) {
  return {
    ruleVersion,
    tournamentConfig,
    teams: publicContent.teams,
    matches: publicContent.matches,
    scoreSheets: scoreSheetsState.sheets.map(summariseScoreSheet),
    compliance: buildComplianceCollection(publicContent.teams, opsState.complianceByTeam),
    aggregates: buildAllTeamAggregates(publicContent, opsState, scoreSheetsState),
  };
}
