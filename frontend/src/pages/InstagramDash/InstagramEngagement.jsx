import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import igapi from '@/services/igapi';
import { 
  AreaChart, Area, LineChart, Line, Legend, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    compactDisplay: "short"
  }).format(num);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#161B22]/95 border border-white/10 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl text-xs">
        <p className="font-semibold text-gray-200 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1 last:mb-0">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="text-gray-400 capitalize">{entry.name}:</span>
            <span className="font-medium text-white">
              {entry.name.includes('Rate') ? `${entry.value}%` : formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const InstagramEngagement = () => {
  const { isConnected } = useOutletContext();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const response = await igapi.getEngagement();
        if (isMounted) setData(response);
      } catch (error) {
        console.error("Failed to fetch engagement data:", error);
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
        <p className="text-gray-400">Please connect your Instagram account to view engagement metrics.</p>
      </div>
    );
  }

  const getIconForType = (name) => {
    switch (name) {
      case 'Likes': return Heart;
      case 'Comments': return MessageCircle;
      case 'Shares': return Share2;
      case 'Saves': return Bookmark;
      default: return Heart;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Engagement Overview</h1>
          <p className="text-gray-400 mt-1">Aggregated interaction metrics over time</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-16 bg-gray-700/50" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 bg-gray-700/50" />
              </CardContent>
            </Card>
          ))
        ) : (
          data.interactions.map((interaction, i) => {
            const Icon = getIconForType(interaction.name);
            return (
              <Card key={i} className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 hover:border-white/10 transition-colors shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">{interaction.name}</CardTitle>
                  <Icon className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{formatNumber(interaction.value)}</div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
        <CardHeader>
          <CardTitle className="text-lg text-white">Engagement Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          {isLoading || !data ? (
            <Skeleton className="w-full h-full bg-gray-700/30 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={(data?.trend?.length > 0) ? data.trend : [{ date: '', likes: 0, comments: 0 }]} 
                margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
              >
                <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={8} />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                  domain={([dataMin, dataMax]) => [0, isNaN(dataMax) || !isFinite(dataMax) || dataMax === 0 ? 2 : Math.ceil(dataMax * 1.2)]}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: "12px", fontSize: "12px", color: "#94a3b8" }} />
                <Line type="monotone" dataKey="likes" name="Likes" stroke="#3B82F6" strokeWidth={2.5} activeDot={{ r: 6, strokeWidth: 0, fill: "#3B82F6" }} dot={false} />
                <Line type="monotone" dataKey="comments" name="Comments" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6, strokeWidth: 0, fill: "#f59e0b" }} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstagramEngagement;
