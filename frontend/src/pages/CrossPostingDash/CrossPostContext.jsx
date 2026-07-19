// ── Cross-Post Context Provider ─────────────────────────────────────
// Provides shared state for the cross-posting module:
//   - postHistory: Array of successfully submitted posts (persists across
//     navigation between the Hub and Create views).
//   - addToHistory: Function to append a new entry after a successful POST.
//
// This context wraps the /dashboard/crosspost/* routes via CrossPostLayout.

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import crosspostApi from "@/services/crosspostApi";
import { toast } from "@/hooks/use-toast";

// ── Context Definition ──────────────────────────────────────────────
const CrossPostContext = createContext(null);

// ── Provider Component ──────────────────────────────────────────────
export function CrossPostProvider({ children }) {
  // ── Persistent post history state ─────────────────────────────────
  // Survives navigation between /crosspost and /crosspost/new because
  // the provider wraps both routes in the layout component.
  const [postHistory, setPostHistory] = useState([]);
  
  // ── Auth / Connection State ───────────────────────────────────────
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // ── Fetch Connected Platforms once on mount ───────────────────────
  useEffect(() => {
    let mounted = true;
    const fetchAuth = async () => {
      try {
        const statusArray = await crosspostApi.getConnectionStatus();
        const connectedIds = statusArray
          .filter(s => s.connected === true)
          .map(s => String(s.platform).toLowerCase());

        if (mounted) setConnectedPlatforms(connectedIds);
      } catch (err) {
        console.error("Failed to fetch auth status in context", err);
        toast({
          title: "Error",
          description: "Failed to load connected platforms",
          variant: "destructive"
        });
      }

      try {
        const history = await crosspostApi.getHistory();
        if (mounted) setPostHistory(history);
      } catch (err) {
        console.error("Failed to fetch post history", err);
      } finally {
        if (mounted) setIsLoadingAuth(false);
      }
    };
    fetchAuth();
    return () => { mounted = false; };
  }, []);

  // ── Append a new post to history ──────────────────────────────────
  const addToHistory = useCallback((entry) => {
    setPostHistory((prev) => [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...entry,
      },
      ...prev, // newest first
    ]);
  }, []);

  return (
    <CrossPostContext.Provider value={{ postHistory, addToHistory, connectedPlatforms, isLoadingAuth }}>
      {children}
    </CrossPostContext.Provider>
  );
}

// ── Consumer Hook ───────────────────────────────────────────────────
export function useCrossPost() {
  const ctx = useContext(CrossPostContext);
  if (!ctx) {
    throw new Error("useCrossPost must be used within a CrossPostProvider");
  }
  return ctx;
}
