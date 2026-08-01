import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Users, TrendingUp } from "lucide-react";
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

export default function LinkedInGrowth() {
  const { analyticsData } = useOutletContext();
  const metrics = analyticsData?.metrics || {};

  let growthTrend = metrics.growthTrend || [];
  if (growthTrend.length === 0) {
    growthTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        value: metrics.followers || 0
      };
    });
  }

  // Summary Metrics
  const currentFollowers = growthTrend.length > 0 ? growthTrend[growthTrend.length - 1].value : (metrics.followers || 0);
  const startFollowers = growthTrend.length > 0 ? growthTrend[0].value : 0;
  
  // Calculate total net growth for the period
  const totalNetGrowth = growthTrend.reduce((acc, curr, idx) => {
    if (idx === 0) return 0;
    return acc + Math.max(0, curr.value - (growthTrend[idx - 1].value || 0));
  }, 0);

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
      {/* ── Section A: Highlights Grid ───────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {[
          { title: "Current Followers", value: formatCompactNumber(currentFollowers), icon: Users, showActive: true },
          { title: "Net Growth", value: `+${formatCompactNumber(totalNetGrowth)}`, icon: TrendingUp, showActive: true }
        ].map((kpi, idx) => (
          <KpiCard 
            key={idx}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            showActive={kpi.showActive}
          />
        ))}
      </div>

      {/* ── Section B: Historical Accumulation (Net Growth Chart) ────── */}
      <Card className="bg-[#161B22]/90 backdrop-blur-md border border-white/5 text-white shadow-xl">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#0A66C2]" />
            Follower Accumulation Trend (Net Growth)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[280px]">
            {growthTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthTrend}>
                  <defs>
                    <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0A66C2" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0A66C2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" name="Total Followers" stroke="#0A66C2" fillOpacity={1} fill="url(#colorFollowers)" strokeWidth={2.5} />
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
  );
}

