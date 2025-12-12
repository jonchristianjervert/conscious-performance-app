
import React, { useEffect, useState } from 'react';
import { ArrowLeft, User, Calendar, Briefcase, Sparkles, Target, Layers } from 'lucide-react';
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
  
  const [adminNote, setAdminNote] = useState<string>('');
  const [loadingNote, setLoadingNote] = useState(false);
  
  const [programRec, setProgramRec] = useState<string>('');
  const [loadingRec, setLoadingRec] = useState(false);

  useEffect(() => {
    // 1. Fetch the specific ID clicked
    fetchSubmissionById(submissionId).then(async (data) => {
        if (!data) return;
        setCurrentSubmission(data);

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

  const handleGenerateNote = async (sub: Submission) => {
    setLoadingNote(true);
    const note = await generateIndividualAdminReport(sub);
    setAdminNote(note.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>'));
    setLoadingNote(false);
  };

  const handleGenerateRec = async (sub: Submission) => {
    setLoadingRec(true);
    const rec = await generateProgramRecommendation(sub);
    setProgramRec(rec);
    setLoadingRec(false);
  };

  if (!currentSubmission) return <div className="text-gray-400 p-8">Loading details...</div>;

  // Use type assertion to ensure TypeScript knows this object satisfies UserProfile structure (including optional fields)
  const profile = currentSubmission.userProfile || { name: 'Unknown', email: 'No Email' } as UserProfile;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} /> Back to List
          </button>
      </div>

      {/* User Header Profile */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-white border border-gray-600">
                {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1"><User size={14}/> {profile.email}</span>
                    {profile.companyName && <span className="flex items-center gap-1"><Briefcase size={14}/> {profile.companyName}</span>}
                </div>
              </div>
            </div>
            <div className="text-right">
                <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Assessments</div>
                <div className="text-3xl font-black text-white">{history.length}</div>
            </div>
      </div>

      {/* MULTI-VIEW: Iterate through all submissions for this user (Personal & Corporate) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {history.map((sub) => (
              <div key={sub.id} className={`p-6 rounded-xl border relative shadow-xl ${sub.type === 'corporate' ? 'bg-blue-900/10 border-blue-500/30' : 'bg-gray-800 border-gray-700'}`}>
                   {/* Badge */}
                   <div className="absolute top-4 right-4">
                       <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest ${sub.type === 'corporate' ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'}`}>
                           {sub.type === 'corporate' ? 'Organizational' : 'Personal'}
                       </span>
                   </div>

                   <div className="mb-6">
                       <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Assessment Date</div>
                       <div className="flex items-center gap-2 text-white font-medium">
                           <Calendar size={16} /> {new Date(sub.timestamp).toLocaleDateString()}
                       </div>
                   </div>

                   {/* Chart */}
                   <div className="bg-black/20 p-4 rounded-xl mb-6 flex justify-center">
                       <div className="transform scale-90">
                           <PerformanceModelChart scores={sub.scores} type={sub.type} />
                       </div>
                   </div>
                   
                   {/* Scores Grid */}
                   <div className="grid grid-cols-3 gap-2 mb-6">
                       {Object.entries(sub.scores).slice(0, 9).map(([key, val]) => (
                           <div key={key} className="bg-white/5 p-2 rounded text-center border border-white/5">
                               <div className="text-[9px] text-gray-500 uppercase">{key}</div>
                               <div className={`font-bold ${Number(val) >= 6 ? 'text-green-400' : 'text-gray-200'}`}>{Number(val).toFixed(1)}</div>
                           </div>
                       ))}
                   </div>

                   {/* Actions for this specific card */}
                   <div className="flex gap-2 mb-6">
                       <button 
                           onClick={() => handleGenerateNote(sub)}
                           className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
                       >
                           Analyze {sub.type === 'corporate' ? 'Org' : 'Personal'} Risks
                       </button>
                   </div>
                   
                   {/* AI Report for this specific submission */}
                   <div className="bg-black/30 p-4 rounded-lg border border-white/5 max-h-64 overflow-y-auto custom-scrollbar">
                       <div className="flex items-center gap-2 mb-2">
                           <Sparkles size={14} className={sub.type === 'corporate' ? "text-blue-400" : "text-orange-400"} />
                           <h4 className="text-sm font-bold text-gray-300">AI Assessment Summary</h4>
                       </div>
                       {sub.aiSummary ? (
                           <div className="prose prose-invert prose-sm text-xs text-gray-400" dangerouslySetInnerHTML={{ __html: sub.aiSummary }} />
                       ) : (
                           <p className="text-xs text-gray-500 italic">No summary generated yet.</p>
                       )}
                   </div>
              </div>
          ))}
      </div>

      {/* Common Admin Tools (Applied to Context) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Admin Audit Tool */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Admin Audit Log</h3>
                </div>
                {adminNote ? (
                    <div className="bg-gray-900/50 p-4 rounded-lg text-sm text-gray-300 border border-gray-700 leading-relaxed" dangerouslySetInnerHTML={{__html: adminNote}} />
                ) : (
                    <p className="text-xs text-gray-500 italic">Select an assessment above to generate a risk audit.</p>
                )}
            </div>

            {/* Coaching History */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h3 className="font-bold text-white mb-4">Coaching Sessions</h3>
                {coachingSessions.length > 0 ? (
                    <div className="space-y-3">
                        {coachingSessions.map((session: any) => (
                           <div key={session.id} className="bg-gray-900/50 p-3 rounded-lg border border-white/5 text-sm">
                               <div className="flex justify-between text-gray-400 text-xs mb-1">
                                   <span>{new Date(session.date).toLocaleDateString()}</span>
                                   <span className="uppercase text-green-500 font-bold">{session.status}</span>
                               </div>
                               <div className="text-white font-medium truncate">{session.notes?.goals || 'Strategy Session'}</div>
                           </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 italic">No coaching sessions recorded.</p>
                )}
            </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
