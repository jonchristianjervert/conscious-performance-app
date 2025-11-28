import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Submission } from '../../types';
import { fetchSubmissionById } from '../../services/mockData';

interface SubmissionDetailProps {
  submissionId: string;
  onBack: () => void;
}

const SubmissionDetail: React.FC<SubmissionDetailProps> = ({ submissionId, onBack }) => {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSubmissionById(submissionId)
      .then(data => {
        setSubmission(data || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [submissionId]);

  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (!submission) return <div className="text-white p-8">Submission not found.</div>;

  // SAFE ACCESSORS
  const name = submission.userProfile?.name || 'Unknown';
  const email = submission.userProfile?.email || 'No Email';
  const scoreKeys = submission.scores ? Object.keys(submission.scores) : [];
  const aiSummary = submission.aiSummary || '';

  return (
    <div className="space-y-8 animate-fade-in text-white">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
        <ArrowLeft size={18} /> Back to List
      </button>

      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h1 className="text-2xl font-bold mb-2">{name}</h1>
        <p className="text-gray-400">{email}</p>
        <p className="text-xs text-gray-500 mt-2">ID: {submission.id}</p>
      </div>

      {/* Basic Scores Grid */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h2 className="text-lg font-bold mb-4">Scores</h2>
        <div className="grid grid-cols-2 gap-4">
            {scoreKeys.length > 0 ? scoreKeys.map(key => (
                <div key={key} className="bg-gray-900 p-3 rounded">
                    <span className="text-gray-400 text-xs block">{key}</span>
                    <span className="text-xl font-bold">
                        {/* @ts-ignore */}
                        {submission.scores[key]}
                    </span>
                </div>
            )) : <p>No scores available.</p>}
        </div>
      </div>

      {/* AI Summary (Raw Safe Render) */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h2 className="text-lg font-bold mb-4">Client AI Report</h2>
        {aiSummary ? (
            <div className="bg-black/30 p-4 rounded text-sm text-gray-300">
                {/* We use a simple div instead of dangerouslySetInnerHTML first to test safety */}
                {/* If this works, we can switch back to HTML rendering */}
                <div dangerouslySetInnerHTML={{ __html: aiSummary }} />
            </div>
        ) : (
            <p className="text-gray-500 italic">No AI report generated for this user.</p>
        )}
      </div>
    </div>
  );
};

export default SubmissionDetail;
