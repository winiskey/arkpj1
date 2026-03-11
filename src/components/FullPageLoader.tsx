import { LOGO_IMAGE_SRC } from "../lib/logo";

const syncSteps = [
  "对齐页面结构",
  "预热切换动线",
  "装填赛事模块",
];

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton-block h-3 ${className}`.trim()} />;
}

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`panel-data overflow-hidden px-4 py-4 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-3">
        <SkeletonLine className="w-20" />
        <div className="loading-pulse-dot shrink-0" />
      </div>
      <SkeletonLine className="mt-4 h-7 w-4/5 rounded-2xl" />
      <SkeletonLine className="mt-3 w-full" />
      <SkeletonLine className="mt-2 w-2/3" />
      <div className="loading-rail mt-5 h-2 w-full" />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex min-h-[68vh] items-center justify-center px-4 py-6 md:px-8" role="status">
      <span className="sr-only">页面内容加载中</span>
      <div className="w-full max-w-[1240px] space-y-6">
        <div className="panel-hero px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-brand/16 bg-brand/8 px-4 py-2">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-brand/18 bg-brand/10">
                  <div className="loading-orbit absolute inset-[4px] rounded-full border border-transparent border-t-brand/80 border-r-brand/30" />
                  <img
                    alt="Loading"
                    className="relative h-4 w-4 brightness-0 invert drop-shadow-[0_0_12px_rgba(214,192,138,0.45)]"
                    src={LOGO_IMAGE_SRC}
                  />
                </div>
                <span className="font-display text-[11px] uppercase tracking-[0.18em] text-brand">syncing interface</span>
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {syncSteps.map((step, index) => (
                    <div
                      key={step}
                      className="loading-pulse-dot"
                      style={{ animationDelay: `${index * 120}ms` }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="font-title text-3xl font-black tracking-[0.03em] text-text1 md:text-4xl">赛事界面装载中</div>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-text2">
                  正在准备页面结构、切换动效与关键模块占位，保持当前阅读节奏与界面上下文。
                </p>
              </div>

              <div className="loading-rail h-2 w-full" />

              <div className="grid gap-4 md:grid-cols-3">
                {syncSteps.map((step, index) => (
                  <div key={step} className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-display text-[11px] uppercase tracking-[0.18em] text-brand/80">{step}</div>
                      <div
                        className="loading-pulse-dot"
                        style={{ animationDelay: `${index * 150}ms` }}
                      />
                    </div>
                    <SkeletonLine className="mt-4 h-5 w-3/4 rounded-2xl" />
                    <SkeletonLine className="mt-3 w-full" />
                    <SkeletonLine className="mt-2 w-2/3" />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>

            <div className="panel-data px-5 py-5 md:px-6 md:py-6">
              <div className="flex items-center justify-between gap-3">
                <SkeletonLine className="w-28" />
                <div className="section-tag">route shell</div>
              </div>
              <div className="mt-5 rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                <div className="relative aspect-square overflow-hidden rounded-[24px] border border-brand/14 bg-[radial-gradient(circle,rgba(214,192,138,0.08),transparent_60%)]">
                  <div className="absolute inset-0 bg-grid opacity-[0.1]" />
                  <div className="loading-orbit absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/16" />
                  <div className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/6 border-dashed" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="skeleton-block h-28 w-28 rounded-full md:h-36 md:w-36" />
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <SkeletonLine className="h-12 w-full rounded-[18px]" />
                  <SkeletonLine className="h-12 w-full rounded-[18px]" />
                </div>
                <div className="mt-4 space-y-3 rounded-[22px] border border-white/8 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-display text-[11px] uppercase tracking-[0.18em] text-text3">Motion Sync</div>
                    <div className="loading-pulse-dot" />
                  </div>
                  <div className="loading-rail h-2 w-full" />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <SkeletonLine className="h-10 w-full rounded-[16px]" />
                    <SkeletonLine className="h-10 w-full rounded-[16px]" />
                    <SkeletonLine className="h-10 w-full rounded-[16px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard className="xl:col-span-2" />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
