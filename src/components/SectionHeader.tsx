interface SectionHeaderProps {
  enTitle: string;
  cnTitle: string;
  eyebrow?: string;
  description?: string;
}

export function SectionHeader({ enTitle, cnTitle, eyebrow, description }: SectionHeaderProps) {
  return (
    <div className="mb-8 space-y-4 md:mb-12">
      <div className="flex flex-wrap items-center gap-3 text-white/40">
        {eyebrow ? <span className="font-display text-[11px] uppercase tracking-[0.18em]">{eyebrow}</span> : null}
        <span className="font-display text-[11px] uppercase tracking-[0.18em] text-brand/70">{enTitle}</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)] lg:items-end">
        <div className="space-y-4">
          <h2 className="font-title text-4xl font-black tracking-[0.03em] text-white/90 md:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
            {cnTitle}
          </h2>
          <div className="h-px w-full max-w-[220px] bg-gradient-to-r from-brand/40 to-transparent" />
        </div>
        {description ? (
          <p className="max-w-xl text-[15px] leading-7 text-white/50 md:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
