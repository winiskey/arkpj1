import test from "node:test";
import assert from "node:assert/strict";
import { createBackendService } from "./service.mjs";
import {
  createEmptyPublicContent,
  createDefaultOpsState,
  createDefaultScoreSheetsState,
  buildTeamAggregate,
  tournamentConfig,
} from "./domain.mjs";

function createMemoryStore(initialValue) {
  let state = structuredClone(initialValue);
  return {
    async read() {
      return structuredClone(state);
    },
    async replace(nextValue) {
      state = structuredClone(nextValue);
      return structuredClone(state);
    },
    async update(mutator) {
      state = structuredClone(await mutator(structuredClone(state)));
      return structuredClone(state);
    },
  };
}

function createTeam({ memberCount = 4 } = {}) {
  const members = [
    { id: "m1", name: "A", role: "P1", theme: "探索者的银淞止境" },
    { id: "m2", name: "B", role: "P2", theme: "萨卡兹的无终奇语" },
    { id: "m3", name: "C", role: "P3", theme: "岁的界园志异" },
    { id: "m4", name: "D", role: "P4", theme: "探索者的银淞止境" },
  ].slice(0, memberCount);

  return {
    id: "team-1",
    name: "Alpha",
    tag: "ALP",
    rank: 1,
    totalScore: "0",
    members,
  };
}

function createFinalistTeam(id, name) {
  return {
    id,
    name,
    tag: name.slice(0, 3).toUpperCase(),
    rank: 1,
    totalScore: "0",
    members: [
      { id: `${id}-sami`, name: `${name}-萨米`, role: "P1", theme: "探索者的银凇止境" },
      { id: `${id}-chou`, name: `${name}-死仇`, role: "P2", theme: "萨卡兹的无终奇语" },
      { id: `${id}-meiyuan`, name: `${name}-美愿`, role: "P3", theme: "萨卡兹的无终奇语" },
      { id: `${id}-sui`, name: `${name}-界园`, role: "P4", theme: "岁的界园志异" },
    ],
  };
}

function createPublicContent(team) {
  const publicContent = createEmptyPublicContent();
  publicContent.teams = [team];
  publicContent.leaderboard = [];
  publicContent.matches = [];
  return publicContent;
}

function createScoreSheet(memberId, theme, previewScore = 100, status = "final", matchId = null, overrides = {}) {
  return {
    id: `${memberId}-${theme}`,
    teamId: "team-1",
    memberId,
    matchId,
    theme,
    snapshot: {},
    previewScore,
    formulaText: `${previewScore}`,
    note: "",
    status,
    calculatorVersion: "jingchuge-html-v1",
    createdAt: "2026-03-12T00:00:00.000Z",
    updatedAt: "2026-03-12T00:00:00.000Z",
    ...overrides,
  };
}

function createServiceWithStores({ team = createTeam(), compliance = {}, sheets = [] } = {}) {
  const publicContent = createPublicContent(team);
  const opsState = createDefaultOpsState(publicContent);
  opsState.complianceByTeam[team.id] = {
    ...opsState.complianceByTeam[team.id],
    ...structuredClone(compliance),
  };
  const scoreSheetsState = createDefaultScoreSheetsState();
  scoreSheetsState.sheets = structuredClone(sheets);

  const publicContentStore = createMemoryStore(publicContent);
  const opsStateStore = createMemoryStore(opsState);
  const scoreSheetsStore = createMemoryStore(scoreSheetsState);

  return {
    publicContentStore,
    opsStateStore,
    scoreSheetsStore,
    service: createBackendService({ publicContentStore, opsStateStore, scoreSheetsStore }),
  };
}

test("buildTeamAggregate applies pressure bonus before the team coefficient", () => {
  const team = createTeam();
  const aggregate = buildTeamAggregate(team, {
    pressureMemberId: "m1",
    openingIngots: 500,
    currentIngots: 250,
    overtimeMinutes: 40,
    operatorDrafts: [
      { memberId: "m1", operatorName: "能天使", rarity: 6, isTemporaryRecruit: false },
      { memberId: "m2", operatorName: "能天使", rarity: 6, isTemporaryRecruit: false },
    ],
    coachCalls: [],
  }, [
    createScoreSheet("m1", "sami"),
    createScoreSheet("m2", "sarkaz"),
    createScoreSheet("m3", "sui"),
    createScoreSheet("m4", "sami"),
  ]);

  assert.equal(aggregate.rawTotal, 400);
  assert.equal(aggregate.pressureBonus, 20);
  assert.equal(aggregate.preCoefficientTotal, 420);
  assert.equal(aggregate.coefficient, 0.3);
  assert.equal(aggregate.finalTotal, 126);
  assert.equal(aggregate.teamTotal, 126);
  assert.equal(aggregate.coefficientBreakdown.overtime.steps, 2);
  assert.equal(aggregate.coefficientBreakdown.duplicateSixStars.duplicateCount, 1);
  assert.equal(aggregate.coefficientBreakdown.extraShopSpend.excess, 50);
});

