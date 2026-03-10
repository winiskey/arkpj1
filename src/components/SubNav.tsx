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
    <div className="sticky top-20 z-30 mb-8 overflow-x-auto rounded-sm border border-white/10 bg-black/65 px-2 py-2 backdrop-blur">
      <div className="flex min-w-max gap-2">
        {items.map((item) => {
          const active = item.slug === activeSlug;
          return (
            <button
              key={item.slug}
              className={`clip-corner whitespace-nowrap px-4 py-2 font-display text-xs tracking-[0.28em] transition ${
                active ? "bg-accent text-black" : "bg-white/[0.03] text-white/70 hover:text-accent"
              }`}
              onClick={() => onJump(item.slug)}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
