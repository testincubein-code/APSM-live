// ── YouTube Dashboard Layout Shell ─────────────────────────────────
// Main container for the YouTube Analytics Dashboard. Renders a
// left sub-navigation sidebar with 8 page tabs and a content area
// that renders the active sub-page. Handles YouTube connection check,
// OAuth flow, data fetching, and distributes parsed data to children.

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube } from "@/components/icons/BrandIcons";
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
} from "lucide-react";
import {
  fetchYouTubeStatus,
  fetchYouTubeAnalytics,
  connectYouTube,
  revokeYouTube,
} from "@/services/ytapi";

import DateRangePicker from "@/components/DateRangePicker";

// ── Sub-page imports ────────────────────────────────────────────────
import YoutubeOverview from "./YoutubeOverview";
import YoutubeContent from "./YoutubeContent";
import YoutubeAudience from "./YoutubeAudience";
import YoutubeEngagement from "./YoutubeEngagement";
import YoutubePlaylists from "./YoutubePlaylists";
import YoutubeRevenue from "./YoutubeRevenue";
import YoutubeRealtime from "./YoutubeRealtime";
import YoutubeReports from "./YoutubeReports";
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

// ── Main YouTube Dashboard Component ────────────────────────────────
export default function YoutubeDash() {
  // ── State management ──────────────────────────────────────────────
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(false);

  const [activePage, setActivePage] = useState("overview");
  const [subNavCollapsed, setSubNavCollapsed] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Default to Last 7 Days
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const defaultStart = d.toISOString().split('T')[0];
  const defaultEnd = new Date().toISOString().split('T')[0];
  
  const [dateRange, setDateRange] = useState({ start: defaultStart, end: defaultEnd });

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
  const handleRevoke = async () => {
    setRevokeLoading(true);
    try {
      await revokeYouTube();
      setIsConnected(false);
      setUsername("");
      setAnalyticsData(null);
    } catch (err) {
      console.error("Error revoking YouTube access:", err);
    } finally {
      setRevokeLoading(false);
    }
  };

  // ── Loading state (checking connection) ───────────────────────────
  if (connectionLoading) return <YTSpinner />;

  // ── Not connected state ───────────────────────────────────────────
  if (!isConnected) return <ConnectPrompt onConnect={handleConnect} />;

  // ── Render the active sub-page ────────────────────────────────────
  const renderActivePage = () => {
    // Error state (applies to all pages except empty-state pages)
    if (analyticsError && ["overview", "content", "audience", "engagement"].includes(activePage)) {
      return <ErrorState onRetry={loadAnalytics} />;
    }

    switch (activePage) {
      case "overview":
        return <YoutubeOverview data={analyticsData} loading={analyticsLoading} />;
      case "content":
        return <YoutubeContent data={analyticsData} loading={analyticsLoading} />;
      case "audience":
        return <YoutubeAudience data={analyticsData} loading={analyticsLoading} />;
      case "engagement":
        return <YoutubeEngagement data={analyticsData} loading={analyticsLoading} />;
      case "playlists":
        return <YoutubePlaylists loading={analyticsLoading} />;
      case "revenue":
        return <YoutubeRevenue loading={analyticsLoading} />;
      case "realtime":
        return <YoutubeRealtime loading={analyticsLoading} />;
      case "reports":
        return <YoutubeReports loading={analyticsLoading} />;
      default:
        return <YoutubeOverview data={analyticsData} loading={analyticsLoading} />;
    }
  };

  return (
    <div className="flex gap-0 -m-6 min-h-[calc(100vh-4rem)] bg-background text-slate-100 relative overflow-hidden">
      {/* ── Background Gradient Orbs ──────────────────────────────────── */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none z-0" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none z-0" />
      {/* ── YouTube Sub-Navigation Sidebar ────────────────────────────── */}
      <aside
        className={`shrink-0 border-r border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-sm transition-all duration-300 ${
          subNavCollapsed ? "w-14" : "w-52"
        }`}
      >
        <div className="sticky top-0 flex flex-col h-full">
          {/* ── Header with channel info ──────────────────────────────── */}
          <div className={`border-b border-gray-200 dark:border-white/10 p-3 ${subNavCollapsed ? "text-center" : ""}`}>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <Youtube className="h-4 w-4 text-red-500" />
              </div>
              {!subNavCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate text-gray-900 dark:text-slate-100">YouTube</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                    {username || "Connected"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Collapse Toggle ───────────────────────────────────────── */}
          <div className="p-2 border-b border-gray-200 dark:border-white/10">
            <button
              onClick={() => setSubNavCollapsed(!subNavCollapsed)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-slate-100 transition-all duration-200 ${
                subNavCollapsed ? "justify-center" : ""
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
              const isActive = activePage === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActivePage(item.key)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200 ${
                    subNavCollapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-red-500/10 text-red-500 shadow-sm"
                      : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-slate-100"
                  }`}
                  title={subNavCollapsed ? item.label : undefined}
                  id={`yt-nav-${item.key}`}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-red-400" : ""}`} />
                  {!subNavCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <ConfirmDisconnectModal 
          isOpen={showDisconnectModal} 
          onClose={() => setShowDisconnectModal(false)} 
          onConfirm={() => {
            setShowDisconnectModal(false);
            handleRevoke();
          }} 
        />
        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 border-b border-white/10 bg-background/80 backdrop-blur-md px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                <Youtube className="h-4.5 w-4.5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  {SUB_NAV_ITEMS.find((i) => i.key === activePage)?.label || "Overview"}
                </h2>
                <p className="text-xs text-slate-400">
                  {username ? `Channel: ${username}` : "YouTube Analytics"}
                </p>
              </div>
            </div>
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
                className="text-xs text-slate-400 border-white/10 bg-white/5 hover:bg-white/10 hover:text-slate-100 h-9 px-3"
                id="yt-refresh-btn-new"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${analyticsLoading ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDisconnectModal(true)}
                disabled={revokeLoading}
                className="text-xs text-slate-400 hover:text-red-400 h-9"
                id="revoke-youtube-btn"
              >
                {revokeLoading ? "Revoking..." : "Disconnect"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Active Page Content ──────────────────────────────────────── */}
        <div className="p-6">
          {renderActivePage()}
        </div>
      </div>
    </div>
  );
}
