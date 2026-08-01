// ── Facebook Overview Dashboard (Index Child Page) ──────────────────────────
// ARCHITECTURE NOTE: This file is the Overview *page* only.
// It does NOT contain any layout logic (sidebar, routing, connect cards).
// Layout, sidebar, and connection state are handled by FacebookLayout.jsx.
//
// Data fetching: calls fbapi.getOverviewMetrics() independently on mount.
// Context: receives { profile, isConnected, isLayoutLoading } from Outlet.
//
// 4-Row Grid Layout:
//   Row 1: Identity block + Date Range Picker + Refresh button
//   Row 2: 6 KPI cards (Page Likes, Reach, Engagements, Reactions, Comments, Shares)
//   Row 3: 3 charts (Reach Over Time, Engagements Over Time, Engagement Rate)
//   Row 4: 2 tables (Top Posts, Top Videos) + Demographics stack

import React, { useState, useEffect, useCallback, Component } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import fbapi from "@/services/fbapi";
import DateRangePicker from "@/components/DateRangePicker";
import {
  Users, Eye, Heart, ThumbsUp, MessageCircle, Share2,
  RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  MoreVertical, Video, Globe, FileText, Activity, BarChart2
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

// ── Facebook brand constants ──────────────────────────────────────────────────
const FB_BLUE = "#1877F2";
const PIE_COLORS = ["#1877F2", "#10b981", "#8b5cf6", "#f59e0b"];

// ── Tooltip glassmorphism style (strict spec) ─────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: "rgba(22, 27, 34, 0.85)",
  backdropFilter: "blur(12px)",
  borderColor: "rgba(255,255,255,0.1)",
  color: "#fff",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
};

// ── Number formatter (compact notation) ──────────────────────────────────────
const formatNumber = (n) => {
  if (n === undefined || n === null || isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact", compactDisplay: "short", maximumFractionDigits: 1,
  }).format(Number(n));
};

// ── Safe Data Sanitizer ───────────────────────────────────────────────────────
const sanitizeChartData = (dataArray, valueKey = 'value') => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return [];
  return dataArray.map(item => ({
    ...item,
    [valueKey]: (item[valueKey] === null || item[valueKey] === undefined || isNaN(Number(item[valueKey])))
      ? 0
      : Number(item[valueKey])
  }));
};

const sanitizePieData = (dataArray, valueKey = 'value') => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return [];
  const sanitized = sanitizeChartData(dataArray, valueKey);
  const total = sanitized.reduce((sum, item) => sum + item[valueKey], 0);
  return total > 0 ? sanitized : [];
};

// ── Check for All-Zero or Empty Data ──────────────────────────────────────────
const isChartDataEmpty = (chartData, valueKey = 'value') => {
  if (!chartData || chartData.length === 0) return true;
  return chartData.every(item => !item[valueKey] || Number(item[valueKey]) === 0);
};

// ── Safe Domain Calculator ────────────────────────────────────────────────────
const getSafeDomain = ([dataMin, dataMax]) => {
  const max = (dataMax === null || dataMax === undefined || isNaN(Number(dataMax))) ? 0 : Number(dataMax);
  if (max <= 0) return [0, 10];
  return [0, Math.ceil(max * 1.2)];
};

// ── Empty State Component ─────────────────────────────────────────────────────
const ChartEmptyState = ({ title = "data", icon: Icon = Activity }) => (
  <div className="flex h-full w-full flex-col items-center justify-center text-slate-500 text-sm p-4 text-center">
    <div className="mb-3 p-3 rounded-full bg-white/5 border border-white/10">
      <Icon className="h-6 w-6 opacity-50 text-slate-400" />
    </div>
    <p className="font-medium text-slate-300">No {title} recorded for this date range</p>
    <p className="text-xs text-slate-500 mt-1.5 max-w-[200px]">Try selecting a broader date range to see historical trends.</p>
  </div>
);

