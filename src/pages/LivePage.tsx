import { useMemo } from "react";
import { CalendarDays, ChevronDown, Clock3, Radio, ShieldAlert } from "lucide-react";
import { ScrollReveal } from "../components/ScrollReveal";
import { EventScheduleBoard } from "../components/EventScheduleBoard";
import { LiveHeroCard } from "../components/LiveHeroCard";
import { PageFrame } from "../components/PageFrame";
import { ScheduleBoard } from "../components/ScheduleBoard";
import { SectionHeader } from "../components/SectionHeader";
import { TeamLeaderboard } from "../components/TeamLeaderboard";
import { useSiteData } from "../context/SiteDataContext";

export function LivePage() {
  const {
    data: { eventSchedule, judgeNotices, leaderboard, liveBroadcast, matches, teams },
  } = useSiteData();
  const teamNameById = useMemo(() => Object.fromEntries(teams.map((team) => [team.id, team.name])), [teams]);
  const featuredMatch = useMemo(() => matches.find((match) => match.status === "IN_PROGRESS") ?? matches.find((match) => match.status === "PENDING"), [matches]);
  const featuredTeamName = useMemo(() => featuredMatch ? teamNameById[featuredMatch.teamId] ?? featuredMatch.teamId : undefined, [featuredMatch, teamNameById]);
  const headlineNotices = useMemo(() => judgeNotices.slice(0, 2), [judgeNotices]);
  const detailNotices = useMemo(() => judgeNotices.slice(2), [judgeNotices]);
  const scheduledCount = useMemo(() => eventSchedule.reduce((sum, day) => sum + day.slots.length, 0), [eventSchedule]);
  const liveCount = useMemo(() => matches.filter((match) => match.status === "IN_PROGRESS").length, [matches]);
  const pendingCount = useMemo(() => matches.filter((match) => match.status === "PENDING").length, [matches]);
  const finishedCount = useMemo(() => matches.filter((match) => match.status === "FINISHED").length, [matches]);

  const overviewCards = useMemo(() => [
    {
      icon: CalendarDays,
      label: "排期跨度",
      value: `${eventSchedule[0]?.date ?? "--"} - ${eventSchedule[eventSchedule.length - 1]?.date ?? "--"}`,
      detail: `${eventSchedule.length} 天 / ${scheduledCount} 场已录入`,
    },
    {
      icon: Radio,
      label: "主会场状态",
      value: featuredTeamName ?? "等待切入",
      detail: featuredMatch ? `${featuredMatch.id} · ${featuredMatch.startTime}` : "等待裁判切入主会场",
    },
    {
      icon: Clock3,
      label: "赛程节奏",
      value: `${pendingCount} 场待开`,
      detail: `${liveCount} 场进行中 / ${finishedCount} 场已归档`,
    },
  ], [featuredMatch, featuredTeamName, finishedCount, liveCount, pendingCount, scheduledCount]);

  return (
    <PageFrame className="space-y-12 md:space-y-16 lg:space-y-24">
      {/* ── Layer 1: Hero Card ── */}
      <div className="gsap-stagger-item">
        <LiveHeroCard broadcast={liveBroadcast} featuredMatch={featuredMatch} teamName={featuredTeamName} />
      </div>

      {/* ── Layer 2: Overview Stats ── */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 gsap-stagger-item">
        {overviewCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.label} className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-6 transition-colors hover:bg-white/[0.02]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-display text-[10px] tracking-[0.2em] text-white/40 uppercase">{card.label}</div>
                  <div className="mt-4 font-display flex items-baseline gap-2">
                    <span className="font-sans text-3xl font-medium tracking-wide text-white/95 tabular-nums">{card.value.split(" ")[0]}</span>
                    <span className="font-sans text-[15px] font-medium text-white/70">{card.value.split(" ").slice(1).join(" ")}</span>
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02] text-white/40">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 font-sans text-[13px] text-white/50">{card.detail}</p>
            </article>
          );
        })}
      </section>

      {/* ── Layer 3: Team Ranking + Live Tracking side-by-side ── */}
      <ScrollReveal distance={40} delay={0.1}>
        <div className="grid gap-8 xl:grid-cols-[5fr_7fr] xl:items-start">
          <section className="space-y-4">
            <SectionHeader enTitle="TEAM RANKING" cnTitle="队伍总榜" />
            <TeamLeaderboard teams={leaderboard} />
          </section>

          <section id="live-schedule" className="space-y-4">
            <SectionHeader enTitle="LIVE COMMAND BOARD" cnTitle="主会场实时追踪" />
            <ScheduleBoard matches={matches} teamNameById={teamNameById} />
          </section>
        </div>
      </ScrollReveal>

      {/* ── Layer 4: Full-width Match Calendar ── */}
      <ScrollReveal distance={40} delay={0.15}>
        <section className="space-y-6">
          <SectionHeader
            enTitle="MATCH CALENDAR"
            cnTitle="比赛赛程安排"
            eyebrow="3.9 - 3.20 / 早 9:00 · 中 14:00 · 晚 19:00"
          />
          <EventScheduleBoard days={eventSchedule} teamNameById={teamNameById} />
        </section>
      </ScrollReveal>

      {/* ── Layer 5: Judge Notices (bottom) ── */}
      <ScrollReveal distance={30} delay={0.1}>
        <section className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-display text-[10px] tracking-[0.2em] text-white/40 uppercase">SYSTEM NOTICE</div>
              <h3 className="mt-3 font-sans text-2xl font-medium tracking-wide text-white/95">
                裁判说明摘要
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02] text-white/40">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {headlineNotices.map((notice) => (
              <div key={notice} className="rounded-xl border border-white/[0.05] bg-white/[0.01] px-5 py-4">
                <div className="flex items-start gap-4">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent/80" />
                  <span className="font-sans text-[14px] leading-relaxed text-white/80">{notice}</span>
                </div>
              </div>
            ))}
          </div>

          <details className="mt-6 border-t border-white/[0.05] pt-5 text-[13px] text-white/60 cursor-pointer group">
            <summary className="flex list-none items-center justify-between gap-3 font-display tracking-[0.15em] text-white/40 group-hover:text-white/70 transition-colors uppercase">
              <span>展开详细说明</span>
              <ChevronDown className="h-4 w-4 text-white/40 group-hover:text-accent transition-colors" />
            </summary>
            <div className="mt-5 space-y-4 font-sans text-[14px] leading-relaxed pl-1 text-white/70">
              {detailNotices.map((notice) => (
                <p key={notice}>{notice}</p>
              ))}
              <p className="border-l-2 border-accent/40 pl-4 mt-5 text-white/50 italic">榜单优先服务于观众追踪主会场节奏，最终结果仍以裁判组复核公告为准。</p>
            </div>
          </details>
        </section>
      </ScrollReveal>
    </PageFrame>
  );
}