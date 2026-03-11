interface SubNavItem {
  slug: string;
  label: string;
}

interface SubNavProps {
  items: SubNavItem[];
  activeSlug: string;
  onJump: (slug: string) => void;
}

export function SubNav({ items, activeSlug, onJump }: SubNavProps) {
  return (
    <div className="sticky top-24 z-30 mb-6 overflow-x-auto rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,19,23,0.92),rgba(13,15,18,0.92))] p-2 backdrop-blur-xl shadow-panel">
      <div className="flex min-w-max gap-2">
        {items.map((item) => {
          const active = item.slug === activeSlug;
          return (
            <button
              key={item.slug}
              aria-pressed={active}
              className={`interactive-surface rounded-[18px] px-4 py-3 font-display text-[11px] font-semibold uppercase tracking-[0.16em] ${
                active
                  ? "bg-brand text-[#121316] shadow-brand"
                  : "bg-white/[0.03] text-text2 hover:bg-white/[0.06] hover:text-text1"
              }`}
              onClick={() => onJump(item.slug)}
              type="button"
            >
              <span className="transition-transform duration-[160ms] hover:-translate-y-px">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
