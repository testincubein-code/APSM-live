import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Linkedin } from "@/components/icons/BrandIcons";
import { Button } from "@/components/ui/button";
import {
  BarChart3, FileText, Users, Heart, TrendingUp, Download, Settings, HelpCircle,
  PanelLeftClose, PanelLeft, Menu, X, RefreshCw, AlertCircle, Loader2, ChevronRight, ChevronLeft
} from "lucide-react";
import ConnectCard from "@/components/ConnectCard";
import linkedinApi from "@/services/linkedinApi";
import DateRangePicker from "@/components/DateRangePicker";

// ── LinkedIn Brand Accent ─────────────────────────────────────────────────────
const LINKEDIN_BLUE = "#0A66C2";

// ── Sidebar navigation items (main) ──────────────────────────────────────────
const LI_NAV_ITEMS = [
  { path: "/dashboard/linkedin", label: "Overview", icon: BarChart3, end: true },
  { path: "/dashboard/linkedin/content", label: "Content Performance", icon: FileText },
  { path: "/dashboard/linkedin/audience", label: "Audience Demographics", icon: Users },
  { path: "/dashboard/linkedin/engagement", label: "Engagement Deep-Dive", icon: Heart },
  { path: "/dashboard/linkedin/growth", label: "Follower Growth", icon: TrendingUp },
  { path: "/dashboard/linkedin/reports", label: "Reports & Exports", icon: Download },
];

// ── Sidebar bottom-pinned items ──────────────────────────────────────────────
const LI_NAV_BOTTOM = [
  { path: "/dashboard/linkedin/settings", label: "Settings", icon: Settings },
  { path: "/dashboard/linkedin/help", label: "Help & FAQ", icon: HelpCircle },
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
            ? 'bg-[#0A66C2]/10 text-[#0A66C2] shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`
      }
      title={isCollapsed ? label : undefined}
    >
      <Icon className="w-4.5 h-4.5 shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
};

