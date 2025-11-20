
import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { Sparkles } from 'lucide-react';
import { DashboardMetrics } from '../../types';
import { fetchDashboardMetrics } from '../../services/mockData';
import { generateAdminTrendAnalysis } from '../../services/geminiService';

const Overview: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    fetchDashboardMetrics().then(setMetrics);
  }, []);

  const handleGenerateAnalysis = async () => {
    if (!metrics) return;
    setLoadingAI(true);
    const result = await generateAdminTrendAnalysis(metrics);
    // Format basic markdown
    setAiAnalysis(result.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>'));
    setLoadingAI(false);
  };

  if (!metrics) return <div className="text-gray-400">Loading analytics...</div>;

  // Prepare data for Bar Chart
  const barData = Object.entries(metrics.averageScores).map(([name, value]) => ({ name, value }));
  
  // Colors for bars
  const getBarColor = (val: number) => {
    if (val >= 6) return '#22c55e'; // green-500
    if (val >= 4) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  // Helper for KPI Cards
  const KPICard = ({ title, value, subtext, colorClass = "text-white" }: any) => (
    <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 flex flex-col justify-between h-full">
        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-2">{title}</h3>
        <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${colorClass}`}>{typeof value === 'number' ? value.toFixed(1) : value}</span>
        </div>
        {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1">Welcome back, Admin. Here is your performance pulse.</p>
        </div>
        <div className="text-right">
          <span className="block text-sm text-gray-500 uppercase tracking-wider">Total Submissions</span>
          <span className="text-4xl font-black text-white">{metrics.totalSubmissions}</span>
        </div>
      </header>

      {/* Comprehensive KPI Grid */}
      <div>
          <h2 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Performance by Quadrant (Avg / 7)</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Consciousness */}
              <KPICard title="Energy" value={metrics.averageScores.Energy} colorClass="text-orange-400" subtext="Consciousness" />
              <KPICard title="Awareness" value={metrics.averageScores.Awareness} colorClass="text-orange-400" subtext="Consciousness" />
              
              {/* Connection */}
              <KPICard title="Love" value={metrics.averageScores.Love} colorClass="text-blue-400" subtext="Connection" />
              <KPICard title="Tribe" value={metrics.averageScores.Tribe} colorClass="text-blue-400" subtext="Connection" />

              {/* Contribution */}
              <KPICard title="Career" value={metrics.averageScores.Career} colorClass="text-green-400" subtext="Contribution" />
              <KPICard title="Abundance" value={metrics.averageScores.Abundance} colorClass="text-green-400" subtext="Contribution" />
              
              {/* Commitment */}
              <KPICard title="Fitness" value={metrics.averageScores.Fitness} colorClass="text-purple-400" subtext="Commitment" />
              <KPICard title="Health" value={metrics.averageScores.Health} colorClass="text-purple-400" subtext="Commitment" />

              {/* Adventure */}
              <div className="col-span-2 md:col-span-1">
                <KPICard title="Adventure" value={metrics.averageScores.Adventure} colorClass="text-red-400" subtext="X Factor" />
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-full flex flex-col justify-center items-center">
                <h3 className="text-gray-400 text-sm font-medium mb-2">Completion Rate</h3>
                <div className="text-4xl font-bold text-white">{metrics.completionRate}%</div>
                <div className="text-xs text-green-500 mt-1">Safe operational range</div>
              </div>
          </div>
          {/* AI Insights Section - Wide */}
          <div className="col-span-1 md:col-span-3">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-orange-500/30 shadow-2xl relative overflow-hidden h-full">
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="text-orange-400 w-5 h-5" />
                            <h3 className="text-xl font-bold text-white">AI Strategic Analysis</h3>
                        </div>
                        <button 
                            onClick={handleGenerateAnalysis}
                            disabled={loadingAI}
                            className="text-xs font-bold bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full transition-colors border border-orange-500/20"
                        >
                            {loadingAI ? 'Analyzing Database...' : 'Run Full Database Analysis'}
                        </button>
                    </div>
                    
                    {aiAnalysis ? (
                        <div 
                            className="prose prose-invert prose-sm max-w-none bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 max-h-48 overflow-y-auto custom-scrollbar"
                            dangerouslySetInnerHTML={{ __html: aiAnalysis }}
                        />
                    ) : (
                        <p className="text-gray-500 text-sm italic">Click "Run Full Database Analysis" to generate a strategic executive summary identifying global strengths, bottlenecks, and specific question trends.</p>
                    )}
                </div>
            </div>
          </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submissions Trend */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6">Submission Velocity (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.submissionsLast30Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                    dataKey="date" 
                    tick={{fill: '#9CA3AF', fontSize: 10}} 
                    tickFormatter={(str) => str.slice(5)} 
                    stroke="#4B5563"
                />
                <YAxis tick={{fill: '#9CA3AF'}} stroke="#4B5563" />
                <Tooltip 
                    contentStyle={{backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6'}}
                    itemStyle={{color: '#F97316'}}
                />
                <Line type="monotone" dataKey="count" stroke="#F97316" strokeWidth={3} dot={{r: 3, fill: '#F97316'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6">Performance Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" tick={{fill: '#9CA3AF', fontSize: 10}} stroke="#4B5563" />
                <YAxis domain={[0, 7]} tick={{fill: '#9CA3AF'}} stroke="#4B5563" />
                <Tooltip contentStyle={{backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6'}} cursor={{fill: '#374151', opacity: 0.4}}/>
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.value as number)} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;