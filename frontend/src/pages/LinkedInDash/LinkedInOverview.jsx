import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Users, Search, Eye, MousePointerClick, TrendingUp, Link2, Share2, FileText, Globe } from "lucide-react";
import { useOutletContext } from "react-router-dom";

// ── Shared KpiCard Component ──────────────────────────────────────────
function KpiCard({ title, value, showActive, icon: Icon }) {
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

// Helper: Format large numbers to compact labels (e.g. 1.2K)
const formatCompactNumber = (num) => {
  if (num === null || num === undefined) return "--";
  const val = Number(num);
  if (isNaN(val)) return "--";
  if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
  if (val >= 1000) return (val / 1000).toFixed(1) + "K";
  return val.toString();
};

export default function LinkedInOverview() {
  const { analyticsData } = useOutletContext();
  
  // ── Safe Data Extraction & Default Schema ─────────────────────────
  const metrics = analyticsData?.metrics || {};
  const rawData = analyticsData?.rawPlatformData || {};
  const demographics = analyticsData?.demographics || {};
  const content = analyticsData?.content || {};

  // ── Mock Profile Info Fallbacks ──────────────────────────────────
  const profileInfo = {
    avatar: analyticsData?.profile?.avatar || "",
    name: analyticsData?.profile?.name || "LinkedIn Page",
    headline: analyticsData?.profile?.headline || "",
    connections: rawData.connections || 0,
    followers: metrics.followers || rawData.followers || 0,
    pageType: analyticsData?.profile?.pageType || "Company" // "Company" or "Individual"
  };

  // ── Dynamic Engagement Rate Aggregation & Calculations ────────────
  // Formula: ((Reactions + Comments + Shares + Clicks) / Total Impressions) * 100
  const allPosts = content.posts || [];
  const totalImpressions = metrics.impressions || allPosts.reduce((acc, p) => acc + (p.impressions || 0), 0) || 0;
  const totalReactions = allPosts.reduce((acc, p) => acc + (p.reactions || 0), 0) || 0;
  const totalComments = allPosts.reduce((acc, p) => acc + (p.comments || 0), 0) || 0;
  const totalClicks = rawData.clicks || metrics.clicks || allPosts.reduce((acc, p) => acc + (p.clicks || 0), 0) || 0;
  const totalShares = metrics.shares || 0; 

  const calculatedEngagementRate = totalImpressions > 0 
    ? (((totalReactions + totalComments + totalShares + totalClicks) / totalImpressions) * 100).toFixed(2)
    : "0.00";

  // ── Dual-Axis composed chart data mapping ─────────────────────────
  let composedData = (metrics.impressionsTrend || []).map((impItem) => {
    const engItem = (metrics.engagementTrend || []).find(e => e.day === impItem.day);
    const rateDec = engItem ? Number(engItem.value) : 0;
    return {
      day: impItem.day,
      impressions: impItem.value || 0,
      engagementRate: Number((rateDec * 100).toFixed(2)) // Decimal fraction converted to percentage
    };
  });



  // ── Custom Tooltip for Composed Chart ─────────────────────────────
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value} {entry.name.includes("Rate") ? "%" : ""}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // ── KPI configurations ────────────────────────────────────────────
  const kpiList = [
    {
      label: "Total Impressions",
      value: formatCompactNumber(totalImpressions),
      icon: Eye,
      showActive: true
    },
    {
      label: "Engagement Rate",
      value: `${calculatedEngagementRate}%`,
      icon: TrendingUp,
      showActive: true
    },
    {
      label: "Net New Followers",
      value: `+${metrics.netNewFollowers || 0}`,
      icon: Users,
      showActive: true
    },
    {
      label: "Profile Views",
      value: formatCompactNumber(metrics.profileViews || rawData.profileViews || 0),
      icon: MousePointerClick,
      showActive: false
    },
    {
      label: "Search Appearances",
      value: formatCompactNumber(metrics.searchAppearances || rawData.searchAppearances || 0),
      icon: Search,
      showActive: false
    },
    {
      label: "Total Connections",
      value: profileInfo.pageType === "Company" ? "Hidden" : formatCompactNumber(profileInfo.connections),
      icon: Globe,
      showActive: false
    }
  ];

  // ── Top 3 Highest Performing Posts ────────────────────────────────
  const topPosts = [...allPosts]
    .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
    .slice(0, 3);

  return (
    <div className="animate-fade-in p-6 space-y-6  text-white">
      {/* ── Section A: Profile/Company Header Block ──────────────────── */}
      <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img
              src={profileInfo.avatar}
              alt={profileInfo.name}
              className="h-20 w-20 rounded-full object-cover ring-2 ring-[#0A66C2]/30"
            />
            <div className="flex-1 text-center md:text-left min-w-0">
              <h2 className="text-xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                {profileInfo.name}
                <span className="text-[10px] uppercase tracking-wider bg-[#0A66C2]/20 text-[#0A66C2] px-2 py-0.5 rounded font-semibold">
                  {profileInfo.pageType} Page
                </span>
              </h2>
              <p className="text-sm text-gray-400 mt-1 max-w-xl truncate">
                {profileInfo.headline}
              </p>
              <div className="mt-3 flex items-center justify-center md:justify-start gap-3 text-xs font-semibold text-gray-400">
                {profileInfo.pageType !== "Company" && (
                  <>
                    <span>{formatCompactNumber(profileInfo.connections)} Connections</span>
                    <span className="text-white/25">•</span>
                  </>
                )}
                <span>{formatCompactNumber(profileInfo.followers)} Followers</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section B: 6-Column KPI Grid ─────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiList.map((kpi, idx) => (
          <KpiCard 
            key={idx} 
            title={kpi.label} 
            value={kpi.value} 
            icon={kpi.icon} 
            showActive={kpi.showActive} 
          />
        ))}
      </div>

      {/* ── Section C: Charts Row (Composed dual-axis) ────────────────── */}
      <Card className="bg-[#161B22]/90 backdrop-blur-md border border-white/5 text-white shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#0A66C2]" />
            B2B Engagement vs. Impression Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[280px]">
            {composedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={composedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#fff' }} />
                  <Bar yAxisId="left" dataKey="impressions" name="Daily Impressions" fill="#0A66C2" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Line yAxisId="right" type="monotone" dataKey="engagementRate" name="Engagement Rate %" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Not enough analytical data available yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Section D: Tables Row (Top Performing Posts Preview) ───────── */}
      <Card className="bg-[#161B22]/90 backdrop-blur-md border border-white/5 text-white shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#0A66C2]" />
            Top Performing Corporate Updates (Overview)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 border-t border-white/5">
          {topPosts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase tracking-wider text-gray-400 bg-white/5">
                  <tr>
                    <th className="px-6 py-3">Corporate Update</th>
                    <th className="px-6 py-3 text-right">Impressions</th>
                    <th className="px-6 py-3 text-right">Clicks</th>
                    <th className="px-6 py-3 text-right">CTR</th>
                    <th className="px-6 py-3 text-right">Reactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {topPosts.map((post, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white max-w-[280px] truncate">
                        {post.title || "Untitled update"}
                      </td>
                      <td className="px-6 py-4 text-right">{formatCompactNumber(post.impressions)}</td>
                      <td className="px-6 py-4 text-right">{formatCompactNumber(post.clicks)}</td>
                      <td className="px-6 py-4 text-right">{post.ctr ? `${post.ctr}%` : "0.0%"}</td>
                      <td className="px-6 py-4 text-right">{formatCompactNumber(post.reactions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-gray-400">
              Not enough analytical data available yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

