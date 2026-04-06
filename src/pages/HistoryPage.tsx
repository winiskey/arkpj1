import { PageBackground } from "../components/PageBackground";
import { PageFrame } from "../components/PageFrame";
import { ScrollReveal } from "../components/ScrollReveal";
import { SectionHeader } from "../components/SectionHeader";
import { ClipButton } from "../components/ClipButton";
import { useParallaxLogo } from "../lib/useParallaxLogo";

const plannedModules = [
  "历届赛程与赛果归档",
  "冠军与队伍档案整理",
  "高光对局与赛事回顾",
];

export function HistoryPage() {
  const logoRef = useParallaxLogo();

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden selection:bg-brand/90 selection:text-black">
      <PageBackground logoRef={logoRef} />

      <PageFrame className="relative z-10 gap-8 md:gap-10 lg:gap-14">
        <SectionHeader
          cnTitle="往届赛事"
          description="历史赛事页面仍在整理中，完整的往届档案与精彩回顾将在后续版本开放。"
          enTitle="EVENT HISTORY"
        />

        <ScrollReveal>
          <section className="relative overflow-hidden rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 backdrop-blur-3xl md:p-10 lg:p-14">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/35 to-transparent" />
            <div className="absolute -right-24 top-12 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
            <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 rounded-full border border-brand/20 bg-brand/8 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_12px_rgba(214,192,138,0.75)]" />
                  <span className="font-display text-[11px] uppercase tracking-[0.28em] text-brand/80">
                    In Development
                  </span>
                </div>

                <div className="space-y-4">
                  <h3 className="max-w-3xl font-title text-4xl font-black tracking-[0.03em] text-white/92 md:text-5xl lg:text-6xl lg:leading-[1.04]">
                    往届赛事页面正在开发中
                  </h3>
                  <p className="max-w-2xl text-[15px] leading-8 text-white/55 md:text-base">
                    当前版本暂不展示历届赛事详情。后续会补充完整的冠军记录、赛事脉络、高光回顾与历史数据，方便统一查阅。
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <ClipButton size="lg" to="/live" variant="primary">
                    前往赛事大厅
                  </ClipButton>
                  <ClipButton size="lg" to="/" variant="secondary">
                    返回首页
                  </ClipButton>
                </div>
              </div>

              <div className="grid gap-3">
                {plannedModules.map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/8 bg-black/20 px-5 py-4 text-sm leading-7 text-white/68"
                  >
                    <div className="font-display text-[10px] uppercase tracking-[0.2em] text-brand/58">Planned</div>
                    <div className="mt-2 font-title text-xl font-bold tracking-[0.03em] text-white/88">{item}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      </PageFrame>
    </div>
  );
}
