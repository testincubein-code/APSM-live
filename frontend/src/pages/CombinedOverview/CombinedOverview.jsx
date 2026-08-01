import React, { useEffect, useState } from 'react';
import {
  Users, Eye, Activity, Heart, FileText, MousePointerClick,
  RefreshCw, TrendingUp, WifiOff
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import api from '@/services/api';
import { fetchYouTubeAnalytics, parseCoreMetrics, parseDailyAnalytics } from '@/services/ytapi';
import igapi from '@/services/igapi';
import linkedinApi from '@/services/linkedinApi';
import fbapi from '@/services/fbapi';
import AIAssistantWidget from './AIAssistantWidget';
import DateRangePicker from '@/components/DateRangePicker';
import CrossPlatformHeatmap from '@/components/CombinedDash/CrossPlatformHeatmap';
import UnifiedContentFeed from '@/components/CombinedDash/UnifiedContentFeed';
import ShareOfVoiceChart from '@/components/CombinedDash/ShareOfVoiceChart';
import GoalTracker from '@/components/CombinedDash/GoalTracker';
import GlobalAudienceProfile from '@/components/CombinedDash/GlobalAudienceProfile';

import { PLATFORM_CONFIG } from './config';

// ── Helpers ───────────────────────────────────────────────────────────
const fmt = (num) => {
  if (num === null || num === undefined) return '—';
  const n = parseFloat(num);
  if (isNaN(n)) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const fmtDate = (val) => {
  if (!val) return '';
  try {
    return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return val; }
};

// ── Data Fetching Logic ───────────────────────────────────────────────
const fetchAllPlatformData = async (forceRefresh = false) => {
  // ── MOCK DATA TOGGLE ──────────────────────────────────────────────
  const USE_MOCK_DATA = false; // User requested mock data

  if (USE_MOCK_DATA) {
    const mockSummaries = {
      facebook: { followers: 12500, reach: 45000, impressions: 85000, engagement: 3200, posts: 12, engagementRate: 7.11 },
      instagram: { followers: 28400, reach: 98000, impressions: 150000, engagement: 15400, posts: 24, engagementRate: 15.71 },
      linkedin: { followers: 5600, reach: 18000, impressions: 32000, engagement: 1800, posts: 8, engagementRate: 10.0 },
      youtube: { followers: 42000, reach: 150000, impressions: 210000, engagement: 22000, posts: 5, engagementRate: 14.66 },
    };

    const mockTotals = { followers: 0, reach: 0, impressions: 0, engagement: 0, posts: 0 };
    Object.values(mockSummaries).forEach(s => {
      mockTotals.followers += s.followers;
      mockTotals.reach += s.reach;
      mockTotals.impressions += s.impressions;
      mockTotals.engagement += s.engagement;
      mockTotals.posts += s.posts;
    });
    mockTotals.engagementRate = ((mockTotals.engagement / mockTotals.reach) * 100).toFixed(2);

    const mockTimeline = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toISOString().split('T')[0],
        facebookReach: Math.floor(5000 + Math.random() * 2000),
        facebookEngagement: Math.floor(300 + Math.random() * 200),
        instagramReach: Math.floor(12000 + Math.random() * 3000),
        instagramEngagement: Math.floor(2000 + Math.random() * 500),
        linkedinReach: Math.floor(2000 + Math.random() * 1000),
        linkedinEngagement: Math.floor(200 + Math.random() * 100),
        youtubeReach: Math.floor(20000 + Math.random() * 5000),
        youtubeEngagement: Math.floor(3000 + Math.random() * 1000),
      };
    });

    return { summaries: mockSummaries, totals: mockTotals, timeline: mockTimeline };
  }

  // 1. Get auth status to know which platforms are connected
  const authRes = await api.get('/auth/status');
  const statusArr = authRes.data?.status ?? [];

  const isConnected = (platform) => {
    const s = statusArr.find(p => p.platform === platform);
    return !!(s?.connected && !s?.isExpired);
  };

  const summaries = {};
  const timelines = {}; // { platform: [{date, reach, engagement}] }

  // ── YouTube ──────────────────────────────────────────────────────
  if (isConnected('youtube')) {
    try {
      const snap = await fetchYouTubeAnalytics(forceRefresh);
      if (snap) {
        const core = parseCoreMetrics(snap);
        const daily = parseDailyAnalytics(snap);
        summaries.youtube = {
          followers: core.subscribers,
          reach: core.totalViews,
          impressions: core.impressions,
          engagement: core.totalEngagement,
          posts: core.videoCount,
          engagementRate: core.engagementRate,
        };
        timelines.youtube = daily.map(d => ({
          date: d.rawDate || d.date,
          reach: d.views,
          engagement: d.likes + d.comments + d.shares,
        }));
      }
    } catch (e) {
      console.warn('[Combined] YouTube fetch error:', e.message);
    }
  }

  // ── LinkedIn ──────────────────────────────────────────────────────
  if (isConnected('linkedin')) {
    try {
      const res = await linkedinApi.getLinkedInAnalytics();
      const li = res?.data?.[0] || {};
      const m = li.metrics || {};
      summaries.linkedin = {
        followers: m.follower_count || m.followers || 0,
        reach: m.impressions || 0,
        impressions: m.impressions || 0,
        engagement: m.clicks + m.shares + m.reactions || 0,
        posts: (li.content?.posts?.length || 0),
        engagementRate: parseFloat(m.engagementRate) || 0,
      };
      const trends = m.impressionsTrend || m.growthTrend || [];
      timelines.linkedin = trends.map(t => ({
        date: t.day || t.date,
        reach: t.impressionCount || t.value || 0,
        engagement: t.clickCount || 0,
      }));
    } catch (e) {
      console.warn('[Combined] LinkedIn fetch error:', e.message);
    }
  }

  // ── Facebook ──────────────────────────────────────────────────────
  if (isConnected('facebook')) {
    try {
      const overview = await fbapi.getOverviewMetrics?.();
      if (overview) {
        const kpis = overview.kpis || {};
        summaries.facebook = {
          followers: kpis.pageLikes?.current || kpis.followers?.current || 0,
          reach: kpis.totalReach?.current || 0,
          impressions: kpis.totalImpressions?.current || 0,
          engagement: kpis.totalEngagement?.current || 0,
          posts: overview.totalPosts || 0,
          engagementRate: 0,
        };
        const reachTrend = overview.reachTrend || [];
        timelines.facebook = reachTrend.map(d => ({
          date: d.date || d.end_time?.split('T')[0],
          reach: d.reach || d.value || 0,
          engagement: d.engagement || 0,
        }));
      }
    } catch (e) {
      console.warn('[Combined] Facebook fetch error:', e.message);
    }
  }

  // ── Instagram ──────────────────────────────────────────────────────
  if (isConnected('instagram')) {
    try {
      const overview = await igapi.getOverviewMetrics(forceRefresh);
      const kpis = overview?.kpis || {};
      summaries.instagram = {
        followers: kpis.totalFollowers?.current || 0,
        reach: kpis.accountsReached?.current || 0,
        impressions: 0,
        engagement: kpis.accountsEngaged?.current || 0,
        posts: overview?.totalPosts || 0,
        engagementRate: 0,
      };
      const reachTrend = overview?.reachTrend || [];
      timelines.instagram = reachTrend.map(d => ({
        date: d.date,
        reach: d.reach || 0,
        engagement: d.impressions || 0,
      }));
    } catch (e) {
      console.warn('[Combined] Instagram fetch error:', e.message);
    }
  }

  // ── Aggregate Totals ──────────────────────────────────────────────
  const totals = { followers: 0, reach: 0, impressions: 0, engagement: 0, posts: 0 };
  Object.values(summaries).forEach(s => {
    totals.followers += s.followers || 0;
    totals.reach += s.reach || 0;
    totals.impressions += s.impressions || 0;
    totals.engagement += s.engagement || 0;
    totals.posts += s.posts || 0;
  });
  totals.engagementRate = totals.reach > 0
    ? ((totals.engagement / totals.reach) * 100).toFixed(2)
    : '0.00';

  // ── Build Merged 7-day Timeline ───────────────────────────────────
  const dateSet = new Set();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dateSet.add(d.toISOString().split('T')[0]);
  }
  // Also add any dates from individual platform timelines
  Object.values(timelines).forEach(tl =>
    tl.forEach(d => { if (d.date) dateSet.add(d.date.split('T')[0]); })
  );

  const sortedDates = Array.from(dateSet).sort();

  const mergedTimeline = sortedDates.map(date => {
    const row = { date };
    Object.entries(timelines).forEach(([platform, tl]) => {
      // Find closest entry on or before this date
      const matching = tl.filter(d => d.date && d.date.split('T')[0] <= date);
      const closest = matching[matching.length - 1] || null;
      row[`${platform}Reach`] = closest?.reach || 0;
      row[`${platform}Engagement`] = closest?.engagement || 0;
    });
    return row;
  });

  return { summaries, totals, timeline: mergedTimeline };
};

