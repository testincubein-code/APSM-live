import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { PLATFORM_CONFIG } from '@/pages/CombinedOverview/config';
import { Target } from 'lucide-react';

const GoalTracker = ({ summaries }) => {
  const platforms = Object.keys(summaries);
  if (platforms.length === 0) return null;

  // Let's define a dynamic goal: e.g., next milestone of 10k, 50k, 100k, 500k, 1M based on total reach
  const totalReach = platforms.reduce((acc, p) => acc + (summaries[p].reach || 0), 0);
  
  let targetGoal = 10000;
  if (totalReach > 10000) targetGoal = 50000;
  if (totalReach > 50000) targetGoal = 100000;
  if (totalReach > 100000) targetGoal = 500000;
  if (totalReach > 500000) targetGoal = 1000000;
  if (totalReach > 1000000) targetGoal = Math.ceil(totalReach / 1000000 + 1) * 1000000;

  const data = platforms.map(p => ({
    name: PLATFORM_CONFIG[p]?.label || p,
    reach: summaries[p].reach || 0,
    fill: PLATFORM_CONFIG[p]?.color || '#ffffff',
  })).filter(d => d.reach > 0);

  // We add a dummy invisible outer track to force the scale to the targetGoal
  const chartData = [
    { name: 'Target', reach: targetGoal, fill: 'transparent' },
    ...data
  ];

  return (
    <Card className="bg-[#0D1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl col-span-12 lg:col-span-6 flex flex-col">
      <CardHeader className="border-b border-white/5 bg-white/[0.02] shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white tracking-wide uppercase">
            <Target className="w-4 h-4 text-rose-400" />
            Cross-Platform Reach Goal
          </CardTitle>
          <div className="text-xs font-semibold text-slate-400 bg-white/5 px-2 py-1 rounded-md">
            Target: {targetGoal.toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col justify-center relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-white tracking-tighter">
            {Math.min(100, (totalReach / targetGoal) * 100).toFixed(0)}%
          </span>
          <span className="text-xs text-slate-500 font-medium tracking-widest uppercase mt-1">Achieved</span>
        </div>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="50%" 
              outerRadius="100%" 
              barSize={16} 
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                minAngle={15}
                background={{ fill: 'rgba(255,255,255,0.03)' }}
                clockWise
                dataKey="reach"
                cornerRadius={10}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length && payload[0].payload.name !== 'Target') {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#10141D] border border-white/10 rounded-lg p-3 shadow-xl">
                        <p className="text-sm font-semibold text-white flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }} />
                          {data.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {data.reach.toLocaleString()} Reach
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalTracker;
