const SCORE_SHEET_STATUSES = ["draft", "final", "published"];
const THEME_CODES = new Set(["sami", "sarkaz", "sui"]);

function nowIso() {
  return new Date().toISOString();
}

function getIdentityKey(sheet) {
  return [sheet.teamId, sheet.memberId, sheet.theme, sheet.matchId ?? ""].join("::");
}

export function createDefaultScoreSheetsState() {
  return {
    version: 1,
    updatedAt: nowIso(),
    sheets: [],
  };
}

export function syncScoreSheetsState(state) {
  const nextState = structuredClone(state ?? createDefaultScoreSheetsState());
  nextState.version ??= 1;
  nextState.updatedAt ??= nowIso();
  nextState.sheets = Array.isArray(nextState.sheets) ? nextState.sheets : [];
  return nextState;
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

export function assertScoreSheetStatus(status) {
  if (!SCORE_SHEET_STATUSES.includes(status)) {
    throw new Error(`status 必须是 ${SCORE_SHEET_STATUSES.join(" / ")} 之一。`);
  }
}

export function assertThemeCode(theme) {
  if (!THEME_CODES.has(theme)) {
    throw new Error("theme 必须是 sami、sarkaz 或 sui。");
  }
}

function normaliseSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("snapshot 必须是对象。");
  }
  return snapshot;
}

export function validateScoreSheetPayload(payload, team, matchIdOptional = true) {
  if (typeof payload.memberId !== "string" || !payload.memberId.trim()) {
    throw new Error("memberId 不能为空。");
  }

  if (!team.members.some((member) => member.id === payload.memberId)) {
    throw new Error(`成员 ${payload.memberId} 不存在于队伍 ${team.name} 中。`);
  }

  assertThemeCode(payload.theme);
  normaliseSnapshot(payload.snapshot);

  if (!matchIdOptional && (typeof payload.matchId !== "string" || !payload.matchId.trim())) {
    throw new Error("matchId 不能为空。");
  }

  if (payload.matchId !== undefined && payload.matchId !== null && typeof payload.matchId !== "string") {
    throw new Error("matchId 必须是字符串、null 或省略。");
  }

  if (typeof payload.previewScore !== "number" || !Number.isFinite(payload.previewScore)) {
    throw new Error("previewScore 必须是数字。");
  }

  if (typeof payload.formulaText !== "string") {
    throw new Error("formulaText 必须是字符串。");
  }

  if (payload.note !== undefined && typeof payload.note !== "string") {
    throw new Error("note 必须是字符串。");
  }

  if (payload.status !== undefined) {
    assertScoreSheetStatus(payload.status);
  }
}

export function findScoreSheet(state, filters) {
  return state.sheets.find((sheet) => {
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
      const expectedMatchId = filters.matchId ?? null;
      const actualMatchId = sheet.matchId ?? null;
      if (actualMatchId !== expectedMatchId) {
        return false;
      }
    }
    return true;
  }) ?? null;
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
    return true;
  });
}

export function upsertScoreSheet(state, payload, createId) {
  const nextState = syncScoreSheetsState(state);
  const timestamp = nowIso();
  const existing = payload.id
    ? findScoreSheet(nextState, { id: payload.id })
    : findScoreSheet(nextState, {
        teamId: payload.teamId,
        memberId: payload.memberId,
        theme: payload.theme,
        matchId: payload.matchId ?? null,
      });

  if (existing) {
    existing.matchId = payload.matchId ?? null;
    existing.snapshot = payload.snapshot;
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

  const nextSheet = {
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
  };

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
    throw new Error(`未找到计分单 ${sheetId}。`);
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

export function getScoreSheetIdentityKey(sheet) {
  return getIdentityKey(sheet);
}
