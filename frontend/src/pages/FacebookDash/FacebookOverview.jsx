import { Activity, BarChart3, Bookmark, Calendar, ChevronDown, Eye, FileText, Heart, HelpCircle, History, MessageCircle, MoreVertical, Settings, Share2, Target, ThumbsUp, TrendingDown, TrendingUp, Users, Video } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FB_BLUE = "#1877F2";
const PIE_COLORS = ["#1877F2", "#3B82F6", "#60A5FA", "#93C5FD"];
import { EmptyState, KpiCard, DarkTooltip, FacebookDataTable, InstagramDataTable, ProgressBar } from './MetaSharedComponents';


export function FacebookOverview({ data, dateRange }) {
  const d = data || {};

  const filterByDate = (arr) => {
    if (!dateRange || !arr) return arr;
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    return arr.filter(item => {
      if (!item.date) return true;
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
    });
  };

  const filteredReach = filterByDate(d?.charts?.reachOverTime);
  const filteredEngagements = filterByDate(d?.charts?.engagementsOverTime);

  const kpiIcons = [Users, Eye, Heart, ThumbsUp, MessageCircle, Share2];
  const kpiColors = [
    "bg-blue-500/10 text-blue-500",
    "bg-indigo-500/10 text-indigo-500",
    "bg-emerald-500/10 text-emerald-500",
    "bg-amber-500/10 text-amber-500",
    "bg-blue-400/10 text-blue-400",
    "bg-rose-500/10 text-rose-500"
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {(d?.kpis || []).map((k, i) => (
          <KpiCard key={i} {...k} icon={kpiIcons[i]} color={kpiColors[i]} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left 2 Columns */}
        <div className="xl:col-span-2 space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#161B22] border-white/5 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-200">Reach Over Time</CardTitle>
                <div className="text-xs text-slate-400 flex items-center gap-1 cursor-pointer">Last 7 days <ChevronDown className="h-3 w-3"/></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredReach} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fbReach" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={FB_BLUE} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={FB_BLUE} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${v/1000}K` : v} />
                      <Tooltip content={<DarkTooltip />} />
                      <Area type="monotone" dataKey="value" name="Reach" stroke={FB_BLUE} strokeWidth={2} fill="url(#fbReach)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#161B22] border-white/5 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-200">Engagements Over Time</CardTitle>
                <div className="text-xs text-slate-400 flex items-center gap-1 cursor-pointer">Last 7 days <ChevronDown className="h-3 w-3"/></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredEngagements} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${v/1000}K` : v} />
                      <Tooltip content={<DarkTooltip />} cursor={{ fill: "#ffffff05" }} />
                      <Bar dataKey="value" name="Engagements" fill={FB_BLUE} radius={[4, 4, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#161B22] border-white/5 text-white flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-200">Top Posts</CardTitle>
                <button className="text-xs text-slate-400 hover:text-white transition-colors">View all</button>
              </CardHeader>
              <CardContent className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-[10px] uppercase text-slate-500 border-b border-white/5">
                    <tr>
                      <th className="pb-3 font-medium">Post</th>
                      <th className="pb-3 font-medium text-right">Reach</th>
                      <th className="pb-3 font-medium text-right">Engagements</th>
                      <th className="pb-3 font-medium text-right">Reactions</th>
                      <th className="pb-3 font-medium text-right">Comments</th>
                      <th className="pb-3 font-medium text-right">Shares</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(d?.tables?.topPosts || []).map((p, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 max-w-[150px] sm:max-w-[200px] xl:max-w-[250px]">
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-slate-200 truncate">{p.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">{p.date}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right text-xs text-slate-300">{p.reach}</td>
                        <td className="py-3 text-right text-xs text-slate-300">{p.engagements}</td>
                        <td className="py-3 text-right text-xs text-slate-300">{p.reactions}</td>
                        <td className="py-3 text-right text-xs text-slate-300">{p.comments}</td>
                        <td className="py-3 text-right text-xs text-slate-300">{p.shares}</td>
                        <td className="py-3 text-right"><MoreVertical className="h-4 w-4 text-slate-500 inline-block" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="bg-[#161B22] border-white/5 text-white flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-200">Top Videos</CardTitle>
                <button className="text-xs text-slate-400 hover:text-white transition-colors">View all</button>
              </CardHeader>
              <CardContent className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-[10px] uppercase text-slate-500 border-b border-white/5">
                    <tr>
                      <th className="pb-3 font-medium">Video</th>
                      <th className="pb-3 font-medium text-right">Views</th>
                      <th className="pb-3 font-medium text-right">Engagements</th>
                      <th className="pb-3 font-medium text-right">Watch Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(d?.tables?.topVideos || []).map((v, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 max-w-[150px] sm:max-w-[200px] xl:max-w-[250px]">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-16 rounded overflow-hidden flex-shrink-0">
                              <img src={v.image} alt="" className="h-full w-full object-cover" />
                              <span className="absolute bottom-1 right-1 bg-black/70 text-[8px] px-1 rounded text-white">{v.duration}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-slate-200 truncate">{v.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">{v.date} • {v.duration}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right text-xs text-slate-300">{v.views}</td>
                        <td className="py-3 text-right text-xs text-slate-300">{v.engagements}</td>
                        <td className="py-3 text-right text-xs text-slate-300">{v.watchTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="bg-[#161B22] border-white/5 text-white">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-medium text-slate-200">Engagement Rate</CardTitle>
              <div className="mt-2">
                <p className="text-2xl font-bold">{d?.charts?.engagementRate?.rate}</p>
                <div className="flex items-center gap-1 mt-1 text-emerald-400 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" /> +{d?.charts?.engagementRate?.change}% <span className="text-slate-500 font-normal">vs previous 7 days</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d?.charts?.engagementRate?.data}>
                    <Tooltip content={<DarkTooltip />} />
                    <Line type="monotone" dataKey="rate" name="Rate" stroke="#1877F2" strokeWidth={2} dot={{ r: 3, fill: "#1877F2", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#161B22] border-white/5 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Reach by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="h-64 w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={d?.charts?.reachBySource} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                        {(d?.charts?.reachBySource || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<DarkTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {(d?.charts?.reachBySource || []).map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-400">{s.name}</span>
                      </div>
                      <span className="text-slate-200">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#161B22] border-white/5 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Audience Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-3 font-medium">Age & Gender</p>
                <div className="flex items-center gap-6 mb-4">
                  <div className="relative h-12 w-12 rounded-full border-4 border-white/5 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#1877F2] border-r-[#1877F2] border-b-[#10b981] border-l-[#8b5cf6]" style={{ transform: "rotate(-45deg)" }} />
                  </div>
                  <div className="flex-1 space-y-1">
                    {(d?.charts?.audience?.ageGender || []).map((ag, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                          <span className="text-slate-400">{ag.group}</span>
                        </div>
                        <span className="text-slate-200">{ag.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <p className="text-xs text-slate-400 mb-3 font-medium">Top Countries</p>
                <div className="space-y-2.5">
                  {(d?.charts?.audience?.topCountries || []).map((c, i) => (
                    <ProgressBar key={i} label={c.country} value={c.value} max={100} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Shared Empty State Helper ──────────────────────────────────────────