import {
  BROADCAST_STATUSES,
  MATCH_STATUSES,
  MEMBER_RUN_STATUSES,
  SCORE_SHEET_STATUSES,
  SCHEDULE_SLOT_TONES,
  THEME_CODES,
} from "./domain.mjs";

const broadcastStatusSet = new Set(BROADCAST_STATUSES);
const matchStatusSet = new Set(MATCH_STATUSES);
const memberRunStatusSet = new Set(MEMBER_RUN_STATUSES);
const scoreStatusSet = new Set(SCORE_SHEET_STATUSES);
const scheduleSlotToneSet = new Set(SCHEDULE_SLOT_TONES);
const themeCodeSet = new Set(THEME_CODES);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function expectPlainObject(value, name) {
  if (!isPlainObject(value)) {
    throw new Error(`${name} must be an object.`);
  }

  return value;
}

function expectArray(value, name) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array.`);
  }

  return value;
}

function expectString(value, name, { allowEmpty = false } = {}) {
  if (typeof value !== "string") {
    throw new Error(`${name} must be a string.`);
  }

  if (!allowEmpty && !value.trim()) {
    throw new Error(`${name} must not be empty.`);
  }

  return value;
}

function expectOptionalString(value, name, { allowEmpty = true } = {}) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return expectString(value, name, { allowEmpty });
}

function expectBoolean(value, name) {
  if (typeof value !== "boolean") {
    throw new Error(`${name} must be a boolean.`);
  }

  return value;
}

function expectNumber(value, name, { integer = false, min, max } = {}) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    throw new Error(`${name} must be a finite number.`);
  }

  if (integer && !Number.isInteger(nextValue)) {
    throw new Error(`${name} must be an integer.`);
  }

  if (min !== undefined && nextValue < min) {
    throw new Error(`${name} must be >= ${min}.`);
  }

  if (max !== undefined && nextValue > max) {
    throw new Error(`${name} must be <= ${max}.`);
  }

  return nextValue;
}

function expectStringArray(value, name, options = {}) {
  return expectArray(value, name).map((entry, index) => expectString(entry, `${name}[${index}]`, options));
}

function expectEnum(value, name, allowedSet) {
  const nextValue = expectString(value, name);
  if (!allowedSet.has(nextValue)) {
    throw new Error(`${name} has an unsupported value.`);
  }

  return nextValue;
}

function assertNoUnknownKeys(object, allowedKeys, name) {
  const unknownKeys = Object.keys(object).filter((key) => !allowedKeys.includes(key));
  if (unknownKeys.length > 0) {
    throw new Error(`${name} contains unsupported field(s): ${unknownKeys.join(", ")}.`);
  }
}

function validateUrl(value, name, { allowRelative = false, allowEmpty = false } = {}) {
  const nextValue = expectString(value, name, { allowEmpty });
  if (!nextValue && allowEmpty) {
    return nextValue;
  }

  if (allowRelative && nextValue.startsWith("/")) {
    return nextValue;
  }

  let parsed;
  try {
    parsed = new URL(nextValue);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`${name} must use http or https.`);
  }

  return nextValue;
}

function validatePrizeItem(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["label", "value"], name);

  return {
    label: expectString(object.label, `${name}.label`, { allowEmpty: true }),
    value: expectString(object.value, `${name}.value`, { allowEmpty: true }),
  };
}

function validateCtaLink(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["label", "href", "kind"], name);

  const kind = expectString(object.kind, `${name}.kind`);
  if (kind !== "internal" && kind !== "external") {
    throw new Error(`${name}.kind must be internal or external.`);
  }

  return {
    label: expectString(object.label, `${name}.label`, { allowEmpty: true }),
    href:
      kind === "internal"
        ? validateUrl(object.href, `${name}.href`, { allowRelative: true })
        : validateUrl(object.href, `${name}.href`),
    kind,
  };
}

function validateOverviewPanel(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["title", "label", "content"], name);

  return {
    title: expectString(object.title, `${name}.title`, { allowEmpty: true }),
    label: expectString(object.label, `${name}.label`, { allowEmpty: true }),
    content: expectString(object.content, `${name}.content`, { allowEmpty: true }),
  };
}

function validateLiveBroadcast(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["title", "subtitle", "platform", "status", "startTimeLabel", "href", "roomLabel", "notice"], name);

  const platform = expectString(object.platform, `${name}.platform`, { allowEmpty: true });
  if (platform && platform !== "bilibili") {
    throw new Error(`${name}.platform must be bilibili.`);
  }

  return {
    title: expectString(object.title, `${name}.title`, { allowEmpty: true }),
    subtitle: expectString(object.subtitle, `${name}.subtitle`, { allowEmpty: true }),
    platform: platform || "bilibili",
    status: expectEnum(object.status, `${name}.status`, broadcastStatusSet),
    startTimeLabel: expectString(object.startTimeLabel, `${name}.startTimeLabel`, { allowEmpty: true }),
    href: validateUrl(object.href, `${name}.href`, { allowEmpty: true }),
    roomLabel: expectString(object.roomLabel, `${name}.roomLabel`, { allowEmpty: true }),
    notice: expectString(object.notice, `${name}.notice`, { allowEmpty: true }),
  };
}

function validateMatchMember(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["id", "name", "theme", "score", "multiplier", "status", "queueOrder"], name);

  return {
    id: expectString(object.id, `${name}.id`),
    name: expectString(object.name, `${name}.name`),
    theme: expectString(object.theme, `${name}.theme`),
    score: expectNumber(object.score, `${name}.score`),
    multiplier: expectNumber(object.multiplier, `${name}.multiplier`),
    status: expectEnum(object.status, `${name}.status`, memberRunStatusSet),
    queueOrder: expectNumber(object.queueOrder, `${name}.queueOrder`, { integer: true, min: 0 }),
  };
}

function validateMatch(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["id", "phase", "startTime", "status", "teamId", "totalScore", "currentMemberId", "currentMemberName", "members", "playersList", "note"], name);

  const next = {
    id: expectString(object.id, `${name}.id`),
    phase: expectString(object.phase, `${name}.phase`, { allowEmpty: true }),
    startTime: expectString(object.startTime, `${name}.startTime`, { allowEmpty: true }),
    status: expectEnum(object.status, `${name}.status`, matchStatusSet),
    teamId: expectString(object.teamId, `${name}.teamId`),
    totalScore: expectString(object.totalScore, `${name}.totalScore`, { allowEmpty: true }),
  };

  const currentMemberId = expectOptionalString(object.currentMemberId, `${name}.currentMemberId`, { allowEmpty: false });
  if (currentMemberId !== undefined) {
    next.currentMemberId = currentMemberId;
  }

  const currentMemberName = expectOptionalString(object.currentMemberName, `${name}.currentMemberName`, { allowEmpty: true });
  if (currentMemberName !== undefined) {
    next.currentMemberName = currentMemberName;
  }

  if (object.members !== undefined) {
    next.members = expectArray(object.members, `${name}.members`).map((entry, index) =>
      validateMatchMember(entry, `${name}.members[${index}]`),
    );
  }

  if (object.playersList !== undefined) {
    next.playersList = expectStringArray(object.playersList, `${name}.playersList`, { allowEmpty: false });
  }

  const note = expectOptionalString(object.note, `${name}.note`, { allowEmpty: true });
  if (note !== undefined) {
    next.note = note;
  }

  return next;
}

function validateScheduleSlot(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["period", "time", "player", "teamId", "note", "tone"], name);

  const next = {
    period: expectString(object.period, `${name}.period`, { allowEmpty: true }),
    time: expectString(object.time, `${name}.time`, { allowEmpty: true }),
    player: expectString(object.player, `${name}.player`, { allowEmpty: true }),
  };

  const teamId = expectOptionalString(object.teamId, `${name}.teamId`, { allowEmpty: false });
  if (teamId !== undefined) {
    next.teamId = teamId;
  }

  const note = expectOptionalString(object.note, `${name}.note`, { allowEmpty: true });
  if (note !== undefined) {
    next.note = note;
  }

  const tone = expectOptionalString(object.tone, `${name}.tone`, { allowEmpty: false });
  if (tone !== undefined) {
    if (!scheduleSlotToneSet.has(tone)) {
      throw new Error(`${name}.tone has an unsupported value.`);
    }
    next.tone = tone;
  }

  return next;
}

function validateScheduleDay(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["date", "weekday", "slots"], name);

  return {
    date: expectString(object.date, `${name}.date`, { allowEmpty: true }),
    weekday: expectString(object.weekday, `${name}.weekday`, { allowEmpty: true }),
    slots: expectArray(object.slots, `${name}.slots`).map((entry, index) =>
      validateScheduleSlot(entry, `${name}.slots[${index}]`),
    ),
  };
}

function validateLeaderboardEntry(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["teamId", "name", "details", "total", "currentMember", "currentStatus", "teamStatus"], name);

  const next = {
    teamId: expectString(object.teamId, `${name}.teamId`),
    name: expectString(object.name, `${name}.name`, { allowEmpty: true }),
    details: expectString(object.details, `${name}.details`, { allowEmpty: true }),
    total: expectString(object.total, `${name}.total`, { allowEmpty: true }),
  };

  const currentMember = expectOptionalString(object.currentMember, `${name}.currentMember`, { allowEmpty: true });
  if (currentMember !== undefined) {
    next.currentMember = currentMember;
  }

  const currentStatus = expectOptionalString(object.currentStatus, `${name}.currentStatus`, { allowEmpty: false });
  if (currentStatus !== undefined) {
    if (!memberRunStatusSet.has(currentStatus)) {
      throw new Error(`${name}.currentStatus has an unsupported value.`);
    }
    next.currentStatus = currentStatus;
  }

  const teamStatus = expectOptionalString(object.teamStatus, `${name}.teamStatus`, { allowEmpty: false });
  if (teamStatus !== undefined) {
    if (!matchStatusSet.has(teamStatus)) {
      throw new Error(`${name}.teamStatus has an unsupported value.`);
    }
    next.teamStatus = teamStatus;
  }

  return next;
}

function validateTeamMetric(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["label", "value"], name);

  return {
    label: expectString(object.label, `${name}.label`, { allowEmpty: true }),
    value: expectNumber(object.value, `${name}.value`),
  };
}

function validateTeamMember(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["id", "name", "role", "theme", "signatureOp", "squad", "note", "avatar", "operatorPicks"], name);

  const next = {
    id: expectString(object.id, `${name}.id`),
    name: expectString(object.name, `${name}.name`),
    role: expectString(object.role, `${name}.role`, { allowEmpty: true }),
    theme: expectString(object.theme, `${name}.theme`, { allowEmpty: true }),
    signatureOp: expectString(object.signatureOp, `${name}.signatureOp`, { allowEmpty: true }),
    squad: expectString(object.squad, `${name}.squad`, { allowEmpty: true }),
    note: expectString(object.note, `${name}.note`, { allowEmpty: true }),
  };

  const avatar = expectOptionalString(object.avatar, `${name}.avatar`, { allowEmpty: true });
  if (avatar !== undefined) {
    next.avatar = avatar ? validateUrl(avatar, `${name}.avatar`, { allowRelative: true, allowEmpty: true }) : avatar;
  }

  if (object.operatorPicks !== undefined) {
    next.operatorPicks = expectArray(object.operatorPicks, `${name}.operatorPicks`).map((entry, index) => {
      const pick = expectPlainObject(entry, `${name}.operatorPicks[${index}]`);
      assertNoUnknownKeys(pick, ["id", "operatorName", "rarity", "createdAt"], `${name}.operatorPicks[${index}]`);

      return {
        id: expectString(pick.id, `${name}.operatorPicks[${index}].id`),
        operatorName: expectString(pick.operatorName, `${name}.operatorPicks[${index}].operatorName`, { allowEmpty: true }),
        rarity: expectNumber(pick.rarity, `${name}.operatorPicks[${index}].rarity`, { integer: true, min: 0 }),
        createdAt: expectString(pick.createdAt, `${name}.operatorPicks[${index}].createdAt`, { allowEmpty: true }),
      };
    });
  }

  return next;
}

function validateTeam(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["id", "name", "tag", "enName", "status", "sample", "totalScore", "rank", "manifesto", "radarStats", "members"], name);

  const next = {
    id: expectString(object.id, `${name}.id`),
    name: expectString(object.name, `${name}.name`),
    tag: expectString(object.tag, `${name}.tag`, { allowEmpty: true }),
    enName: expectString(object.enName, `${name}.enName`, { allowEmpty: true }),
    status: expectString(object.status, `${name}.status`, { allowEmpty: true }),
    totalScore: expectString(object.totalScore, `${name}.totalScore`, { allowEmpty: true }),
    rank: expectNumber(object.rank, `${name}.rank`, { integer: true, min: 0 }),
    manifesto: expectString(object.manifesto, `${name}.manifesto`, { allowEmpty: true }),
    radarStats: expectArray(object.radarStats, `${name}.radarStats`).map((entry, index) =>
      validateTeamMetric(entry, `${name}.radarStats[${index}]`),
    ),
    members: expectArray(object.members, `${name}.members`).map((entry, index) =>
      validateTeamMember(entry, `${name}.members[${index}]`),
    ),
  };

  if (object.sample !== undefined) {
    next.sample = expectBoolean(object.sample, `${name}.sample`);
  }

  return next;
}

function validateRuleBlock(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["title", "paragraphs", "items"], name);

  const next = {
    title: expectString(object.title, `${name}.title`, { allowEmpty: true }),
  };

  if (object.paragraphs !== undefined) {
    next.paragraphs = expectStringArray(object.paragraphs, `${name}.paragraphs`, { allowEmpty: true });
  }

  if (object.items !== undefined) {
    next.items = expectStringArray(object.items, `${name}.items`, { allowEmpty: true });
  }

  return next;
}

function validateRuleSection(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["id", "slug", "title", "intro", "blocks"], name);

  return {
    id: expectString(object.id, `${name}.id`),
    slug: expectString(object.slug, `${name}.slug`),
    title: expectString(object.title, `${name}.title`, { allowEmpty: true }),
    intro: expectString(object.intro, `${name}.intro`, { allowEmpty: true }),
    blocks: expectArray(object.blocks, `${name}.blocks`).map((entry, index) =>
      validateRuleBlock(entry, `${name}.blocks[${index}]`),
    ),
  };
}

function validateScoreGroup(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["title", "items"], name);

  return {
    title: expectString(object.title, `${name}.title`, { allowEmpty: true }),
    items: expectStringArray(object.items, `${name}.items`, { allowEmpty: true }),
  };
}

function validateThemeRule(value, name) {
  const object = expectPlainObject(value, name);
  assertNoUnknownKeys(object, ["id", "name", "restrictions", "baseScoring", "scoreGroups", "finalMultiplier", "notes", "penalties"], name);

  return {
    id: expectString(object.id, `${name}.id`),
    name: expectString(object.name, `${name}.name`, { allowEmpty: true }),
    restrictions: expectStringArray(object.restrictions, `${name}.restrictions`, { allowEmpty: true }),
    baseScoring: expectStringArray(object.baseScoring, `${name}.baseScoring`, { allowEmpty: true }),
    scoreGroups: expectArray(object.scoreGroups, `${name}.scoreGroups`).map((entry, index) =>
      validateScoreGroup(entry, `${name}.scoreGroups[${index}]`),
    ),
    finalMultiplier: expectString(object.finalMultiplier, `${name}.finalMultiplier`, { allowEmpty: true }),
    notes: expectStringArray(object.notes, `${name}.notes`, { allowEmpty: true }),
    penalties: expectStringArray(object.penalties, `${name}.penalties`, { allowEmpty: true }),
  };
}

export function validatePublicContentPayload(payload) {
  const object = expectPlainObject(payload, "publicContent");
  assertNoUnknownKeys(object, ["siteMeta", "overviewPanels", "liveBroadcast", "matches", "eventSchedule", "leaderboard", "judgeNotices", "teams", "ruleSections", "themeRules"], "publicContent");

  const siteMeta = expectPlainObject(object.siteMeta, "publicContent.siteMeta");
  assertNoUnknownKeys(siteMeta, ["eventName", "eventCode", "subtitle", "description", "startDate", "locationLabel", "prizePool", "highlights", "ctaLinks"], "publicContent.siteMeta");

  return {
    siteMeta: {
      eventName: expectString(siteMeta.eventName, "publicContent.siteMeta.eventName", { allowEmpty: true }),
      eventCode: expectString(siteMeta.eventCode, "publicContent.siteMeta.eventCode", { allowEmpty: true }),
      subtitle: expectString(siteMeta.subtitle, "publicContent.siteMeta.subtitle", { allowEmpty: true }),
      description: expectString(siteMeta.description, "publicContent.siteMeta.description", { allowEmpty: true }),
      startDate: expectString(siteMeta.startDate, "publicContent.siteMeta.startDate", { allowEmpty: true }),
      locationLabel: expectString(siteMeta.locationLabel, "publicContent.siteMeta.locationLabel", { allowEmpty: true }),
      prizePool: expectArray(siteMeta.prizePool, "publicContent.siteMeta.prizePool").map((entry, index) =>
        validatePrizeItem(entry, `publicContent.siteMeta.prizePool[${index}]`),
      ),
      highlights: expectStringArray(siteMeta.highlights, "publicContent.siteMeta.highlights", { allowEmpty: true }),
      ctaLinks: expectArray(siteMeta.ctaLinks, "publicContent.siteMeta.ctaLinks").map((entry, index) =>
        validateCtaLink(entry, `publicContent.siteMeta.ctaLinks[${index}]`),
      ),
    },
    overviewPanels: expectArray(object.overviewPanels, "publicContent.overviewPanels").map((entry, index) =>
      validateOverviewPanel(entry, `publicContent.overviewPanels[${index}]`),
    ),
    liveBroadcast: validateLiveBroadcast(object.liveBroadcast, "publicContent.liveBroadcast"),
    matches: expectArray(object.matches, "publicContent.matches").map((entry, index) =>
      validateMatch(entry, `publicContent.matches[${index}]`),
    ),
    eventSchedule: expectArray(object.eventSchedule, "publicContent.eventSchedule").map((entry, index) =>
      validateScheduleDay(entry, `publicContent.eventSchedule[${index}]`),
    ),
    leaderboard: expectArray(object.leaderboard, "publicContent.leaderboard").map((entry, index) =>
      validateLeaderboardEntry(entry, `publicContent.leaderboard[${index}]`),
    ),
    judgeNotices: expectStringArray(object.judgeNotices, "publicContent.judgeNotices", { allowEmpty: true }),
    teams: expectArray(object.teams, "publicContent.teams").map((entry, index) =>
      validateTeam(entry, `publicContent.teams[${index}]`),
    ),
    ruleSections: expectArray(object.ruleSections, "publicContent.ruleSections").map((entry, index) =>
      validateRuleSection(entry, `publicContent.ruleSections[${index}]`),
    ),
    themeRules: expectArray(object.themeRules, "publicContent.themeRules").map((entry, index) =>
      validateThemeRule(entry, `publicContent.themeRules[${index}]`),
    ),
  };
}

export function validateLiveBroadcastPatch(payload) {
  const object = expectPlainObject(payload, "liveBroadcastPatch");
  assertNoUnknownKeys(object, ["title", "subtitle", "platform", "status", "startTimeLabel", "href", "roomLabel", "notice"], "liveBroadcastPatch");

  const next = {};
  if ("title" in object) next.title = expectString(object.title, "liveBroadcastPatch.title", { allowEmpty: true });
  if ("subtitle" in object) next.subtitle = expectString(object.subtitle, "liveBroadcastPatch.subtitle", { allowEmpty: true });
  if ("platform" in object) {
    const platform = expectString(object.platform, "liveBroadcastPatch.platform", { allowEmpty: true });
    if (platform && platform !== "bilibili") {
      throw new Error("liveBroadcastPatch.platform must be bilibili.");
    }
    next.platform = platform || "bilibili";
  }
  if ("status" in object) next.status = expectEnum(object.status, "liveBroadcastPatch.status", broadcastStatusSet);
  if ("startTimeLabel" in object) next.startTimeLabel = expectString(object.startTimeLabel, "liveBroadcastPatch.startTimeLabel", { allowEmpty: true });
  if ("href" in object) next.href = validateUrl(object.href, "liveBroadcastPatch.href", { allowEmpty: true });
  if ("roomLabel" in object) next.roomLabel = expectString(object.roomLabel, "liveBroadcastPatch.roomLabel", { allowEmpty: true });
  if ("notice" in object) next.notice = expectString(object.notice, "liveBroadcastPatch.notice", { allowEmpty: true });

  return next;
}

export function validateMatchPatch(payload) {
  const object = expectPlainObject(payload, "matchPatch");
  assertNoUnknownKeys(object, ["phase", "startTime", "status", "teamId", "totalScore", "currentMemberId", "currentMemberName", "members", "playersList", "note"], "matchPatch");

  const next = {};
  if ("phase" in object) next.phase = expectString(object.phase, "matchPatch.phase", { allowEmpty: true });
  if ("startTime" in object) next.startTime = expectString(object.startTime, "matchPatch.startTime", { allowEmpty: true });
  if ("status" in object) next.status = expectEnum(object.status, "matchPatch.status", matchStatusSet);
  if ("teamId" in object) next.teamId = expectString(object.teamId, "matchPatch.teamId");
  if ("totalScore" in object) next.totalScore = expectString(object.totalScore, "matchPatch.totalScore", { allowEmpty: true });
  if ("currentMemberId" in object) next.currentMemberId = expectOptionalString(object.currentMemberId, "matchPatch.currentMemberId", { allowEmpty: false });
  if ("currentMemberName" in object) next.currentMemberName = expectOptionalString(object.currentMemberName, "matchPatch.currentMemberName", { allowEmpty: true });
  if ("members" in object) {
    next.members = expectArray(object.members, "matchPatch.members").map((entry, index) =>
      validateMatchMember(entry, `matchPatch.members[${index}]`),
    );
  }
  if ("playersList" in object) {
    next.playersList = expectStringArray(object.playersList, "matchPatch.playersList", { allowEmpty: false });
  }
  if ("note" in object) next.note = expectOptionalString(object.note, "matchPatch.note", { allowEmpty: true });

  return next;
}

export function validateCompliancePatch(payload) {
  const object = expectPlainObject(payload, "compliancePatch");
  assertNoUnknownKeys(object, ["pressureMemberId", "openingIngots", "currentIngots", "overtimeMinutes", "notes"], "compliancePatch");

  const next = {};
  if ("pressureMemberId" in object) {
    if (object.pressureMemberId === null) {
      next.pressureMemberId = null;
    } else {
      next.pressureMemberId = expectString(object.pressureMemberId, "compliancePatch.pressureMemberId");
    }
  }
  if ("openingIngots" in object) next.openingIngots = expectNumber(object.openingIngots, "compliancePatch.openingIngots", { integer: true, min: 0 });
  if ("currentIngots" in object) next.currentIngots = expectNumber(object.currentIngots, "compliancePatch.currentIngots", { integer: true, min: 0 });
  if ("overtimeMinutes" in object) next.overtimeMinutes = expectNumber(object.overtimeMinutes, "compliancePatch.overtimeMinutes", { integer: true, min: 0 });
  if ("notes" in object) next.notes = expectStringArray(object.notes, "compliancePatch.notes", { allowEmpty: true });

  return next;
}

export function validateOperatorDraftPayload(payload) {
  const object = expectPlainObject(payload, "operatorDraft");
  assertNoUnknownKeys(object, ["memberId", "operatorName", "rarity", "isTemporaryRecruit", "note"], "operatorDraft");

  return {
    memberId: expectString(object.memberId, "operatorDraft.memberId"),
    operatorName: expectString(object.operatorName, "operatorDraft.operatorName"),
    rarity: object.rarity === undefined ? 6 : expectNumber(object.rarity, "operatorDraft.rarity", { integer: true, min: 1 }),
    isTemporaryRecruit:
      object.isTemporaryRecruit === undefined
        ? false
        : expectBoolean(object.isTemporaryRecruit, "operatorDraft.isTemporaryRecruit"),
    note: object.note === undefined ? "" : expectString(object.note, "operatorDraft.note", { allowEmpty: true }),
  };
}

export function validatePlannedPickPayload(payload) {
  const object = expectPlainObject(payload, "plannedPick");
  assertNoUnknownKeys(object, ["operatorName", "rarity"], "plannedPick");

  const rarity = object.rarity === undefined ? 6 : expectNumber(object.rarity, "plannedPick.rarity", { integer: true, min: 1 });
  if (rarity !== 6) {
    throw new Error("plannedPick.rarity must be 6.");
  }

  return {
    operatorName: expectString(object.operatorName, "plannedPick.operatorName"),
    rarity,
  };
}

export function validateCoachCallPayload(payload) {
  const object = expectPlainObject(payload, "coachCall");
  assertNoUnknownKeys(object, ["requestedByMemberId", "targetMemberId", "durationMinutes", "note"], "coachCall");

  return {
    requestedByMemberId: expectString(object.requestedByMemberId, "coachCall.requestedByMemberId"),
    targetMemberId: expectString(object.targetMemberId, "coachCall.targetMemberId"),
    durationMinutes: expectNumber(object.durationMinutes, "coachCall.durationMinutes", { min: 0.01, max: 3 }),
    note: object.note === undefined ? "" : expectString(object.note, "coachCall.note", { allowEmpty: true }),
  };
}

export function validateScoreSheetStatusPayload(payload) {
  const object = expectPlainObject(payload, "scoreSheetStatus");
  assertNoUnknownKeys(object, ["status"], "scoreSheetStatus");

  const status = expectString(object.status, "scoreSheetStatus.status");
  if (!scoreStatusSet.has(status)) {
    throw new Error("scoreSheetStatus.status has an unsupported value.");
  }

  return { status };
}

export function validateScoreSheetQueryFilters(filters) {
  const next = {};
  if (filters.teamId) next.teamId = expectString(filters.teamId, "scoreSheetFilters.teamId");
  if (filters.memberId) next.memberId = expectString(filters.memberId, "scoreSheetFilters.memberId");
  if (filters.theme) {
    const theme = expectString(filters.theme, "scoreSheetFilters.theme");
    if (!themeCodeSet.has(theme)) {
      throw new Error("scoreSheetFilters.theme has an unsupported value.");
    }
    next.theme = theme;
  }
  if (filters.status) {
    const status = expectString(filters.status, "scoreSheetFilters.status");
    if (!scoreStatusSet.has(status)) {
      throw new Error("scoreSheetFilters.status has an unsupported value.");
    }
    next.status = status;
  }
  if (Object.prototype.hasOwnProperty.call(filters, "matchId")) {
    if (filters.matchId === undefined) {
      next.matchId = undefined;
    } else if (filters.matchId === null || filters.matchId === "") {
      next.matchId = null;
    } else {
      next.matchId = expectString(filters.matchId, "scoreSheetFilters.matchId");
    }
  }

  return next;
}

export function validateSoloCalcPayload(payload) {
  const object = expectPlainObject(payload, "soloCalcPayload");
  const theme = expectString(object.theme, "soloCalcPayload.theme");
  if (!["team", ...THEME_CODES].includes(theme)) {
    throw new Error(`soloCalcPayload.theme must be one of: team, ${THEME_CODES.join(", ")}.`);
  }

  const snapshot = expectPlainObject(object.snapshot, "soloCalcPayload.snapshot");
  return { theme, snapshot };
}
