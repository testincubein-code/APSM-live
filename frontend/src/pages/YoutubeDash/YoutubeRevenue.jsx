// ── YouTube Revenue Page ────────────────────────────────────────────
// Professional empty state for revenue/monetization analytics.
// Revenue data requires YouTube Partner Program (YPP) access which
// is not yet integrated. Shows a polished placeholder with status info.

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Banknote,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

// ── Skeleton loading state ──────────────────────────────────────────
function RevenueSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-white/10">
            <CardContent className="p-5">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-7 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Main Revenue Component ──────────────────────────────────────────
export default function YoutubeRevenue({ loading, data }) {
  // ── Loading state ─────────────────────────────────────────────────
  if (loading) return <RevenueSkeleton />;

  // ── Revenue metric placeholders ───────────────────────────────────
  const revenueMetrics = [
    {
      title: "Estimated Revenue",
      value: "--",
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "RPM",
      value: "--",
      subtitle: "Revenue per mille",
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "CPM",
      value: "--",
      subtitle: "Cost per mille",
      icon: BarChart3,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      title: "Ad Revenue",
      value: "--",
      icon: Banknote,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Monetisation Status Banner ────────────────────────────────── */}
      <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertCircle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-300">Monetisation Not Connected</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Revenue analytics require access to the YouTube Partner Program (YPP).
                Once your channel is enrolled in YPP and monetisation data access is enabled,
                revenue metrics will automatically appear here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Revenue Metric Cards (disabled state) ─────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {revenueMetrics.map((metric) => (
          <Card
            key={metric.title}
            className="border-white/10 bg-white/5 dark:backdrop-blur-sm shadow-sm shadow-none opacity-50"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {metric.title}
                  </p>
                  <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-400">
                    {metric.value}
                  </p>
                  {metric.subtitle && (
                    <p className="mt-0.5 text-xs text-slate-400/60">{metric.subtitle}</p>
                  )}
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.bg} opacity-50`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Revenue Chart Placeholder ─────────────────────────────────── */}
      <Card className="border-white/10 bg-white/5 dark:backdrop-blur-sm shadow-sm shadow-none opacity-50">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <DollarSign className="h-10 w-10 text-emerald-400" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500/30 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold">Revenue Trends</h2>
            <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
              Revenue trend charts, ad performance graphs, and earning breakdowns
              will be displayed here once monetisation is enabled for your channel.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Requirements Info ─────────────────────────────────────────── */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-lg shadow-sm shadow-none">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">YouTube Partner Program Requirements</h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  1,000+ subscribers
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  4,000+ hours of watch time in the last 12 months
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  Linked AdSense account
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  Compliance with YouTube monetisation policies
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
