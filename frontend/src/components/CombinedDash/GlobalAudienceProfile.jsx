import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import fbapi from '@/services/fbapi';
import igapi from '@/services/igapi';
import api from '@/services/api';

const GlobalAudienceProfile = () => {
  const [demographics, setDemographics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAudience = async () => {
      // ── MOCK DATA TOGGLE ──────────────────────────────────────────────
      const USE_MOCK_DATA = true;

      if (USE_MOCK_DATA) {
        if (mounted) {
          setDemographics([
            { age: '13-17', count: 4200 },
            { age: '18-24', count: 28500 },
            { age: '25-34', count: 35100 },
            { age: '35-44', count: 18400 },
            { age: '45-54', count: 9200 },
            { age: '55-64', count: 3100 },
            { age: '65+', count: 1500 },
          ]);
          setIsLoading(false);
        }
        return;
      }

      try {
        const authRes = await api.get('/auth/status');
        const statusArr = authRes.data?.status ?? [];
        const isConnected = (platform) => {
          const s = statusArr.find(p => p.platform === platform);
          return !!(s?.connected && !s?.isExpired);
        };

        const ageBuckets = {};

        // Fetch FB Audience
        if (isConnected('facebook')) {
          try {
            const fbData = await fbapi.getAudienceMetrics?.();
            if (fbData?.demographics?.ageAndGender) {
              fbData.demographics.ageAndGender.forEach(d => {
                const ageGroup = d.group.split('.')[1] || d.group; // Usually format is F.18-24
                ageBuckets[ageGroup] = (ageBuckets[ageGroup] || 0) + (d.count || 0);
              });
            }
          } catch (e) { console.warn('FB Audience error', e); }
        }

        // Fetch IG Audience
        if (isConnected('instagram')) {
          try {
            const igData = await igapi.getAudience?.(true);
            if (igData?.demographics?.ageAndGender) {
              igData.demographics.ageAndGender.forEach(d => {
                const ageGroup = d.group.split('.')[1] || d.group;
                ageBuckets[ageGroup] = (ageBuckets[ageGroup] || 0) + (d.count || 0);
              });
            }
          } catch (e) { console.warn('IG Audience error', e); }
        }

        // Format for Recharts
        const formattedData = Object.keys(ageBuckets).map(age => ({
          age,
          count: ageBuckets[age]
        })).sort((a, b) => a.age.localeCompare(b.age)); // Sort by age group string

        if (mounted) {
          setDemographics(formattedData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch audience profile:", err);
        if (mounted) setIsLoading(false);
      }
    };

    fetchAudience();
    return () => { mounted = false; };
  }, []);

  return (
    <Card className="bg-[#0D1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl col-span-12">
      <CardHeader className="border-b border-white/5 bg-white/[0.02] shrink-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white tracking-wide uppercase">
          <Globe className="w-4 h-4 text-cyan-400" />
          Global Audience Profile (Age Distribution)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 h-[350px]">
        {isLoading ? (
          <div className="w-full h-full flex items-end gap-4 p-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="flex-1 bg-white/5 rounded-t-xl" style={{ height: `${Math.random() * 60 + 20}%` }} />
            ))}
          </div>
        ) : demographics.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Not enough demographic data available from connected platforms.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demographics} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="age" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ backgroundColor: '#10141D', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="url(#colorCount)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#818CF8" stopOpacity={1}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default GlobalAudienceProfile;
