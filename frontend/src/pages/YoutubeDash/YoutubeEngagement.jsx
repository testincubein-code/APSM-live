import { useTheme } from "@/context/ThemeContext";
// ── YouTube Engagement Page ─────────────────────────────────────────
// Engagement analytics dashboard showing total engagement metrics,
// engagement trend charts, watch time analysis, and top engaging videos.
// All data parsed from the analytics snapshot via ytapi.js.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  Clock,
  Eye,
  Play,
  TrendingUp,
  Activity,
  Timer,
  Heart,
} from "lucide-react";
import {
  parseCoreMetrics,
  parseDailyAnalytics,
  parseRecentVideos,
  formatCompactNumber,
  formatWatchTime,
  formatRelativeTime,
} from "@/services/ytapi";

// ── Chart colors ────────────────────────────────────────────────────
const COLORS = {
  red: "#ef4444",
  blue: "#3b82f6",
  emerald: "#10b981",
  violet: "#8b5cf6",
  amber: "#f59e0b",
};

// ── Custom tooltip ──────────────────────────────────────────────────
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

// ── Skeleton loading state ──────────────────────────────────────────
function EngagementSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-white/10">
            <CardContent className="p-5">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-7 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="border-white/10">
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-[280px] w-full rounded-lg" /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────
function EmptyEngagement() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center animate-fade-in">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <Activity className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold">Not enough engagement data yet</h3>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          Engagement metrics will populate here as viewers interact with your content.
          Check back after your channel receives more activity.
        </p>
      </div>
    </div>
  );
}

// ── Main Engagement Component ───────────────────────────────────────
export default function YoutubeEngagement({ data, loading }) {
  // ── Loading state ─────────────────────────────────────────────────
  if (loading) return <EngagementSkeleton />;

  // ── Empty state ───────────────────────────────────────────────────
  if (!data) return <EmptyEngagement />;

  // ── Parse data ────────────────────────────────────────────────────
  const metrics = parseCoreMetrics(data);
  const dailyData = parseDailyAnalytics(data);
  const recentVideos = parseRecentVideos(data);

  // ── Compute aggregate engagement from daily data ──────────────────
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalAvgDuration = 0;

  for (const day of dailyData) {
    totalLikes += day.likes || 0;
    totalComments += day.comments || 0;
    totalShares += day.shares || 0;
    totalAvgDuration += day.avgViewDuration || 0;
  }

  const avgViewDuration = dailyData.length > 0 ? Math.round(totalAvgDuration / dailyData.length) : 0;

  // ── Format average duration to mm:ss ──────────────────────────────
  const formatSeconds = (s) => {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // ── Sort videos by engagement (likes + comments) ──────────────────
  const topEngagingVideos = [...recentVideos]
    .sort((a, b) => (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount))
    .slice(0, 5);

  // ── Engagement KPI cards ──────────────────────────────────────────
  const engagementKPIs = [
    {
      title: "Total Engagement",
      value: formatCompactNumber(metrics.totalEngagement),
      icon: Heart,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      title: "Watch Time",
      value: formatWatchTime(metrics.watchTimeMinutes),
      icon: Clock,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Avg View Duration",
      value: formatSeconds(avgViewDuration),
      icon: Timer,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      title: "Engagement Rate",
      value: `${metrics.engagementRate}%`,
      icon: Activity,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  // ── Secondary metric pills ────────────────────────────────────────
  const secondaryMetrics = [
    { title: "Likes", value: formatCompactNumber(totalLikes), icon: ThumbsUp, color: "text-blue-400" },
    { title: "Comments", value: formatCompactNumber(totalComments), icon: MessageSquare, color: "text-amber-400" },
    { title: "Shares", value: formatCompactNumber(totalShares), icon: Share2, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Primary KPI Cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {engagementKPIs.map((kpi) => (
          <Card
            key={kpi.title}
            className="border-white/10 bg-white/5 backdrop-blur-lg shadow-sm shadow-none hover:shadow-lg hover:shadow-black/5 transition-all duration-300 group"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {kpi.title}
                  </p>
                  <p className="mt-1.5 text-2xl font-bold tracking-tight">{kpi.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Secondary Metrics Row ─────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-3">
        {secondaryMetrics.map((m) => (
          <Card key={m.title} className="border-white/10 bg-white/5 backdrop-blur-lg shadow-sm shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <div>
                  <p className="text-xs text-slate-400">{m.title}</p>
                  <p className="text-lg font-bold">{m.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Engagement Trends Chart ───────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement Trend (Likes + Comments + Shares over time) */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg shadow-sm shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Engagement Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b" tickLine={false} axisLine={false} dy={8}
                    fontSize={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: "12px", fontSize: "12px", color: "#94a3b8" }} />
                  <Line type="monotone" dataKey="likes" name="Likes" stroke="#3B82F6" strokeWidth={2.5} activeDot={{ r: 6, strokeWidth: 0, fill: "#3B82F6" }} dot={false} />
                  <Line type="monotone" dataKey="comments" name="Comments" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6, strokeWidth: 0, fill: "#f59e0b" }} dot={false} />
                  <Line type="monotone" dataKey="shares" name="Shares" stroke="#10B981" strokeWidth={2.5} activeDot={{ r: 6, strokeWidth: 0, fill: "#10B981" }} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                No engagement trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Watch Time / Avg Duration Chart */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg shadow-sm shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              Watch Time Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="watchGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b" tickLine={false} axisLine={false} dy={8}
                    fontSize={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Area
                    type="monotone"
                    dataKey="watchTime"
                    name="Watch Time (min)"
                    stroke="#f59e0b"
                    fill="url(#watchGradient)"
                    strokeWidth={2.5}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#f59e0b" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                No watch time data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Engaging Videos ───────────────────────────────────────── */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-lg shadow-sm shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-400" />
            Top Engaging Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topEngagingVideos.length > 0 ? (
            <div className="space-y-3">
              {topEngagingVideos.map((video, i) => (
                <div
                  key={video.id}
                  className="flex items-center gap-4 rounded-lg p-3 hover:bg-accent/30 transition-colors duration-200 group"
                >
                  {/* Rank badge */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-xs font-bold text-slate-400">
                    {i + 1}
                  </div>
                  {/* Thumbnail */}
                  {video.thumbnail ? (
                    <div className="relative shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="h-12 w-20 rounded-md object-cover ring-1 ring-border/20"
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Play className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3 text-blue-400" />
                        {formatCompactNumber(video.likeCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-amber-400" />
                        {formatCompactNumber(video.commentCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatCompactNumber(video.viewCount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              No video engagement data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
