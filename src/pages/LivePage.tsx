import { useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CalendarDays, ChevronDown, Clock3, Radio, ShieldAlert } from "lucide-react";
import { ScrollReveal } from "../components/ScrollReveal";
import { EventScheduleBoard } from "../components/EventScheduleBoard";
import { LiveHeroCard } from "../components/LiveHeroCard";
import { PageFrame } from "../components/PageFrame";
import { ScheduleBoard } from "../components/ScheduleBoard";
import { SectionHeader } from "../components/SectionHeader";
import { TeamLeaderboard } from "../components/TeamLeaderboard";
import { useSiteData } from "../context/SiteDataContext";
import { SpotlightCard } from "../components/SpotlightCard";

export function LivePage() {
  const {
    data: { eventSchedule, judgeNotices, leaderboard, liveBroadcast, matches, teams },
  } = useSiteData();

  const logoRef = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      const logo = logoRef.current;
      if (!logo) return;

      const xTo = gsap.quickTo(logo, "x", { duration: 1.2, ease: "power3.out" });
      const yTo = gsap.quickTo(logo, "y", { duration: 1.2, ease: "power3.out" });

      const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        const xOffset = ((clientX / innerWidth) - 0.5) * -240;
        const yOffset = ((clientY / innerHeight) - 0.5) * -240;
        xTo(xOffset);
        yTo(yOffset);
      };

      window.addEventListener("mousemove", handleMouseMove);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }
  );

  const teamNameById = useMemo(() => Object.fromEntries(teams.map((team) => [team.id, team.name])), [teams]);
  const featuredMatch = useMemo(
    () => matches.find((match) => match.status === "IN_PROGRESS") ?? matches.find((match) => match.status === "PENDING"),
    [matches],
  );
  const featuredTeamName = useMemo(
    () => (featuredMatch ? teamNameById[featuredMatch.teamId] ?? featuredMatch.teamId : undefined),
    [featuredMatch, teamNameById],
  );
  const headlineNotices = useMemo(() => judgeNotices.slice(0, 2), [judgeNotices]);
  const detailNotices = useMemo(() => judgeNotices.slice(2), [judgeNotices]);
  const scheduledCount = useMemo(() => eventSchedule.reduce((sum, day) => sum + day.slots.length, 0), [eventSchedule]);
  const liveCount = useMemo(() => matches.filter((match) => match.status === "IN_PROGRESS").length, [matches]);
  const pendingCount = useMemo(() => matches.filter((match) => match.status === "PENDING").length, [matches]);
  const finishedCount = useMemo(() => matches.filter((match) => match.status === "FINISHED").length, [matches]);

  const overviewCards = useMemo(
    () => [
      {
        icon: CalendarDays,
        label: "排期跨度",
        value: `${eventSchedule[0]?.date ?? "--"} - ${eventSchedule[eventSchedule.length - 1]?.date ?? "--"}`,
        detail: `${eventSchedule.length} 天 / ${scheduledCount} 场已录入`,
      },
      {
        icon: Radio,
        label: "主会场焦点",
        value: featuredTeamName ?? "等待切入",
        detail: featuredMatch ? `${featuredMatch.id} · ${featuredMatch.startTime}` : "等待裁判切入主会场",
      },
      {
        icon: Clock3,
        label: "赛程节奏",
        value: `${pendingCount} 场待开`,
        detail: `${liveCount} 场进行中 / ${finishedCount} 场已归档`,
      },
    ],
    [eventSchedule, featuredMatch, featuredTeamName, finishedCount, liveCount, pendingCount, scheduledCount],
  );

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden selection:bg-brand/90 selection:text-black">
      {/* Global Parallax Matrix Background */}
      <div className="pointer-events-none absolute left-[75%] top-[15%] -z-30 flex h-[160vw] w-[160vw] max-w-[1600px] -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-[0.06] mix-blend-screen md:left-[80%] md:top-[20%] xl:left-[85%]">
        <img ref={logoRef} src="/logo.svg" alt="Core Matrix" className="animate-spin-slower animate-float-subtle h-full w-full object-contain brightness-75 drop-shadow-[0_0_40px_rgba(214,192,138,0.15)]" />
      </div>
      {/* Ambient breathing pulse */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_70%_25%,rgba(214,192,138,0.06),transparent_75%)] animate-pulse-subtle" />

      <PageFrame className="relative z-10 gap-10 md:gap-14 lg:gap-20">
        <div className="gsap-stagger-item">
          <LiveHeroCard broadcast={liveBroadcast} featuredMatch={featuredMatch} teamName={featuredTeamName} />
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {overviewCards.map((card) => {
            const Icon = card.icon;

            return (
              <SpotlightCard key={card.label} glowBorder spotlightColor="rgba(255,255,255,0.06)" className="group flex flex-col justify-between rounded-[32px] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-3xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.04] hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="font-display text-[11px] uppercase tracking-[0.16em] text-white/40 transition-colors group-hover:text-white/60">{card.label}</div>
                    <div className="font-title text-[1.9rem] font-black tracking-[0.03em] text-white/80 transition-colors group-hover:text-brand md:text-[2.2rem]">
                      {card.value}
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white/60 transition-colors group-hover:border-brand/40 group-hover:bg-brand/10 group-hover:text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/40 transition-colors group-hover:text-white/60">{card.detail}</p>
              </SpotlightCard>
            );
          })}
        </section>

        <ScrollReveal delay={0.1} distance={40}>
          <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
            <section className="space-y-4">
              <SectionHeader
                cnTitle="队伍总榜"
                description="让观众先看到当前强弱关系，再进入主会场实时追踪，形成更完整的观赛上下文。"
                enTitle="TEAM RANKING"
              />
              <TeamLeaderboard teams={leaderboard} />
            </section>

            <section className="space-y-4" id="live-schedule">
              <SectionHeader
                cnTitle="主会场实时追踪"
                description="主会场使用更集中的信息框架：进行中的比赛优先展示，待开赛与已结束比赛则降为补充层级。"
                enTitle="LIVE COMMAND BOARD"
              />
              <ScheduleBoard matches={matches} teamNameById={teamNameById} />
            </section>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.16} distance={40}>
          <section className="space-y-6">
            <SectionHeader
              cnTitle="比赛赛程安排"
              description="桌面端保留指挥板式横向时间格，移动端自动切换为更易扫读的日程卡片。"
              enTitle="MATCH CALENDAR"
              eyebrow="3.9 - 3.20 / 早 9:00 · 中 14:00 · 晚 19:00"
            />
            <EventScheduleBoard days={eventSchedule} teamNameById={teamNameById} />
          </section>
        </ScrollReveal>

        <ScrollReveal delay={0.1} distance={30}>
          <section className="panel-content px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-col gap-4 border-b border-white/8 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="section-kicker">SYSTEM NOTICE</div>
                <h3 className="mt-3 font-title text-3xl font-black tracking-[0.03em] text-text1 md:text-4xl">裁判说明摘要</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand/14 bg-brand/8 text-brand/80">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {headlineNotices.map((notice) => (
                <div key={notice} className="panel-data px-5 py-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-1 h-4 w-4 shrink-0 text-brand/80" />
                    <span className="text-[15px] leading-7 text-text2">{notice}</span>
                  </div>
                </div>
              ))}
            </div>

            <details className="mt-6 border-t border-white/8 pt-5 text-sm text-text2">
              <summary className="flex list-none items-center justify-between gap-3 font-display uppercase tracking-[0.16em] text-text3 transition-colors hover:text-brand">
                <span>展开详细说明</span>
                <ChevronDown className="h-4 w-4" />
              </summary>
              <div className="mt-5 space-y-4 text-[15px] leading-7 text-text2">
                {detailNotices.map((notice) => (
                  <p key={notice}>{notice}</p>
                ))}
                <p className="border-l-2 border-brand/40 pl-4 text-sm text-text3">
                  榜单优先服务于观众追踪主会场节奏，最终结果仍以裁判组复核公告为准。
                </p>
              </div>
            </details>
          </section>
        </ScrollReveal>
      </PageFrame>
    </div>
  );
}
