import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaySquare, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import igapi from '@/services/igapi';

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    compactDisplay: "short"
  }).format(num);
};

const InstagramReels = () => {
  const { isConnected } = useOutletContext();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const response = await igapi.getReels();
        const items = response.items || [];
        if (isMounted) setData({ items });
      } catch (error) {
        console.error("Failed to fetch reels data:", error);
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
        <p className="text-gray-400">Please connect your Instagram account to view reels metrics.</p>
      </div>
    );
  }

  const totalPlays = data ? data.items.reduce((a, b) => a + (b.plays || b.views || 0), 0) : 0;

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Reels Performance</h1>
          <p className="text-gray-400 mt-1">Short-form video specific analytics</p>
        </div>
      </div>

      <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">Total Plays (Selected Period)</p>
            {isLoading || !data ? (
              <Skeleton className="h-10 w-32 bg-gray-700/50 mt-2" />
            ) : (
              <h2 className="text-4xl font-bold text-white mt-1">{formatNumber(totalPlays)}</h2>
            )}
          </div>
          <PlaySquare className="w-12 h-12 text-[#E1306C] opacity-50" />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Top Performing Reels</h2>
        {isLoading || !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-96 w-full bg-gray-700/30 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.items.map((reel) => (
              <Card key={reel.id} className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden group hover:border-white/10 transition-all shadow-sm">
                <div className="relative h-72 w-full">
                  <img src={reel.image} alt={reel.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1121] via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                    <PlaySquare className="w-3 h-3 text-white" />
                    <span className="text-white text-xs font-semibold">{formatNumber(reel.plays || reel.views || 0)}</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-white font-medium text-sm line-clamp-2 mb-3">{reel.caption || "Reel"}</h3>
                  <div className="grid grid-cols-4 gap-1 border-t border-white/5 pt-3">
                    <div className="flex flex-col items-center">
                      <Heart className="w-3 h-3 text-gray-500 mb-1" />
                      <span className="text-gray-300 text-xs">{formatNumber(reel.likes)}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <MessageCircle className="w-3 h-3 text-gray-500 mb-1" />
                      <span className="text-gray-300 text-xs">{formatNumber(reel.comments)}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Share2 className="w-3 h-3 text-gray-500 mb-1" />
                      <span className="text-gray-300 text-xs">{formatNumber(reel.shares)}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Bookmark className="w-3 h-3 text-gray-500 mb-1" />
                      <span className="text-gray-300 text-xs">{formatNumber(reel.saves)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramReels;
