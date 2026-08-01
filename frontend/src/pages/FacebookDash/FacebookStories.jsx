// ── Facebook Stories Page ─────────────────────────────────────────────────────
// Fetches data independently via fbapi.getStoriesMetrics() on mount.
// Shows 4 KPI cards + stories table.

import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import fbapi from "@/services/fbapi";
import { KpiCard } from "./MetaSharedComponents";
import { History, Eye, TrendingUp, MessageCircle, TrendingDown } from "lucide-react";

const fmt = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const FacebookStories = () => {
  const { isConnected } = useOutletContext();
  const [data, setData]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]   = useState(null);

  // ── Fetch stories metrics independently on mount ──────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const result = await fbapi.getStoriesMetrics();
        if (mounted) setData(result);
      } catch (e) {
        if (mounted) setError("Could not load stories data.");
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
    { label: "Active Stories",   value: data?.kpis?.activeStories,  icon: History,       color: "bg-[#1877F2]/10 text-[#1877F2]"   },
    { label: "Avg. Reach",       value: fmt(data?.kpis?.avgReach),   icon: Eye,           color: "bg-emerald-500/10 text-emerald-400" },
    { label: "Completion Rate",  value: data?.kpis?.completionRate,  icon: TrendingUp,    color: "bg-amber-500/10 text-amber-400"    },
    { label: "Total Replies",    value: fmt(data?.kpis?.totalReplies),icon: MessageCircle, color: "bg-indigo-500/10 text-indigo-400"  },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <Card key={i} className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 p-5">
            <CardContent className="p-0">
              {isLoading ? (
                <><Skeleton className="h-10 w-10 rounded-full bg-gray-700/50 mb-3" /><Skeleton className="h-3 w-16 bg-gray-700/50 mb-2" /><Skeleton className="h-8 w-20 bg-gray-700/50" /></>
              ) : (
                <>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${k.color} mb-3`}>
                    <k.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{k.label}</p>
                  <p className="text-2xl font-bold text-white mt-2">{k.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Stories Table ─────────────────────────────────────────────────── */}
      <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white">Stories Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full bg-gray-700/30 rounded-lg" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase tracking-wider border-y border-white/5 bg-white/[0.02]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Story</th>
                    <th className="px-6 py-4 font-medium">Published</th>
                    <th className="px-6 py-4 font-medium text-right">Opens</th>
                    <th className="px-6 py-4 font-medium text-right">Reach</th>
                    <th className="px-6 py-4 font-medium text-right">Exits</th>
                    <th className="px-6 py-4 font-medium text-right">Replies</th>
                    <th className="px-6 py-4 font-medium text-right">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(!data?.stories?.length) ? (
                    <tr><td colSpan={7} className="py-12 text-center text-gray-500 text-sm">No stories found</td></tr>
                  ) : data.stories.map((s, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={s.image} alt="" className="h-10 w-7 rounded object-cover flex-shrink-0" />
                          <p className="text-xs font-medium text-gray-200 truncate max-w-[180px]">{s.title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">{s.date}</td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs font-medium">{fmt(s.opens)}</td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs font-medium">{fmt(s.reach)}</td>
                      <td className="px-6 py-4 text-right text-red-400 text-xs">{fmt(s.exits)}</td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs">{s.replies}</td>
                      <td className="px-6 py-4 text-right text-emerald-400 text-xs font-medium">{s.completionRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacebookStories;