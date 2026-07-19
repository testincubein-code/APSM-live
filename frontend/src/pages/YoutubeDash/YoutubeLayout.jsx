// ── YouTube Dashboard Layout Shell ─────────────────────────────────
// Main container for the YouTube Analytics Dashboard. Renders a
// left sub-navigation sidebar with 8 page tabs and a content area
// that renders the active sub-page. Handles YouTube connection check,
// OAuth flow, data fetching, and distributes parsed data to children.

import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, NavLink, Outlet } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube } from "@/components/icons/BrandIcons";
import DashboardHeader from "@/components/DashboardHeader";
import ConnectCard from "@/components/ConnectCard";
import {
  LayoutDashboard,
  FileVideo,
  Users,
  Heart,
  ListVideo,
  DollarSign,
  Radio,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Settings,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import {
  fetchYouTubeStatus,
  fetchYouTubeAnalytics,
  connectYouTube,
  revokeYouTube,
} from "@/services/ytapi";

import DateRangePicker from "@/components/DateRangePicker";

import ConfirmDisconnectModal from "@/components/ConfirmDisconnectModal";

// ── Sub-navigation items ────────────────────────────────────────────
const SUB_NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "content", label: "Content", icon: FileVideo },
  { key: "audience", label: "Audience", icon: Users },
  { key: "engagement", label: "Engagement", icon: Heart },
  { key: "playlists", label: "Playlists", icon: ListVideo },
  { key: "revenue", label: "Revenue", icon: DollarSign },
  { key: "realtime", label: "Realtime", icon: Radio },
  { key: "reports", label: "Reports", icon: Download },
];

const YT_NAV_BOTTOM = [
  { path: "/dashboard/youtube/settings", label: "Settings", icon: Settings },
  { path: "/dashboard/youtube/help",     label: "Help",     icon: HelpCircle },
];

// ── Reusable Sidebar Link ─────────────────────────────────────────────────────
const SidebarLink = ({ to, icon: Icon, label, end, onClick, isCollapsed }) => {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-200 ${
          isCollapsed ? 'justify-center' : ''
        } ${
          isActive 
            ? 'bg-[#FF0000]/10 text-[#FF0000] shadow-sm' 
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

// ── Loading Spinner ─────────────────────────────────────────────────
// Branded loading spinner shown during initial connection check.
function YTSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="relative w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-red-500/20 rounded-full" />
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-red-500 rounded-full animate-spin" />
      </div>
    </div>
  );
}

