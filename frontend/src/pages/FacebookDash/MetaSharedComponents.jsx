import { Activity, BarChart3, Bookmark, Calendar, ChevronDown, Eye, FileText, Heart, HelpCircle, History, MessageCircle, MoreVertical, Settings, Share2, Target, ThumbsUp, TrendingDown, TrendingUp, Users, Video } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FB_BLUE = "#1877F2";
const PIE_COLORS = ["#1877F2", "#10b981", "#8b5cf6", "#64748b"];

export function EmptyState({ title, description, icon: Icon, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[#161B22] rounded-xl border border-white/5">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 mb-6">
        <Icon className="h-8 w-8 text-blue-500" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6">{description}</p>
      {actionLabel && (
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ── Empty Data State ─────────────────────────────────────────────────────────
// Shown when the user IS connected but the API has returned no analytics data.
// Prevents "0s and N/As" from rendering across all chart panels.
export function EmptyDataState({ platform }) {
  const isFb = platform === "Facebook";
  const accent = isFb ? "text-blue-400" : "text-pink-400";
  const ring   = isFb ? "bg-blue-500/10" : "bg-pink-500/10";
  return (
    <div className="flex min-h-[50vh] items-center justify-center w-full">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        {/* Pulsing icon ring */}
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${ring} animate-pulse`}>
          <Activity className={`h-7 w-7 ${accent}`} />
        </div>
        <h3 className="text-base font-semibold text-white">
          Connection successful — no data yet
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Your {platform} account is connected, but there is no analytics data available for this account yet.
          This can happen with newly created pages or accounts with very limited activity.
          Try refreshing in a few minutes.
        </p>
      </div>
    </div>
  );
}

export function ConnectPrompt({ onConnect, platform, icon: Icon }) {
  const isFb = platform === "Facebook";
  const bg = isFb ? "bg-blue-500/10" : "bg-pink-500/10";
  const text = isFb ? "text-blue-500" : "text-pink-500";
  const btn = isFb ? "bg-[#1877F2] hover:bg-[#1877F2]/90" : "bg-[#E1306C] hover:bg-[#E1306C]/90";
  
  return (
    <div className="flex min-h-[60vh] items-center justify-center animate-fade-in w-full">
      <Card className="w-full max-w-md bg-[#161B22]/60 border-white/10 shadow-2xl p-6 text-center backdrop-blur-md">
        <CardHeader className="flex flex-col items-center gap-2 p-0">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${bg}`}>
            <Icon className={`h-8 w-8 ${text}`} />
          </div>
          <CardTitle className="text-xl mt-4 text-white">Connect {platform}</CardTitle>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Connect your {platform} account to view reach, engagement, followers, and detailed visual performance graphs.
          </p>
        </CardHeader>
        <CardContent className="mt-6 p-0">
          <button
            onClick={onConnect}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors text-white ${btn}`}
          >
            Connect {platform}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Scaffolded Facebook Child Components ────────────────────────────────

export function KpiCard({ title, value, showActive, icon: Icon }) {
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
}

export function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161B22] border border-white/10 rounded-lg p-3 shadow-xl text-xs">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }}>
          {e.name}: <span className="font-bold text-white">{e.value}</span>
        </p>
      ))}
    </div>
  );
}

export function FacebookDataTable({ data, title, icon: Icon, kpis = [] }) {
  if (!data || data.length === 0) return <EmptyState title={`No ${title} Found`} description={`You haven't published any ${title.toLowerCase()} yet.`} icon={Icon} />;

  const isStories = title === "Stories";
  const isVideos = title === "Videos";

  return (
    <div className="space-y-6">
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <KpiCard 
              key={i} 
              title={k.label} 
              value={k.value} 
              showActive={false} 
            />
          ))}
        </div>
      )}

      <Card className="bg-[#161B22] border-white/5 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-200">All {title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left table-fixed">
              <thead className="text-xs text-slate-400 bg-white/5 uppercase border-y border-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">Content</th>
                  <th className="px-6 py-4 font-medium">Published</th>
                  {isVideos ? (
                    <>
                      <th className="px-6 py-4 font-medium text-right">Plays</th>
                      <th className="px-6 py-4 font-medium text-right">Watch Time</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 font-medium text-right">Reach</th>
                      <th className="px-6 py-4 font-medium text-right">{isStories ? "Tap Forwards" : "Impressions"}</th>
                    </>
                  )}
                  {isStories ? (
                    <>
                      <th className="px-6 py-4 font-medium text-right">Tap Backs</th>
                      <th className="px-6 py-4 font-medium text-right">Exits</th>
                      <th className="px-6 py-4 font-medium text-right">Replies</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 font-medium text-right">Likes</th>
                      <th className="px-6 py-4 font-medium text-right">Comments</th>
                      <th className="px-6 py-4 font-medium text-right">Eng. Rate</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((item, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 truncate max-w-[150px]">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt="thumbnail" className="w-10 h-10 rounded object-cover" />
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] lg:max-w-[250px]">{item.title}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{item.date}</td>
                    
                    {isVideos ? (
                      <>
                        <td className="px-6 py-4 text-slate-200 text-right font-medium">{item.plays}</td>
                        <td className="px-6 py-4 text-slate-200 text-right font-medium">{item.watchTime}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-slate-200 text-right font-medium">{item.reach}</td>
                        <td className="px-6 py-4 text-slate-200 text-right font-medium">{isStories ? item.tapForwards : item.impressions}</td>
                      </>
                    )}

                    {isStories ? (
                      <>
                        <td className="px-6 py-4 text-slate-200 text-right">{item.tapBacks}</td>
                        <td className="px-6 py-4 text-slate-200 text-right">{item.exits}</td>
                        <td className="px-6 py-4 text-emerald-400 text-right font-medium">{item.replies}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-slate-200 text-right">{item.likes}</td>
                        <td className="px-6 py-4 text-slate-200 text-right">{item.comments}</td>
                        <td className="px-6 py-4 text-emerald-400 text-right font-medium">{item.rate}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function InstagramDataTable({ data, title, icon: Icon, kpis = [] }) {
  if (!data || data.length === 0) return <EmptyState title={`No ${title} Found`} description={`You haven't published any ${title.toLowerCase()} yet.`} icon={Icon} />;

  const isStories = title === "Stories";
  const isReels = title === "Reels";

  return (
    <div className="space-y-6">
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <KpiCard 
              key={i} 
              title={k.label} 
              value={k.value} 
              showActive={false} 
            />
          ))}
        </div>
      )}

      <Card className="bg-[#161B22] border-white/5 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-200">All {title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left table-fixed">
              <thead className="text-xs text-slate-400 bg-white/5 uppercase border-y border-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">Content</th>
                  <th className="px-6 py-4 font-medium">Published</th>
                  {isReels ? (
                    <>
                      <th className="px-6 py-4 font-medium text-right">Plays</th>
                      <th className="px-6 py-4 font-medium text-right">Watch Time</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 font-medium text-right">Reach</th>
                      <th className="px-6 py-4 font-medium text-right">{isStories ? "Tap Forwards" : "Impressions"}</th>
                    </>
                  )}
                  {isStories ? (
                    <>
                      <th className="px-6 py-4 font-medium text-right">Tap Backs</th>
                      <th className="px-6 py-4 font-medium text-right">Exits</th>
                      <th className="px-6 py-4 font-medium text-right">Replies</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 font-medium text-right">Likes</th>
                      <th className="px-6 py-4 font-medium text-right">Comments</th>
                      <th className="px-6 py-4 font-medium text-right">Eng. Rate</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((item, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 truncate max-w-[150px]">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt="thumbnail" className="w-10 h-10 rounded object-cover" />
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] lg:max-w-[250px]">{item.title}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{item.date}</td>
                    
                    {isReels ? (
                      <>
                        <td className="px-6 py-4 text-slate-200 text-right font-medium">{item.plays}</td>
                        <td className="px-6 py-4 text-slate-200 text-right font-medium">{item.watchTime}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-slate-200 text-right font-medium">{item.reach}</td>
                        <td className="px-6 py-4 text-slate-200 text-right font-medium">{isStories ? item.tapForwards : item.impressions}</td>
                      </>
                    )}

                    {isStories ? (
                      <>
                        <td className="px-6 py-4 text-slate-200 text-right">{item.tapBacks}</td>
                        <td className="px-6 py-4 text-slate-200 text-right">{item.exits}</td>
                        <td className="px-6 py-4 text-emerald-400 text-right font-medium">{item.replies}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-slate-200 text-right">{item.likes}</td>
                        <td className="px-6 py-4 text-slate-200 text-right">{item.comments}</td>
                        <td className="px-6 py-4 text-emerald-400 text-right font-medium">{item.rate}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProgressBar({ label, value, max, color = FB_BLUE }) {
  const w = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden flex-shrink-0">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  );
}