import React, { useEffect, useState } from 'react';
import { ArrowLeft, User, Calendar, Smartphone, MapPin, Briefcase, Sparkles, Target } from 'lucide-react';
import { Submission } from '../../types';
import { fetchSubmissionById } from '../../services/mockData';
import { generateIndividualAdminReport, generateProgramRecommendation } from '../../services/geminiService';
import { fetchSessionsByEmail } from '../../services/clientService'; 
import PerformanceModelChart from '../PerformanceModelChart';
import { SECTIONS } from '../../constants';

interface SubmissionDetailProps {
  submissionId: string;
  onBack: () => void;
}

const SubmissionDetail: React.FC<SubmissionDetailProps> = ({ submissionId, onBack }) => {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [adminNote, setAdminNote] = useState<string>('');
  const [loadingNote, setLoadingNote] = useState(false);
  
  // New State for Program Rec
  const [programRec, setProgramRec] = useState<string>('');
  const [loadingRec, setLoadingRec] = useState(false);

  // New State for Coaching History
  const [coachingSessions, setCoachingSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchSubmissionById(submissionId).then(async (data) => {
        setSubmission(data || null);
        if (data && data.userProfile && data.userProfile.email) {
            // Fetch associated coaching sessions
            const sessions = await fetchSessionsByEmail(data.userProfile.email);
            setCoachingSessions(sessions);
        }
    });
  }, [submissionId]);

  const handleGenerateNote = async () => {
    if (!submission) return;
    setLoadingNote(true);
    const note = await generateIndividualAdminReport(submission);
    setAdminNote(note.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>'));
    setLoadingNote(false);
  };

  const handleGenerateRec = async () => {
    if (!submission) return;
    setLoadingRec(true);
    const rec = await generateProgramRecommendation(submission);
    setProgramRec(rec);
    setLoadingRec(false);
  };

  if (!submission) return <div className="text-gray-400 p-8">Loading details...</div>;

  const profile = submission.userProfile || { name: 'Unknown', email: 'No Email', dob: '', occupation: '' };
  const metadata = submission.metadata || { device: 'Unknown', location: 'Unknown' };
  const scores = submission.scores || {};
  const answers = submission.answers || {};

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
        <ArrowLeft size={18} /> Back to List
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile & Meta */}
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold text-orange-500 border border-gray-600">
                {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="overflow-hidden">
                <h2 className="text-xl font-bold text-white truncate">{profile.name}</h2>
                <p className="text-sm text-gray-400 truncate">{profile.email}</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-300">
              {profile.occupation && (
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className="text-gray-500" />
                    <span>{profile.occupation}</span>
                  </div>
              )}
              {profile.dob && (
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-500" />
                    <span>DOB: {profile.dob}</span>
                  </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-gray-500" />
                <span>Submitted: {submission.timestamp ? new Date(submission.timestamp).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Admin AI Note (Audit) */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">Admin Audit</h3>
                {!adminNote && (
                    <button 
                        onClick={handleGenerateNote}
                        disabled={loadingNote}
                        className="text-xs bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-orange-900/20"
                    >
                        {loadingNote ? 'Analyzing...' : 'Generate Audit'}
                    </button>
                )}
            </div>
            {adminNote ? (
                <div className="bg-gray-900/50 p-4 rounded-lg text-sm text-gray-300 border border-gray-700 leading-relaxed" dangerouslySetInnerHTML={{__html: adminNote}} />
            ) : (
                <p className="text-xs text-gray-500 italic">Click to generate an AI audit identifying burnout risks.</p>
            )}
          </div>

          {/* PROGRAM RECOMMENDATION (NEW) */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Target size={18} className="text-emerald-500" />
                    Program Match
                </h3>
                {!programRec && (
                    <button 
                        onClick={handleGenerateRec}
                        disabled={loadingRec}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
                    >
                        {loadingRec ? 'Matching...' : 'Find Program'}
                    </button>
                )}
            </div>
            {programRec ? (
                <div className="bg-gray-900/50 p-4 rounded-lg text-sm text-gray-300 border border-gray-700 leading-relaxed" dangerouslySetInnerHTML={{__html: programRec}} />
            ) : (
                <p className="text-xs text-gray-500 italic">AI-driven recommendation based on Zerkers offerings.</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
           {/* Chart */}
           <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 flex flex-col items-center shadow-lg relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-purple-500"></div>
             <h3 className="text-lg font-bold text-white mb-6 w-full text-left flex items-center gap-2">
                <Sparkles size={16} className="text-orange-500" />
                Performance Model
             </h3>
             <div className="w-full flex justify-center">
                {Object.keys(scores).length > 0 ? (
                    <PerformanceModelChart scores={scores as any} />
                ) : (
                    <div className="text-gray-500 py-10">Chart data unavailable</div>
                )}
             </div>
           </div>

           {/* COACHING HISTORY (From Previous Request) */}
           {coachingSessions.length > 0 && (
               <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-6">
                   <h3 className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-4">Coaching Session History</h3>
                   <div className="space-y-4">
                       {coachingSessions.map((session: any) => (
                           <div key={session.id} className="bg-gray-900/50 p-4 rounded-lg border border-white/5">
                               <div className="flex justify-between items-start mb-2">
                                   <div className="text-white font-bold text-sm">Session Date: {new Date(session.date).toLocaleDateString()}</div>
                                   <div className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase font-bold">{session.status}</div>
                               </div>
                               <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                                   <div>
                                       <span className="block text-gray-500 font-bold">Focus:</span>
                                       {session.notes?.goals || 'No goals recorded'}
                                   </div>
                                   {session.activationPlan && (
                                       <div>
                                           <span className="block text-gray-500 font-bold">Plan Mantra:</span>
                                           <span className="italic text-orange-400">"{session.activationPlan.mantra}"</span>
                                       </div>
                                   )}
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           )}

           {/* Client's AI Report */}
           {submission.aiSummary ? (
               <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 relative overflow-hidden shadow-lg">
                   <div className="flex items-center gap-2 mb-4 relative z-10">
                       <Sparkles size={20} className="text-blue-400" />
                       <h3 className="text-lg font-bold text-white">Client's Generated AI Report</h3>
                   </div>
                   <div className="bg-black/30 p-5 rounded-lg border border-white/5 text-gray-300 text-sm max-h-80 overflow-y-auto custom-scrollbar relative z-10 prose prose-invert max-w-none">
                       <div dangerouslySetInnerHTML={{ __html: submission.aiSummary }} />
                   </div>
               </div>
           ) : null}

           {/* Scores & Answers (Existing Code) */}
           <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4">Raw Score Data</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.keys(scores).length > 0 ? Object.entries(scores).map(([key, val]) => (
                        <div key={key} className="bg-gray-900 p-3 rounded-lg border border-gray-700 flex flex-col items-center justify-center text-center">
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{key}</div>
                            <div className={`text-xl font-black ${typeof val === 'number' && val >= 6 ? 'text-green-400' : typeof val === 'number' && val >= 4 ? 'text-orange-400' : 'text-red-400'}`}>
                                {typeof val === 'number' ? val.toFixed(1) : val}
                            </div>
                        </div>
                    )) : <div className="col-span-4 text-center text-gray-500 text-sm">No scores recorded.</div>}
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
