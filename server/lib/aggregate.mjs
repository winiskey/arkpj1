import { buildTeamComplianceSummary } from "./compliance.mjs";

const STATUS_WEIGHT = {
  draft: 0,
  final: 1,
  published: 2,
};

function parseTimestamp(value) {
  return value ? Date.parse(value) : 0;
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

export function formatScore(value) {
  const rounded = Math.round((Number(value) || 0) * 100) / 100;
  const fractionDigits = Number.isInteger(rounded) ? 0 : 2;
  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  });
}

export function inferThemeCodeFromLabel(label) {
  if (label.includes("萨卡兹")) {
    return "sarkaz";
  }
  if (label.includes("界园") || label.includes("岁")) {
    return "sui";
  }
  return "sami";
}

function pickLatestSheetForMember(sheets, member) {
  const expectedTheme = inferThemeCodeFromLabel(member.theme);
  const candidates = sheets.filter((sheet) => sheet.memberId === member.id && sheet.theme === expectedTheme);

  if (!candidates.length) {
    return null;
  }

  const sorted = [...candidates].sort((left, right) => {
    const statusDiff = STATUS_WEIGHT[right.status] - STATUS_WEIGHT[left.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return parseTimestamp(right.updatedAt) - parseTimestamp(left.updatedAt);
  });

  return sorted[0];
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
  const compliance = buildTeamComplianceSummary(team, rawCompliance);
  const members = team.members.map((member) => {
    const sheet = pickLatestSheetForMember(teamSheets, member);
    const score = sheet ? parseNumericScore(sheet.previewScore) : 0;
    const isPressureMember = rawCompliance.pressureMemberId === member.id;
    const pressureBonus = isPressureMember ? score * 0.2 : 0;

    return {
      memberId: member.id,
      name: member.name,
      role: member.role,
      expectedTheme: member.theme,
      themeCode: inferThemeCodeFromLabel(member.theme),
      sheet,
      score,
      pressureApplied: isPressureMember,
      pressureBonus,
      adjustedScore: score + pressureBonus,
    };
  });

  const rawTotal = members.reduce((sum, member) => sum + member.score, 0);
  const pressureBonus = members.reduce((sum, member) => sum + member.pressureBonus, 0);
  const teamTotal = rawTotal + pressureBonus;
  const status = deriveAggregateStatus(members);
  const finalizedCount = members.filter((member) => member.sheet && (member.sheet.status === "final" || member.sheet.status === "published")).length;
  const publishedCount = members.filter((member) => member.sheet?.status === "published").length;
  const scoredCount = members.filter((member) => member.sheet).length;
  const nextPendingMember = members.find((member) => !member.sheet || member.sheet.status === "draft") ?? null;

  return {
    teamId: team.id,
    teamName: team.name,
    teamTag: team.tag,
    status,
    memberCount: members.length,
    scoredCount,
    finalizedCount,
    publishedCount,
    publishReady: members.length > 0 && finalizedCount === members.length,
    rawTotal,
    pressureBonus,
    teamTotal,
    formatted: {
      rawTotal: formatScore(rawTotal),
      pressureBonus: formatScore(pressureBonus),
      teamTotal: formatScore(teamTotal),
    },
    pressureMemberId: rawCompliance.pressureMemberId ?? null,
    pressureMemberName: members.find((member) => member.memberId === rawCompliance.pressureMemberId)?.name ?? null,
    nextPendingMemberName: nextPendingMember?.name ?? null,
    members,
    compliance,
    updatedAt: members.reduce((latest, member) => {
      const current = parseTimestamp(member.sheet?.updatedAt ?? "");
      return current > parseTimestamp(latest) ? member.sheet.updatedAt : latest;
    }, rawCompliance.updatedAt ?? null),
  };
}

export function buildAllTeamAggregates(publicContent, opsState, scoreSheetsState) {
  return publicContent.teams.map((team) =>
    buildTeamAggregate(
      team,
      opsState.complianceByTeam?.[team.id] ?? {
        pressureMemberId: null,
        openingIngots: 0,
        currentIngots: 0,
        overtimeMinutes: 0,
        operatorDrafts: [],
        coachCalls: [],
        notes: [],
        updatedAt: null,
      },
      scoreSheetsState.sheets.filter((sheet) => sheet.teamId === team.id),
    ),
  );
}

function sortTeamsByAggregate(teams, aggregateMap) {
  return [...teams].sort((left, right) => {
    const rightScore = aggregateMap.get(right.id)?.teamTotal ?? parseNumericScore(right.totalScore);
    const leftScore = aggregateMap.get(left.id)?.teamTotal ?? parseNumericScore(left.totalScore);
    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }
    return left.rank - right.rank;
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
      team.totalScore = aggregate.formatted.teamTotal;
    }
    team.rank = rankByTeamId.get(team.id) ?? team.rank;
  }

  for (const entry of nextContent.leaderboard) {
    const aggregate = aggregateMap.get(entry.teamId);
    if (aggregate) {
      entry.total = aggregate.formatted.teamTotal;
      entry.details = `${aggregate.finalizedCount}/${aggregate.memberCount} 已确认 · ${aggregate.status.label}`;
    }
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
      match.totalScore = aggregate.formatted.teamTotal;
    }
  }

  return nextContent;
}
