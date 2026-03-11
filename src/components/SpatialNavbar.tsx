import { NavLink, useLocation } from "react-router-dom";
import { useLayoutEffect, useRef, useState, useEffect } from "react";
import gsap from "gsap";

interface NavItem {
    to: string;
    label: string;
}

interface SpatialNavbarProps {
    items: NavItem[];
}

export function SpatialNavbar({ items }: SpatialNavbarProps) {
    const location = useLocation();
    const containerRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const updateIndicator = () => {
        if (!containerRef.current || !indicatorRef.current) return;

        // Find the active NavLink in the DOM
        const activeLink = containerRef.current.querySelector(".active") as HTMLElement;

        if (activeLink) {
            gsap.to(indicatorRef.current, {
                x: activeLink.offsetLeft,
                width: activeLink.offsetWidth,
                opacity: 1,
                duration: 0.6,
                ease: "expo.out",
            });
        } else {
            gsap.to(indicatorRef.current, {
                opacity: 0,
                duration: 0.3,
            });
        }
    };

    useLayoutEffect(() => {
        // Initial mount and location changes
        updateIndicator();

        // Also update on window resize
        window.addEventListener("resize", updateIndicator);
        return () => window.removeEventListener("resize", updateIndicator);
    }, [location.pathname, items]);

    return (
        <nav
            ref={containerRef}
            className="relative flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]"
        >
            {/* Floating Active Indicator (Glass Microcrystalline Material) */}
            <div
                ref={indicatorRef}
                className="absolute bottom-1.5 left-0 top-1.5 z-0 rounded-full border border-white/20 bg-white/[0.08] shadow-[0_4px_12px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl opacity-0"
                style={{ pointerEvents: "none" }}
            >
                {/* Internal Glow for Active Item */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand/5 via-white/5 to-purple-500/5 opacity-50" />
            </div>

            {items.map((item, index) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        `relative z-10 flex h-11 items-center rounded-full px-5 font-display text-[13px] font-bold uppercase tracking-[0.18em] transition-all duration-300 ${isActive ? "text-text1" : "text-text2 hover:text-text1 focus-visible:text-text1"
                        }`
                    }
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <span className="relative">
                        {item.label}

                        {/* Prismatic Internal Flow (Rainbow Syphon on Hover) */}
                        <div
                            className={`rainbow-flow absolute -inset-x-4 -inset-y-2 z-[-1] rounded-full opacity-0 blur-md transition-opacity duration-700 pointer-events-none ${hoveredIndex === index ? "opacity-100" : ""
                                }`}
                            style={{
                                background: "conic-gradient(from var(--nav-angle), transparent, rgba(214,192,138,0.12), rgba(255,100,255,0.12), rgba(100,200,255,0.12), transparent)",
                            }}
                        />
                    </span>
                </NavLink>
            ))}
        </nav>
    );
}
