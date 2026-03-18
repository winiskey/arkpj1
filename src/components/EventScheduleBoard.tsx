import { Fragment, memo, useState } from "react";
import { CalendarDays, ChevronDown, Clock3 } from "lucide-react";
import type { ScheduleDay, SchedulePeriod, ScheduleSlot, ScheduleSlotTone } from "../content";
import { SpotlightCard } from "./SpotlightCard";

interface EventScheduleBoardProps {
  days: ScheduleDay[];
  teamNameById?: Record<string, string>;
}

interface ScheduleEntryProps {
  slot: ScheduleSlot;
  teamName?: string;
  compact?: boolean;
}

const periodOrder: SchedulePeriod[] = ["早", "中", "晚"];

const periodMeta: Record<SchedulePeriod, { label: string; time: string }> = {
  "早": { label: "早场", time: "09:00" },
  "中": { label: "中场", time: "14:00" },
  "晚": { label: "晚场", time: "19:00" },
};

const toneStyles: Record<ScheduleSlotTone, { shell: string; strip: string; chip: string; title: string; meta: string; note: string }> = {
  default: {
    shell: "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]",
    strip: "via-white/20",
    chip: "border-white/10 bg-white/[0.05] text-white/70",
    title: "text-white/80 group-hover:text-white",
    meta: "text-white/40",
    note: "text-white/30",
  },
  alert: {
    shell: "border-rose-400/10 bg-rose-500/5 hover:border-rose-400/20 hover:bg-rose-500/10 shadow-[inset_0_1px_1px_rgba(251,113,133,0.08)]",
    strip: "via-rose-400/30",
    chip: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    title: "text-rose-100 group-hover:text-white",
    meta: "text-rose-200/60",
    note: "text-rose-200/40",
  },
  featured: {
    shell: "border-brand/10 bg-brand/5 hover:border-brand/20 hover:bg-brand/10 shadow-[inset_0_1px_1px_rgba(214,192,138,0.15)]",
    strip: "via-brand/30",
    chip: "border-brand/20 bg-brand/10 text-brand",
    title: "text-brand group-hover:text-brandStrong",
    meta: "text-brand/60",
    note: "text-brand/40",
  },
};

/** Determine "today" based on the current date's month.day format */
function getTodayDate(): string {
  const now = new Date();
  return `${now.getMonth() + 1}.${now.getDate()}`;
}

function getSlotByPeriod(day: ScheduleDay, period: SchedulePeriod) {
  return day.slots.find((slot) => slot.period === period);
}

function ScheduleEntry({ slot, teamName, compact = false }: ScheduleEntryProps) {
  const tone = toneStyles[slot.tone ?? "default"];
  const densityClasses = compact ? "min-h-[92px] px-3 py-3" : "min-h-[108px] px-4 py-4";

  return (
    <div
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[24px] border transition-[border-color,background-color] duration-300 ${densityClasses} ${tone.shell}`}
    >
      <div className={`absolute inset-y-3 left-0 w-px bg-gradient-to-b from-transparent ${tone.strip} to-transparent opacity-90`} />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <div className={`font-display text-[11px] tracking-[0.28em] ${tone.meta}`}>
            {periodMeta[slot.period].label}
          </div>
          <div className={`mt-2 text-lg font-semibold leading-6 transition-colors ${tone.title}`}>
            {slot.player}
          </div>
        </div>
        <div className={`shrink-0 rounded-full border px-2.5 py-1 font-display text-[11px] tracking-[0.22em] ${tone.chip}`}>
          {slot.time}
        </div>
      </div>

      <div className="relative z-10 mt-3 space-y-2">
        {teamName ? (
          <div className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] tracking-[0.24em] ${tone.chip}`}>
            {teamName}
          </div>
        ) : null}
        {slot.note ? <p className={`text-xs leading-6 ${tone.note}`}>{slot.note}</p> : null}
      </div>
    </div>
  );
}

/** How many visible days to show by default (today + next N) */
const DEFAULT_VISIBLE_DAYS = 3;