test("upsertScoreSheet ignores tampered client totals and recalculates from snapshot", async () => {
  const { service, scoreSheetsStore } = createServiceWithStores({
    compliance: { pressureMemberId: "m1" },
  });

  const result = await service.upsertScoreSheet({
    teamId: "team-1",
    memberId: "m1",
    matchId: null,
    theme: "sami",
    snapshot: {
      "sa-score": 100,
      "sa-stage-breath": true,
      "sa-gift": true,
    },
    previewScore: 1,
    formulaText: "tampered",
    note: "",
    status: "final",
    calculatorVersion: "jingchuge-html-v1",
  });

  assert.equal(result.sheet.previewScore, 220);
  assert.equal(result.sheet.formulaText, "(220.00)");

  const stored = await scoreSheetsStore.read();
  assert.equal(stored.sheets[0].previewScore, 220);
  assert.equal(stored.sheets[0].formulaText, "(220.00)");
});

test("ensureReady backfills placeholder public content with the committed seed", async () => {
  const publicContentStore = createMemoryStore(createEmptyPublicContent());
  const opsStateStore = createMemoryStore(createDefaultOpsState());
  const scoreSheetsStore = createMemoryStore(createDefaultScoreSheetsState());
  const service = createBackendService({ publicContentStore, opsStateStore, scoreSheetsStore });

  await service.ensureReady();

  const publicContent = await publicContentStore.read();
  assert.ok(publicContent.ruleSections.length > 0);
  assert.ok(publicContent.themeRules.length > 0);
  assert.ok(publicContent.teams.length > 0);
  assert.ok(publicContent.siteMeta.eventName);
});

test("getFinalsConfig seeds the current finalists and default first-pick tracks", async () => {
  const publicContent = createEmptyPublicContent();
  publicContent.teams = [
    createFinalistTeam("strawberry-no1", "草莓天下第一"),
    createFinalistTeam("mygo", "mygo"),
  ];

  const service = createBackendService({
    publicContentStore: createMemoryStore(publicContent),
    opsStateStore: createMemoryStore(createDefaultOpsState(publicContent)),
    scoreSheetsStore: createMemoryStore(createDefaultScoreSheetsState()),
  });

  const finalsConfig = await service.getFinalsConfig();

  assert.equal(finalsConfig.teamAId, "strawberry-no1");
  assert.equal(finalsConfig.teamBId, "mygo");
  assert.equal(finalsConfig.tracks.sami.firstPickTeamId, "strawberry-no1");
  assert.equal(finalsConfig.tracks.sarkaz_chou.firstPickTeamId, "strawberry-no1");
  assert.equal(finalsConfig.tracks.sarkaz_meiyuan.firstPickTeamId, "mygo");
  assert.equal(finalsConfig.tracks.sui.enabled, false);
});