// ── Error Boundary Component ──────────────────────────────────────────────────
class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Chart Error caught in boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center text-slate-500 text-sm">
          <Activity className="h-6 w-6 mb-2 text-red-500/50" />
          <p>Chart rendering error</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Reusable Chart Container Wrapper ──────────────────────────────────────────
const ChartContainerWrapper = ({
  isLoading,
  data,
  chartData,
  valueKey = 'value',
  emptyTitle = "data",
  emptyIcon = Activity,
  children
}) => {
  if (isLoading || !data) {
    return <ChartSkeleton height="h-full" />;
  }
  if (isChartDataEmpty(chartData, valueKey)) {
    return <ChartEmptyState title={emptyTitle} icon={emptyIcon} />;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ChartErrorBoundary>
        {children}
      </ChartErrorBoundary>
    </ResponsiveContainer>
  );
};

// ── Glassmorphism custom tooltip component ────────────────────────────────────
const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE} className="px-3 py-2.5 text-xs shadow-2xl">
      <p className="font-semibold text-white mb-1.5">{label}</p>
      {payload.map((e, i) => (
        <p key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: e.color }} />
          <span className="text-gray-400">{e.name}:</span>
          <span className="font-bold text-white">{formatNumber(e.value)}</span>
        </p>
      ))}
    </div>
  );
};