export default function LinkedInLayout() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Default to Last 7 Days
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const defaultStart = d.toISOString().split('T')[0];
  const defaultEnd = new Date().toISOString().split('T')[0];
  
  const [dateRange, setDateRange] = useState({ start: defaultStart, end: defaultEnd });
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const fetchData = async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    if (isRefresh) {
      setAnalyticsData(null);
    }
    try {
      const statusRes = await linkedinApi.getAuthStatus();
      const statusArray = Array.isArray(statusRes) ? statusRes : (statusRes?.data || statusRes?.status || statusRes?.connections || []);
      const lnStatus = statusArray.find((p) => String(p.platform).toLowerCase() === "linkedin");

      setIsConnected(!!lnStatus?.connected);
      setUsername(lnStatus?.username || "");

      if (lnStatus?.connected) {
        const analyticsRes = await linkedinApi.getLinkedInAnalytics(dateRange);
        const dataArray = Array.isArray(analyticsRes?.data) ? analyticsRes.data : [];
        setAnalyticsData(dataArray[0] || null);
      } else {
        setAnalyticsData(null);
      }
    } catch (err) {
      console.error("Error fetching LinkedIn data:", err);
      setError("Failed to load LinkedIn analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleConnect = () => {
    const token = localStorage.getItem("incubein_token");
    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5000";
    localStorage.setItem("returnPath", window.location.pathname);
    window.location.href = `${baseUrl}/auth/linkedin?token=${token}`;
  };

  const handleRevoke = async () => {
    try {
      await linkedinApi.revokeLinkedIn();
      setIsConnected(false);
      setUsername("");
      fetchData(); 
    } catch (err) {
      console.error("Error revoking LinkedIn access:", err);
    }
  };

  const closeMobile = () => setIsMobileOpen(false);

  // ── Render States ──────────────────────────────────────────────────
  const renderLoading = () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-[#0A66C2]" />
      <p className="text-muted-foreground animate-pulse">Fetching LinkedIn Analytics...</p>
    </div>
  );

  const renderError = () => (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-red-500/30 rounded-xl p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4 mx-auto" />
        <h3 className="text-lg font-bold text-white mb-2">Data Load Failed</h3>
        <p className="text-sm text-gray-400 mb-6">{error}</p>
        <Button onClick={fetchData} variant="outline" className="border-white/10 text-white hover:bg-white/10">
          Try Again
        </Button>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <ConnectCard
        icon={<Linkedin className="h-8 w-8 text-[#0A66C2]" />}
        cardTitle="Connect LinkedIn Profile"
        cardDescription="Connect your LinkedIn account to view followers, post impressions, engagement rates, and detailed demographic metrics."
        onConnect={handleConnect}
        buttonText="Connect LinkedIn Account"
        brandBgClass="bg-[#0A66C2]/10"
        brandTextClass="text-[#0A66C2]"
        brandButtonClass="bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white font-semibold shadow-md shadow-[#0A66C2]/10"
      />
    </div>
  );

  // ── Loading state (checking connection) ───────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background text-white relative overflow-hidden">
        {/* ── Background Gradient Orbs ──────────────────────────────────── */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="relative w-12 h-12 z-10">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-[#0A66C2]/20 rounded-full" />
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-[#0A66C2] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background -m-6 text-white p-6 relative overflow-hidden">
        {/* ── Background Gradient Orbs ──────────────────────────────────── */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="z-10 relative">
          <ConnectCard
          icon={<Linkedin className="h-8 w-8 text-[#0A66C2]" />}
          cardTitle="Connect LinkedIn Profile"
          cardDescription="Connect your LinkedIn account to view followers, post impressions, engagement rates, and detailed demographic metrics."
          onConnect={handleConnect}
          buttonText="Connect LinkedIn Account"
          brandBgClass="bg-[#0A66C2]/10"
          brandTextClass="text-[#0A66C2]"
          brandButtonClass="bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white font-semibold shadow-md shadow-[#0A66C2]/10"
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

      {/* ── LinkedIn Sidebar Shell ────────────────────────────────────────── */}
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
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end p-4 border-b border-white/5">
          <button onClick={closeMobile} className="text-gray-400 hover:text-[#0A66C2] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Brand Header */}
        <div className={`border-b border-white/10 p-3 ${isCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0A66C2]/10">
              <Linkedin className="h-4 w-4 text-[#0A66C2]" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 hidden lg:block">
                <p className="text-xs font-semibold truncate text-white">LinkedIn</p>
                <p className="text-[10px] text-gray-400 truncate">
                  {loading ? "Loading..." : username || (isConnected ? "Connected" : "Not Connected")}
                </p>
              </div>
            )}
            <div className="min-w-0 flex-1 lg:hidden">
              <p className="text-xs font-semibold truncate text-white">LinkedIn</p>
              <p className="text-[10px] text-gray-400 truncate">
                {loading ? "Loading..." : username || (isConnected ? "Connected" : "Not Connected")}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="hidden lg:block p-2 border-b border-white/10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
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

        {/* Navigation Links */}
        <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-y-auto">
          {isConnected && LI_NAV_ITEMS.map((item) => (
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

        {/* Bottom Pinned Links */}
        <div className="py-2 px-1.5 border-t border-white/5 space-y-0.5 mt-auto">
          {LI_NAV_BOTTOM.map((item) => (
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

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden flex items-center p-4 border-b border-white/10 bg-background/80 backdrop-blur-md relative z-10">
          <button onClick={() => setIsMobileOpen(true)} className="text-gray-400 hover:text-[#0A66C2] transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-4 font-semibold text-white">LinkedIn Dashboard</span>
        </div>

        {/* Top Controls Bar (Header controls and Date Range) */}
        {isConnected && !loading && !error && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 bg-background/60 px-6 py-4">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                LinkedIn Insights
              </h1>
              <p className="text-xs text-gray-400">Professional B2B Network Analytics</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <DateRangePicker 
                startDate={dateRange.start} 
                endDate={dateRange.end} 
                onChange={setDateRange} 
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="text-xs text-slate-400 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white h-9 px-3"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
            </div>
          </div>
        )}

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto relative z-10">
          {loading ? (
            renderLoading()
          ) : error ? (
            renderError()
          ) : !isConnected ? (
            renderEmptyState()
          ) : (
            <Outlet
              context={{
                analyticsData,
                loading,
                username,
                isConnected,
                handleRevoke,
                fetchData
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
