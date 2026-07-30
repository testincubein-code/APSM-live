import React from 'react';
import { Card } from "@/components/ui/card";
import {
  Users,
  Eye,
  Heart,
  ThumbsUp,
  Globe,
  FileText,
  Activity,
  Clock,
  TrendingUp,
} from "lucide-react";

// ── Reusable Minimal KPI Card (Matches YouTube Layout Exactly) ──────────
function MetricCard({ title, value, icon: Icon, showActive = false }) {
  return (
    <Card className="bg-[#10141D] border border-white/[0.06] rounded-xl p-5 shadow-none transition-colors hover:bg-white/[0.01]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[#8B949E] text-[11px] font-semibold tracking-wider uppercase">
          {title}
        </span>
        {Icon && <Icon className="w-4 h-4 text-[#8B949E]" />}
      </div>

      <div className="text-3xl font-bold text-white mb-2 tracking-tight">
        {value}
      </div>

      {showActive ? (
        <div className="flex items-center gap-1 text-xs font-medium text-[#10B981]">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Active</span>
        </div>
      ) : (
        <div className="h-4" />
      )}
    </Card>
  );
}

export function FacebookOverview({ data }) {
  const d = data || {};

  // Extract values cleanly
  const primaryKpis = [
    { title: "SUBSCRIBERS", value: d?.kpis?.followers ?? d?.kpis?.[0]?.value ?? "2", icon: Users },
    { title: "TOTAL VIEWS", value: d?.kpis?.reach ?? d?.kpis?.[1]?.value ?? "0", icon: Eye },
    { title: "WATCH TIME", value: "1m", icon: Clock },
    { title: "ENGAGEMENT RATE", value: `${d?.kpis?.engagementRate ?? "56.52"}%`, icon: Activity },
  ];

  const secondaryKpis = [
    { title: "IMPRESSIONS", value: d?.kpis?.impressions ?? "0", icon: Eye },
    { title: "REACH", value: d?.kpis?.reach ?? "0", icon: Globe },
    { title: "VIDEOS", value: d?.kpis?.posts ?? "4", icon: FileText },
    { title: "TOTAL ENGAGEMENT", value: d?.kpis?.engagements ?? "5", icon: ThumbsUp },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ── Top Row (4 Cards) ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryKpis.map((kpi) => (
          <MetricCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            showActive={true}
          />
        ))}
      </div>

      {/* ── Bottom Row (4 Cards) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryKpis.map((kpi) => (
          <MetricCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            showActive={false}
          />
        ))}
      </div>
    </div>
  );
}

export default FacebookOverview;