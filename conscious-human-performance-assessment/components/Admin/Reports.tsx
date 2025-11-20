
import React, { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { downloadCSV, fetchDashboardMetrics } from '../../services/mockData';
import { generateWeeklyReportSummary } from '../../services/geminiService';

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportSummary, setReportSummary] = useState<string>('');
  const [dateRange, setDateRange] = useState('Last 30 Days');

  const handleGenerateReport = async () => {
    setLoading(true);
    const metrics = await fetchDashboardMetrics();
    const summary = await generateWeeklyReportSummary(dateRange, metrics);
    setReportSummary(summary.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>'));
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <header>
            <h1 className="text-3xl font-bold text-white">Reports Generator</h1>
            <p className="text-gray-400 mt-1">Export data and generate automated performance summaries.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Report Configuration */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <FileText size={20} className="text-orange-500" />
                    Report Configuration
                </h2>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Date Range</label>
                        <div className="relative">
                            <select 
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 appearance-none focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                                <option>This Quarter</option>
                                <option>Year to Date</option>
                            </select>
                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Include Sections</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-gray-300">
                                <input type="checkbox" checked readOnly className="rounded bg-gray-700 border-gray-600 text-orange-500" />
                                Summary Statistics
                            </label>
                            <label className="flex items-center gap-2 text-gray-300">
                                <input type="checkbox" checked readOnly className="rounded bg-gray-700 border-gray-600 text-orange-500" />
                                AI Trend Analysis
                            </label>
                            <label className="flex items-center gap-2 text-gray-300">
                                <input type="checkbox" checked readOnly className="rounded bg-gray-700 border-gray-600 text-orange-500" />
                                Full Data Export
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button 
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                            {loading ? 'Generating...' : 'Generate Report'}
                        </button>
                        <button 
                            onClick={downloadCSV}
                            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            title="Download CSV"
                        >
                            <Download size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Preview */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
                <h2 className="text-lg font-bold text-white mb-4">Report Preview</h2>
                <div className="flex-1 bg-gray-900 rounded-lg p-6 border border-gray-700 overflow-y-auto custom-scrollbar relative min-h-[300px]">
                    {reportSummary ? (
                        <div className="prose prose-invert prose-sm">
                            <div dangerouslySetInnerHTML={{__html: reportSummary}} />
                            <div className="mt-8 pt-4 border-t border-gray-700 text-xs text-gray-500 text-center">
                                Generated by Conscious Performance AI • {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-600 flex-col">
                            <FileText size={48} className="mb-4 opacity-20" />
                            <p>Configure and generate a report to view summary.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Reports;