import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PLATFORM_CONFIG } from '@/pages/CombinedOverview/config';
import { Users, Eye, Activity, Heart, FileText, TrendingUp } from 'lucide-react';

const fmt = (num) => {
  if (num === null || num === undefined) return '—';
  const n = parseFloat(num);
  if (isNaN(n)) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const METRICS = [
  { key: 'followers', label: 'Followers', icon: Users },
  { key: 'reach', label: 'Reach', icon: Eye },
  { key: 'impressions', label: 'Impressions', icon: Activity },
  { key: 'engagement', label: 'Engagement', icon: Heart },
  { key: 'posts', label: 'Posts', icon: FileText },
];

const CrossPlatformHeatmap = ({ summaries }) => {
  const platforms = Object.keys(summaries);
  if (platforms.length === 0) return null;

  // Find max values for heatmap highlighting
  const maxValues = {};
  METRICS.forEach(m => {
    maxValues[m.key] = Math.max(...platforms.map(p => summaries[p]?.[m.key] || 0));
  });

  return (
    <Card className="bg-[#0D1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <CardHeader className="border-b border-white/5 bg-white/[0.02]">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white tracking-wide uppercase">
          <Activity className="w-4 h-4 text-indigo-400" />
          Cross-Platform Comparison Matrix
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#10141D] text-slate-400 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4 font-semibold tracking-wider">Platform</th>
              {METRICS.map(m => (
                <th key={m.key} className="px-6 py-4 font-semibold tracking-wider whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <m.icon className="w-3.5 h-3.5" />
                    {m.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {platforms.map(p => {
              const cfg = PLATFORM_CONFIG[p];
              if (!cfg) return null;
              const IconComp = cfg.icon;
              const data = summaries[p];

              return (
                <tr key={p} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 shrink-0" style={{ color: cfg.color }}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-white">{cfg.label}</span>
                    </div>
                  </td>
                  
                  {METRICS.map(m => {
                    const val = data[m.key] || 0;
                    const isMax = val > 0 && val === maxValues[m.key];
                    
                    return (
                      <td key={m.key} className="px-6 py-4 text-right relative">
                        {isMax && (
                          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundColor: cfg.color }} />
                        )}
                        <span className={`relative z-10 font-semibold ${isMax ? 'text-white' : 'text-slate-400'}`}>
                          {fmt(val)}
                        </span>
                        {isMax && (
                          <span className="relative z-10 ml-2 inline-flex items-center">
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default CrossPlatformHeatmap;
