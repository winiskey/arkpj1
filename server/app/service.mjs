import { randomUUID } from "node:crypto";
import {
  areSarkazLaneAssignmentsConfigured,
  applyAggregateToPublicContent,
  assertMatchBelongsToTeam,
  assertThemeMatchesMember,
  buildAdminBootstrap,
  buildAllTeamAggregates,
  buildCalculatorBootstrap,
  buildTeamAggregate,
  buildTeamComplianceSummary,
  createDefaultFinalsConfig,
  createEmptyPublicContent,
  deleteScoreSheet,
  findMember,
  findTeam,
  findScoreSheet,
  getScoreSheetIdentityKey,
  isFinalsTeam,
  isFinalsTrackConfigured,
  listScoreSheets,
  normalizeFinalsConfig,
  normalizeOperatorName,
  nowIso,
  replaceAllSheetsForTeamPublish,
  resolveFinalsTrackForMember,
  syncOpsStateWithTeams,
  syncScoreSheetsState,
  tournamentConfig,
  updateScoreSheetStatus,
  upsertScoreSheet,
  validateScoreSheetPayload,
} from "./domain.mjs";
import { HttpError } from "./http.mjs";
import { replaceJsonFilesAtomic } from "./json-file-store.mjs";
import { isPlaceholderPublicContent, readPublicContentSeed } from "./public-content-seed.mjs";
import { calculateThemeScore } from "./scoring.mjs";
import { validateFinalsConfigPayload } from "./validators.mjs";

function requireTeam(publicContent, teamId) {
  const team = findTeam(publicContent, teamId);
  if (!team) {
    throw new HttpError(404, `Team ${teamId} was not found.`);
  }

  return team;
}

function requireMember(team, memberId, label = "member") {
  const member = findMember(team, memberId);
  if (!member) {
    throw new HttpError(400, `${label} ${memberId} does not exist on team ${team.name}.`);
  }

  return member;
}

function applyCompliancePatch(team, compliance, patch) {
  if ("pressureMemberId" in patch) {
    if (patch.pressureMemberId !== null) {
      requireMember(team, patch.pressureMemberId, "pressure member");
    }
    compliance.pressureMemberId = patch.pressureMemberId;
  }

  if ("openingIngots" in patch) {
    compliance.openingIngots = patch.openingIngots;
  }

  if ("currentIngots" in patch) {
    compliance.currentIngots = patch.currentIngots;
  }

  if ("overtimeMinutes" in patch) {
    compliance.overtimeMinutes = patch.overtimeMinutes;
  }

  if ("notes" in patch) {
    compliance.notes = patch.notes;
  }

  compliance.updatedAt = nowIso();
}

const FINALS_TRACK_LABELS = Object.freeze({
  sami: "萨米",
  sarkaz_chou: "萨卡兹·死仇",
  sarkaz_meiyuan: "萨卡兹·美愿",
  sui: "界园",
});

function asPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function stringList(value) {
  return Array.isArray(value)
    ? value.filter((entry) => typeof entry === "string" && entry.trim()).map((entry) => entry.trim())
    : [];
}

function uniqueOperatorNames(list) {
  const seen = new Set();
  const next = [];

  for (const operatorName of list) {
    const normalizedName = normalizeOperatorName(operatorName);
    if (!normalizedName || seen.has(normalizedName)) {
      continue;
    }
    seen.add(normalizedName);
    next.push(operatorName.trim());
  }

  return next;
}

function getPayloadScoreSheetIdentity(payload) {
  return getScoreSheetIdentityKey({
    teamId: payload.teamId,
    memberId: payload.memberId,
    theme: payload.theme,
    matchId: payload.matchId ?? null,
  });
}

