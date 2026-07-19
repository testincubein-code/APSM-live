import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, User, Mail, Phone, MapPin } from 'lucide-react';
import igapi from '@/services/igapi';

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    compactDisplay: "short"
  }).format(num);
};

const InstagramInsights = () => {
  const { isConnected } = useOutletContext();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const response = await igapi.getInsights();
        const rawActions = response.actions || [];
        const actionConfig = {
          website_clicks: { title: "Website Taps", icon: ExternalLink, color: "text-[#E1306C]" },
          email_clicks: { title: "Email Button Taps", icon: Mail, color: "text-emerald-500" },
          call_clicks: { title: "Call Button Taps", icon: Phone, color: "text-blue-500" },
          direction_clicks: { title: "Get Directions Taps", icon: MapPin, color: "text-[#FCAF45]" }
        };
        
        const actions = rawActions.map(a => ({
          ...a,
          ...actionConfig[a.id]
        })).filter(a => a.title);

        if (isMounted) setData({ actions });
      } catch (error) {
        console.error("Failed to fetch insights data:", error);
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
        <p className="text-gray-400">Please connect your Instagram account to view profile actions.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Profile Actions</h1>
          <p className="text-gray-400 mt-1">Track how users interact with your profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading || !data ? (
          [1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 bg-gray-700/50" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-gray-700/50" />
              </CardContent>
            </Card>
          ))
        ) : data.actions.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-white/5 rounded-xl bg-[#161B22]/90 backdrop-blur-md">
            <p className="text-gray-400">No profile action insights available yet. Insights will appear once users interact with your profile buttons.</p>
          </div>
        ) : (
          data.actions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.id} className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 shadow-sm hover:border-white/10 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">{action.title}</CardTitle>
                  {Icon && <Icon className={`w-4 h-4 ${action.color}`} />}
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{formatNumber(action.value)}</div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InstagramInsights;
