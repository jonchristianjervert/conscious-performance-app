import React, { useEffect, useState } from 'react';
import { ArrowLeft, User, Calendar, Smartphone, MapPin, Briefcase, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { Submission } from '../../types';
import { fetchSubmissionById } from '../../services/mockData';
import { generateIndividualAdminReport } from '../../services/geminiService';
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

  useEffect(() => {
    fetchSubmissionById(submissionId).then(data => setSubmission(data || null));
  }, [submissionId]);

  const handleGenerateNote = async () => {
    if (!submission) return;
    setLoadingNote(true);
    const note = await generateIndividualAdminReport(submission);
    setAdminNote(note.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>'));
    setLoadingNote(false);
  };

  if (!submission) return <div className="text-gray-400 p-8">Loading details...</div>;

  // Safe Fallback Objects
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
              <div className="flex items-center gap-3">
                <Smartphone size={16} className="text-gray-500" />
                <span>{metadata.device}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-gray-500" />
                <span>{metadata.location}</span>
              </div>
            </div>
          </div>

          {/* Admin AI Note */}
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
                <p className="text-xs text-gray-500 italic">Click to generate an AI audit identifying burnout risks and coaching opportunities.</p>
            )}
          </div>
        </div>

        {/* Right Column: Chart & Scores */}
        <div className="lg:col-span-2 space-y-6">
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

           {/* Client's AI Report (THE NEW FEATURE) */}
           {submission.aiSummary ? (
               <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 relative overflow-hidden shadow-lg">
                   <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                       <Sparkles size={120} />
                   </div>
                   <div className="flex items-center gap-2 mb-4 relative z-10">
                       <Sparkles size={20} className="text-blue-400" />
                       <h3 className="text-lg font-bold text-white">Client's Generated AI Report</h3>
                   </div>
                   <div className="bg-black/30 p-5 rounded-lg border border-white/5 text-gray-300 text-sm max-h-80 overflow-y-auto custom-scrollbar relative z-10 prose prose-invert max-w-none">
                       <div dangerouslySetInnerHTML={{ __html: submission.aiSummary }} />
                   </div>
               </div>
           ) : (
               <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-center text-gray-500 text-sm italic border-dashed">
                   Client has not generated their AI insights yet.
               </div>
           )}

           <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4">Raw Score Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.keys(scores).length > 0 ? Object.entries(scores).map(([key, val]) => (
                        <div key={key} className="bg-gray-900 p-3 rounded-lg border border-gray-700 flex flex-col items-center justify-center text-center hover:border-gray-500 transition-colors">
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

      {/* Detailed Answers Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
          <div className="p-6 border-b border-gray-700 bg-gray-800/50">
              <h3 className="text-xl font-bold text-white">Assessment Responses</h3>
              <p className="text-sm text-gray-400">Detailed record of user selections.</p>
          </div>
          <div className="divide-y divide-gray-700">
              {SECTIONS.map(section => (
                  <div key={section.id} className="p-6">
                      <h4 className="text-orange-400 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          {section.title} <span className="text-gray-600">|</span> {section.category}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {section.questions.map((q, idx) => {
                              // Deep safety check for answers array
                              const isYes = answers[section.id] && Array.isArray(answers[section.id]) && answers[section.id][idx];
                              return (
                                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${isYes ? 'bg-green-900/10 border-green-500/20' : 'bg-gray-900/30 border-gray-700/30'}`}>
                                      <div className={`mt-0.5 flex-shrink-0 ${isYes ? 'text-green-400' : 'text-gray-600'}`}>
                                          {isYes ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                      </div>
                                      <span className={`text-sm ${isYes ? 'text-gray-200' : 'text-gray-500'}`}>{q.text}</span>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
