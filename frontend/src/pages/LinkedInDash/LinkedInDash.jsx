// ── LinkedIn Dashboard Page ─────────────────────────────────────────
// LinkedIn analytics with metric cards, charts, and skeleton placeholders.

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Users, Search, Eye, MousePointerClick, AlertCircle, Loader2, TrendingUp, Filter, RefreshCw } from "lucide-react";
import { Linkedin } from "@/components/icons/BrandIcons";
import { Button } from "@/components/ui/button";
import ConfirmDisconnectModal from "@/components/ConfirmDisconnectModal";
import DateRangePicker from "@/components/DateRangePicker";
import linkedinApi from "@/services/linkedinApi";

const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const COLORS = ["#2563eb", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function LinkedInDash() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Default to Last 7 Days
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const defaultStart = d.toISOString().split('T')[0];
  const defaultEnd = new Date().toISOString().split('T')[0];
  
  const [dateRange, setDateRange] = useState({ start: defaultStart, end: defaultEnd });

  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch connection status
      const statusRes = await linkedinApi.getAuthStatus();
      const statusArray = Array.isArray(statusRes) ? statusRes : (statusRes?.data || statusRes?.status || statusRes?.connections || []);
      const lnStatus = statusArray.find((p) => String(p.platform).toLowerCase() === "linkedin");

      setIsConnected(!!lnStatus?.connected);
      setUsername(lnStatus?.username || "");

      // 2. Fetch Analytics Snapshot if connected
      if (lnStatus?.connected) {
        const analyticsRes = await linkedinApi.getLinkedInAnalytics();
        const dataArray = Array.isArray(analyticsRes?.data) ? analyticsRes.data : [];
        setAnalyticsData(dataArray[0] || null);
      } else {
        setAnalyticsData(null);
      }
    } catch (err) {
      console.error("Error fetching LinkedIn data:", err);
      setError("Failed to load LinkedIn analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnect = () => {
    const token = localStorage.getItem("incubein_token");
    window.location.href = `http://localhost:5000/auth/linkedin?token=${token}`;
  };

  const handleRevoke = async () => {
    setRevokeLoading(true);
    try {
      await linkedinApi.revokeLinkedIn();
      setIsConnected(false);
      setUsername("");
      fetchData(); // Refresh to clear
    } catch (err) {
      console.error("Error revoking LinkedIn access:", err);
    } finally {
      setRevokeLoading(false);
    }
  };

  // Safe Data Extraction
  const metrics = analyticsData?.metrics || {};
  const rawData = analyticsData?.rawPlatformData || {};
  const demographics = analyticsData?.demographics || {};
  const content = analyticsData?.content || {};

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-white mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{formatNumber(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Helper to render flat line chart if empty
  const getChartData = (dataArray, defaultData) => {
    if (!dataArray || dataArray.length === 0) return defaultData;
    return dataArray;
  };

  // Default Flat Lines for Empty States
  const defaultLineChart = [{ day: "Mon", value: 0 }, { day: "Tue", value: 0 }, { day: "Wed", value: 0 }];
  const defaultPieChart = [{ name: "No Data", value: 1 }];

  // ── Render States ──────────────────────────────────────────────────
  const renderLoading = () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      <p className="text-muted-foreground animate-pulse">Fetching LinkedIn Analytics...</p>
    </div>
  );

  const renderError = () => (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md bg-white/5 backdrop-blur-lg border-red-500/30">
        <CardContent className="flex flex-col items-center text-center p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Data Load Failed</h3>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <Button onClick={fetchData} variant="outline" className="border-white/10 text-white hover:bg-white/10">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex min-h-[50vh] items-center justify-center pt-4 animate-fade-in">
      <Card className="w-full max-w-md bg-white/5 backdrop-blur-lg border-white/10 shadow-2xl p-6 text-center text-white">
        <CardHeader className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10">
            <Linkedin className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl mt-4">Connect LinkedIn Profile</CardTitle>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            Connect your LinkedIn account to view followers, post impressions, engagement rates, and detailed demographic metrics.
          </p>
        </CardHeader>
        <CardContent className="mt-6">
          <Button onClick={handleConnect} className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white" size="lg">
            Connect LinkedIn Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-white p-2 md:p-6 space-y-6 animate-fade-in -m-6 sm:-m-8 relative overflow-hidden">
      {/* ── Background Gradient Orbs ──────────────────────────────────── */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none z-0" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none z-0" />
      <ConfirmDisconnectModal 
        isOpen={showDisconnectModal} 
        onClose={() => setShowDisconnectModal(false)} 
        onConfirm={() => {
          setShowDisconnectModal(false);
          handleRevoke();
        }} 
      />
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 px-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
            <Linkedin className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">LinkedIn Analytics</h2>
            <p className="text-sm text-blue-200/60">Profile insights and engagement</p>
          </div>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2 flex-wrap">
            <DateRangePicker 
              startDate={dateRange.start} 
              endDate={dateRange.end} 
              onChange={setDateRange} 
            />
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="text-xs text-slate-400 border-white/10 bg-white/5 hover:bg-white/10 hover:text-slate-100 h-9 px-3"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowDisconnectModal(true)} disabled={revokeLoading} className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 h-9">
              {revokeLoading ? "Revoking..." : "Revoke Access"}
            </Button>
          </div>
        )}
      </div>

      <div className="px-4 pb-6">
        {loading ? renderLoading() : error ? renderError() : !isConnected ? renderEmptyState() : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 mb-6 flex-wrap h-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400">Overview</TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400">Content</TabsTrigger>
              <TabsTrigger value="audience" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400">Audience</TabsTrigger>
              <TabsTrigger value="engagement" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400">Engagement</TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ─────────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-6 animate-fade-in">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Follower Count", value: formatNumber(metrics.followers || rawData.followers || 0), inc: "+1.2%", icon: Users, color: "text-blue-400" },
                  { label: "Search Appearances", value: formatNumber(metrics.searchAppearances || rawData.searchAppearances || 0), inc: "+5.4%", icon: Search, color: "text-emerald-400" },
                  { label: "Profile Visitors", value: formatNumber(metrics.profileViews || rawData.profileViews || 0), inc: "+2.1%", icon: Eye, color: "text-violet-400" },
                  { label: "Custom Button Clicks", value: formatNumber(metrics.clicks || rawData.clicks || 0), inc: "+0.8%", icon: MousePointerClick, color: "text-pink-400" }
                ].map((kpi, idx) => (
                  <Card key={idx} className="bg-white/5 backdrop-blur-lg border-white/10 text-white hover:border-blue-500/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">{kpi.label}</p>
                          <p className="mt-1 text-3xl font-bold">{kpi.value}</p>
                        </div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/5`}>
                          <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">{kpi.inc} this month</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Impressions Chart */}
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-200">Total Impressions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={getChartData(metrics.impressionsTrend, defaultLineChart)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="day" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#2563eb33" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Content Tab ──────────────────────────────────────────── */}
            <TabsContent value="content" className="space-y-6 animate-fade-in">
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 text-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-200">Content Performance</CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 border border-white/10 text-gray-300 hover:text-white">
                    <Filter className="h-4 w-4 mr-2" /> Filter
                  </Button>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="posts" className="w-full">
                    <TabsList className="bg-[#1e293b] border border-white/5 mb-4">
                      <TabsTrigger value="posts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Posts</TabsTrigger>
                      <TabsTrigger value="articles" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Articles</TabsTrigger>
                      <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Documents</TabsTrigger>
                    </TabsList>
                    
                    {["posts", "articles", "documents"].map(type => {
                      const items = content[type] || [];
                      return (
                        <TabsContent key={type} value={type} className="space-y-4">
                          {items.length === 0 ? (
                            <div className="flex h-32 items-center justify-center rounded-lg border border-white/5 bg-white/5">
                              <p className="text-sm text-gray-400">No {type} analytics available.</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-400 bg-white/5 rounded-t-lg">
                                  <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Content</th>
                                    <th className="px-4 py-3">Impressions</th>
                                    <th className="px-4 py-3">Clicks</th>
                                    <th className="px-4 py-3">CTR</th>
                                    <th className="px-4 py-3">Reactions</th>
                                    <th className="px-4 py-3">Comments</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                      <td className="px-4 py-3 font-medium text-white truncate max-w-[200px]">{item.title || "Untitled"}</td>
                                      <td className="px-4 py-3">{formatNumber(item.impressions)}</td>
                                      <td className="px-4 py-3">{formatNumber(item.clicks)}</td>
                                      <td className="px-4 py-3">{item.ctr || "0"}%</td>
                                      <td className="px-4 py-3">{formatNumber(item.reactions)}</td>
                                      <td className="px-4 py-3">{formatNumber(item.comments)}</td>
                                      <td className="px-4 py-3 text-gray-400">{item.date || "N/A"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Audience Tab ─────────────────────────────────────────── */}
            <TabsContent value="audience" className="space-y-6 animate-fade-in">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Job Titles */}
                <Card className="bg-white/5 backdrop-blur-lg border-white/10 text-white">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-200">Viewer Job Titles</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={getChartData(demographics.jobTitles, defaultPieChart)}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}
                          dataKey="value"
                        >
                          {getChartData(demographics.jobTitles, defaultPieChart).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === "No Data" ? "#334155" : COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Industries */}
                <Card className="bg-white/5 backdrop-blur-lg border-white/10 text-white">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-200">Viewer Industries</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={getChartData(demographics.industries, defaultPieChart)}
                          cx="50%" cy="50%" outerRadius={80}
                          dataKey="value"
                        >
                          {getChartData(demographics.industries, defaultPieChart).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === "No Data" ? "#334155" : COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Company Sizes */}
                <Card className="bg-white/5 backdrop-blur-lg border-white/10 text-white md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-200">Company Sizes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={getChartData(demographics.companySizes, [{ name: "No Data", value: 0 }])}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff05" }} />
                        <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                          {getChartData(demographics.companySizes, []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Engagement Tab ───────────────────────────────────────── */}
            <TabsContent value="engagement" className="space-y-6 animate-fade-in">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Engagement Trend */}
                <Card className="bg-white/5 backdrop-blur-lg border-white/10 text-white col-span-1 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-200">Engagement Rate Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getChartData(metrics.engagementTrend, defaultLineChart)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="day" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Network Growth */}
                <Card className="bg-white/5 backdrop-blur-lg border-white/10 text-white col-span-1 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-200">Network Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={getChartData(metrics.growthTrend, defaultLineChart)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="day" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b98133" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
