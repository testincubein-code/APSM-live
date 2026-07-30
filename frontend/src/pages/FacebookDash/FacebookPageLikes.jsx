// ── Facebook Page Likes Page ──────────────────────────────────────────────────
// Fetches data independently via fbapi.getPageLikesMetrics() on mount.
// Shows net growth KPIs + follower gained/lost AreaChart + Gained vs Lost BarChart.

import { useState, useEffect, Component } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import fbapi from "@/services/fbapi";
import { KpiCard } from "./MetaSharedComponents";
import { ThumbsUp, TrendingUp, TrendingDown, UserMinus, Activity } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const FB_BLUE = "#1877F2";

// ── Data Sanitizer ────────────────────────────────────────────────────────────
// Eliminates NaN, null, and undefined values before passing to Recharts
const sanitizeChartData = (dataArray) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return [];
  return dataArray.map(item => ({
    ...item,
    followers: isNaN(Number(item.followers)) ? 0 : Number(item.followers),
    gained: isNaN(Number(item.gained)) ? 0 : Number(item.gained),
    unfollows: isNaN(Number(item.unfollows)) ? 0 : Number(item.unfollows),
  }));
};

// ── Safe Formatting & Domain Functions ────────────────────────────────────────
const fmt = (n) => (n == null || isNaN(Number(n))) ? "—" : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(Number(n));

const getSafeDomain = ([dataMin, dataMax]) => {
  const max = (dataMax === null || dataMax === undefined || isNaN(Number(dataMax))) ? 0 : Number(dataMax);
  if (max <= 0) return [0, 5]; // Default domain scale if no data
  return [0, Math.ceil(max * 1.2)]; // Add 20% headroom
};

// ── Empty State Component ─────────────────────────────────────────────────────
const ChartEmptyState = () => (
  <div className="flex h-full w-full flex-col items-center justify-center text-slate-500 text-sm">
    <div className="mb-3 p-3 rounded-full bg-white/5 border border-white/10">
      <Activity className="h-6 w-6 opacity-50" />
    </div>
    <p className="font-medium text-slate-400">No data available</p>
    <p className="text-xs text-slate-500 mt-1">for this date range</p>
  </div>
);

// ── Chart Error Boundary ──────────────────────────────────────────────────────
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

const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161B22]/95 border border-white/10 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((e, i) => <p key={i} style={{ color: e.color }}>{e.name}: <span className="font-bold text-white">{fmt(e.value)}</span></p>)}
    </div>
  );
};

