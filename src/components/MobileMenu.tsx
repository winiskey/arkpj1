import { X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    navItems: { to: string; label: string }[];
    startDate: string;
}

export function MobileMenu({ isOpen, onClose, navItems, startDate }: MobileMenuProps) {
    const location = useLocation();

    // Close on route change
    useEffect(() => {
        onClose();
    }, [location.pathname, onClose]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Slide-in Drawer */}
            <div
                className={`fixed inset-y-0 right-0 z-50 w-72 flex flex-col border-l border-white/10 bg-black/95 backdrop-blur-xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
                    <span className="font-display text-xs uppercase tracking-[0.3em] text-accent/80">NAVIGATION</span>
                    <button
                        aria-label="关闭菜单"
                        title="关闭菜单"
                        className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/10 bg-white/[0.03] text-white/60 hover:text-white transition-colors"
                        onClick={onClose}
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex flex-1 flex-col gap-1 p-4">
                    {navItems.map((item, i) => {
                        const isActive =
                            item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={`relative flex items-center gap-4 px-5 py-4 font-display text-sm uppercase tracking-[0.22em] transition-all duration-300 ${isActive
                                    ? "text-white bg-white/[0.06] border-l-2 border-accent"
                                    : "text-white/50 hover:text-white hover:bg-white/[0.03] border-l-2 border-transparent"
                                    }`}
                            >
                                <span className="font-display text-[10px] text-accent/40 tabular-nums">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-white/[0.08]">
                    <div className="font-display text-[10px] uppercase tracking-[0.3em] text-white/20">
                        Season Active
                    </div>
                    <div className="mt-1 font-display text-sm text-accent/70">{startDate}</div>
                </div>
            </div>
        </>
    );
}
