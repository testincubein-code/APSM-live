// ── Facebook Content Page ─────────────────────────────────────────────────────
// Fetches data independently via fbapi.getOverviewMetrics() (posts portion).
// Supports tab filtering: All, Posts, Photos, Links, Text.
// Receives connection context from FacebookLayout via useOutletContext.

import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import fbapi from "@/services/fbapi";
import { FileText, MoreVertical, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Content type tabs ─────────────────────────────────────────────────────────
const TABS = ["All", "Photos", "Videos", "Links", "Text"];

// ── Number formatter ──────────────────────────────────────────────────────────
const fmt = (n) =>
  n == null ? "—"
  : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const FacebookContent = () => {
  const { isConnected } = useOutletContext();
  const [posts, setPosts]     = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab] = useState("All");

  // ── Fetch only the posts data on mount ────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const data = await fbapi.getOverviewMetrics();
        const allContent = [
          ...(data?.tables?.topPosts || []),
          ...(data?.tables?.topVideos || [])
        ];
        allContent.sort((a, b) => b.date.localeCompare(a.date));
        if (mounted) setPosts(allContent);
      } catch (e) {
        if (mounted) setError("Could not load content data.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, []);

  // ── KPI summary cards ──────────────────────────────────────────────────────
  const kpis = [
    { label: "Total Posts",          value: posts.length || "3"    },
    { label: "Avg. Reach / Post",    value: fmt(posts.reduce((a, p) => a + (p.reach || 0), 0) / Math.max(posts.length, 1)) },
    { label: "Total Engagement",     value: fmt(posts.reduce((a, p) => a + (p.likes || 0) + (p.comments || 0), 0)) },
    { label: "Top Post Eng. Rate",   value: posts[0]?.rate || "N/A" },
  ];

  // ── Filter posts by tab (type field or fallback to all) ───────────────────
  const filtered = activeTab === "All"
    ? posts
    : posts.filter((p) => (p.type || "Posts").toLowerCase() === activeTab.toLowerCase());

  if (error) return (
    <div className="p-6 flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-3">
        <TrendingDown className="h-10 w-10 text-red-400 mx-auto" />
        <p className="text-sm text-gray-400">{error}</p>
        <Button onClick={() => window.location.reload()} className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white text-xs">Retry</Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── KPI Summary ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <Card key={i} className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 p-5">
            <CardContent className="p-0">
              {isLoading ? (
                <><Skeleton className="h-3 w-20 bg-gray-700/50 mb-2" /><Skeleton className="h-7 w-16 bg-gray-700/50" /></>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{k.label}</p>
                  <p className="text-2xl font-bold text-white mt-2">{k.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Content Table with Tabs ──────────────────────────────────────── */}
      <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-sm font-semibold text-white">Content Performance</CardTitle>
            {/* ── Type filter tabs ─────────────────────────────────────── */}
            <div className="flex gap-1 flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                    ${activeTab === t
                      ? "bg-[#1877F2] text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full bg-gray-700/30 rounded-lg" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase tracking-wider border-y border-white/5 bg-white/[0.02]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Content</th>
                    <th className="px-6 py-4 font-medium">Published</th>
                    <th className="px-6 py-4 font-medium text-right">Reach</th>
                    <th className="px-6 py-4 font-medium text-right">Impressions</th>
                    <th className="px-6 py-4 font-medium text-right">Likes</th>
                    <th className="px-6 py-4 font-medium text-right">Comments</th>
                    <th className="px-6 py-4 font-medium text-right">Eng. Rate</th>
                    <th className="px-6 py-4 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-gray-500 text-sm">No content for this filter</td></tr>
                  ) : filtered.map((p, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 max-w-[200px] md:max-w-[300px]">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={p.image} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
                          <p className="text-xs font-medium text-gray-200 truncate">{p.title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">{p.date}</td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs font-medium">{fmt(p.reach)}</td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs font-medium">{fmt(p.impressions)}</td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs">{fmt(p.likes)}</td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs">{p.comments}</td>
                      <td className="px-6 py-4 text-right text-emerald-400 text-xs font-medium">{p.rate}</td>
                      <td className="px-6 py-4 text-right"><MoreVertical className="h-4 w-4 text-gray-500 inline" /></td>
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

export default FacebookContent;