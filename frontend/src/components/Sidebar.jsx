// ── Sidebar Component ───────────────────────────────────────────────
// Global navigation sidebar for the dashboard. Renders platform links,
// a branding header, and a logout action at the bottom.

import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Share2,
  Send,
  LogOut,
  Menu,
  LayoutDashboard,
} from "lucide-react";
import { Youtube, Linkedin, Facebook, Instagram } from "@/components/icons/BrandIcons";
import { Button } from "@/components/ui/button";
import ApsmLogo from "@/assets/images/apsm-logo.svg";

// ── Navigation Link Items ───────────────────────────────────────────
// Defines the left-hand menu navigation links. Unbundled Meta into
// separate Facebook and Instagram entries.
const navItems = [
  { label: "Combined Overview", path: "/dashboard/combined", icon: LayoutDashboard, isNew: true },
  { label: "YouTube", path: "/dashboard/youtube", icon: Youtube },
  { label: "LinkedIn", path: "/dashboard/linkedin", icon: Linkedin },
  { label: "Facebook", path: "/dashboard/facebook", icon: Facebook },
  { label: "Instagram", path: "/dashboard/instagram", icon: Instagram },
  { label: "Cross-Posting", path: "/dashboard/crosspost", icon: Send },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { logout, user } = useAuth();

  return (
    <aside className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/10 bg-background text-white transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}>
      {/* ── Branding Header ──────────────────────────────────────────── */}
      <div className={`flex h-16 items-center border-b border-white/10 px-4 ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? "hidden" : "flex"}`}>
          <img src={ApsmLogo} alt="APSM Logo" className="h-8 w-auto object-contain shrink-0" />
          <span className="text-xl font-bold tracking-wide text-white whitespace-nowrap">APSM</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="text-slate-400 hover:bg-white/10 hover:text-white">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* ── Navigation Links ─────────────────────────────────────────── */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
        {navItems.map((item, idx) => (
          <div key={item.path}>
            {idx === 1 && <div className="my-3 mx-2 h-px bg-white/10" />}
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200 relative ${
                  isCollapsed ? "justify-center px-0" : "gap-3 px-3"
                } ${
                  isActive
                    ? item.isNew 
                      ? "bg-indigo-600/20 text-indigo-400 shadow-sm border border-indigo-500/30" 
                      : "bg-white/10 text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${item.isNew ? 'text-indigo-400' : ''}`} />
              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              {!isCollapsed && item.isNew && (
                <span className="ml-auto flex items-center justify-center rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
                  NEW
                </span>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* ── User Info & Logout ────────────────────────────────────────── */}
      <div className={`border-t border-white/10 p-4 ${isCollapsed ? "flex flex-col items-center gap-4" : ""}`}>
        <div className={`mb-3 flex items-center gap-3 ${isCollapsed ? "justify-center mb-0" : ""}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-700 text-xs font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          {!isCollapsed && (
            <div className="flex-1 truncate">
              <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
              <p className="text-xs text-slate-400 truncate">
                {user?.email || "user@example.com"}
              </p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={`text-slate-400 hover:bg-white/10 hover:text-red-400 ${isCollapsed ? "w-10 h-10 p-0 justify-center" : "w-full justify-start gap-2"}`}
          onClick={logout}
          id="sidebar-logout-btn"
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