const FacebookPageLikes = () => {
  const { isConnected } = useOutletContext();
  const [data, setData]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]   = useState(null);

  // ── Fetch page likes metrics independently on mount ───────────────────────
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const result = await fbapi.getPageLikesMetrics();
        if (mounted) setData(result);
      } catch (e) {
        if (mounted) setError("Could not load page likes data.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, []);

  if (error) return (
    <div className="p-6 flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-3">
        <TrendingDown className="h-10 w-10 text-red-400 mx-auto" />
        <p className="text-sm text-gray-400">{error}</p>
        <Button onClick={() => window.location.reload()} className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white text-xs">Retry</Button>
      </div>
    </div>
  );

  // ── KPI definitions ────────────────────────────────────────────────────────
  const kpis = [
    { label: "Total Gained",  value: data?.gained, icon: ThumbsUp   },
    { label: "Total Lost",    value: data?.lost,   icon: UserMinus  },
    { label: "Net Growth",    value: data?.net,    icon: TrendingUp },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((k, i) => (
          isLoading ? (
            <Card key={i} className="bg-[#10141D] border border-white/[0.06] rounded-xl p-5 shadow-none transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-3 w-20 bg-gray-700/50" />
                <Skeleton className="h-7 w-7 rounded-md bg-gray-700/50" />
              </div>
              <Skeleton className="h-7 w-24 bg-gray-700/50 mt-1" />
              <Skeleton className="h-4 w-16 bg-gray-700/50 mt-2" />
            </Card>
          ) : (
            <KpiCard 
              key={i} 
              title={k.label} 
              value={fmt(k.value)} 
              icon={k.icon} 
              showActive={true} 
            />
          )
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Follower Growth AreaChart ──────────────────────────────────── */}
        <Card className="bg-[#10141D] rounded-xl border border-white/[0.06] flex flex-col min-h-[460px]">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-sm font-semibold text-white">Follower Growth Timeline</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-4 flex-1 flex flex-col">
            <div className="flex flex-col h-full">
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Total Page Likes</span>
                  <span className="text-sm font-bold text-white">{isLoading ? <Skeleton className="h-4 w-12 bg-gray-700/50" /> : (data?.kpis?.totalLikes ?? 0)}</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Net Period Change</span>
                  <span className="text-sm font-bold text-white">{isLoading ? <Skeleton className="h-4 w-12 bg-gray-700/50" /> : (data?.net ?? 0)}</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Retention</span>
                  <span className="text-sm font-bold text-white">100%</span>
                </div>
              </div>
              
              <div className="flex-1 min-h-[220px]">
                {isLoading ? (
                  <Skeleton className="w-full h-full bg-gray-700/30 rounded-xl" />
                ) : (!data?.followerGrowthTimeline || data.followerGrowthTimeline.length === 0) ? (
                  <ChartEmptyState />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ChartErrorBoundary>
                      <AreaChart 
                        data={sanitizeChartData(data.followerGrowthTimeline)} 
                        margin={{ top: 0, right: 10, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="fbGainGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={8} />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={fmt} 
                          allowDecimals={false} 
                          allowDataOverflow={true}
                          domain={getSafeDomain} 
                        />
                        <Tooltip content={<GlassTooltip />} />
                        <Area type="monotone" dataKey="followers" name="Total Followers" stroke="#3B82F6" strokeWidth={2.5} activeDot={{ r: 6, strokeWidth: 0, fill: "#3B82F6" }} fillOpacity={1} fill="url(#fbGainGrad)" />
                      </AreaChart>
                    </ChartErrorBoundary>
                  </ResponsiveContainer>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-white/5 text-center">
                <p className="text-[11px] text-slate-400 italic">
                  <span className="font-semibold text-slate-300 not-italic">Baseline Active —</span> No growth activity recorded between Jun 28 and Jul 27
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Gained vs Lost BarChart ───────────────────────────────────── */}
        <Card className="bg-[#10141D] rounded-xl border border-white/[0.06] flex flex-col min-h-[460px]">
          <CardHeader className="p-5 pb-0 flex flex-row items-start justify-between">
            <CardTitle className="text-sm font-semibold text-white">Gained vs. Lost (Daily)</CardTitle>
            <div className="bg-white/5 border border-white/10 text-slate-300 text-[10px] font-semibold px-2.5 py-1 rounded-md">
              Net Balance: {isLoading ? <span className="opacity-0">0</span> : (data?.net ?? 0)}
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-6 flex-1 flex flex-col">
            <div className="flex flex-col h-full">
              <div className="flex-1 min-h-[220px]">
                {isLoading ? (
                  <Skeleton className="w-full h-full bg-gray-700/30 rounded-xl" />
                ) : (!data?.followerGrowthTimeline || data.followerGrowthTimeline.length === 0) ? (
                  <ChartEmptyState />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ChartErrorBoundary>
                      <BarChart 
                        data={sanitizeChartData(data.followerGrowthTimeline)} 
                        margin={{ top: 0, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={8} />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={fmt} 
                          allowDecimals={false}
                          allowDataOverflow={true}
                          domain={getSafeDomain}
                        />
                        <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: "12px", fontSize: "12px", color: "#94a3b8" }} />
                        <Bar dataKey="gained"    name="Gained" fill="#10B981" radius={[4,4,0,0]} maxBarSize={20} background={{ fill: 'rgba(255,255,255,0.02)', radius: [4,4,0,0] }} />
                        <Bar dataKey="unfollows" name="Lost"   fill="#ef4444" radius={[4,4,0,0]} maxBarSize={20} background={{ fill: 'rgba(255,255,255,0.02)', radius: [4,4,0,0] }} />
                      </BarChart>
                    </ChartErrorBoundary>
                  </ResponsiveContainer>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-slate-300 font-medium">Gained: <span className="text-white font-bold">{isLoading ? "-" : (data?.gained ?? 0)}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <span className="text-xs text-slate-300 font-medium">Lost: <span className="text-white font-bold">{isLoading ? "-" : (data?.lost ?? 0)}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-slate-300 font-medium">Net: <span className="text-white font-bold">{isLoading ? "-" : (data?.net ?? 0)}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacebookPageLikes;