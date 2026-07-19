// ── Facebook Layout Shell ─────────────────────────────────────────────────────
// Mirrors the InstagramLayout.jsx architecture.
// Responsibilities:
//   1. Fetch ONLY connection status + profile identity (fbapi.getProfile)
//   2. Render a self-contained Facebook-only collapsible sidebar
//   3. Render a mobile hamburger overlay for tablet/mobile
//   4. Pass { profile, isConnected, isLayoutLoading } down via <Outlet context>
// IMPORTANT: Does NOT import or modify MetaInnerSidebar.jsx
// IMPORTANT: Contains NO analytics data fetching — only identity/connection.

import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import fbapi from "@/services/fbapi";
import ConnectCard from "@/components/ConnectCard";
import {
  BarChart3, Users, Heart, FileText,
  ThumbsUp, Eye, Video, History, Target, Settings, HelpCircle,
  ChevronLeft, ChevronRight, Menu, X, RefreshCw, LogOut,
  PlaySquare, TrendingUp,
} from "lucide-react";

// ── Facebook brand color ──────────────────────────────────────────────────────
const FB_BLUE = "#1877F2";

// ── Sidebar navigation items (main) ──────────────────────────────────────────
// Mapped directly in this file — no shared component dependency.
const FB_NAV_ITEMS = [
  { path: "/dashboard/facebook", label: "Overview", icon: BarChart3, end: true },
  { path: "/dashboard/facebook/content", label: "Content", icon: FileText },
  { path: "/dashboard/facebook/audience", label: "Audience", icon: Users },
  { path: "/dashboard/facebook/engagement", label: "Engagement", icon: Heart },
  { path: "/dashboard/facebook/page_likes", label: "Page Likes", icon: ThumbsUp },
  { path: "/dashboard/facebook/reach_views", label: "Reach & Views", icon: Eye },
  { path: "/dashboard/facebook/videos", label: "Videos", icon: Video },
  { path: "/dashboard/facebook/stories", label: "Stories", icon: History },
  { path: "/dashboard/facebook/groups", label: "Groups", icon: Users },
  { path: "/dashboard/facebook/ads", label: "Ads", icon: Target },
  { path: "/dashboard/facebook/reports", label: "Reports", icon: FileText },
  { path: "/dashboard/facebook/insights", label: "Insights", icon: BarChart3 },
];

// ── Sidebar bottom-pinned items (Settings & Help — no profile block) ──────────
const FB_NAV_BOTTOM = [
  { path: "/dashboard/facebook/settings", label: "Settings", icon: Settings },
  { path: "/dashboard/facebook/help", label: "Help", icon: HelpCircle },
];

