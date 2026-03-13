import type { LeaderboardEntry, MatchStatus, MemberRunStatus } from "../content";
import { CountUp } from "./CountUp";
import { SpotlightCard } from "./SpotlightCard";

interface TeamLeaderboardProps {
  teams: LeaderboardEntry[];
}

const rowTone: Record<MatchStatus, string> = {
  IN_PROGRESS: "border-brand/20 bg-brand/5 shadow-[0_10px_30px_-10px_rgba(214,192,138,0.2)]",
  PENDING: "border-white/5 bg-white/[0.015]",
  FINISHED: "border-white/5 bg-white/[0.03] opacity-80",
};

const currentTone: Record<MemberRunStatus, string> = {
  LIVE: "text-brand",
  PENDING: "text-white/40",
  FINISHED: "text-white/50",
};

const currentLabel: Record<MemberRunStatus, string> = {
  LIVE: "进行中",
  PENDING: "待命",
  FINISHED: "已结束",
};

export function TeamLeaderboard({ teams }: TeamLeaderboardProps) {
  return (
    <div className="space-y-4">
      {teams.map((team, index) => (
        <SpotlightCard
          key={team.teamId}
          spotlightColor="rgba(255,255,255,0.04)"
          className={`group flex cursor-pointer flex-col gap-4 rounded-[32px] border px-5 py-5 backdrop-blur-2xl transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-white/10 md:flex-row md:items-center md:justify-between md:px-6 md:py-5 ${rowTone[team.teamStatus ?? "PENDING"]}`}
        >
          <div className="flex min-w-0 items-center gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border font-display text-lg font-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${index < 3 ? "border-brand/30 bg-brand text-black shadow-[0_0_20px_rgba(214,192,138,0.4)]" : "border-white/5 bg-white/[0.04] text-white/50"
                }`}
            >
              {index + 1}
            </div>
            <div className="min-w-0">
              <div className="truncate font-title text-[1.7rem] font-black tracking-[0.03em] text-white/80 transition-colors group-hover:text-brand">{team.name}</div>
              <div className="mt-1 truncate text-sm text-white/40">{team.details}</div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(180px,1fr)_minmax(112px,auto)] md:items-center md:justify-end">
            <div className="rounded-[24px] border border-white/5 bg-white/[0.02] px-4 py-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
              <div className="font-display text-[11px] uppercase tracking-[0.16em] text-white/30">当前成员</div>
              <div className={`mt-2 text-sm font-semibold ${currentTone[team.currentStatus ?? "PENDING"]}`}>
                {team.currentMember ?? "待定"}
                <span className="ml-2 text-xs text-white/30">{currentLabel[team.currentStatus ?? "PENDING"]}</span>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/5 bg-white/[0.04] px-5 py-3 text-right shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
              <div className="font-display text-[11px] uppercase tracking-[0.16em] text-white/30">队伍总分</div>
              <div className="mt-2 font-display text-2xl font-black tracking-[0.03em] text-white/80">
                <CountUp end={team.total} />
              </div>
            </div>
          </div>
        </SpotlightCard>
      ))}
    </div>
  );
}