test("calculateSoloScore reports finals pick warnings without auto-deducting the score", async () => {
  const publicContent = createEmptyPublicContent();
  const teamA = createFinalistTeam("strawberry-no1", "草莓天下第一");
  const teamB = createFinalistTeam("mygo", "mygo");
  publicContent.teams = [teamA, teamB];

  const opsState = createDefaultOpsState(publicContent);
  opsState.finalsConfig.tracks.sarkaz_chou.picksByTeamId = {
    "strawberry-no1": [
      { id: "a1", operatorName: "推进之王", rarity: 6, createdAt: "2026-04-05T00:00:00.000Z" },
      { id: "a2", operatorName: "能天使", rarity: 6, createdAt: "2026-04-05T00:00:00.000Z" },
      { id: "a3", operatorName: "银灰", rarity: 6, createdAt: "2026-04-05T00:00:00.000Z" },
    ],
    mygo: [
      { id: "b1", operatorName: "陈", rarity: 6, createdAt: "2026-04-05T00:00:00.000Z" },
      { id: "b2", operatorName: "艾雅法拉", rarity: 6, createdAt: "2026-04-05T00:00:00.000Z" },
      { id: "b3", operatorName: "煌", rarity: 6, createdAt: "2026-04-05T00:00:00.000Z" },
    ],
  };

  const service = createBackendService({
    publicContentStore: createMemoryStore(publicContent),
    opsStateStore: createMemoryStore(opsState),
    scoreSheetsStore: createMemoryStore(createDefaultScoreSheetsState()),
  });

  const result = await service.calculateSoloScore({
    teamId: "strawberry-no1",
    memberId: "strawberry-no1-chou",
    theme: "sarkaz",
    snapshot: {
      "finals-enabled": true,
      "finals-active-operators": ["陈", "史尔特尔"],
      "sk-score": 100,
    },
  });

  assert.equal(result.previewScore, 85);
  assert.ok(result.finalsValidation);
  assert.equal(result.finalsValidation.trackCode, "sarkaz_chou");
  assert.equal(result.finalsValidation.suggestedPenalty, 600);
  assert.deepEqual(result.finalsValidation.opponentPickedOperators, ["陈"]);
  assert.deepEqual(result.finalsValidation.outsidePoolOperators, ["陈", "史尔特尔"]);
});

test("upsertScoreSheet blocks locking a finals Sarkaz sheet when the lane assignment is missing", async () => {
  const publicContent = createEmptyPublicContent();
  const teamA = createFinalistTeam("strawberry-no1", "草莓天下第一");
  const teamB = createFinalistTeam("mygo", "mygo");
  publicContent.teams = [teamA, teamB];

  const opsState = createDefaultOpsState(publicContent);
  opsState.finalsConfig.sarkazLaneAssignments["strawberry-no1"] = {
    chouMemberId: null,
    meiyuanMemberId: null,
  };
  opsState.finalsConfig.tracks.sarkaz_chou.picksByTeamId = {
    "strawberry-no1": [
      { id: "a1", operatorName: "推进之王", rarity: 6, createdAt: "2026-04-05T00:00:00.000Z" },
      { id: "a2", operatorName: "能天使", rarity: 6, createdAt: "2026-04-05T00:00:00.000Z" },
      { id: "a3", operatorName: "银灰", rarity: 6, createdAt: "2026-04-05T00:00:00.000Z" },
    ],
    mygo: [
      { id: "b1", operatorName: "陈", rarity: 6, createdAt: "2026-04-05T00:00:00.000Z" },
      { id: "b2", operatorName: "艾雅法拉", rarity: 6, createdAt: "2026-04-05T00:00:00.000Z" },
      { id: "b3", operatorName: "煌", rarity: 6, createdAt: "2026-04-05T00:00:00.000Z" },
    ],
  };
  opsState.finalsConfig.tracks.sarkaz_meiyuan.picksByTeamId = structuredClone(opsState.finalsConfig.tracks.sarkaz_chou.picksByTeamId);

  const service = createBackendService({
    publicContentStore: createMemoryStore(publicContent),
    opsStateStore: createMemoryStore(opsState),
    scoreSheetsStore: createMemoryStore(createDefaultScoreSheetsState()),
  });

  await assert.rejects(
    () => service.upsertScoreSheet({
      teamId: "strawberry-no1",
      memberId: "strawberry-no1-chou",
      matchId: null,
      theme: "sarkaz",
      snapshot: {
        "finals-enabled": true,
        "finals-active-operators": ["推进之王"],
        "sk-score": 100,
      },
      status: "final",
      calculatorVersion: "jingchuge-react-admin-v1",
    }),
    /尚未绑定死仇 \/ 美愿赛道/,
  );
});

