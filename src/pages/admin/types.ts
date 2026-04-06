/* ─── Admin UI type definitions ────────────────────────────────────── */
/* Mirror of `server/app/domain.mjs` structures used by Admin APIs.    */

// ── Enums ──────────────────────────────────────────────────────────

export type ThemeCode = "sami" | "sarkaz" | "sui";
export type FinalsTrackCode = "sami" | "sarkaz_chou" | "sarkaz_meiyuan" | "sui";
export type ScoreSheetStatus = "draft" | "final" | "published";
export type MatchStatus = "IN_PROGRESS" | "PENDING" | "FINISHED";
export type MemberRunStatus = "LIVE" | "PENDING" | "FINISHED";
export type BroadcastStatus = "LIVE" | "UPCOMING" | "OFFLINE";

// ── Team & Member ──────────────────────────────────────────────────

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    theme: string;
    signatureOp: string;
    squad: string;
    note: string;
    avatar?: string;
    operatorPicks?: OperatorCatalogPick[];
}

export interface OperatorCatalogPick {
    id: string;
    operatorName: string;
    rarity: number;
    createdAt: string;
}

export interface FinalsPick {
    id: string;
    operatorName: string;
    rarity: number;
    createdAt: string;
}

export interface FinalsTrackConfig {
    enabled: boolean;
    firstPickTeamId: string | null;
    picksByTeamId: Record<string, FinalsPick[]>;
    updatedAt?: string;
}

export interface FinalsSarkazLaneAssignment {
    chouMemberId: string | null;
    meiyuanMemberId: string | null;
}

export interface FinalsConfig {
    enabled: boolean;
    teamAId: string | null;
    teamBId: string | null;
    tracks: Record<FinalsTrackCode, FinalsTrackConfig>;
    sarkazLaneAssignments: Record<string, FinalsSarkazLaneAssignment>;
    updatedAt: string;
}

export interface FinalsValidation {
    enabled: boolean;
    pickEnabled: boolean;
    configured: boolean;
    trackCode: FinalsTrackCode | null;
    trackLabel: string | null;
    firstPickTeamId: string | null;
    ownPicks: string[];
    opponentPicks: string[];
    activeOperators: string[];
    outsidePoolOperators: string[];
    opponentPickedOperators: string[];
    suggestedPenalty: number;
    messages: string[];
}

export interface TeamMetric {
    label: string;
    value: number;
}

export interface Team {
    id: string;
    name: string;
    tag: string;
    enName: string;
    status: string;
    totalScore: string;
    rank: number;
    manifesto: string;
    radarStats: TeamMetric[];
    members: TeamMember[];
    sample?: boolean;
}

// ── Match ──────────────────────────────────────────────────────────

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
    currentMemberId?: string | null;
    currentMemberName?: string | null;
    members?: MatchMember[];
    playersList?: string[];
    note?: string;
}

// ── Live Broadcast ─────────────────────────────────────────────────

export interface LiveBroadcast {
    title: string;
    subtitle: string;
    platform: string;
    status: BroadcastStatus;
    startTimeLabel: string;
    href: string;
    roomLabel: string;
    notice: string;
}

// ── Score Sheet ────────────────────────────────────────────────────

export interface ScoreSheet {
    id: string;
    teamId: string;
    memberId: string;
    matchId: string | null;
    theme: ThemeCode;
    snapshot: Record<string, unknown>;
    previewScore: number;
    formulaText: string;
    note: string;
    status: ScoreSheetStatus;
    calculatorVersion: string;
    createdAt: string;
    updatedAt: string;
}

// ── Compliance ─────────────────────────────────────────────────────

export interface OperatorDraft {
    id: string;
    memberId: string;
    operatorName: string;
    rarity: number;
    isTemporaryRecruit: boolean;
    note: string;
    createdAt: string;
}

export interface OperatorCatalogEntry {
    id: string;
    name: string;
    rarity: number;
    avatarUrl: string | null;
    searchText: string;
}

export interface CoachCall {
    id: string;
    requestedByMemberId: string;
    targetMemberId: string;
    durationMinutes: number;
    note: string;
    createdAt: string;
}

