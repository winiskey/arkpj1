import { useEffect, useMemo, useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { RadarChart } from "../components/RadarChart";
import { CountUp } from "../components/CountUp";
import { PageFrame } from "../components/PageFrame";
import { SectionHeader } from "../components/SectionHeader";
import { useSiteData } from "../context/SiteDataContext";
import { SpotlightCard } from "../components/SpotlightCard";
import { MagneticWrapper } from "../components/MagneticWrapper";

export function TeamsPage() {
  const {
    data: { teams },
  } = useSiteData();
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");

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

  const selectedTeam = useMemo(() => teams.find((team) => team.id === selectedTeamId) ?? teams[0], [selectedTeamId, teams]);

  useEffect(() => {
    if (!teams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(teams[0]?.id ?? "");
    }
  }, [selectedTeamId, teams]);

  if (!selectedTeam) {
    return null;
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden selection:bg-brand/90 selection:text-black">
      {/* Global Parallax Matrix Background */}
      <div className="pointer-events-none absolute left-[75%] top-[15%] -z-30 flex h-[160vw] w-[160vw] max-w-[1600px] -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-[0.06] mix-blend-screen md:left-[80%] md:top-[20%] xl:left-[85%]">
        <img ref={logoRef} src="/logo.svg" alt="Core Matrix" className="animate-spin-slower animate-float-subtle h-full w-full object-contain brightness-75 drop-shadow-[0_0_40px_rgba(214,192,138,0.15)]" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_70%_25%,rgba(214,192,138,0.06),transparent_75%)] animate-pulse-subtle" />

      <PageFrame className="relative z-10 gap-8 md:gap-10 lg:gap-14">
        <SectionHeader
          cnTitle="队伍战术情报"
          description="把战队切换、画像、能力雷达与成员资料收束到同一页，形成更像情报中枢而不是散乱列表的阅读体验。"
          enTitle="TEAM INTELLIGENCE"
        />

        <div className="grid gap-8 xl:grid-cols-[0.36fr_0.64fr] xl:items-start">
          <aside className="space-y-4 gsap-stagger-item">
            {teams.map((team) => {
              const active = team.id === selectedTeam.id;
              const isTop3 = team.rank <= 3;

              return (
                <SpotlightCard
                  key={team.id}
                  spotlightColor={active ? "rgba(214,192,138,0.15)" : "rgba(255,255,255,0.05)"}
                  className={`group relative overflow-hidden rounded-[32px] border transition-all duration-500 hover:-translate-y-1 ${active
                    ? "border-brand/40 bg-brand/10 shadow-[0_20px_40px_-15px_rgba(214,192,138,0.25)] backdrop-blur-3xl"
                    : "border-white/5 bg-white/[0.02] text-white/40 backdrop-blur-2xl hover:border-white/10 hover:bg-white/[0.04] hover:text-white/80"
                    }`}
                >
                  <button
                    className="w-full p-5 text-left md:p-6"
                    onClick={() => {
                      if (!active) setSelectedTeamId(team.id);
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className={`font-display text-[11px] uppercase tracking-[0.2em] ${active ? "text-brand" : "text-white/40"}`}>
                          {team.status}
                        </div>
                        <div className={`mt-3 font-title text-3xl font-black tracking-[0.03em] ${active ? "text-white" : "text-white/80"}`}>
                          {team.name}
                        </div>
                        <div className="mt-2 font-display text-[10px] uppercase tracking-[0.2em] text-white/30">{team.enName}</div>
                      </div>
                      <div className={`rounded-2xl border px-3.5 py-2.5 text-right transition-colors ${active ? "border-brand/30 bg-brand/20" : "border-white/5 bg-black/20"
                        }`}>
                        <div className="font-display text-[10px] uppercase tracking-[0.16em] text-white/30">Rank</div>
                        <div className={`mt-1 font-display text-2xl font-black tracking-[0.03em] ${isTop3 ? "text-brand" : "text-white/60"}`}>
                          #{team.rank}
                        </div>
                      </div>
                    </div>
                    <div className={`mt-6 flex items-center justify-between border-t pt-5 text-xs ${active ? "border-brand/20" : "border-white/5"}`}>
                      <span className="text-white/30">{team.sample ? "DUMMY DATA" : "OFFICIAL DATA"}</span>
                      <span className={`font-display text-base font-black tracking-[0.04em] ${active ? "text-brand" : "text-white/60"}`}>{team.totalScore}</span>
                    </div>
                  </button>
                </SpotlightCard>
              );
            })}
          </aside>

          <section key={selectedTeam.id} className="space-y-6 animate-panel-enter">
            <SpotlightCard glowBorder className="overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-3xl md:p-10 xl:p-12" spotlightColor="rgba(255,255,255,0.06)">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent opacity-50" />
              <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
                <div className="space-y-8">
                  <div>
                    <div className="font-display text-[10px] uppercase tracking-[0.3em] text-brand/70">SQUAD IDENTIFIER</div>
                    <h2 className="mt-3 font-title text-4xl font-black tracking-[0.03em] text-white/90 md:text-5xl xl:text-[3.9rem] xl:leading-[1.02]">
                      {selectedTeam.name}
                    </h2>
                    <div className="mt-3 font-display text-sm uppercase tracking-[0.14em] text-white/30">{selectedTeam.enName}</div>

                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-white/5 bg-white/[0.02] px-5 py-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                        <div className="font-display text-[11px] uppercase tracking-[0.16em] text-white/30">Current Rank</div>
                        <div className="mt-3 font-display text-4xl font-black tracking-[0.03em] text-white/80">#{selectedTeam.rank}</div>
                      </div>
                      <div className="rounded-[24px] border border-brand/20 bg-brand/5 px-5 py-5 shadow-[inset_0_1px_1px_rgba(214,192,138,0.1)]">
                        <div className="font-display text-[11px] uppercase tracking-[0.16em] text-brand/70">Total Score</div>
                        <div className="mt-3 font-display text-4xl font-black tracking-[0.03em] text-brand">
                          <CountUp end={selectedTeam.totalScore} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 rounded-[32px] border border-white/5 bg-white/[0.02] p-6 md:p-8">
                      <div className="font-display text-[10px] uppercase tracking-[0.25em] text-white/40">TEAM MANIFESTO</div>
                      <p className="mt-5 text-[15px] leading-8 text-white/60">{selectedTeam.manifesto}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-6 md:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="relative pb-4">
                    <RadarChart data={selectedTeam.radarStats} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedTeam.radarStats.map((metric) => (
                      <div key={metric.label} className="rounded-[24px] border border-white/5 bg-white/[0.03] px-5 py-5 transition-all hover:bg-white/[0.05]">
                        <div className="font-display text-[11px] uppercase tracking-[0.16em] text-white/40">{metric.label}</div>
                        <div className="mt-3 font-display text-3xl font-black tracking-[0.03em] text-brand">
                          <CountUp end={metric.value} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SpotlightCard>

            <div className="grid gap-6 md:grid-cols-2">
              {selectedTeam.members.map((member) => {
                const avatarSrc = member.avatar ? encodeURI(member.avatar) : undefined;

                return (
                  <SpotlightCard key={member.id} className="rounded-[32px] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:border-white/10" spotlightColor="rgba(255,255,255,0.05)">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-5">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[20px] border border-white/10 bg-black/40 shadow-innerGlow">
                          {avatarSrc ? (
                            <img alt={`${member.name} avatar`} className="h-full w-full object-cover grayscale-[0.2] transition-all group-hover:grayscale-0" loading="lazy" src={avatarSrc} />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-display text-[11px] uppercase tracking-[0.16em] text-white/30">
                              {member.id}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-title text-2xl font-black tracking-[0.03em] text-white/90 group-hover:text-white transition-colors">{member.name}</h3>
                          <div className="mt-2 font-display text-[11px] uppercase tracking-[0.2em] text-brand/80">{member.role}</div>
                        </div>
                      </div>
                      <span className="rounded-full border border-white/5 bg-white/[0.05] px-3.5 py-1.5 font-display text-[10px] uppercase tracking-[0.16em] text-white/40">
                        {member.id}
                      </span>
                    </div>

                    <div className="mt-8 space-y-4 border-t border-white/5 pt-6">
                      {[
                        { label: "主题", value: member.theme },
                        { label: "招牌", value: member.signatureOp },
                        { label: "分队", value: member.squad },
                        { label: "备注", value: member.note },
                      ].map((item) => (
                        <div key={item.label} className="flex text-sm leading-6">
                          <span className="w-16 shrink-0 font-display text-[11px] uppercase tracking-[0.1em] text-white/30">{item.label}</span>
                          <span className="text-white/60">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          </section>
        </div>
      </PageFrame>
    </div>
  );
}
