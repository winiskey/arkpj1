import { ArrowRight, BookOpen, CalendarDays, Crosshair, ShieldAlert, Trophy, Users2 } from "lucide-react";
import { ClipButton } from "../components/ClipButton";
import { ScrollReveal } from "../components/ScrollReveal";
import { InfoPanel } from "../components/InfoPanel";
import { PageFrame } from "../components/PageFrame";
import { ParticleLogo } from "../components/ParticleLogo";
import { SectionHeader } from "../components/SectionHeader";
import { InteractiveParticleLogo } from "../components/InteractiveParticleLogo";
import { useSiteData } from "../context/SiteDataContext";
import { LOGO_IMAGE_SRC } from "../lib/logo";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();
  const {
    data: { overviewPanels, siteMeta, teams, themeRules },
  } = useSiteData();
  const liveLink = siteMeta.ctaLinks.find((link) => link.href === "/live");
  const rulesLink = siteMeta.ctaLinks.find((link) => link.href === "/rules");

  const heroSignals = [
    {
      icon: Users2,
      label: "Registered Squads",
      value: String(teams.length).padStart(2, "0"),
      detail: "official roster sync",
    },
    {
      icon: Crosshair,
      label: "Theme Routes",
      value: String(themeRules.length).padStart(2, "0"),
      detail: "parallel scoring lanes",
    },
    {
      icon: Trophy,
      label: "Top Reward",
      value: siteMeta.prizePool[0]?.value ?? "--",
      detail: siteMeta.prizePool[0]?.label ?? "champion pool",
    },
  ];

  return (
    <PageFrame className="max-w-none gap-0 px-0 pb-0 pt-20">
      {/* Hero Section: Full-Bleed Environment & Floating Layers */}
      <section className="relative flex min-h-[auto] lg:min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden">
        {/* Layer 0: The Abyssal Void (Base Dark Tech Vibe) */}
        <div className="pointer-events-none absolute inset-0 bg-base z-0" />



        {/* Layer 2: The Structural Container */}
        <div className="relative z-20 flex w-full flex-col justify-between gap-10 px-4 py-10 md:px-8 lg:px-16 xl:px-24 lg:h-[calc(100svh-6rem)] lg:flex-row lg:items-center lg:gap-24 lg:py-24">

          {/* Left Column: The Floating Emblem & Core CTA */}
          <div className="relative z-10 flex flex-col items-start max-w-2xl gsap-stagger-item lg:pb-10">
            {/* Status Badge */}
            <div className="mb-6 inline-flex items-center gap-3 border border-white/10 bg-white/[0.02] px-4 py-2 font-display text-[10px] uppercase tracking-[0.24em] text-white/50 rounded-full backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full animate-pulse-subtle bg-accent shadow-[0_0_8px_rgba(212,190,136,0.6)]" />
              PORTAL ONLINE
            </div>

            {/* ── Hero Title: 荆楚歌 #2 ─────────────────────────────────────── */}
            <div className="relative mt-6">
              {/* classification label */}
              <div className="relative flex items-center gap-3 mb-6">
                <div className="h-[2px] w-4 bg-accent/40" />
                <span className="font-display text-[11px] tracking-[0.3em] text-white/60 uppercase">
                  JINGCHUGE // SEASON 02
                </span>
              </div>

              {/* Main Title Grouping */}
              <div className="flex items-baseline gap-4">
                <h1
                  className="relative leading-none tracking-tight text-white/90 drop-shadow-[0_4px_32px_rgba(0,0,0,0.5)]"
                  style={{
                    fontFamily: "'Noto Sans SC', sans-serif",
                    fontWeight: 900,
                    fontSize: 'clamp(3rem, 8.5vw, 7.5rem)',
                  }}
                >
                  荆楚歌
                  {/* Subtle Accent Glow behind title */}
                  <div className="absolute -inset-8 bg-accent/10 blur-[60px] -z-10 pointer-events-none" />
                </h1>

                <span
                  className="font-display text-[0.45em] font-bold text-accent relative top-[-0.1em]"
                  style={{
                    fontSize: 'clamp(2rem, 4vw, 3.525rem)',
                    fontFamily: "'Rajdhani', sans-serif",
                  }}
                >
                  #2
                </span>
              </div>

              {/* Subtitle / Descriptive text */}
              <div className="relative mt-4 flex items-center gap-4">
                <div className="h-[1px] w-12 bg-white/20" />
                <span className="font-sans text-[12px] font-bold tracking-[0.4em] text-white/60 uppercase">
                  湖北高校集成战略联赛
                </span>
              </div>
            </div>
            {/* ── End Hero Title ────────────────────────────────────────────── */}

            {/* Event Meta Subtitle with improved contrast and alignment */}
            <div className="mt-12 mb-2 max-w-lg">
              <div className="text-xl font-sans font-medium leading-relaxed tracking-wide text-white/80 md:text-2xl border-l-[3px] border-accent/80 pl-6">
                {siteMeta.subtitle}
              </div>
              <div className="mt-3 pl-7 font-display text-[11px] uppercase tracking-[0.4em] text-white/50">
                {siteMeta.eventCode} // ARCHIVE 01-B
              </div>
            </div>
            {/* ── End Hero Title ────────────────────────────────────────────── */}

            {/* Extended CTA Buttons */}
            <div className="mt-10 flex flex-col gap-4 w-full gsap-stagger-item sm:flex-row sm:items-center">
              <button
                className="relative px-10 py-5 bg-accent text-black font-display text-lg font-black uppercase tracking-widest overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 group shadow-[0_0_32px_rgba(212,190,136,0.3)]"
                style={{
                  clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
                }}
                onClick={() => navigate('/live')}
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
                <span className="relative z-10 flex items-center gap-3">
                  进入赛事大厅
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>

              <button
                className="relative w-full px-8 py-4 border border-white/20 text-white/80 font-display text-sm font-bold uppercase tracking-[.25em] transition-all duration-300 hover:bg-white/5 hover:text-white group sm:w-auto"
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
                onClick={() => navigate('/rules')}
              >
                <span className="relative z-10 flex items-center gap-3">
                  查看完整规则
                  <BookOpen className="h-4 w-4 opacity-60 group-hover:opacity-100" />
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Enlarged Artifact Core */}
          <div className="relative w-full max-w-[600px] shrink-0 gsap-stagger-item flex items-center justify-center lg:flex mt-6 lg:mt-0">
            {/* Massive background glow to balance the left side */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px] z-0 animate-pulse-slow" />

            {/* Central Floating Particle Logo Entity */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-6">
              <InteractiveParticleLogo
                imageSrc={LOGO_IMAGE_SRC}
                width={800}
                height={800}
                particleDensity={8}
                interactionRadius={40}
                particleColor="212, 190, 136"
                className="w-[500px] h-[500px] object-contain transition-transform duration-700 hover:scale-105"
              />

              {/* Bottom detail text */}
              <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-full border border-white/5">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#d4be88]" />
                <span className="font-sans text-[11px] font-bold tracking-[0.3em] text-white/70">SYSTEM ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-40 px-5 py-32 md:px-8 lg:px-10 lg:py-48">
        <ScrollReveal distance={40} delay={0.1}>
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <SectionHeader enTitle="MISSION OVERVIEW" cnTitle="赛事概览" />
              <div className="mt-12 grid gap-10 md:grid-cols-3">
                {overviewPanels.map((panel) => (
                  <article key={panel.title} className="hud-panel group relative overflow-hidden p-8 transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.04]">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative font-display text-[10px] uppercase tracking-[0.2em] text-accent/60 transition-colors group-hover:text-accent/80">{panel.label}</div>
                    <h3 className="relative mt-4 font-sans text-xl font-medium tracking-wide text-white/90">
                      {panel.title}
                    </h3>
                    <p className="relative mt-4 text-[14px] leading-relaxed text-white/60 transition-colors group-hover:text-white/80">{panel.content}</p>
                    <div className="absolute bottom-6 right-6 translate-x-4 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                      <ArrowRight className="h-4 w-4 text-white/40" />
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <InfoPanel
              title="奖金与关键信息"
              label="EVENT BRIEF"
              items={[
                <span key="date">开赛时间：2026 年 3 月 8 日，{siteMeta.locationLabel}。</span>,
                <span key="champion">冠军奖励：{siteMeta.prizePool[0].value}；亚军奖励：{siteMeta.prizePool[1].value}。</span>,
                <span key="others">其余参赛队伍保底奖励：{siteMeta.prizePool[2].value}。</span>,
                <span key="judging">总分由主题得分与队伍系数共同决定，实时榜单需经过裁判组复核。</span>,
              ]}
            />
          </section>
        </ScrollReveal>

        <ScrollReveal distance={40} delay={0.2}>
          <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <InfoPanel
              title="官网交付范围"
              label="SITE SYSTEM"
              items={[
                <span key="live">赛事大厅：查看当前轮次、赛程安排与实时排行榜。</span>,
                <span key="teams">队伍情报：浏览样例战队资料、宣言、成员职责与主题分工。</span>,
                <span key="rules">规则总览：按赛制、通用规则、主题计分、系数和决赛说明完整拆解。</span>,
              ]}
            />
            <div>
              <SectionHeader enTitle="THEME PREVIEW" cnTitle="主题分布" />
              <div className="mt-12 grid gap-10 md:grid-cols-3">
                {themeRules.map((theme) => (
                  <article key={theme.id} className="hud-panel group relative overflow-hidden p-8 transition-all duration-500 hover:bg-white/[0.04]">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-xl" />
                    <div className="relative flex items-start justify-between gap-4">
                      <h3 className="font-sans text-xl font-medium tracking-wide text-white/90">
                        {theme.name}
                      </h3>
                      <Crosshair className="h-4 w-4 shrink-0 text-white/20 transition-all duration-700 group-hover:rotate-90 group-hover:text-accent/60" />
                    </div>
                    <p className="relative mt-5 text-[14px] leading-relaxed text-white/60 transition-colors group-hover:text-white/80">{theme.finalMultiplier}</p>
                    <div className="relative mt-6 border-t border-white/[0.08] pt-4 font-display text-[9px] uppercase tracking-[0.2em] text-white/40 transition-colors group-hover:text-white/60">
                      RESTRICTIONS {theme.restrictions.length} / GROUPS {theme.scoreGroups.length}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal distance={40} delay={0.3}>
          <section className="hud-panel grid gap-10 p-8 lg:grid-cols-[1fr_1fr] lg:p-12">
            <div className="max-w-prose">
              <div className="font-display text-[10px] uppercase tracking-[0.24em] text-accent/80">文档备案</div>
              <h3 className="mt-3 font-sans text-3xl font-medium tracking-wide text-white/95">
                规则文档已结构化入站
              </h3>
              <p className="mt-5 text-[14px] leading-relaxed text-white/70">
                原始 DOCX 作为赛事真源已经被拆解为站内内容模块，当前官网展示的是裁判与选手都能直接阅读的结构化版本，而不是原文附件嵌入。
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="group border border-white/[0.05] bg-white/[0.01] p-6 rounded-sm transition-colors hover:bg-white/[0.03]">
                <ShieldAlert className="h-5 w-5 text-white/30 transition-transform duration-500 group-hover:scale-110 group-hover:text-white/60" />
                <div className="mt-5 font-sans text-lg font-medium text-white/90">
                  系数复核
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-white/60 transition-colors group-hover:text-white/80">
                  超时、重复六星与共享余额都会影响最终系数，单独保留裁判组的系数复核通道确保准确无误。
                </p>
              </div>
              <div className="group border border-white/[0.05] bg-white/[0.01] p-6 rounded-sm transition-colors hover:bg-white/[0.03]">
                <BookOpen className="h-5 w-5 text-white/30 transition-transform duration-500 group-hover:scale-110 group-hover:text-white/60" />
                <div className="mt-5 font-sans text-lg font-medium text-white/90">
                  结构化内容
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-white/60 transition-colors group-hover:text-white/80">
                  三大主题分别按限制条件、关卡加分、倍率和处罚项展开，拒绝纯文本粘贴，方便选手速查阅。
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </PageFrame >
  );
}
