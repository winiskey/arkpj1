/* ─── Unified Admin API client ─────────────────────────────────────── */
/* Centralises auth token injection, error handling, and typed         */
/* wrappers for every backend admin endpoint.                          */

import type {
    AdminBootstrap,
    BroadcastStatus,
    ScoreSheet,
    OperatorDraft,
    CoachCall,
    ComplianceSummary,
    TeamAggregate,
    MatchStatus,
} from "./types";

// ── Token management ───────────────────────────────────────────────

const TOKEN_KEY = "adminToken";

export function getAdminToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

// ── Typed fetch wrapper ────────────────────────────────────────────

class AdminApiError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
        this.name = "AdminApiError";
    }
}

export { AdminApiError };

async function adminFetch<T = unknown>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = getAdminToken();
    if (!token) {
        throw new AdminApiError(401, "未登录：缺少管理员令牌");
    }

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        ...((options.headers as Record<string, string>) ?? {}),
    };

    if (options.body && typeof options.body === "string") {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(path, { ...options, headers });

    if (!response.ok) {
        let errorMessage: string;
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.error ?? errorBody.message ?? response.statusText;
        } catch {
            errorMessage = response.statusText;
        }
        throw new AdminApiError(response.status, errorMessage);
    }

    // Some endpoints return 204 No Content
    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

// ── Auth ───────────────────────────────────────────────────────────

export async function verifyToken(token: string): Promise<boolean> {
    try {
        const response = await fetch("/api/admin/ops/bootstrap", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.ok;
    } catch {
        return false;
    }
}

// ── Bootstrap ──────────────────────────────────────────────────────

export async function fetchBootstrap(): Promise<AdminBootstrap> {
    return adminFetch<AdminBootstrap>("/api/admin/ops/bootstrap");
}

// ── Solo Calculator ────────────────────────────────────────────────

export interface SoloCalcResult {
    previewScore: number;
    formulaText: string;
    rawScore?: number;
    multiplier?: number;
}

export async function calculateSoloScore(
    theme: string,
    snapshot: Record<string, unknown>,
): Promise<SoloCalcResult> {
    return adminFetch<SoloCalcResult>("/api/admin/calculator/solo", {
        method: "POST",
        body: JSON.stringify({ theme, snapshot }),
    });
}

// ── Live Broadcast ─────────────────────────────────────────────────

export async function patchLiveBroadcast(
    patch: Partial<{
        title: string;
        subtitle: string;
        status: BroadcastStatus;
        startTimeLabel: string;
        href: string;
        roomLabel: string;
        notice: string;
    }>,
): Promise<void> {
    await adminFetch("/api/admin/live-broadcast", {
        method: "PATCH",
        body: JSON.stringify(patch),
    });
}

// ── Matches ────────────────────────────────────────────────────────

export async function patchMatch(
    matchId: string,
    patch: Partial<{ status: MatchStatus; currentMemberId: string | null; note: string }>,
): Promise<void> {
    await adminFetch(`/api/admin/matches/${matchId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
    });
}

// ── Score Sheets ───────────────────────────────────────────────────

export async function upsertScoreSheet(payload: {
    teamId: string;
    memberId: string;
    matchId?: string | null;
    theme: string;
    snapshot: Record<string, unknown>;
    previewScore?: number;
    formulaText?: string;
    note?: string;
    calculatorVersion?: string;
}): Promise<{ scoreSheet: ScoreSheet }> {
    return adminFetch("/api/admin/score-sheets/upsert", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function patchScoreSheetStatus(
    sheetId: string,
    status: string,
): Promise<void> {
    await adminFetch(`/api/admin/score-sheets/${sheetId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}

export async function deleteScoreSheet(sheetId: string): Promise<void> {
    await adminFetch(`/api/admin/score-sheets/${sheetId}`, {
        method: "DELETE",
    });
}

// ── Compliance ─────────────────────────────────────────────────────

export async function patchCompliance(
    teamId: string,
    patch: Partial<{
        pressureMemberId: string | null;
        openingIngots: number;
        currentIngots: number;
        overtimeMinutes: number;
        notes: string[];
    }>,
): Promise<{ compliance: ComplianceSummary }> {
    return adminFetch(`/api/admin/teams/${teamId}/compliance`, {
        method: "PATCH",
        body: JSON.stringify(patch),
    });
}

export async function addOperatorDraft(
    teamId: string,
    payload: {
        memberId: string;
        operatorName: string;
        rarity?: number;
        isTemporaryRecruit?: boolean;
        note?: string;
    },
): Promise<{ draft: OperatorDraft }> {
    return adminFetch(`/api/admin/teams/${teamId}/operators`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function addPlannedPick(
    teamId: string,
    memberId: string,
    payload: {
        operatorName: string;
        rarity?: number;
    },
): Promise<void> {
    await adminFetch(`/api/admin/teams/${teamId}/members/${memberId}/planned-picks`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function deletePlannedPick(
    teamId: string,
    memberId: string,
    pickId: string,
): Promise<void> {
    await adminFetch(`/api/admin/teams/${teamId}/members/${memberId}/planned-picks/${pickId}`, {
        method: "DELETE",
    });
}

export async function deleteOperatorDraft(
    teamId: string,
    draftId: string,
): Promise<void> {
    await adminFetch(`/api/admin/teams/${teamId}/operators/${draftId}`, {
        method: "DELETE",
    });
}

export async function addCoachCall(
    teamId: string,
    payload: {
        requestedByMemberId: string;
        targetMemberId: string;
        durationMinutes: number;
        note?: string;
    },
): Promise<{ call: CoachCall }> {
    return adminFetch(`/api/admin/teams/${teamId}/calls`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function deleteCoachCall(
    teamId: string,
    callId: string,
): Promise<void> {
    await adminFetch(`/api/admin/teams/${teamId}/calls/${callId}`, {
        method: "DELETE",
    });
}

// ── Publishing ─────────────────────────────────────────────────────

export async function publishTeam(
    teamId: string,
): Promise<{ aggregate: TeamAggregate }> {
    return adminFetch(`/api/admin/teams/${teamId}/publish`, {
        method: "POST",
    });
}