// ── Connect YouTube Prompt ──────────────────────────────────────────
// Shown when YouTube account is not connected via OAuth.
function ConnectPrompt({ onConnect }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
      <Card className="w-full max-w-md border-border/50 shadow-2xl p-6 text-center">
        <CardHeader className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <Youtube className="h-8 w-8 text-red-500" />
          </div>
          <CardTitle className="text-xl mt-4">Connect YouTube Channel</CardTitle>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Connect your YouTube account to view sub counts, channel views, watch time,
            and detailed visual performance graphs.
          </p>
        </CardHeader>
        <CardContent className="mt-6">
          <Button
            onClick={onConnect}
            className="w-full gap-2 bg-red-600 hover:bg-red-500 text-white"
            size="lg"
            id="connect-youtube-btn"
          >
            Connect YouTube Channel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Error State ─────────────────────────────────────────────────────
// Shown when analytics fetch fails. Includes retry button.
function ErrorState({ onRetry }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center animate-fade-in">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold">Something went wrong</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          We couldn't load your YouTube analytics. Please check your connection and try again.
        </p>
        <Button
          onClick={onRetry}
          className="mt-4 gap-2"
          variant="outline"
          id="retry-analytics-btn"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}

// ── Main YouTube Layout Component ────────────────────────────────
export default function YoutubeLayout() {
  // ── State management ──────────────────────────────────────────────
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(false);

  const [subNavCollapsed, setSubNavCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Default to Last 7 Days
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const defaultStart = d.toISOString().split('T')[0];
  const defaultEnd = new Date().toISOString().split('T')[0];
  
  const [dateRange, setDateRange] = useState({ start: defaultStart, end: defaultEnd });

  const location = useLocation();
  const navigate = useNavigate();

  // 1. Intercept and Sanitize OAuth Redirects
  useEffect(() => {
    if (location.search.includes("connected=") || location.search.includes("error=")) {
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // ── Check YouTube connection status on mount ──────────────────────
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await fetchYouTubeStatus();
        if (status.connected) {
          setIsConnected(true);
          setUsername(status.username);
        }
      } catch (err) {
        console.error("Error checking YouTube connection:", err);
      } finally {
        setConnectionLoading(false);
      }
    };
    checkConnection();
  }, []);

  // ── Fetch analytics data when connected ───────────────────────────
  const loadAnalytics = useCallback(async (force = false) => {
    setAnalyticsLoading(true);
    setAnalyticsError(false);
    try {
      const data = await fetchYouTubeAnalytics(force, { startDate: dateRange.start, endDate: dateRange.end });
      setAnalyticsData(data);
    } catch (err) {
      console.error("Error fetching YouTube analytics:", err);
      setAnalyticsError(true);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [dateRange]);

  // ── Auto-fetch analytics when connection is confirmed ─────────────
  useEffect(() => {
    if (isConnected) {
      loadAnalytics(false);
    }
  }, [isConnected, loadAnalytics]);

  // ── Handle YouTube OAuth connect ──────────────────────────────────
  const handleConnect = () => {
    connectYouTube();
  };

  // ── Handle YouTube revoke ─────────────────────────────────────────
  const executeRevoke = async () => {
    setRevokeLoading(true);
    try {
      await revokeYouTube();
    } catch (err) {
      console.error("Error revoking YouTube access:", err);
    } finally {
      // 2. Bulletproof the handleDisconnect Function
      localStorage.removeItem('youtubeToken');
      setIsConnected(false);
      setUsername("");
      setAnalyticsData(null);
      setRevokeLoading(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleRevoke = () => {
    setShowDisconnectModal(true);
  };

  // ── Loading state (checking connection) ───────────────────────────
  if (connectionLoading) return <YTSpinner />;

  // ── Not connected state ───────────────────────────────────────────
  if (!isConnected || localStorage.getItem('youtubeToken') === 'false') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background -m-6 text-white p-6 animate-fade-in relative overflow-hidden">
        {/* ── Background Gradient Orbs ──────────────────────────────────── */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="z-10 relative">
          <ConnectCard
          icon={<Youtube className="h-8 w-8 text-[#FF0000]" />}
          cardTitle="Connect YouTube Channel"
          cardDescription="Connect your YouTube account to view sub counts, channel views, watch time, and detailed visual performance graphs."
          onConnect={handleConnect}
          buttonText="Connect YouTube Channel"
          brandBgClass="bg-[#FF0000]/10"
          brandTextClass="text-[#FF0000]"
          brandButtonClass="bg-[#FF0000] hover:bg-[#FF0000]/90 text-white font-semibold"
        />
        </div>
      </div>
    );
  }

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <div className="flex gap-0 -m-6 h-[calc(100vh-4rem)] bg-background text-white overflow-hidden relative transition-colors duration-200">
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

      {/* ── YouTube Sub-Navigation Sidebar ────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10
          bg-background/95 backdrop-blur-xl lg:bg-background lg:backdrop-blur-none
          transition-all duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          ${subNavCollapsed ? "lg:w-[72px]" : "lg:w-64"}
        `}
      >
        {/* ── Mobile Close Button ──────────────────────────────────── */}
        <div className="lg:hidden flex justify-end p-4 border-b border-white/5">
          <button 
            onClick={closeMobile} 
            className="text-gray-400 hover:text-[#FF0000] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ── Brand Header ─────────────────────────────────────────────── */}
        <div className={`border-b border-white/10 p-3 ${subNavCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF0000]/10">
              <Youtube className="h-4 w-4 text-[#FF0000]" />
            </div>
            {!subNavCollapsed && (
              <div className="min-w-0 flex-1 hidden lg:block">
                <p className="text-xs font-semibold truncate text-white">YouTube</p>
                <p className="text-[10px] text-gray-400 truncate">
                  {connectionLoading ? "Loading..." : username || "Connected"}
                </p>
              </div>
            )}
            {/* Always show text on mobile overlay */}
            <div className="min-w-0 flex-1 lg:hidden">
              <p className="text-xs font-semibold truncate text-white">YouTube</p>
              <p className="text-[10px] text-gray-400 truncate">
                {connectionLoading ? "Loading..." : username || "Connected"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Desktop Collapse Toggle ───────────────────────────────────── */}
        <div className="hidden lg:block p-2 border-b border-white/10">
          <button
            onClick={() => setSubNavCollapsed(!subNavCollapsed)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200 ${
              subNavCollapsed ? 'justify-center' : ''
            }`}
            title={subNavCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            id="yt-collapse-btn"
          >
            {subNavCollapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* ── Navigation Links ──────────────────────────────────────── */}
        <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-y-auto">
          {SUB_NAV_ITEMS.map((item) => {
            const toPath = item.key === "overview" ? "/dashboard/youtube" : `/dashboard/youtube/${item.key}`;
            return (
              <SidebarLink
                key={item.key}
                to={toPath}
                icon={item.icon}
                label={item.label}
                end={item.key === "overview"}
                onClick={closeMobile}
                isCollapsed={subNavCollapsed}
              />
            );
          })}
        </nav>
        
        {/* ── Bottom-pinned Settings & Help (NO profile block) ──────────── */}
        <div className="py-2 px-1.5 border-t border-white/5 space-y-0.5 mt-auto">
          {YT_NAV_BOTTOM.map((item) => (
            <SidebarLink
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              onClick={closeMobile}
              isCollapsed={subNavCollapsed}
            />
          ))}
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <ConfirmDisconnectModal 
          isOpen={showDisconnectModal} 
          onClose={() => setShowDisconnectModal(false)} 
          onConfirm={() => {
            setShowDisconnectModal(false);
            executeRevoke();
          }} 
        />
        {/* ── Mobile Header Toggle ───────────────────────────────────── */}
        <div className="lg:hidden flex items-center p-4 border-b border-white/10 bg-background/80 backdrop-blur-md relative z-10">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="text-gray-400 hover:text-[#FF0000] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-4 font-semibold text-white">YouTube Dashboard</span>
        </div>

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 border-b border-white/10 bg-background/80 backdrop-blur-md px-6 py-3">
          <div className="flex items-center justify-between">
            <DashboardHeader
              title="YouTube Analytics"
              subtitle={username ? `Channel: ${username}` : "YouTube Analytics"}
              icon={<Youtube className="h-5 w-5" />}
              brandBgClass="bg-[#FF0000]/10"
              brandTextClass="text-[#FF0000]"
            />
            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <DateRangePicker 
                startDate={dateRange.start} 
                endDate={dateRange.end} 
                onChange={setDateRange} 
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadAnalytics(true)}
                disabled={analyticsLoading}
                className="text-xs text-gray-400 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white h-9 px-3"
                id="yt-refresh-btn-new"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${analyticsLoading ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* ── Active Page Content ──────────────────────────────────────── */}
        <div className="p-6">
          {analyticsError ? (
            <ErrorState onRetry={loadAnalytics} />
          ) : (
            <Outlet context={{ data: analyticsData, loading: analyticsLoading, isConnected, username, handleRevoke, handleConnect }} />
          )}
        </div>
      </div>
    </div>
  );
}
