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

function createPublicContent(team) {
  const publicContent = createEmptyPublicContent();
  publicContent.teams = [team];
  publicContent.leaderboard = [];
  publicContent.matches = [];
  return publicContent;
}

function createScoreSheet(memberId, theme, previewScore = 100, status = "final") {
  return {
    id: `${memberId}-${theme}`,
    teamId: "team-1",
    memberId,
    matchId: null,
    theme,
    snapshot: {},
    previewScore,
    formulaText: `${previewScore}`,
    note: "",
    status,
    calculatorVersion: "jingchuge-html-v1",
    createdAt: "2026-03-12T00:00:00.000Z",
    updatedAt: "2026-03-12T00:00:00.000Z",
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
      expected: "Roster is short by 1 member(s).",
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
      expected: "Coach call count exceeds the rule limit.",
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
      expected: "At least one coach call exceeds the per-call duration limit.",
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
