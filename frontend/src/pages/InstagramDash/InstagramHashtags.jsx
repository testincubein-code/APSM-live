import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hash, TrendingUp, BarChart3, Eye, FileText, Activity } from 'lucide-react';

// Helper to format numbers cleanly (e.g. 1.2K, 50K)
const formatCompactNumber = (num) => {
  if (!num && num !== 0) return "0";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
};

export function InstagramHashtags({ data }) {
  // Sample data fallback in case props are empty
  const hashtags = data?.hashtags || [
    { hashtag: "#incubien", reach: 12400, usageCount: 12, avgEngagement: "6.8%" },
    { hashtag: "#buildinpublic", reach: 8900, usageCount: 8, avgEngagement: "5.4%" },
    { hashtag: "#saas", reach: 6500, usageCount: 15, avgEngagement: "4.1%" },
    { hashtag: "#techstartup", reach: 4200, usageCount: 5, avgEngagement: "3.9%" },
    { hashtag: "#reactjs", reach: 3100, usageCount: 9, avgEngagement: "3.2%" },
  ];

  return (
    <Card className="bg-[#10141D] border border-white/[0.06] rounded-xl text-white shadow-none">
      {/* ── Section Header ───────────────────────────────────────────── */}
      <CardHeader className="pb-4 border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
              <Hash className="h-4 w-4 text-[#E1306C]" />
              Hashtag Performance
            </CardTitle>
            <p className="text-xs text-[#8B949E] mt-0.5">
              Tag attribution and reach analysis across recent posts
            </p>
          </div>
          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit">
            Top Performing Hashtags
          </span>
        </div>
      </CardHeader>

      {/* ── Data Table ───────────────────────────────────────────────── */}
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="text-[10px] uppercase tracking-wider text-[#8B949E] bg-white/[0.02] border-b border-white/[0.06]">
            <tr>
              <th className="py-3 px-6 font-semibold">Hashtag</th>
              <th className="py-3 px-6 font-semibold text-right">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3 text-slate-500" /> Total Reach
                </span>
              </th>
              <th className="py-3 px-6 font-semibold text-right">
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3 w-3 text-slate-500" /> Usage Count
                </span>
              </th>
              <th className="py-3 px-6 font-semibold text-right">
                <span className="inline-flex items-center gap-1">
                  <Activity className="h-3 w-3 text-slate-500" /> Avg. Engagement
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {hashtags.map((item, index) => (
              <tr 
                key={index} 
                className="hover:bg-white/[0.02] transition-colors duration-150 group"
              >
                {/* Hashtag Name */}
                <td className="py-3.5 px-6 font-semibold text-sm text-slate-200 group-hover:text-[#E1306C] transition-colors">
                  {item.hashtag.startsWith('#') ? item.hashtag : `#${item.hashtag}`}
                </td>

                {/* Reach */}
                <td className="py-3.5 px-6 text-right font-medium text-xs text-slate-300">
                  {formatCompactNumber(item.reach)}
                </td>

                {/* Usage Count */}
                <td className="py-3.5 px-6 text-right text-xs text-slate-400">
                  {item.usageCount} posts
                </td>

                {/* Avg Engagement */}
                <td className="py-3.5 px-6 text-right text-xs font-semibold text-emerald-400">
                  {item.avgEngagement}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export default InstagramHashtags;