test("publishTeam rejects blocking compliance states even when every sheet is final", async (t) => {
  const baseSheets = [
    createScoreSheet("m1", "sami"),
    createScoreSheet("m2", "sarkaz"),
    createScoreSheet("m3", "sui"),
    createScoreSheet("m4", "sami"),
  ];

  const scenarios = [
    {
      name: "missing pressure role",
      team: createTeam(),
      compliance: { pressureMemberId: null },
      expected: "尚未分配抗压位选手。",
    },
    {
      name: "short roster",
      team: createTeam({ memberCount: 3 }),
      compliance: { pressureMemberId: "m1" },
      sheets: [
        createScoreSheet("m1", "sami"),
        createScoreSheet("m2", "sarkaz"),
        createScoreSheet("m3", "sui"),
      ],
      expected: "花名册缺少 1 名选手。",
    },
    {
      name: "too many coach calls",
      team: createTeam(),
      compliance: {
        pressureMemberId: "m1",
        coachCalls: [
          { id: "c1", requestedByMemberId: "m1", targetMemberId: "m2", durationMinutes: 3 },
          { id: "c2", requestedByMemberId: "m1", targetMemberId: "m2", durationMinutes: 3 },
          { id: "c3", requestedByMemberId: "m1", targetMemberId: "m2", durationMinutes: 3 },
          { id: "c4", requestedByMemberId: "m1", targetMemberId: "m2", durationMinutes: 3 },
        ],
      },
      expected: "教练通话次数超过规则上限。",
    },
    {
      name: "over-duration coach call",
      team: createTeam(),
      compliance: {
        pressureMemberId: "m1",
        coachCalls: [
          { id: "c1", requestedByMemberId: "m1", targetMemberId: "m2", durationMinutes: 4 },
        ],
      },
      expected: "至少有一次教练通话时长超过单次上限。",
    },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, async () => {
      const { service } = createServiceWithStores({
        team: scenario.team,
        compliance: scenario.compliance,
        sheets: scenario.sheets ?? baseSheets,
      });

      await assert.rejects(
        () => service.publishTeam("team-1"),
        (error) => {
          assert.equal(error.message, "Team is not ready to publish.");
          assert.ok(error.details.publishBlockingIssues.includes(scenario.expected));
          return true;
        },
      );
    });
  }
});

test("deleteScoreSheet removes the stored sheet and recalculates publish blockers", async () => {
  const { service, scoreSheetsStore } = createServiceWithStores({
    compliance: { pressureMemberId: "m1" },
    sheets: [
      createScoreSheet("m1", "sami"),
      createScoreSheet("m2", "sarkaz"),
      createScoreSheet("m3", "sui"),
      createScoreSheet("m4", "sami"),
    ],
  });

  const result = await service.deleteScoreSheet("m4-sami");

  assert.equal(result.deletedId, "m4-sami");
  assert.equal(result.aggregate.scoredCount, 3);
  assert.equal(result.aggregate.finalizedCount, 3);
  assert.equal(result.aggregate.publishReady, false);
  assert.ok(result.aggregate.publishBlockingIssues.includes("仍有 1 名选手未完成终稿确认。"));

  const stored = await scoreSheetsStore.read();
  assert.equal(stored.sheets.length, 3);
  assert.equal(stored.sheets.some((entry) => entry.id === "m4-sami"), false);
});

test("createCoachCall rejects over-limit duration and total count before mutating state", async (t) => {
  await t.test("duration over 3 minutes", async () => {
    const { service, opsStateStore } = createServiceWithStores({
      compliance: { pressureMemberId: "m1" },
    });

    await assert.rejects(
      () => service.createCoachCall("team-1", {
        requestedByMemberId: "m1",
        targetMemberId: "m2",
        durationMinutes: 4,
        note: "",
      }),
      /duration exceeds the per-call rule limit/,
    );

    const state = await opsStateStore.read();
    assert.equal(state.complianceByTeam["team-1"].coachCalls.length, 0);
  });

  await t.test("fourth coach call", async () => {
    const { service, opsStateStore } = createServiceWithStores({
      compliance: {
        pressureMemberId: "m1",
        coachCalls: [
          { id: "c1", requestedByMemberId: "m1", targetMemberId: "m2", durationMinutes: 3 },
          { id: "c2", requestedByMemberId: "m1", targetMemberId: "m2", durationMinutes: 3 },
          { id: "c3", requestedByMemberId: "m1", targetMemberId: "m2", durationMinutes: 3 },
        ],
      },
    });

    await assert.rejects(
      () => service.createCoachCall("team-1", {
        requestedByMemberId: "m1",
        targetMemberId: "m2",
        durationMinutes: 3,
        note: "",
      }),
      /Coach call count exceeds the rule limit/,
    );

    const state = await opsStateStore.read();
    assert.equal(state.complianceByTeam["team-1"].coachCalls.length, 3);
  });
});

