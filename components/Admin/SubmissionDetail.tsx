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
                {submission.userProfile.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{submission.userProfile.name}</h2>
                <p className="text-sm text-gray-400">{submission.userProfile.email}</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-300">
              {submission.userProfile.occupation && (
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className="text-gray-500" />
                    <span>{submission.userProfile.occupation}</span>
                  </div>
              )}
              {submission.userProfile.dob && (
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-500" />
                    <span>DOB: {submission.userProfile.dob}</span>
                  </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-gray-500" />
                <span>Submitted: {new Date(submission.timestamp).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <Smartphone size={16} className="text-gray-500" />
                <span>{submission.metadata.device}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-gray-500" />
                <span>{submission.metadata.location}</span>
              </div>
            </div>
          </div>

          {/* Admin AI Note */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
