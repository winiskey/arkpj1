import type { MatchMember, MemberRunStatus } from "../content";
import { SpotlightCard } from "./SpotlightCard";

interface ParallelStatusCardProps {
  teamName: string;
  status: string;
  members: MatchMember[];
  totalScore: string;
}

const statusTone: Record<MemberRunStatus, string> = {
  LIVE: "border-brand/40 bg-gradient-to-r from-brand/20 to-brand/5 text-brand shadow-[0_0_15px_-3px_rgba(214,192,138,0.4)]",
  PENDING: "border-white/5 bg-white/[0.02] text-white/40",
  FINISHED: "border-white/5 bg-white/[0.05] text-white/60",
};

const statusLabel: Record<MemberRunStatus, string> = {
  LIVE: "进行中",
  PENDING: "未开始",
  FINISHED: "已结束",
};

export function ParallelStatusCard({ teamName, status, members, totalScore }: ParallelStatusCardProps) {
  const currentMember = members.find((member) => member.status === "LIVE")
    ?? members.find((member) => member.status === "PENDING")
    ?? members[members.length - 1];
  const standbyMember = members.find((member) => member.queueOrder > currentMember.queueOrder && member.status === "PENDING");
  const otherMembers = members.filter((member) => member.id !== currentMember.id);

  return (
    <SpotlightCard glowBorder spotlightColor="rgba(255,255,255,0.06)" className="group relative overflow-hidden rounded-[32px] border border-brand/20 bg-white/[0.02] p-6 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl transition-[border-color] duration-300 hover:border-brand/30 md:p-8">
      {/* Reduced background glare, more elegant glass reflection */}
      <div className="pointer-events-none absolute right-0 top-0 h-[150%] w-[150%] -translate-y-1/4 translate-x-1/4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(214,192,138,0.06),transparent_50%)] opacity-70 mix-blend-screen" />

      {/* More subtle background text watermark */}
      <div className="pointer-events-none absolute -right-4 top-8 font-display text-[90px] font-black tracking-tighter text-white/[0.02] md:text-[110px]">
        {teamName.slice(0, 3).toUpperCase()}
      </div>

      <div className="relative z-10 mb-8 flex flex-col gap-4 border-b border-white/5 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          {/* Replaced 'animate-pulse' with 'animate-pulse-subtle' and removed aggressive glows */}
          <div className="inline-flex items-center gap-2 rounded bg-gradient-to-r from-brand/80 to-brand/40 px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-black shadow-none">
            <span className="h-1.5 w-1.5 rounded-full bg-black/80 animate-pulse-subtle" />
            {status}
          </div>
          <h3 className="mt-4 font-display text-2xl font-black uppercase tracking-[0.1em] text-white/90">
            {teamName}
          </h3>
        </div>
        <div className="text-left md:text-right">
          <div className="font-display text-[10px] tracking-[0.2em] text-brand/60">当前总分</div>
          <div className="mt-1 font-display text-4xl font-black text-white drop-shadow-md">
            {totalScore}
          </div>
        </div>
      </div>

      <div className="relative z-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[24px] border border-brand/15 bg-white/[0.02] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <div className="relative z-10 font-display text-[10px] font-bold tracking-[0.2em] text-brand/70">正在比赛</div>
          <div className="relative z-10 mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-display text-2xl font-black uppercase tracking-[0.05em] text-white/90">
                {currentMember.name}
              </div>
              <div className="mt-1 text-xs text-white/40">{currentMember.theme}</div>
            </div>
            <div className={`rounded-full border px-3 py-1 font-bold text-[10px] tracking-[0.15em] ${statusTone[currentMember.status]}`}>
              {statusLabel[currentMember.status]}
            </div>
          </div>

          <div className="mt-8 grid gap-4 grid-cols-3">
            <div className="flex flex-col justify-end border-l border-white/10 pl-4">
              <div className="font-display text-[10px] tracking-[0.2em] text-white/30 mb-1">得分</div>
              <div className="font-display text-3xl font-bold text-white/90 leading-none">{currentMember.score}</div>
            </div>
            <div className="flex flex-col justify-end border-l border-white/10 pl-4">
              <div className="font-display text-[10px] tracking-[0.2em] text-white/30 mb-1">系数</div>
              <div className="font-display text-2xl font-bold text-white/80 leading-none">x{currentMember.multiplier}</div>
            </div>
            <div className="flex flex-col justify-end border-l border-brand/20 pl-4">
              <div className="font-display text-[10px] tracking-[0.2em] text-brand/50 mb-1">候补</div>
              <div className="font-display text-lg font-bold tracking-[0.05em] text-white/70 leading-none truncate">
                {standbyMember?.name ?? "暂无"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
          {otherMembers.map((member) => (
            <div key={`${teamName}-${member.name}`} className="flex items-center justify-between rounded-[20px] border border-white/5 bg-white/[0.015] p-4 transition-colors duration-300 hover:border-white/10 hover:bg-white/[0.03]">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="font-display text-sm font-bold tracking-[0.05em] text-white/80 transition-colors group-hover:text-brand">{member.name}</div>
                  <div className={`rounded border px-2 py-0.5 font-bold text-[9px] tracking-[0.1em] ${statusTone[member.status]}`}>
                    {statusLabel[member.status]}
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-white/30">{member.theme}</div>
              </div>
              <div className="flex flex-col items-end text-sm text-white/60">
                <span className="font-display font-bold text-white/80">{member.status === "PENDING" ? "--" : member.score}</span>
                <span className="text-[10px] text-white/30 font-mono">x{member.multiplier}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SpotlightCard>
  );
}