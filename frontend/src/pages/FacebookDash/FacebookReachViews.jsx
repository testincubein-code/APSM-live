// ── Facebook Reach & Views Page ───────────────────────────────────────────────
// Fetches data independently via fbapi.getReachViewsMetrics() on mount.
// Shows 3 KPI cards, stacked reach BarChart, 3s vs 1m views AreaChart.

import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import fbapi from "@/services/fbapi";
import { KpiCard } from "./MetaSharedComponents";
import { Eye, Target, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const FB_BLUE = "#1877F2";
const fmt = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161B22]/95 border border-white/10 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((e, i) => <p key={i} style={{ color: e.color }}>{e.name}: <span className="font-bold text-white">{fmt(e.value)}</span></p>)}
    </div>
  );
};

const FacebookReachViews = () => {
  const { isConnected } = useOutletContext();
  const [data, setData]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]   = useState(null);

  // ── Fetch reach & views metrics independently on mount ───────────────────
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const result = await fbapi.getReachViewsMetrics();
        if (mounted) setData(result);
      } catch (e) {
        if (mounted) setError("Could not load reach data.");
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

  const kpis = [
    { label: "Total Reach",    value: data?.kpis?.totalReach?.value,   icon: Eye        },
    { label: "Organic Reach",  value: data?.kpis?.organicReach?.value, icon: TrendingUp },
    { label: "Video Views",    value: data?.kpis?.videoViews?.value,   icon: Target     },
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

        {/* ── Stacked Reach BarChart (organic + paid) ────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white">Organic vs. Paid Reach</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full bg-gray-700/30 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={(data?.timeline?.length > 0) ? data.timeline : [{ date: '', organicReach: 0, paidReach: 0 }]} 
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
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
                    domain={([dataMin, dataMax]) => [0, isNaN(dataMax) || !isFinite(dataMax) || dataMax === 0 ? 2 : Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: "12px", fontSize: "12px", color: "#94a3b8" }} />
                  <Bar dataKey="organicReach" name="Organic" stackId="a" fill="#3B82F6"   radius={[0,0,0,0]} maxBarSize={20} />
                  <Bar dataKey="paidReach"    name="Paid"    stackId="a" fill="#8B5CF6"   radius={[4,4,0,0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ── 3-Second vs 1-Minute Views AreaChart ──────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white">Video Views (3s vs. 1-Minute)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full bg-gray-700/30 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={(data?.timeline?.length > 0) ? data.timeline : [{ date: '', threeSecondViews: 0, oneMinuteViews: 0 }]} 
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fb3sGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3B82F6"  stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6"  stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="fb1mGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}   />
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
                    domain={([dataMin, dataMax]) => [0, isNaN(dataMax) || !isFinite(dataMax) || dataMax === 0 ? 2 : Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip content={<GlassTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: "12px", fontSize: "12px", color: "#94a3b8" }} />
                  <Area type="monotone" dataKey="threeSecondViews" name="3s Views"    stroke="#3B82F6" strokeWidth={2.5} activeDot={{ r: 6, strokeWidth: 0, fill: "#3B82F6" }} fillOpacity={1} fill="url(#fb3sGrad)" />
                  <Area type="monotone" dataKey="oneMinuteViews"   name="1-Min Views" stroke="#10B981" strokeWidth={2.5} activeDot={{ r: 6, strokeWidth: 0, fill: "#10B981" }} fillOpacity={1} fill="url(#fb1mGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacebookReachViews;