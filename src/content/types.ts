export type LinkKind = "internal" | "external";

export interface CtaLink {
  label: string;
  href: string;
  kind: LinkKind;
}

export interface PrizeItem {
  label: string;
  value: string;
}

export interface SiteMeta {
  eventName: string;
  eventCode: string;
  subtitle: string;
  description: string;
  startDate: string;
  locationLabel: string;
  prizePool: PrizeItem[];
  highlights: string[];
  ctaLinks: CtaLink[];
}

export type MatchStatus = "IN_PROGRESS" | "PENDING" | "FINISHED";
export type MemberRunStatus = "LIVE" | "PENDING" | "FINISHED";
export type BroadcastStatus = "LIVE" | "UPCOMING" | "OFFLINE";

export interface LiveBroadcastMeta {
  title: string;
  subtitle: string;
  platform: "bilibili";
  status: BroadcastStatus;
  startTimeLabel: string;
  href: string;
  roomLabel: string;
  notice: string;
}

export interface MatchMember {
  id: string;
  name: string;
  theme: string;
  score: number;
  multiplier: number;
  status: MemberRunStatus;
  queueOrder: number;
}

export interface Match {
  id: string;
  phase: string;
  startTime: string;
  status: MatchStatus;
  teamId: string;
  totalScore: string;
  currentMemberId?: string;
  currentMemberName?: string;
  members?: MatchMember[];
  playersList?: string[];
  note?: string;
}

export interface LeaderboardEntry {
  teamId: string;
  name: string;
  details: string;
  total: string;
  currentMember?: string;
  currentStatus?: MemberRunStatus;
  teamStatus?: MatchStatus;
}

export type SchedulePeriod = "早" | "中" | "晚";

export type ScheduleSlotTone = "default" | "alert" | "featured";

export interface ScheduleSlot {
  period: SchedulePeriod;
  time: string;
  player: string;
  teamId?: string;
  note?: string;
  tone?: ScheduleSlotTone;
}

export interface ScheduleDay {
  date: string;
  weekday: string;
  slots: ScheduleSlot[];
}

export interface TeamMetric {
  label: string;
  value: number;
}

export interface TeamMemberOperatorPick {
  id: string;
  operatorName: string;
  rarity: number;
  createdAt: string;
}

export interface TeamMemberProfile {
  id: string;
  name: string;
  role: string;
  theme: string;
  signatureOp: string;
  squad: string;
  note: string;
  avatar?: string;
  operatorPicks?: TeamMemberOperatorPick[];
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  enName: string;
  status: string;
  sample?: boolean;
  totalScore: string;
  rank: number;
  manifesto: string;
  radarStats: TeamMetric[];
  members: TeamMemberProfile[];
}

export interface RuleBlock {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

export interface RuleSection {
  id: string;
  slug: string;
  title: string;
  intro: string;
  blocks: RuleBlock[];
}

export interface ScoreGroup {
  title: string;
  items: string[];
}

export interface ThemeRule {
  id: string;
  name: string;
  restrictions: string[];
  baseScoring: string[];
  scoreGroups: ScoreGroup[];
  finalMultiplier: string;
  notes: string[];
  penalties: string[];
}