function applyValidatedMatchPatch(match, patch) {
  const nextMatch = structuredClone(match);

  if ("phase" in patch) {
    nextMatch.phase = patch.phase;
  }
  if ("startTime" in patch) {
    nextMatch.startTime = patch.startTime;
  }
  if ("status" in patch) {
    nextMatch.status = patch.status;
  }
  if ("totalScore" in patch) {
    nextMatch.totalScore = patch.totalScore;
  }
  if ("note" in patch) {
    nextMatch.note = patch.note;
  }

  if ("currentMemberId" in patch) {
    if (patch.currentMemberId == null) {
      nextMatch.currentMemberId = null;
      nextMatch.currentMemberName = null;
    } else {
      const member = Array.isArray(nextMatch.members)
        ? nextMatch.members.find((entry) => entry.id === patch.currentMemberId)
        : null;
      if (!member) {
        throw new HttpError(400, `Match member ${patch.currentMemberId} does not exist on match ${match.id}.`);
      }

      nextMatch.currentMemberId = member.id;
      nextMatch.currentMemberName = member.name;
    }
  }

  return nextMatch;
}

function buildFinalsValidation({
  publicContent,
  opsState,
  team,
  member,
  theme,
  snapshot,
}) {
  const input = asPlainObject(snapshot);
  const finalsEnabled = Boolean(input["finals-enabled"]);
  const finalsConfig = normalizeFinalsConfig(publicContent, opsState?.finalsConfig ?? createDefaultFinalsConfig(publicContent));
  const isFinalistTeam = isFinalsTeam(finalsConfig, team.id);

  const base = {
    enabled: finalsEnabled,
    pickEnabled: false,
    configured: true,
    trackCode: null,
    trackLabel: null,
    firstPickTeamId: null,
    ownPicks: [],
    opponentPicks: [],
    activeOperators: uniqueOperatorNames(stringList(input["finals-active-operators"])),
    outsidePoolOperators: [],
    opponentPickedOperators: [],
    suggestedPenalty: 0,
    messages: [],
  };

  if (!finalsEnabled || !finalsConfig.enabled || !isFinalistTeam) {
    return base;
  }

  if (theme === "sui") {
    return {
      ...base,
      enabled: true,
      messages: ["界园赛道不参与决赛 Pick / BP 校验。"],
    };
  }

  const trackCode = resolveFinalsTrackForMember(finalsConfig, team, member);
  if (!trackCode) {
    return {
      ...base,
      enabled: true,
      pickEnabled: true,
      configured: false,
      messages: ["当前萨卡兹选手尚未绑定死仇 / 美愿赛道。"],
    };
  }

  const track = finalsConfig.tracks?.[trackCode];
  if (!track?.enabled) {
    return {
      ...base,
      enabled: true,
      trackCode,
      trackLabel: FINALS_TRACK_LABELS[trackCode] ?? trackCode,
      messages: ["当前赛道未启用决赛 Pick 规则。"],
    };
  }

  const opponentTeamId = finalsConfig.teamAId === team.id ? finalsConfig.teamBId : finalsConfig.teamAId;
  const ownPicks = (track.picksByTeamId?.[team.id] ?? []).map((entry) => entry.operatorName);
  const opponentPicks = opponentTeamId ? (track.picksByTeamId?.[opponentTeamId] ?? []).map((entry) => entry.operatorName) : [];
  const trackConfigured = isFinalsTrackConfigured(finalsConfig, trackCode);
  const laneAssignmentsConfigured = theme !== "sarkaz" || areSarkazLaneAssignmentsConfigured(publicContent, finalsConfig);
  const configured = trackConfigured && laneAssignmentsConfigured;

  const ownPickSet = new Set(ownPicks.map((entry) => normalizeOperatorName(entry)));
  const opponentPickSet = new Set(opponentPicks.map((entry) => normalizeOperatorName(entry)));
  const outsidePoolOperators = [];
  const opponentPickedOperators = [];

  for (const operatorName of base.activeOperators) {
    const normalizedName = normalizeOperatorName(operatorName);
    if (!ownPickSet.has(normalizedName)) {
      outsidePoolOperators.push(operatorName);
    }
    if (opponentPickSet.has(normalizedName)) {
      opponentPickedOperators.push(operatorName);
    }
  }

  const opponentPickedSet = new Set(opponentPickedOperators.map((entry) => normalizeOperatorName(entry)));
  const outsideOnlyOperators = outsidePoolOperators.filter((entry) => !opponentPickedSet.has(normalizeOperatorName(entry)));
  const messages = [];

  if (!configured) {
    messages.push(`决赛赛道 ${FINALS_TRACK_LABELS[trackCode] ?? trackCode} 的 Pick 配置未完成。`);
  }
  if (outsideOnlyOperators.length > 0) {
    messages.push(`存在池外干员：${outsideOnlyOperators.join("、")}。建议轻罚 -${outsideOnlyOperators.length * 100}。`);
  }
  if (opponentPickedOperators.length > 0) {
    messages.push(`存在使用对方 Pick 干员：${opponentPickedOperators.join("、")}。建议重罚 -${opponentPickedOperators.length * 500}。`);
  }

  return {
    ...base,
    enabled: true,
    pickEnabled: true,
    configured,
    trackCode,
    trackLabel: FINALS_TRACK_LABELS[trackCode] ?? trackCode,
    firstPickTeamId: track.firstPickTeamId ?? null,
    ownPicks,
    opponentPicks,
    outsidePoolOperators,
    opponentPickedOperators,
    suggestedPenalty: outsideOnlyOperators.length * 100 + opponentPickedOperators.length * 500,
    messages,
  };
}

