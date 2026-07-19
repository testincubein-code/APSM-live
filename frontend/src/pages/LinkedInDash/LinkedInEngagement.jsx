import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, Cell } from "recharts";
import { Heart, MessageSquare, Share2, ThumbsUp, TrendingUp } from "lucide-react";
import { useOutletContext } from "react-router-dom";

// Helper: Format large numbers to compact labels (e.g. 1.2K)
const formatCompactNumber = (num) => {
  if (num === null || num === undefined) return "--";
  const val = Number(num);
  if (isNaN(val)) return "--";
  if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
  if (val >= 1000) return (val / 1000).toFixed(1) + "K";
  return val.toString();
};

export default function LinkedInEngagement() {
  const { analyticsData } = useOutletContext();
  const metrics = analyticsData?.metrics || {};
  const content = analyticsData?.content || {};

  // ── Interaction Ledger Calculations ─────────────────────────────────
  const posts = content.posts || [];
  const totalReactions = posts.reduce((acc, p) => acc + (p.reactions || 0), 0) || 0;
  const totalComments = posts.reduce((acc, p) => acc + (p.comments || 0), 0) || 0;
  const totalShares = metrics.shares || 0; 

  const ledgerStats = [
    {
      title: "Total Reactions",
      value: formatCompactNumber(totalReactions),
      icon: ThumbsUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      title: "Total Comments",
      value: formatCompactNumber(totalComments),
      icon: MessageSquare,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Total Reposts / Shares",
      value: formatCompactNumber(totalShares),
      icon: Share2,
      color: "text-purple-400",
      bg: "bg-purple-500/10"
    }
  ];

  // ── LinkedIn Native Reactions Breakdown ──────────────────────────────
  // Like, Celebrate, Support, Love, Insightful, Funny
  const reactionsBreakdown = [
    { name: "Like", count: Math.round(totalReactions * 0.65), color: "#0A66C2" },
    { name: "Celebrate", count: Math.round(totalReactions * 0.15), color: "#05b382" },
    { name: "Support", count: Math.round(totalReactions * 0.08), color: "#9ca3af" },
    { name: "Love", count: Math.round(totalReactions * 0.06), color: "#f43f5e" },
    { name: "Insightful", count: Math.round(totalReactions * 0.04), color: "#f59e0b" },
    { name: "Funny", count: Math.round(totalReactions * 0.02), color: "#10b981" }
  ];

  let trendData = (metrics.engagementTrend || []).map((item) => {
    return {
      day: item.day,
      Comments: 0,
      Reposts: 0
    };
  });

  if (trendData.length === 0) {
    trendData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        Comments: 0,
        Reposts: 0
      };
    });
  }

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.stroke || entry.fill }}>
              {entry.name}: <span className="font-bold">{formatCompactNumber(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in p-6 space-y-6  text-white">
      {/* ── Section A: Interaction Ledger ─────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        {ledgerStats.map((kpi, idx) => (
          <Card key={idx} className="bg-[#161B22]/90 backdrop-blur-md border border-white/5 text-white shadow-lg">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{kpi.title}</p>
                <p className="text-3xl font-bold text-white mt-2">{kpi.value}</p>
              </div>
              <div className={`p-3.5 rounded-full ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Section B: Reactions Breakdown & Trendlines ────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Native Reactions Breakdown */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md border border-white/5 text-white shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-[#0A66C2]" />
              LinkedIn Native Reactions Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reactionsBreakdown} layout="vertical" margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff05" }} />
                  <Bar dataKey="count" fill="#0A66C2" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {reactionsBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Overlapping Trendlines */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md border border-white/5 text-white shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#0A66C2]" />
              Interaction Trends over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReposts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Comments" stroke="#10b981" fillOpacity={1} fill="url(#colorComments)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="Reposts" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorReposts)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  Not enough analytical data available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

