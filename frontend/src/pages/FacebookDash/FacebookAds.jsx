// ── Facebook Ads Page ─────────────────────────────────────────────────────────
// Fetches data independently via fbapi.getAdsMetrics() on mount.
// Shows 4 KPI cards + active campaigns table.

import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import fbapi from "@/services/fbapi";
import { KpiCard } from "./MetaSharedComponents";
import { Target, Eye, MousePointerClick, DollarSign, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

const FacebookAds = () => {
  const { isConnected } = useOutletContext();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // ── Fetch ads metrics independently on mount ──────────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const result = await fbapi.getAdsMetrics();
        if (mounted) setData(result);
      } catch (e) {
        if (mounted) setError("Could not load ads data.");
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
    { label: "Total Spend",   value: data?.kpis?.totalSpend?.value,  icon: DollarSign        },
    { label: "Impressions",   value: data?.kpis?.impressions?.value, icon: Eye               },
    { label: "Link Clicks",   value: data?.kpis?.linkClicks?.value,  icon: MousePointerClick },
    { label: "Avg. CPC",      value: data?.kpis?.avgCpc?.value,      icon: Target            },
  ];

  if (!isLoading && (!data || !data.campaigns || data.campaigns.length === 0)) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="bg-[#10141D] border border-white/[0.06] rounded-xl p-10 text-center w-full max-w-2xl shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/20">
            <Target className="h-8 w-8 text-[#1877F2]" />
          </div>
          <h2 className="text-base font-bold text-white mb-2">No Facebook Ads Connected</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
            To track ad spend, campaign performance, and link clicks, connect a Facebook Ad Account associated with your Page.
          </p>
          <div className="flex flex-col items-center justify-center">
            <button 
              onClick={() => navigate('/dashboard/settings')}
              className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              Connect Ad Account
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
              <h2 className="text-lg font-bold text-white mb-2">Ad Account Setup</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                To view ad analytics, ensure you have connected a Facebook Ad Account in settings. The Ad Account must be actively linked to your authenticated Facebook Page via Meta Business Manager.
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              value={k.value} 
              icon={k.icon} 
              showActive={true} 
            />
          )
        ))}
      </div>

      {/* ── Active Campaigns Table ────────────────────────────────────────── */}
      <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white">Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full bg-gray-700/30 rounded-lg" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase tracking-wider border-y border-white/5 bg-white/[0.02]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Campaign</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Spend</th>
                    <th className="px-6 py-4 font-medium text-right">Impressions</th>
                    <th className="px-6 py-4 font-medium text-right">CTR</th>
                    <th className="px-6 py-4 font-medium text-right">CPC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(!data?.campaigns?.length) ? (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-500 text-sm">No campaigns found</td></tr>
                  ) : data.campaigns.map((c, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-gray-200 truncate max-w-[200px]">{c.campaignName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block
                          ${c.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-gray-500/10 text-gray-400"}`}
                      >
                        {c.status}
                      </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs font-medium">{c.spend}</td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs">{c.impressions}</td>
                      <td className="px-6 py-4 text-right text-[#1877F2] text-xs font-medium">{c.ctr}</td>
                      <td className="px-6 py-4 text-right text-gray-200 text-xs">{c.cpc}</td>
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

export default FacebookAds;