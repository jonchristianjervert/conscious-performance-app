import React, { useState, useEffect } from 'react';
import { Lead, ActivationPlan } from '../../types';
import { ArrowLeft, Save, Sparkles, CheckCircle, FileText } from 'lucide-react';
import { generateActivationPlan } from '../../services/geminiService';
import { saveSession, fetchSessionByLeadId } from '../../services/clientService';

interface SessionModeProps {
  lead: Lead;
  onBack: () => void;
}

const SessionMode: React.FC<SessionModeProps> = ({ lead, onBack }) => {
  const [notes, setNotes] = useState({
    challenges: lead.responses?.struggle || '',
    goals: '',
    gap: '',
  });
  
  const [agreements, setAgreements] = useState({
    permissionToCoach: false,
    commitmentToChange: false,
    financialReady: false,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<ActivationPlan | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing session data on mount
  useEffect(() => {
    const loadSession = async () => {
        if (lead.id) {
            console.log("Loading session for lead:", lead.id);
            const existingSession = await fetchSessionByLeadId(lead.id);
            if (existingSession) {
                console.log("Found existing session, populating state...");
                // Merge notes carefully
                setNotes(prev => ({
                    challenges: existingSession.notes.challenges || prev.challenges,
                    goals: existingSession.notes.goals || '',
                    gap: existingSession.notes.gap || ''
                }));
                
                if (existingSession.agreements) {
                    setAgreements(existingSession.agreements);
                }
                
                if (existingSession.activationPlan) {
                    setPlan(existingSession.activationPlan);
                }
                setIsSaved(true);
            }
        }
        setIsLoading(false);
    };
    loadSession();
  }, [lead.id]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
        const jsonStr = await generateActivationPlan(lead.name, notes);
        const parsedPlan = JSON.parse(jsonStr);
        setPlan(parsedPlan);
        setIsSaved(false);
    } catch (e) {
        alert("Failed to generate plan. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSaveSession = async () => {
    try {
        await saveSession({
            leadId: lead.id,
            coachId: 'admin',
            date: new Date().toISOString(),
            notes,
            agreements,
            activationPlan: plan || undefined,
            status: 'completed'
        });
        setIsSaved(true);
    } catch (e) {
        alert("Failed to save to database.");
    }
  };

  if (isLoading) {
      return <div className="h-full flex items-center justify-center bg-[#050505] text-gray-500">Loading Session...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white animate-fade-in relative">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10">
                <ArrowLeft size={20} />
            </button>
            <div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-500 text-xs font-bold uppercase tracking-widest">Live Session</span>
                </div>
                <h1 className="text-xl font-bold">{lead.name}</h1>
            </div>
        </div>
        <div className="flex gap-4">
            {plan && !isSaved && (
                <button onClick={handleSaveSession} className="bg-white text-black font-bold px-6 py-2 rounded-full flex items-center gap-2 hover:bg-gray-200 transition-colors">
                    <Save size={18} /> Save Session
                </button>
            )}
            {isSaved && (
                <div className="bg-green-500/20 text-green-400 px-6 py-2 rounded-full flex items-center gap-2 border border-green-500/30">
                    <CheckCircle size={18} /> Saved
                </div>
            )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Context Sidebar */}
        <div className="w-1/3 border-r border-white/5 p-8 overflow-y-auto custom-scrollbar bg-gray-900/30">
            <div className="mb-8 p-5 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                <h3 className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                    <FileText size={14} /> Lead Context
                </h3>
                <div className="space-y-4">
                    <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Motivation</span>
                        <p className="text-sm text-gray-300 italic">"{lead.responses?.motivation || 'N/A'}"</p>
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Struggle</span>
                        <p className="text-sm text-gray-300 italic">"{lead.responses?.struggle || 'N/A'}"</p>
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Intent</span>
                        <p className="text-sm text-orange-400 font-bold">{lead.responses?.intent || 'Unknown'}</p>
                    </div>
                </div>
            </div>

            <h3 className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-6">Coach Script</h3>
            <div className="space-y-8">
                <div className="p-4 bg-gray-800/50 rounded-xl border border-white/5">
                    <h4 className="font-bold text-white mb-2">1. The Agreements</h4>
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={agreements.permissionToCoach} onChange={e => setAgreements({...agreements, permissionToCoach: e.target.checked})} className="accent-orange-500 w-4 h-4" />
                            <span className="text-sm text-gray-300">Permission to Coach</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={agreements.commitmentToChange} onChange={e => setAgreements({...agreements, commitmentToChange: e.target.checked})} className="accent-orange-500 w-4 h-4" />
                            <span className="text-sm text-gray-300">Commitment to Change</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={agreements.financialReady} onChange={e => setAgreements({...agreements, financialReady: e.target.checked})} className="accent-orange-500 w-4 h-4" />
                            <span className="text-sm text-gray-300">Financially Ready</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT: Input & Plan */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Notes</label>
                        <textarea value={notes.challenges} onChange={(e) => setNotes({...notes, challenges: e.target.value})} className="input-field h-24" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">90-Day Goals</label>
                        <textarea value={notes.goals} onChange={(e) => setNotes({...notes, goals: e.target.value})} className="input-field h-24" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">The Gap</label>
                        <textarea value={notes.gap} onChange={(e) => setNotes({...notes, gap: e.target.value})} className="input-field h-24" />
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                    <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-3 transition-all">
                        {isGenerating ? 'Analyzing...' : 'Generate 4-Day Plan'} <Sparkles size={20} />
                    </button>
                </div>

                {plan && (
                    <div className="mt-8 bg-gray-800 border border-orange-500/30 rounded-2xl p-8 animate-fade-in shadow-2xl">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black text-white mb-2">Activation Strategy</h2>
                            <p className="text-orange-400 font-medium italic">"{plan.mantra}"</p>
                        </div>
                        <div className="bg-gray-900/50 p-6 rounded-xl border border-white/5 mb-8">
                            <p className="text-lg text-gray-200 leading-relaxed">{plan.coreInsight}</p>
                        </div>
                        <div className="space-y-4">
                            {plan.dailyFocus.map((day, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold">{i + 1}</div>
                                    <span className="text-gray-200">{day}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SessionMode;
