import http from "node:http";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { applyAggregateToPublicContent, buildAllTeamAggregates, buildTeamAggregate, inferThemeCodeFromLabel } from "./lib/aggregate.mjs";
import { buildComplianceCollection, buildTeamComplianceSummary, tournamentConfig } from "./lib/compliance.mjs";
import { matchPath, readJsonBody, sendError, sendJson, sendNoContent } from "./lib/http.mjs";
import { createJsonStore } from "./lib/json-store.mjs";
import {
  createDefaultScoreSheetsState,
  findScoreSheet,
  listScoreSheets,
  replaceAllSheetsForTeamPublish,
  summariseScoreSheet,
  syncScoreSheetsState,
  upsertScoreSheet,
  updateScoreSheetStatus,
  validateScoreSheetPayload,
} from "./lib/score-sheets.mjs";
import { createDefaultOpsState, syncOpsStateWithTeams } from "./lib/seed.mjs";

const publicContentPath = fileURLToPath(new URL("./data/public-content.json", import.meta.url));
const opsStatePath = fileURLToPath(new URL("./data/ops-state.json", import.meta.url));
const scoreSheetsPath = fileURLToPath(new URL("./data/score-sheets.json", import.meta.url));

function createEmptyPublicContent() {
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

const publicContentStore = createJsonStore(publicContentPath, async () => createEmptyPublicContent());
const opsStateStore = createJsonStore(opsStatePath, async () => createDefaultOpsState(await publicContentStore.read()));
const scoreSheetsStore = createJsonStore(scoreSheetsPath, async () => createDefaultScoreSheetsState());

const requiredPublicKeys = [
  "siteMeta",
  "overviewPanels",
  "liveBroadcast",
  "matches",
  "eventSchedule",
  "leaderboard",
  "judgeNotices",
  "teams",
  "ruleSections",
  "themeRules",
];

function assertObject(value, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(message);
  }
}

function assertPublicContentShape(value) {
  assertObject(value, "public-content 请求体必须是对象。");

  for (const key of requiredPublicKeys) {
    if (!(key in value)) {
      throw new Error(`public-content 缺少顶层字段 ${key}。`);
    }
  }
}

function getTeam(publicContent, teamId) {
  return publicContent.teams.find((team) => team.id === teamId) ?? null;
}

function getMatch(publicContent, matchId) {
  return publicContent.matches.find((match) => match.id === matchId) ?? null;
}

function getMember(team, memberId) {
  return team.members.find((member) => member.id === memberId) ?? null;
}

function assertMemberExists(team, memberId, fieldLabel) {
  if (!getMember(team, memberId)) {
    throw new Error(`${fieldLabel} ${memberId} 不存在于队伍 ${team.name} 中。`);
  }
}

function assertMatchExists(publicContent, teamId, matchId) {
  if (matchId === null || matchId === undefined || matchId === "") {
    return null;
  }

  const match = getMatch(publicContent, matchId);
  if (!match) {
    throw new Error(`未找到比赛 ${matchId}。`);
  }
  if (match.teamId !== teamId) {
    throw new Error(`比赛 ${matchId} 不属于队伍 ${teamId}。`);
  }
  return match;
}

function assertThemeMatchesMember(team, memberId, theme) {
  const member = getMember(team, memberId);
  if (!member) {
    throw new Error(`成员 ${memberId} 不存在于队伍 ${team.name} 中。`);
  }

  const expectedTheme = inferThemeCodeFromLabel(member.theme);
  if (expectedTheme !== theme) {
    throw new Error(`成员 ${member.name} 的主题应为 ${expectedTheme}，当前不能保存为 ${theme}。`);
  }
}

function applyCompliancePatch(team, compliance, patch) {
  if ("pressureMemberId" in patch) {
    if (patch.pressureMemberId !== null && typeof patch.pressureMemberId !== "string") {
      throw new Error("pressureMemberId 必须是字符串或 null。");
    }

    if (typeof patch.pressureMemberId === "string") {
      assertMemberExists(team, patch.pressureMemberId, "抗压位成员");
    }

    compliance.pressureMemberId = patch.pressureMemberId;
  }

  for (const numericField of ["openingIngots", "currentIngots", "overtimeMinutes"]) {
    if (numericField in patch) {
      const nextValue = Number(patch[numericField]);
      if (!Number.isFinite(nextValue) || nextValue < 0) {
        throw new Error(`${numericField} ????????`);
      }
      compliance[numericField] = nextValue;
    }
  }

  if ("notes" in patch) {
    if (!Array.isArray(patch.notes) || patch.notes.some((note) => typeof note !== "string")) {
      throw new Error("notes 必须是字符串数组。");
    }
    compliance.notes = patch.notes;
  }

  compliance.updatedAt = new Date().toISOString();
  return compliance;
}

