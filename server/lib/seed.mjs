export function createDefaultOpsState(publicContent) {
  const now = new Date().toISOString();
  const complianceByTeam = Object.fromEntries(
    (publicContent.teams ?? []).map((team) => [
      team.id,
      {
        teamId: team.id,
        pressureMemberId: null,
        openingIngots: 0,
        currentIngots: 0,
        overtimeMinutes: 0,
        operatorDrafts: [],
        coachCalls: [],
        notes: [],
        updatedAt: now,
      },
    ]),
  );

  return {
    version: 1,
    updatedAt: now,
    complianceByTeam,
  };
}

export function syncOpsStateWithTeams(publicContent, opsState) {
  const nextState = structuredClone(opsState);
  const now = new Date().toISOString();

  nextState.complianceByTeam ??= {};

  for (const team of publicContent.teams ?? []) {
    nextState.complianceByTeam[team.id] ??= {
      teamId: team.id,
      pressureMemberId: null,
      openingIngots: 0,
      currentIngots: 0,
      overtimeMinutes: 0,
      operatorDrafts: [],
      coachCalls: [],
      notes: [],
      updatedAt: now,
    };
  }

  nextState.updatedAt = now;
  return nextState;
}