export function createBackendService({ publicContentStore, opsStateStore, scoreSheetsStore, broadcast = () => { } }) {
  let queue = Promise.resolve();

  function runSerialized(task) {
    const run = queue.then(task, task);
    queue = run.then(() => undefined, () => undefined);
    return run;
  }

  async function ensureSeededPublicContent() {
    const publicContent = await publicContentStore.read();
    if (!isPlaceholderPublicContent(publicContent)) {
      return publicContent;
    }

    const seedPublicContent = await readPublicContentSeed();
    return publicContentStore.replace(seedPublicContent);
  }

  async function readSystemState() {
    const publicContent = await ensureSeededPublicContent();
    const [rawOpsState, rawScoreSheets] = await Promise.all([
      opsStateStore.read(),
      scoreSheetsStore.read(),
    ]);

    return {
      publicContent,
      opsState: syncOpsStateWithTeams(publicContent, rawOpsState),
      scoreSheetsState: syncScoreSheetsState(rawScoreSheets, publicContent),
    };
  }

  async function commitSystemState({
    publicContent,
    opsState,
    scoreSheetsState,
  }) {
    const nextStateByKey = {
      publicContent,
      opsState,
      scoreSheetsState,
    };

    const entries = [];
    if (publicContent !== undefined) {
      entries.push({ filePath: publicContentStore.path, value: publicContent, store: publicContentStore });
    }
    if (opsState !== undefined) {
      entries.push({ filePath: opsStateStore.path, value: opsState, store: opsStateStore });
    }
    if (scoreSheetsState !== undefined) {
      entries.push({ filePath: scoreSheetsStore.path, value: scoreSheetsState, store: scoreSheetsStore });
    }

    const canCommitAtomically = entries.length > 1 && entries.every((entry) => typeof entry.filePath === "string" && entry.filePath);
    if (canCommitAtomically) {
      await replaceJsonFilesAtomic(entries.map(({ filePath, value }) => ({ filePath, value })));
      return {
        publicContent: publicContent === undefined ? undefined : structuredClone(publicContent),
        opsState: opsState === undefined ? undefined : structuredClone(opsState),
        scoreSheetsState: scoreSheetsState === undefined ? undefined : structuredClone(scoreSheetsState),
      };
    }

    for (const entry of entries) {
      await entry.store.replace(entry.value);
    }

    return {
      publicContent: nextStateByKey.publicContent === undefined ? undefined : structuredClone(nextStateByKey.publicContent),
      opsState: nextStateByKey.opsState === undefined ? undefined : structuredClone(nextStateByKey.opsState),
      scoreSheetsState: nextStateByKey.scoreSheetsState === undefined ? undefined : structuredClone(nextStateByKey.scoreSheetsState),
    };
  }

  return {
    async ensureReady() {
      await runSerialized(async () => {
        await readSystemState();
      });
    },

    async getPublicBootstrap() {
      return runSerialized(async () => ensureSeededPublicContent());
    },

    async getAdminBootstrap() {
      return runSerialized(async () => {
        const { publicContent, opsState, scoreSheetsState } = await readSystemState();
        return buildAdminBootstrap(publicContent, opsState, scoreSheetsState);
      });
    },

    async getCalculatorBootstrap() {
      return runSerialized(async () => {
        const { publicContent, opsState, scoreSheetsState } = await readSystemState();
        return buildCalculatorBootstrap(publicContent, opsState, scoreSheetsState);
      });
    },

    async getPublicContent() {
      return runSerialized(async () => ensureSeededPublicContent());
    },

    async getFinalsConfig() {
      return runSerialized(async () => {
        const { publicContent, opsState } = await readSystemState();
        return normalizeFinalsConfig(publicContent, opsState.finalsConfig);
      });
    },

    async replaceFinalsConfig(payload) {
      return runSerialized(async () => {
        const publicContent = await ensureSeededPublicContent();
        const nextFinalsConfig = {
          ...validateFinalsConfigPayload(payload, publicContent),
          updatedAt: nowIso(),
        };

        const nextOpsState = await opsStateStore.update((state) => {
          const next = syncOpsStateWithTeams(publicContent, state);
          next.finalsConfig = normalizeFinalsConfig(publicContent, nextFinalsConfig);
          next.updatedAt = next.finalsConfig.updatedAt;
          return next;
        });

        return nextOpsState.finalsConfig;
      });
    },

    async calculateSoloScore({ teamId, memberId, theme, snapshot }) {
      return runSerialized(async () => {
        const payloadSnapshot = asPlainObject(snapshot);
        const scoreResult = calculateThemeScore(theme, payloadSnapshot);

        if (!teamId || !memberId || theme === "team") {
          return scoreResult;
        }

        const { publicContent, opsState } = await readSystemState();
        const team = requireTeam(publicContent, teamId);
        const member = requireMember(team, memberId, "score calculator member");
        const finalsValidation = buildFinalsValidation({
          publicContent,
          opsState,
          team,
          member,
          theme,
          snapshot: payloadSnapshot,
        });

        return {
          ...scoreResult,
          finalsValidation,
        };
      });
    },

    async replacePublicContent(nextPublicContent) {
      return runSerialized(async () => {
        const { opsState, scoreSheetsState } = await readSystemState();
        const savedPublicContent = structuredClone(nextPublicContent);
        const nextOpsState = syncOpsStateWithTeams(savedPublicContent, opsState);
        const nextScoreSheetsState = syncScoreSheetsState(scoreSheetsState, savedPublicContent);

        await commitSystemState({
          publicContent: savedPublicContent,
          opsState: nextOpsState,
          scoreSheetsState: nextScoreSheetsState,
        });

        broadcast("team:updated", { publicContent: savedPublicContent });
        return buildAdminBootstrap(savedPublicContent, nextOpsState, nextScoreSheetsState);
      });
    },

    async patchLiveBroadcast(patch) {
      return runSerialized(async () => {
        const nextPublicContent = await publicContentStore.update((current) => {
          const next = structuredClone(current ?? createEmptyPublicContent());
          next.liveBroadcast ??= createEmptyPublicContent().liveBroadcast;
          Object.assign(next.liveBroadcast, patch);
          return next;
        });

        broadcast("live:updated", nextPublicContent.liveBroadcast);
        return nextPublicContent.liveBroadcast;
      });
    },

    async patchMatch(matchId, patch) {
      return runSerialized(async () => {
        const nextPublicContent = await publicContentStore.update((current) => {
          const next = structuredClone(current ?? createEmptyPublicContent());
          next.matches ??= [];

          const matchIndex = next.matches.findIndex((entry) => entry.id === matchId);
          if (matchIndex === -1) {
            throw new HttpError(404, `Match ${matchId} was not found.`);
          }

          next.matches[matchIndex] = applyValidatedMatchPatch(next.matches[matchIndex], patch);
          return next;
        });

        const updatedMatch = nextPublicContent.matches.find((entry) => entry.id === matchId) ?? null;
        broadcast("match:updated", updatedMatch);
        return updatedMatch;
      });
    },

    async getTeamCompliance(teamId) {
      return runSerialized(async () => {
        const { publicContent, opsState } = await readSystemState();
        const team = requireTeam(publicContent, teamId);
        const rawCompliance = opsState.complianceByTeam[team.id];

        return {
          team,
          rawCompliance,
          summary: buildTeamComplianceSummary(team, rawCompliance),
        };
      });
    },

    async patchTeamCompliance(teamId, patch) {
      return runSerialized(async () => {
        const { publicContent, scoreSheetsState } = await readSystemState();
        const team = requireTeam(publicContent, teamId);

        const nextOpsState = await opsStateStore.update((state) => {
          const next = syncOpsStateWithTeams(publicContent, state);
          const compliance = next.complianceByTeam[team.id];
          applyCompliancePatch(team, compliance, patch);
          next.updatedAt = compliance.updatedAt;
          return next;
        });

        const rawCompliance = nextOpsState.complianceByTeam[team.id];

        return {
          team,
          rawCompliance,
          summary: buildTeamComplianceSummary(team, rawCompliance),
          aggregate: buildTeamAggregate(
            team,
            rawCompliance,
            scoreSheetsState.sheets.filter((entry) => entry.teamId === team.id),
          ),
        };
      });
    },

    async getTeamAggregate(teamId) {
      return runSerialized(async () => {
        const { publicContent, opsState, scoreSheetsState } = await readSystemState();
        const team = requireTeam(publicContent, teamId);

        return buildTeamAggregate(
          team,
          opsState.complianceByTeam[team.id],
          scoreSheetsState.sheets.filter((sheet) => sheet.teamId === team.id),
        );
      });
    },

    async publishTeam(teamId) {
      return runSerialized(async () => {
        const { publicContent, opsState, scoreSheetsState } = await readSystemState();
        const team = requireTeam(publicContent, teamId);
        const aggregate = buildTeamAggregate(
          team,
          opsState.complianceByTeam[team.id],
          scoreSheetsState.sheets.filter((sheet) => sheet.teamId === team.id),
        );

        if (!aggregate.publishReady) {
          throw new HttpError(400, "Team is not ready to publish.", aggregate);
        }

        const nextScoreSheetsState = replaceAllSheetsForTeamPublish(scoreSheetsState, team.id, publicContent);
        const nextAggregates = buildAllTeamAggregates(publicContent, opsState, nextScoreSheetsState);
        const nextPublicContent = applyAggregateToPublicContent(publicContent, nextAggregates);
        const nextAggregate = nextAggregates.find((entry) => entry.teamId === team.id) ?? aggregate;

        await commitSystemState({
          publicContent: nextPublicContent,
          scoreSheetsState: nextScoreSheetsState,
        });

        broadcast("score:updated", { teamId: team.id, aggregate: nextAggregate });
        broadcast("team:updated", { publicContent: nextPublicContent });

        return {
          published: true,
          aggregate: nextAggregate,
          publicContent: nextPublicContent,
        };
      });
    },

    async getScoreSheets(filters) {
      return runSerialized(async () => {
        const { scoreSheetsState } = await readSystemState();

        if (filters.teamId && filters.memberId && filters.theme) {
          const sheetFilters = {
            teamId: filters.teamId,
            memberId: filters.memberId,
            theme: filters.theme,
          };

          if (Object.prototype.hasOwnProperty.call(filters, "matchId")) {
            sheetFilters.matchId = filters.matchId;
          }

          const sheet = findScoreSheet(scoreSheetsState, sheetFilters);

          return {
            filters: {
              ...filters,
              matchId: Object.prototype.hasOwnProperty.call(filters, "matchId")
                ? filters.matchId ?? null
                : null,
            },
            sheet,
          };
        }

        return {
          filters,
          sheets: listScoreSheets(scoreSheetsState, filters).map((sheet) => ({
            id: sheet.id,
            teamId: sheet.teamId,
            memberId: sheet.memberId,
            matchId: sheet.matchId ?? null,
            theme: sheet.theme,
            status: sheet.status,
            previewScore: sheet.previewScore,
            formulaText: sheet.formulaText,
            updatedAt: sheet.updatedAt,
          })),
        };
      });
    },

    async upsertScoreSheet(payload) {
      return runSerialized(async () => {
        const { publicContent, opsState, scoreSheetsState } = await readSystemState();
        const team = requireTeam(publicContent, payload.teamId);
        const member = requireMember(team, payload.memberId, "score sheet member");

        validateScoreSheetPayload(payload, team);
        assertThemeMatchesMember(team, payload.memberId, payload.theme);
        assertMatchBelongsToTeam(publicContent, team.id, payload.matchId ?? null);

        if (payload.id) {
          const existingById = findScoreSheet(scoreSheetsState, { id: payload.id });
          if (existingById && getScoreSheetIdentityKey(existingById) !== getPayloadScoreSheetIdentity(payload)) {
            throw new HttpError(409, "scoreSheet id does not match the requested team/member/theme/match identity.");
          }
        }

        const finalsValidation = buildFinalsValidation({
          publicContent,
          opsState,
          team,
          member,
          theme: payload.theme,
          snapshot: payload.snapshot,
        });

        if (payload.status === "final" && finalsValidation.enabled && finalsValidation.pickEnabled && !finalsValidation.configured) {
          throw new HttpError(
            400,
            finalsValidation.messages[0] ?? "当前决赛 Pick 配置未完成，无法锁定成绩单。",
            { finalsValidation },
          );
        }

        const computedScore = calculateThemeScore(payload.theme, payload.snapshot);
        const nextPayload = {
          ...payload,
          previewScore: computedScore.previewScore,
          formulaText: computedScore.formulaText,
        };

        const nextScoreSheetsState = await scoreSheetsStore.update((state) =>
          upsertScoreSheet(state, nextPayload, randomUUID).state,
        );

        const sheet = nextPayload.id
          ? findScoreSheet(nextScoreSheetsState, { id: nextPayload.id })
          : findScoreSheet(nextScoreSheetsState, {
            teamId: nextPayload.teamId,
            memberId: nextPayload.memberId,
            theme: nextPayload.theme,
            matchId: nextPayload.matchId ?? null,
          });

        const result = {
          sheet,
          aggregate: buildTeamAggregate(
            team,
            opsState.complianceByTeam[team.id],
            nextScoreSheetsState.sheets.filter((entry) => entry.teamId === team.id),
          ),
          finalsValidation,
        };

        broadcast("score:updated", { teamId: team.id, sheet, aggregate: result.aggregate });
        return result;
      });
    },

    async updateScoreSheetStatus(sheetId, status) {
      return runSerialized(async () => {
        const { publicContent, opsState } = await readSystemState();
        let teamId;
        const nextScoreSheetsState = await scoreSheetsStore.update((state) => {
          const synced = syncScoreSheetsState(state, publicContent);
          const existing = findScoreSheet(synced, { id: sheetId });
          if (!existing) {
            throw new HttpError(404, `Score sheet ${sheetId} was not found.`);
          }
          teamId = existing.teamId;
          return updateScoreSheetStatus(state, sheetId, status, publicContent).state;
        });
        const sheet = findScoreSheet(nextScoreSheetsState, { id: sheetId });
        const team = requireTeam(publicContent, teamId);

        const result = {
          sheet,
          aggregate: buildTeamAggregate(
            team,
            opsState.complianceByTeam[team.id],
            nextScoreSheetsState.sheets.filter((entry) => entry.teamId === team.id),
          ),
        };

        broadcast("score:updated", { teamId: team.id, sheet, aggregate: result.aggregate });
        return result;
      });
    },

    async deleteScoreSheet(sheetId) {
      return runSerialized(async () => {
        const { publicContent, opsState } = await readSystemState();
        let teamId;
        const nextScoreSheetsState = await scoreSheetsStore.update((state) => {
          const synced = syncScoreSheetsState(state, publicContent);
          const existing = findScoreSheet(synced, { id: sheetId });
          if (!existing) {
            throw new HttpError(404, `Score sheet ${sheetId} was not found.`);
          }
          teamId = existing.teamId;
          return deleteScoreSheet(state, sheetId, publicContent).state;
        });

        const team = requireTeam(publicContent, teamId);
        const aggregate = buildTeamAggregate(
          team,
          opsState.complianceByTeam[team.id],
          nextScoreSheetsState.sheets.filter((entry) => entry.teamId === team.id),
        );

        broadcast("score:updated", { teamId: team.id, deletedId: sheetId, aggregate });
        return { deletedId: sheetId, aggregate };
      });
    },

    async createOperatorDraft(teamId, payload) {
      return runSerialized(async () => {
        const publicContent = await ensureSeededPublicContent();
        const team = requireTeam(publicContent, teamId);
        requireMember(team, payload.memberId, "operator draft member");

        const nextDraft = {
          id: randomUUID(),
          memberId: payload.memberId,
          operatorName: payload.operatorName.trim(),
          rarity: payload.rarity,
          isTemporaryRecruit: payload.isTemporaryRecruit,
          note: payload.note,
          createdAt: nowIso(),
        };

        const nextOpsState = await opsStateStore.update((state) => {
          const next = syncOpsStateWithTeams(publicContent, state);
          const memberSixStarCount = next.complianceByTeam[team.id].operatorDrafts.filter(
            (entry) => entry.memberId === payload.memberId && entry.rarity === 6,
          ).length;
          if (payload.rarity === 6 && memberSixStarCount >= tournamentConfig.operatorDrafts.maxSixStarsPerMember) {
            throw new HttpError(
              400,
              `Member ${payload.memberId} already reached the ${tournamentConfig.operatorDrafts.maxSixStarsPerMember} six-star operator limit.`,
            );
          }
          next.complianceByTeam[team.id].operatorDrafts.push(nextDraft);
          next.complianceByTeam[team.id].updatedAt = nowIso();
          next.updatedAt = next.complianceByTeam[team.id].updatedAt;
          return next;
        });

        const rawCompliance = nextOpsState.complianceByTeam[team.id];
        return {
          created: nextDraft,
          summary: buildTeamComplianceSummary(team, rawCompliance),
        };
      });
    },

    async createPlannedPick(teamId, memberId, payload) {
      return runSerialized(async () => {
        const nextPick = {
          id: randomUUID(),
          operatorName: payload.operatorName.trim(),
          rarity: payload.rarity,
          createdAt: nowIso(),
        };

        const nextPublicContent = await publicContentStore.update((current) => {
          const next = structuredClone(current ?? createEmptyPublicContent());
          const team = requireTeam(next, teamId);
          const member = requireMember(team, memberId, "planned pick member");
          const existingPicks = Array.isArray(member.operatorPicks) ? member.operatorPicks : [];

          if (existingPicks.some((entry) => normalizeOperatorName(entry.operatorName) === normalizeOperatorName(nextPick.operatorName))) {
            throw new HttpError(400, `Member ${memberId} already planned ${nextPick.operatorName}.`);
          }

          const sixStarCount = existingPicks.filter((entry) => Number(entry.rarity) === 6).length;
          if (nextPick.rarity === 6 && sixStarCount >= tournamentConfig.operatorDrafts.maxSixStarsPerMember) {
            throw new HttpError(
              400,
              `Member ${memberId} already reached the ${tournamentConfig.operatorDrafts.maxSixStarsPerMember} planned six-star operator limit.`,
            );
          }

          member.operatorPicks = [...existingPicks, nextPick];
          return next;
        });

        const team = requireTeam(nextPublicContent, teamId);
        const member = requireMember(team, memberId, "planned pick member");

        broadcast("picks:updated", { teamId, memberId, operatorPicks: member.operatorPicks });

        return {
          created: nextPick,
          member,
          team,
        };
      });
    },

    async deletePlannedPick(teamId, memberId, pickId) {
      return runSerialized(async () => {
        const nextPublicContent = await publicContentStore.update((current) => {
          const next = structuredClone(current ?? createEmptyPublicContent());
          const team = requireTeam(next, teamId);
          const member = requireMember(team, memberId, "planned pick member");
          const existingPicks = Array.isArray(member.operatorPicks) ? member.operatorPicks : [];
          member.operatorPicks = existingPicks.filter((entry) => entry.id !== pickId);
          return next;
        });

        const team = requireTeam(nextPublicContent, teamId);
        const member = requireMember(team, memberId, "planned pick member");

        broadcast("picks:updated", { teamId, memberId, operatorPicks: member.operatorPicks });

        return {
          deletedId: pickId,
          member,
          team,
        };
      });
    },

    async deleteOperatorDraft(teamId, recordId) {
      return runSerialized(async () => {
        const publicContent = await ensureSeededPublicContent();
        const team = requireTeam(publicContent, teamId);

        const nextOpsState = await opsStateStore.update((state) => {
          const next = syncOpsStateWithTeams(publicContent, state);
          const compliance = next.complianceByTeam[team.id];
          compliance.operatorDrafts = compliance.operatorDrafts.filter((entry) => entry.id !== recordId);
          compliance.updatedAt = nowIso();
          next.updatedAt = compliance.updatedAt;
          return next;
        });

        const rawCompliance = nextOpsState.complianceByTeam[team.id];
        return {
          deletedId: recordId,
          summary: buildTeamComplianceSummary(team, rawCompliance),
        };
      });
    },

    async createCoachCall(teamId, payload) {
      return runSerialized(async () => {
        const publicContent = await ensureSeededPublicContent();
        const team = requireTeam(publicContent, teamId);
        requireMember(team, payload.requestedByMemberId, "coach call requester");
        requireMember(team, payload.targetMemberId, "coach call target");

        if (payload.durationMinutes > tournamentConfig.coachCalls.maxMinutesPerCall) {
          throw new HttpError(400, "Coach call duration exceeds the per-call rule limit.");
        }

        const nextCall = {
          id: randomUUID(),
          requestedByMemberId: payload.requestedByMemberId,
          targetMemberId: payload.targetMemberId,
          durationMinutes: payload.durationMinutes,
          note: payload.note,
          createdAt: nowIso(),
        };

        const nextOpsState = await opsStateStore.update((state) => {
          const next = syncOpsStateWithTeams(publicContent, state);
          const existingCalls = next.complianceByTeam[team.id].coachCalls ?? [];
          if (existingCalls.length >= tournamentConfig.coachCalls.maxCount) {
            throw new HttpError(400, "Coach call count exceeds the rule limit.");
          }
          next.complianceByTeam[team.id].coachCalls.push(nextCall);
          next.complianceByTeam[team.id].updatedAt = nowIso();
          next.updatedAt = next.complianceByTeam[team.id].updatedAt;
          return next;
        });

        const rawCompliance = nextOpsState.complianceByTeam[team.id];
        return {
          created: nextCall,
          summary: buildTeamComplianceSummary(team, rawCompliance),
        };
      });
    },

    async deleteCoachCall(teamId, recordId) {
      return runSerialized(async () => {
        const publicContent = await ensureSeededPublicContent();
        const team = requireTeam(publicContent, teamId);

        const nextOpsState = await opsStateStore.update((state) => {
          const next = syncOpsStateWithTeams(publicContent, state);
          const compliance = next.complianceByTeam[team.id];
          compliance.coachCalls = compliance.coachCalls.filter((entry) => entry.id !== recordId);
          compliance.updatedAt = nowIso();
          next.updatedAt = compliance.updatedAt;
          return next;
        });

        const rawCompliance = nextOpsState.complianceByTeam[team.id];
        return {
          deletedId: recordId,
          summary: buildTeamComplianceSummary(team, rawCompliance),
        };
      });
    },
  };
}
