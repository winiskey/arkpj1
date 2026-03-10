interface SectionHeaderProps {
  enTitle: string;
  cnTitle: string;
  eyebrow?: string;
}

export function SectionHeader({ enTitle, cnTitle, eyebrow }: SectionHeaderProps) {
  return (
    <div className="mb-10 space-y-4 md:mb-16">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap items-baseline gap-3">
          {eyebrow ? (
            <span className="font-display text-[10px] uppercase tracking-[0.24em] text-white/40">
              {eyebrow}
            </span>
          ) : null}
          <span className="font-display text-xs uppercase tracking-[0.32em] text-accent">
            {enTitle}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-sans text-3xl font-medium tracking-wide text-white/95 md:text-5xl">
          {cnTitle}
        </h2>
        {/* Elegant Soft Divider */}
        <div className="relative flex items-center w-full h-px mt-4">
          <div className="h-px w-32 bg-gradient-to-r from-accent/80 to-transparent" />
          <div className="absolute left-0 h-[2px] w-[2px] rounded-full bg-accent shadow-[0_0_8px_rgba(212,190,136,0.8)]" />
        </div>
      </div>
    </div>
  );
}