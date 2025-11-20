import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell
} from 'recharts';
import { Sparkles, TrendingUp, Users, CheckCircle, Activity, Zap, Heart, Briefcase, Dumbbell } from 'lucide-react';
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
    setAiAnalysis(result.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>'));
    setLoadingAI(false);
  };

  if (!metrics) return <div className="flex h-64 items-center justify-center text-gray-400">Loading analytics...</div>;

  const barData = Object.entries(metrics.averageScores).map(([name, value]) => ({ name, value }));
  
  const getBarColor = (val: number) => {
    if (val >= 6) return '#10B981'; // Green
    if (val >= 4) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  // Helper for distinct card styles
  const KPICard = ({ title, value, subtext, colorClass, icon: Icon }: any) => {
    // Map descriptive color classes to vibrant gradients
    let gradient = "from-gray-800 to-gray-900";
    let borderColor = "border-white/5";
    let iconColor = "text-white/20";
    let shadowColor = "shadow-black/50";

    if (colorClass === 'orange') {
        gradient = "from-orange-900/80 to-orange-950/90";
        borderColor = "border-orange-500/30";
        iconColor = "text-orange-500/20";
        shadowColor = "shadow-orange-900/20";
    } else if (colorClass === 'blue') {
        gradient = "from-blue-900/80 to-blue-950/90";
        borderColor = "border-blue-500/30";
        iconColor = "text-blue-500/20";
        shadowColor = "shadow-blue-900/20";
    } else if (colorClass === 'green') {
        gradient = "from-emerald-900/80 to-emerald-950/90";
        borderColor = "border-emerald-500/30";
        iconColor = "text-emerald-500/20";
        shadowColor = "shadow-emerald-900/20";
    } else if (colorClass === 'purple') {
        gradient = "from-purple-900/80 to-purple-950/90";
        borderColor = "border-purple-500/30";
        iconColor = "text-purple-500/20";
        shadowColor = "shadow-purple-900/20";
    } else if (colorClass === 'red') {
        gradient = "from-rose-900/80 to-rose-950/90";
        borderColor = "border-rose-500/30";
        iconColor = "text-rose-500/20";
        shadowColor = "shadow-rose-900/20";
    }

    return (
        <div className={`relative p-6 rounded-2xl shadow-xl overflow-hidden bg-gradient-to-br ${gradient} border ${borderColor} group transition-all hover:-translate-y-1 hover:shadow-2xl ${shadowColor}`}>
            <div className={`absolute -right-6 -top-6 ${iconColor} transform rotate-12 group-hover:scale-110 transition-transform duration-700`}>
                {Icon ? <Icon size={100} /> : <Activity size={100} />}
            </div>
            <div className="relative z-10">
                <h3 className="text-white/70 text-xs uppercase tracking-widest font-bold mb-2">{title}</h3>
                <div className="text-4xl font-black text-white drop-shadow-md">
                    {typeof value === 'number' ? value.toFixed(1) : value}
                </div>
                {subtext && (
                    <div className="inline-block mt-3 px-2 py-0.5 rounded bg-black/30 border border-white/10 text-[10px] text-white/80 font-medium uppercase tracking-wide backdrop-blur-md">
                        {subtext}
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-end pb-8 border-b border-white/10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Performance Pulse</h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">Real-time aggregate data analysis of the Conscious Human Performance ecosystem.</p>
        </div>
        <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/10 backdrop-blur-md shadow-lg">
          <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total Submissions</span>
          <span className="text-3xl font-black text-white">{metrics.totalSubmissions}</span>
        </div>
      </header>

      {/* Primary Metrics Grid */}
      <div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5 pl-1 flex items-center gap-2">
            <Activity size={14} /> Quadrant Performance Breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
              <KPICard title="Energy" value={metrics.averageScores.Energy} colorClass="orange" subtext="Consciousness" icon={Zap} />
              <KPICard title="Awareness" value={metrics.averageScores.Awareness} colorClass="orange" subtext="Consciousness" icon={Zap} />
              
              <KPICard title="Love" value={metrics.averageScores.Love} colorClass="blue" subtext="Connection" icon={Heart} />
              <KPICard title="Tribe" value={metrics.averageScores.Tribe} colorClass="blue" subtext="Connection" icon={Users} />

              <KPICard title="Career" value={metrics.averageScores.Career} colorClass="green" subtext="Contribution" icon={Briefcase} />
              <KPICard title="Abundance" value={metrics.averageScores.Abundance} colorClass="green" subtext="Contribution" icon={Briefcase} />
              
              <KPICard title="Fitness" value={metrics.averageScores.Fitness} colorClass="purple" subtext="Commitment" icon={Dumbbell} />
              <KPICard title="Health" value={metrics.averageScores.Health} colorClass="purple" subtext="Commitment" icon={Dumbbell} />

              <div className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-1">
                <KPICard title="Adventure" value={metrics.averageScores.Adventure} colorClass="red" subtext="X Factor" icon={TrendingUp} />
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Completion Rate */}
          <div className="col-span-1 bg-[#1a1c23]/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
               <div className="relative z-10">
                    <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <CheckCircle size={32} />
                    </div>
                    <div className="text-5xl font-black text-white tracking-tighter">{metrics.completionRate}%</div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Completion Rate</div>
               </div>
          </div>
          
          {/* AI Analysis Card */}
          <div className="col-span-1 md:col-span-3 bg-gradient-to-br from-gray-900 via-[#0a0a0a] to-black rounded-2xl border border-white/10 p-0 overflow-hidden relative group shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
                     <Sparkles size={200} />
                </div>
                
                <div className="p-6 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-3 rounded-xl text-white shadow-lg shadow-orange-500/20">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Strategic Intelligence</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <p className="text-xs text-gray-400">Powered by Gemini 2.5 Flash</p>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleGenerateAnalysis}
                        disabled={loadingAI}
                        className="text-xs font-bold bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105"
                    >
                        {loadingAI ? 'Processing Data...' : 'Generate Report'}
                    </button>
                </div>
                
                <div className="p-8 min-h-[200px] max-h-[350px] overflow-y-auto custom-scrollbar bg-black/20">
                    {aiAnalysis ? (
                        <div className="prose prose-invert prose-sm max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: aiAnalysis }} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4 py-8">
                            <div className="p-4 bg-white/5 rounded-full">
                                <Sparkles size={32} className="opacity-20" />
                            </div>
                            <p className="text-sm font-medium">Click generate to analyze trends across {metrics.totalSubmissions} submissions.</p>
                        </div>
                    )}
                </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-2xl">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-8 flex items-center gap-2">
             <TrendingUp size={16} /> 30-Day Velocity
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.submissionsLast30Days}>
                <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" tick={{fill: '#666', fontSize: 10}} tickFormatter={(str) => str.slice(5)} stroke="#333" axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fill: '#666', fontSize: 10}} stroke="#333" axisLine={false} tickLine={false} />
                <Tooltip 
                    contentStyle={{backgroundColor: '#000', borderColor: '#333', color: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}
                    itemStyle={{color: '#F97316', fontWeight: 'bold'}}
                    cursor={{stroke: '#444'}}
                />
                <Line type="monotone" dataKey="count" stroke="#F97316" strokeWidth={3} dot={{r: 4, fill: '#000', stroke: '#F97316', strokeWidth: 2}} activeDot={{r: 8, fill: '#F97316', stroke: '#fff'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-8 flex items-center gap-2">
             <Activity size={16} /> Score Distribution
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" tick={{fill: '#666', fontSize: 10}} stroke="#333" axisLine={false} tickLine={false} dy={10} />
                <YAxis domain={[0, 7]} tick={{fill: '#666', fontSize: 10}} stroke="#333" axisLine={false} tickLine={false}/>
                <Tooltip 
                    cursor={{fill: '#fff', opacity: 0.05}}
                    contentStyle={{backgroundColor: '#000', borderColor: '#333', color: '#fff', borderRadius: '12px'}}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
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