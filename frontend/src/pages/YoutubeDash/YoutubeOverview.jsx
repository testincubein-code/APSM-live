// ── YouTube Overview Page ───────────────────────────────────────────
// Main overview dashboard showing channel KPIs, daily analytics charts,
// recent videos, traffic sources, device breakdown, and audience preview.
// Receives parsed analytics data as props from the parent layout shell.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Users,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Smartphone,
  Play,
  ThumbsUp,
  MessageSquare,
  Activity,
} from "lucide-react";
import { Youtube } from "@/components/icons/BrandIcons";
import {
  parseCoreMetrics,
  parseChannelInfo,
  parseDailyAnalytics,
  parseRecentVideos,
  parseCountryData,
  parseDeviceData,
  parseAgeGenderData,
  parseSubscriberGrowth,
  formatCompactNumber,
  formatWatchTime,
  formatRelativeTime,
} from "@/services/ytapi";

// ── Chart color palette ─────────────────────────────────────────────
const COLORS = {
  red: "#ef4444",
  redFill: "#ef444420",
  blue: "#3b82f6",
  blueFill: "#3b82f620",
  emerald: "#10b981",
  emeraldFill: "#10b98120",
  violet: "#8b5cf6",
  violetFill: "#8b5cf620",
  amber: "#f59e0b",
  amberFill: "#f59e0b20",
  cyan: "#06b6d4",
  pink: "#ec4899",
};

// ── Donut chart palette for device breakdown ────────────────────────
const DEVICE_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];

// ── Custom Chart Tooltip ────────────────────────────────────────────
// Dark-themed tooltip that matches the dashboard aesthetic.
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161B22]/95 border border-white/10 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {formatCompactNumber(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ── Skeleton Loading State ──────────────────────────────────────────
// Full-page skeleton placeholder while data is being fetched.
function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-24" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
              <Skeleton className="mt-3 h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="border-white/10">
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-[280px] w-full rounded-lg" /></CardContent>
          </Card>
        ))}
      </div>
      {/* Videos skeleton */}
      <Card className="border-white/10">
        <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-16 w-28 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Empty State Component ───────────────────────────────────────────
// Shown when analytics data is unavailable or insufficient.
function EmptyOverview() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center animate-fade-in">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF0000]/10">
          <BarChart3 className="h-8 w-8 text-[#FF0000]" />
        </div>
        <h3 className="text-lg font-semibold">Not enough data available yet</h3>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          Your YouTube analytics will appear here once we have enough data to display.
          This usually takes a few hours after connecting your channel.
        </p>
      </div>
    </div>
  );
}

// ── Reusable KPI Card ───────────────────────────────────────────────
function KpiCard({ title, value, icon: Icon, trend }) {
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
      {trend ? (
        <div className="flex items-center gap-1 text-xs font-medium text-[#10B981]">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Active</span>
        </div>
      ) : (
        <div className="h-4" />
      )}
    </Card>
  );
}