// ── Sub-Components ────────────────────────────────────────────────────
const MetricCard = ({ title, value, icon: Icon, showActive, suffix = '' }) => (
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
      {value !== undefined && value !== null ? fmt(value) : '—'}{suffix}
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

const PlatformCard = ({ platform, data }) => {
  const cfg = PLATFORM_CONFIG[platform];
  if (!cfg || !data) return null;
  const IconComp = cfg.icon;
  const r = data.reach || 0;
  const sparkData = [0.7, 0.82, 0.75, 0.91, 0.88, 0.95, 1].map(f => ({ v: Math.round(r * f) }));

  return (
    <Card className="bg-[#0D1117] border border-white/8 rounded-xl overflow-hidden hover:border-white/15 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 shrink-0"><IconComp /></div>
          <span className="text-sm font-semibold text-white">{cfg.label}</span>
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500">
            {fmt(data.followers)} followers
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[10px] text-slate-500 mb-0.5">Reach</p>
            <p className="text-base font-bold text-white">{fmt(data.reach)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-0.5">Engagement</p>
            <p className="text-base font-bold text-white">{fmt(data.engagement)}</p>
          </div>
        </div>
        <div className="h-10 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spk-${platform}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={cfg.color} strokeWidth={1.5} fill={`url(#spk-${platform})`} isAnimationActive={false} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const ChartLegend = ({ summaries }) => (
  <div className="flex flex-wrap gap-3 mt-1">
    {Object.entries(PLATFORM_CONFIG).map(([p, cfg]) =>
      summaries[p] ? (
        <div key={p} className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
          <span className="text-xs text-slate-400">{cfg.label}</span>
        </div>
      ) : null
    )}
  </div>
);

const CHART_TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '12px' },
  itemStyle: { color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8', marginBottom: '4px' },
};

// ── Main Component ────────────────────────────────────────────────────
const CombinedOverview = () => {
  const [summaries, setSummaries] = useState({});
  const [totals, setTotals] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const load = async (refresh = false) => {
    try {
      setFetchError(null);
      if (refresh) setIsRefreshing(true);
      const result = await fetchAllPlatformData(refresh);
      setSummaries(result.summaries);
      setTotals(result.totals);
      setTimeline(result.timeline);
    } catch (err) {
      console.error('[Combined] Load error:', err);
      setFetchError('Failed to load analytics data. Please check your connections and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const connectedPlatforms = Object.keys(summaries);
  const hasData = connectedPlatforms.length > 0;

  // ── Loading skeleton ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-6">
        <Skeleton className="h-10 w-64 bg-white/5 rounded-xl" />
        <div className="w-full">
          <Skeleton className="h-5 w-40 bg-white/5 rounded mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Combined Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            AI Insights + All Platforms Analytics
            {hasData && (
              <span className="ml-2 text-indigo-400">
                · {connectedPlatforms.map(p => PLATFORM_CONFIG[p]?.label).join(', ')} connected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <DateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={setDateRange} />
          <Button
            variant="outline" size="sm"
            onClick={() => load(true)} disabled={isRefreshing}
            className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white h-9 px-3 rounded-lg text-xs gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          ⚠️ {fetchError}
        </div>
      )}

      <div className="flex flex-col gap-6">

        {/* ── ROW 1: KPI Cards ─────────────────────────────── */}
        <div className="w-full">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Combined Analytics Overview
          </p>
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl">
              <WifiOff className="w-12 h-12 text-slate-700 mb-4" />
              <h3 className="text-white font-semibold mb-1">No Platforms Connected</h3>
              <p className="text-sm text-slate-500 max-w-xs">
                Connect at least one social media account to see your combined analytics here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard title="Total Followers" value={totals.followers} icon={Users} showActive={true} />
              <MetricCard title="Total Reach" value={totals.reach} icon={Eye} showActive={true} />
              <MetricCard title="Total Impressions" value={totals.impressions} icon={Activity} showActive={true} />
              <MetricCard title="Total Engagement" value={totals.engagement} icon={Heart} showActive={true} />
              <MetricCard title="Posts" value={totals.posts} icon={FileText} showActive={false} />
              <MetricCard title="YouTube Views" value={summaries.youtube?.reach} icon={Eye} showActive={true} />
              <MetricCard title="IG Reach" value={summaries.instagram?.reach} icon={Users} showActive={true} />
              <MetricCard title="Engagement Rate" value={totals.engagementRate} icon={TrendingUp} showActive={true} suffix="%" />
            </div>
          )}
        </div>

        {/* ── ROW 2: Cross Platform Heatmap ──────────────────────────────────────────── */}
        {hasData && (
          <CrossPlatformHeatmap summaries={summaries} />
        )}

        {/* ── ROW 3: Charts ──────────────────────────────────────────── */}
        {hasData && timeline.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Reach Over Time */}
            <Card className="bg-[#0D1117] border border-white/8 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-white">Reach Over Time</CardTitle>
                <ChartLegend summaries={summaries} />
              </CardHeader>
              <CardContent className="h-56 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff20" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={fmtDate} tickLine={false} />
                    <YAxis stroke="#ffffff20" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={fmt} tickLine={false} axisLine={false} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} labelFormatter={fmtDate} />
                    {Object.entries(PLATFORM_CONFIG).map(([p, cfg]) =>
                      summaries[p] ? (
                        <Line key={p} type="monotone" dataKey={`${p}Reach`} stroke={cfg.color} strokeWidth={2}
                          dot={{ r: 2.5, fill: cfg.color, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} name={`${cfg.label} Reach`} />
                      ) : null
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Over Time */}
            <Card className="bg-[#0D1117] border border-white/8 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-white">Engagement Over Time</CardTitle>
                <ChartLegend summaries={summaries} />
              </CardHeader>
              <CardContent className="h-56 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff20" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={fmtDate} tickLine={false} />
                    <YAxis stroke="#ffffff20" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={fmt} tickLine={false} axisLine={false} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} labelFormatter={fmtDate} />
                    {Object.entries(PLATFORM_CONFIG).map(([p, cfg]) =>
                      summaries[p] ? (
                        <Line key={p} type="monotone" dataKey={`${p}Engagement`} stroke={cfg.color} strokeWidth={2}
                          dot={{ r: 2.5, fill: cfg.color, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} name={`${cfg.label} Engagement`} />
                      ) : null
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── ROW 4: Advanced Visualizations ───────────────────────────────── */}
        {hasData && (
          <div className="grid grid-cols-12 gap-6">
            <GoalTracker summaries={summaries} />
            <ShareOfVoiceChart summaries={summaries} />
          </div>
        )}

        {/* ── ROW 5: Content & Audience ───────────────────────────────── */}
        <div className="grid grid-cols-12 gap-6">
          <UnifiedContentFeed />
          <div className="col-span-12 lg:col-span-6 flex">
            <GlobalAudienceProfile />
          </div>
        </div>

        {/* ── ROW 6: Platform Breakdown ───────────────────────────────── */}
        {hasData && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Platform Breakdown</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(PLATFORM_CONFIG).map(([p]) =>
                summaries[p] ? <PlatformCard key={p} platform={p} data={summaries[p]} /> : null
              )}
            </div>
          </div>
        )}

      </div>

      {/* Floating AI Assistant */}
      <AIAssistantWidget />
    </div>
  );
};

export default CombinedOverview;
