import { randomUUID } from "node:crypto";
import {
  applyAggregateToPublicContent,
  assertMatchBelongsToTeam,
  assertThemeMatchesMember,
  buildAdminBootstrap,
  buildAllTeamAggregates,
  buildCalculatorBootstrap,
  buildTeamAggregate,
  buildTeamComplianceSummary,
  createEmptyPublicContent,
  findMember,
  findScoreSheet,
  findTeam,
  listScoreSheets,
  replaceAllSheetsForTeamPublish,
  syncOpsStateWithTeams,
  syncScoreSheetsState,
  tournamentConfig,
  updateScoreSheetStatus,
  upsertScoreSheet,
  validateScoreSheetPayload,
} from "./domain.mjs";
import { HttpError } from "./http.mjs";
import { calculateThemeScore } from "./scoring.mjs";

function timestamp() {
  return new Date().toISOString();
}

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

function normalizeOperatorName(value) {
  return String(value ?? "").trim().toLowerCase();
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

  compliance.updatedAt = timestamp();
}

export function createBackendService({ publicContentStore, opsStateStore, scoreSheetsStore }) {
  async function readSystemState() {
    const [publicContent, rawOpsState, rawScoreSheets] = await Promise.all([
      publicContentStore.read(),
      opsStateStore.read(),
      scoreSheetsStore.read(),
    ]);

    return {
      publicContent,
      opsState: syncOpsStateWithTeams(publicContent, rawOpsState),
      scoreSheetsState: syncScoreSheetsState(rawScoreSheets),
    };
  }

  return {
    async ensureReady() {
      await readSystemState();
    },

    async getPublicBootstrap() {
      const { publicContent } = await readSystemState();
      return publicContent;
    },

    async getAdminBootstrap() {
      const { publicContent, opsState, scoreSheetsState } = await readSystemState();
      return buildAdminBootstrap(publicContent, opsState, scoreSheetsState);
    },

    async getCalculatorBootstrap() {
      const { publicContent, opsState, scoreSheetsState } = await readSystemState();
      return buildCalculatorBootstrap(publicContent, opsState, scoreSheetsState);
    },

    async getPublicContent() {
      return publicContentStore.read();
    },

    async replacePublicContent(nextPublicContent) {
      const savedPublicContent = await publicContentStore.replace(nextPublicContent);
      const nextOpsState = await opsStateStore.update((state) => syncOpsStateWithTeams(savedPublicContent, state));
      const nextScoreSheetsState = await scoreSheetsStore.update((state) => syncScoreSheetsState(state));
      return buildAdminBootstrap(savedPublicContent, nextOpsState, nextScoreSheetsState);
    },

    async patchLiveBroadcast(patch) {
      const nextPublicContent = await publicContentStore.update((current) => {
        const next = structuredClone(current ?? createEmptyPublicContent());
        next.liveBroadcast ??= createEmptyPublicContent().liveBroadcast;
        Object.assign(next.liveBroadcast, patch);
        return next;
      });

      return nextPublicContent.liveBroadcast;
    },

    async patchMatch(matchId, patch) {
      const nextPublicContent = await publicContentStore.update((current) => {
        const next = structuredClone(current ?? createEmptyPublicContent());
        next.matches ??= [];

        const match = next.matches.find((entry) => entry.id === matchId);
        if (!match) {
          throw new HttpError(404, `Match ${matchId} was not found.`);
        }

        Object.assign(match, patch);
        return next;
      });

      return nextPublicContent.matches.find((entry) => entry.id === matchId) ?? null;
    },

    async getTeamCompliance(teamId) {
      const { publicContent, opsState } = await readSystemState();
      const team = requireTeam(publicContent, teamId);
      const rawCompliance = opsState.complianceByTeam[team.id];

      return {
        team,
        rawCompliance,
        summary: buildTeamComplianceSummary(team, rawCompliance),
      };
    },

    async patchTeamCompliance(teamId, patch) {
      const publicContent = await publicContentStore.read();
      const team = requireTeam(publicContent, teamId);

      const nextOpsState = await opsStateStore.update((state) => {
        const next = syncOpsStateWithTeams(publicContent, state);
        const compliance = next.complianceByTeam[team.id];
        applyCompliancePatch(team, compliance, patch);
        next.updatedAt = compliance.updatedAt;
        return next;
      });

      const rawCompliance = nextOpsState.complianceByTeam[team.id];
      const scoreSheetsState = syncScoreSheetsState(await scoreSheetsStore.read());

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
    },

    async getTeamAggregate(teamId) {
      const { publicContent, opsState, scoreSheetsState } = await readSystemState();
      const team = requireTeam(publicContent, teamId);

      return buildTeamAggregate(
        team,
        opsState.complianceByTeam[team.id],
        scoreSheetsState.sheets.filter((sheet) => sheet.teamId === team.id),
      );
    },

    async publishTeam(teamId) {
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

      const nextScoreSheetsState = await scoreSheetsStore.update((state) => replaceAllSheetsForTeamPublish(state, team.id));
      const nextAggregates = buildAllTeamAggregates(publicContent, opsState, nextScoreSheetsState);
      const nextPublicContent = await publicContentStore.update((current) =>
        applyAggregateToPublicContent(current, nextAggregates),
      );
      const nextAggregate = nextAggregates.find((entry) => entry.teamId === team.id) ?? aggregate;

      return {
        published: true,
        aggregate: nextAggregate,
        publicContent: nextPublicContent,
      };
    },

    async getScoreSheets(filters) {
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
    },

    async upsertScoreSheet(payload) {
      const { publicContent, opsState } = await readSystemState();
      const team = requireTeam(publicContent, payload.teamId);

      validateScoreSheetPayload(payload, team);
      assertThemeMatchesMember(team, payload.memberId, payload.theme);
      assertMatchBelongsToTeam(publicContent, team.id, payload.matchId ?? null);

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

      return {
        sheet,
        aggregate: buildTeamAggregate(
          team,
          opsState.complianceByTeam[team.id],
          nextScoreSheetsState.sheets.filter((entry) => entry.teamId === team.id),
        ),
      };
    },

    async updateScoreSheetStatus(sheetId, status) {
      const existingState = syncScoreSheetsState(await scoreSheetsStore.read());
      const existingSheet = findScoreSheet(existingState, { id: sheetId });
      if (!existingSheet) {
        throw new HttpError(404, `Score sheet ${sheetId} was not found.`);
      }

      const nextScoreSheetsState = await scoreSheetsStore.update((state) =>
        updateScoreSheetStatus(state, sheetId, status).state,
      );
      const sheet = findScoreSheet(nextScoreSheetsState, { id: sheetId });

      const { publicContent, opsState } = await readSystemState();
      const team = requireTeam(publicContent, existingSheet.teamId);

      return {
        sheet,
        aggregate: buildTeamAggregate(
          team,
          opsState.complianceByTeam[team.id],
          nextScoreSheetsState.sheets.filter((entry) => entry.teamId === team.id),
        ),
      };
    },

    async createOperatorDraft(teamId, payload) {
      const publicContent = await publicContentStore.read();
      const team = requireTeam(publicContent, teamId);
      requireMember(team, payload.memberId, "operator draft member");

      const nextDraft = {
        id: randomUUID(),
        memberId: payload.memberId,
        operatorName: payload.operatorName.trim(),
        rarity: payload.rarity,
        isTemporaryRecruit: payload.isTemporaryRecruit,
        note: payload.note,
        createdAt: timestamp(),
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
        next.complianceByTeam[team.id].updatedAt = timestamp();
        next.updatedAt = next.complianceByTeam[team.id].updatedAt;
        return next;
      });

      const rawCompliance = nextOpsState.complianceByTeam[team.id];
      return {
        created: nextDraft,
        summary: buildTeamComplianceSummary(team, rawCompliance),
      };
    },

    async createPlannedPick(teamId, memberId, payload) {
      const nextPick = {
        id: randomUUID(),
        operatorName: payload.operatorName.trim(),
        rarity: payload.rarity,
        createdAt: timestamp(),
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

      return {
        created: nextPick,
        member,
        team,
      };
    },

    async deletePlannedPick(teamId, memberId, pickId) {
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

      return {
        deletedId: pickId,
        member,
        team,
      };
    },

    async deleteOperatorDraft(teamId, recordId) {
      const publicContent = await publicContentStore.read();
      const team = requireTeam(publicContent, teamId);

      const nextOpsState = await opsStateStore.update((state) => {
        const next = syncOpsStateWithTeams(publicContent, state);
        const compliance = next.complianceByTeam[team.id];
        compliance.operatorDrafts = compliance.operatorDrafts.filter((entry) => entry.id !== recordId);
        compliance.updatedAt = timestamp();
        next.updatedAt = compliance.updatedAt;
        return next;
      });

      const rawCompliance = nextOpsState.complianceByTeam[team.id];
      return {
        deletedId: recordId,
        summary: buildTeamComplianceSummary(team, rawCompliance),
      };
    },

    async createCoachCall(teamId, payload) {
      const publicContent = await publicContentStore.read();
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
        createdAt: timestamp(),
      };

      const nextOpsState = await opsStateStore.update((state) => {
        const next = syncOpsStateWithTeams(publicContent, state);
        const existingCalls = next.complianceByTeam[team.id].coachCalls ?? [];
        if (existingCalls.length >= tournamentConfig.coachCalls.maxCount) {
          throw new HttpError(400, "Coach call count exceeds the rule limit.");
        }
        next.complianceByTeam[team.id].coachCalls.push(nextCall);
        next.complianceByTeam[team.id].updatedAt = timestamp();
        next.updatedAt = next.complianceByTeam[team.id].updatedAt;
        return next;
      });

      const rawCompliance = nextOpsState.complianceByTeam[team.id];
      return {
        created: nextCall,
        summary: buildTeamComplianceSummary(team, rawCompliance),
      };
    },

    async deleteCoachCall(teamId, recordId) {
      const publicContent = await publicContentStore.read();
      const team = requireTeam(publicContent, teamId);

      const nextOpsState = await opsStateStore.update((state) => {
        const next = syncOpsStateWithTeams(publicContent, state);
        const compliance = next.complianceByTeam[team.id];
        compliance.coachCalls = compliance.coachCalls.filter((entry) => entry.id !== recordId);
        compliance.updatedAt = timestamp();
        next.updatedAt = compliance.updatedAt;
        return next;
      });

      const rawCompliance = nextOpsState.complianceByTeam[team.id];
      return {
        deletedId: recordId,
        summary: buildTeamComplianceSummary(team, rawCompliance),
      };
    },
  };
}
