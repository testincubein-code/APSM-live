import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, FileText, ExternalLink } from "lucide-react";
import { useOutletContext } from "react-router-dom";

// Helper: Format large numbers to compact labels (e.g. 1.2K)
const formatCompactNumber = (num) => {
  if (num === null || num === undefined) return "--";
  const val = Number(num);
  if (isNaN(val)) return "--";
  if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
  if (val >= 1000) return (val / 1000).toFixed(1) + "K";
  return val.toString();
};

export default function LinkedInContent() {
  const { analyticsData } = useOutletContext();
  const content = analyticsData?.content || {};

  // ── States ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Get raw content categories
  const posts = content.posts || [];
  const articles = content.articles || [];
  const documents = content.documents || [];

  // Add formats to items
  const allItems = [
    ...posts.map(p => ({ ...p, type: "Post" })),
    ...articles.map(a => ({ ...a, type: "Article" })),
    ...documents.map(d => ({ ...d, type: "Document" }))
  ];

  // ── Filtering Logic ────────────────────────────────────────────────
  const filteredItems = allItems.filter(item => {
    // 1. Tab Format Filter
    if (activeTab === "text" && item.type !== "Post") return false;
    if (activeTab === "articles" && item.type !== "Article") return false;
    if (activeTab === "documents" && item.type !== "Document") return false;
    // (If user clicks Images/Video and they aren't explicitly split, fallback safely)
    if (activeTab === "images" && item.type !== "Post") return false;
    if (activeTab === "video" && item.type !== "Post") return false;

    // 2. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleText = (item.title || "").toLowerCase();
      if (!titleText.includes(query)) return false;
    }

    // 3. Date Range Filter
    if (item.date) {
      const itemTime = new Date(item.date).getTime();
      if (startDate) {
        const startTime = new Date(startDate).getTime();
        if (itemTime < startTime) return false;
      }
      if (endDate) {
        const endTime = new Date(endDate).getTime();
        if (itemTime > endTime) return false;
      }
    }

    return true;
  });

  return (
    <div className="animate-fade-in p-6 space-y-6  text-white">
      {/* ── Tabs & Filter Bar ────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-auto">
          <TabsList className="bg-[#161B22]/90 border border-white/5 flex-wrap h-auto">
            <TabsTrigger value="all" className="data-[state=active]:bg-[#0A66C2] data-[state=active]:text-white text-gray-400">All Formats</TabsTrigger>
            <TabsTrigger value="text" className="data-[state=active]:bg-[#0A66C2] data-[state=active]:text-white text-gray-400">Text</TabsTrigger>
            <TabsTrigger value="images" className="data-[state=active]:bg-[#0A66C2] data-[state=active]:text-white text-gray-400">Images</TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-[#0A66C2] data-[state=active]:text-white text-gray-400">Documents</TabsTrigger>
            <TabsTrigger value="video" className="data-[state=active]:bg-[#0A66C2] data-[state=active]:text-white text-gray-400">Video</TabsTrigger>
            <TabsTrigger value="articles" className="data-[state=active]:bg-[#0A66C2] data-[state=active]:text-white text-gray-400">Articles</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Local Search & Date Range Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#161B22]/80 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#0A66C2]/50 w-full"
            />
          </div>
          <div className="flex items-center gap-2 bg-[#161B22]/80 border border-white/10 rounded-lg px-2.5 py-1">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none border-none outline-none [color-scheme:dark]"
            />
            <span className="text-gray-500 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none border-none outline-none [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* ── Content Performance Table ────────────────────────────────── */}
      <Card className="bg-[#161B22]/90 backdrop-blur-md border border-white/5 text-white shadow-xl">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#0A66C2]" />
            Corporate Updates Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase tracking-wider text-gray-400 bg-white/5">
                  <tr>
                    <th className="px-6 py-4">Post Content</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-right">Impressions</th>
                    <th className="px-6 py-4 text-right">Reactions</th>
                    <th className="px-6 py-4 text-right">Comments</th>
                    <th className="px-6 py-4 text-right">Clicks</th>
                    <th className="px-6 py-4 text-right">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 max-w-[320px]">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-white truncate max-w-xs" title={item.title}>
                            {item.title || "Untitled update"}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {item.date ? new Date(item.date).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric'
                            }) : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.type === "Article" 
                            ? "bg-violet-500/10 text-violet-400" 
                            : item.type === "Document" 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "bg-[#0A66C2]/10 text-[#0A66C2]"
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{formatCompactNumber(item.impressions)}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCompactNumber(item.reactions)}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCompactNumber(item.comments)}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCompactNumber(item.clicks)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-400 flex items-center justify-end gap-1">
                        {item.ctr ? `${item.ctr}%` : "0.0%"}
                        <ExternalLink className="h-3 w-3 opacity-30" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-gray-400">
              Not enough analytical data available yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

