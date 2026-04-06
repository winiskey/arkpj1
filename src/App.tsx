import { Menu } from "lucide-react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import { HomePage } from "./pages/HomePage";
import { LOGO_IMAGE_SRC } from "./lib/logo";
import { FullPageLoader } from "./components/FullPageLoader";
import { GSAPRouterTransition } from "./components/GSAPRouterTransition";
import { MobileMenu } from "./components/MobileMenu";
import { useSiteData } from "./context/SiteDataContext";
import { SpatialNavbar } from "./components/SpatialNavbar";
import { ProtectedRoute } from "./components/ProtectedRoute";

const LivePage = lazy(() => import("./pages/LivePage").then((module) => ({ default: module.LivePage })));
const RulesPage = lazy(() => import("./pages/RulesPage").then((module) => ({ default: module.RulesPage })));
const TeamsPage = lazy(() => import("./pages/TeamsPage").then((module) => ({ default: module.TeamsPage })));
const ContestantPage = lazy(() => import("./pages/ContestantPage").then((module) => ({ default: module.ContestantPage })));
const HistoryPage = lazy(() => import("./pages/HistoryPage").then((module) => ({ default: module.HistoryPage })));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin").then((m) => ({ default: m.AdminLogin })));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const ScoreManagement = lazy(() => import("./pages/admin/ScoreManagement").then((m) => ({ default: m.ScoreManagement })));
const TeamManagement = lazy(() => import("./pages/admin/TeamManagement").then((m) => ({ default: m.TeamManagement })));
const BroadcastControl = lazy(() => import("./pages/admin/BroadcastControl").then((m) => ({ default: m.BroadcastControl })));
const ScoreCalculator = lazy(() => import("./pages/admin/ScoreCalculator").then((m) => ({ default: m.ScoreCalculator })));
const FinalsManagement = lazy(() => import("./pages/admin/FinalsManagement").then((m) => ({ default: m.FinalsManagement })));

const navItems = [
  { to: "/", label: "首页" },
  { to: "/live", label: "赛事大厅" },
  { to: "/teams", label: "队伍情报" },
  { to: "/rules", label: "赛事手册" },
  { to: "/history", label: "历史赛事" },
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
        <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-4 px-4 py-4 md:px-8 lg:px-10 xl:px-12 2xl:px-20">
          <NavLink className="group flex min-w-0 items-center gap-3" to="/">
            <div className="interactive-surface flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand/18 bg-brand/8 shadow-brand group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5">
              <img
                alt="荆楚歌 Logo"
                className="h-8 w-8 brightness-0 invert drop-shadow-[0_0_12px_rgba(214,192,138,0.36)] transition-transform duration-[160ms] group-hover:scale-[1.03]"
                src={LOGO_IMAGE_SRC}
              />
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-[11px] uppercase tracking-[0.18em] text-brand/80">{siteMeta.eventCode}</div>
              <div className="mt-1 truncate font-title text-2xl font-black tracking-[0.03em] text-text1 md:text-2xl">
                {siteMeta.eventName}
              </div>
            </div>
          </NavLink>

          <div className="hidden items-center gap-12 xl:gap-16 lg:flex">
            <SpatialNavbar items={navItems} />

            {/* Spatial Minimalist Data Nodes */}
            <div className="group flex items-center gap-6 xl:gap-8">
              {/* Node 1: Location Marker */}
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3 items-center justify-center">
                  <div className="absolute h-full w-full rotate-45 border border-brand/40 transition-transform duration-500 group-hover:scale-125 group-hover:border-brand/80" />
                  <div className="h-1 w-1 bg-brand" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[10px] uppercase tracking-[0.3em] text-white/30">Location</span>
                  <span className="font-display text-xs text-brand/60">//</span>
                  <span className="font-title text-[15px] font-medium tracking-[0.15em] text-text1 transition-colors duration-300 group-hover:text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                    {currentLabel}
                  </span>
                </div>
              </div>

              {/* Connector */}
              <div className="flex gap-1.5 opacity-30 transition-opacity duration-300 group-hover:opacity-70">
                <span className="h-0.5 w-0.5 bg-brand" />
                <span className="h-0.5 w-0.5 bg-brand" />
                <span className="h-0.5 w-0.5 bg-brand" />
              </div>

              {/* Node 2: Event Time */}
              <div className="flex items-baseline gap-2">
                <span className="font-title text-xs font-light tracking-[0.15em] text-white/50">开赛</span>
                <span className="font-display text-base tracking-[0.12em] text-brand drop-shadow-[0_0_12px_rgba(214,192,138,0.5)] transition-all duration-300 group-hover:drop-shadow-[0_0_16px_rgba(214,192,138,0.8)]">
                  {siteMeta.startDate}
                </span>
              </div>

              {/* Connector */}
              <div className="flex gap-1.5 opacity-20 transition-opacity duration-300 group-hover:opacity-50">
                <span className="h-0.5 w-0.5 bg-brand" />
                <span className="h-0.5 w-0.5 bg-brand" />
              </div>

              {/* Node 3: Admin Portal */}
              <NavLink
                aria-label="工作人员后台入口"
                className="group/ops flex items-center gap-2.5 opacity-50 transition-opacity duration-300 hover:opacity-100"
                to={localStorage.getItem("adminToken") ? "/admin/dashboard" : "/admin/login"}
              >
                <div className="relative flex h-2.5 w-2.5 items-center justify-center">
                  <div className="absolute h-full w-full rotate-45 border border-brand/30 transition-all duration-500 group-hover/ops:scale-125 group-hover/ops:border-brand/70" />
                  <div className="h-0.5 w-0.5 bg-brand/60 transition-colors duration-300 group-hover/ops:bg-brand" />
                </div>
                <span className="font-display text-[10px] uppercase tracking-[0.3em] text-white/30 transition-colors duration-300 group-hover/ops:text-brand/70">
                  OPS
                </span>
              </NavLink>
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
              <Route element={<ContestantPage />} path="/contestants/:contestantId" />
              <Route element={<RulesPage />} path="/rules" />
              <Route element={<HistoryPage />} path="/history" />
              <Route element={<AdminLogin />} path="/admin/login" />
              <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>} path="/admin">
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route element={<AdminDashboard />} path="dashboard" />
                <Route element={<ScoreManagement />} path="scores" />
                <Route element={<TeamManagement />} path="teams" />
                <Route element={<FinalsManagement />} path="finals" />
                <Route element={<BroadcastControl />} path="broadcast" />
                <Route element={<ScoreCalculator />} path="calculator" />
              </Route>
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
