import type { LeaderboardEntry } from "../content";

interface LeaderboardProps {
  teams: LeaderboardEntry[];
  advancementCutoff?: number;
}

export function Leaderboard({ teams, advancementCutoff = 3 }: LeaderboardProps) {
  return (
    <div className="hud-panel overflow-hidden">
      <div className="grid grid-cols-12 gap-3 border-b border-white/10 px-4 py-3 font-display text-[11px] tracking-[0.28em] text-white/45">
        <div className="col-span-1 text-center">RK</div>
        <div className="col-span-5">TEAM</div>
        <div className="col-span-3 text-right">DETAIL</div>
        <div className="col-span-3 text-right text-accent">TOTAL</div>
      </div>
      <div>
        {teams.map((team, index) => {
          const isCutoff = index === advancementCutoff - 1;
          return (
            <div key={team.teamId}>
              <div className={`grid grid-cols-12 gap-3 px-4 py-4 transition hover:bg-white/5 ${index < advancementCutoff ? "bg-white/[0.02]" : ""}`}>
                <div className={`col-span-1 text-center font-display text-xl font-black ${index === 0 ? "text-accent" : "text-white/55"}`}>
                  {index + 1}
                </div>
                <div className="col-span-5 truncate font-display text-lg font-bold uppercase tracking-[0.08em] text-white">
                  {team.name}
                </div>
                <div className="col-span-3 text-right text-[11px] text-white/45">{team.details}</div>
                <div className="col-span-3 text-right font-display text-xl font-black text-accent">{team.total}</div>
              </div>
              {isCutoff ? (
                <div className="relative my-2 flex h-8 items-center justify-center">
                  <div className="absolute inset-x-0 h-px bg-red-500/55" />
                  <div className="relative bg-base px-4 font-display text-[11px] tracking-[0.32em] text-red-400">
                    ADVANCEMENT CUTOFF // 晋级线
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
