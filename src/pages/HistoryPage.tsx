import { PageFrame } from "../components/PageFrame";
import { PageBackground } from "../components/PageBackground";
import { SectionHeader } from "../components/SectionHeader";
import { ScrollReveal } from "../components/ScrollReveal";
import { SpotlightCard } from "../components/SpotlightCard";
import { useParallaxLogo } from "../lib/useParallaxLogo";
import { historyEvents } from "../content/history";

export function HistoryPage() {
  const logoRef = useParallaxLogo();

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden selection:bg-brand/90 selection:text-black">
      <PageBackground logoRef={logoRef} />

      <PageFrame className="relative z-10 gap-8 md:gap-10 lg:gap-14">
        <SectionHeader
          cnTitle="历史赛事回顾"
          description="回顾荆楚歌历届赛事的精彩历程与冠军荣耀。"
          enTitle="EVENT HISTORY"
        />

        {/* Timeline */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-6 top-0 bottom-0 hidden w-px bg-gradient-to-b from-brand/40 via-brand/20 to-transparent md:block" />

          <div className="space-y-8 md:space-y-12">
            {historyEvents.map((event, index) => (
              <ScrollReveal key={event.id} delay={index * 0.08}>
                <div className="relative md:pl-16">
                  {/* Timeline dot */}
                  <div className="absolute left-4 top-8 hidden h-5 w-5 items-center justify-center md:flex">
                    <div className="absolute h-full w-full rotate-45 border border-brand/50 bg-brand/10" />
                    <div className="relative h-1.5 w-1.5 bg-brand" />
                  </div>

                  <SpotlightCard
                    className="overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-3xl md:p-8 lg:p-10"
                    spotlightColor="rgba(214,192,138,0.06)"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/25 to-transparent opacity-50" />

                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="font-display text-[10px] uppercase tracking-[0.3em] text-brand/70">
                          {event.season}
                        </div>
                        <h3 className="mt-3 font-title text-3xl font-black tracking-[0.03em] text-white/90 md:text-4xl">
                          {event.name}
                        </h3>
                        <div className="mt-2 font-display text-sm tracking-[0.08em] text-white/40">
                          {event.date}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="rounded-[20px] border border-brand/25 bg-brand/10 px-5 py-4 text-center">
                          <div className="font-display text-[10px] uppercase tracking-[0.16em] text-brand/70">Champion</div>
                          <div className="mt-2 font-title text-lg font-black tracking-[0.03em] text-brand">
                            {event.champion.teamName}
                          </div>
                          <div className="mt-1 font-display text-[10px] uppercase tracking-[0.2em] text-brand/50">
                            {event.champion.teamTag}
                          </div>
                        </div>
                        {event.runnerUp ? (
                          <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-5 py-4 text-center">
                            <div className="font-display text-[10px] uppercase tracking-[0.16em] text-white/35">Runner-up</div>
                            <div className="mt-2 font-title text-lg font-black tracking-[0.03em] text-white/70">
                              {event.runnerUp.teamName}
                            </div>
                            <div className="mt-1 font-display text-[10px] uppercase tracking-[0.2em] text-white/30">
                              {event.runnerUp.teamTag}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-8 border-t border-white/5 pt-6 text-[15px] leading-8 text-white/55">
                      {event.summary}
                    </p>

                    {event.highlights.length > 0 ? (
                      <div className="mt-6">
                        <div className="font-display text-[10px] uppercase tracking-[0.25em] text-white/35">KEY MOMENTS</div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {event.highlights.map((highlight, hIndex) => (
                            <div
                              key={hIndex}
                              className="flex items-start gap-3 rounded-[16px] border border-white/5 bg-white/[0.02] px-4 py-3"
                            >
                              <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
                                <div className="h-1.5 w-1.5 rotate-45 bg-brand/60" />
                              </div>
                              <span className="text-sm leading-6 text-white/50">{highlight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </SpotlightCard>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Current season callout */}
        <ScrollReveal delay={0.2}>
          <div className="mt-4 rounded-[32px] border border-brand/15 bg-brand/5 p-6 text-center md:p-10">
            <div className="font-display text-[10px] uppercase tracking-[0.3em] text-brand/70">NOW PLAYING</div>
            <h3 className="mt-3 font-title text-2xl font-black tracking-[0.03em] text-white/90 md:text-3xl">
              荆楚歌 #2 正在进行中
            </h3>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/50">
              第二届荆楚歌集成战略赛事火热进行中，前往赛事大厅查看实时战况。
            </p>
          </div>
        </ScrollReveal>
      </PageFrame>
    </div>
  );
}
