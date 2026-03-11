import { ChevronRight, Menu } from "lucide-react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import { HomePage } from "./pages/HomePage";
import { LOGO_IMAGE_SRC } from "./lib/logo";
import { FullPageLoader } from "./components/FullPageLoader";
import { GSAPRouterTransition } from "./components/GSAPRouterTransition";
import { MobileMenu } from "./components/MobileMenu";
import { useSiteData } from "./context/SiteDataContext";
import { SpatialNavbar } from "./components/SpatialNavbar";

const LivePage = lazy(() => import("./pages/LivePage").then((module) => ({ default: module.LivePage })));
const RulesPage = lazy(() => import("./pages/RulesPage").then((module) => ({ default: module.RulesPage })));
const TeamsPage = lazy(() => import("./pages/TeamsPage").then((module) => ({ default: module.TeamsPage })));

const navItems = [
  { to: "/", label: "首页" },
  { to: "/live", label: "赛事大厅" },
  { to: "/teams", label: "队伍情报" },
  { to: "/rules", label: "赛事手册" },
];

function AppShell() {
  const location = useLocation();
  const {
    data: { siteMeta },
  } = useSiteData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);

  const currentLabel = useMemo(
    () => navItems.find((item) => (item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)))?.label ?? "首页",
    [location.pathname],
  );

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-canvas text-text1">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/8 bg-[linear-gradient(180deg,rgba(11,13,16,0.94),rgba(11,13,16,0.82))] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 md:px-8 lg:px-10 xl:px-12">
          <NavLink className="group flex min-w-0 items-center gap-3" to="/">
            <div className="interactive-surface flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand/18 bg-brand/8 shadow-brand group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5">
              <img
                alt="荆楚歌 Logo"
                className="h-7 w-7 brightness-0 invert drop-shadow-[0_0_12px_rgba(214,192,138,0.36)] transition-transform duration-[160ms] group-hover:scale-[1.03]"
                src={LOGO_IMAGE_SRC}
              />
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-[11px] uppercase tracking-[0.18em] text-brand/80">{siteMeta.eventCode}</div>
              <div className="mt-1 truncate font-title text-xl font-black tracking-[0.03em] text-text1 md:text-2xl">
                {siteMeta.eventName}
              </div>
            </div>
          </NavLink>

          <div className="hidden items-center gap-6 lg:flex">
            <SpatialNavbar items={navItems} />
            <div className="panel-data interactive-surface group flex min-h-[56px] items-center gap-3 rounded-full px-4 py-2 hover:border-brand/16 hover:bg-white/[0.05]">
              <div>
                <div className="font-display text-[10px] uppercase tracking-[0.18em] text-text3">Current Deck</div>
                <div className="mt-1 font-display text-sm font-bold tracking-[0.08em] text-text1">{currentLabel}</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="font-display text-xs uppercase tracking-[0.18em] text-brand/85">开赛 {siteMeta.startDate}</div>
              <ChevronRight className="h-4 w-4 text-brand/70 transition-transform duration-[180ms] group-hover:translate-x-0.5" />
            </div>
          </div>

          <button
            ref={mobileMenuTriggerRef}
            aria-controls="mobile-navigation-dialog"
            aria-expanded={mobileMenuOpen}
            aria-haspopup="dialog"
            aria-label="打开导航菜单"
            className="btn-ghost h-12 w-12 rounded-2xl px-0 py-0 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        navItems={navItems}
        onClose={closeMobileMenu}
        startDate={siteMeta.startDate}
        triggerRef={mobileMenuTriggerRef}
      />

      <div className="relative flex flex-1 flex-col">
        <Suspense fallback={<FullPageLoader />}>
          <GSAPRouterTransition>
            <Routes location={location}>
              <Route element={<HomePage />} path="/" />
              <Route element={<LivePage />} path="/live" />
              <Route element={<TeamsPage />} path="/teams" />
              <Route element={<RulesPage />} path="/rules" />
            </Routes>
          </GSAPRouterTransition>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
