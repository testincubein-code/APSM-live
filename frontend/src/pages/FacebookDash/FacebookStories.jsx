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
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

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

  const storiesList = data?.stories ?? [];
  const hasStories = storiesList.length > 0;

  if (!isLoading && (!hasStories || error)) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="bg-[#10141D] border border-white/[0.06] rounded-xl p-10 text-center w-full max-w-2xl shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/20">
            <History className="h-8 w-8 text-[#1877F2]" />
          </div>
          <h2 className="text-base font-bold text-white mb-2">No Active Stories Found</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
            Facebook Stories expire after 24 hours. Publish a new story on your Facebook Page to view real-time reach and engagement metrics here.
          </p>
          <div className="flex flex-col items-center justify-center">
            <button 
              onClick={() => navigate('/dashboard/cross-posting')}
              className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              Publish New Story
            </button>
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="text-xs text-slate-400 hover:text-white transition-colors underline cursor-pointer mt-3 block"
            >
              View Best Practices
            </button>
          </div>
        </div>
        
        {isGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-[#161B22] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl text-left animate-fade-in">
              <h2 className="text-lg font-bold text-white mb-2">Stories Best Practices</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Maximize your reach by posting consistently and using interactive elements like stickers, polls, and tags in your Facebook Stories.
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

  const kpis = [
    { label: "ACTIVE STORIES",    value: data?.kpis?.activeStories,  icon: History },
    { label: "TOTAL STORY REACH", value: fmt(data?.kpis?.totalReach || data?.kpis?.avgReach), icon: Eye },
    { label: "STORY IMPRESSIONS", value: fmt(data?.kpis?.totalImpressions || data?.kpis?.totalReplies), icon: Eye },
    { label: "COMPLETION RATE",   value: data?.kpis?.completionRate, icon: TrendingUp },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          isLoading ? (
            <Card key={i} className="bg-[#10141D] border border-white/[0.06] rounded-xl p-5 shadow-none transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-3 w-20 bg-gray-700/50" />
              </div>
              <Skeleton className="h-7 w-24 bg-gray-700/50 mt-1" />
              <Skeleton className="h-4 w-16 bg-gray-700/50 mt-2" />
            </Card>
          ) : (
            <KpiCard 
              key={i} 
              title={k.label} 
              value={k.value} 
              icon={k.icon} 
              showActive={false} 
            />
          )
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
                  {(!storiesList.length) ? (
                    <tr><td colSpan={7} className="py-12 text-center text-gray-500 text-sm">No stories found</td></tr>
                  ) : storiesList.map((s, i) => (
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