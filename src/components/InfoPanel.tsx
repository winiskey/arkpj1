import type { ReactNode } from "react";

interface InfoPanelProps {
  title: string;
  label?: string;
  items: ReactNode[];
}

export function InfoPanel({ title, label, items }: InfoPanelProps) {
  return (
    <section className="hud-panel group relative overflow-hidden p-6 transition-all duration-500 hover:bg-white/[0.04] lg:p-8">
      <div className="absolute top-0 right-0 h-40 w-40 -translate-y-20 translate-x-20 rounded-full bg-accent/5 blur-3xl transition-opacity duration-700 group-hover:bg-accent/10" />
      <div className="relative mb-6 border-b border-white/[0.08] pb-5">
        {label ? (
          <div className="mb-4 font-display text-[10px] uppercase tracking-[0.24em] text-accent/80">
            {label}
          </div>
        ) : null}
        <h3 className="font-sans text-2xl font-medium tracking-wide text-white/95">{title}</h3>
      </div>
      <ul className="relative space-y-5 text-[14px] leading-relaxed text-white/70 transition-colors group-hover:text-white/80">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex items-start gap-4">
            <span className="mt-2 h-1 w-1 rounded-full shrink-0 bg-accent/40 transition-colors group-hover:bg-accent/60" />
            <span className="flex-1 font-sans">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