// ── Reusable Sidebar Link ─────────────────────────────────────────────────────
const SidebarLink = ({ to, icon: Icon, label, end, onClick, isCollapsed }) => {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-200 ${isCollapsed ? 'justify-center' : ''
        } ${isActive
          ? 'bg-[#1877F2]/10 text-[#1877F2] shadow-sm'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`
      }
      title={isCollapsed ? label : undefined}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
};

// ── Main Layout Component ─────────────────────────────────────────────────────
const FacebookLayout = () => {
  // ── Sidebar collapse state (desktop only) ─────────────────────────────────
  const [isCollapsed, setIsCollapsed] = useState(false);
  // ── Mobile overlay open/close ─────────────────────────────────────────────
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // ── Top-level identity/connection state — passed via Outlet context ────────
  const [profileData, setProfileData] = useState(null);
  const [isLayoutLoading, setIsLayoutLoading] = useState(true);

  // ── Fetch ONLY profile/connection on mount ────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const data = await fbapi.getProfile();
        if (mounted) setProfileData(data);
      } catch (err) {
        console.error("[FacebookLayout] Failed to fetch profile:", err);
      } finally {
        if (mounted) setIsLayoutLoading(false);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, []);

  // ── Connection handler ──────────────────────────────────────────────────────
  const handleConnect = () => {
    const token = localStorage.getItem("incubein_token");
    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5000";
    localStorage.setItem("returnPath", window.location.pathname);
    window.location.href = `${baseUrl}/auth/facebook?token=${token}`;
  };

  // ── Close mobile overlay when route changes ───────────────────────────────
  const closeMobile = () => setIsMobileOpen(false);

  // ── Resolved profile shorthand ────────────────────────────────────────────
  const profile = profileData?.profile;
  const isConnected = profileData?.isConnected ?? false;

  // ── Loading state (checking connection) ───────────────────────────
  if (isLayoutLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background text-white relative overflow-hidden">
        {/* ── Background Gradient Orbs ──────────────────────────────────── */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="relative w-12 h-12 z-10">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-[#1877F2]/20 rounded-full" />
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-[#1877F2] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background -m-6 text-white p-6 animate-fade-in relative overflow-hidden">
        {/* ── Background Gradient Orbs ──────────────────────────────────── */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="z-10 relative">
          <ConnectCard
          icon={
            <svg className="h-8 w-8 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          }
          cardTitle="Connect Facebook Page"
          cardDescription="Connect your Facebook account to view Page likes, post reach, engagements, and detailed visual performance metrics."
          onConnect={handleConnect}
          buttonText="Connect Facebook Page"
          brandBgClass="bg-[#1877F2]/10"
          brandTextClass="text-[#1877F2]"
          brandButtonClass="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white font-semibold"
        />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-0 -m-6 h-[calc(100vh-4rem)] bg-background text-white overflow-hidden relative">
      {/* ── Background Gradient Orbs ──────────────────────────────────── */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none z-0" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none z-0" />

      {/* ── Mobile Backdrop ───────────────────────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* INNER SIDEBAR — Facebook-only, fully self-contained               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10
          bg-background/95 backdrop-blur-xl lg:bg-background lg:backdrop-blur-none
          transition-all duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          ${isCollapsed ? "lg:w-[72px]" : "lg:w-64"}
        `}
      >
        {/* ── Mobile Close Button ──────────────────────────────────── */}
        <div className="lg:hidden flex justify-end p-4 border-b border-white/5">
          <button
            onClick={closeMobile}
            className="text-gray-400 hover:text-[#1877F2] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ── Brand Header ─────────────────────────────────────────────── */}
        <div className={`border-b border-white/10 p-3 ${isCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1877F2]/10">
              <svg className="h-4 w-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 hidden lg:block">
                <p className="text-xs font-semibold truncate text-white">Facebook</p>
                <p className="text-[10px] text-gray-400 truncate">
                  {isLayoutLoading ? "Loading..." : profile?.name || (isConnected ? "Connected" : "Not Connected")}
                </p>
              </div>
            )}
            {/* Always show text on mobile overlay */}
            <div className="min-w-0 flex-1 lg:hidden">
              <p className="text-xs font-semibold truncate text-white">Facebook</p>
              <p className="text-[10px] text-gray-400 truncate">
                {isLayoutLoading ? "Loading..." : profile?.name || (isConnected ? "Connected" : "Not Connected")}
              </p>
            </div>
          </div>
        </div>

        {/* ── Desktop Collapse Toggle ───────────────────────────────────── */}
        <div className="hidden lg:block p-2 border-b border-white/10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200 ${isCollapsed ? 'justify-center' : ''
              }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            id="fb-collapse-btn"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* ── Main Navigation Links ─────────────────────────────────────── */}
        <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-y-auto">
          {FB_NAV_ITEMS.map((item) => (
            <SidebarLink
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              end={item.end}
              onClick={closeMobile}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* ── Bottom-pinned Settings & Help (NO profile block) ──────────── */}
        <div className="py-2 px-1.5 border-t border-white/5 space-y-0.5 mt-auto">
          {FB_NAV_BOTTOM.map((item) => (
            <SidebarLink
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              onClick={closeMobile}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT AREA                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* ── Mobile Header Toggle ───────────────────────────────────── */}
        <div className="lg:hidden flex items-center p-4 border-b border-white/10 bg-background/80 backdrop-blur-md relative z-10">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="text-gray-400 hover:text-[#1877F2] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-4 font-semibold text-white">Facebook Dashboard</span>
        </div>

        {/* ── Scrollable Outlet Area ────────────────────────────────────── */}
        {/* Passes layout context to all child pages via Outlet context */}
        <main className="flex-1 overflow-y-auto relative z-10">
          <Outlet
            context={{
              profile,
              isConnected,
              isLayoutLoading,
            }}
          />
        </main>
      </div>
    </div>
  );
};

export default FacebookLayout;
