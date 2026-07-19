import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar, FileText, CheckCircle, Database } from "lucide-react";

export default function LinkedInReports() {
  // ── States ────────────────────────────────────────────────────────
  const [reportType, setReportType] = useState("comprehensive");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);

  // Seed default history logs
  const [downloadHistory, setDownloadHistory] = useState([]);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleExport = (e) => {
    e.preventDefault();
    setIsExporting(true);

    setTimeout(() => {
      const typeLabel = 
        reportType === "comprehensive" ? "Comprehensive Summary" :
        reportType === "audience" ? "Audience Demographics" :
        reportType === "updates" ? "Update Performance" : "B2B Performance";

      const formatLabel = reportFormat.toUpperCase();
      const fileName = `linkedin_${reportType}_report_${startDate}_to_${endDate}`;

      const newLog = {
        id: Date.now(),
        name: fileName,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: typeLabel,
        format: formatLabel,
        status: "Completed"
      };

      setDownloadHistory([newLog, ...downloadHistory]);
      setIsExporting(false);

      // Trigger simulated download toast or trigger download
      alert(`Report "${fileName}.${reportFormat}" generated successfully!`);
    }, 1500);
  };

  return (
    <div className="animate-fade-in p-6 space-y-6  text-white">
      {/* Overview Intro */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#0A66C2]/10 text-[#0A66C2] rounded-full">
          <Download className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-bold">B2B Report Export Center</h2>
          <p className="text-xs text-gray-400">Generate high-fidelity spreadsheets and slide summaries of your LinkedIn channel</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* ── Section A: Export Configuration Form ───────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md border border-white/5 text-white shadow-xl md:col-span-1">
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              Export Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleExport} className="space-y-4">
              {/* Report Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#0A66C2]/50 outline-none"
                >
                  <option value="comprehensive">Comprehensive Summary</option>
                  <option value="audience">Audience Demographics</option>
                  <option value="updates">Update Performance</option>
                  <option value="b2b_perf">B2B Performance</option>
                </select>
              </div>

              {/* Format Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">File Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportFormat("pdf")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      reportFormat === "pdf"
                        ? "bg-[#0A66C2]/15 border-[#0A66C2] text-[#0A66C2]"
                        : "border-white/10 bg-background text-gray-400 hover:text-white"
                    }`}
                  >
                    Adobe PDF (.pdf)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportFormat("csv")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      reportFormat === "csv"
                        ? "bg-[#0A66C2]/15 border-[#0A66C2] text-[#0A66C2]"
                        : "border-white/10 bg-background text-gray-400 hover:text-white"
                    }`}
                  >
                    CSV Sheet (.csv)
                  </button>
                </div>
              </div>

              {/* Date Filters */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Custom Date Range</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-background border border-white/10 rounded-lg px-2.5 py-2 w-full">
                    <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent text-xs text-white focus:outline-none border-none outline-none [color-scheme:dark] w-full"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-background border border-white/10 rounded-lg px-2.5 py-2 w-full">
                    <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent text-xs text-white focus:outline-none border-none outline-none [color-scheme:dark] w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Trigger */}
              <Button
                type="submit"
                disabled={isExporting}
                className="w-full bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white font-semibold text-xs shadow-md shadow-[#0A66C2]/15 h-10 mt-6"
              >
                {isExporting ? "Compiling Report..." : `Compile and Download ${reportFormat.toUpperCase()}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Section B: Exports Audit History Table ─────────────────── */}
        <Card className="bg-[#161B22]/90 backdrop-blur-md border border-white/5 text-white shadow-xl md:col-span-2">
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-[#0A66C2]" />
              Export and Download Audit logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {downloadHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] uppercase tracking-wider text-gray-400 bg-white/5">
                    <tr>
                      <th className="px-6 py-4">Report Identifier</th>
                      <th className="px-6 py-4">Date Compiled</th>
                      <th className="px-6 py-4">Report Class</th>
                      <th className="px-6 py-4">Format</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {downloadHistory.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white truncate max-w-[200px]" title={log.name}>
                          {log.name}
                        </td>
                        <td className="px-6 py-4 text-gray-400">{log.date}</td>
                        <td className="px-6 py-4 font-medium">{log.type}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.format === "PDF" 
                              ? "bg-red-500/10 text-red-400" 
                              : "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            {log.format}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[10px]">
                            <CheckCircle className="h-3.5 w-3.5" />
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-sm text-gray-500">
                No report download history available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


