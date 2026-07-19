import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import igapi from '@/services/igapi';

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    compactDisplay: "short"
  }).format(num);
};

const InstagramContent = () => {
  const { isConnected } = useOutletContext();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const response = await igapi.getContent();
        if (isMounted) setData(response);
      } catch (error) {
        console.error("Failed to fetch content performance:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (isConnected) fetchData();
    else setIsLoading(false);
    return () => { isMounted = false; };
  }, [isConnected]);

  const filters = ['All', 'Posts', 'Reels'];

  const filteredPosts = data?.posts?.filter(p => {
    if (filter === 'All') return true;
    if (filter === 'Reels') return p.type === 'Reel' || p.type === 'VIDEO';
    if (filter === 'Posts') return p.type === 'Post' || p.type === 'Carousel' || p.type === 'IMAGE' || p.type === 'CAROUSEL_ALBUM';
    return true;
  }) || [];

  if (!isConnected) {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl text-white font-semibold mb-2">Account Disconnected</h2>
        <p className="text-gray-400">Please connect your Instagram account to view content metrics.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Performance</h1>
          <p className="text-gray-400 mt-1">Analyze your posts, reels, and carousels</p>
        </div>
        
        {/* Filters */}
        <div className="flex bg-[#161B22]/90 backdrop-blur-md rounded-xl p-1 rounded-lg border border-white/5 overflow-x-auto custom-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === f ? 'bg-[#E1306C]/20 text-[#E1306C]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
              <CardContent className="p-0">
                <Skeleton className="w-full h-48 bg-gray-700/50 rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-gray-700/50" />
                  <Skeleton className="h-4 w-1/2 bg-gray-700/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 text-center border border-white/5 rounded-xl bg-[#161B22]/90 backdrop-blur-md rounded-xl">
          <p className="text-gray-400">Not enough data available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden hover:border-white/10 transition-colors">
              <div className="relative h-48">
                <img src={post.image} alt={post.type} className="w-full h-full object-cover" />
                <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-xs text-white px-2 py-1 rounded-md font-medium border border-white/10">
                  {post.type}
                </span>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4 text-gray-400 text-sm">
                  <span>Reach: <strong className="text-white">{formatNumber(post.reach)}</strong></span>
                  <span className="text-[#E1306C] font-semibold">
                    {post.reach ? ((post.likes + post.comments) / post.reach * 100).toFixed(1) + '% ER' : 'N/A'}
                  </span>
                </div>
                
                <div className="grid grid-cols-4 gap-2 border-t border-white/5 pt-4">
                  <div className="flex flex-col items-center">
                    <Heart className="w-4 h-4 text-gray-500 mb-1" />
                    <span className="text-white text-xs font-medium">{formatNumber(post.likes)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <MessageCircle className="w-4 h-4 text-gray-500 mb-1" />
                    <span className="text-white text-xs font-medium">{formatNumber(post.comments)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Share2 className="w-4 h-4 text-gray-500 mb-1" />
                    <span className="text-white text-xs font-medium">{formatNumber(post.shares)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Bookmark className="w-4 h-4 text-gray-500 mb-1" />
                    <span className="text-white text-xs font-medium">{formatNumber(post.saves)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstagramContent;
