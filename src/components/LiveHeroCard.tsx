import { Clock3, ExternalLink, Radio } from "lucide-react";
import type { LiveBroadcastMeta, Match } from "../content";
import { ClipButton } from "./ClipButton";
import { CountUp } from "./CountUp";
import { SpotlightCard } from "./SpotlightCard";
import { MagneticWrapper } from "./MagneticWrapper";

interface LiveHeroCardProps {
  broadcast: LiveBroadcastMeta;
  featuredMatch?: Match;
  teamName?: string;
}

const broadcastTone = {
  LIVE: "border-live/35 bg-live/16 text-live",
  UPCOMING: "border-brand/25 bg-brand/10 text-brandStrong",
  OFFLINE: "border-white/10 bg-white/[0.05] text-text2",
} as const;

const broadcastLabel = {
  LIVE: "主会场直播中",
  UPCOMING: "即将开播",
  OFFLINE: "暂未开播",
} as const;

export function LiveHeroCard({ broadcast, featuredMatch, teamName }: LiveHeroCardProps) {
  const currentMember = featuredMatch?.members?.find((member) => member.status === "LIVE");
  const nextMember = featuredMatch?.members?.find((member) => member.status === "PENDING");
  const finishedMembers = featuredMatch?.members?.filter((member) => member.status === "FINISHED").length ?? 0;

  return (
    <SpotlightCard glowBorder className="group relative overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.02] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-3xl md:p-10 xl:p-12" spotlightColor="rgba(255,255,255,0.06)">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(214,192,138,0.08),transparent_50%)]" />
      <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-start">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.16em] ${broadcastTone[broadcast.status]}`}>
              <Radio className="h-3.5 w-3.5" />
              {broadcastLabel[broadcast.status]}
            </div>
            {featuredMatch ? (
              <div className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 font-display text-[11px] uppercase tracking-[0.16em] text-text2">
                {featuredMatch.id} · {featuredMatch.phase}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <h1 className="font-title text-4xl font-black tracking-[0.03em] text-text1 md:text-5xl xl:text-[3.9rem] xl:leading-[1.02]">
              {broadcast.title}
            </h1>
            <p className="max-w-2xl text-[15px] leading-8 text-text2 md:text-base">{broadcast.subtitle}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col justify-center rounded-[24px] border border-white/5 bg-white/[0.02] px-5 py-5 transition-[background-color] duration-300 group-hover:bg-white/[0.03]">
              <div className="font-display text-[11px] uppercase tracking-[0.16em] text-white/40">主追踪队伍</div>
              <div className="mt-4 font-title text-3xl font-black tracking-[0.03em] text-white/90">{teamName ?? "待切入"}</div>
              <div className="mt-3 text-sm text-white/30">当前镜头焦点与队伍总状态。</div>
            </div>
            <div className="flex flex-col justify-center rounded-[24px] border border-white/5 bg-white/[0.02] px-5 py-5 transition-[background-color] duration-300 group-hover:bg-white/[0.03]">
              <div className="font-display text-[11px] uppercase tracking-[0.16em] text-white/40">当前成员</div>
              <div className="mt-4 font-title text-3xl font-black tracking-[0.03em] text-white/90">
                {currentMember?.name ?? featuredMatch?.currentMemberName ?? "待命"}
              </div>
              <div className="mt-3 text-sm text-white/30">{currentMember?.theme ?? "等待赛事数据同步"}</div>
            </div>
            <div className="flex flex-col justify-center rounded-[24px] border border-white/5 bg-white/[0.02] px-5 py-5 transition-[background-color] duration-300 group-hover:bg-white/[0.03]">
              <div className="font-display text-[11px] uppercase tracking-[0.16em] text-white/40">接力进度</div>
              <div className="mt-4 font-display text-3xl font-black tracking-[0.03em] text-brand">
                {finishedMembers} / 4
              </div>
              <div className="mt-3 text-sm text-white/30">{featuredMatch ? `起始 ${featuredMatch.startTime}` : broadcast.startTimeLabel}</div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
            <MagneticWrapper strength={30} className="!p-0 !m-0">
              <ClipButton href={broadcast.href} rel="noreferrer" size="lg" target="_blank" variant="primary" className="!rounded-full border-none !bg-brand font-bold !text-black shadow-[0_0_30px_-5px_rgba(214,192,138,0.5)]">
                进入直播间
                <ExternalLink className="ml-2 h-4 w-4" />
              </ClipButton>
            </MagneticWrapper>
            <MagneticWrapper strength={20} className="!p-0 !m-0">
              <ClipButton href="#live-schedule" size="lg" variant="secondary" className="!rounded-full border border-white/10 !bg-white/[0.05] text-white/70 hover:!bg-white/10 hover:text-white">
                查看赛程板
                <Clock3 className="ml-2 h-4 w-4" />
              </ClipButton>
            </MagneticWrapper>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/5 bg-white/[0.02] px-6 py-6 md:px-8 md:py-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-display text-[10px] uppercase tracking-[0.25em] text-brand/70">Live Intel</div>
                <div className="mt-2 font-title text-3xl font-black tracking-[0.03em] text-white/90">主会场战术追踪</div>
              </div>
              <div className="text-right">
                <div className="font-display text-[11px] uppercase tracking-[0.16em] text-white/40">T-Score</div>
                <div className="mt-2 font-display text-4xl font-black tracking-[0.03em] text-brand">
                  {featuredMatch?.totalScore ? <CountUp end={featuredMatch.totalScore} /> : "--"}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-brand/15 bg-brand/5 px-5 py-5 shadow-[inset_1px_0_0_rgba(214,192,138,0.4)]">
                <div className="font-display text-[11px] uppercase tracking-[0.16em] text-brand/80">当前阶段</div>
                <div className="mt-3 font-title text-2xl font-black tracking-[0.03em] text-white/90">
                  {currentMember?.name ?? featuredMatch?.currentMemberName ?? "WAITING"}
                </div>
                <div className="mt-2 text-sm leading-6 text-white/40">{currentMember?.theme ?? "等待选手接力"}</div>
              </div>
              <div className="rounded-[24px] border border-white/5 bg-white/[0.02] px-5 py-5 shadow-[inset_1px_0_0_rgba(255,255,255,0.1)]">
                <div className="font-display text-[11px] uppercase tracking-[0.16em] text-white/40">下一位</div>
                <div className="mt-3 font-title text-2xl font-black tracking-[0.03em] text-white/80">
                  {nextMember?.name ?? "未确认"}
                </div>
                <div className="mt-2 text-sm leading-6 text-white/30">{nextMember?.theme ?? broadcast.notice}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/5 bg-white/[0.02] px-6 py-6 md:px-8 md:py-8">
            <div className="font-display text-[10px] uppercase tracking-[0.25em] text-white/40">Broadcast Notice</div>
            <p className="mt-3 text-sm leading-7 text-white/60">{broadcast.notice}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/40">
              <span className="rounded-full border border-white/5 bg-white/[0.03] px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.16em] text-white/50">
                {broadcast.platform}
              </span>
              <span className="rounded-full border border-white/5 bg-white/[0.03] px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.16em] text-white/50">
                {broadcast.roomLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}
