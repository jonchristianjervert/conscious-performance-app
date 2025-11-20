import React, { useState, useMemo, Suspense } from 'react';
import { SECTIONS } from './constants';
import { Answers, Scores } from './types';
import PerformanceModelChart from './components/PerformanceModelChart';
import GeminiInsights from './components/GeminiInsights';
import { submitAssessment, getPreviousSubmission } from './services/mockData';
import { sendSubmissionEmails } from './services/automation';
// @ts-ignore
import html2pdf from 'html2pdf.js';

// Lazy Load Admin Components
const Login = React.lazy(() => import('./components/Admin/Login'));
const DashboardLayout = React.lazy(() => import('./components/Admin/DashboardLayout'));
const Overview = React.lazy(() => import('./components/Admin/Overview'));
const SubmissionList = React.lazy(() => import('./components/Admin/SubmissionList'));
const SubmissionDetail = React.lazy(() => import('./components/Admin/SubmissionDetail'));
const Reports = React.lazy(() => import('./components/Admin/Reports'));
const Settings = React.lazy(() => import('./components/Admin/Settings'));

// Error Boundary for Admin Components
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Admin Dashboard Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Dashboard Error</h2>
          <p className="text-gray-300 mb-4">Something went wrong loading the dashboard components.</p>
          <div className="bg-gray-800 p-4 rounded text-xs font-mono text-red-300 max-w-2xl overflow-auto mb-4">
            {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded font-bold transition-colors"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const initialAnswers = SECTIONS.reduce((acc, section) => {
  acc[section.id] = Array(section.questions.length).fill(false);
  return acc;
}, {} as Answers);

