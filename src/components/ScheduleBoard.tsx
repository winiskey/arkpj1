import { memo } from "react";
import { Clock3, Play } from "lucide-react";
import type { Match, MatchMember, MemberRunStatus } from "../content";
import { ParallelStatusCard } from "./ParallelStatusCard";
import { CountUp } from "./CountUp";

interface ScheduleBoardProps {
  matches: Match[];
  teamNameById: Record<string, string>;
}

const statusPriority: Record<Match["status"], number> = {
  IN_PROGRESS: 0,
  PENDING: 1,
  FINISHED: 2,
};

const statusTone: Record<MemberRunStatus, string> = {
  LIVE: "border-accent/40 bg-gradient-to-r from-accent/20 to-accent/5 text-accent shadow-glow",
  PENDING: "border-white/5 bg-white/[0.03] text-white/50",
  FINISHED: "border-white/10 bg-black/40 text-white/70",
};

const memberStatusLabel: Record<MemberRunStatus, string> = {
  LIVE: "进行中",
  PENDING: "未开始",
  FINISHED: "已结束",
};

function getCurrentMember(match: Match) {
  return match.members?.find((member) => member.status === "LIVE")
    ?? match.members?.find((member) => member.name === match.currentMemberName)
    ?? match.members?.find((member) => member.status === "PENDING")
    ?? match.members?.[match.members.length - 1];
}

function renderMemberChip(match: Match, member: MatchMember) {
  return (
    <div
      key={`${match.id}-${member.id}`}
      className="group relative flex items-center justify-between gap-3 rounded-[16px] border border-white/5 bg-black/30 px-4 py-3 transition-colors duration-200 hover:border-white/15 hover:bg-white/[0.03]"
    >
      <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10 min-w-0">
        <div className="truncate font-display text-sm font-bold tracking-[0.05em] text-white/90 transition-colors group-hover:text-accent">
          {member.name}
        </div>
        <div className="truncate text-xs mt-1 text-mute">{member.theme}</div>
      </div>
      <div className={`relative z-10 shrink-0 rounded border px-2.5 py-1 text-[9px] tracking-[0.15em] transition-all uppercase ${statusTone[member.status]}`}>
        {memberStatusLabel[member.status]}
      </div>
    </div>
  );
}

export const ScheduleBoard = memo(function ScheduleBoard({ matches, teamNameById }: ScheduleBoardProps) {
  const orderedMatches = [...matches].sort((left, right) => statusPriority[left.status] - statusPriority[right.status]);

  return (
    <div className="space-y-4">
      {orderedMatches.map((match) => {
        const teamName = teamNameById[match.teamId] ?? match.teamId;
        const currentMember = getCurrentMember(match);

        if (match.status === "IN_PROGRESS" && match.members) {
          return (
            <div key={match.id} className="relative group pt-3 mb-6">
              <div className="absolute left-6 -top-1 z-20 inline-flex items-center gap-2 rounded bg-gradient-to-r from-accent to-accentSoft px-3 py-1 font-display text-[10px] uppercase font-bold tracking-[0.15em] text-black shadow-glow">
                <Play className="h-3 w-3 animate-pulse-subtle" />
                {match.phase} / {match.id} / {match.startTime}
              </div>
              <ParallelStatusCard
                members={match.members}
                status="主会场追踪"
                teamName={teamName}
                totalScore={match.totalScore}
              />
              {match.note ? (
                <div className="mt-3 rounded-[16px] border border-white/5 bg-white/[0.02] px-4 py-3 text-xs leading-6 text-mute">
                  {match.note}
                </div>
              ) : null}
            </div>
          );
        }

        const tone = match.status === "PENDING"
          ? "border-white/5 bg-white/[0.02]"
          : "border-white/5 bg-black/40 opacity-90";
        const matchLabel = match.status === "PENDING" ? "待开赛" : "已结束";
        const leadLabel = match.status === "PENDING" ? "首位待命" : "收官选段";

        return (
          <article key={match.id} className={`hud-panel group rounded-[24px] border p-5 transition-all duration-300 hover:-translate-y-0.5 md:p-6 ${tone}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex flex-col gap-5 md:flex-row md:items-start">
                <div className="flex min-w-[100px] items-center gap-3 rounded-[16px] border border-white/5 bg-black/30 px-4 py-3 font-display text-lg tracking-[0.05em] text-white/80">
                  <Clock3 className="h-4 w-4 text-accent/80" />
                  {match.startTime}
                </div>
                <div>
                  <div className="inline-flex rounded border border-white/5 bg-white/[0.02] px-3 py-1 font-display text-[9px] uppercase tracking-[0.15em] text-mute">
                    {matchLabel}
                  </div>
                  <h3 className="mt-3 font-display text-xl font-black uppercase tracking-[0.05em] text-white/90">
                    {teamName}
                  </h3>
                  <div className="mt-2 text-xs text-mute">
                    {leadLabel}:
                    <span className="ml-2 font-semibold text-white/80">{currentMember?.name ?? match.currentMemberName ?? "待定"}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-mute/70">{currentMember?.theme ?? "等待赛事数据"}</div>
                </div>
              </div>
              <div className="rounded-[16px] border border-white/5 bg-black/30 px-5 py-4 text-left xl:min-w-[180px] xl:text-right">
                <div className="font-display text-[10px] uppercase tracking-[0.15em] text-accent/80">{match.phase}</div>
                <div className="mt-1 font-display text-2xl font-black text-white/90">
                  <CountUp end={match.totalScore} />
                </div>
                {match.note ? <div className="mt-2 text-xs leading-5 text-mute/60">{match.note}</div> : null}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(match.members ?? []).sort((left, right) => left.queueOrder - right.queueOrder).map((member) => renderMemberChip(match, member))}
            </div>
          </article>
        );
      })}
    </div>
  );
});