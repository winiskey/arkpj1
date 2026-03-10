import { Clock3, ExternalLink, Radio } from "lucide-react";
import type { LiveBroadcastMeta, Match } from "../content";
import { CountUp } from "./CountUp";

interface LiveHeroCardProps {
  broadcast: LiveBroadcastMeta;
  featuredMatch?: Match;
  teamName?: string;
}

const broadcastTone = {
  LIVE: "bg-red-900/40 text-red-300 border-red-500/30 shadow-[inset_0_0_8px_rgba(220,38,38,0.2)]",
  UPCOMING: "bg-accent/10 text-accent border-accent/30 shadow-[inset_0_0_8px_rgba(212,190,136,0.1)]",
  OFFLINE: "bg-white/5 text-white/50 border-white/10",
} as const;

const broadcastLabel = {
  LIVE: "哔哩哔哩 · 主会场直播中",
  UPCOMING: "即将开播",
  OFFLINE: "暂未开播",
} as const;

export function LiveHeroCard({ broadcast, featuredMatch, teamName }: LiveHeroCardProps) {
  const currentMember = featuredMatch?.members?.find((member) => member.status === "LIVE");
  const nextMember = featuredMatch?.members?.find((member) => member.status === "PENDING");
  const finishedMembers = featuredMatch?.members?.filter((member) => member.status === "FINISHED").length ?? 0;

  return (
    <section className="hud-panel relative p-8 md:p-10 xl:p-12">
      {/* Distinct separation background for side panel implied via layout rather than pure borders */}

      <div className="relative z-10 grid gap-10 xl:grid-cols-[1.2fr_0.8fr] xl:items-start lg:gap-14">
        {/* Main Content Column */}
        <div className="flex flex-col">
          <div className="mb-6 flex items-start justify-between">
            <div className={`inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 font-display text-[11px] font-bold tracking-[0.15em] backdrop-blur-md ${broadcastTone[broadcast.status]}`}>
              <Radio className="h-3 w-3" />
              {broadcastLabel[broadcast.status]}
            </div>
            {featuredMatch && (
              <div className="hidden inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 font-display text-[10px] tracking-widest text-white/50 sm:flex">
                MATCH <span className="text-white/80">{featuredMatch.id}</span>
                <span className="h-2 w-px bg-white/20 mx-1" />
                PHASE <span className="text-white/80">{featuredMatch.phase}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-4xl font-black uppercase leading-none tracking-wide text-white md:text-5xl xl:text-6xl">
              {broadcast.title}
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-white/60">
              {broadcast.subtitle}
            </p>
          </div>

          {/* Essential Match Stats Row */}
          <div className="mt-10 grid gap-4 grid-cols-2 md:grid-cols-3">
            <div className="flex flex-col gap-1 border-l-2 border-white/10 pl-4 transition-colors duration-300 hover:border-accent/40">
              <span className="font-display text-[10px] tracking-widest text-mute">TRACKING</span>
              <span className="font-display text-lg font-bold tracking-wider text-white truncate">
                {teamName ?? "STANDBY"}
              </span>
            </div>
            <div className="flex flex-col gap-1 border-l-2 border-accent/60 pl-4 bg-gradient-to-r from-accent/5 to-transparent">
              <span className="font-display text-[10px] tracking-widest text-accent">ACTIVE OPS</span>
              <span className="font-display text-lg font-bold tracking-wider text-white truncate">
                {currentMember?.name ?? featuredMatch?.currentMemberName ?? "STANDBY"}
              </span>
            </div>
            <div className="flex flex-col gap-1 border-l-2 border-white/10 pl-4 transition-colors duration-300 hover:border-accent/40 col-span-2 md:col-span-1">
              <span className="font-display text-[10px] tracking-widest text-mute">RELAY PROG</span>
              <span className="font-display text-lg font-bold tracking-wider text-white">
                {finishedMembers} / 4
              </span>
            </div>
          </div>

          {/* CTA Group with stark primary/secondary distinction */}
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <a
              className="btn-primary"
              href={broadcast.href}
              rel="noreferrer"
              target="_blank"
              style={{ padding: '0.875rem 2rem' }}
            >
              <span className="relative z-10 flex items-center gap-2">
                前往直播 <ExternalLink className="h-4 w-4" />
              </span>
            </a>
            <a
              className="btn-secondary flex items-center justify-center gap-2"
              href="#live-schedule"
              style={{ padding: '0.875rem 2rem' }}
            >
              赛程安排
            </a>
            <div className="hidden items-center gap-2 ml-auto lg:flex text-sm text-white/40">
              <Clock3 className="h-4 w-4" /> {broadcast.startTimeLabel}
            </div>
          </div>
        </div>

        {/* Side Panel: Live Intel */}
        <div className="flex h-full flex-col rounded-xl border border-white/5 bg-black/40 p-6 xl:p-8 backdrop-blur-md shadow-innerGlow">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 bg-accent" />
              <div>
                <div className="font-display text-[11px] font-bold tracking-widest text-accent">LIVE INTEL</div>
                <div className="text-[10px] text-white/40">实时通讯</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-[10px] tracking-widest text-white/40">T-SCORE</div>
              <div className="font-display text-2xl font-black text-accent">
                {featuredMatch?.totalScore ? <CountUp end={featuredMatch.totalScore} /> : "--"}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-6 flex-1">
            <div className="relative overflow-hidden rounded-lg border border-accent/20 bg-accent/5 p-5">
              <div className="absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full bg-accent/20 blur-2xl" />
              <div className="text-[10px] font-bold tracking-widest text-accent/70 font-display">CURRENT PHASE</div>
              <div className="mt-2 font-display text-2xl font-black tracking-wide text-white">
                {currentMember?.name ?? featuredMatch?.currentMemberName ?? "WAITING"}
              </div>
              <div className="mt-1 text-sm text-white/60">{currentMember?.theme ?? "Data unavailable"}</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 mt-auto">
              <div className="flex flex-col justify-end border-l-2 border-white/10 pl-4 py-1">
                <div className="text-[10px] tracking-widest text-white/40 font-display">NEXT OPERATOR</div>
                <div className="mt-1.5 font-display text-base font-bold text-white/80">
                  {nextMember?.name ?? "UNCONFIRMED"}
                </div>
                <div className="mt-0.5 text-xs text-white/40">{nextMember?.theme ?? broadcast.notice}</div>
              </div>
              <div className="flex flex-col justify-end border-l-2 border-white/10 pl-4 py-1">
                <div className="text-[10px] tracking-widest text-white/40 font-display">SYSTEM NOTICE</div>
                <div className="mt-1.5 text-[13px] leading-relaxed text-white/60">{broadcast.notice}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}