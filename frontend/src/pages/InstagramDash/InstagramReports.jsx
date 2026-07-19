import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Filter } from 'lucide-react';
import DateRangePicker from '@/components/DateRangePicker';
import reportApi from '@/services/reportApi';

const InstagramReports = () => {
  const { isConnected } = useOutletContext();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const d = new Date();
  d.setDate(d.getDate() - 30);
  const defaultStart = d.toISOString().split('T')[0];
  const defaultEnd = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ start: defaultStart, end: defaultEnd });

  const handleExport = async (format) => {
    if (format === 'pdf') setIsExportingPdf(true);
    if (format === 'csv') setIsExportingCsv(true);

    try {
      await reportApi.exportAnalytics('instagram', format, dateRange.start, dateRange.end);
    } catch (error) {
      console.error(`Failed to export ${format}:`, error);
      alert(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setIsExportingPdf(false);
      setIsExportingCsv(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl text-white font-semibold mb-2">Account Disconnected</h2>
        <p className="text-gray-400">Please connect your Instagram account to generate reports.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Export Reports</h1>
          <p className="text-gray-400 mt-1">Download your Instagram analytics data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-white font-semibold">Custom Report</CardTitle>
            <p className="text-sm text-gray-400">Generate a comprehensive PDF or CSV report</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Date Range</label>
                <div className="flex items-center gap-2 p-1 border border-white/10 rounded-lg bg-black/20">
                  <DateRangePicker 
                    startDate={dateRange.start} 
                    endDate={dateRange.end} 
                    onChange={setDateRange} 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Metrics to Include</label>
                <div className="flex items-center gap-2 p-2 border border-white/10 rounded-lg bg-black/20">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-300">All Metrics</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => handleExport('pdf')}
                disabled={isExportingPdf || isExportingCsv}
                className="flex-1 bg-[#E1306C] hover:bg-[#E1306C]/90 text-white font-semibold shadow-lg shadow-[#E1306C]/20 transition-all active:scale-95"
              >
                {isExportingPdf ? 'Generating PDF...' : 'Export as PDF'}
                {!isExportingPdf && <FileText className="w-4 h-4 ml-2" />}
              </Button>
              <Button 
                onClick={() => handleExport('csv')}
                disabled={isExportingPdf || isExportingCsv}
                variant="outline"
                className="flex-1 border-white/10 text-white hover:bg-white/10 font-semibold shadow-lg transition-all active:scale-95"
              >
                {isExportingCsv ? 'Generating CSV...' : 'Export CSV'}
                {!isExportingCsv && <Download className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstagramReports;
