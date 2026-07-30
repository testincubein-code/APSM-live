// ── YouTube Playlists Page ──────────────────────────────────────────
// Professional empty state for playlist analytics.
// Playlist-level performance data is not yet available from the backend.
// This page displays a polished placeholder with helpful messaging.

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ListVideo, Play, Clock, Eye, TrendingUp, Calendar, LayoutList } from "lucide-react";
import { parsePlaylists, formatRelativeTime } from "@/services/ytapi";

// ── Skeleton loading state ──────────────────────────────────────────
function PlaylistsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-white/10">
            <CardContent className="p-5">
              <Skeleton className="h-32 w-full rounded-lg mb-3" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Main Playlists Component ────────────────────────────────────────
export default function YoutubePlaylists({ loading, data }) {
  // ── Loading state ─────────────────────────────────────────────────
  if (loading) return <PlaylistsSkeleton />;

  const playlists = parsePlaylists(data);

  if (!playlists || playlists.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* ── Empty State Hero ──────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center text-center py-12">
          {/* Animated icon */}
          <div className="relative mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/10 ring-1 ring-violet-500/20">
              <ListVideo className="h-10 w-10 text-violet-400" />
            </div>
            {/* Decorative dot */}
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-violet-500/30 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold">No Playlists Found</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
            We couldn't find any public playlists for your channel. 
            Once you create playlists on YouTube, they will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Your Playlists</h2>
          <p className="text-sm text-slate-400 mt-1">
            Total {playlists.length} playlists found on your channel
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {playlists.map((playlist) => (
          <Card key={playlist.id} className="border-white/10 bg-[#161B22]/90 backdrop-blur-md overflow-hidden hover:border-violet-500/30 transition-colors group">
            {/* Playlist Thumbnail */}
            <div className="relative aspect-video w-full bg-black/40 overflow-hidden">
              {playlist.thumbnail ? (
                <img
                  src={playlist.thumbnail}
                  alt={playlist.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ListVideo className="h-10 w-10 text-white/20" />
                </div>
              )}
              {/* Overlay with video count */}
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center border-l border-white/10">
                <span className="text-xl font-bold text-white">{playlist.itemCount}</span>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider mt-1 font-semibold">Videos</span>
                <LayoutList className="h-5 w-5 text-white/50 mt-3" />
              </div>
            </div>
            
            <CardContent className="p-5">
              <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-violet-400 transition-colors">
                {playlist.title}
              </h3>
              
              {playlist.description ? (
                <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {playlist.description}
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500 italic">No description provided.</p>
              )}
              
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatRelativeTime(playlist.publishedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
