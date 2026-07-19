// ── Cross-Posting Dashboard ─────────────────────────────────────────
// Scheduling and post publishing panel for multi-platform cross-posting.

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Plus, CheckCircle2, Link2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Youtube, Linkedin, Facebook, Instagram } from "@/components/icons/BrandIcons";
import ConfirmDisconnectModal from "@/components/ConfirmDisconnectModal";
import api from "@/services/api";

const SUPPORTED_PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-500", bg: "bg-blue-500/10", description: "Connect to cross-post to your pages and communities." },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500", bg: "bg-pink-500/10", description: "Connect to schedule posts and reels." },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-500", bg: "bg-red-500/10", description: "Connect to publish videos and track views." },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-600", bg: "bg-blue-600/10", description: "Connect to share professional updates." },
];

export default function CrossPostingDash() {
  const navigate = useNavigate();
  
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [disconnectTarget, setDisconnectTarget] = useState(null);

  useEffect(() => {
    const fetchConnectionStatus = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/auth/status'); // Use your existing configured axios instance
        
        // 1. SAFELY EXTRACT THE ARRAY
        // Backends wrap arrays differently. We check the most common nested paths.
        const rawPayload = response.data;
        const statusArray = Array.isArray(rawPayload) 
          ? rawPayload 
          : (rawPayload?.data || rawPayload?.status || rawPayload?.connections || []);

        // CRITICAL DEBUG: Check the browser console to see EXACTLY what the backend sent
        console.log("Extracted Auth Status Array:", statusArray);

        // 2. SORT THE PLATFORMS
        const connected = [];
        const available = [];

        SUPPORTED_PLATFORMS.forEach(platform => {
          // Use case-insensitive matching and explicit boolean checks
          const isConnected = statusArray.some(
            statusItem => 
              String(statusItem.platform).toLowerCase() === String(platform.id).toLowerCase() && 
              statusItem.connected === true
          );

          if (isConnected) {
            connected.push(platform);
          } else {
            available.push(platform);
          }
        });

        // 3. UPDATE STATE
        setConnectedPlatforms(connected);
        setAvailablePlatforms(available);

      } catch (error) {
        console.error("Cross-Posting Status Fetch Error:", error);
        // Fallback: If network fails, show all as available
        setConnectedPlatforms([]);
        setAvailablePlatforms(SUPPORTED_PLATFORMS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnectionStatus();
  }, []);

  // ── Platform connect handler ──────────────────────────────────────
  // Sets the correct returnPath for the OAuth trampoline before redirecting.
  const handleConnectPlatform = (platformId) => {
    const token = localStorage.getItem("incubein_token");
    if (!token) { console.error("No auth token found."); return; }

    // Map each platform to its correct return destination
    const returnPaths = {
      facebook: "/dashboard/meta/facebook",
      instagram: "/dashboard/meta/instagram",
      youtube: "/dashboard/youtube",
      linkedin: "/dashboard/linkedin",
    };
    localStorage.setItem("returnPath", returnPaths[platformId] ?? "/dashboard/youtube");
    window.location.href = `http://localhost:5000/auth/${platformId}?token=${token}`;
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 p-2 md:p-6 space-y-6 animate-fade-in -m-6 sm:-m-8 relative overflow-hidden">
      {/* ── Background Gradient Orbs ──────────────────────────────────── */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      
      <ConfirmDisconnectModal 
        isOpen={!!disconnectTarget} 
        onClose={() => setDisconnectTarget(null)} 
        onConfirm={async () => {
          if (disconnectTarget) {
            try {
              await crosspostApi.revokeAccess(disconnectTarget);
              window.location.reload();
            } catch (err) {
              console.error("Failed to disconnect", err);
            }
          }
          setDisconnectTarget(null);
        }} 
      />
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-6 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <Send className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Cross-Posting</h2>
            <p className="text-sm text-muted-foreground">Schedule and publish across platforms</p>
          </div>
        </div>
        <Button className="gap-2" id="crosspost-new-btn" onClick={() => navigate("/dashboard/crosspost/new")}>
          <Plus className="h-4 w-4" /> New Post
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : connectedPlatforms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Link2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No platforms connected yet.</h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Select one below to get started and unlock cross-posting capabilities.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {SUPPORTED_PLATFORMS.map(platform => (
                <Button key={platform.id} variant="outline" className="gap-2">
                  <platform.icon className={`h-4 w-4 ${platform.color}`} />
                  Connect {platform.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {/* Active Workspaces */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Active Workspaces</h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 px-4">
              {connectedPlatforms.map(platform => (
                <Card key={platform.id} className="relative overflow-hidden transition-all hover:border-primary/50 bg-white/5 border border-white/10 shadow-none">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${platform.bg}`}>
                          <platform.icon className={`h-6 w-6 ${platform.color}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-100">{platform.name}</h4>
                          <p className="text-sm text-slate-400">Workspace active</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Connected
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setDisconnectTarget(platform.id)} className="h-6 text-xs text-muted-foreground hover:text-red-500 px-2">
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Available to Connect */}
          {availablePlatforms.length > 0 && (
            <div className="mt-10 px-4">
              <h3 className="text-lg font-medium text-slate-100 mb-4">Available to Connect</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {availablePlatforms.map(platform => (
                  <Card key={platform.id} className="opacity-80 border-dashed border-white/10 bg-white/5 transition-all hover:opacity-100 hover:border-primary/50">
                    <CardContent className="p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <platform.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h4 className="font-semibold text-muted-foreground">{platform.name}</h4>
                      </div>
                      <p className="text-sm text-slate-400 flex-1">{platform.description}</p>
                      <Button
                        variant="secondary"
                        className="w-full bg-white/10 text-slate-100 border border-transparent hover:bg-white/20"
                        onClick={() => handleConnectPlatform(platform.id)}
                      >
                        Connect Account
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

