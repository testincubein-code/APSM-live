// ── Instagram Layout Shell ────────────────────────────────────────────
// Renders a collapsible left sub-navigation sidebar and an <Outlet>
// for child route views. Fetches only the global connection state and
// user profile identity on mount, passing it down via Outlet context.

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  Home, Grid, Users, Activity, Clock, PlaySquare,
  TrendingUp, Hash, BarChart, FileText, Settings, HelpCircle,
  Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import igapi from '@/services/igapi';
import ConnectCard from '@/components/ConnectCard';

// ── Navigation items (main) ──────────────────────────────────────────
const navItems = [
  { path: "/dashboard/instagram", label: "Overview", icon: Home, end: true },
  { path: "/dashboard/instagram/content", label: "Content", icon: Grid },
  { path: "/dashboard/instagram/audience", label: "Audience", icon: Users },
  { path: "/dashboard/instagram/engagement", label: "Engagement", icon: Activity },
  { path: "/dashboard/instagram/stories", label: "Stories", icon: Clock },
  { path: "/dashboard/instagram/reels", label: "Reels", icon: PlaySquare },
  { path: "/dashboard/instagram/growth", label: "Growth", icon: TrendingUp },
  { path: "/dashboard/instagram/hashtags", label: "Hashtags", icon: Hash },
  { path: "/dashboard/instagram/insights", label: "Insights", icon: BarChart },
  { path: "/dashboard/instagram/reports", label: "Reports", icon: FileText },
];

// ── Navigation items (bottom-pinned) ─────────────────────────────────
const bottomItems = [
  { path: "/dashboard/instagram/settings", label: "Settings", icon: Settings },
  { path: "/dashboard/instagram/help", label: "Help", icon: HelpCircle },
];

// ── Sidebar Link Component ───────────────────────────────────────────
// Renders a NavLink with active highlighting and collapse-aware layout.
const SidebarLink = ({ to, icon: Icon, label, end, onClick, isCollapsed }) => {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-200 ${isCollapsed ? 'justify-center' : ''
        } ${isActive
          ? 'bg-[#E1306C]/10 text-[#E1306C] shadow-sm'
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

// ── Main Layout Component ────────────────────────────────────────────
const InstagramLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch only top-level layout data (Connection State & Identity) ──
  useEffect(() => {
    let isMounted = true;

    const fetchLayoutData = async () => {
      try {
        const data = await igapi.getProfile();
        if (isMounted) {
          setProfileData(data);
        }
      } catch (error) {
        console.error("Failed to fetch Instagram profile", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLayoutData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Connection handler ──────────────────────────────────────────────────────
  const handleConnect = () => {
    const token = localStorage.getItem("incubein_token");
    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5000";
    localStorage.setItem("returnPath", window.location.pathname);
    window.location.href = `${baseUrl}/auth/instagram?token=${token}`;
  };

  const isConnected = profileData?.isConnected ?? false;

  // ── Loading state (checking connection) ───────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background text-white relative overflow-hidden">
        {/* ── Background Gradient Orbs ──────────────────────────────────── */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="relative w-12 h-12 z-10">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-[#E1306C]/20 rounded-full" />
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-[#E1306C] rounded-full animate-spin" />
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
            <svg className="h-8 w-8 text-[#E1306C]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          }
          cardTitle="Connect Instagram Account"
          cardDescription="Connect your Instagram account to view impressions, follower growth, content engagement, and detailed analytics."
          onConnect={handleConnect}
          buttonText="Connect Instagram Business Account"
          brandBgClass="bg-[#E1306C]/10"
          brandTextClass="text-[#E1306C]"
          brandButtonClass="bg-[#E1306C] hover:bg-[#E1306C]/90 text-white font-semibold"
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
      {/* ── Mobile Backdrop ──────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── INNER SIDEBAR ────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 border-r border-white/10 flex flex-col          bg-background/95 backdrop-blur-xl lg:bg-background lg:backdrop-blur-none
        transition-all duration-300 ease-in-out lg:static lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
        ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}
      `}>
        {/* ── Mobile Close Button ──────────────────────────────────── */}
        <div className="lg:hidden flex justify-end p-4 border-b border-white/5">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-gray-400 hover:text-[#E1306C] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ── Brand Header ─────────────────────────────────────────── */}
        <div className={`border-b border-white/10 p-3 ${isCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E1306C]/10">
              <svg className="h-4 w-4 text-[#E1306C]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 hidden lg:block">
                <p className="text-xs font-semibold truncate text-white">Instagram</p>
                <p className="text-[10px] text-gray-400 truncate">
                  {profileData?.profile?.handle || (isConnected ? "Connected" : "Not Connected")}
                </p>
              </div>
            )}
            {/* Always show text on mobile overlay */}
            <div className="min-w-0 flex-1 lg:hidden">
              <p className="text-xs font-semibold truncate text-white">Instagram</p>
              <p className="text-[10px] text-gray-400 truncate">
                {profileData?.profile?.handle || (isConnected ? "Connected" : "Not Connected")}
              </p>
            </div>
          </div>
        </div>

        {/* ── Collapse Toggle (desktop only) ───────────────────────── */}
        <div className="hidden lg:block p-2 border-b border-white/10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200 ${isCollapsed ? 'justify-center' : ''
              }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            id="ig-collapse-btn"
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

        {/* ── Navigation Links ─────────────────────────────────────── */}
        <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarLink
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              end={item.end}
              onClick={() => setIsMobileMenuOpen(false)}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* ── Bottom Navigation (Settings/Help) ────────────────────── */}
        <div className="py-2 px-1.5 border-t border-white/5 space-y-0.5 mt-auto">
          {bottomItems.map((item) => (
            <SidebarLink
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              onClick={() => setIsMobileMenuOpen(false)}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* ── Mobile Header Toggle ───────────────────────────────────── */}
        <div className="lg:hidden flex items-center p-4 border-b border-white/10 bg-background/80 backdrop-blur-md relative z-10">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-400 hover:text-[#E1306C] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-4 font-semibold text-white">Instagram Dashboard</span>
        </div>

        {/* ── Scrollable Content Area ────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto relative z-10">
          <Outlet context={{
            profile: profileData?.profile,
            isConnected,
            isLayoutLoading: isLoading
          }} />
        </main>
      </div>
    </div>
  );
};

export default InstagramLayout;
