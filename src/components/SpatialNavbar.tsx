import { NavLink } from "react-router-dom";
import { useState } from "react";

interface NavItem {
    to: string;
    label: string;
}

interface SpatialNavbarProps {
    items: NavItem[];
}

export function SpatialNavbar({ items }: SpatialNavbarProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <nav className="relative flex items-center gap-1.5 p-2">
            {items.map((item, index) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        `group relative z-10 flex h-12 items-center px-6 font-display text-[15px] font-bold uppercase tracking-[0.18em] transition-all duration-300 ${isActive
                            ? "text-brand drop-shadow-[0_0_8px_rgba(214,192,138,0.5)]"
                            : "text-white/40 hover:text-white focus-visible:text-white"
                        }`
                    }
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    {({ isActive }) => (
                        <span className="relative">
                            {item.label}

                            {/* Active Static Indicator (Underline) */}
                            {isActive && (
                                <div className="absolute -bottom-2 left-1/2 h-[2px] w-6 -translate-x-1/2 bg-brand drop-shadow-[0_0_6px_rgba(214,192,138,0.8)] rounded-full" />
                            )}

                            {/* Prismatic Internal Flow (Rainbow Syphon on Hover) */}
                            <div
                                className={`rainbow-flow absolute -inset-x-4 -inset-y-3 z-[-1] rounded-full opacity-0 blur-xl transition-opacity duration-700 pointer-events-none ${hoveredIndex === index && !isActive ? "opacity-60" : ""
                                    }`}
                                style={{
                                    background: "conic-gradient(from var(--nav-angle), transparent, rgba(214,192,138,0.2), rgba(255,100,255,0.15), rgba(100,200,255,0.2), transparent)",
                                }}
                            />
                        </span>
                    )}
                </NavLink>
            ))}
        </nav>
    );
}
