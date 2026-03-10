import type { MatchMember, MemberRunStatus } from "../content";

interface ParallelStatusCardProps {
  teamName: string;
  status: string;
  members: MatchMember[];
  totalScore: string;
}

const statusTone: Record<MemberRunStatus, string> = {
  LIVE: "border-accent/40 bg-gradient-to-r from-accent/20 to-accent/5 text-accent shadow-[0_0_12px_rgba(212,190,136,0.1)]",
  PENDING: "border-white/10 bg-white/[0.03] text-white/50",
  FINISHED: "border-white/10 bg-black/40 text-white/70",
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
    <div className="hud-panel relative overflow-hidden rounded-[24px] border border-accent/20 bg-gradient-to-br from-[#121316] to-[#0a0a0c] p-6 shadow-glowStrong transition-all duration-300 md:p-8">
      {/* Reduced background glare, more elegant glass reflection */}
      <div className="pointer-events-none absolute right-0 top-0 h-[150%] w-[150%] -translate-y-1/4 translate-x-1/4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03),transparent_60%)] opacity-70 mix-blend-overlay" />

      {/* More subtle background text watermark */}
      <div className="pointer-events-none absolute -right-4 -top-8 font-display text-[90px] font-black tracking-tighter text-white/[0.02] md:text-[110px]">
        {teamName.slice(0, 3).toUpperCase()}
      </div>

      <div className="relative z-10 mb-8 flex flex-col gap-4 border-b border-white/5 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          {/* Replaced 'animate-pulse' with 'animate-pulse-subtle' and removed aggressive glows */}
          <div className="inline-flex items-center gap-2 rounded bg-gradient-to-r from-accent/90 to-accentSoft px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-black shadow-none">
            <span className="h-1.5 w-1.5 rounded-full bg-black/80 animate-pulse-subtle" />
            {status}
          </div>
          <h3 className="mt-4 font-display text-2xl font-black uppercase tracking-[0.1em] text-white/90">
            {teamName}
          </h3>
        </div>
        <div className="text-left md:text-right">
          <div className="font-display text-[10px] tracking-[0.2em] text-accent/70">当前总分</div>
          <div className="mt-1 font-display text-4xl font-black text-white drop-shadow-md">
            {totalScore}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[20px] border border-accent/15 bg-black/40 p-6 shadow-innerGlow">
          <div className="relative z-10 font-display text-[10px] font-bold tracking-[0.2em] text-accent/80">正在比赛</div>
          <div className="relative z-10 mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-display text-2xl font-black uppercase tracking-[0.05em] text-white">
                {currentMember.name}
              </div>
              <div className="mt-1 text-xs text-mute">{currentMember.theme}</div>
            </div>
            <div className={`rounded border px-3 py-1 text-[10px] tracking-[0.15em] ${statusTone[currentMember.status]}`}>
              {statusLabel[currentMember.status]}
            </div>
          </div>

          <div className="mt-8 grid gap-4 grid-cols-3">
            <div className="flex flex-col justify-end border-l border-white/10 pl-4">
              <div className="font-display text-[10px] tracking-[0.2em] text-mute mb-1">得分</div>
              <div className="font-display text-3xl font-bold text-white leading-none">{currentMember.score}</div>
            </div>
            <div className="flex flex-col justify-end border-l border-white/10 pl-4">
              <div className="font-display text-[10px] tracking-[0.2em] text-mute mb-1">系数</div>
              <div className="font-display text-2xl font-bold text-white/90 leading-none">x{currentMember.multiplier}</div>
            </div>
            <div className="flex flex-col justify-end border-l border-accent/30 pl-4">
              <div className="font-display text-[10px] tracking-[0.2em] text-accent/60 mb-1">候补</div>
              <div className="font-display text-lg font-bold tracking-[0.05em] text-white/80 leading-none truncate">
                {standbyMember?.name ?? "暂无"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
          {otherMembers.map((member) => (
            <div key={`${teamName}-${member.name}`} className="flex items-center justify-between rounded-[16px] border border-white/5 bg-white/[0.02] p-4 transition-colors duration-200 hover:border-white/10 hover:bg-white/[0.04]">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="font-display text-sm font-bold tracking-[0.05em] text-white/80">{member.name}</div>
                  <div className={`rounded border px-2 py-0.5 text-[9px] tracking-[0.1em] ${statusTone[member.status]}`}>
                    {statusLabel[member.status]}
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-mute">{member.theme}</div>
              </div>
              <div className="flex flex-col items-end text-sm text-white/60">
                <span className="font-display font-bold">{member.status === "PENDING" ? "--" : member.score}</span>
                <span className="text-[10px] text-mute font-mono">x{member.multiplier}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}