export interface ComplianceRecord {
    teamId: string;
    pressureMemberId: string | null;
    openingIngots: number;
    currentIngots: number;
    overtimeMinutes: number;
    operatorDrafts: OperatorDraft[];
    coachCalls: CoachCall[];
    notes: string[];
    updatedAt: string;
}

// ── Compliance Summary (from buildTeamComplianceSummary) ───────────

export interface CoefficientBreakdown {
    initialValue: number;
    overtime: { minutes: number; stepMinutes: number; steps: number; delta: number };
    duplicateSixStars: {
        duplicateCount: number;
        groups: { operatorName: string; memberIds: string[] }[];
        delta: number;
    };
    extraShopSpend: { spent: number; limit: number; excess: number; delta: number };
    totalDelta: number;
    finalValue: number;
}

export interface ComplianceSummary {
    teamId: string;
    teamName: string;
    teamTag: string;
    roster: {
        expectedSize: number;
        actualSize: number;
        missingMembers: number;
        pressureMemberId: string | null;
        pressureMemberName: string | null;
        pressureRoleValid: boolean;
    };
    sharedIngots: {
        openingIngots: number;
        currentIngots: number;
        spent: number;
        limit: number;
        withinLimit: boolean;
    };
    coachCalls: {
        totalCount: number;
        maxCount: number;
        maxMinutesPerCall: number;
        overDurationCalls: CoachCall[];
        records: CoachCall[];
    };
    operators: {
        duplicateSixStars: { operatorName: string; memberIds: string[]; entries: OperatorDraft[] }[];
        duplicateCount: number;
        records: OperatorDraft[];
    };
    overtime: { minutes: number };
    notes: string[];
    coefficient: number;
    coefficientBreakdown: CoefficientBreakdown;
    blockingIssues: string[];
    warnings: string[];
}

// ── Team Aggregate (from buildTeamAggregate) ───────────────────────

export interface MemberAggregate {
    memberId: string;
    name: string;
    role: string;
    expectedTheme: string;
    themeCode: ThemeCode | null;
    sheet: ScoreSheet | null;
    score: number;
    pressureApplied: boolean;
    pressureBonus: number;
    adjustedScore: number;
}

export interface TeamAggregate {
    teamId: string;
    teamName: string;
    teamTag: string;
    status: {
        key: string;
        label: string;
    };
    memberCount: number;
    scoredCount: number;
    finalizedCount: number;
    publishedCount: number;
    publishReady: boolean;
    rawTotal: number;
    pressureBonus: number;
    preCoefficientTotal: number;
    coefficient: number;
    coefficientBreakdown: CoefficientBreakdown;
    finalTotal: number;
    teamTotal: number;
    formatted: {
        rawTotal: string;
        pressureBonus: string;
        preCoefficientTotal: string;
        coefficient: string;
        finalTotal: string;
        teamTotal: string;
    };
    pressureMemberId: string | null;
    pressureMemberName: string | null;
    nextPendingMemberName: string | null;
    publishBlockingIssues: string[];
    warnings: string[];
    members: MemberAggregate[];
    compliance: ComplianceSummary;
    updatedAt: string | null;
}

// ── Score Sheet Summary (lightweight, from summariseScoreSheet) ────

export interface ScoreSheetSummary {
    id: string;
    teamId: string;
    memberId: string;
    matchId: string | null;
    theme: ThemeCode;
    status: ScoreSheetStatus;
    previewScore: number;
    formulaText: string;
    updatedAt: string;
}

// ── Bootstrap Payload (from /api/admin/ops/bootstrap) ──────────────

export interface AdminBootstrap {
    publicContent: {
        siteMeta: Record<string, unknown>;
        overviewPanels: { title: string; label: string; content: string }[];
        liveBroadcast: LiveBroadcast;
        matches: Match[];
        eventSchedule: unknown[];
        leaderboard: unknown[];
        judgeNotices: string[];
        teams: Team[];
        ruleSections: unknown[];
        themeRules: unknown[];
    };
    ruleVersion: string;
    tournamentConfig: Record<string, unknown>;
    finalsConfig: FinalsConfig;
    opsState: {
        version: number;
        updatedAt: string;
        complianceByTeam: Record<string, ComplianceRecord>;
    };
    scoreSheets: ScoreSheetSummary[];
    compliance: ComplianceSummary[];
    aggregates: TeamAggregate[];
}

