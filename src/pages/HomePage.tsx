import { ArrowRight, BookOpen, CalendarDays, MapPin, Radio, ShieldAlert, Trophy, Users2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ClipButton } from "../components/ClipButton";
import { ScrollReveal } from "../components/ScrollReveal";
import { PageFrame } from "../components/PageFrame";
import { useSiteData } from "../context/SiteDataContext";
import { SpotlightCard } from "../components/SpotlightCard";
import { MagneticWrapper } from "../components/MagneticWrapper";

const liveStatusTone = {
  LIVE: {
    label: "主会场直播中",
    tone: "border-live/35 bg-live/15 text-[#ffd8cf]",
  },
  UPCOMING: {
    label: "即将开播",
    tone: "border-brand/24 bg-brand/10 text-brandStrong",
  },
  OFFLINE: {
    label: "暂未开播",
    tone: "border-white/10 bg-white/[0.05] text-text2",
  },
} as const;

function formatEventDate(date: string) {
  return date.replace(/-/g, ".");
}

export function HomePage() {
  const {
    data: { liveBroadcast, siteMeta, teams, themeRules },
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
        // Increase multiplier drastically from 60 to 240 for noticeable movement
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

  const primaryPrize = siteMeta.prizePool[0];
  const statusMeta = liveStatusTone[liveBroadcast.status as keyof typeof liveStatusTone] ?? liveStatusTone.OFFLINE;
  const heroMeta = [
    {
      icon: CalendarDays,
      label: "开赛时间",
      value: formatEventDate(siteMeta.startDate),
    },
    {
      icon: MapPin,
      label: "赛事形态",
      value: siteMeta.locationLabel,
    },
    {
      icon: Trophy,
      label: primaryPrize?.label ?? "冠军奖励",
      value: primaryPrize?.value ?? "--",
    },
  ];
  const liveMetrics = [
    {
      label: "参赛队伍",
      value: String(teams.length).padStart(2, "0"),
      detail: "已完成队伍档案同步",
    },
    {
      label: "主题线路",
      value: String(themeRules.length).padStart(2, "0"),
      detail: "计分与限制规则并行",
    },
    {
      label: "冠军奖励",
      value: primaryPrize?.value ?? "--",
      detail: primaryPrize?.label ?? "奖励池",
    },
  ];

  return (
    <PageFrame className="relative min-h-[100dvh] w-full overflow-hidden selection:bg-brand/90 selection:text-black">
      {/* 1. Logo Core Matrix (Absolute Background) */}
      <div className="pointer-events-none absolute left-[65%] top-[55%] -z-30 flex h-[160vw] w-[160vw] max-w-[1600px] -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-[0.06] mix-blend-screen md:left-[70%] md:h-[120vw] md:w-[120vw] xl:left-[75%] xl:top-1/2 xl:h-[100vw] xl:w-[100vw]">
        {/* Adjusted to be much dimmer and pushed deep into the background to avoid distraction */}
        <img ref={logoRef} src="/logo.svg" alt="Core Matrix" className="animate-spin-slower h-full w-full object-contain brightness-75 drop-shadow-[0_0_40px_rgba(214,192,138,0.15)]" />
      </div>

      {/* Deep environmental radial glow (Backlight for the logo) */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_70%_50%,rgba(214,192,138,0.06),transparent_75%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-5 py-12 md:px-10 md:py-20 xl:px-16">

        {/* Spatial Asymmetrical Layout */}
        <div className="flex flex-1 flex-col justify-center gap-14 lg:flex-row lg:items-center lg:justify-between lg:gap-20">

          {/* L-Wing: Title & Core Focus */}
          <ScrollReveal delay={0} distance={40} className="relative z-20 flex max-w-[640px] flex-col justify-center space-y-10 lg:w-1/2">
            <div className="flex flex-wrap items-center gap-4 text-text2">
              <span className="rounded-full border border-brand/20 bg-brand/10 px-5 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
                Season Interface
              </span>
              <span className="font-display text-xs uppercase tracking-[0.18em] text-white/50">{siteMeta.eventCode}</span>
            </div>

            <div className="space-y-4">
              <div className="font-display text-[13px] uppercase tracking-[0.25em] text-white/40">Signal Ceremony / Entry Sequence</div>
              <h1 className="font-title text-[4.8rem] font-black leading-[0.95] tracking-tight text-white drop-shadow-2xl sm:text-[5.8rem] md:text-[6.8rem] xl:text-[8.2rem]">
                荆楚歌
                <span className="ml-4 inline-block align-top font-display text-[1.8rem] font-bold uppercase tracking-[0.16em] text-brand/90 drop-shadow-lg md:text-[2.4rem] xl:text-[3rem]">
                  #2
                </span>
              </h1>
            </div>

            <p className="max-w-[540px] text-balance font-title text-xl font-bold leading-relaxed text-white/70 shadow-black drop-shadow-md md:text-2xl md:leading-relaxed">
              湖北高校集成战略赛事主站
            </p>

            <div className="pt-8">
              <MagneticWrapper strength={40}>
                <ClipButton size="lg" to="/live" variant="primary" className="!rounded-full border-none !bg-brand px-10 py-5 font-bold !text-black shadow-[0_0_40px_-5px_rgba(214,192,138,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-black hover:!bg-brandStrong hover:shadow-[0_0_60px_-10px_rgba(231,215,173,0.8)]">
                  进入主会场现场
                  <ArrowRight className="ml-3 h-5 w-5" />
                </ClipButton>
              </MagneticWrapper>
            </div>
          </ScrollReveal>

          {/* R-Wing: Floating Glass Matrix */}
          <div className="relative z-20 flex flex-col gap-6 lg:w-[480px]">

            {/* Live Status Glass Pill */}
            <ScrollReveal delay={0.15} distance={20} className="w-full">
              <SpotlightCard spotlightColor="rgba(255,255,255,0.08)" className="group relative flex items-center justify-between overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_20px_40px_-20px_rgba(0,0,0,0.6)] backdrop-blur-3xl transition-all duration-500 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_30px_50px_-20px_rgba(0,0,0,0.7)]">
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="flex items-center gap-5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${statusMeta.tone}`}>
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display text-[11px] uppercase tracking-[0.2em] text-white/50">当前状态</div>
                    <div className="mt-1 font-title text-lg font-bold text-white/90">{statusMeta.label}</div>
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-black/40 px-4 py-2 font-display text-[11px] uppercase tracking-[0.16em] text-brand/80">
                  {liveBroadcast.roomLabel}
                </div>
              </SpotlightCard>
            </ScrollReveal>

            {/* Quick Portals - Teams Glass */}
            <ScrollReveal delay={0.25} distance={20} className="w-full">
              <SpotlightCard spotlightColor="rgba(214,192,138,0.15)" className="group relative overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.03] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_24px_48px_-24px_rgba(0,0,0,0.7)] backdrop-blur-3xl transition-all duration-500 hover:-translate-y-1 hover:border-brand/40 hover:bg-white/[0.05] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_50px_-10px_rgba(214,192,138,0.2)]">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_100%_0%,rgba(214,192,138,0.15),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <Link to="/teams" className="relative z-10 flex items-center justify-between outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-2xl">
                  <div className="flex items-center gap-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/70 transition-all duration-500 group-hover:border-brand/40 group-hover:bg-brand/10 group-hover:text-brand group-hover:shadow-[0_0_20px_-5px_rgba(214,192,138,0.4)]">
                      <Users2 className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-title text-2xl font-bold text-white/90 transition-colors group-hover:text-white">队伍情报</div>
                      <div className="mt-1.5 font-display text-[11px] uppercase tracking-[0.2em] text-white/40">{String(teams.length).padStart(2, "0")} 支队伍档案同步</div>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/40 transition-all duration-500 group-hover:bg-brand/20 group-hover:text-brand">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </Link>
              </SpotlightCard>
            </ScrollReveal>

            {/* Quick Portals - Rules Glass */}
            <ScrollReveal delay={0.35} distance={20} className="w-full">
              <SpotlightCard spotlightColor="rgba(214,192,138,0.15)" className="group relative overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.03] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_24px_48px_-24px_rgba(0,0,0,0.7)] backdrop-blur-3xl transition-all duration-500 hover:-translate-y-1 hover:border-brand/40 hover:bg-white/[0.05] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_50px_-10px_rgba(214,192,138,0.2)]">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_100%_0%,rgba(214,192,138,0.15),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <Link to="/rules" className="relative z-10 flex items-center justify-between outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-2xl">
                  <div className="flex items-center gap-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/70 transition-all duration-500 group-hover:border-brand/40 group-hover:bg-brand/10 group-hover:text-brand group-hover:shadow-[0_0_20px_-5px_rgba(214,192,138,0.4)]">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-title text-2xl font-bold text-white/90 transition-colors group-hover:text-white">赛事手册</div>
                      <div className="mt-1.5 font-display text-[11px] uppercase tracking-[0.2em] text-white/40">{String(themeRules.length).padStart(2, "0")} 条主题线路复核</div>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/40 transition-all duration-500 group-hover:bg-brand/20 group-hover:text-brand">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </Link>
              </SpotlightCard>
            </ScrollReveal>

          </div>
        </div>

        {/* Floating Base (Event Brief) */}
        <ScrollReveal delay={0.45} distance={20} className="relative z-20 mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:mt-auto xl:gap-12">
          {heroMeta.map((item) => (
            <SpotlightCard key={item.label} spotlightColor="rgba(255,255,255,0.06)" className="group flex flex-col justify-between rounded-[32px] border border-white/5 bg-transparent p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.02] hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] lg:p-8">
              <div className="font-display text-[11px] font-bold uppercase tracking-[0.25em] text-white/40 transition-colors group-hover:text-white/60">{item.label}</div>
              <div className="mt-5 font-display text-2xl font-semibold tracking-wider text-white/80 transition-colors group-hover:text-brand lg:text-[1.7rem]">{item.value}</div>
            </SpotlightCard>
          ))}
        </ScrollReveal>

      </div>
    </PageFrame>
  );
}
