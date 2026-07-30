import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PLATFORM_CONFIG } from '@/pages/CombinedOverview/config';
import { Flame, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import fbapi from '@/services/fbapi';
import igapi from '@/services/igapi';
import { fetchYouTubeAnalytics } from '@/services/ytapi';
import linkedinApi from '@/services/linkedinApi';
import api from '@/services/api';

const UnifiedContentFeed = () => {
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchFeed = async () => {
      // ── MOCK DATA TOGGLE ──────────────────────────────────────────────
      const USE_MOCK_DATA = false;

      if (USE_MOCK_DATA) {
        if (mounted) {
          setFeed([
            { id: '1', platform: 'instagram', title: 'Summer Collection Drop', thumbnail: 'https://placehold.co/150', engagement: 14500, date: new Date().toISOString(), link: '#' },
            { id: '2', platform: 'youtube', title: 'Behind the Scenes VLOG', thumbnail: 'https://placehold.co/150', engagement: 12000, date: new Date().toISOString(), link: '#' },
            { id: '3', platform: 'facebook', title: 'Huge Giveaway Announcement!', thumbnail: 'https://placehold.co/150', engagement: 8400, date: new Date().toISOString(), link: '#' },
            { id: '4', platform: 'linkedin', title: 'Q3 Business Highlights', thumbnail: 'https://placehold.co/150', engagement: 3200, date: new Date().toISOString(), link: '#' },
            { id: '5', platform: 'instagram', title: 'Team Retreat 2026', thumbnail: 'https://placehold.co/150', engagement: 2100, date: new Date().toISOString(), link: '#' },
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

        const allPosts = [];

        // Fetch Facebook Posts
        if (isConnected('facebook')) {
          try {
            const fbData = await fbapi.getEngagementMetrics?.();
            if (fbData?.tables?.topPosts) {
              fbData.tables.topPosts.forEach(p => {
                allPosts.push({
                  id: p.id,
                  platform: 'facebook',
                  title: p.text || 'Facebook Post',
                  thumbnail: p.thumbnail || p.image || 'https://placehold.co/150',
                  engagement: p.engagements || p.engagement || 0,
                  date: p.date,
                  link: `https://facebook.com/${p.id}`,
                });
              });
            }
          } catch (e) { console.warn('FB Feed error', e); }
        }

        // Fetch Instagram Posts
        if (isConnected('instagram')) {
          try {
            const igData = await igapi.getContent?.();
            if (igData?.posts) {
              igData.posts.forEach(p => {
                allPosts.push({
                  id: p.id,
                  platform: 'instagram',
                  title: p.caption || 'Instagram Post',
                  thumbnail: p.media_url || p.thumbnail || 'https://placehold.co/150',
                  engagement: p.engagement || (p.like_count || 0) + (p.comments_count || 0),
                  date: p.timestamp,
                  link: p.permalink || `https://instagram.com/p/${p.id}`,
                });
              });
            }
          } catch (e) { console.warn('IG Feed error', e); }
        }

        // Fetch YouTube Videos
        if (isConnected('youtube')) {
          try {
            const ytData = await fetchYouTubeAnalytics();
            if (ytData?.recentVideos) {
              ytData.recentVideos.forEach(v => {
                allPosts.push({
                  id: v.id,
                  platform: 'youtube',
                  title: v.title || 'YouTube Video',
                  thumbnail: v.thumbnail || 'https://placehold.co/150',
                  engagement: (v.likes || 0) + (v.comments || 0) + (v.shares || 0),
                  date: v.publishedAt,
                  link: `https://youtube.com/watch?v=${v.id}`,
                });
              });
            }
          } catch (e) { console.warn('YT Feed error', e); }
        }

        // Fetch LinkedIn Posts
        if (isConnected('linkedin')) {
          try {
            const liRes = await linkedinApi.getLinkedInAnalytics();
            const liData = liRes?.data?.[0]?.content?.posts || [];
            liData.forEach(p => {
              allPosts.push({
                id: p.id,
                platform: 'linkedin',
                title: p.text || 'LinkedIn Post',
                thumbnail: p.image || 'https://placehold.co/150',
                engagement: (p.clicks || 0) + (p.likes || 0) + (p.comments || 0) + (p.shares || 0),
                date: p.date || p.createdAt,
                link: p.url || '#',
              });
            });
          } catch (e) { console.warn('LI Feed error', e); }
        }

        // Sort by engagement and take top 6
        const sorted = allPosts.sort((a, b) => b.engagement - a.engagement).slice(0, 6);

        if (mounted) {
          setFeed(sorted);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch unified feed:", err);
        if (mounted) setIsLoading(false);
      }
    };

    fetchFeed();
    return () => { mounted = false; };
  }, []);

  return (
    <Card className="bg-[#0D1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl col-span-12 lg:col-span-6 flex flex-col">
      <CardHeader className="border-b border-white/5 bg-white/[0.02] shrink-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white tracking-wide uppercase">
          <Flame className="w-4 h-4 text-orange-500" />
          Global Top Performing Content
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto min-h-[300px]">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="w-16 h-16 rounded-xl bg-white/5 shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4 bg-white/5" />
                  <Skeleton className="h-3 w-1/4 bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-slate-500 text-sm">
            No content found across connected platforms.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {feed.map((post, idx) => {
              const cfg = PLATFORM_CONFIG[post.platform];
              const IconComp = cfg?.icon;
              return (
                <div key={`${post.platform}-${post.id}-${idx}`} className="p-4 flex gap-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5">
                    <img src={post.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                    {IconComp && (
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: cfg.color }}>
                        <IconComp className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-sm font-medium text-white line-clamp-2 leading-snug">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="font-semibold text-emerald-400">
                        {post.engagement.toLocaleString()} Engagements
                      </span>
                      <span>•</span>
                      <span>{post.date ? new Date(post.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  <a href={post.link} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-white self-center">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedContentFeed;