async function ensureStoresReady() {
  const publicContent = await publicContentStore.read();
  await opsStateStore.update((state) => syncOpsStateWithTeams(publicContent, state));
  await scoreSheetsStore.update((state) => syncScoreSheetsState(state));
}

async function readSystemState() {
  const publicContent = await publicContentStore.read();
  const opsState = syncOpsStateWithTeams(publicContent, await opsStateStore.read());
  const scoreSheetsState = syncScoreSheetsState(await scoreSheetsStore.read());
  return {
    publicContent,
    opsState,
    scoreSheetsState,
  };
}

function buildAdminBootstrap(publicContent, opsState, scoreSheetsState) {
  const aggregates = buildAllTeamAggregates(publicContent, opsState, scoreSheetsState);
  return {
    publicContent,
    tournamentConfig,
    opsState,
    scoreSheets: scoreSheetsState.sheets.map(summariseScoreSheet),
    compliance: buildComplianceCollection(publicContent.teams, opsState.complianceByTeam ?? {}),
    aggregates,
  };
}

function buildCalculatorBootstrap(publicContent, opsState, scoreSheetsState) {
  return {
    tournamentConfig,
    teams: publicContent.teams,
    matches: publicContent.matches,
    scoreSheets: scoreSheetsState.sheets.map(summariseScoreSheet),
    compliance: buildComplianceCollection(publicContent.teams, opsState.complianceByTeam ?? {}),
    aggregates: buildAllTeamAggregates(publicContent, opsState, scoreSheetsState),
  };
}

await ensureStoresReady();

