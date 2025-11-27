
import React, { useState, useEffect } from 'react';
import { Lead, ActivationPlan } from '../../types';
import { ArrowLeft, Save, Sparkles, CheckCircle, Clock, FileText } from 'lucide-react';
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
            const existingSession = await fetchSessionByLeadId(lead.id);
            if (existingSession) {
                setNotes(existingSession.notes);
                setAgreements(existingSession.agreements);
                if (existingSession.activationPlan) {
                    setPlan(existingSession.activationPlan);
                }
                setIsSaved(true); // It was saved previously
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
        setIsSaved(false); // New plan generated, needs saving
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
      return <div className="h-full flex items-center justify-center bg-[#050505] text-gray-500">Loading Session Data...</div>;
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
        {/* LEFT: Context & Script */}
        <div className="w-1/3 border-r border-white/5 p-8 overflow-y-auto custom-scrollbar bg-gray-900/30">
            
            {/* NEW: Lead Context Section */}
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
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Current Struggle</span>
                        <p className="text-sm text-gray-300 italic">"{lead.responses?.struggle || 'N/A'}"</p>
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Intent</span>
                        <p className="text-sm text-orange-400 font-bold">{lead.responses?.intent || 'Unknown'}</p>
                    </div>
                </div>
            </div>

            <h3 className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-6">Coach Script & Guide</h3>
            
            <div className="space-y-8">
                <div className="p-4 bg-gray-800/50 rounded-xl border border-white/5">
                    <h4 className="font-bold text-white mb-2">1. The Agreements</h4>
                    <p className="text-sm text-gray-400 mb-4">"Before we dive in, I need to know you are open to coaching, ready to change, and prepared to invest in yourself."</p>
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={agreements.permissionToCoach} onChange={e => setAgreements({...agreements, permissionToCoach: e.target.checked})} className="accent-orange-500 w-4 h-4" />
                            <span className="text-sm text-gray-300">Permission to Coach</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={agreements.commitmentToChange} onChange={e => setAgreements({...agreements, commitmentToChange: e.target.checked})} className="accent-orange-500 w-4 h-4" />
                            <span className="text-sm text-gray-300">Commitment to Change</span>
                        </label>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-gray-200 mb-2">2. Current Reality (The Trap)</h4>
                    <p className="text-sm text-gray-500 italic">"You mentioned {lead.responses?.struggle}. Tell me more about how that impacts your daily energy?"</p>
                </div>

                <div>
                    <h4 className="font-bold text-gray-200 mb-2">3. Desired Future (The Vision)</h4>
                    <p className="text-sm text-gray-500 italic">"If we waved a wand and fixed this, what would you be doing differently in 90 days?"</p>
                </div>
            </div>
        </div>

        {/* RIGHT: Input & Plan */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Current Challenges (Notes)</label>
                        <textarea 
                            value={notes.challenges}
                            onChange={(e) => setNotes({...notes, challenges: e.target.value})}
                            className="input-field h-24"
                            placeholder="Capture key pain points..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">90-Day Goals</label>
                        <textarea 
                            value={notes.goals}
                            onChange={(e) => setNotes({...notes, goals: e.target.value})}
                            className="input-field h-24"
                            placeholder="What do they want to achieve?"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">The Gap (Why haven't they done it?)</label>
                        <textarea 
                            value={notes.gap}
                            onChange={(e) => setNotes({...notes, gap: e.target.value})}
                            className="input-field h-24"
                            placeholder="Fear, lack of strategy, habits..."
                        />
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !agreements.permissionToCoach}
                        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                    >
                        {isGenerating ? 'Analyzing Strategy...' : 'Generate 4-Day Activation Plan'}
                        {!isGenerating && <Sparkles size={20} />}
                    </button>
                </div>

                {plan && (
                    <div className="mt-8 bg-gray-800 border border-orange-500/30 rounded-2xl p-8 animate-fade-in shadow-2xl">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black text-white mb-2">Activation Strategy</h2>
                            <p className="text-orange-400 font-medium italic">"{plan.mantra}"</p>
                        </div>

                        <div className="bg-gray-900/50 p-6 rounded-xl border border-white/5 mb-8">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Core Insight</h3>
                            <p className="text-lg text-gray-200 leading-relaxed">{plan.coreInsight}</p>
                        </div>

                        <div className="space-y-4">
                            {plan.dailyFocus.map((day, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold border border-orange-500/30 flex-shrink-0">
                                        {i + 1}
                                    </div>
                                    <span className="text-gray-200 font-medium">{day}</span>
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
