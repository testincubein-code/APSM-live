// ── Facebook Videos Page ─────────────────────────────────────────────────────
// Fetches data independently via fbapi.getVideosMetrics() on mount.
// Shows 4 KPI cards + video table with plays, watch time, and engagement.

import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import fbapi from "@/services/fbapi";
import { Video, Play, Clock, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";

const fmt = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const FacebookVideos = () => {
  const { isConnected } = useOutletContext();
  const [data, setData]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]   = useState(null);

  // ── Fetch videos metrics independently on mount ───────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const result = await fbapi.getVideosMetrics();
        if (mounted) setData(result);
      } catch (e) {
        if (mounted) setError("Could not load video data.");
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
    { label: "Total Videos",   value: data?.kpis?.totalVideos,   icon: Video,     color: "bg-[#1877F2]/10 text-[#1877F2]"   },
    { label: "Total Plays",    value: fmt(data?.kpis?.totalPlays), icon: Play,    color: "bg-emerald-500/10 text-emerald-400" },
    { label: "Avg. Watch Time", value: data?.kpis?.avgWatchTime,  icon: Clock,    color: "bg-amber-500/10 text-amber-400"    },
    { label: "Top Retention",  value: data?.kpis?.topRetention,  icon: TrendingUp,color: "bg-indigo-500/10 text-indigo-400"  },
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

      {/* ── Video Table ───────────────────────────────────────────────────── */}
      <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white">Video Performance</CardTitle>
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
                    <th className="px-6 py-4 font-medium">Video</th>
                    <th className="px-6 py-4 font-medium">Published</th>
                    <th className="px-6 py-4 font-medium text-right">Plays</th>
                    <th className="px-6 py-4 font-medium text-right">Watch Time</th>
                    <th className="px-6 py-4 font-medium text-right">3s Views</th>
                    <th className="px-6 py-4 font-medium text-right">1m Views</th>
                    <th className="px-6 py-4 font-medium text-right">Eng. Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(!data?.videos?.length) ? (
                    <tr><td colSpan={7} className="py-12 text-center text-gray-500 text-sm">No videos found</td></tr>
                  ) : data.videos.map((vid, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 max-w-[200px] md:max-w-[300px]">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-10 w-16 rounded overflow-hidden flex-shrink-0">
                            <img src={vid.image} alt="" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="h-3 w-3 text-white fill-white" />
                            </div>
                          </div>
                          <p className="text-xs font-medium text-gray-200 truncate">{vid.title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">{vid.date}</td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs font-medium">{fmt(vid.plays)}</td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs">{vid.watchTime}</td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs">{fmt(vid.threeSecondViews)}</td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs">{fmt(vid.oneMinuteViews)}</td>
                      <td className="px-6 py-4 text-right text-emerald-400 text-xs font-medium">{vid.rate}</td>
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

export default FacebookVideos;