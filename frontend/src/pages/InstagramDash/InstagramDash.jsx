// ── Instagram Overview Dashboard ──────────────────────────────────────
// Renders the full-width Overview page with 4 stacked rows:
// Row 1: Identity header + date picker + refresh button
// Row 2: 6-column KPI grid (now 4-column x 2 rows)
// Row 3: 2-column chart row (Reach, Follower Growth)
// Row 4: 3-column row (Top Posts, Top Reels, Demographics)
// All data fetched independently via igapi.getOverviewMetrics().

import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import igapi from '@/services/igapi';
import DateRangePicker from '@/components/DateRangePicker';
import InstagramHashtags from './InstagramHashtags';
import { 
  Users, Eye, Target, Heart, BarChart3, Bookmark,
  RefreshCw, TrendingUp, ArrowUpRight, ArrowDownRight,
  Video, MessageCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, PieChart, Pie, Cell
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

// ── Glassmorphism Custom Tooltip ─────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#161B22]/95 border border-white/10 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl text-xs">
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

// ── Glassmorphism KPI Card (Shared Design) ───────────────────────────
const KpiCard = ({ title, value, showActive, icon: Icon, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="bg-[#10141D] border border-white/[0.06] rounded-xl p-5 shadow-none transition-colors">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-3 w-20 bg-gray-700/50" />
          <Skeleton className="h-7 w-7 rounded-md bg-gray-700/50" />
        </div>
        <Skeleton className="h-7 w-24 bg-gray-700/50 mt-1" />
        <Skeleton className="h-4 w-16 bg-gray-700/50 mt-2" />
      </Card>
    );
  }
  return (
    <Card className="bg-[#10141D] border border-white/[0.06] rounded-xl p-5 shadow-none transition-colors hover:bg-white/[0.01]">
      {/* Card Top Row: Uppercase Title & Slate Icon */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-[#8B949E] text-[11px] font-semibold tracking-wider uppercase">
          {title}
        </span>
        {Icon && <Icon className="w-4 h-4 text-[#8B949E]" />}
      </div>

      {/* Card Main Value */}
      <div className="text-3xl font-bold text-white mb-2 tracking-tight">
        {value}
      </div>

      {/* Card Bottom Row: Optional Active Badge OR Empty Spacer */}
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
};

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

  const totalImpressions = data?.reachTrend?.reduce((a, b) => a + b.impressions, 0) || 0;
  const currentER = data?.engagementTrend?.length ? data.engagementTrend[data.engagementTrend.length - 1].rate : null;

  const primaryKpis = [
    { title: "FOLLOWERS",         value: formatNumber(profile?.totalFollowers || data?.kpis?.totalFollowers?.current), icon: Users },
    { title: "ACCOUNT REACH",     value: formatNumber(data?.kpis?.accountsReached?.current),                           icon: Target },
    { title: "TOTAL IMPRESSIONS", value: formatNumber(totalImpressions),                                               icon: BarChart3 },
    { title: "ENGAGEMENT RATE",   value: currentER ? `${currentER}%` : "—",                                            icon: TrendingUp },
  ];

  const secondaryKpis = [
    { title: "POSTS COUNT",       value: formatNumber(data?.totalPosts || profile?.totalPosts || 0),                   icon: Bookmark },
    { title: "REELS COUNT",       value: formatNumber(data?.topReels?.length ?? 0),                                    icon: Video },
    { title: "TOTAL LIKES",       value: formatNumber(data?.kpis?.totalLikes?.current ?? 0),                           icon: Heart },
    { title: "TOTAL COMMENTS",    value: formatNumber(data?.kpis?.totalComments?.current ?? 0),                        icon: MessageCircle },
  ];

  const hasDemographics = isLoading || (
    data?.audience?.gender?.some(g => g.value > 0) ||
    data?.audience?.topCountries?.length > 0
  );

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
      {/* ROW 2 & 3 — KPI Grid                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {primaryKpis.map((kpi, i) => (
          <KpiCard key={i} {...kpi} showActive={true} isLoading={isLoading} />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryKpis.map((kpi, i) => (
          <KpiCard key={i} {...kpi} showActive={false} isLoading={isLoading} />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 3 — Main Analytical Visualization Row                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Column 1: Account Reach AreaChart ───────────────────────── */}
        <Card className="bg-[#10141D] border border-white/[0.06] rounded-xl shadow-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Account Reach</CardTitle>
              <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-md">Last 30 Days</span>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {isLoading || !data ? (
              <Skeleton className="w-full h-full bg-gray-700/30 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={(data?.reachTrend?.length > 0) ? data.reachTrend : [{ date: '', reach: 0 }]} 
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorReachOverview" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E1306C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#E1306C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={8} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={formatNumber} 
                    allowDecimals={false}
                    domain={([dataMin, dataMax]) => [0, isNaN(dataMax) || !isFinite(dataMax) || dataMax === 0 ? 2 : Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Area type="monotone" dataKey="reach" stroke="#E1306C" strokeWidth={2.5} activeDot={{ r: 6, strokeWidth: 0, fill: "#E1306C" }} fillOpacity={1} fill="url(#colorReachOverview)" name="Reach" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ── Column 2: Follower Growth BarChart ──────────────────────── */}
        <Card className="bg-[#10141D] border border-white/[0.06] rounded-xl shadow-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Follower Growth</CardTitle>
              <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-md">Daily</span>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {isLoading || !data ? (
              <Skeleton className="w-full h-full bg-gray-700/30 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={(data?.followerGrowth?.length > 0) ? data.followerGrowth : [{ date: '', gained: 0, lost: 0 }]} 
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={8} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={formatNumber} 
                    allowDecimals={false}
                    domain={([dataMin, dataMax]) => [0, isNaN(dataMax) || !isFinite(dataMax) || dataMax === 0 ? 2 : Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: "12px", fontSize: "12px", color: "#94a3b8" }} />
                  <Bar dataKey="gained" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={20} name="Gained" />
                  <Bar dataKey="lost" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={20} name="Lost" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 4 — Tabular Performance & Demographics Row                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Column 1: Top Posts Table ────────────────────────────────── */}
        <Card className="bg-[#10141D] border border-white/[0.06] rounded-xl shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Top Posts</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading || !data ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-gray-700/30 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.contentPerformance ?? []).slice(0, 5).map((post) => (
                  <div key={post.id} className="flex items-center gap-4 rounded-lg p-2 hover:bg-white/[0.02] transition-colors group">
                    <div className="relative shrink-0">
                      {post.image ? (
                        <img src={post.image} alt="" className="h-16 w-28 rounded-md object-cover ring-1 ring-white/10" />
                      ) : (
                        <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-md bg-white/5">
                          <Eye className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate text-white">{post.caption || post.type || "Post"}</h4>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[#8B949E]">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {formatNumber(post.reach ?? 0)}</span>
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {formatNumber(post.likes ?? 0)}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {formatNumber(post.comments ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {!(data?.contentPerformance?.length) && (
                  <p className="text-center text-[#8B949E] text-xs py-6">No posts in this date range</p>
                )}
                {/* View All Link */}
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
        <Card className="bg-[#10141D] border border-white/[0.06] rounded-xl shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Top Reels</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading || !data ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-gray-700/30 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.topReels ?? []).slice(0, 5).map((reel) => (
                  <div key={reel.id} className="flex items-center gap-4 rounded-lg p-2 hover:bg-white/[0.02] transition-colors group">
                    <div className="relative shrink-0">
                      {reel.image ? (
                        <img src={reel.image} alt="" className="h-16 w-28 rounded-md object-cover ring-1 ring-white/10" />
                      ) : (
                        <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-md bg-white/5">
                          <Eye className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate text-white">{reel.caption || "Reel"}</h4>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[#8B949E]">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {formatNumber(reel.plays || reel.views || 0)}</span>
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {formatNumber(reel.likes ?? 0)}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {formatNumber(reel.comments ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {!(data?.topReels?.length) && (
                  <p className="text-center text-[#8B949E] text-xs py-6">No reels in this date range</p>
                )}
                {/* View All Link */}
                <div className="pt-3 text-center border-t border-white/5 mt-2">
                  <Link to="/dashboard/instagram/reels" className="text-[#E1306C] text-xs font-medium hover:underline">
                    View all reels →
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Column 3: Audience Demographics ─────────────────────────── */}
        {hasDemographics ? (
          <Card className="bg-[#10141D] border border-white/[0.06] rounded-xl shadow-none">
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
                          data={data?.audience?.gender ?? []}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={50}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="type"
                          stroke="none"
                        >
                          {(data?.audience?.gender ?? []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Gender Legend */}
                    <div className="flex flex-col gap-1 ml-2">
                      {(data?.audience?.gender ?? []).map((g, i) => (
                        <div key={g.type} className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GENDER_COLORS[i] }}></span>
                          <span className="text-[11px] text-[#8B949E]">{g.type}</span>
                          <span className="text-[11px] text-white font-medium">{g.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Countries Progress (bottom half) */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-[#8B949E] uppercase tracking-wider font-semibold">Top Countries</p>
                    {(data?.audience?.topCountries ?? []).map((country) => (
                      <div key={country.name} className="flex items-center gap-2">
                        <span className="text-[11px] text-[#8B949E] w-24 truncate">{country.name}</span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#E1306C] rounded-full transition-all duration-500"
                            style={{ width: `${country.value}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-white font-medium w-12 text-right">{country.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#10141D] border border-white/[0.06] p-6 rounded-xl shadow-none">
            <div className="text-center py-8">
              <p className="text-sm font-medium text-slate-300">
                Audience Demographics Unavailable
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Meta requires an Instagram Business or Creator account with at least 100 followers to display age, gender, and country insights.
              </p>
            </div>
          </Card>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 5 — Hashtags Performance Row                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6">
        <InstagramHashtags data={data} />
      </div>
    </div>
  );
};

export default InstagramDash;