const App: React.FC = () => {
  // --- Routing State ---
  // Views: 'welcome', 'assessment', 'lead-capture', 'results', 'admin-login', 'admin-dashboard'
  const [view, setView] = useState<string>('welcome');
  
  // --- Client Assessment State ---
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousScores, setPreviousScores] = useState<Scores | null>(null);

  // --- Admin State ---
  const [adminTab, setAdminTab] = useState('overview');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // --- Handlers ---
  const handleAnswerChange = (sectionId: string, questionIndex: number, isChecked: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].map((ans, i) => (i === questionIndex ? isChecked : ans)),
    }));
  };
  
  const calculateScores = (): Scores => {
      const scores: Partial<Scores> = {};
      const scoreMap: { [key: string]: keyof Scores } = {
          A: 'Energy', B: 'Awareness', C: 'Love', D: 'Tribe',
          E: 'Career', F: 'Abundance', G: 'Fitness', 'H': 'Health',
      };
      
      let scoreI = 0;
      let scoreJ = 0;

      for(const section of SECTIONS) {
          const yesCount = answers[section.id].filter(Boolean).length;
          if(scoreMap[section.id]){
              scores[scoreMap[section.id]] = yesCount;
          } else if (section.id === 'I') {
              scoreI = yesCount;
          } else if (section.id === 'J') {
              scoreJ = yesCount;
          }
      }
      
      scores.Adventure = (scoreI + scoreJ) / 2;
      return scores as Scores;
  };

  const scores = useMemo(calculateScores, [answers]);

  const handleAssessmentComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        // 1. Check for previous history (Growth Chart)
        const prevSubmission = await getPreviousSubmission(userInfo.email);
        if (prevSubmission) {
            setPreviousScores(prevSubmission.scores);
        }

        // 2. Save current submission
        await submitAssessment(userInfo, scores, answers);
        
        // 3. Trigger Email Automation (Mock or Webhook)
        await sendSubmissionEmails(userInfo, scores);

        setView('results');
    } catch (error) {
        console.error("Submission failed", error);
        alert("Something went wrong submitting your results. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
      const element = document.getElementById('results-container');
      if (!element) return;

      if (html2pdf) {
          const opt = {
            margin: 0.5,
            filename: `${userInfo.name.replace(/\s+/g, '_')}_Performance_Profile.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, backgroundColor: '#111827' }, // match bg-gray-900
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
          };
          html2pdf().set(opt).from(element).save();
      } else {
          alert("PDF generator not loaded. Please refresh and try again.");
      }
  };
  
  // --- Client Renders ---

  const renderWelcome = () => (
    <div className="text-center max-w-3xl mx-auto pt-12 animate-fade-in">
      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-orange-500">Conscious Human Performance Program</h1>
      <p className="mt-6 text-xl text-gray-300">Optimizing human performance through the Conscious Human Performance Model.</p>
      <div className="mt-8 text-left text-gray-400 space-y-4 bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl">
          <p>This assessment helps you understand and awaken your human potential in the areas of Consciousness (Spiritual Fulfillment), Connection (Relationships), Contribution (Career & Business), Commitment (Health & Fitness), and the experiential X Factor multiplier of Adventure (Life Experiences).</p>
          <p>Be honest with yourself. This isn't an exercise to uncover what's wrong, but a way to gain perspective and awareness of new ways to operate and perceive the world.</p>
      </div>
      <button 
        onClick={() => setView('assessment')}
        className="mt-10 bg-orange-500 hover:bg-orange-600 text-gray-900 font-bold text-lg py-4 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-orange-500/20"
      >
        Start Assessment
      </button>
      
      <div className="mt-24 pt-8 border-t border-gray-800">
        <button onClick={() => setView('admin-login')} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Admin Portal Access
        </button>
      </div>
    </div>
  );

  const renderAssessment = () => {
    const currentSection = SECTIONS[currentSectionIndex];
    const progress = ((currentSectionIndex + 1) / SECTIONS.length) * 100;

    const goToNextSection = () => {
      if (currentSectionIndex < SECTIONS.length - 1) {
        setCurrentSectionIndex(currentSectionIndex + 1);
      }
    };

    const goToPrevSection = () => {
      if (currentSectionIndex > 0) {
        setCurrentSectionIndex(currentSectionIndex - 1);
      }
    };

    return (
      <div className="max-w-4xl mx-auto pt-8">
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-base font-bold text-orange-400">Step {currentSectionIndex + 1} of {SECTIONS.length}</span>
            <span className="text-sm font-medium text-gray-300">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div className="bg-orange-500 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div key={currentSection.id} className="p-6 bg-gray-800 rounded-lg shadow-lg animate-fade-in border border-gray-700">
          <h3 className="text-xs uppercase tracking-widest text-gray-400">{currentSection.category}</h3>
          <h4 className="text-2xl font-bold text-orange-400 mt-1">{currentSection.title}</h4>
          <div className="mt-6 space-y-4">
            {currentSection.questions.map((q, i) => (
              <label key={i} className="flex items-start p-3 bg-gray-700 rounded-md cursor-pointer hover:bg-gray-600 transition-colors">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border-gray-500 bg-gray-600 text-orange-500 focus:ring-orange-500"
                  checked={answers[currentSection.id][i]}
                  onChange={(e) => handleAnswerChange(currentSection.id, i, e.target.checked)}
                />
                <span className="ml-4 text-gray-300">{q.text}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mt-8">
          <button
            onClick={goToPrevSection}
            disabled={currentSectionIndex === 0}
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentSectionIndex < SECTIONS.length - 1 ? (
            <button
              onClick={goToNextSection}
              className="bg-orange-500 hover:bg-orange-600 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => setView('lead-capture')}
              className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-4 px-8 rounded-lg transition-transform transform hover:scale-105"
            >
              Complete Assessment
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderLeadCapture = () => (
    <div className="max-w-xl mx-auto pt-12 animate-fade-in">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Almost There!</h2>
            <p className="text-gray-400 mb-8">Enter your details below to unlock your full Performance Profile and AI insights.</p>
            
            <form onSubmit={handleAssessmentComplete} className="space-y-6 text-left">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                    <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                        placeholder="John Doe"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                    <input 
                        type="email" 
                        required
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={userInfo.email}
                        onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                        placeholder="john@example.com"
                    />
                </div>
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-gray-900 font-bold py-4 rounded-lg transition-colors flex justify-center"
                >
                    {isSubmitting ? 'Generating Results...' : 'See My Results'}
                </button>
            </form>
            <p className="mt-4 text-xs text-gray-500">We respect your privacy. Your results are confidential.</p>
        </div>
    </div>
  );
  
  const renderResults = () => (
     <div id="results-container" className="max-w-5xl mx-auto pt-8 animate-fade-in bg-gray-900 p-4 md:p-8">
      <div className="flex justify-between items-center mb-8 hide-on-pdf">
          <h2 className="text-3xl md:text-4xl font-bold text-orange-500">Your Results</h2>
          <div className="flex gap-3">
            <button 
                onClick={handleDownloadPDF}
                className="text-white bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-bold transition-colors shadow-lg"
            >
                Download Full Report
            </button>
            <button 
                onClick={() => setView('welcome')}
                className="text-gray-400 hover:text-white text-sm bg-gray-800 px-4 py-2 rounded border border-gray-700 transition-colors"
            >
                Exit
            </button>
          </div>
      </div>

      {/* Previous Score Badge */}
      {previousScores && (
         <div className="mb-6 bg-gray-800 border border-orange-500/30 p-4 rounded-lg flex items-center justify-between">
             <div>
                 <h4 className="text-white font-bold">Welcome Back, {userInfo.name}</h4>
                 <p className="text-sm text-gray-400">We found your previous assessment. The dashed line indicates your prior results for comparison.</p>
             </div>
             <div className="hidden md:block text-orange-500 font-bold text-sm uppercase tracking-wider border border-orange-500/50 px-3 py-1 rounded">
                 Growth Tracking Active
             </div>
         </div>
      )}

      <div className="p-6 md:p-8 bg-gray-800 rounded-lg shadow-2xl border border-gray-700">
        <h3 className="text-xl text-center text-white mb-2">{previousScores ? 'Performance Growth Profile' : `Conscious Performance Profile: ${userInfo.name}`}</h3>
        <PerformanceModelChart scores={scores} previousScores={previousScores} />
      </div>
      <GeminiInsights scores={scores} />
      <div className="text-center mt-12 pb-12 hide-on-pdf">
        <button
          onClick={() => {
              setAnswers(initialAnswers);
              setCurrentSectionIndex(0);
              setUserInfo({name: '', email: ''});
              setPreviousScores(null);
              setView('assessment');
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Retake Assessment
        </button>
      </div>
     </div>
  );

  // --- Admin Render ---

  if (view === 'admin-login') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-orange-500 bg-gray-900">Loading Admin Portal...</div>}>
          <Login onLogin={() => setView('admin-dashboard')} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (view === 'admin-dashboard') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-orange-500 bg-gray-900">Loading Dashboard...</div>}>
          <DashboardLayout 
            currentTab={adminTab} 
            onTabChange={(tab) => {
              setAdminTab(tab);
              setSelectedSubmissionId(null); // Reset selection on tab change
            }}
            onLogout={() => setView('welcome')}
          >
            {selectedSubmissionId ? (
              <SubmissionDetail 
                  submissionId={selectedSubmissionId} 
                  onBack={() => setSelectedSubmissionId(null)} 
              />
            ) : (
              <>
                {adminTab === 'overview' && <Overview />}
                {adminTab === 'submissions' && <SubmissionList onSelectSubmission={setSelectedSubmissionId} />}
                {adminTab === 'reports' && <Reports />}
                {adminTab === 'settings' && <Settings />}
              </>
            )}
          </DashboardLayout>
        </Suspense>
      </ErrorBoundary>
    );
  }

  // --- Default Client Wrapper ---
  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-900">
      <main>
        {view === 'welcome' && renderWelcome()}
        {view === 'assessment' && renderAssessment()}
        {view === 'lead-capture' && renderLeadCapture()}
        {view === 'results' && renderResults()}
      </main>
      <footer className="text-center text-gray-600 mt-12 py-4 border-t border-gray-800 text-sm">
        Copyright 2025 Zerkers.com
      </footer>
    </div>
  );
};

export default App;