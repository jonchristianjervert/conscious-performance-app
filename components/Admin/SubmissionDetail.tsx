import React, { useEffect, useState } from 'react';
import { ArrowLeft, User, Calendar, Smartphone, MapPin, Briefcase, Sparkles } from 'lucide-react';
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
    fetchSubmissionById(submissionId).then(setSubmission);
  }, [submissionId]);

  const handleGenerateNote = async () => {
    if (!submission) return;
    setLoadingNote(true);
    const note = await generateIndividualAdminReport(submission);
    setAdminNote(note.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>'));
    setLoadingNote(false);
  };

  if (!submission) return <div className="text-gray-400">Loading details...</div>;

  // Safe fallback values
  const profile = submission.userProfile || { name: 'Unknown', email: '', dob: '', occupation: '' };
  const metadata = submission.metadata || { device: 'Unknown', location: 'Unknown' };
  const scores = submission.scores || {};

  return (
    <div className="space-y-8 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
        <ArrowLeft size={18} /> Back to List
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile & Meta */}
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold text-orange-500">
                {profile.name ? profile.name.charAt(0) : '?'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{profile.name || 'Unknown User'}</h2>
                <p className="text-sm text-gray-400">{profile.email || 'No Email'}</p>
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
                <span>Submitted: {submission.timestamp ? new Date(submission.timestamp).toLocaleDateString() : 'Unknown Date'}</span>
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
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">Admin Insights</h3>
                {!adminNote && (
                    <button 
                        onClick={handleGenerateNote}
                        disabled={loadingNote}
                        className="text-xs bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded"
                    >
                        {loadingNote ? 'Analyzing...' : 'Generate Audit'}
                    </button>
                )}
            </div>
            {adminNote ? (
                <div className="bg-gray-900/50 p-3 rounded text-sm text-gray-300 border border-gray-700" dangerouslySetInnerHTML={{__html: adminNote}} />
            ) : (
                <p className="text-xs text-gray-500">Generate an AI audit to detect burnout risks or coaching opportunities.</p>
            )}
          </div>
        </div>

        {/* Right Column: Chart & Scores */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 flex flex-col items-center">
             <h3 className="text-lg font-bold text-white mb-6 w-full text-left">Performance Model Visualization</h3>
             {/* Only render chart if scores exist */}
             {Object.keys(scores).length > 0 ? (
                 <PerformanceModelChart scores={scores as any} />
             ) : (
                 <div className="text-gray-500">No score data available.</div>
             )}
           </div>

           {/* Client's AI Report (Safe Rendering) */}
           {submission.aiSummary ? (
               <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-5">
                       <Sparkles size={120} />
                   </div>
                   <div className="flex items-center gap-2 mb-4 relative z-10">
                       <Sparkles size={20} className="text-orange-500" />
                       <h3 className="text-lg font-bold text-white">Client's Generated AI Report</h3>
                   </div>
                   <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-gray-300 text-sm max-h-60 overflow-y-auto custom-scrollbar relative z-10">
                       <div dangerouslySetInnerHTML={{ __html: submission.aiSummary }} />
                   </div>
               </div>
           ) : (
               <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-center text-gray-500 text-sm italic">
                   Client has not generated insights yet.
               </div>
           )}

           <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Raw Score Data</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.keys(scores).length > 0 ? Object.entries(scores).map(([key, val]) => (
                        <div key={key} className="bg-gray-900 p-3 rounded border border-gray-700">
                            <div className="text-xs text-gray-500 uppercase">{key}</div>
                            <div className="text-xl font-bold text-white">
                                {typeof val === 'number' ? val.toFixed(1) : val}
                            </div>
                        </div>
                    )) : <div className="text-gray-500 text-sm">No scores recorded.</div>}
                </div>
           </div>
        </div>
      </div>

      {/* Detailed Answers Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Assessment Responses</h3>
              <p className="text-sm text-gray-400">Detailed record of user selections per category.</p>
          </div>
          <div className="divide-y divide-gray-700">
              {SECTIONS.map(section => (
                  <div key={section.id} className="p-6">
                      <h4 className="text-orange-400 font-bold uppercase text-xs tracking-wider mb-3">{section.title} ({section.category})</h4>
                      <div className="space-y-2">
                          {section.questions.map((q, idx) => {
                              // Deep safety check for answers array
                              const isYes = submission.answers 
                                         && submission.answers[section.id] 
                                         && Array.isArray(submission.answers[section.id])
                                         && submission.answers[section.id][idx];
                              return (
                                  <div key={idx} className="flex items-start gap-3 p-2 hover:bg-gray-700/30 rounded">
                                      <div className={`mt-1 flex-shrink-0 ${isYes ? 'text-green-500' : 'text-gray-600'}`}>
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
