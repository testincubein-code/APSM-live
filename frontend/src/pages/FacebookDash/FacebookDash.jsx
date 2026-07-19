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

import { useState, useEffect, useCallback } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import fbapi from "@/services/fbapi";
import DateRangePicker from "@/components/DateRangePicker";
import {
  Users, Eye, Heart, ThumbsUp, MessageCircle, Share2,
  RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  MoreVertical, Video,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

// ── Facebook brand constants ──────────────────────────────────────────────────
const FB_BLUE    = "#1877F2";
const PIE_COLORS = ["#1877F2", "#10b981", "#8b5cf6", "#f59e0b"];

// ── Tooltip glassmorphism style (strict spec) ─────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: "rgba(22, 27, 34, 0.85)",
  backdropFilter:  "blur(12px)",
  borderColor:     "rgba(255,255,255,0.1)",
  color:           "#fff",
  borderRadius:    "8px",
  border:          "1px solid rgba(255,255,255,0.1)",
};

// ── Number formatter (compact notation) ──────────────────────────────────────
const formatNumber = (n) => {
  if (n === undefined || n === null) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact", compactDisplay: "short", maximumFractionDigits: 1,
  }).format(n);
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
const KpiCard = ({ label, value, change, icon: Icon, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-7 w-7 rounded-full bg-gray-700/50" />
          <Skeleton className="h-3 w-20 bg-gray-700/50" />
        </div>
        <Skeleton className="h-7 w-24 bg-gray-700/50 mt-1" />
        <Skeleton className="h-3 w-32 bg-gray-700/50 mt-2" />
      </Card>
    );
  }
  const isPositive = (change ?? 0) >= 0;
  return (
    <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 p-4 hover:border-white/10 transition-all group">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-[#1877F2]/10 text-[#1877F2] p-2 rounded-full group-hover:bg-[#1877F2]/20 transition-colors">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{label}</span>
        </div>
        <div className="text-2xl font-bold text-white mt-1">
          {formatNumber(value)}
        </div>
        <div className={`text-xs font-medium flex items-center gap-0.5 mt-1 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {isPositive ? "+" : ""}{change}%
          <span className="text-gray-500 font-normal ml-1">vs previous 7 days</span>
        </div>
      </CardContent>
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
  const kpis = [
    { label: "Page Likes",       value: data?.kpis?.pageLikes?.value,       change: data?.kpis?.pageLikes?.change,       icon: ThumbsUp       },
    { label: "Post Reach",       value: data?.kpis?.postReach?.value,       change: data?.kpis?.postReach?.change,       icon: Eye            },
    { label: "Post Engagements", value: data?.kpis?.postEngagements?.value, change: data?.kpis?.postEngagements?.change, icon: Heart          },
    { label: "Reactions",        value: data?.kpis?.reactions?.value,       change: data?.kpis?.reactions?.change,       icon: TrendingUp     },
    { label: "Comments",         value: data?.kpis?.comments?.value,        change: data?.kpis?.comments?.change,        icon: MessageCircle  },
    { label: "Shares",           value: data?.kpis?.shares?.value,          change: data?.kpis?.shares?.change,          icon: Share2         },
  ];

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
                  { label: "Followers",  value: profile.followers  },
                  { label: "Reach",      value: profile.reach      },
                  { label: "Posts",      value: profile.totalPosts },
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
      {/* ROW 2 — 6-Column KPI Grid                                       */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={i} {...kpi} isLoading={isLoading} />
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
          <CardContent className="h-[260px]">
            {isLoading || !data ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.charts?.reachOverTime} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fbReachGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={FB_BLUE} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={FB_BLUE} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                  <Tooltip content={<GlassTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
                  <Area type="monotone" dataKey="value" name="Reach" stroke={FB_BLUE} strokeWidth={2} fillOpacity={1} fill="url(#fbReachGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
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
          <CardContent className="h-[260px]">
            {isLoading || !data ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts?.engagementsOverTime} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                  <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="value" name="Engagements" fill={FB_BLUE} radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ── Col 3: Engagement Rate (KPI stack + mini LineChart) ─────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Engagement Rate</CardTitle>
            {/* Stacked KPI value above mini chart */}
            {!isLoading && data && (
              <div className="mt-2">
                <p className="text-3xl font-bold text-white">{data.charts?.engagementRate?.rate}</p>
                <div className="flex items-center gap-1 mt-1 text-emerald-400 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  +{data.charts?.engagementRate?.change}%
                  <span className="text-gray-500 font-normal ml-1">vs previous period</span>
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
          <CardContent className="h-[140px]">
            {isLoading || !data ? (
              <ChartSkeleton height="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.charts?.engagementRate?.data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<GlassTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
                  <Line type="monotone" dataKey="rate" name="Rate" stroke={FB_BLUE} strokeWidth={2} dot={{ r: 3, fill: FB_BLUE, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ROW 4 — Tables & Demographics (3 columns)                       */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Col 1: Top Posts Table ─────────────────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Top Posts</CardTitle>
              <Link to="/dashboard/facebook/content" className="text-[10px] text-[#1877F2] hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading || !data ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full bg-gray-700/30 rounded-lg" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-2.5 text-left text-gray-500 font-medium uppercase tracking-wider">Post</th>
                      <th className="px-3 py-2.5 text-right text-gray-500 font-medium uppercase tracking-wider">Reach</th>
                      <th className="px-3 py-2.5 text-right text-gray-500 font-medium uppercase tracking-wider">Eng.</th>
                      <th className="px-3 py-2.5 text-right text-gray-500 font-medium uppercase tracking-wider">Likes</th>
                      <th className="px-3 py-2.5 text-right text-gray-500 font-medium uppercase tracking-wider">Cmts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {(data.tables?.topPosts || []).map((post, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <img src={post.image} alt="" className="h-9 w-9 rounded object-cover flex-shrink-0" />
                            <p className="text-[11px] text-gray-200 truncate max-w-[120px]">{post.title}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-gray-300">{formatNumber(post.reach)}</td>
                        <td className="px-3 py-3 text-right text-[#1877F2] font-medium">{post.rate}</td>
                        <td className="px-3 py-3 text-right text-gray-300">{formatNumber(post.likes)}</td>
                        <td className="px-3 py-3 text-right text-gray-300">{post.comments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!data.tables?.topPosts?.length) && (
                  <p className="text-center text-gray-500 text-xs py-6">No posts in this date range</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Col 2: Top Videos Table ───────────────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Top Videos</CardTitle>
              <Link to="/dashboard/facebook/videos" className="text-[10px] text-[#1877F2] hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading || !data ? (
              <div className="space-y-3 p-4">
                {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full bg-gray-700/30 rounded-lg" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-2.5 text-left text-gray-500 font-medium uppercase tracking-wider">Video</th>
                      <th className="px-3 py-2.5 text-right text-gray-500 font-medium uppercase tracking-wider">Views</th>
                      <th className="px-3 py-2.5 text-right text-gray-500 font-medium uppercase tracking-wider">Eng.</th>
                      <th className="px-3 py-2.5 text-right text-gray-500 font-medium uppercase tracking-wider">Watch Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {(data.tables?.topVideos || []).map((vid, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative h-9 w-14 rounded overflow-hidden flex-shrink-0">
                              <img src={vid.image} alt="" className="h-full w-full object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Video className="h-3 w-3 text-white" />
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-200 truncate max-w-[100px]">{vid.title}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-gray-300">{formatNumber(vid.plays)}</td>
                        <td className="px-3 py-3 text-right text-[#1877F2] font-medium">{vid.rate}</td>
                        <td className="px-3 py-3 text-right text-gray-300">{vid.watchTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!data.tables?.topVideos?.length) && (
                  <p className="text-center text-gray-500 text-xs py-6">No videos in this date range</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Col 3: Stacked Cards — Reach by Source + Audience Summary ─ */}
        <div className="space-y-4">

          {/* Reach by Source Donut */}
          <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Reach by Source</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || !data ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-24 w-24 rounded-full bg-gray-700/30" />
                  <div className="space-y-2 flex-1">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-3 w-full bg-gray-700/30" />)}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.reachBySource} cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" stroke="none">
                          {(data.reachBySource || []).map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<GlassTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {(data.reachBySource || []).map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
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
          <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Audience Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading || !data ? (
                <div className="space-y-2">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-3 w-full bg-gray-700/30" />)}
                </div>
              ) : (
                <>
                  {/* Top Countries progress bars */}
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Top Countries</p>
                    <div className="space-y-2">
                      {(data.audience?.topCountries || []).map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-300 w-20 truncate">{c.country}</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${c.value}%`, background: FB_BLUE }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-400 w-8 text-right">{c.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Age & Gender donut */}
                  <div className="border-t border-white/5 pt-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Age & Gender</p>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={data.audience?.ageGender} cx="50%" cy="50%" innerRadius={18} outerRadius={28} dataKey="value" stroke="none">
                              {(data.audience?.ageGender || []).map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<GlassTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-1.5 flex-1">
                        {(data.audience?.ageGender || []).map((ag, i) => (
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FacebookDash;
