// ── Facebook Audience Page ────────────────────────────────────────────────────
// Fetches data independently via fbapi.getAudienceMetrics() on mount.
// Deep-dive demographic data: age/gender grouped bar, location donut + progress bars, interests.

import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import fbapi from "@/services/fbapi";
import { Users, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const FB_BLUE    = "#1877F2";
const PIE_COLORS = ["#1877F2", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

// ── Glassmorphism tooltip ─────────────────────────────────────────────────────
const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "rgba(22,27,34,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} className="px-3 py-2.5 text-xs">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} className="text-gray-300">{e.name}: <span className="font-bold text-white">{e.value}</span></p>
      ))}
    </div>
  );
};

const FacebookAudience = () => {
  const { isConnected } = useOutletContext();
  const [data, setData]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState(null);

  // ── Fetch audience metrics independently on mount ─────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const result = await fbapi.getAudienceMetrics();
        if (mounted) setData(result);
      } catch (e) {
        if (mounted) setError("Could not load audience data.");
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

  if (!isLoading && (!data || (!data.ageAndGender?.length && !data.topLocations?.length))) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto"><Users className="h-8 w-8 text-blue-400" /></div>
          <h3 className="text-lg font-semibold text-white">Audience Insights Unavailable</h3>
          <p className="text-sm text-gray-400 max-w-sm">We need more page activity to generate detailed audience demographics. Keep growing your page!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── Growth Banner ─────────────────────────────────────────────────── */}
      {!isLoading && data?.totalGrowth && (
        <div className="bg-[#1877F2]/10 border border-[#1877F2]/20 rounded-xl px-5 py-3 flex items-center gap-3">
          <Users className="h-5 w-5 text-[#1877F2] flex-shrink-0" />
          <p className="text-sm text-blue-300 font-medium">{data.totalGrowth}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Age & Gender Grouped Bar Chart ─────────────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white">Age & Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full bg-gray-700/30 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={(data?.ageAndGender?.length > 0) ? data.ageAndGender : [{ group: '', female: 0, male: 0 }]} 
                  margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="group" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `${v}%`} 
                    allowDecimals={false}
                    domain={([dataMin, dataMax]) => [0, isNaN(dataMax) || !isFinite(dataMax) || dataMax === 0 ? 2 : Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                  <Bar dataKey="female" name="Women" fill={FB_BLUE}   radius={[3, 3, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="male"   name="Men"   fill="#64748b"   radius={[3, 3, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ── Top Locations Donut + Progress ────────────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white">Top Locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-4 w-full bg-gray-700/30" />)}
              </div>
            ) : (
              <>
                {/* Donut + legend row */}
                <div className="flex items-center gap-5">
                  <div className="h-[130px] w-[130px] flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data?.topLocations} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value" stroke="none">
                          {(data?.topLocations || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<GlassTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {(data?.topLocations || []).map((loc, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-gray-300 truncate max-w-[110px]">{loc.location}</span>
                        </div>
                        <span className="text-gray-200 font-medium">{loc.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Progress bar distribution */}
                <div className="border-t border-white/5 pt-4 space-y-2.5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Distribution</p>
                  {(data?.topLocations || []).map((loc, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-300 w-28 truncate">{loc.location}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${loc.value}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                      <span className="text-[11px] text-gray-400 w-8 text-right">{loc.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Interests ─────────────────────────────────────────────────── */}
      {!isLoading && data?.topInterests?.length > 0 && (
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white">Top Audience Interests</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.topInterests.map((interest, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center hover:border-[#1877F2]/30 transition-colors">
                <p className="text-sm font-semibold text-white">{interest.value}%</p>
                <p className="text-xs text-gray-400 mt-1 truncate">{interest.name}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FacebookAudience;