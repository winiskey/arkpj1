import { ChevronRight, Menu } from "lucide-react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useState, useCallback } from "react";
import { HomePage } from "./pages/HomePage";
import { LOGO_IMAGE_SRC } from "./lib/logo";
import { FullPageLoader } from "./components/FullPageLoader";
import { GSAPRouterTransition } from "./components/GSAPRouterTransition";
import { MobileMenu } from "./components/MobileMenu";
import { useSiteData } from "./context/SiteDataContext";

const LivePage = lazy(() => import("./pages/LivePage").then((module) => ({ default: module.LivePage })));
const RulesPage = lazy(() => import("./pages/RulesPage").then((module) => ({ default: module.RulesPage })));
const TeamsPage = lazy(() => import("./pages/TeamsPage").then((module) => ({ default: module.TeamsPage })));

const navItems = [
  { to: "/", label: "首页" },
  { to: "/live", label: "赛事大厅" },
  { to: "/teams", label: "队伍情报" },
  { to: "/rules", label: "赛事详情" },
];

function AppShell() {
  const location = useLocation();
  const {
    data: { siteMeta },
  } = useSiteData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-base text-white">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/65 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 md:px-8 lg:px-12 xl:px-20">
          {/* Logo */}
          <NavLink className="group relative flex items-center gap-3" to="/">
            <div className="absolute inset-0 rounded-full bg-accent/20 blur-xl opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            <img
              alt="荆楚歌 Logo"
              className="relative h-9 w-9 brightness-0 invert drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all duration-500 group-hover:drop-shadow-[0_0_16px_rgba(212,190,136,0.8)]"
              src={LOGO_IMAGE_SRC}
            />
            <div>
              <div className="font-display text-lg font-black uppercase tracking-[0.2em] text-accent md:text-xl">
                {siteMeta.eventName}
              </div>
              <div className="hidden font-display text-[10px] uppercase tracking-[0.32em] text-white/45 sm:block">
                {siteMeta.eventCode}
              </div>
            </div>
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-4 lg:flex">
            <nav className="relative flex gap-1">
              {navItems.map((item) => {
                const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    className={({ isActive }) => `
                      relative overflow-hidden whitespace-nowrap px-4 py-3 font-display text-sm uppercase tracking-[0.22em] transition-all duration-500
                      ${isActive ? "text-white bg-white/5" : "text-white/50 hover:text-white hover:bg-white/[0.02]"}
                    `}
                    key={item.to}
                    to={item.to}
                  >
                    <span className="relative z-10">{item.label}</span>
                    <div className={`absolute bottom-0 left-0 h-[2px] w-full bg-accent transition-transform duration-500 origin-left 
                      ${isActive ? "scale-x-100" : "scale-x-0"}`}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t from-accent/10 to-transparent opacity-0 transition-opacity duration-500
                      ${isActive ? "opacity-100" : ""}`}
                    />
                  </NavLink>
                );
              })}
            </nav>
            <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">
              <span className="font-display tracking-[0.26em]">开赛 {siteMeta.startDate}</span>
              <ChevronRight className="h-3.5 w-3.5 text-accent" />
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button
            aria-label="打开导航菜单"
            title="打开导航菜单"
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/[0.03] text-white/60 hover:text-white transition-colors lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile Slide-over Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        navItems={navItems}
        onClose={closeMobileMenu}
        startDate={siteMeta.startDate}
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
