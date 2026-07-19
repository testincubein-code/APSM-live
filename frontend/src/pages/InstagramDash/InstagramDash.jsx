// ── Instagram Overview Dashboard ──────────────────────────────────────
// Renders the full-width Overview page with 4 stacked rows:
// Row 1: Identity header + date picker + refresh button
// Row 2: 6-column KPI grid
// Row 3: 3-column chart row (Reach, Follower Growth, Demographics)
// Row 4: 3-column table row (Top Posts, Top Reels, Engagement Rate)
// All data fetched independently via igapi.getOverviewMetrics().

import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import igapi from '@/services/igapi';
import DateRangePicker from '@/components/DateRangePicker';
import { 
  Users, Eye, Target, Heart, BarChart3, Bookmark,
  RefreshCw, TrendingUp, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// ── Number Formatter ─────────────────────────────────────────────────
// Uses Intl.NumberFormat compact notation so 85300 renders as "85.3K"
const formatNumber = (num) => {
  if (num === undefined || num === null) return '—';
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1
  }).format(num);
};

// ── Trend Calculator ─────────────────────────────────────────────────
const calculateTrend = (current, previous) => {
  if (!previous || !current) return 0;
  return (((current - previous) / previous) * 100).toFixed(1);
};

// ── Glassmorphism Custom Tooltip ─────────────────────────────────────
// Strict frosted glass: rgba(22,27,34,0.85) + blur(12px)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(22, 27, 34, 0.85)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: '1px',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <p className="font-semibold text-gray-200 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1 last:mb-0">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="text-gray-400 capitalize">{entry.name}:</span>
            <span className="font-medium text-white">
              {typeof entry.value === 'number' && entry.value < 100 
                ? `${entry.value}%` 
                : formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ── Donut Chart Colors ───────────────────────────────────────────────
const GENDER_COLORS = ['#E1306C', '#833AB4'];

// ── Main Dashboard Component ─────────────────────────────────────────
const InstagramDash = () => {
  const { profile, isConnected, isLayoutLoading } = useOutletContext();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // ── Default date range: last 7 days ────────────────────────────────
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const defaultStart = d.toISOString().split('T')[0];
  const defaultEnd = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ start: defaultStart, end: defaultEnd });

  // ── Fetch overview data on mount ───────────────────────────────────
  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      const overviewData = await igapi.getOverviewMetrics(showRefresh);
      setData(overviewData);
    } catch (error) {
      console.error("Failed to fetch overview metrics:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── 6-Column KPI Definitions ───────────────────────────────────────
  const kpis = [
    { id: 'total-followers', title: 'Followers', icon: Users, current: data?.kpis?.totalFollowers?.current, previous: data?.kpis?.totalFollowers?.previous },
    { id: 'accounts-reached', title: 'Reach', icon: Target, current: data?.kpis?.accountsReached?.current, previous: data?.kpis?.accountsReached?.previous },
    { id: 'accounts-engaged', title: 'Engagement', icon: Heart, current: data?.kpis?.accountsEngaged?.current, previous: data?.kpis?.accountsEngaged?.previous },
    { id: 'impressions', title: 'Impressions', icon: BarChart3, current: data?.reachTrend?.reduce((a, b) => a + b.impressions, 0), previous: data?.reachTrend?.reduce((a, b) => a + b.impressions, 0) * 0.85 },
    { id: 'saves', title: 'Saves', icon: Bookmark, current: data?.saves?.current, previous: data?.saves?.previous },
  ];

  // ── Impressions total for KPI ──────────────────────────────────────
  const totalImpressions = data?.reachTrend?.reduce((a, b) => a + b.impressions, 0) || 0;

  return (
    <div className="p-4 md:p-6 space-y-6 w-full max-w-[1400px] mx-auto">

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 1 — Identity Header & Global Filters                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* ── Left: Profile Block ─────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          {isLayoutLoading ? (
            <>
              <Skeleton className="w-14 h-14 rounded-full bg-gray-700/50" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 bg-gray-700/50" />
                <Skeleton className="h-4 w-24 bg-gray-700/50" />
                <Skeleton className="h-3 w-40 bg-gray-700/50" />
              </div>
            </>
          ) : profile ? (
            <>
              {/* Profile Photo */}
              <img 
                src={profile.profilePicture} 
                alt={profile.name}
                className="w-14 h-14 rounded-full border-2 border-[#E1306C]/30 object-cover"
              />
              {/* Profile Metadata */}
              <div>
                <h1 className="text-xl font-bold text-white">{profile.name}</h1>
                <p className="text-sm text-gray-400">{profile.handle}</p>
                <p className="text-xs text-gray-500">{profile.category}</p>
              </div>
              {/* Inline Context Stats */}
              <div className="hidden md:flex items-center gap-4 ml-4 pl-4 border-l border-white/10">
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">{formatNumber(profile.totalFollowers)}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">{profile.totalFollowing}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">{data?.totalPosts || '—'}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Posts</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">Not Connected</div>
          )}
        </div>

        {/* ── Right: Date Picker + Refresh ────────────────────────────── */}
        <div className="flex items-center gap-2">
          <DateRangePicker 
            startDate={dateRange.start} 
            endDate={dateRange.end} 
            onChange={setDateRange} 
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="text-xs text-gray-400 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white h-9 px-3"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 2 — 6-Column Core KPI Grid                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          // ── Loading skeleton matching exact card dimensions ─────────
          if (isLoading) {
            return (
              <Card key={idx} className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="w-8 h-8 rounded-full bg-gray-700/50" />
                  <Skeleton className="h-3 w-16 bg-gray-700/50" />
                </div>
                <Skeleton className="h-7 w-16 bg-gray-700/50 mb-1" />
                <Skeleton className="h-3 w-24 bg-gray-700/50" />
              </Card>
            );
          }

          const trend = calculateTrend(kpi.current, kpi.previous);
          const isPositive = trend >= 0;

          return (
            <Card 
              key={kpi.id} 
              className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 p-4 hover:border-white/10 transition-all cursor-pointer group"
              onClick={() => navigate(`/dashboard/instagram/metrics/${kpi.id}`)}
            >
              {/* Icon + Label */}
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-[#E1306C]/10 text-[#E1306C] p-2 rounded-full group-hover:bg-[#E1306C]/20 transition-colors shrink-0">
                  <kpi.icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 font-semibold truncate" title={kpi.title}>{kpi.title}</span>
              </div>
              {/* Value */}
              <div className="text-2xl font-bold text-white mt-1">
                {formatNumber(kpi.current)}
              </div>
              {/* Trend */}
              <div className={`text-[10px] sm:text-xs font-medium flex flex-wrap items-center gap-x-1 mt-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                <div className="flex items-center">
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{trend}%
                </div>
                <span className="text-gray-500 font-normal truncate">vs prev 7 days</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 3 — Main Analytical Visualization Row                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Column 1: Account Reach AreaChart ───────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Account Reach</CardTitle>
              <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-md">Last 7 days</span>
            </div>
          </CardHeader>
          <CardContent className="h-[240px]">
            {isLoading || !data ? (
              <Skeleton className="w-full h-full bg-gray-700/30 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.reachTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReachOverview" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E1306C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#E1306C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Area type="monotone" dataKey="reach" stroke="#E1306C" strokeWidth={2} fillOpacity={1} fill="url(#colorReachOverview)" name="Reach" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ── Column 2: Follower Growth BarChart ──────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Follower Growth</CardTitle>
              <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-md">Daily</span>
            </div>
          </CardHeader>
          <CardContent className="h-[240px]">
            {isLoading || !data ? (
              <Skeleton className="w-full h-full bg-gray-700/30 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.followerGrowth} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="gained" fill="#10b981" radius={[3, 3, 0, 0]} name="Gained" />
                  <Bar dataKey="lost" fill="#ef4444" radius={[3, 3, 0, 0]} name="Lost" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ── Column 3: Audience Demographics ─────────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Audience Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="w-full h-[240px] bg-gray-700/30 rounded-lg" />
            ) : (
              <div className="flex flex-col gap-4">
                {/* Gender Donut (top half) */}
                <div className="h-[120px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.audience.gender}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="type"
                        stroke="none"
                      >
                        {data.audience.gender.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Gender Legend */}
                  <div className="flex flex-col gap-1 ml-2">
                    {data.audience.gender.map((g, i) => (
                      <div key={g.type} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GENDER_COLORS[i] }}></span>
                        <span className="text-[11px] text-gray-400">{g.type}</span>
                        <span className="text-[11px] text-white font-medium">{g.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Countries Progress (bottom half) */}
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Top Countries</p>
                  {data.audience.topCountries.map((country) => (
                    <div key={country.name} className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-300 w-24 truncate">{country.name}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#E1306C] rounded-full transition-all duration-500"
                          style={{ width: `${country.value}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium w-12 text-right">{country.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 4 — Tabular Performance & Interaction Row                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Column 1: Top Posts Table ────────────────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Top Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full bg-gray-700/30 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-0">
                {/* Table Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2 gap-2">
                  <span className="w-8"></span>
                  <span className="flex-1 text-[10px] text-gray-500 uppercase tracking-wider">Post</span>
                  <div className="flex gap-2 text-right w-[160px] justify-end">
                    <span className="w-10 text-[10px] text-gray-500 uppercase tracking-wider">Reach</span>
                    <span className="w-10 text-[10px] text-gray-500 uppercase tracking-wider">Likes</span>
                    <span className="w-10 text-[10px] text-gray-500 uppercase tracking-wider">Cmts</span>
                    <span className="w-10 text-[10px] text-gray-500 uppercase tracking-wider">ER%</span>
                  </div>
                </div>
                {/* Table Rows */}
                {data.contentPerformance.map((post) => (
                  <div key={post.id} className="flex items-center justify-between py-2 hover:bg-white/5 rounded-md transition-colors gap-2">
                    <img src={post.image} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-[11px] text-white truncate">{post.caption || post.type}</p>
                      <p className="text-[10px] text-gray-500 truncate">{post.type}</p>
                    </div>
                    <div className="flex gap-2 text-right w-[160px] justify-end shrink-0">
                      <span className="w-10 text-[11px] text-gray-300">{formatNumber(post.reach)}</span>
                      <span className="w-10 text-[11px] text-gray-300">{formatNumber(post.likes)}</span>
                      <span className="w-10 text-[11px] text-gray-300">{formatNumber(post.comments)}</span>
                      <span className="w-10 text-[11px] text-[#E1306C] font-medium">
                        {post.reach ? ((post.likes + post.comments) / post.reach * 100).toFixed(1) + '%' : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
                {/* View All Link — routed via react-router-dom */}
                <div className="pt-3 text-center border-t border-white/5 mt-2">
                  <Link to="/dashboard/instagram/content" className="text-[#E1306C] text-xs font-medium hover:underline">
                    View all posts →
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Column 2: Top Reels Table ───────────────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Top Reels</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full bg-gray-700/30 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-0">
                {/* Table Header */}
                <div className="grid grid-cols-[40px_1fr_55px_50px_50px] gap-1 pb-2 border-b border-white/5 mb-2">
                  <span></span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Reel</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider text-right">Plays</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider text-right">Likes</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider text-right">Cmts</span>
                </div>
                {/* Table Rows */}
                {data.topReels.map((reel) => (
                  <div key={reel.id} className="grid grid-cols-[40px_1fr_55px_50px_50px] gap-1 py-2 items-center hover:bg-white/5 rounded-md transition-colors">
                    <img src={reel.image} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                    <p className="text-[11px] text-white truncate min-w-0 pr-2">{reel.caption || "Reel"}</p>
                    <span className="text-[11px] text-gray-300 text-right">{formatNumber(reel.plays || reel.views || 0)}</span>
                    <span className="text-[11px] text-gray-300 text-right">{formatNumber(reel.likes)}</span>
                    <span className="text-[11px] text-gray-300 text-right">{formatNumber(reel.comments)}</span>
                  </div>
                ))}
                {/* View All Link — routed via react-router-dom */}
                <div className="pt-3 text-center border-t border-white/5 mt-2">
                  <Link to="/dashboard/instagram/reels" className="text-[#E1306C] text-xs font-medium hover:underline">
                    View all reels →
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Column 3: Engagement Rate LineChart ─────────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Engagement Rate</CardTitle>
              <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-md">Trend</span>
            </div>
          </CardHeader>
          <CardContent className="h-[240px]">
            {isLoading || !data ? (
              <Skeleton className="w-full h-full bg-gray-700/30 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.engagementTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Line type="monotone" dataKey="rate" stroke="#FCAF45" strokeWidth={2.5} dot={{ r: 3, fill: '#FCAF45', stroke: '#0B1121', strokeWidth: 2 }} name="Engagement Rate" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstagramDash;