// ── Main Overview Component ─────────────────────────────────────────
export default function YoutubeOverview({ data, loading }) {
  // ── Loading state ─────────────────────────────────────────────────
  if (loading) return <OverviewSkeleton />;

  // ── Empty state ───────────────────────────────────────────────────
  if (!data) return <EmptyOverview />;

  // ── Parse all data sections ───────────────────────────────────────
  const channel = parseChannelInfo(data);
  const metrics = parseCoreMetrics(data);
  const dailyData = parseDailyAnalytics(data);
  const recentVideos = parseRecentVideos(data);
  const countryData = parseCountryData(data).slice(0, 8);
  const deviceData = parseDeviceData(data);
  const { age: ageData, gender: genderData } = parseAgeGenderData(data);
  const subGrowth = parseSubscriberGrowth(data);

  // ── KPI card definitions ──────────────────────────────────────────
  const kpiCards = [
    {
      title: "Subscribers",
      value: formatCompactNumber(metrics.subscribers),
      icon: Users,
      color: "text-red-400",
      bg: "bg-red-500/10",
      trend: metrics.subscribers > 0,
    },
    {
      title: "Total Views",
      value: formatCompactNumber(metrics.totalViews),
      icon: Eye,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      trend: metrics.totalViews > 0,
    },
    {
      title: "Watch Time",
      value: formatWatchTime(metrics.watchTimeMinutes),
      icon: Clock,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      trend: metrics.watchTimeMinutes > 0,
    },
    {
      title: "Engagement Rate",
      value: `${metrics.engagementRate}%`,
      icon: Activity,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      trend: metrics.engagementRate > 0,
    },
  ];

  // ── Second row KPI cards ──────────────────────────────────────────
  const secondaryKPIs = [
    {
      title: "Impressions",
      value: formatCompactNumber(metrics.impressions),
      icon: Eye,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      title: "Reach",
      value: formatCompactNumber(metrics.reach),
      icon: Globe,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      title: "Videos",
      value: formatCompactNumber(metrics.videoCount),
      icon: Youtube,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      title: "Total Engagement",
      value: formatCompactNumber(metrics.totalEngagement),
      icon: ThumbsUp,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Channel Info Card ─────────────────────────────────────────── */}
      {channel && (
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {/* Channel thumbnail */}
              {channel.thumbnail ? (
                <img
                  src={channel.thumbnail}
                  alt={channel.title}
                  className="h-14 w-14 rounded-full ring-2 ring-[#FF0000]/30 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF0000]/10">
                  <Youtube className="h-7 w-7 text-[#FF0000]" />
                </div>
              )}
              {/* Channel details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold truncate text-white">{channel.title}</h3>
                {channel.customUrl && (
                  <p className="text-sm text-gray-400">{channel.customUrl}</p>
                )}
                {channel.description && (
                  <p className="mt-1 text-xs text-gray-400 line-clamp-2 max-w-xl">
                    {channel.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Primary KPI Cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* ── Secondary KPI Cards ───────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {secondaryKPIs.map((kpi) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* ── Charts Row: Daily Views + Subscriber Growth ───────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Views Area Chart */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-400" />
              Daily Views (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b" tickLine={false} axisLine={false}
                    fontSize={10} dy={8}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#64748b" tickLine={false} axisLine={false}
                    fontSize={10}
                    tickFormatter={formatCompactNumber}
                    allowDecimals={false}
                    domain={([dataMin, dataMax]) => [0, isNaN(dataMax) || !isFinite(dataMax) || dataMax === 0 ? 2 : Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Views"
                    stroke="#3B82F6"
                    fill="url(#viewsGradient)"
                    strokeWidth={2.5}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#3B82F6" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                No daily view data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscriber Growth Bar Chart */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              Subscriber Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={subGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b" tickLine={false} axisLine={false} dy={8}
                    fontSize={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#64748b" tickLine={false} axisLine={false}
                    fontSize={10}
                    allowDecimals={false}
                    domain={([dataMin, dataMax]) => [0, isNaN(dataMax) || !isFinite(dataMax) || dataMax === 0 ? 2 : Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: "12px", fontSize: "12px", color: "#94a3b8" }} />
                  <Bar dataKey="gained" name="Gained" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="lost" name="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                No subscriber growth data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Recent Videos ─────────────────────────────────────────── */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-lg shadow-sm shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Play className="h-4 w-4 text-red-400" />
            Recent Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentVideos.length > 0 ? (
            <div className="space-y-3">
              {recentVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-4 rounded-lg p-3 hover:bg-accent/50 transition-colors duration-200 group"
                >
                  {/* Thumbnail */}
                  {video.thumbnail ? (
                    <div className="relative shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="h-16 w-28 rounded-lg object-cover ring-1 ring-border/30"
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Play className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                  {/* Video info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{video.title}</h4>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatCompactNumber(video.viewCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {formatCompactNumber(video.likeCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {formatCompactNumber(video.commentCount)}
                      </span>
                      <span className="hidden sm:inline">
                        {formatRelativeTime(video.publishedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              No recent videos found
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Traffic Sources + Device Breakdown ────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Countries Bar Chart */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-400" />
              Traffic Sources (By Country)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={countryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748b" tickLine={false} axisLine={false}
                    fontSize={10}
                    tickFormatter={formatCompactNumber}
                  />
                  <YAxis
                    type="category"
                    dataKey="country"
                    stroke="#64748b" tickLine={false} axisLine={false}
                    fontSize={11}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="views" name="Views" fill="#06b6d4" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                No geographic data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown Donut Chart */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-violet-400" />
              Device Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="views"
                    nameKey="device"
                  >
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                No device data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Audience Demographics Preview ─────────────────────────────── */}
      {(ageData.length > 0 || genderData.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Age Distribution */}
          {ageData.length > 0 && (
            <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-400" />
                  Age Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="group" stroke="#64748b" tickLine={false} axisLine={false} dy={8} fontSize={11} />
                    <YAxis 
                      stroke="#64748b" 
                      tickLine={false} 
                      axisLine={false} 
                      fontSize={10} 
                      tickFormatter={formatCompactNumber} 
                      allowDecimals={false}
                      domain={([dataMin, dataMax]) => [0, isNaN(dataMax) || !isFinite(dataMax) || dataMax === 0 ? 2 : Math.ceil(dataMax * 1.2)]}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="count" name="Viewers" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Gender Distribution */}
          {genderData.length > 0 && (
            <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-pink-400" />
                  Gender Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="label"
                    >
                      {genderData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={[COLORS.blue, COLORS.pink, COLORS.violet][i % 3]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
