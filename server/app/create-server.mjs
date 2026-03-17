import http from "node:http";
import { opsStatePath, publicContentPath, scoreSheetsPath } from "./config.mjs";
import {
  createDefaultOpsState,
  createDefaultScoreSheetsState,
  createEmptyPublicContent,
  ruleVersion,
  tournamentConfig,
} from "./domain.mjs";
import { createRequestContext, handlePreflight, HttpError, Router } from "./http.mjs";
import { createJsonFileStore } from "./json-file-store.mjs";
import { createBackendService } from "./service.mjs";
import {
  expectPlainObject,
  validateCoachCallPayload,
  validateCompliancePatch,
  validateLiveBroadcastPatch,
  validateMatchPatch,
  validateOperatorDraftPayload,
  validatePlannedPickPayload,
  validatePublicContentPayload,
  validateScoreSheetQueryFilters,
  validateScoreSheetStatusPayload,
} from "./validators.mjs";

function withAdmin(handler) {
  return async (context) => {
    context.assertAdminAuth();
    await handler(context);
  };
}

export function createApp(config) {
  const publicContentStore = createJsonFileStore(publicContentPath, async () => createEmptyPublicContent());
  const opsStateStore = createJsonFileStore(
    opsStatePath,
    async () => createDefaultOpsState(await publicContentStore.read()),
  );
  const scoreSheetsStore = createJsonFileStore(
    scoreSheetsPath,
    async () => createDefaultScoreSheetsState(),
  );

  const service = createBackendService({
    publicContentStore,
    opsStateStore,
    scoreSheetsStore,
  });

  const router = new Router();

  router.register("GET", "/api/health", async (context) => {
    context.sendJson(200, {
      ok: true,
      service: "ark-tournament-backend",
      time: new Date().toISOString(),
    });
  });

  router.register("GET", "/api/public/bootstrap", async (context) => {
    context.sendJson(200, await service.getPublicBootstrap());
  });

  router.register("GET", "/api/public/rule-config", async (context) => {
    context.sendJson(200, {
      ruleVersion,
      tournamentConfig,
    });
  });

  router.register("GET", "/api/admin/ops/bootstrap", withAdmin(async (context) => {
    context.sendJson(200, await service.getAdminBootstrap());
  }));

  router.register("GET", "/api/admin/calculator/bootstrap", withAdmin(async (context) => {
    context.sendJson(200, await service.getCalculatorBootstrap());
  }));

  router.register("POST", "/api/admin/calculator/solo", withAdmin(async (context) => {
    const body = expectPlainObject(await context.readJson(), "soloCalcPayload");
    const theme = body.theme;
    const snapshot = body.snapshot;

    if (typeof theme !== "string" || !["team", "sami", "sarkaz", "sui"].includes(theme)) {
      context.sendError(400, `Invalid theme: ${theme}. Must be one of: team, sami, sarkaz, sui.`);
      return;
    }

    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      context.sendError(400, "snapshot must be a plain object.");
      return;
    }

    const { calculateThemeScore } = await import("./scoring.mjs");
    context.sendJson(200, calculateThemeScore(theme, snapshot));
  }));

  router.register("GET", "/api/admin/public-content", withAdmin(async (context) => {
    context.sendJson(200, await service.getPublicContent());
  }));

  router.register("PUT", "/api/admin/public-content", withAdmin(async (context) => {
    const payload = validatePublicContentPayload(await context.readJson());
    context.sendJson(200, await service.replacePublicContent(payload));
  }));

  router.register("PATCH", "/api/admin/live-broadcast", withAdmin(async (context) => {
    const patch = validateLiveBroadcastPatch(await context.readJson());
    context.sendJson(200, await service.patchLiveBroadcast(patch));
  }));

  router.register("PATCH", "/api/admin/matches/:matchId", withAdmin(async (context) => {
    const patch = validateMatchPatch(await context.readJson());
    context.sendJson(200, await service.patchMatch(context.params.matchId, patch));
  }));

  router.register("GET", "/api/admin/teams/:teamId/compliance", withAdmin(async (context) => {
    context.sendJson(200, await service.getTeamCompliance(context.params.teamId));
  }));

  router.register("PATCH", "/api/admin/teams/:teamId/compliance", withAdmin(async (context) => {
    const patch = validateCompliancePatch(await context.readJson());
    context.sendJson(200, await service.patchTeamCompliance(context.params.teamId, patch));
  }));

  router.register("GET", "/api/admin/teams/:teamId/aggregate", withAdmin(async (context) => {
    context.sendJson(200, await service.getTeamAggregate(context.params.teamId));
  }));

  router.register("POST", "/api/admin/teams/:teamId/publish", withAdmin(async (context) => {
    context.sendJson(200, await service.publishTeam(context.params.teamId));
  }));

  router.register("GET", "/api/admin/score-sheets", withAdmin(async (context) => {
    const filtersInput = {
      teamId: context.url.searchParams.get("teamId") ?? undefined,
      memberId: context.url.searchParams.get("memberId") ?? undefined,
      theme: context.url.searchParams.get("theme") ?? undefined,
      status: context.url.searchParams.get("status") ?? undefined,
    };

    if (context.url.searchParams.has("matchId")) {
      filtersInput.matchId = context.url.searchParams.get("matchId");
    }

    const filters = validateScoreSheetQueryFilters(filtersInput);
    context.sendJson(200, await service.getScoreSheets(filters));
  }));

  router.register("POST", "/api/admin/score-sheets/upsert", withAdmin(async (context) => {
    const payload = expectPlainObject(await context.readJson(), "scoreSheet");
    context.sendJson(200, await service.upsertScoreSheet(payload));
  }));

  router.register("PATCH", "/api/admin/score-sheets/:sheetId/status", withAdmin(async (context) => {
    const payload = validateScoreSheetStatusPayload(await context.readJson());
    context.sendJson(200, await service.updateScoreSheetStatus(context.params.sheetId, payload.status));
  }));

  router.register("POST", "/api/admin/teams/:teamId/operators", withAdmin(async (context) => {
    const payload = validateOperatorDraftPayload(await context.readJson());
    context.sendJson(201, await service.createOperatorDraft(context.params.teamId, payload));
  }));

  router.register("POST", "/api/admin/teams/:teamId/members/:memberId/planned-picks", withAdmin(async (context) => {
    const payload = validatePlannedPickPayload(await context.readJson());
    context.sendJson(201, await service.createPlannedPick(context.params.teamId, context.params.memberId, payload));
  }));

  router.register("DELETE", "/api/admin/teams/:teamId/members/:memberId/planned-picks/:pickId", withAdmin(async (context) => {
    context.sendJson(200, await service.deletePlannedPick(context.params.teamId, context.params.memberId, context.params.pickId));
  }));

  router.register("DELETE", "/api/admin/teams/:teamId/operators/:recordId", withAdmin(async (context) => {
    context.sendJson(200, await service.deleteOperatorDraft(context.params.teamId, context.params.recordId));
  }));

  router.register("POST", "/api/admin/teams/:teamId/calls", withAdmin(async (context) => {
    const payload = validateCoachCallPayload(await context.readJson());
    context.sendJson(201, await service.createCoachCall(context.params.teamId, payload));
  }));

  router.register("DELETE", "/api/admin/teams/:teamId/calls/:recordId", withAdmin(async (context) => {
    context.sendJson(200, await service.deleteCoachCall(context.params.teamId, context.params.recordId));
  }));

  const server = http.createServer(async (request, response) => {
    const context = createRequestContext({ request, response, config });

    try {
      if (!request.url || !request.method) {
        throw new HttpError(400, "Missing request metadata.");
      }

      if (handlePreflight(request, response, config)) {
        return;
      }

      const handled = await router.handle(context);
      if (!handled) {
        context.sendError(404, `Route not found: ${request.method} ${context.url.pathname}`);
      }
    } catch (error) {
      if (error instanceof HttpError) {
        context.sendError(error.statusCode, error.message, error.details);
        return;
      }

      console.error("Unhandled backend error", error);
      context.sendError(500, error instanceof Error ? error.message : "Internal server error.");
    }
  });

  return {
    server,
    service,
  };
}