test("getPublicBootstrap keeps planned picks from public content and does not leak actual operator drafts", async () => {
  const team = createTeam();
  team.members[0].operatorPicks = [
    {
      id: "plan-1",
      operatorName: "Plan-A",
      rarity: 6,
      createdAt: "2026-03-12T00:00:00.000Z",
    },
  ];
  const operatorDrafts = Array.from({ length: 3 }, (_, index) => ({
    id: `draft-${index + 1}`,
    memberId: "m1",
    operatorName: `Actual-${index + 1}`,
    rarity: 6,
    isTemporaryRecruit: false,
    note: "",
    createdAt: `2026-03-12T00:00:${String(index).padStart(2, "0")}.000Z`,
  }));
  const { service } = createServiceWithStores({
    team,
    compliance: { operatorDrafts },
  });

  const bootstrap = await service.getPublicBootstrap();
  const member = bootstrap.teams[0].members.find((entry) => entry.id === "m1");

  assert.ok(member);
  assert.deepEqual(member.operatorPicks, team.members[0].operatorPicks);
  assert.equal(member.operatorPicks[0].operatorName, "Plan-A");
});

test("createOperatorDraft rejects a 14th six-star on the same member", async () => {
  const operatorDrafts = Array.from({ length: tournamentConfig.operatorDrafts.maxSixStarsPerMember }, (_, index) => ({
    id: `draft-${index + 1}`,
    memberId: "m1",
    operatorName: `Op-${index + 1}`,
    rarity: 6,
    isTemporaryRecruit: false,
    note: "",
    createdAt: `2026-03-12T00:00:${String(index).padStart(2, "0")}.000Z`,
  }));
  const { service, opsStateStore } = createServiceWithStores({
    compliance: { operatorDrafts },
  });

  await assert.rejects(
    () => service.createOperatorDraft("team-1", {
      memberId: "m1",
      operatorName: "Overflow",
      rarity: 6,
      isTemporaryRecruit: false,
      note: "",
    }),
    /already reached the 13 six-star operator limit/,
  );

  const state = await opsStateStore.read();
  assert.equal(state.complianceByTeam["team-1"].operatorDrafts.length, tournamentConfig.operatorDrafts.maxSixStarsPerMember);
});

test("createPlannedPick stores a member's planned six-stars in public content only", async () => {
  const team = createTeam();
  const { service, publicContentStore, opsStateStore } = createServiceWithStores({ team });

  const result = await service.createPlannedPick("team-1", "m1", {
    operatorName: "能天使",
    rarity: 6,
  });

  assert.equal(result.created.operatorName, "能天使");

  const publicContent = await publicContentStore.read();
  const member = publicContent.teams[0].members.find((entry) => entry.id === "m1");
  assert.ok(member);
  assert.equal(member.operatorPicks.length, 1);
  assert.equal(member.operatorPicks[0].operatorName, "能天使");

  const opsState = await opsStateStore.read();
  assert.equal(opsState.complianceByTeam["team-1"].operatorDrafts.length, 0);
});

test("createPlannedPick rejects a 14th planned six-star on the same member", async () => {
  const team = createTeam();
  team.members[0].operatorPicks = Array.from({ length: tournamentConfig.operatorDrafts.maxSixStarsPerMember }, (_, index) => ({
    id: `plan-${index + 1}`,
    operatorName: `Plan-${index + 1}`,
    rarity: 6,
    createdAt: `2026-03-12T00:00:${String(index).padStart(2, "0")}.000Z`,
  }));
  const { service, publicContentStore } = createServiceWithStores({ team });

  await assert.rejects(
    () => service.createPlannedPick("team-1", "m1", {
      operatorName: "Overflow",
      rarity: 6,
    }),
    /already reached the 13 planned six-star operator limit/,
  );

  const publicContent = await publicContentStore.read();
  const member = publicContent.teams[0].members.find((entry) => entry.id === "m1");
  assert.equal(member.operatorPicks.length, tournamentConfig.operatorDrafts.maxSixStarsPerMember);
});

test("upsertScoreSheet rejects an id that points to a different identity", async () => {
  const existingSheet = createScoreSheet("m2", "sarkaz", 123, "draft");
  const { service, scoreSheetsStore } = createServiceWithStores({
    compliance: { pressureMemberId: "m1" },
    sheets: [existingSheet],
  });

  await assert.rejects(
    () => service.upsertScoreSheet({
      id: existingSheet.id,
      teamId: "team-1",
      memberId: "m1",
      matchId: null,
      theme: "sami",
      snapshot: {
        "sa-score": 100,
      },
      status: "draft",
      calculatorVersion: "jingchuge-react-admin-v1",
    }),
    /identity/,
  );

  const stored = await scoreSheetsStore.read();
  assert.equal(stored.sheets.length, 1);
  assert.equal(stored.sheets[0].memberId, "m2");
  assert.equal(stored.sheets[0].theme, "sarkaz");
  assert.equal(stored.sheets[0].previewScore, 123);
});

