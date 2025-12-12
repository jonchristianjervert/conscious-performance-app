
import React, { useEffect, useState } from 'react';
import { ArrowLeft, User, Calendar, Briefcase, Sparkles, Target, ShieldAlert, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Submission, UserProfile } from '../../types';
import { fetchSubmissionById, fetchSubmissionsByEmail } from '../../services/mockData';
import { generateIndividualAdminReport, generateProgramRecommendation } from '../../services/geminiService';
import { fetchSessionsByEmail } from '../../services/clientService'; 
import PerformanceModelChart from '../PerformanceModelChart';

interface SubmissionDetailProps {
  submissionId: string;
  onBack: () => void;
}

const SubmissionDetail: React.FC<SubmissionDetailProps> = ({ submissionId, onBack }) => {
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [history, setHistory] = useState<Submission[]>([]);
  const [coachingSessions, setCoachingSessions] = useState<any[]>([]);
  
  // State Maps to handle multiple cards independently
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [programRecs, setProgramRecs] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // 1. Fetch the specific ID clicked
    fetchSubmissionById(submissionId).then(async (data) => {
        if (!data) return;
        setCurrentSubmission(data);
        // Default the clicked card to expanded
        setExpandedCards({ [data.id]: true });

        // 2. Fetch History based on email to see BOTH Personal and Corporate
        if (data.userProfile && data.userProfile.email) {
            const userHistory = await fetchSubmissionsByEmail(data.userProfile.email);
            setHistory(userHistory);
            
            // 3. Fetch Sessions
            const sessions = await fetchSessionsByEmail(data.userProfile.email);
            setCoachingSessions(sessions);
        }
    });
  }, [submissionId]);

  const toggleLoading = (key: string, isLoading: boolean) => {
      setLoadingMap(prev => ({ ...prev, [key]: isLoading }));
  };

  const handleGenerateNote = async (sub: Submission) => {
    toggleLoading(`note_${sub.id}`, true);
    const note = await generateIndividualAdminReport(sub);
    const formatted = note.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>');
    setAdminNotes(prev => ({ ...prev, [sub.id]: formatted }));
    toggleLoading(`note_${sub.id}`, false);
  };

  const handleGenerateRec = async (sub: Submission) => {
    toggleLoading(`rec_${sub.id}`, true);
    const rec = await generateProgramRecommendation(sub);
    setProgramRecs(prev => ({ ...prev, [sub.id]: rec }));
    toggleLoading(`rec_${sub.id}`, false);
  };

  if (!currentSubmission) return <div className="text-gray-400 p-8">Loading details...</div>;

  const profile = currentSubmission.userProfile || { name: 'Unknown', email: 'No Email' } as UserProfile;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} /> Back to List
          </button>
      </div>

      {/* User Header Profile */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-white border border-gray-600">
                {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1"><User size={14}/> {profile.email}</span>
                    {profile.companyName && <span className="flex items-center gap-1"><Briefcase size={14}/> {profile.companyName}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
                <div className="text-right px-4 py-2 bg-black/20 rounded-lg border border-white/5">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Assessments</div>
                    <div className="text-2xl font-black text-white">{history.length}</div>
                </div>
                <div className="text-right px-4 py-2 bg-black/20 rounded-lg border border-white/5">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Coaching Sessions</div>
                    <div className="text-2xl font-black text-white">{coachingSessions.length}</div>
                </div>
            </div>
      </div>

      {/* MULTI-VIEW: Iterate through all submissions for this user (Personal & Corporate) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {history.map((sub) => (
              <div key={sub.id} className={`rounded-xl border shadow-xl overflow-hidden transition-all duration-300 ${sub.type === 'corporate' ? 'bg-blue-900/5 border-blue-500/30' : 'bg-gray-800 border-gray-700'}`}>
                   
                   {/* Card Header */}
                   <div className="p-6 border-b border-white/5 flex justify-between items-start">
                       <div>
                           <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest ${sub.type === 'corporate' ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'}`}>
                                    {sub.type === 'corporate' ? 'Organizational' : 'Personal'}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">{sub.id.slice(-6)}</span>
                           </div>
                           <div className="flex items-center gap-2 text-white font-medium">
                               <Calendar size={16} className="text-gray-500" /> {new Date(sub.timestamp).toLocaleDateString()}
                           </div>
                       </div>
                       {sub.scores.Adventure && (
                           <div className="text-center">
                               <div className="text-[10px] text-gray-500 uppercase font-bold">Adv. Score</div>
                               <div className="text-2xl font-black text-white">{sub.scores.Adventure.toFixed(1)}</div>
                           </div>
                       )}
                   </div>

                   <div className="p-6 space-y-8">
                        {/* 1. Visualization */}
                        <div className="bg-black/20 p-4 rounded-xl flex justify-center border border-white/5 relative">
                            <div className="transform scale-90 sm:scale-100">
                                <PerformanceModelChart scores={sub.scores} type={sub.type} />
                            </div>
                        </div>
                        
                        {/* 2. Scores Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {Object.entries(sub.scores).map(([key, val]) => (
                                <div key={key} className="bg-white/5 p-2 rounded text-center border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="text-[9px] text-gray-500 uppercase truncate px-1">{key}</div>
                                    <div className={`font-bold ${Number(val) >= 6 ? 'text-green-400' : Number(val) >= 4 ? 'text-orange-400' : 'text-red-400'}`}>
                                        {Number(val).toFixed(1)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 3. Admin Tools (Restored & Localized) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Risk Audit Tool */}
                            <div className="bg-black/30 rounded-lg border border-white/10 p-4 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                        <ShieldAlert size={14} className="text-red-400" /> Risk Audit
                                    </h4>
                                    <button 
                                        onClick={() => handleGenerateNote(sub)}
                                        disabled={loadingMap[`note_${sub.id}`]}
                                        className="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white transition-colors"
                                    >
                                        {loadingMap[`note_${sub.id}`] ? 'Analyzing...' : 'Generate'}
                                    </button>
                                </div>
                                <div className="flex-1 text-xs text-gray-400 bg-gray-900/50 p-2 rounded border border-white/5 overflow-y-auto max-h-40 custom-scrollbar">
                                    {adminNotes[sub.id] ? (
                                        <div dangerouslySetInnerHTML={{ __html: adminNotes[sub.id] }} />
                                    ) : (
                                        <span className="italic opacity-50">Generate audit to identify burnout risks.</span>
                                    )}
                                </div>
                            </div>

                            {/* Program Match Tool */}
                            <div className="bg-black/30 rounded-lg border border-white/10 p-4 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                        <Target size={14} className="text-emerald-400" /> Program Match
                                    </h4>
                                    <button 
                                        onClick={() => handleGenerateRec(sub)}
                                        disabled={loadingMap[`rec_${sub.id}`]}
                                        className="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white transition-colors"
                                    >
                                        {loadingMap[`rec_${sub.id}`] ? 'Matching...' : 'Find Match'}
                                    </button>
                                </div>
                                <div className="flex-1 text-xs text-gray-400 bg-gray-900/50 p-2 rounded border border-white/5 overflow-y-auto max-h-40 custom-scrollbar">
                                    {programRecs[sub.id] ? (
                                        <div dangerouslySetInnerHTML={{ __html: programRecs[sub.id] }} />
                                    ) : (
                                        <span className="italic opacity-50">Find the best Zerkers program fit.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* 4. Client AI Report */}
                        <div className="bg-gray-900/80 p-5 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={16} className={sub.type === 'corporate' ? "text-blue-400" : "text-orange-400"} />
                                <h4 className="text-sm font-bold text-white">Client's AI Report</h4>
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                {sub.aiSummary ? (
                                    <div className="prose prose-invert prose-sm text-xs text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: sub.aiSummary }} />
                                ) : (
                                    <p className="text-xs text-gray-500 italic">No summary generated by client yet.</p>
                                )}
                            </div>
                        </div>
                   </div>
              </div>
          ))}
      </div>

      {/* Global Coaching History */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <FileText size={20} className="text-orange-500" /> 
                Coaching Session History
            </h3>
            {coachingSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coachingSessions.map((session: any) => (
                       <div key={session.id} className="bg-gray-900/50 p-4 rounded-lg border border-white/5 flex flex-col gap-2 hover:border-white/20 transition-colors">
                           <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                               <span>{new Date(session.date).toLocaleDateString()}</span>
                               <span className={`px-2 py-0.5 rounded ${session.status === 'completed' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{session.status}</span>
                           </div>
                           <div className="text-white font-bold">{session.notes?.goals || 'Strategy Session'}</div>
                           {session.notes?.gap && (
                               <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                   <span className="text-gray-500">Gap:</span> {session.notes.gap}
                               </div>
                           )}
                           {session.activationPlan?.mantra && (
                               <div className="mt-2 pt-2 border-t border-white/5 text-xs italic text-orange-400">
                                   "{session.activationPlan.mantra}"
                               </div>
                           )}
                       </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 bg-black/20 rounded-lg border border-dashed border-gray-700">
                    <p className="text-sm text-gray-500">No coaching sessions recorded for this user.</p>
                </div>
            )}
      </div>
    </div>
  );
};

export default SubmissionDetail;
