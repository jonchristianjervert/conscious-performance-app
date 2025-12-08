import React, { useState } from 'react';
import { FileText, Download, Calendar, Search, Sparkles, BookOpen } from 'lucide-react';
import { downloadCSV, fetchDashboardMetrics, fetchSubmissions } from '../../services/mockData';
import { generateWeeklyReportSummary, generateAdvancedResearchReport } from '../../services/geminiService';

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportSummary, setReportSummary] = useState<string>('');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  
  // Advanced Report State
  const [occupation, setOccupation] = useState('');
  const [advancedReport, setAdvancedReport] = useState('');
  const [loadingAdvanced, setLoadingAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'standard' | 'advanced'>('standard');

  const handleGenerateReport = async () => {
    setLoading(true);
    const metrics = await fetchDashboardMetrics();
    const summary = await generateWeeklyReportSummary(dateRange, metrics);
    setReportSummary(summary.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>'));
    setLoading(false);
  };

  const handleGenerateAdvanced = async () => {
    if (!occupation) return;
    setLoadingAdvanced(true);
    // Fetch ALL submissions to pass to the AI for analysis
    const allSubmissions = await fetchSubmissions();
    const report = await generateAdvancedResearchReport(occupation, allSubmissions);
    setAdvancedReport(report);
    setLoadingAdvanced(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white">Reports & Intelligence</h1>
                <p className="text-gray-400 mt-1">Export data and generate automated performance summaries.</p>
            </div>
            <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
                <button 
                    onClick={() => setActiveTab('standard')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'standard' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Standard Reports
                </button>
                <button 
                    onClick={() => setActiveTab('advanced')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'advanced' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Sparkles size={14} /> Research Grade
                </button>
            </div>
        </header>

        {activeTab === 'standard' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Standard Report Config */}
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
        ) : (
            // ADVANCED RESEARCH TAB
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-900/40 to-gray-900 border border-blue-500/30 p-8 rounded-2xl">
                    <div className="max-w-3xl">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                            <BookOpen className="text-blue-400" />
                            Occupation-Based Strategic Analysis
                        </h2>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Generate research-grade reports comparable to HBR or McKinsey. 
                            This engine segments your data by occupation, benchmarks it against global averages, 
                            and uses predictive AI to identify leadership archetypes and burnout risks.
                        </p>
                        
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Enter Occupation (e.g. CEO, Nurse, Sales)"
                                    className="w-full bg-black/40 border border-blue-500/30 rounded-xl py-4 pl-12 pr-6 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={occupation}
                                    onChange={(e) => setOccupation(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleGenerateAdvanced}
                                disabled={!occupation || loadingAdvanced}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {loadingAdvanced ? 'Analyzing Data...' : 'Run Analysis'}
                            </button>
                        </div>
                    </div>
                </div>

                {advancedReport && (
                    <div className="bg-white text-black p-12 rounded-xl shadow-2xl animate-fade-in max-w-5xl mx-auto">
                        <div className="prose prose-lg max-w-none">
                            {/* Simple Markdown Rendering */}
                            <div dangerouslySetInnerHTML={{ 
                                __html: advancedReport
                                    .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-black mb-6 text-blue-900">$1</h1>')
                                    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 text-blue-800 border-b pb-2 border-gray-200">$1</h2>')
                                    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3 text-gray-800">$1</h3>')
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/\n/g, '<br />')
                            }} />
                        </div>
                        
                        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                            <p className="text-sm text-gray-500 font-serif italic">Generated by Conscious Human Performance Research Engine</p>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default Reports;
