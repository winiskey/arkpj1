import type { ReactNode } from "react";

interface InfoPanelProps {
  title: string;
  label?: string;
  items: ReactNode[];
}

export function InfoPanel({ title, label, items }: InfoPanelProps) {
  return (
    <section className="panel-content p-6 lg:p-8">
      <div className="mb-6 space-y-3 border-b border-white/8 pb-5">
        {label ? <div className="section-kicker">{label}</div> : null}
        <h3 className="font-title text-2xl font-black tracking-[0.03em] text-text1 md:text-[2rem]">
          {title}
        </h3>
      </div>
      <ul className="space-y-4 text-[15px] leading-7 text-text2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex items-start gap-4">
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/80" />
            <span className="flex-1">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
