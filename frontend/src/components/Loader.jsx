// ── Loader Component ────────────────────────────────────────────────
// Full-screen loading spinner used during auth checks and data fetching.

import { BarChart3 } from "lucide-react";

export default function Loader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      {/* ── Animated brand icon ──────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4">
        <div className="animate-glow flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-700">
          <BarChart3 className="h-8 w-8 text-white animate-pulse" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading Incubein...
        </p>
      </div>
    </div>
  );
}
