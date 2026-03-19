import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { PageFrame } from "../components/PageFrame";
import { PageBackground } from "../components/PageBackground";
import { SectionHeader } from "../components/SectionHeader";
import { RadarChart } from "../components/RadarChart";
import { SpotlightCard } from "../components/SpotlightCard";
import { ScrollReveal } from "../components/ScrollReveal";
import { useSiteData } from "../context/SiteDataContext";
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

export function ContestantPage() {
  const { contestantId } = useParams<{ contestantId: string }>();
  const {
    data: { teams, matches },
  } = useSiteData();
  const logoRef = useParallaxLogo();

  const result = useMemo(() => {
    for (const team of teams) {
      for (const member of team.members) {
        if (member.id === contestantId || `${team.id}-${member.id}` === contestantId) {
          return { team, member };
        }
      }
    }
    return null;
  }, [contestantId, teams]);

  const memberMatch = useMemo(() => {
    if (!result) return null;
    const match = matches.find((m) => m.teamId === result.team.id);
    if (!match?.members) return null;
    return match.members.find((mm) => mm.id === result.member.id) ?? null;
  }, [result, matches]);

  const duplicatePickNames = useMemo(() => {
    if (!result) return new Set<string>();
    const counts = new Map<string, number>();
    for (const m of result.team.members) {
      for (const pick of m.operatorPicks ?? []) {
        const key = normalizeOperatorName(pick.operatorName);
        if (!key) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return new Set(
      Array.from(counts.entries())
        .filter(([, c]) => c > 1)
        .map(([k]) => k),
    );
  }, [result]);

  if (!result) {
    return (
      <div className="relative min-h-[100dvh] w-full overflow-hidden selection:bg-brand/90 selection:text-black">
        <PageBackground logoRef={logoRef} />
        <PageFrame className="relative z-10 gap-8">
          <div className="flex flex-col items-center justify-center gap-6 py-20">
            <div className="font-display text-[11px] uppercase tracking-[0.3em] text-white/40">CONTESTANT NOT FOUND</div>
            <h2 className="font-title text-3xl font-black tracking-[0.03em] text-white/80">未找到该选手</h2>
            <Link
              className="mt-4 rounded-full border border-brand/30 bg-brand/10 px-6 py-3 font-display text-sm tracking-[0.08em] text-brand transition-colors hover:bg-brand/20"
              to="/teams"
            >
              返回队伍情报
            </Link>
          </div>
        </PageFrame>
      </div>
    );
  }

  const { team, member } = result;
  const picks = (member.operatorPicks ?? []).slice(0, MAX_MEMBER_SIX_STAR_PICKS);
  const avatarSrc = member.avatar ? encodeURI(member.avatar) : undefined;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden selection:bg-brand/90 selection:text-black">
      <PageBackground logoRef={logoRef} />

      <PageFrame className="relative z-10 gap-8 md:gap-10 lg:gap-14">
        <SectionHeader
          cnTitle="选手档案"
          description="查看选手个人资料与赛前抓位规划。"
          enTitle="CONTESTANT PROFILE"
        />

        {/* Back link */}
        <Link
          className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 font-display text-xs tracking-[0.08em] text-white/50 transition-colors hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
          to="/teams"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          返回队伍情报
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
          {/* Left: Profile card */}
          <ScrollReveal>
            <SpotlightCard
              className="overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-3xl md:p-10"
              spotlightColor="rgba(255,255,255,0.06)"
            >
              <div className="flex items-start gap-6">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[28px] border border-white/10 bg-black/40 shadow-innerGlow">
                  {avatarSrc ? (
                    <img
                      alt={`${member.name} avatar`}
                      className="h-full w-full object-cover"
                      src={avatarSrc}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-lg uppercase tracking-[0.16em] text-white/30">
                      {member.id}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-[10px] uppercase tracking-[0.3em] text-brand/70">
                    {team.tag} // {member.role}
                  </div>
                  <h2 className="mt-2 font-title text-3xl font-black tracking-[0.03em] text-white/90 md:text-4xl">
                    {member.name}
                  </h2>
                  <Link
                    className="mt-2 inline-block font-display text-sm tracking-[0.08em] text-brand/70 transition-colors hover:text-brand"
                    to="/teams"
                  >
                    {team.name}
                  </Link>
                </div>
              </div>

              <div className="mt-8 space-y-4 border-t border-white/5 pt-6">
                {[
                  { label: "位置", value: member.role },
                  { label: "主题", value: member.theme },
                  { label: "分队", value: member.squad },
                  ...(member.signatureOp && member.signatureOp !== "待补充"
                    ? [{ label: "招牌", value: member.signatureOp }]
                    : []),
                  ...(member.note && member.note !== "选手资料已同步，详细战术信息待补充。"
                    ? [{ label: "备注", value: member.note }]
                    : []),
                ].map((item) => (
                  <div key={item.label} className="flex text-sm leading-6">
                    <span className="w-16 shrink-0 font-display text-[11px] uppercase tracking-[0.1em] text-white/30">
                      {item.label}
                    </span>
                    <span className="text-white/60">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Score from match data */}
              {memberMatch && memberMatch.score > 0 ? (
                <div className="mt-8 border-t border-white/5 pt-6">
                  <div className="font-display text-[10px] uppercase tracking-[0.25em] text-brand/70">MATCH SCORE</div>
                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="font-display text-4xl font-black tracking-[0.03em] text-brand">
                      {memberMatch.score}
                    </span>
                    <span className="font-display text-sm text-white/40">
                      x{memberMatch.multiplier}
                    </span>
                  </div>
                </div>
              ) : null}
            </SpotlightCard>
          </ScrollReveal>

          {/* Right: Radar chart */}
          <ScrollReveal delay={0.1}>
            <SpotlightCard
              className="overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-3xl md:p-10"
              spotlightColor="rgba(255,255,255,0.06)"
            >
              <div className="font-display text-[10px] uppercase tracking-[0.25em] text-brand/70">TEAM CAPABILITY RADAR</div>
              <h3 className="mt-3 font-title text-2xl font-black tracking-[0.03em] text-white/90">
                {team.name} 能力画像
              </h3>
              <RadarChart data={team.radarStats} />
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {team.radarStats.map((stat) => (
                  <div key={stat.label} className="rounded-[16px] border border-white/5 bg-white/[0.02] px-4 py-3">
                    <div className="font-display text-[10px] uppercase tracking-[0.16em] text-white/35">{stat.label}</div>
                    <div className="mt-1 font-display text-xl font-black tracking-[0.03em] text-white/70">{stat.value}</div>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </ScrollReveal>
        </div>

        {/* Operator picks */}
        <ScrollReveal delay={0.15}>
          <SpotlightCard
            className="overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-3xl md:p-10"
            spotlightColor="rgba(255,255,255,0.06)"
          >
            <div className="font-display text-[10px] uppercase tracking-[0.25em] text-brand/70">PLANNED PICKS</div>
            <h3 className="mt-3 font-title text-2xl font-black tracking-[0.03em] text-white/90">
              赛前抓位规划
            </h3>
            <p className="mt-3 max-w-[40rem] text-sm leading-7 text-white/55">
              {member.name} 的赛前六星干员规划，最多 {MAX_MEMBER_SIX_STAR_PICKS} 位。同队重复干员会标红置灰。
            </p>

            {picks.length > 0 ? (
              <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
                {Array.from({ length: MAX_MEMBER_SIX_STAR_PICKS }, (_, index) => {
                  const pick = picks[index];
                  return (
                    <OperatorPickSlot
                      key={`pick-${index}`}
                      duplicate={pick ? duplicatePickNames.has(normalizeOperatorName(pick.operatorName)) : false}
                      operatorName={pick?.operatorName}
                      order={index + 1}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
                <div className="font-display text-sm text-white/35">尚未公开赛前抓位规划</div>
              </div>
            )}
          </SpotlightCard>
        </ScrollReveal>
      </PageFrame>
    </div>
  );
}
