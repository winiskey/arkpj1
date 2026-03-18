import { useEffect, useMemo, useState } from "react";
import { CountUp } from "../components/CountUp";
import { PageFrame } from "../components/PageFrame";
import { PageBackground } from "../components/PageBackground";
import { SectionHeader } from "../components/SectionHeader";
import { useSiteData } from "../context/SiteDataContext";
import { SpotlightCard } from "../components/SpotlightCard";
import { MagneticWrapper } from "../components/MagneticWrapper";
import { useParallaxLogo } from "../lib/useParallaxLogo";
import { findOperatorCatalogEntry, normalizeOperatorName } from "./admin/operatorCatalog";

const MAX_MEMBER_SIX_STAR_PICKS = 13;

function OperatorPickSlot({
  operatorName,
  order,
  duplicate,
}: {
  operatorName?: string;
  order: number;
  duplicate?: boolean;
}) {
  const operator = operatorName ? findOperatorCatalogEntry(operatorName) : null;
  const avatarUrl = operator?.avatarUrl ?? null;

  return (
    <div
      className={[
        "relative overflow-hidden rounded-[18px] border bg-white/[0.03]",
        operatorName
          ? duplicate
            ? "border-live/35 bg-live/10"
            : "border-white/10"
          : "border-dashed border-white/8 bg-transparent",
      ].join(" ")}
    >
      <div className="absolute left-1.5 top-1.5 z-10 rounded-full bg-black/55 px-1.5 py-0.5 font-display text-[9px] font-bold tracking-[0.12em] text-white/50">
        {String(order).padStart(2, "0")}
      </div>

      <div className="aspect-square">
        {operatorName ? (
          avatarUrl ? (
            <img
              alt={operatorName}
              className={[
                "h-full w-full object-cover transition-[filter,opacity] duration-300",
                duplicate ? "grayscale-[0.95] saturate-[0.2] opacity-80" : "opacity-100",
              ].join(" ")}
              loading="lazy"
              src={avatarUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 text-center font-display text-[11px] font-bold tracking-[0.08em] text-brand">
              {operatorName}
            </div>
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-[11px] uppercase tracking-[0.16em] text-white/20">
            Empty
          </div>
        )}
      </div>

      {operatorName ? (
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent_40%)]" />
      ) : null}
    </div>
  );
}

