import type { Match, MemberRunStatus } from "../content";

interface MemberStatusBoardProps {
  matches: Match[];
  teamNameById: Record<string, string>;
}

const statusPriority: Record<MemberRunStatus, number> = {
  LIVE: 0,
  PENDING: 1,
  FINISHED: 2,
};

const statusTone: Record<MemberRunStatus, string> = {
  LIVE: "border-red-400/35 bg-red-500/10 text-red-200",
  PENDING: "border-white/10 bg-white/[0.03] text-white/60",
  FINISHED: "border-accent/25 bg-accent/10 text-accent",
};

const statusLabel: Record<MemberRunStatus, string> = {
  LIVE: "进行中",
  PENDING: "未开始",
  FINISHED: "已结束",
};

export function MemberStatusBoard({ matches, teamNameById }: MemberStatusBoardProps) {
  const rows = matches
    .flatMap((match) =>
      (match.members ?? []).map((member) => ({
        match,
        member,
        teamName: teamNameById[match.teamId] ?? match.teamId,
      })),
    )
    .sort((left, right) => {
      const statusDiff = statusPriority[left.member.status] - statusPriority[right.member.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return left.match.startTime.localeCompare(right.match.startTime);
    });

  return (
    <div className="hud-panel overflow-hidden">
      <div className="grid grid-cols-[1.25fr_1fr_0.72fr] gap-3 border-b border-white/10 px-4 py-3 font-display text-[11px] tracking-[0.28em] text-white/45">
        <div>成员 / 队伍</div>
        <div>主题 / 场次</div>
        <div className="text-right">状态</div>
      </div>
      <div>
        {rows.map(({ match, member, teamName }) => (
          <div key={`${match.id}-${member.id}`} className={`grid grid-cols-[1.25fr_1fr_0.72fr] gap-3 border-b border-white/5 px-4 py-4 ${member.status === "LIVE" ? "bg-accent/[0.04]" : "bg-transparent"}`}>
            <div>
              <div className="font-display text-lg font-black uppercase tracking-[0.06em] text-white">{member.name}</div>
              <div className="mt-1 text-xs text-white/45">{teamName}</div>
            </div>
            <div>
              <div className="text-sm text-white/70">{member.theme}</div>
              <div className="mt-1 text-xs text-white/40">{match.phase} / {match.startTime}</div>
            </div>
            <div className="flex flex-col items-end justify-center gap-2 text-right">
              <div className={`border px-2 py-1 text-[10px] tracking-[0.2em] ${statusTone[member.status]}`}>
                {statusLabel[member.status]}
              </div>
              <div className="font-display text-sm font-bold text-white/72">
                {member.status === "PENDING" ? "待上场" : member.score}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
