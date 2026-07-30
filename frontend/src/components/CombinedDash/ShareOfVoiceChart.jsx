import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { PLATFORM_CONFIG } from '@/pages/CombinedOverview/config';
import { PieChart as PieChartIcon } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#10141D] border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }} />
          {data.name}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {data.value.toLocaleString()} Engagements
        </p>
      </div>
    );
  }
  return null;
};

const ShareOfVoiceChart = ({ summaries }) => {
  const platforms = Object.keys(summaries);
  if (platforms.length === 0) return null;

  // Prepare data for Donut Chart (Share of Engagement)
  const donutData = platforms
    .map(p => ({
      name: PLATFORM_CONFIG[p]?.label || p,
      value: summaries[p].engagement || 0,
      fill: PLATFORM_CONFIG[p]?.color || '#ffffff',
    }))
    .filter(d => d.value > 0);

  // Prepare data for Radar Chart (Reach vs Engagement)
  const radarData = [
    { metric: 'Followers' },
    { metric: 'Reach' },
    { metric: 'Engagement' },
  ];

  radarData.forEach(r => {
    platforms.forEach(p => {
      // Normalize values for radar (logarithmic scale approximation or just percentages of max)
      // For simplicity, we just use raw values, but radar charts can get skewed if scales vary wildly.
      // A better approach is to use the raw value and let Recharts scale it.
      r[PLATFORM_CONFIG[p]?.label || p] = summaries[p][r.metric.toLowerCase()] || 0;
    });
  });

  return (
    <Card className="bg-[#0D1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl col-span-12 lg:col-span-6">
      <CardHeader className="border-b border-white/5 bg-white/[0.02]">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white tracking-wide uppercase">
          <PieChartIcon className="w-4 h-4 text-violet-400" />
          Share of Voice (Engagement)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {donutData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
            Not enough data to calculate share of voice.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full h-[300px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend / Breakdown */}
            <div className="flex flex-col gap-4 w-full md:w-48 shrink-0">
              {donutData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.fill }} />
                    <span className="text-sm font-medium text-slate-300">{d.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {d.value > 0 
                      ? ((d.value / donutData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(1) + '%' 
                      : '0%'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShareOfVoiceChart;
