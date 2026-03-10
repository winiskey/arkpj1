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

function normaliseOperatorName(operatorName) {
  return String(operatorName ?? "").trim().toLowerCase();
}

function groupDuplicateSixStars(operatorDrafts) {
  const sixStarDrafts = operatorDrafts.filter((draft) => {
    if (draft.rarity !== 6) {
      return false;
    }

    if (draft.isTemporaryRecruit && tournamentConfig.uniqueSixStars.excludeTemporaryRecruit) {
      return false;
    }

    return true;
  });

  const grouped = new Map();
  for (const draft of sixStarDrafts) {
    const key = normaliseOperatorName(draft.operatorName);
    const current = grouped.get(key) ?? [];
    current.push(draft);
    grouped.set(key, current);
  }

  return Array.from(grouped.values())
    .filter((entries) => entries.length > 1)
    .map((entries) => ({
      operatorName: entries[0].operatorName,
      memberIds: entries.map((entry) => entry.memberId),
      entries,
    }));
}

export function buildTeamComplianceSummary(team, rawCompliance) {
  const pressureRoleAssigned = Boolean(rawCompliance.pressureMemberId);
  const pressureRoleMemberExists = team.members.some((member) => member.id === rawCompliance.pressureMemberId);
  const sharedIngotsSpent = Math.max((rawCompliance.openingIngots ?? 0) - (rawCompliance.currentIngots ?? 0), 0);
  const duplicateSixStars = groupDuplicateSixStars(rawCompliance.operatorDrafts ?? []);
  const overDurationCalls = (rawCompliance.coachCalls ?? []).filter(
    (call) => call.durationMinutes > tournamentConfig.coachCalls.maxMinutesPerCall,
  );
  const missingMembers = Math.max(tournamentConfig.roster.teamSize - team.members.length, 0);

  const blockingIssues = [];
  const warnings = [];

  if (!pressureRoleAssigned) {
    blockingIssues.push("未设置抗压位。规则要求每队指定一名抗压位。");
  } else if (!pressureRoleMemberExists) {
    blockingIssues.push("抗压位成员不存在于当前队伍名单中。");
  }

  if (missingMembers > 0) {
    blockingIssues.push(`队伍名单不足 ${tournamentConfig.roster.teamSize} 人，当前缺少 ${missingMembers} 人。`);
  }

  if (sharedIngotsSpent > tournamentConfig.sharedIngots.maxNetSpend) {
    blockingIssues.push(`源石锭净消耗已超限 ${sharedIngotsSpent - tournamentConfig.sharedIngots.maxNetSpend} 点。`);
  }

  if ((rawCompliance.coachCalls ?? []).length > tournamentConfig.coachCalls.maxCount) {
    blockingIssues.push("连麦次数已超出规则上限。");
  }

  if (overDurationCalls.length > 0) {
    blockingIssues.push("存在单次连麦时长超过 3 分钟的记录。");
  }

  if (duplicateSixStars.length > 0) {
    warnings.push("存在重复抓取六星干员的记录，后续需要进入系数复核。");
  }

  if ((rawCompliance.overtimeMinutes ?? 0) > 0) {
    warnings.push("已记录超时分钟数，后续需要进入系数复核。");
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
      pressureMemberId: rawCompliance.pressureMemberId,
      pressureMemberName: team.members.find((member) => member.id === rawCompliance.pressureMemberId)?.name ?? null,
      pressureRoleValid: pressureRoleAssigned && pressureRoleMemberExists,
    },
    sharedIngots: {
      openingIngots: rawCompliance.openingIngots ?? 0,
      currentIngots: rawCompliance.currentIngots ?? 0,
      spent: sharedIngotsSpent,
      limit: tournamentConfig.sharedIngots.maxNetSpend,
      withinLimit: sharedIngotsSpent <= tournamentConfig.sharedIngots.maxNetSpend,
    },
    coachCalls: {
      totalCount: (rawCompliance.coachCalls ?? []).length,
      maxCount: tournamentConfig.coachCalls.maxCount,
      maxMinutesPerCall: tournamentConfig.coachCalls.maxMinutesPerCall,
      overDurationCalls,
      records: rawCompliance.coachCalls ?? [],
    },
    operators: {
      duplicateSixStars,
      records: rawCompliance.operatorDrafts ?? [],
    },
    overtime: {
      minutes: rawCompliance.overtimeMinutes ?? 0,
    },
    notes: rawCompliance.notes ?? [],
    blockingIssues,
    warnings,
  };
}

export function buildComplianceCollection(teams, complianceByTeam) {
  return teams.map((team) =>
    buildTeamComplianceSummary(team, complianceByTeam[team.id] ?? {
      pressureMemberId: null,
      openingIngots: 0,
      currentIngots: 0,
      overtimeMinutes: 0,
      operatorDrafts: [],
      coachCalls: [],
      notes: [],
    }),
  );
}