export function TeamsPage() {
  const {
    data: { teams },
  } = useSiteData();
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const logoRef = useParallaxLogo();

  const selectedTeam = useMemo(() => teams.find((team) => team.id === selectedTeamId) ?? teams[0], [selectedTeamId, teams]);
  const selectedTeamDuplicatePickNames = useMemo(() => {
    if (!selectedTeam) {
      return new Set<string>();
    }

    const counts = new Map<string, number>();
    for (const member of selectedTeam.members) {
      for (const pick of member.operatorPicks ?? []) {
        const key = normalizeOperatorName(pick.operatorName);
        if (!key) {
          continue;
        }
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([key]) => key),
    );
  }, [selectedTeam]);
  const selectedTeamPickCount = useMemo(
    () => selectedTeam?.members.reduce((sum, member) => sum + (member.operatorPicks?.length ?? 0), 0) ?? 0,
    [selectedTeam],
  );

  useEffect(() => {
    if (!teams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(teams[0]?.id ?? "");
    }
  }, [selectedTeamId, teams]);

  // 切换队伍时重置展开的选手
  useEffect(() => {
    setExpandedMemberId(null);
  }, [selectedTeamId]);

  if (!selectedTeam) {
    return null;
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden selection:bg-brand/90 selection:text-black">
      <PageBackground logoRef={logoRef} />

      <PageFrame className="relative z-10 gap-8 md:gap-10 lg:gap-14">
        <SectionHeader
          cnTitle="队伍战术情报"
          description="参赛队伍档案与选手阵容总览，点击队伍可查看详细分队配置与能力画像。"
          enTitle="TEAM INTELLIGENCE"
        />

        <div className="grid gap-8 lg:grid-cols-[0.36fr_0.64fr] lg:items-start">
          <aside className="space-y-4 gsap-stagger-item">
            {teams.map((team) => {
              const active = team.id === selectedTeam.id;
              const isTop3 = team.rank <= 3;

              return (
                <SpotlightCard
                  key={team.id}
                  spotlightColor={active ? "rgba(214,192,138,0.15)" : "rgba(255,255,255,0.05)"}
                  className={`group relative cursor-pointer overflow-hidden rounded-[32px] border transition-[transform,border-color,background-color,box-shadow] duration-300 hover:-translate-y-1 ${active
                    ? "border-brand/40 bg-brand/10 shadow-[0_20px_40px_-15px_rgba(214,192,138,0.25)] backdrop-blur-3xl"
                    : "border-white/5 bg-white/[0.02] text-white/40 backdrop-blur-2xl hover:border-white/10 hover:bg-white/[0.04] hover:text-white/80"
                    }`}
                >
                  <button
                    className="w-full cursor-pointer p-5 text-left md:p-6"
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
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="font-display text-[10px] uppercase tracking-[0.25em] text-brand/70">PLANNED PICKS</div>
                      <h3 className="mt-3 font-title text-3xl font-black tracking-[0.03em] text-white/90">赛前抓位总览</h3>
                      <p className="mt-3 max-w-[32rem] text-sm leading-7 text-white/55">
                        这里展示的是队伍赛前计划抓的人，不是比赛中实际抓到的人。每位选手最多规划 13 位六星，若同队规划重复六星，会直接标红置灰。
                      </p>
                    </div>

                    <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-white/5 bg-white/[0.03] px-4 py-4">
                        <div className="font-display text-[10px] uppercase tracking-[0.16em] text-white/35">Planned Total</div>
                        <div className="mt-2 font-display text-3xl font-black tracking-[0.03em] text-white/85">{selectedTeamPickCount}</div>
                      </div>
                      <div className="rounded-[24px] border border-live/15 bg-live/8 px-4 py-4">
                        <div className="font-display text-[10px] uppercase tracking-[0.16em] text-white/35">Conflict Ops</div>
                        <div className={`mt-2 font-display text-3xl font-black tracking-[0.03em] ${selectedTeamDuplicatePickNames.size ? "text-live" : "text-white/85"}`}>
                          {selectedTeamDuplicatePickNames.size}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-3">
                    {selectedTeam.members.map((member) => {
                      const picks = (member.operatorPicks ?? []).slice(0, MAX_MEMBER_SIX_STAR_PICKS);
                      const duplicateCount = picks.filter((pick) => selectedTeamDuplicatePickNames.has(normalizeOperatorName(pick.operatorName))).length;
                      const isExpanded = expandedMemberId === member.id;

                      return (
                        <div key={`${member.id}-pick-board`} className={[
                          "rounded-[28px] border transition-[border-color,background-color] duration-300",
                          isExpanded
                            ? "border-brand/25 bg-brand/5"
                            : "border-white/6 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.05]",
                        ].join(" ")}>
                          {/* 可点击 Header */}
                          <button
                            type="button"
                            className="w-full cursor-pointer p-4 md:p-5 text-left"
                            onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="font-title text-2xl font-black tracking-[0.03em] text-white/88">{member.name}</div>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em]">
                                  <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-brand">{member.role}</span>
                                  <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-white/40">{member.theme}</span>
                                  {duplicateCount ? (
                                    <span className="rounded-full border border-live/30 bg-live/15 px-3 py-1 text-live">重复 {duplicateCount}</span>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-3 text-right">
                                  <div className="font-display text-[10px] uppercase tracking-[0.16em] text-white/30">规划进度</div>
                                  <div className={`mt-1 font-display text-2xl font-black tracking-[0.03em] ${isExpanded ? "text-brand" : "text-white/60"}`}>
                                    {picks.length}/{MAX_MEMBER_SIX_STAR_PICKS}
                                  </div>
                                </div>
                                {/* 展开/折叠箭头 */}
                                <div className={[
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-[transform,border-color,background-color] duration-300",
                                  isExpanded
                                    ? "rotate-180 border-brand/30 bg-brand/15 text-brand"
                                    : "border-white/10 bg-white/[0.04] text-white/40",
                                ].join(" ")}>
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* 可折叠的抓位格区域 */}
                          {isExpanded && (
                            <div className="px-4 pb-4 md:px-5 md:pb-5">
                              <div className="border-t border-white/8 pt-4">
                                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-7">
                                  {Array.from({ length: MAX_MEMBER_SIX_STAR_PICKS }, (_, index) => {
                                    const pick = picks[index];
                                    return (
                                      <OperatorPickSlot
                                        duplicate={pick ? selectedTeamDuplicatePickNames.has(normalizeOperatorName(pick.operatorName)) : false}
                                        key={`${member.id}-pick-slot-${index}`}
                                        operatorName={pick?.operatorName}
                                        order={index + 1}
                                      />
                                    );
                                  })}
                                </div>
                                <div className="mt-3 text-[11px] text-white/35">
                                  {picks.length
                                    ? `已规划 ${picks.length} 位六星${duplicateCount ? `，其中 ${duplicateCount} 位触发同队重复提醒` : "，当前无同队重复"}。`
                                    : "当前还没有公开的赛前抓位规划。"}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SpotlightCard>

            <div className="grid gap-6 md:grid-cols-2">
              {selectedTeam.members.map((member) => {
                const avatarSrc = member.avatar ? encodeURI(member.avatar) : undefined;
                const picks = (member.operatorPicks ?? []).slice(0, MAX_MEMBER_SIX_STAR_PICKS);

                return (
                  <SpotlightCard key={member.id} className="rounded-[32px] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-2xl transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-white/10" spotlightColor="rgba(255,255,255,0.05)">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-5">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[20px] border border-white/10 bg-black/40 shadow-innerGlow">
                          {avatarSrc ? (
                            <img alt={`${member.name} avatar`} className="h-full w-full object-cover grayscale-[0.2] transition-[filter] duration-300 group-hover:grayscale-0" loading="lazy" src={avatarSrc} />
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
                        规划 {picks.length}/{MAX_MEMBER_SIX_STAR_PICKS}
                      </span>
                    </div>

                    <div className="mt-8 space-y-4 border-t border-white/5 pt-6">
                      {[
                        { label: "主题", value: member.theme },
                        { label: "规划", value: picks.length ? `${picks.length}/${MAX_MEMBER_SIX_STAR_PICKS}` : "未公开" },
                        ...(member.signatureOp && member.signatureOp !== "待补充" ? [{ label: "招牌", value: member.signatureOp }] : []),
                        ...(member.squad && !["主攻分队", "推进分队", "运营分队", "终局分队"].includes(member.squad) ? [{ label: "分队", value: member.squad }] : []),
                        ...(member.note && member.note !== "选手资料已同步，详细战术信息待补充。" ? [{ label: "备注", value: member.note }] : []),
                      ].map((item) => (
                        <div key={item.label} className="flex text-sm leading-6">
                          <span className="w-16 shrink-0 font-display text-[11px] uppercase tracking-[0.1em] text-white/30">{item.label}</span>
                          <span className="text-white/60">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 border-t border-white/5 pt-5">
                      <div className="font-display text-[10px] uppercase tracking-[0.18em] text-white/35">PLANNED PREVIEW</div>
                      {picks.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {picks.slice(0, 6).map((pick, index) => (
                            <div key={`${member.id}-preview-${pick.id}-${index}`} className="w-12">
                              <OperatorPickSlot
                                duplicate={selectedTeamDuplicatePickNames.has(normalizeOperatorName(pick.operatorName))}
                                operatorName={pick.operatorName}
                                order={index + 1}
                              />
                            </div>
                          ))}
                          {picks.length > 6 ? (
                            <div className="flex w-12 items-center justify-center rounded-[18px] border border-white/8 bg-white/[0.03] font-display text-[11px] font-bold tracking-[0.08em] text-white/40">
                              +{picks.length - 6}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-3 text-sm text-white/35">尚未公开赛前抓位。</div>
                      )}
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
