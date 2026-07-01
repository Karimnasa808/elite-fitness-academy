// src/components/Layout.jsx
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck2,
  FileBarChart,
  Dumbbell,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const navItems = [
  { to: "/", label: "لوحة التحكم", icon: LayoutDashboard, end: true },
  { to: "/players", label: "اللاعبين", icon: Users },
  { to: "/branches", label: "الفروع", icon: Building2 },
  { to: "/attendance", label: "الحضور والغياب", icon: CalendarCheck2 },
  { to: "/exercise-types", label: "أنواع القياسات", icon: Dumbbell },
  { to: "/reports", label: "التقارير", icon: FileBarChart },
];

export default function Layout() {
  const { coach, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex bg-cream">
      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-ink flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-8 w-8 rounded-full" />
          <span className="text-white font-display font-bold text-sm">Elite Fitness</span>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="text-white p-1.5"
          aria-label="القائمة"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 h-screen w-64 bg-ink text-cream flex flex-col z-40 transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Elite Fitness Academy" className="h-12 w-12 rounded-full ring-2 ring-red/60" />
            <div>
              <div className="font-display font-bold text-base leading-tight">Elite Fitness</div>
              <div className="font-display font-bold text-base leading-tight">Academy</div>
            </div>
          </div>
          <div className="h-px bg-red/70 mt-5" />
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-red text-white"
                    : "text-cream/75 hover:bg-white/5 hover:text-cream"
                }`
              }
            >
              <item.icon size={18} strokeWidth={2.2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <NavLink
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive ? "bg-red text-white" : "text-cream/75 hover:bg-white/5 hover:text-cream"
              }`
            }
          >
            <SettingsIcon size={18} strokeWidth={2.2} />
            الإعدادات
          </NavLink>
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <span className="text-xs text-cream/60 truncate">{coach?.name}</span>
            <button
              onClick={handleLogout}
              className="text-cream/70 hover:text-red-light transition-colors"
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-ink/60 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
