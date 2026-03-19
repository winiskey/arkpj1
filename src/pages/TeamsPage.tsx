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
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

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

  // 当前展示抓位的选手
  const activeMember = useMemo(() => {
    if (!selectedTeam) return null;
    if (selectedMemberId) {
      const found = selectedTeam.members.find((m) => m.id === selectedMemberId);
      if (found) return found;
    }
    return selectedTeam.members[0] ?? null;
  }, [selectedTeam, selectedMemberId]);

  useEffect(() => {
    if (!teams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(teams[0]?.id ?? "");
    }
  }, [selectedTeamId, teams]);

  // 切换队伍时重置选中的选手
  useEffect(() => {
    setSelectedMemberId(null);
  }, [selectedTeamId]);

  if (!selectedTeam) {
    return null;
  }

  const activePicks = (activeMember?.operatorPicks ?? []).slice(0, MAX_MEMBER_SIX_STAR_PICKS);
  const activeDuplicateCount = activePicks.filter((pick) => selectedTeamDuplicatePickNames.has(normalizeOperatorName(pick.operatorName))).length;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden selection:bg-brand/90 selection:text-black">
      <PageBackground logoRef={logoRef} />

      <PageFrame className="relative z-10 gap-8 md:gap-10 lg:gap-14">
        <SectionHeader
          cnTitle="队伍战术情报"
          description="参赛战队档案与选手阵容一览，点击队伍查看详细配置与抓位规划。"
          enTitle="TEAM INTELLIGENCE"
        />

        <div className="grid gap-8 lg:grid-cols-[0.36fr_0.64fr] lg:items-start">
          {/* ─── 左侧：队伍选取器 ─── */}
          <aside className="space-y-4 gsap-stagger-item">
            {teams.map((team) => {
              const active = team.id === selectedTeam.id;
              const isTop3 = team.rank <= 3;

              return (
                <SpotlightCard
                  key={team.id}
                  spotlightColor={active ? "rgba(214,192,138,0.15)" : "rgba(255,255,255,0.05)"}
                  className={`group relative cursor-pointer overflow-hidden rounded-[32px] border transition-[transform,border-color,background-color,box-shadow] duration-300 hover:-translate-y-0.5 ${active
                    ? "border-brand/40 bg-brand/10 shadow-[0_20px_40px_-15px_rgba(214,192,138,0.25)] backdrop-blur-3xl"
                    : "border-white/5 bg-white/[0.02] text-white/40 backdrop-blur-2xl hover:border-white/10 hover:bg-white/[0.04] hover:text-white/80"
                    }`}
                >
                  <button
                    className="w-full cursor-pointer p-5 text-left"
                    onClick={() => {
                      if (!active) setSelectedTeamId(team.id);
                    }}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`font-display text-[10px] uppercase tracking-[0.18em] ${active ? "text-brand" : "text-white/35"}`}>
                            {team.status}
                          </div>
                          {team.sample && (
                            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-display text-[9px] uppercase tracking-[0.12em] text-white/25">
                              SAMPLE
                            </span>
                          )}
                        </div>
                        <div className={`mt-2 truncate font-title text-[1.65rem] font-black tracking-[0.03em] ${active ? "text-white" : "text-white/80"}`}>
                          {team.name}
                        </div>
                        <div className="mt-1.5 font-display text-[10px] uppercase tracking-[0.18em] text-white/25">{team.enName}</div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className={`font-display text-base font-black tracking-[0.04em] ${active ? "text-brand" : "text-white/50"}`}>{team.totalScore}</span>
                        <div className={`rounded-2xl border px-3 py-2 text-center transition-colors ${active ? "border-brand/30 bg-brand/20" : "border-white/5 bg-black/20"}`}>
                          <div className={`font-display text-xl font-black tracking-[0.03em] ${isTop3 ? "text-brand" : "text-white/55"}`}>
                            #{team.rank}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </SpotlightCard>
              );
            })}
          </aside>

          {/* ─── 右侧：队伍详情面板 ─── */}
          <section key={selectedTeam.id} className="space-y-6 animate-panel-enter">
            <SpotlightCard glowBorder className="overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-3xl md:p-8 xl:p-10" spotlightColor="rgba(255,255,255,0.06)">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent opacity-50" />

              {/* 队伍概况：紧凑单列 */}
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="font-display text-[10px] uppercase tracking-[0.3em] text-brand/70">SQUAD IDENTIFIER</div>
                    <h2 className="mt-2 font-title text-4xl font-black tracking-[0.03em] text-white/90 md:text-5xl">
                      {selectedTeam.name}
                    </h2>
                    <div className="mt-2 font-display text-sm uppercase tracking-[0.14em] text-white/30">{selectedTeam.enName}</div>
                  </div>

                  {/* 统计行 */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="rounded-[18px] border border-white/5 bg-white/[0.02] px-4 py-2.5">
                      <div className="font-display text-[10px] uppercase tracking-[0.14em] text-white/30">Rank</div>
                      <div className="mt-0.5 font-display text-2xl font-black tracking-[0.03em] text-white/80">#{selectedTeam.rank}</div>
                    </div>
                    <div className="rounded-[18px] border border-brand/20 bg-brand/5 px-4 py-2.5">
                      <div className="font-display text-[10px] uppercase tracking-[0.14em] text-brand/70">Score</div>
                      <div className="mt-0.5 font-display text-2xl font-black tracking-[0.03em] text-brand">
                        <CountUp decimals={1} end={selectedTeam.totalScore} />
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-white/5 bg-white/[0.02] px-4 py-2.5">
                      <div className="font-display text-[10px] uppercase tracking-[0.14em] text-white/30">Planned</div>
                      <div className="mt-0.5 font-display text-2xl font-black tracking-[0.03em] text-white/80">{selectedTeamPickCount}</div>
                    </div>
                    {selectedTeamDuplicatePickNames.size > 0 && (
                      <div className="rounded-[18px] border border-live/15 bg-live/8 px-4 py-2.5">
                        <div className="font-display text-[10px] uppercase tracking-[0.14em] text-white/30">Conflict</div>
                        <div className="mt-0.5 font-display text-2xl font-black tracking-[0.03em] text-live">
                          {selectedTeamDuplicatePickNames.size}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manifesto */}
                <div className="rounded-[20px] border border-white/5 bg-white/[0.02] px-5 py-3.5">
                  <div className="font-display text-[10px] uppercase tracking-[0.22em] text-white/35">TEAM MANIFESTO</div>
                  <p className="mt-2 text-[14px] leading-7 text-white/55">{selectedTeam.manifesto}</p>
                </div>
              </div>

              {/* ─── 分隔线 ─── */}
              <div className="my-6 h-px w-full bg-gradient-to-r from-brand/20 via-white/8 to-transparent" />

              {/* ─── 单人抓位展示区 ─── */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="font-display text-[10px] uppercase tracking-[0.25em] text-brand/70">PLANNED PICKS 赛前抓位</div>
                <p className="max-w-[32rem] text-[12px] leading-5 text-white/35">
                  每位选手最多规划 {MAX_MEMBER_SIX_STAR_PICKS} 位六星干员，同队重复抓位标红置灰。点击下方卡片切换成员。
                </p>
              </div>

              {/* 当前选中选手的大面积展示 */}
              {activeMember && (
                <div key={activeMember.id} className="mt-5 animate-panel-enter">
                  {/* 选手 header */}
                  <div className="flex flex-wrap items-center gap-4 border-b border-white/8 pb-4">
                    {/* avatar */}
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[14px] border border-white/10 bg-black/40 shadow-innerGlow">
                      {activeMember.avatar ? (
                        <img alt={`${activeMember.name} avatar`} className="h-full w-full object-cover" loading="lazy" src={encodeURI(activeMember.avatar)} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-display text-[10px] uppercase tracking-[0.14em] text-white/30">
                          {activeMember.id}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-title text-xl font-black tracking-[0.03em] text-white/90">{activeMember.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em]">
                        <span className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-brand">{activeMember.role}</span>
                        <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-0.5 text-white/40">{activeMember.theme}</span>
                        {activeDuplicateCount > 0 && (
                          <span className="rounded-full border border-live/30 bg-live/15 px-2.5 py-0.5 text-live">重复 {activeDuplicateCount}</span>
                        )}
                      </div>
                    </div>

                    <div className="ml-auto rounded-[16px] border border-white/8 bg-black/20 px-3.5 py-2 text-right">
                      <div className="font-display text-[9px] uppercase tracking-[0.14em] text-white/30">进度</div>
                      <div className="mt-0.5 font-display text-xl font-black tracking-[0.03em] text-brand">
                        {activePicks.length}/{MAX_MEMBER_SIX_STAR_PICKS}
                      </div>
                    </div>
                  </div>

                  {/* 13 格大面积 grid */}
                  <div className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-7">
                    {Array.from({ length: MAX_MEMBER_SIX_STAR_PICKS }, (_, index) => {
                      const pick = activePicks[index];
                      return (
                        <OperatorPickSlot
                          duplicate={pick ? selectedTeamDuplicatePickNames.has(normalizeOperatorName(pick.operatorName)) : false}
                          key={`${activeMember.id}-pick-slot-${index}`}
                          operatorName={pick?.operatorName}
                          order={index + 1}
                        />
                      );
                    })}
                  </div>

                  {/* 附加信息 */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-white/35">
                    <span>
                      {activePicks.length
                        ? `已规划 ${activePicks.length} 位六星${activeDuplicateCount ? `，其中 ${activeDuplicateCount} 位触发同队重复提醒` : "，当前无同队重复"}。`
                        : "当前还没有公开的赛前抓位规划。"}
                    </span>
                    {activeMember.signatureOp && activeMember.signatureOp !== "待补充" && (
                      <span className="rounded-full border border-brand/15 bg-brand/8 px-2.5 py-0.5 text-[11px] text-brand/80">
                        招牌：{activeMember.signatureOp}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </SpotlightCard>

            {/* ─── 底部成员卡 grid（选择器） ─── */}
            <div className="grid gap-4 sm:grid-cols-2">
              {selectedTeam.members.map((member) => {
                const avatarSrc = member.avatar ? encodeURI(member.avatar) : undefined;
                const picks = (member.operatorPicks ?? []).slice(0, MAX_MEMBER_SIX_STAR_PICKS);
                const isActive = activeMember?.id === member.id;

                return (
                  <SpotlightCard
                    key={member.id}
                    className={`cursor-pointer rounded-[28px] border p-5 backdrop-blur-2xl transition-[transform,border-color,background-color,box-shadow] duration-300 hover:-translate-y-1 ${isActive
                      ? "border-brand/35 bg-brand/8 shadow-[0_12px_32px_-16px_rgba(214,192,138,0.3)]"
                      : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                      }`}
                    spotlightColor={isActive ? "rgba(214,192,138,0.10)" : "rgba(255,255,255,0.05)"}
                  >
                    <button
                      type="button"
                      className="w-full cursor-pointer text-left"
                      onClick={() => setSelectedMemberId(member.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className={`h-12 w-12 shrink-0 overflow-hidden rounded-[14px] border bg-black/40 shadow-innerGlow transition-colors ${isActive ? "border-brand/30" : "border-white/10"}`}>
                            {avatarSrc ? (
                              <img alt={`${member.name} avatar`} className="h-full w-full object-cover" loading="lazy" src={avatarSrc} />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-display text-[10px] uppercase tracking-[0.14em] text-white/30">
                                {member.id}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className={`truncate font-title text-xl font-black tracking-[0.03em] transition-colors ${isActive ? "text-white" : "text-white/80"}`}>{member.name}</h3>
                            <div className={`mt-1 font-display text-[10px] uppercase tracking-[0.18em] transition-colors ${isActive ? "text-brand" : "text-brand/60"}`}>{member.role}</div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 font-display text-[10px] uppercase tracking-[0.14em] transition-colors ${isActive ? "border-brand/25 bg-brand/15 text-brand" : "border-white/5 bg-white/[0.04] text-white/35"}`}>
                            {picks.length}/{MAX_MEMBER_SIX_STAR_PICKS}
                          </span>
                          {/* 预览缩略图 */}
                          {picks.length > 0 && (
                            <div className="hidden items-center gap-1 sm:flex">
                              {picks.slice(0, 3).map((pick, index) => {
                                const entry = findOperatorCatalogEntry(pick.operatorName);
                                return entry?.avatarUrl ? (
                                  <div key={`${member.id}-mini-${index}`} className="h-7 w-7 overflow-hidden rounded-lg border border-white/8">
                                    <img alt={pick.operatorName} className="h-full w-full object-cover" loading="lazy" src={entry.avatarUrl} />
                                  </div>
                                ) : null;
                              })}
                              {picks.length > 3 && (
                                <span className="font-display text-[10px] text-white/30">+{picks.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
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