export const EventScheduleBoard = memo(function EventScheduleBoard({ days, teamNameById = {} }: EventScheduleBoardProps) {
  const totalSlots = days.reduce((sum, day) => sum + day.slots.length, 0);
  const todayDate = getTodayDate();

  // Find "today" index, or if today isn't in the schedule, find the nearest future day
  const todayIndex = days.findIndex((day) => day.date === todayDate);
  const startIndex = todayIndex >= 0 ? todayIndex : days.findIndex((day) => {
    const [m, d] = day.date.split(".").map(Number);
    const [tm, td] = todayDate.split(".").map(Number);
    return m > tm || (m === tm && d >= td);
  });
  const effectiveStart = startIndex >= 0 ? startIndex : 0;

  const [expanded, setExpanded] = useState(false);
  const needsCollapse = days.length > DEFAULT_VISIBLE_DAYS;
  const visibleDays = expanded ? days : days.slice(effectiveStart, effectiveStart + DEFAULT_VISIBLE_DAYS);
  const hiddenCount = days.length - DEFAULT_VISIBLE_DAYS;

  function isToday(day: ScheduleDay) {
    return day.date === todayDate;
  }

  return (
    <SpotlightCard className="group relative overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.015] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-2xl" spotlightColor="rgba(255,255,255,0.04)">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(214,192,138,0.06),transparent_50%)]" />

      <div className="relative z-10 border-b border-white/5 px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="font-display text-xs tracking-[0.32em] text-brand/70">赛程同步</div>
            <p className="mt-3 text-sm leading-7 text-white/50">
              {expanded
                ? "展示全部赛程，点击下方按钮可折叠回焦点视图。"
                : "默认聚焦近期赛事，点击下方可展开完整赛程。"
              }
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-4 py-2 text-[11px] tracking-[0.22em] text-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <CalendarDays className="h-4 w-4 text-white/60" />
              {days.length} 天排期
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-4 py-2 text-[11px] tracking-[0.22em] text-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <Clock3 className="h-4 w-4 text-white/60" />
              {totalSlots} 场已录入
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop: Grid View ── */}
      <div className="relative z-10 hidden overflow-x-auto lg:block">
        <div className="min-w-[940px] p-6 lg:p-8">
          <div className="grid grid-cols-[170px_repeat(3,minmax(0,1fr))] gap-4">
            <div className="rounded-[24px] border border-white/5 bg-white/[0.02] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="font-display text-[11px] tracking-[0.3em] text-brand/70">日期</div>
              <div className="mt-2 text-xs tracking-[0.24em] text-white/40">星期 / 日期</div>
            </div>
            {periodOrder.map((period) => (
              <div key={period} className="rounded-[24px] border border-white/5 bg-white/[0.02] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="font-display text-2xl font-black tracking-[0.16em] text-white/80">{period}</div>
                <div className="mt-2 font-display text-xs tracking-[0.26em] text-brand/60">{periodMeta[period].time}</div>
                <div className="mt-1 text-xs tracking-[0.24em] text-white/40">{periodMeta[period].label}</div>
              </div>
            ))}

            {visibleDays.map((day) => {
              const today = isToday(day);

              return (
                <Fragment key={day.date}>
                  <div className={`flex min-h-[116px] flex-col justify-center rounded-[26px] border px-5 py-4 transition-colors ${today ? "border-brand/20 bg-brand/5 shadow-[inset_1px_0_0_rgba(214,192,138,0.4)]" : "border-white/5 bg-white/[0.015]"}`}>
                    <div className="flex items-center gap-2">
                      <div className={`font-display text-3xl font-black tracking-[0.14em] ${today ? "text-brand" : "text-white/80"}`}>{day.date}</div>
                      {today ? (
                        <span className="rounded bg-brand px-2 py-0.5 font-display text-[9px] font-bold tracking-[0.2em] text-black">今天</span>
                      ) : null}
                    </div>
                    <div className={`mt-2 text-xs tracking-[0.24em] ${today ? "text-brand/60" : "text-white/40"}`}>{day.weekday}</div>
                  </div>

                  {periodOrder.map((period) => {
                    const slot = getSlotByPeriod(day, period);
                    const teamName = slot?.teamId ? teamNameById[slot.teamId] : undefined;

                    return (
                      <div key={`${day.date}-${period}`}>
                        {slot ? (
                          <ScheduleEntry slot={slot} teamName={teamName} />
                        ) : (
                          <div className="flex w-full h-full min-h-[108px] items-center justify-center rounded-[24px] border border-dashed border-white/5 bg-white/[0.01] font-display text-xs tracking-[0.2em] text-white/20">
                            NO MATCH
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Mobile: Card View ── */}
      <div className="relative z-10 grid gap-4 p-4 lg:hidden">
        {visibleDays.map((day) => {
          const today = isToday(day);

          return (
            <article key={day.date} className={`rounded-[26px] border p-4 ${today ? "border-accent/40 bg-accent/5 shadow-glow" : "border-white/10 bg-black/20"}`}>
              <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-3">
                <div>
                  <div className="font-display text-[11px] tracking-[0.3em] text-accent">日期</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`font-display text-3xl font-black tracking-[0.14em] ${today ? "text-accent" : "text-white"}`}>{day.date}</div>
                    {today ? (
                      <span className="rounded bg-accent px-2 py-0.5 font-display text-[9px] font-bold tracking-[0.2em] text-black">TODAY</span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right text-xs tracking-[0.24em] text-white/45">{day.weekday}</div>
              </div>

              <div className="mt-4 grid gap-3">
                {periodOrder.map((period) => {
                  const slot = getSlotByPeriod(day, period);
                  const teamName = slot?.teamId ? teamNameById[slot.teamId] : undefined;

                  return slot ? (
                    <ScheduleEntry key={`${day.date}-${period}`} compact slot={slot} teamName={teamName} />
                  ) : (
                    <div
                      key={`${day.date}-${period}`}
                      className="flex items-center justify-between rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-3"
                    >
                      <div>
                        <div className="font-display text-sm font-bold tracking-[0.16em] text-white/70">{period}</div>
                        <div className="mt-1 text-[11px] tracking-[0.24em] text-white/35">{periodMeta[period].time}</div>
                      </div>
                      <div className="font-display text-xs tracking-[0.28em] text-white/18">无赛事</div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Expand / Collapse Toggle ── */}
      {needsCollapse ? (
        <div className="relative z-10 border-t border-white/5 px-6 py-5 md:px-8">
          <button
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[20px] border border-white/5 bg-white/[0.02] py-4 font-display text-xs tracking-[0.2em] text-white/50 transition-[border-color,background-color,color] duration-300 hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
            onClick={() => setExpanded(!expanded)}
            type="button"
          >
            <span>{expanded ? "收起赛程" : `展开全部赛程（还有 ${hiddenCount} 天）`}</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      ) : null}
    </SpotlightCard>
  );
});