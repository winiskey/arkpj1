import { X } from "lucide-react";
import { type KeyboardEvent as ReactKeyboardEvent, type RefObject, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LOGO_IMAGE_SRC } from "../lib/logo";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: { to: string; label: string }[];
  startDate: string;
  triggerRef: RefObject<HTMLButtonElement>;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [] as HTMLElement[];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
  );
}

export function MobileMenu({ isOpen, onClose, navItems, startDate, triggerRef }: MobileMenuProps) {
  const location = useLocation();
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    if (isOpen) {
      lastActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      window.setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 30);
    } else if (wasOpenRef.current) {
      window.setTimeout(() => {
        const focusTarget = triggerRef.current ?? lastActiveElementRef.current;
        focusTarget?.focus();
      }, 10);
    }

    wasOpenRef.current = isOpen;

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements(panelRef.current);
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!activeElement || activeElement === firstElement || !panelRef.current?.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (!activeElement || activeElement === lastElement || !panelRef.current?.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getFocusableElements(panelRef.current);
    if (focusableElements.length === 0) {
      event.preventDefault();
    }
  };

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/72 backdrop-blur-md transition-opacity duration-[220ms] ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        ref={panelRef}
        aria-hidden={!isOpen}
        aria-labelledby="mobile-navigation-title"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[28rem] flex-col border-l border-brand/12 bg-[linear-gradient(180deg,rgba(17,19,23,0.98),rgba(11,13,16,0.98))] shadow-[0_0_0_1px_rgba(214,192,138,0.06),0_24px_80px_-24px_rgba(0,0,0,0.92)] transition-transform duration-[320ms] ease-[var(--ease-out)] lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        id="mobile-navigation-dialog"
        onKeyDown={handleDialogKeyDown}
        role="dialog"
      >
        <div className="border-b border-white/8 px-5 pb-5 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="interactive-surface flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/18 bg-brand/8">
                <img alt="荆楚歌 Logo" className="h-7 w-7 brightness-0 invert" src={LOGO_IMAGE_SRC} />
              </div>
              <div>
                <div className="section-kicker">Navigation Deck</div>
                <div className="mt-2 font-title text-2xl font-black tracking-[0.03em] text-text1" id="mobile-navigation-title">
                  赛事导航
                </div>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              aria-label="关闭菜单"
              className="btn-ghost h-12 w-12 shrink-0 rounded-2xl px-0 py-0"
              onClick={onClose}
              tabIndex={isOpen ? undefined : -1}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-text2">
            在赛事大厅、队伍情报与规则手册之间快速切换，保持当前战局与资料入口的连续感。
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-3 px-4 py-5">
          {navItems.map((item, index) => {
            const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                className={`interactive-surface group clip-corner relative flex min-h-[72px] items-center justify-between gap-4 overflow-hidden border px-5 py-4 transition-[transform,opacity,border-color,background-color,color] duration-[280ms] ease-[var(--ease-out)] ${
                  isOpen ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                } ${
                  isActive
                    ? "border-brand/30 bg-brand/12 text-text1 shadow-brand"
                    : "border-white/8 bg-white/[0.03] text-text2 hover:border-brand/18 hover:bg-white/[0.05] hover:text-text1"
                }`}
                style={{ transitionDelay: isOpen ? `${100 + index * 45}ms` : "0ms" }}
                tabIndex={isOpen ? undefined : -1}
                to={item.to}
              >
                <div>
                  <div className="font-display text-[11px] uppercase tracking-[0.18em] text-brand/70">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-2 font-title text-2xl font-black tracking-[0.03em] transition-transform duration-[180ms] group-hover:-translate-y-px">
                    {item.label}
                  </div>
                </div>
                <div className="font-display text-xs uppercase tracking-[0.18em] text-text3 transition-colors duration-[180ms] group-hover:text-brand/70">
                  {isActive ? "Current" : "Open"}
                </div>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/8 px-5 py-5">
          <div
            className={`panel-data interactive-surface flex items-center justify-between rounded-[20px] px-5 py-4 transition-[transform,opacity] duration-[280ms] ease-[var(--ease-out)] hover:border-brand/16 hover:bg-white/[0.05] ${
              isOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
            style={{ transitionDelay: isOpen ? `${100 + navItems.length * 45}ms` : "0ms" }}
          >
            <div>
              <div className="section-kicker">Season Start</div>
              <div className="mt-2 font-display text-lg font-bold tracking-[0.08em] text-text1">{startDate}</div>
            </div>
            <div className="section-tag">Tactical Archive</div>
          </div>

          <NavLink
            className={`mt-3 flex items-center justify-between rounded-[20px] border border-white/6 bg-white/[0.02] px-5 py-4 transition-[transform,opacity,border-color,background-color] duration-[280ms] ease-[var(--ease-out)] hover:border-brand/20 hover:bg-brand/[0.06] ${
              isOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
            style={{ transitionDelay: isOpen ? `${100 + (navItems.length + 1) * 45}ms` : "0ms" }}
            tabIndex={isOpen ? undefined : -1}
            to={localStorage.getItem("adminToken") ? "/admin/dashboard" : "/admin/login"}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3 items-center justify-center">
                <div className="absolute h-full w-full rotate-45 border border-brand/30" />
                <div className="h-1 w-1 bg-brand/50" />
              </div>
              <div>
                <div className="font-display text-[10px] uppercase tracking-[0.3em] text-white/30">Operations</div>
                <div className="mt-1 font-title text-base font-bold tracking-[0.08em] text-text2">工作人员入口</div>
              </div>
            </div>
            <div className="font-display text-[10px] uppercase tracking-[0.18em] text-brand/50">OPS →</div>
          </NavLink>
        </div>
      </aside>
    </>
  );
}

