// ── Facebook Groups Page ──────────────────────────────────────────────────────
// Fetches data independently via fbapi.getGroupsMetrics() on mount.
// Shows 3 KPI cards, member growth LineChart, and recent posts list.

import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import fbapi from "@/services/fbapi";
import { Users, Activity, FileText, ThumbsUp, MessageCircle, TrendingDown, ArrowUpRight, Share2 } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const FB_BLUE = "#1877F2";
const fmt = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "rgba(22,27,34,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} className="px-3 py-2.5 text-xs">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((e, i) => <p key={i} style={{ color: e.color }}>{e.name}: <span className="font-bold text-white">{fmt(e.value)}</span></p>)}
    </div>
  );
};

const FacebookGroups = () => {
  const { isConnected } = useOutletContext();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // ── Fetch groups metrics independently on mount ───────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const result = await fbapi.getGroupsMetrics();
        if (mounted) setData(result);
      } catch (e) {
        if (mounted) setError("Could not load groups data.");
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
    { label: "Total Members",  value: fmt(data?.kpis?.totalMembers),  icon: Users,    color: "bg-[#1877F2]/10 text-[#1877F2]"   },
    { label: "Active Members", value: fmt(data?.kpis?.activeMembers), icon: Activity, color: "bg-emerald-500/10 text-emerald-400" },
    { label: "Posts This Week",value: data?.kpis?.postsCount,         icon: FileText, color: "bg-amber-500/10 text-amber-400"    },
  ];

  if (!isLoading && (!data || !data.kpis || data.kpis.totalMembers === 0)) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="bg-[#10141D] border border-white/[0.06] rounded-xl p-10 text-center w-full max-w-2xl shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/20">
            <Users className="h-8 w-8 text-[#1877F2]" />
          </div>
          <h2 className="text-base font-bold text-white mb-2">No Facebook Group Connected</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
            To track member growth, active engagement, and recent group posts, connect a Facebook Group where your Page has Admin access.
          </p>
          <div className="flex flex-col items-center justify-center">
            <button 
              onClick={() => navigate('/dashboard/settings')}
              className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              Connect Facebook Group
            </button>
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="text-xs text-slate-400 hover:text-white transition-colors underline cursor-pointer mt-3 block"
            >
              View Setup Guide
            </button>
          </div>
        </div>

        {isGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-[#161B22] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl text-left animate-fade-in">
              <h2 className="text-lg font-bold text-white mb-2">Group Setup Guide</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                To track member growth and engagement, ensure you are an Admin of both your Facebook Page and the Facebook Group, and that they are officially linked together in your Facebook settings.
              </p>
              <div className="flex justify-end">
                <Button onClick={() => setIsGuideOpen(false)} className="bg-[#1877F2] text-white hover:bg-[#1877F2]/90 h-8 px-4 text-xs font-semibold">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((k, i) => (
          <Card key={i} className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 p-5">
            <CardContent className="p-0">
              {isLoading ? (
                <><Skeleton className="h-10 w-10 rounded-full bg-gray-700/50 mb-3" /><Skeleton className="h-3 w-20 bg-gray-700/50 mb-2" /><Skeleton className="h-8 w-24 bg-gray-700/50" /></>
              ) : (
                <>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${k.color} mb-3`}>
                    <k.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{k.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{k.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Member Growth LineChart ────────────────────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white">Member Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full bg-gray-700/30 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={(data?.growthTimeline?.length > 0) ? data.growthTimeline : [{ date: '', totalMembers: 0, activeMembers: 0 }]} 
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={fmt} 
                    allowDecimals={false}
                    domain={([dataMin, dataMax]) => [0, isNaN(dataMax) || !isFinite(dataMax) || dataMax === 0 ? 2 : Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip content={<GlassTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                  <Line type="monotone" dataKey="totalMembers"  name="Total"  stroke={FB_BLUE}  strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="activeMembers" name="Active" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ── Recent Posts List ──────────────────────────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white">Recent Group Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full bg-gray-700/30 rounded-xl" />)}
              </div>
            ) : (
              (data?.recentPosts || []).map((post, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      {/* Author avatar (initials) */}
                      <div className="h-8 w-8 rounded-full bg-[#1877F2]/20 flex items-center justify-center text-[#1877F2] text-xs font-bold flex-shrink-0">
                        {post.author?.[0] || "U"}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{post.author}</p>
                        <p className="text-[10px] text-gray-500">{post.time}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 mt-3 leading-relaxed line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1 hover:text-[#1877F2] cursor-pointer transition-colors">
                      <ThumbsUp className="h-3 w-3" /> {post.likes}
                    </span>
                    <span className="flex items-center gap-1 hover:text-[#1877F2] cursor-pointer transition-colors">
                      <MessageCircle className="h-3 w-3" /> {post.comments}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacebookGroups;