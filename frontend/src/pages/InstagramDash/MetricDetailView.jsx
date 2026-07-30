import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft } from 'lucide-react';
import igapi from '@/services/igapi';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
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
      <div style={{
        backgroundColor: 'rgba(22, 27, 34, 0.85)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: '1px',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <p className="font-semibold text-gray-200 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1 last:mb-0">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="font-medium text-white">
              {formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const MetricDetailView = () => {
  const { metricId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Format the metric ID for display
  const title = metricId 
    ? metricId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'Metric Detail';

  useEffect(() => {
    let isMounted = true;
    
    const fetchMetricData = async () => {
      try {
        setIsLoading(true);
        const historyData = await igapi.getMetricHistory(metricId);
        if (isMounted) {
          setData(historyData);
        }
      } catch (error) {
        console.error(`Failed to fetch history for ${metricId}`, error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (metricId) fetchMetricData();

    return () => {
      isMounted = false;
    };
  }, [metricId]);

  return (
    <div className="p-4 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/instagram')}
          className="text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Overview
        </Button>
      </div>

      <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 shadow-sm rounded-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-2xl text-white font-semibold">
            {title} Details
          </CardTitle>
          <p className="text-sm text-gray-400">Deep dive historical performance for {title.toLowerCase()}</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[400px]">
            {isLoading || !data ? (
              <Skeleton className="w-full h-full bg-gray-700/30 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={(data?.history?.length > 0) ? data.history : [{ date: '', value: 0 }]} 
                  margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E1306C" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#E1306C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => formatNumber(value)} 
                    allowDecimals={false}
                    domain={([dataMin, dataMax]) => [0, isNaN(dataMax) || !isFinite(dataMax) || dataMax === 0 ? 2 : Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="value" stroke="#E1306C" strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricDetailView;
