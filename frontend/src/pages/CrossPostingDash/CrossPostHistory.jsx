import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCrossPost } from "./CrossPostContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Image as ImageIcon, MoreHorizontal, X, ExternalLink } from "lucide-react";
import { Youtube, Linkedin, Facebook, Instagram } from "@/components/icons/BrandIcons";

const SUPPORTED_PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-[#1877f2]" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-[#bc1888]" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-[#ff0000]" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-[#0077b5]" },
];

export default function CrossPostHistory() {
  const navigate = useNavigate();
  const { postHistory } = useCrossPost();
  const [selectedPost, setSelectedPost] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Published": return "bg-emerald-500/10 text-emerald-400";
      case "Scheduled": return "bg-amber-500/10 text-amber-400";
      case "Failed": return "bg-red-500/10 text-red-400";
      case "Partial": return "bg-orange-500/10 text-orange-400";
      default: return "bg-slate-500/10 text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] text-slate-100 p-2 md:p-6 space-y-6 animate-fade-in -m-6 sm:-m-8 relative overflow-x-hidden">
      
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-6 px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-white/5">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Automation History</h2>
          <p className="text-sm text-slate-400">View detailed history of all your cross-posting tasks</p>
        </div>
      </div>

      <div className="px-4 pb-20">
        <Card className="bg-[#141720] border-white/5 shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-500 uppercase bg-[#1e2230] border-b border-white/5">
                <tr>
                  <th className="px-4 py-4 font-medium">Content</th>
                  <th className="px-4 py-4 font-medium">Platforms</th>
                  <th className="px-4 py-4 font-medium">Status</th>
                  <th className="px-4 py-4 font-medium">Date</th>
                  <th className="px-4 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {postHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                      No recent activity found.
                    </td>
                  </tr>
                ) : (
                  postHistory.map((post) => (
                    <tr 
                      key={post.id} 
                      onClick={() => setSelectedPost(post)}
                      className="hover:bg-white/[0.05] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {post.thumbnail ? (
                            <img src={post.thumbnail} className="h-10 w-10 rounded object-cover border border-white/10" alt="thumb" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-[#1e2230] flex items-center justify-center border border-white/10">
                              <ImageIcon className="h-5 w-5 text-slate-600" />
                            </div>
                          )}
                          <div>
                            <p className="truncate max-w-[200px] font-semibold text-slate-200">
                              {post.title || post.caption || "No Title"}
                            </p>
                            <p className="truncate max-w-[200px] text-xs text-slate-500">
                              {post.body || post.caption || ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          {post.platforms.map(p => {
                            const config = SUPPORTED_PLATFORMS.find(cp => cp.id === String(p).toLowerCase());
                            if (!config) return null;
                            return <config.icon key={p} className={`h-5 w-5 ${config.color}`} title={config.name} />;
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${getStatusBadge(post.status)}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString() : new Date(post.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="text-slate-500 hover:text-slate-300">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Slide-Over Panel ─────────────────────────────────────────── */}
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${selectedPost ? "opacity-100" : "opacity-0 pointer-events-none"}`} 
        onClick={() => setSelectedPost(null)}
      />

      {/* Panel */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#141720] border-l border-white/10 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${selectedPost ? "translate-x-0" : "translate-x-full"}`}>
        
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#1e2230]">
          <h3 className="text-lg font-semibold text-slate-100">Post Details</h3>
          <button onClick={() => setSelectedPost(null)} className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Panel Content */}
        {selectedPost && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Header Info */}
            <div className="flex items-start gap-4">
              {selectedPost.thumbnail ? (
                 <img src={selectedPost.thumbnail} className="w-24 h-24 rounded-lg object-cover border border-white/10 shadow-md" alt="Media" />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-[#1e2230] flex items-center justify-center border border-white/10">
                  <ImageIcon className="h-8 w-8 text-slate-600" />
                </div>
              )}
              <div className="space-y-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${getStatusBadge(selectedPost.status)}`}>
                  {selectedPost.status}
                </span>
                <p className="text-xs text-slate-400">
                  {new Date(selectedPost.scheduledFor || selectedPost.createdAt).toLocaleString()}
                </p>
                <div className="flex gap-1.5 pt-1">
                  {selectedPost.platforms.map(p => {
                    const config = SUPPORTED_PLATFORMS.find(cp => cp.id === String(p).toLowerCase());
                    if (!config) return null;
                    return <config.icon key={p} className={`h-4 w-4 ${config.color}`} title={config.name} />;
                  })}
                </div>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Post Data */}
            <div className="space-y-6">
              
              {selectedPost.title && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Title / Headline</label>
                  <p className="text-slate-200 text-sm leading-relaxed font-medium bg-[#1e2230] p-3 rounded-lg border border-white/5">
                    {selectedPost.title}
                  </p>
                </div>
              )}

              {(selectedPost.body || selectedPost.caption) && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Body / Description</label>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-[#1e2230] p-3 rounded-lg border border-white/5">
                    {selectedPost.body || selectedPost.caption}
                  </p>
                </div>
              )}

              {selectedPost.hashtags && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Hashtags</label>
                  <p className="text-[#6366f1] text-sm font-medium bg-[#1e2230] p-3 rounded-lg border border-white/5">
                    {selectedPost.hashtags}
                  </p>
                </div>
              )}

              {selectedPost.link && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Link</label>
                  <a href={selectedPost.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 bg-[#1e2230] p-3 rounded-lg border border-white/5 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                    <span className="truncate">{selectedPost.link}</span>
                  </a>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>

    </div>
  );
}
