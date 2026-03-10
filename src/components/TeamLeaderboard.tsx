import type { LeaderboardEntry, MatchStatus, MemberRunStatus } from "../content";
import { CountUp } from "./CountUp";

interface TeamLeaderboardProps {
  teams: LeaderboardEntry[];
}

const rowTone: Record<MatchStatus, string> = {
  IN_PROGRESS: "border-y-accent/30 border-r-accent/30 border-l-[3px] border-l-accent bg-gradient-to-r from-accent/10 to-transparent",
  PENDING: "border-y-white/5 border-r-white/5 border-l-[3px] border-l-white/20 bg-white/[0.02] hover:bg-white/[0.04]",
  FINISHED: "border-y-white/10 border-r-white/10 border-l-[3px] border-l-white/10 bg-black/40 opacity-80",
};

const currentTone: Record<MemberRunStatus, string> = {
  LIVE: "text-accent drop-shadow-sm",
  PENDING: "text-white/40",
  FINISHED: "text-white/60",
};

const currentLabel: Record<MemberRunStatus, string> = {
  LIVE: "进行中",
  PENDING: "待命",
  FINISHED: "已结束",
};

export function TeamLeaderboard({ teams }: TeamLeaderboardProps) {
  return (
    <div className="space-y-2">
      {teams.map((team, index) => (
        <article
          key={team.teamId}
          className={`group hud-panel relative flex flex-col md:flex-row md:items-center justify-between gap-3 border p-2.5 pl-0 transition-all duration-snappy hover:-translate-y-[2px] hover:border-r-white/20 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] ${rowTone[team.teamStatus ?? "PENDING"]} hover:border-l-accent`}
        >
          {/* Rank & Name Info */}
          <div className="flex min-w-0 items-center gap-4 pl-3">
            {/* Rank geometric badge with custom clip-path */}
            <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center font-display text-xl font-black ${index < 3
                ? "text-black bg-accent [clip-path:polygon(100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_0)] shadow-glow"
                : "text-white/60 bg-white/10 border-t border-l border-white/20 [clip-path:polygon(100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_0)]"
              }`}>
              {index + 1}
            </div>

            {/* Name */}
            <div className="min-w-0 pt-0.5">
              <div className="font-display text-lg font-black uppercase tracking-wider text-white/90 transition-colors group-hover:text-accent">
                {team.name}
              </div>
              <div className="text-[11px] leading-tight text-mute mt-0.5 truncate">{team.details}</div>
            </div>
          </div>

          {/* Data Columns */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 px-3 md:px-0">
            {/* Current Member */}
            <div className="md:border-l border-white/10 md:pl-5">
              <div className="font-display text-[10px] tracking-[0.15em] text-mute uppercase">当前成员 / Current</div>
              <div className={`mt-1 text-[13px] font-semibold tracking-wider ${currentTone[team.currentStatus ?? "PENDING"]}`}>
                {team.currentMember ?? "待定"} <span className="text-white/20 mx-1 font-normal">/</span> <span className="text-xs">{currentLabel[team.currentStatus ?? "PENDING"]}</span>
              </div>
            </div>

            {/* Total Score Box */}
            <div className="md:border-l border-white/10 md:pl-5 md:pr-4 flex items-center justify-end">
              <div className="text-right flex flex-col items-end">
                <div className="font-display text-[10px] tracking-[0.15em] text-mute uppercase">队伍总分 / Score</div>
                <div className="mt-1 font-display text-xl font-black text-white px-3 py-0.5 bg-black/60 border border-t-white/10 border-r-white/10 border-b-transparent border-l-transparent flex items-center justify-center min-w-[84px] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)] shadow-inner">
                  <CountUp end={team.total} />
                </div>
              </div>

              {/* Status Indicator Dot (Desktop only) */}
              <div className="hidden md:flex shrink-0 items-center justify-center w-6 ml-3">
                <div className={`h-1.5 w-1.5 rounded-full ${team.teamStatus === 'IN_PROGRESS' ? 'bg-accent shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse' : 'bg-white/10'}`} />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}