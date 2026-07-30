import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Clock, Video, Users, Zap, TrendingDown, Lightbulb, ChevronRight } from 'lucide-react';
import igapi from '@/services/igapi';

// ── Highlight card icon map ────────────────────────────────────────────────────
const HIGHLIGHT_META = [
  { key: "bestTimeToPost",       label: "Best Time to Post",        icon: Clock,  color: "bg-amber-500/10 text-amber-400"     },
  { key: "topPerformingFormat",  label: "Top Format",               icon: Video,  color: "bg-pink-500/10 text-pink-500"       },
  { key: "topAudienceSegment",   label: "Top Audience Segment",     icon: Users,  color: "bg-emerald-500/10 text-emerald-400" },
  { key: "recommendedContentType",label:"Recommended Content Type", icon: Zap,    color: "bg-purple-500/10 text-purple-400"   },
];

// ── Recommendation type badge color map ───────────────────────────────────────
const TYPE_COLORS = {
  content:    "bg-pink-500/10 text-pink-500",
  audience:   "bg-emerald-500/10 text-emerald-400",
  engagement: "bg-amber-500/10 text-amber-400",
  schedule:   "bg-purple-500/10 text-purple-400",
  default:    "bg-gray-500/10 text-gray-400",
};

const InstagramInsights = () => {
  const { isConnected } = useOutletContext();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const response = await igapi.getInsights();
        if (isMounted) setData(response);
      } catch (error) {
        console.error("Failed to fetch insights data:", error);
        if (isMounted) setError("Could not load insights data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (isConnected) fetchData();
    else setIsLoading(false);
    return () => { isMounted = false; };
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl text-white font-semibold mb-2">Account Disconnected</h2>
        <p className="text-gray-400">Please connect your Instagram account to view insights.</p>
      </div>
    );
  }

  if (error) return (
    <div className="p-6 flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-3">
        <TrendingDown className="h-10 w-10 text-red-400 mx-auto" />
        <p className="text-sm text-gray-400">{error}</p>
        <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">Retry</Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Insights</h1>
          <p className="text-gray-400 mt-1">Smart recommendations based on your Instagram data</p>
        </div>
      </div>

      {/* ── Smart Highlight Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {HIGHLIGHT_META.map((h, i) => (
          <Card key={i} className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all group shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <><Skeleton className="h-10 w-10 rounded-full bg-gray-700/50 mb-3" /><Skeleton className="h-3 w-20 bg-gray-700/50 mb-2" /><Skeleton className="h-5 w-24 bg-gray-700/50" /></>
              ) : (
                <>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${h.color} mb-3 group-hover:scale-110 transition-transform`}>
                    <h.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{h.label}</p>
                  <p className="text-sm font-bold text-white mt-2">{data?.highlights?.[h.key] || "—"}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Recommendations Table ──────────────────────────────────────────── */}
      <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <CardTitle className="text-sm font-semibold text-white">AI-Powered Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full bg-gray-700/30 rounded-xl" />)}
            </div>
          ) : (!data?.recommendations?.length) ? (
            <div className="text-center py-10">
              <Lightbulb className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No recommendations yet. Keep posting to unlock insights!</p>
            </div>
          ) : (
            data.recommendations.map((rec, i) => {
              const colorClass = TYPE_COLORS[rec.type?.toLowerCase()] || TYPE_COLORS.default;
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-xl bg-white/[0.02] border border-white/5 p-4 hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group"
                >
                  {/* Type badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${colorClass}`}>
                    {rec.type}
                  </span>
                  {/* Recommendation text */}
                  <p className="text-sm text-gray-300 leading-relaxed flex-1">{rec.recommendation}</p>
                  {/* Arrow indicator */}
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all mt-0.5 flex-shrink-0" />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstagramInsights;
