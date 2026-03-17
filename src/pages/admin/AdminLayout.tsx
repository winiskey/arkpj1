import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Radio,
  Calculator,
  LogOut,
} from "lucide-react";
import { AdminDataProvider } from "./AdminDataContext";
import { ToastProvider } from "./ToastContext";
import { clearAdminToken } from "./useAdminApi";

const navItems = [
  { to: "/admin/dashboard", label: "数据总览", icon: LayoutDashboard },
  { to: "/admin/scores", label: "成绩录入", icon: FileText },
  { to: "/admin/teams", label: "战队管理", icon: Users },
  { to: "/admin/broadcast", label: "直播控制", icon: Radio },
  { to: "/admin/calculator", label: "单人算分", icon: Calculator },
];

export function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAdminToken();
    navigate("/admin/login");
  };

  return (
    <AdminDataProvider>
      <ToastProvider>
        <div className="flex min-h-screen bg-canvas">
          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <aside className="relative flex w-64 flex-col border-r border-strokeSoft bg-surface1">
            {/* Brand */}
            <div className="p-6">
              <h1 className="font-title text-xl font-bold text-brand">管理后台</h1>
              <p className="mt-1 text-xs text-text3">荆楚歌 #2</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `mb-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${isActive
                      ? "bg-brand/10 font-medium text-brand"
                      : "text-text2 hover:bg-surface2 hover:text-text1"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Logout – positioned at bottom of sidebar via flex layout */}
            <div className="border-t border-strokeSoft p-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-text3 transition-colors hover:bg-surface2 hover:text-live"
              >
                <LogOut className="h-5 w-5" />
                退出登录
              </button>
            </div>
          </aside>

          {/* ── Main content ────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </ToastProvider>
    </AdminDataProvider>
  );
}
