import { useEffect, useMemo, useState } from "react";
import { RadarChart } from "../components/RadarChart";
import { CountUp } from "../components/CountUp";
import { PageFrame } from "../components/PageFrame";
import { SectionHeader } from "../components/SectionHeader";
import { useSiteData } from "../context/SiteDataContext";

export function TeamsPage() {
  const {
    data: { teams },
  } = useSiteData();
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? teams[0],
    [selectedTeamId, teams],
  );

  useEffect(() => {
    if (!teams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(teams[0]?.id ?? "");
    }
  }, [selectedTeamId, teams]);

  if (!selectedTeam) {
    return null;
  }

  return (
    <PageFrame>
      <SectionHeader enTitle="TEAM INTELLIGENCE" cnTitle="队伍战术情报" />
      <div className="grid gap-8 xl:grid-cols-[0.38fr_0.62fr] xl:items-start">
        <aside className="space-y-4 gsap-stagger-item">
          {teams.map((team) => {
            const active = team.id === selectedTeam.id;
            return (
              <button
                key={team.id}
                className={`hud-panel w-full p-6 text-left transition duration-500 ${active ? "bg-white/[0.04] border-accent/50 shadow-[0_0_15px_rgba(212,190,136,0.15)]" : "bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.03]"}`}
                onClick={() => setSelectedTeamId(team.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-[10px] tracking-[0.2em] text-accent/80 uppercase">{team.status}</div>
                    <h3 className="mt-3 font-sans text-xl font-medium tracking-wide text-white/95">
                      {team.name}
                    </h3>
                    <div className="mt-2 font-display text-xs tracking-wider text-white/40">{team.enName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-[10px] tracking-[0.2em] text-white/30 uppercase">RANK</div>
                    <div className="font-display flex align-baseline gap-1 justify-end font-medium text-2xl text-accent/90">
                      <span className="text-xs text-accent/50">#</span>{team.rank}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-4 text-[13px] text-white/50">
                  <span>{team.sample ? "示例战队数据" : "正式战队资料"}</span>
                  <span className="font-display text-sm tracking-widest">{team.totalScore}</span>
                </div>
              </button>
            );
          })}
        </aside>

        <section className="space-y-6">
          <div className="hud-panel gsap-stagger-item bg-white/[0.01] border-white/[0.05] p-8 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr]">
              <div>
                <div className="font-display text-[10px] tracking-[0.2em] text-accent/80 uppercase">SQUAD IDENTIFIER</div>
                <h2 className="mt-3 font-sans text-4xl font-bold tracking-wide text-white/95">
                  {selectedTeam.name}
                </h2>
                <div className="mt-3 font-display text-sm tracking-wider text-white/40 uppercase">{selectedTeam.enName}</div>
                <div className="mt-10 grid gap-6 sm:grid-cols-2">
                  <div>
                    <div className="font-display text-[10px] tracking-[0.2em] text-white/40 uppercase">CURRENT RANK</div>
                    <div className="mt-2 font-display text-4xl font-medium text-white/90">
                      <span className="text-lg text-white/30">#</span>{selectedTeam.rank}
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-[10px] tracking-[0.2em] text-white/40 uppercase">TOTAL SCORE</div>
                    <div className="mt-2 font-display text-4xl font-medium text-accent">
                      <CountUp end={selectedTeam.totalScore} />
                    </div>
                  </div>
                </div>
                <div className="mt-10 rounded-sm border border-white/[0.05] bg-black/40 p-8">
                  <div className="font-display text-[10px] tracking-[0.2em] text-accent/80 uppercase">TEAM MANIFESTO</div>
                  <p className="mt-5 font-sans text-[15px] leading-[1.8] text-white/70">
                    {selectedTeam.manifesto}
                  </p>
                </div>
              </div>
              <div>
                <RadarChart data={selectedTeam.radarStats} />
                <div className="grid gap-4 sm:grid-cols-2">
                  {selectedTeam.radarStats.map((metric) => (
                    <div key={metric.label} className="rounded-sm border border-white/[0.05] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
                      <div className="font-display text-[10px] tracking-[0.2em] text-white/40 uppercase">{metric.label}</div>
                      <div className="mt-3 font-display text-2xl font-medium text-accent/90">
                        <CountUp end={metric.value} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {selectedTeam.members.map((member) => {
              const avatarSrc = member.avatar ? encodeURI(member.avatar) : undefined;

              return (
                <article key={member.id} className="clip-corner gsap-stagger-item hud-panel relative overflow-hidden bg-white/[0.01] border-white/[0.05] p-6 transition duration-500 hover:bg-white/[0.03] hover:border-accent/40">
                  <div className="pointer-events-none absolute -bottom-4 -right-4 font-display text-7xl font-bold tracking-tighter text-white/[0.03]">
                    {member.id}
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-white/[0.08] bg-black/40">
                          {avatarSrc ? (
                            <img alt={`${member.name} avatar`} className="h-full w-full object-cover" loading="lazy" src={avatarSrc} />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-display text-[10px] tracking-[0.2em] text-white/40">
                              {member.id}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-sans text-lg font-bold tracking-wide text-white/95">
                            {member.name}
                          </h3>
                          <div className="mt-1.5 font-display text-[10px] tracking-[0.24em] text-accent uppercase">{member.role}</div>
                        </div>
                      </div>
                      <span className="rounded-sm border border-white/[0.08] bg-white/[0.02] px-2 py-1 font-display text-[10px] tracking-[0.2em] text-white/50">
                        {member.id}
                      </span>
                    </div>

                    <ul className="mt-5 space-y-2 border-t border-white/[0.08] pt-5 font-sans text-[13px] leading-relaxed text-white/70">
                      <li><span className="text-white/40 inline-block w-12">主题</span>{member.theme}</li>
                      <li><span className="text-white/40 inline-block w-12">招牌</span>{member.signatureOp}</li>
                      <li><span className="text-white/40 inline-block w-12">分队</span>{member.squad}</li>
                      <li><span className="text-white/40 inline-block w-12">备注</span>{member.note}</li>
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </PageFrame>
  );
}
