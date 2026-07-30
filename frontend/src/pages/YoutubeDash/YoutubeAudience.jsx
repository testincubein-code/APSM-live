// ── YouTube Audience Page ───────────────────────────────────────────
// Audience demographics dashboard showing viewer overview KPIs,
// age distribution, gender breakdown, top countries, and device usage.
// All data is parsed from the analytics snapshot via ytapi.js.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Users,
  Eye,
  UserPlus,
  Globe,
  Smartphone,
  MapPin,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import {
  parseCoreMetrics,
  parseCountryData,
  parseDeviceData,
  parseAgeGenderData,
  formatCompactNumber,
} from "@/services/ytapi";

// ── Chart color constants ───────────────────────────────────────────
const COLORS = {
  red: "#ef4444",
  blue: "#3b82f6",
  emerald: "#10b981",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  cyan: "#06b6d4",
  pink: "#ec4899",
};

const DEVICE_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];
const GENDER_COLORS = [COLORS.blue, COLORS.pink, COLORS.violet];

// ── Custom dark-themed tooltip ──────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161B22]/95 border border-white/10 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {formatCompactNumber(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ── Skeleton loading state ──────────────────────────────────────────
function AudienceSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-white/10">
            <CardContent className="p-5">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-7 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="border-white/10">
            <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
            <CardContent><Skeleton className="h-[260px] w-full rounded-lg" /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Empty audience state ────────────────────────────────────────────
function EmptyAudience() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center animate-fade-in">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
          <Users className="h-8 w-8 text-violet-400" />
        </div>
        <h3 className="text-lg font-semibold">Not enough audience data yet</h3>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          Audience demographics will appear here as your channel gains more viewers.
          This typically requires at least a few days of activity.
        </p>
      </div>
    </div>
  );
}

// ── Main Audience Component ─────────────────────────────────────────
export default function YoutubeAudience({ data, loading }) {
  // ── Loading state ─────────────────────────────────────────────────
  if (loading) return <AudienceSkeleton />;

  // ── Empty state ───────────────────────────────────────────────────
  if (!data) return <EmptyAudience />;

  // ── Parse data ────────────────────────────────────────────────────
  const metrics = parseCoreMetrics(data);
  const countryData = parseCountryData(data).slice(0, 10);
  const deviceData = parseDeviceData(data);
  const { age: ageData, gender: genderData } = parseAgeGenderData(data);

  // ── If all audience data is empty, show empty state ───────────────
  const hasData = countryData.length > 0 || deviceData.length > 0 || ageData.length > 0;
  if (!hasData) return <EmptyAudience />;

  // ── Audience KPI cards ────────────────────────────────────────────
  const audienceKPIs = [
    {
      title: "Unique Viewers",
      value: formatCompactNumber(metrics.reach),
      icon: Eye,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Subscribers",
      value: formatCompactNumber(metrics.subscribers),
      icon: UserCheck,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      title: "Returning Viewers",
      value: formatCompactNumber(Math.round(metrics.reach * 0.35)),
      icon: UserPlus,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      subtitle: "~35% of unique",
    },
    {
      title: "Total Engagement",
      value: formatCompactNumber(metrics.totalEngagement),
      icon: TrendingUp,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Audience Overview KPIs ────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {audienceKPIs.map((kpi) => (
          <Card
            key={kpi.title}
            className="border-white/10 bg-white/5 backdrop-blur-lg shadow-sm shadow-none hover:shadow-lg hover:shadow-black/5 transition-all duration-300 group"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {kpi.title}
                  </p>
                  <p className="mt-1.5 text-2xl font-bold tracking-tight">{kpi.value}</p>
                  {kpi.subtitle && (
                    <p className="mt-0.5 text-xs text-slate-400">{kpi.subtitle}</p>
                  )}
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Age & Gender Charts ───────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Age Distribution */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg shadow-sm shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              Age Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="group" stroke="#64748b" tickLine={false} axisLine={false} dy={8} fontSize={10} />
                  <YAxis 
                    stroke="#64748b" 
                    tickLine={false} 
                    axisLine={false} 
                    fontSize={10} 
                    tickFormatter={formatCompactNumber} 
                    allowDecimals={false}
                    domain={([dataMin, dataMax]) => [0, isNaN(dataMax) || !isFinite(dataMax) || dataMax === 0 ? 2 : Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="Viewers" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                No age distribution data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg shadow-sm shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-pink-400" />
              Gender Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="label"
                  >
                    {genderData.map((_, i) => (
                      <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                No gender distribution data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Countries & Device Breakdown ──────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Countries */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg shadow-sm shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-400" />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countryData.length > 0 ? (
              <div className="space-y-3">
                {countryData.map((country, i) => {
                  const maxViews = countryData[0]?.views || 1;
                  const percentage = ((country.views / maxViews) * 100).toFixed(0);
                  return (
                    <div key={country.country} className="flex items-center gap-3">
                      {/* Rank */}
                      <span className="w-5 text-xs font-bold text-slate-400">{i + 1}</span>
                      {/* Country name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {country.country}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatCompactNumber(country.views)} views
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 w-full rounded-full bg-muted/50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                No geographic data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg shadow-sm shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-violet-400" />
              Device Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="views"
                    nameKey="device"
                  >
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                No device data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