const server = http.createServer(async (request, response) => {
  if (!request.url || !request.method) {
    sendError(response, 400, "缺少请求信息。");
    return;
  }

  if (request.method === "OPTIONS") {
    sendNoContent(response);
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host ?? "127.0.0.1"}`);

  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        service: "ark-tournament-backend",
        time: new Date().toISOString(),
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/public/bootstrap") {
      const { publicContent } = await readSystemState();
      sendJson(response, 200, publicContent);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/public/rule-config") {
      sendJson(response, 200, tournamentConfig);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/admin/ops/bootstrap") {
      const { publicContent, opsState, scoreSheetsState } = await readSystemState();
      sendJson(response, 200, buildAdminBootstrap(publicContent, opsState, scoreSheetsState));
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/admin/calculator/bootstrap") {
      const { publicContent, opsState, scoreSheetsState } = await readSystemState();
      sendJson(response, 200, buildCalculatorBootstrap(publicContent, opsState, scoreSheetsState));
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/admin/public-content") {
      const { publicContent } = await readSystemState();
      sendJson(response, 200, publicContent);
      return;
    }

    if (request.method === "PUT" && url.pathname === "/api/admin/public-content") {
      const payload = await readJsonBody(request);
      assertPublicContentShape(payload);
      const nextPublicContent = await publicContentStore.replace(payload);
      const nextOpsState = await opsStateStore.update((state) => syncOpsStateWithTeams(nextPublicContent, state));
      const nextScoreSheetsState = await scoreSheetsStore.update((state) => syncScoreSheetsState(state));
      sendJson(response, 200, buildAdminBootstrap(nextPublicContent, nextOpsState, nextScoreSheetsState));
      return;
    }

    if (request.method === "PATCH" && url.pathname === "/api/admin/live-broadcast") {
      const patch = await readJsonBody(request);
      assertObject(patch, "live-broadcast patch 必须是对象。");
      const nextPublicContent = await publicContentStore.update((current) => {
        Object.assign(current.liveBroadcast, patch);
        return current;
      });
      sendJson(response, 200, nextPublicContent.liveBroadcast);
      return;
    }

    const matchParams = matchPath(url.pathname, "/api/admin/matches/:matchId");
    if (request.method === "PATCH" && matchParams) {
      const patch = await readJsonBody(request);
      assertObject(patch, "match patch 必须是对象。");
      const nextPublicContent = await publicContentStore.update((current) => {
        const match = current.matches.find((entry) => entry.id === matchParams.matchId);
        if (!match) {
          throw new Error(`未找到比赛 ${matchParams.matchId}。`);
        }
        Object.assign(match, patch);
        return current;
      });
      const updatedMatch = nextPublicContent.matches.find((entry) => entry.id === matchParams.matchId);
      sendJson(response, 200, updatedMatch);
      return;
    }

    const complianceParams = matchPath(url.pathname, "/api/admin/teams/:teamId/compliance");
    if (request.method === "GET" && complianceParams) {
      const { publicContent, opsState } = await readSystemState();
      const team = getTeam(publicContent, complianceParams.teamId);
      if (!team) {
        sendError(response, 404, `未找到队伍 ${complianceParams.teamId}。`);
        return;
      }

      const rawCompliance = opsState.complianceByTeam[team.id];
      sendJson(response, 200, {
        team,
        rawCompliance,
        summary: buildTeamComplianceSummary(team, rawCompliance),
      });
      return;
    }

    if (request.method === "PATCH" && complianceParams) {
      const patch = await readJsonBody(request);
      const { publicContent } = await readSystemState();
      const team = getTeam(publicContent, complianceParams.teamId);
      if (!team) {
        sendError(response, 404, `未找到队伍 ${complianceParams.teamId}。`);
        return;
      }

      const nextOpsState = await opsStateStore.update((state) => {
        const compliance = state.complianceByTeam[team.id];
        applyCompliancePatch(team, compliance, patch);
        state.updatedAt = new Date().toISOString();
        return state;
      });

      const rawCompliance = nextOpsState.complianceByTeam[team.id];
      const scoreSheetsState = syncScoreSheetsState(await scoreSheetsStore.read());
      sendJson(response, 200, {
        team,
        rawCompliance,
        summary: buildTeamComplianceSummary(team, rawCompliance),
        aggregate: buildTeamAggregate(team, rawCompliance, scoreSheetsState.sheets.filter((sheet) => sheet.teamId === team.id)),
      });
      return;
    }

    const aggregateParams = matchPath(url.pathname, "/api/admin/teams/:teamId/aggregate");
    if (request.method === "GET" && aggregateParams) {
      const { publicContent, opsState, scoreSheetsState } = await readSystemState();
      const team = getTeam(publicContent, aggregateParams.teamId);
      if (!team) {
        sendError(response, 404, `未找到队伍 ${aggregateParams.teamId}。`);
        return;
      }

      sendJson(response, 200, buildTeamAggregate(team, opsState.complianceByTeam[team.id], scoreSheetsState.sheets.filter((sheet) => sheet.teamId === team.id)));
      return;
    }

    const publishParams = matchPath(url.pathname, "/api/admin/teams/:teamId/publish");
    if (request.method === "POST" && publishParams) {
      const { publicContent, opsState, scoreSheetsState } = await readSystemState();
      const team = getTeam(publicContent, publishParams.teamId);
      if (!team) {
        sendError(response, 404, `未找到队伍 ${publishParams.teamId}。`);
        return;
      }

      const aggregate = buildTeamAggregate(team, opsState.complianceByTeam[team.id], scoreSheetsState.sheets.filter((sheet) => sheet.teamId === team.id));
      if (!aggregate.publishReady) {
        sendError(response, 400, "该队仍有成员成绩未确认，不能发布到官网。", aggregate);
        return;
      }

      const nextScoreSheetsState = await scoreSheetsStore.update((state) => replaceAllSheetsForTeamPublish(state, team.id));
      const nextAggregates = buildAllTeamAggregates(publicContent, opsState, nextScoreSheetsState);
      const nextPublicContent = await publicContentStore.update((current) => applyAggregateToPublicContent(current, nextAggregates));
      const nextAggregate = nextAggregates.find((entry) => entry.teamId === team.id);

      sendJson(response, 200, {
        published: true,
        aggregate: nextAggregate,
        publicContent: nextPublicContent,
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/admin/score-sheets") {
      const { scoreSheetsState } = await readSystemState();
      const filters = {
        teamId: url.searchParams.get("teamId") ?? undefined,
        memberId: url.searchParams.get("memberId") ?? undefined,
        theme: url.searchParams.get("theme") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
      };
      const hasMatchId = url.searchParams.has("matchId");
      const matchId = hasMatchId ? url.searchParams.get("matchId") : undefined;

      if (filters.teamId && filters.memberId && filters.theme) {
        const sheet = findScoreSheet(scoreSheetsState, {
          teamId: filters.teamId,
          memberId: filters.memberId,
          theme: filters.theme,
          matchId,
        });
        sendJson(response, 200, {
          filters: {
            ...filters,
            matchId: matchId ?? null,
          },
          sheet,
        });
        return;
      }

      const sheets = listScoreSheets(scoreSheetsState, filters).map(summariseScoreSheet);
      sendJson(response, 200, {
        filters,
        sheets,
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/admin/score-sheets/upsert") {
      const payload = await readJsonBody(request);
      const { publicContent, opsState } = await readSystemState();
      const team = getTeam(publicContent, payload.teamId);
      if (!team) {
        sendError(response, 404, `未找到队伍 ${payload.teamId}。`);
        return;
      }

      validateScoreSheetPayload(payload, team);
      assertThemeMatchesMember(team, payload.memberId, payload.theme);
      assertMatchExists(publicContent, team.id, payload.matchId ?? null);

      const nextScoreSheetsState = await scoreSheetsStore.update((state) => upsertScoreSheet(state, payload, randomUUID).state);
      const sheet = payload.id
        ? findScoreSheet(nextScoreSheetsState, { id: payload.id })
        : findScoreSheet(nextScoreSheetsState, {
            teamId: payload.teamId,
            memberId: payload.memberId,
            theme: payload.theme,
            matchId: payload.matchId ?? null,
          });
      const aggregate = buildTeamAggregate(team, opsState.complianceByTeam[team.id], nextScoreSheetsState.sheets.filter((entry) => entry.teamId === team.id));

      sendJson(response, 200, {
        sheet,
        aggregate,
      });
      return;
    }

    const scoreSheetStatusParams = matchPath(url.pathname, "/api/admin/score-sheets/:sheetId/status");
    if (request.method === "PATCH" && scoreSheetStatusParams) {
      const payload = await readJsonBody(request);
      const nextScoreSheetsState = await scoreSheetsStore.update((state) => updateScoreSheetStatus(state, scoreSheetStatusParams.sheetId, payload.status).state);
      const sheet = findScoreSheet(nextScoreSheetsState, { id: scoreSheetStatusParams.sheetId });
      if (!sheet) {
        sendError(response, 404, `未找到计分单 ${scoreSheetStatusParams.sheetId}。`);
        return;
      }

      const { publicContent, opsState } = await readSystemState();
      const team = getTeam(publicContent, sheet.teamId);
      if (!team) {
        sendError(response, 404, `未找到队伍 ${sheet.teamId}。`);
        return;
      }

      sendJson(response, 200, {
        sheet,
        aggregate: buildTeamAggregate(team, opsState.complianceByTeam[team.id], nextScoreSheetsState.sheets.filter((entry) => entry.teamId === team.id)),
      });
      return;
    }

    const operatorsParams = matchPath(url.pathname, "/api/admin/teams/:teamId/operators");
    if (request.method === "POST" && operatorsParams) {
      const payload = await readJsonBody(request);
      const { publicContent } = await readSystemState();
      const team = getTeam(publicContent, operatorsParams.teamId);
      if (!team) {
        sendError(response, 404, `未找到队伍 ${operatorsParams.teamId}。`);
        return;
      }

      if (typeof payload.memberId !== "string") {
        throw new Error("memberId 必须是字符串。");
      }
      if (typeof payload.operatorName !== "string" || !payload.operatorName.trim()) {
        throw new Error("operatorName 不能为空。");
      }
      assertMemberExists(team, payload.memberId, "干员抓取记录成员");

      const nextDraft = {
        id: randomUUID(),
        memberId: payload.memberId,
        operatorName: payload.operatorName.trim(),
        rarity: Number(payload.rarity ?? 6),
        isTemporaryRecruit: Boolean(payload.isTemporaryRecruit),
        note: typeof payload.note === "string" ? payload.note : "",
        createdAt: new Date().toISOString(),
      };

      const nextOpsState = await opsStateStore.update((state) => {
        state.complianceByTeam[team.id].operatorDrafts.push(nextDraft);
        state.complianceByTeam[team.id].updatedAt = new Date().toISOString();
        state.updatedAt = new Date().toISOString();
        return state;
      });

      const rawCompliance = nextOpsState.complianceByTeam[team.id];
      sendJson(response, 201, {
        created: nextDraft,
        summary: buildTeamComplianceSummary(team, rawCompliance),
      });
      return;
    }

    const operatorDeleteParams = matchPath(url.pathname, "/api/admin/teams/:teamId/operators/:recordId");
    if (request.method === "DELETE" && operatorDeleteParams) {
      const { publicContent } = await readSystemState();
      const team = getTeam(publicContent, operatorDeleteParams.teamId);
      if (!team) {
        sendError(response, 404, `未找到队伍 ${operatorDeleteParams.teamId}。`);
        return;
      }

      const nextOpsState = await opsStateStore.update((state) => {
        const compliance = state.complianceByTeam[team.id];
        compliance.operatorDrafts = compliance.operatorDrafts.filter((entry) => entry.id !== operatorDeleteParams.recordId);
        compliance.updatedAt = new Date().toISOString();
        state.updatedAt = new Date().toISOString();
        return state;
      });

      const rawCompliance = nextOpsState.complianceByTeam[team.id];
      sendJson(response, 200, {
        deletedId: operatorDeleteParams.recordId,
        summary: buildTeamComplianceSummary(team, rawCompliance),
      });
      return;
    }

    const callsParams = matchPath(url.pathname, "/api/admin/teams/:teamId/calls");
    if (request.method === "POST" && callsParams) {
      const payload = await readJsonBody(request);
      const { publicContent } = await readSystemState();
      const team = getTeam(publicContent, callsParams.teamId);
      if (!team) {
        sendError(response, 404, `未找到队伍 ${callsParams.teamId}。`);
        return;
      }

      if (typeof payload.requestedByMemberId !== "string") {
        throw new Error("requestedByMemberId 必须是字符串。");
      }
      if (typeof payload.targetMemberId !== "string") {
        throw new Error("targetMemberId 必须是字符串。");
      }

      const durationMinutes = Number(payload.durationMinutes);
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new Error("durationMinutes 必须是正数。");
      }

      assertMemberExists(team, payload.requestedByMemberId, "连麦发起成员");
      assertMemberExists(team, payload.targetMemberId, "连麦目标成员");

      const nextCall = {
        id: randomUUID(),
        requestedByMemberId: payload.requestedByMemberId,
        targetMemberId: payload.targetMemberId,
        durationMinutes,
        note: typeof payload.note === "string" ? payload.note : "",
        createdAt: new Date().toISOString(),
      };

      const nextOpsState = await opsStateStore.update((state) => {
        state.complianceByTeam[team.id].coachCalls.push(nextCall);
        state.complianceByTeam[team.id].updatedAt = new Date().toISOString();
        state.updatedAt = new Date().toISOString();
        return state;
      });

      const rawCompliance = nextOpsState.complianceByTeam[team.id];
      sendJson(response, 201, {
        created: nextCall,
        summary: buildTeamComplianceSummary(team, rawCompliance),
      });
      return;
    }

    const callDeleteParams = matchPath(url.pathname, "/api/admin/teams/:teamId/calls/:recordId");
    if (request.method === "DELETE" && callDeleteParams) {
      const { publicContent } = await readSystemState();
      const team = getTeam(publicContent, callDeleteParams.teamId);
      if (!team) {
        sendError(response, 404, `未找到队伍 ${callDeleteParams.teamId}。`);
        return;
      }

      const nextOpsState = await opsStateStore.update((state) => {
        const compliance = state.complianceByTeam[team.id];
        compliance.coachCalls = compliance.coachCalls.filter((entry) => entry.id !== callDeleteParams.recordId);
        compliance.updatedAt = new Date().toISOString();
        state.updatedAt = new Date().toISOString();
        return state;
      });

      const rawCompliance = nextOpsState.complianceByTeam[team.id];
      sendJson(response, 200, {
        deletedId: callDeleteParams.recordId,
        summary: buildTeamComplianceSummary(team, rawCompliance),
      });
      return;
    }

    sendError(response, 404, `未找到路由 ${request.method} ${url.pathname}。`);
  } catch (error) {
    sendError(response, 400, error instanceof Error ? error.message : "请求处理失败", error);
  }
});

const port = Number(process.env.API_PORT ?? 8787);
const host = process.env.API_HOST ?? "127.0.0.1";

server.listen(port, host, () => {
  console.log(`Ark backend listening on http://${host}:${port}`);
});
