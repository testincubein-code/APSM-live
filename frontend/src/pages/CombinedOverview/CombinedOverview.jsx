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

// ── Platform Config ───────────────────────────────────────────────────
const PLATFORM_CONFIG = {
  youtube: {
    color: '#FF0000',
    label: 'YouTube',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="#FF0000">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1C4.5 20.5 12 20.5 12 20.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
      </svg>
    ),
  },
  linkedin: {
    color: '#0A66C2',
    label: 'LinkedIn',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="#0A66C2">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.03-1.85-3.03-1.85 0-2.13 1.44-2.13 2.93v5.67H9.37V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.99 0 1.78-.77 1.78-1.73V1.73C24 .77 23.21 0 22.22 0z"/>
      </svg>
    ),
  },
  facebook: {
    color: '#1877F2',
    label: 'Facebook',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="#1877F2">
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.49 0-1.95.93-1.95 1.88v2.27h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/>
      </svg>
    ),
  },
  instagram: {
    color: '#E1306C',
    label: 'Instagram',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <defs>
          <linearGradient id="igGradCombined" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#feda75"/>
            <stop offset="30%" stopColor="#fa7e1e"/>
            <stop offset="60%" stopColor="#d62976"/>
            <stop offset="100%" stopColor="#962fbf"/>
          </linearGradient>
        </defs>
        <path fill="url(#igGradCombined)" d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12c0-3.2.01-3.58.07-4.85C2.38 3.86 3.9 2.31 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0-2.16C8.74 0 8.33.01 7.05.07 2.7.27.27 2.7.07 7.05.01 8.33 0 8.74 0 12c0 3.26.01 3.67.07 4.95.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24c3.26 0 3.67-.01 4.95-.07 4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95 0-3.26-.01-3.67-.07-4.95-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32A6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/>
      </svg>
    ),
  },
};

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
// Fetches each platform individually (same as each dashboard does), then aggregates.
const fetchAllPlatformData = async (forceRefresh = false) => {
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
const MetricCard = ({ title, value, icon: Icon, color = '#6366f1', suffix = '' }) => (
  <Card className="bg-[#0D1117] border border-white/8 rounded-xl hover:border-white/15 transition-colors">
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 leading-tight">{title}</p>
        <div className="p-1.5 rounded-lg shrink-0" style={{ background: `${color}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-xl font-bold text-white tracking-tight truncate">
        {value !== undefined && value !== null ? fmt(value) : '—'}{suffix}
      </p>
      <div className="flex items-center gap-1 mt-1.5">
        <span className="text-[10px] text-slate-600">across all platforms</span>
      </div>
    </CardContent>
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
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <Skeleton className="h-[560px] w-full bg-white/5 rounded-2xl" />
          </div>
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            <Skeleton className="h-5 w-40 bg-white/5 rounded mb-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 bg-white/5 rounded-xl" />
              ))}
            </div>
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

        {/* ── ROW 1: AI Chat + KPI Cards ─────────────────────────────── */}
        <div className="grid grid-cols-12 gap-6 items-start">

          {/* AI Assistant (fixed height on left) */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <div className="h-[560px]"><AIAssistantWidget /></div>
          </div>

          {/* KPI Cards (right) */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
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
                <MetricCard title="Total Followers" value={totals.followers} icon={Users} color="#6366f1" />
                <MetricCard title="Total Reach" value={totals.reach} icon={Eye} color="#0ea5e9" />
                <MetricCard title="Total Impressions" value={totals.impressions} icon={Activity} color="#a855f7" />
                <MetricCard title="Total Engagement" value={totals.engagement} icon={Heart} color="#ec4899" />
                <MetricCard title="Posts" value={totals.posts} icon={FileText} color="#f59e0b" />
                <MetricCard title="YouTube Views" value={summaries.youtube?.reach} icon={Eye} color="#FF0000" />
                <MetricCard title="IG Reach" value={summaries.instagram?.reach} icon={Users} color="#E1306C" />
                <MetricCard title="Engagement Rate" value={totals.engagementRate} icon={TrendingUp} color="#22d3ee" suffix="%" />
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 2: Charts ──────────────────────────────────────────── */}
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

        {/* ── ROW 3: Platform Breakdown ───────────────────────────────── */}
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
    </div>
  );
};

export default CombinedOverview;