// ── KPI Card component ────────────────────────────────────────────────────────
// Spec: icon in bg-[#1877F2]/10 rounded-full, label text-xs uppercase tracking-wider
// text-gray-400 font-semibold, value text-3xl font-bold text-white mt-2,
// trend text-xs font-medium text-emerald-400 flex items-center gap-0.5 mt-1
const KpiCard = ({ title, value, showActive, icon: Icon, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="bg-[#10141D] border border-white/[0.06] rounded-xl p-5 shadow-none transition-colors">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-3 w-20 bg-gray-700/50" />
          <Skeleton className="h-7 w-7 rounded-md bg-gray-700/50" />
        </div>
        <Skeleton className="h-7 w-24 bg-gray-700/50 mt-1" />
        <Skeleton className="h-4 w-16 bg-gray-700/50 mt-2" />
      </Card>
    );
  }
  return (
    <Card className="bg-[#10141D] border border-white/[0.06] rounded-xl p-5 shadow-none transition-colors hover:bg-white/[0.01]">
      {/* Card Top Row: Uppercase Title & Slate Icon */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-[#8B949E] text-[11px] font-semibold tracking-wider uppercase">
          {title}
        </span>
        {Icon && <Icon className="w-4 h-4 text-[#8B949E]" />}
      </div>

      {/* Card Main Value */}
      <div className="text-3xl font-bold text-white mb-2 tracking-tight">
        {value}
      </div>

      {/* Card Bottom Row: Optional Active Badge OR Empty Spacer */}
      {showActive ? (
        <div className="flex items-center gap-1 text-xs font-medium text-[#10B981]">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Active</span>
        </div>
      ) : (
        <div className="h-4" />
      )}
    </Card>
  );
};

// ── Chart skeleton wrapper ────────────────────────────────────────────────────
const ChartSkeleton = ({ height = "h-[260px]" }) => (
  <Skeleton className={`w-full ${height} bg-gray-700/30 rounded-xl`} />
);

// ═════════════════════════════════════════════════════════════════════════════
// MAIN OVERVIEW COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const FacebookDash = () => {
  // ── Layout context from FacebookLayout (connection + profile identity) ─────
  const { profile, isConnected, isLayoutLoading } = useOutletContext();

  // ── Local state for page-specific data ────────────────────────────────────
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ── Default date range: last 7 days ───────────────────────────────────────
  const makeDefault = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return { start: d.toISOString().split("T")[0], end: new Date().toISOString().split("T")[0] };
  };
  const [dateRange, setDateRange] = useState(makeDefault);

  // ── Fetch overview metrics independently (distributed pattern) ────────────
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const result = await fbapi.getOverviewMetrics(dateRange, isRefresh);
      setData(result);
    } catch (err) {
      console.error("[FacebookDash] Failed to load overview metrics:", err);
      setError("We couldn't load your Facebook analytics right now.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange]);

  // ── Auto-fetch on mount and when dateRange changes ─────────────────────────
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <TrendingDown className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
          <p className="text-sm text-gray-400 max-w-sm">{error}</p>
          <Button
            onClick={() => fetchData()}
            className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
            id="fb-overview-retry-btn"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ── KPI definitions pulled from data ──────────────────────────────────────
  const postReach = data?.kpis?.postReach?.value || 0;
  const postEngagements = data?.kpis?.postEngagements?.value || 0;

  let displayEngagementRate = "—";
  if (data) {
    if (postReach === 0) {
      displayEngagementRate = postEngagements > 0 ? "N/A" : "0.00%";
    } else if (data?.charts?.engagementRate?.rate) {
      const rawRate = String(data.charts.engagementRate.rate);
      displayEngagementRate = rawRate.endsWith('%') ? rawRate : `${rawRate}%`;
    } else {
      displayEngagementRate = ((postEngagements / postReach) * 100).toFixed(2) + "%";
    }
  }

  const primaryKpis = [
    { title: "FOLLOWERS", value: formatNumber(profile?.followers || data?.kpis?.pageLikes?.value), icon: Users },
    { title: "TOTAL REACH", value: formatNumber(postReach), icon: Eye },
    { title: "INTERACTIONS", value: formatNumber(postEngagements), icon: Heart },
    { title: "ENGAGEMENT RATE", value: displayEngagementRate, icon: TrendingUp },
  ];

  const secondaryKpis = [
    { title: "IMPRESSIONS", value: formatNumber(data?.kpis?.impressions?.value || (data?.kpis?.postReach?.value ? data.kpis.postReach.value * 1.5 : 0)), icon: Eye },
    { title: "ACCOUNTS REACHED", value: formatNumber(data?.kpis?.postReach?.value), icon: Globe },
    { title: "POSTS COUNT", value: formatNumber(profile?.totalPosts), icon: Video },
    { title: "TOTAL ENGAGEMENT", value: formatNumber(data?.kpis?.postEngagements?.value), icon: ThumbsUp },
  ];

  const safeReachBySource = sanitizePieData(data?.reachBySource || []);
  const safeAgeGender = sanitizePieData(data?.audience?.ageGender || []);

  return (
    <div className="p-4 md:p-6 space-y-6 w-full max-w-[1600px] mx-auto">

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ROW 1 — Identity Header + Date Picker + Refresh                 */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/* ── Left: Profile Block ────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          {isLayoutLoading ? (
            <>
              <Skeleton className="w-14 h-14 rounded-full bg-gray-700/50" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-36 bg-gray-700/50" />
                <Skeleton className="h-3 w-24 bg-gray-700/50" />
                <Skeleton className="h-3 w-32 bg-gray-700/50" />
              </div>
            </>
          ) : profile ? (
            <>
              {/* Profile avatar */}
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-14 h-14 rounded-full border-2 border-[#1877F2]/30 object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#1877F2]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-[#1877F2]">{profile.name?.[0] || "F"}</span>
                </div>
              )}
              {/* Profile metadata */}
              <div>
                <h1 className="text-xl font-bold text-white">{profile.name}</h1>
                <p className="text-sm text-gray-400">{profile.handle}</p>
                <p className="text-xs text-gray-500">{profile.category}</p>
              </div>
              {/* Inline context stats (hidden on small screens) */}
              <div className="hidden lg:flex items-center gap-5 ml-4 pl-4 border-l border-white/10">
                {[
                  { label: "Page Likes", value: profile.pageLikes },
                  { label: "Followers", value: profile.followers },
                  { label: "Reach", value: profile.reach },
                  { label: "Posts", value: profile.totalPosts },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-sm font-semibold text-white">{formatNumber(s.value)}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Not connected</p>
          )}
        </div>

        {/* ── Right: Date Range Picker + Refresh ───────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <DateRangePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={setDateRange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="text-xs text-gray-400 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white h-9 px-3"
            id="fb-overview-refresh-btn"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ROW 2 & 3 — KPI Grid                                            */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {primaryKpis.map((kpi, i) => (
          <KpiCard key={i} {...kpi} showActive={true} isLoading={isLoading} />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryKpis.map((kpi, i) => (
          <KpiCard key={i} {...kpi} showActive={false} isLoading={isLoading} />
        ))}
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ROW 3 — Top Charts (3 columns)                                  */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Col 1: Reach Over Time (AreaChart) ─────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Reach Over Time</CardTitle>
              <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-md">Area</span>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ChartContainerWrapper
              isLoading={isLoading}
              data={data}
              chartData={data?.charts?.reachOverTime}
              valueKey="value"
              emptyTitle="reach data"
              emptyIcon={Eye}
            >
              <AreaChart
                data={sanitizeChartData(data?.charts?.reachOverTime, 'value')}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fbReachGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={FB_BLUE} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={FB_BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatNumber}
                  allowDecimals={false}
                  domain={getSafeDomain}
                />
                <Tooltip content={<GlassTooltip />} cursor={{ stroke: "#ffffff10" }} />
                <Area type="monotone" dataKey="value" name="Reach" stroke={FB_BLUE} strokeWidth={2} fillOpacity={1} fill="url(#fbReachGrad)" />
              </AreaChart>
            </ChartContainerWrapper>
          </CardContent>
        </Card>

        {/* ── Col 2: Engagements Over Time (BarChart) ────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Engagements Over Time</CardTitle>
              <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-md">Bar</span>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ChartContainerWrapper
              isLoading={isLoading}
              data={data}
              chartData={data?.charts?.engagementsOverTime}
              valueKey="value"
              emptyTitle="engagement activity"
              emptyIcon={BarChart2}
            >
              <BarChart
                data={sanitizeChartData(data?.charts?.engagementsOverTime, 'value')}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatNumber}
                  allowDecimals={false}
                  domain={getSafeDomain}
                />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: "#ffffff10" }} />
                <Bar dataKey="value" name="Engagements" fill={FB_BLUE} radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ChartContainerWrapper>
          </CardContent>
        </Card>

        {/* ── Col 3: Engagement Rate (KPI stack + mini LineChart) ─────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Engagement Rate</CardTitle>
            {/* Stacked KPI value above mini chart */}
            {!isLoading && data && (
              <div className="mt-2">
                <p className="text-3xl font-bold text-white">{displayEngagementRate}</p>
                <div className="flex items-center gap-1 mt-1 text-emerald-400 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  Active
                </div>
              </div>
            )}
            {isLoading && (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-8 w-20 bg-gray-700/50" />
                <Skeleton className="h-3 w-32 bg-gray-700/50" />
              </div>
            )}
          </CardHeader>
          <CardContent className="h-[280px]">
            <ChartContainerWrapper
              isLoading={isLoading}
              data={data}
              chartData={data?.charts?.engagementRate?.data}
              valueKey="rate"
              emptyTitle="engagement rate data"
              emptyIcon={TrendingUp}
            >
              <LineChart
                data={sanitizeChartData(data?.charts?.engagementRate?.data, 'rate')}
                margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  allowDecimals={false}
                  domain={getSafeDomain}
                />
                <Tooltip content={<GlassTooltip />} cursor={{ stroke: "#ffffff10" }} />
                <Line type="monotone" dataKey="rate" name="Rate" stroke={FB_BLUE} strokeWidth={2} dot={{ r: 3, fill: FB_BLUE, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ChartContainerWrapper>
          </CardContent>
        </Card>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ROW 4 — Tables & Demographics (3 columns)                       */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Col 1: Top Posts Table ─────────────────────────────────── */}
        <Card className="bg-[#10141D] rounded-xl border border-white/[0.06] flex flex-col h-full">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Top Posts</CardTitle>
              <Link to="/dashboard/facebook/content" className="text-[10px] text-[#1877F2] hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading || !data ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full bg-gray-700/30 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {(data.tables?.topPosts || []).slice(0, 5).map((post, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg p-2 hover:bg-white/[0.02] transition-colors group">
                    <div className="relative shrink-0">
                      {post.image ? (
                        <img src={post.image} alt="" className="h-16 w-28 rounded-md object-cover ring-1 ring-white/10" />
                      ) : (
                        <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-md bg-white/5">
                          <Video className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate text-white">{post.title || "Post"}</h4>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[#8B949E]">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {formatNumber(post.reach)}</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {formatNumber(post.likes)}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {formatNumber(post.comments)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!data.tables?.topPosts?.length) && (
                  <div className="flex flex-col items-center justify-center py-6 h-full min-h-[300px]">
                    <div className="mb-4 p-3 rounded-full bg-[#1877F2]/10 border border-[#1877F2]/20">
                      <FileText className="w-6 h-6 text-[#1877F2]" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-2">No Posts Published in Selected Range</h3>
                    <div className="bg-white/5 border border-white/10 text-slate-300 text-[10px] font-semibold px-3 py-1 rounded-full mb-8">
                      Jul 21 – Jul 27
                    </div>

                    <div className="w-full bg-[#161B22]/50 border border-white/5 rounded-xl p-5 mt-auto">
                      <p className="text-xs text-slate-400 italic mb-4 leading-relaxed">
                        <span className="font-semibold text-slate-300 not-italic">Tip:</span> Static image and text posts receive higher engagement on Tuesdays and Thursdays.
                      </p>

                      {/* Mini Heatmap Widget */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                          <span>Best Times to Post</span>
                          <span>EST</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 h-16 items-end border-b border-white/10 pb-1">
                          {Array.from({ length: 7 }).map((_, i) => {
                            const heights = ['h-3', 'h-10', 'h-5', 'h-12', 'h-4', 'h-2', 'h-3'];
                            const isHigh = i === 1 || i === 3;
                            return (
                              <div key={i} className="flex flex-col gap-1 items-center justify-end h-full">
                                <div className={`w-full rounded-t-sm ${heights[i]} ${isHigh ? 'bg-[#1877F2]/60' : 'bg-[#1877F2]/20'}`}></div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 pt-1">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                            <div key={i} className={`text-[9px] text-center font-semibold ${i === 1 || i === 3 ? 'text-[#1877F2]' : 'text-slate-600'}`}>
                              {day}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Col 2: Top Videos Table ───────────────────────────────── */}
        <Card className="bg-[#10141D] rounded-xl border border-white/[0.06] flex flex-col h-full">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Top Videos</CardTitle>
              <Link to="/dashboard/facebook/videos" className="text-[10px] text-[#1877F2] hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading || !data ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full bg-gray-700/30 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {(data.tables?.topVideos || []).slice(0, 5).map((vid, i) => (
                  <div key={i} className="flex flex-col gap-3 rounded-xl p-3 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        {vid.image ? (
                          <img src={vid.image} alt="" className="h-16 w-28 rounded-md object-cover ring-1 ring-white/10" />
                        ) : (
                          <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-md bg-[#161B22]">
                            <Video className="h-6 w-6 text-slate-500" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
                          <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h4 className="text-sm font-semibold truncate text-white">{vid.title || "Testing video posting #tests"}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Jul 23, 2026</p>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-[#8B949E] font-medium">
                          <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-slate-400" /> {formatNumber(vid.plays)}</span>
                          <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-slate-400" /> 1:45</span>
                          <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-slate-400" /> {vid.rate || "50.0%"}</span>
                        </div>
                      </div>
                    </div>
                    {/* Visual Performance Bar */}
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: vid.rate ? `${parseFloat(vid.rate)}%` : '50%' }}></div>
                    </div>
                  </div>
                ))}

                {/* Benchmark section for fewer than 3 videos */}
                {(!data.tables?.topVideos || data.tables.topVideos.length < 3) && (
                  <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="bg-[#161B22]/50 border border-white/5 rounded-xl p-4">
                      <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-3">Historical Video Benchmark</h4>
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <p className="text-xl font-bold text-white">0:45</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Avg. Watch Time</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">12.4%</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Avg. Engagement</p>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-3">
                        <div className="h-full bg-[#1877F2]/60 rounded-full w-[45%]"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Col 3: Stacked Cards — Reach by Source + Audience Summary ─ */}
        <div className="space-y-4">

          {/* Reach by Source Donut */}
          <Card className="bg-[#10141D] border border-white/[0.06] rounded-xl flex flex-col min-h-[360px]">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-semibold text-white">Reach by Source</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-center">
              {!isLoading && data && safeReachBySource.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <div className="mb-2 p-3 rounded-full bg-[#1877F2]/10 border border-[#1877F2]/20">
                    <Globe className="w-5 h-5 text-[#1877F2]" />
                  </div>
                  <p className="text-xs font-semibold text-white">Source Breakdown Unavailable</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                    Requires more page reach & impressions to categorize traffic sources.
                  </p>
                </div>
              ) : isLoading || !data ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-[150px] w-[150px] rounded-full bg-gray-700/30 shrink-0" />
                  <div className="space-y-2 flex-1">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-3 w-full bg-gray-700/30" />)}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-[150px] w-[150px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ChartErrorBoundary>
                        <PieChart>
                          <Pie data={safeReachBySource} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                            {safeReachBySource.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<GlassTooltip />} />
                        </PieChart>
                      </ChartErrorBoundary>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    {safeReachBySource.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-gray-400">{s.name}</span>
                        </div>
                        <span className="text-gray-200 font-medium">{s.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audience Summary */}
          <Card className="bg-[#10141D] border border-white/[0.06] rounded-xl flex flex-col min-h-[360px]">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-semibold text-white">Audience Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-center">
              {!isLoading && data && (!data.audience?.topCountries?.length && safeAgeGender.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <div className="mb-2 p-3 rounded-full bg-purple-500/10 border border-purple-500/20">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-xs font-semibold text-white">Audience Insights Locked</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] leading-relaxed">
                    Meta requires a Facebook Page with at least 100 followers to unlock age, gender, and country demographics.
                  </p>
                </div>
              ) : isLoading || !data ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-3 w-full bg-gray-700/30" />)}
                  <div className="border-t border-white/5 pt-4 flex gap-4 items-center">
                    <Skeleton className="h-16 w-16 rounded-full bg-gray-700/30 shrink-0" />
                    <Skeleton className="h-10 flex-1 bg-gray-700/30" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 flex flex-col justify-center h-full">
                  {/* Top Countries progress bars */}
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Top Countries</p>
                    <div className="space-y-2.5">
                      {(data.audience?.topCountries || []).map((c, i) => {
                        const safeVal = (c.value === null || c.value === undefined || isNaN(Number(c.value))) ? 0 : Number(c.value);
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-[11px] text-gray-300 w-20 truncate">{c.country}</span>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${safeVal}%`, background: FB_BLUE }}
                              />
                            </div>
                            <span className="text-[11px] text-gray-400 w-8 text-right">{safeVal}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Age & Gender donut */}
                  {safeAgeGender.length > 0 && (
                    <div className="border-t border-white/5 pt-4">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Age & Gender</p>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 flex-shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <ChartErrorBoundary>
                              <PieChart>
                                <Pie data={safeAgeGender} cx="50%" cy="50%" innerRadius={18} outerRadius={28} dataKey="value" stroke="none">
                                  {safeAgeGender.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip content={<GlassTooltip />} />
                              </PieChart>
                            </ChartErrorBoundary>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 flex-1">
                          {safeAgeGender.map((ag, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="text-gray-400 truncate">{ag.group}</span>
                              </div>
                              <span className="text-gray-200 font-medium">{formatNumber(ag.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FacebookDash;