test("buildTeamAggregate explicitly collapses match-scoped sheets by status and recency", () => {
  const team = createTeam();
  const aggregate = buildTeamAggregate(team, { pressureMemberId: "m4" }, [
    createScoreSheet("m1", "sami", 111, "draft", "match-1", {
      id: "sheet-draft",
      updatedAt: "2026-03-12T10:00:00.000Z",
      createdAt: "2026-03-12T10:00:00.000Z",
    }),
    createScoreSheet("m1", "sami", 222, "final", "match-2", {
      id: "sheet-final",
      updatedAt: "2026-03-12T09:00:00.000Z",
      createdAt: "2026-03-12T09:00:00.000Z",
    }),
    createScoreSheet("m2", "sarkaz", 50),
    createScoreSheet("m3", "sui", 60),
    createScoreSheet("m4", "sami", 70),
  ]);

  assert.equal(aggregate.members.find((entry) => entry.memberId === "m1")?.sheet?.id, "sheet-final");
  assert.equal(aggregate.members.find((entry) => entry.memberId === "m1")?.score, 222);
});

test("replacePublicContent drops orphan compliance and score sheets during sync", async () => {
  const team = createTeam();
  const { service, opsStateStore, scoreSheetsStore } = createServiceWithStores({
    team,
    compliance: { pressureMemberId: "m1" },
    sheets: [
      createScoreSheet("m1", "sami"),
      {
        ...createScoreSheet("ghost-member", "sami"),
        id: "ghost-sheet",
        teamId: "ghost-team",
        memberId: "ghost-member",
      },
    ],
  });

  const currentOpsState = await opsStateStore.read();
  currentOpsState.complianceByTeam["ghost-team"] = {
    teamId: "ghost-team",
    pressureMemberId: null,
    openingIngots: 0,
    currentIngots: 0,
    overtimeMinutes: 0,
    operatorDrafts: [],
    coachCalls: [],
    notes: [],
    updatedAt: "2026-03-12T00:00:00.000Z",
  };
  await opsStateStore.replace(currentOpsState);

  const nextPublicContent = createEmptyPublicContent();
  nextPublicContent.teams = [];
  nextPublicContent.matches = [];
  nextPublicContent.leaderboard = [];

  await service.replacePublicContent(nextPublicContent);

  const syncedOpsState = await opsStateStore.read();
  assert.deepEqual(Object.keys(syncedOpsState.complianceByTeam), []);

  const syncedScoreSheetsState = await scoreSheetsStore.read();
  assert.equal(syncedScoreSheetsState.sheets.length, 0);
});

test("patchMatch validates member ownership and derives currentMemberName", async () => {
  const team = createTeam();
  const publicContent = createPublicContent(team);
  publicContent.matches = [
    {
      id: "match-1",
      phase: "Round 1",
      startTime: "09:00",
      status: "PENDING",
      teamId: "team-1",
      totalScore: "0",
      currentMemberId: null,
      currentMemberName: null,
      members: team.members.map((member, index) => ({
        id: member.id,
        name: member.name,
        theme: member.theme,
        score: 0,
        multiplier: 1,
        status: "PENDING",
        queueOrder: index,
      })),
      playersList: team.members.map((member) => member.name),
      note: "",
    },
  ];

  const service = createBackendService({
    publicContentStore: createMemoryStore(publicContent),
    opsStateStore: createMemoryStore(createDefaultOpsState(publicContent)),
    scoreSheetsStore: createMemoryStore(createDefaultScoreSheetsState()),
  });

  await assert.rejects(
    () => service.patchMatch("match-1", { currentMemberId: "ghost" }),
    /does not exist on match/,
  );

  const patched = await service.patchMatch("match-1", {
    currentMemberId: "m2",
    note: "ready",
    status: "IN_PROGRESS",
  });

  assert.equal(patched.currentMemberId, "m2");
  assert.equal(patched.currentMemberName, "B");
  assert.equal(patched.note, "ready");
  assert.equal(patched.status, "IN_PROGRESS");
});
