
import React, { useState } from 'react';
import { Scores } from '../types';
import { getInsightsFromGemini } from '../services/geminiService';
import { updateSubmission } from '../services/mockData';

interface GeminiInsightsProps {
  scores: Scores;
  submissionId?: string; // New Prop to link insights to a record
  // Context props for better AI prompting
  type?: 'personal' | 'corporate';
  name?: string;
  companyName?: string;
}

const GeminiInsights: React.FC<GeminiInsightsProps> = ({ scores, submissionId, type, name, companyName }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState('');
  const [error, setError] = useState('');

  const handleGetInsights = async () => {
    setIsLoading(true);
    setError('');
    setInsights('');
    try {
      // Pass the context object to the service
      const result = await getInsightsFromGemini(scores, { 
          type: type || 'personal',
          name: name || 'User',
          companyName: companyName
      });
      
      // Basic markdown-to-html conversion for display
      const formattedResult = result
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br />');
      setInsights(formattedResult);

      // Save to Database if we have an ID
      if (submissionId) {
          await updateSubmission(submissionId, { aiSummary: result });
          console.log("AI Insights saved to submission record.");
      }

    } catch (err) {
      setError('Failed to fetch insights. Please try again.');
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <div className="mt-12 p-6 bg-gray-800 rounded-lg shadow-xl insights-card glass-panel">
      <div className="flex items-center gap-2 mb-4">
          <h3 className="text-2xl font-bold text-orange-500">
             {type === 'corporate' ? 'Organizational Intelligence' : 'Personalized AI Insights'}
          </h3>
          {type === 'corporate' && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 font-bold uppercase">Corporate Mode</span>}
      </div>
      
      <p className="text-gray-400 mb-6">
        {type === 'corporate' 
            ? "Get strategic feedback on your organization's health, culture, and performance risks." 
            : "Get personalized, actionable feedback on your results from a generative AI model."}
      </p>
      
      <button
        onClick={handleGetInsights}
        disabled={isLoading}
        className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 disabled:bg-orange-800 disabled:cursor-not-allowed text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors duration-300"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Strategy...
          </div>
        ) : (type === 'corporate' ? 'Generate Org Report' : 'Generate My Insights')}
      </button>

      {error && <p className="mt-4 text-red-400">{error}</p>}
      
      {insights && (
        <div className="mt-6 p-4 border border-gray-700 rounded-md bg-gray-900 glass-card">
          <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: insights }} />
        </div>
      )}
    </div>
  );
};

export default GeminiInsights;
