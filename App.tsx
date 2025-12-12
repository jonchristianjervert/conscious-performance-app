
import React, { useState, useMemo, Suspense, useRef, useEffect } from 'react';
import { SECTIONS, CORPORATE_SECTIONS } from './constants';
import { Answers, Scores, Section, Lead } from './types';
import PerformanceModelChart from './components/PerformanceModelChart';
import GeminiInsights from './components/GeminiInsights';
import { submitAssessment, getPreviousSubmission } from './services/mockData';
import { sendSubmissionEmails } from './services/automation';
import { getQuestions } from './services/questionService';
import { fetchLeads } from './services/clientService';
import MicroQualify from './components/MicroQualify'; 
import { ShieldCheck, Sparkles, ChevronRight, ArrowRight, ArrowLeft, Star, Activity, PlayCircle, Zap, Heart, Briefcase, Dumbbell, Mountain, CheckCircle, XCircle, ChevronDown, ChevronUp, Download, User, Calendar, Building2, Users } from 'lucide-react';

// Lazy Load Admin Components
const Login = React.lazy(() => import('./components/Admin/Login'));
const DashboardLayout = React.lazy(() => import('./components/Admin/DashboardLayout'));
const Overview = React.lazy(() => import('./components/Admin/Overview'));
const Pipeline = React.lazy(() => import('./components/Admin/Pipeline')); 
const SubmissionList = React.lazy(() => import('./components/Admin/SubmissionList'));
const SubmissionDetail = React.lazy(() => import('./components/Admin/SubmissionDetail'));
const Reports = React.lazy(() => import('./components/Admin/Reports'));
const Settings = React.lazy(() => import('./components/Admin/Settings'));
const SessionMode = React.lazy(() => import('./components/Admin/SessionMode')); 

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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white p-4">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Dashboard Error</h2>
          <button 
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded font-bold"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  // Check URL for view parameter (Deep Linking)
  const [view, setView] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'assessment') return 'assessment';
    if (viewParam === 'micro-qualify') return 'micro-qualify';
    if (viewParam === 'welcome') return 'welcome';
    return 'micro-qualify'; // Default
  });

  const [assessmentType, setAssessmentType] = useState<'personal' | 'corporate'>('personal');

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  
  // State for Dynamic Questions
  const [sections, setSections] = useState<Section[]>(SECTIONS);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Initialize answers with SECTIONS constant first
  const [answers, setAnswers] = useState<Answers>(() => {
    return SECTIONS.reduce((acc, section) => {
      acc[section.id] = Array(section.questions.length).fill(false);
      return acc;
    }, {} as Answers);
  });

  const [userInfo, setUserInfo] = useState({ name: '', email: '', dob: '', occupation: '', companyName: '', companySize: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousScores, setPreviousScores] = useState<Scores | null>(null);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null); // New State
  
  // Admin State
  const [adminTab, setAdminTab] = useState('overview');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [activeSessionLeadId, setActiveSessionLeadId] = useState<string | null>(null); 
  const [leadsCache, setLeadsCache] = useState<Lead[]>([]); 

  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const loadedSections = await getQuestions();
        // Only override if we are in personal mode and loaded sections exist
        // For corporate, we stick to constants for now.
        if (assessmentType === 'personal') {
             setSections(loadedSections);
        }
      } catch (err) {
        console.error("Failed to load questions", err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    loadQuestions();
  }, [assessmentType]);

  useEffect(() => {
    if (view === 'admin-dashboard') {
        fetchLeads().then(setLeadsCache);
    }
  }, [view]);

  // Helper to start assessment and set correct questions
  const startAssessment = (type: 'personal' | 'corporate') => {
    setAssessmentType(type);
    const selectedSections = type === 'corporate' ? CORPORATE_SECTIONS : SECTIONS;
    setSections(selectedSections);
    
    // Reset answers for new sections
    const newAnswers = selectedSections.reduce((acc, section) => {
      acc[section.id] = Array(section.questions.length).fill(false);
      return acc;
    }, {} as Answers);
    setAnswers(newAnswers);
    
    setView('assessment');
    setCurrentSectionIndex(0);
  };

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
          E: 'Career', F: 'Abundance', 'G': 'Fitness', 'H': 'Health',
      };
      let scoreI = 0;
      let scoreJ = 0;
      for(const section of sections) {
          if (!answers[section.id]) continue;
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

  const scores = useMemo(calculateScores, [answers, sections]);

  const handleAssessmentComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const prevSubmission = await getPreviousSubmission(userInfo.email);
        if (prevSubmission) {
            setPreviousScores(prevSubmission.scores);
        }
        // Capture the new ID
        const newId = await submitAssessment(userInfo, scores, answers, assessmentType);
        setCurrentSubmissionId(newId);
        
        await sendSubmissionEmails(userInfo, scores);
        setView('results');
    } catch (error) {
        console.error("Submission failed", error);
        alert("Something went wrong submitting your results. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
      const element = pdfRef.current;
      if (!element) {
        alert("PDF template not ready.");
        return;
      }
      setGeneratingPDF(true);
      try {
        // Dynamic import to fix Vercel crash
        // @ts-ignore
        const html2pdfModule = await import('html2pdf.js');
        const html2pdfFn = html2pdfModule.default || html2pdfModule;
        if (!html2pdfFn) throw new Error("html2pdf.js failed to load.");
        
        const previousDisplay = element.style.display;
        element.style.display = "block";
        const opt = {
          margin: [0.3, 0.3] as [number, number],
          filename: `${(userInfo.name || "Conscious_Performance_Profile").replace(/\s+/g, "_")}.pdf`,
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" as const },
        };
        // @ts-ignore
        await html2pdfFn().set(opt).from(element).save();
        element.style.display = previousDisplay;
      } catch (err: any) {
        console.error("PDF generation error:", err);
        alert("PDF error: " + (err?.message || "Unknown error"));
      } finally {
        setGeneratingPDF(false);
      }
  };

  const getSectionIcon = (category: string) => {
    if (category.includes('CONSCIOUSNESS')) return Zap;
    if (category.includes('CONNECTION')) return Heart;
    if (category.includes('CONTRIBUTION')) return Briefcase;
    if (category.includes('COMMITMENT')) return Dumbbell;
    return Mountain;
  };

  const renderWelcome = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background FX */}
        <div className="absolute top-0 left-0 w-full h-full bg-[#050505] -z-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
                Conscious Human <span className="text-orange-500">Performance</span>
            </h1>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                Measure your energetic capacity, leadership alignment, and holistic success with the Zerkers Model.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <button 
                    onClick={() => setView('lead-capture')}
                    className="group relative overflow-hidden bg-gray-900 border border-white/10 p-8 rounded-2xl hover:border-orange-500/50 transition-all hover:-translate-y-1"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <User size={32} className="text-orange-500 mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Personal Profile</h3>
                    <p className="text-sm text-gray-500">For leaders, entrepreneurs, and high-performers seeking clarity.</p>
                </button>

                <button 
                    onClick={() => setView('corporate-capture')}
                    className="group relative overflow-hidden bg-gray-900 border border-white/10 p-8 rounded-2xl hover:border-blue-500/50 transition-all hover:-translate-y-1"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Building2 size={32} className="text-blue-500 mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Corporate Audit</h3>
                    <p className="text-sm text-gray-500">For organizations analyzing culture, retention, and burnout risks.</p>
                </button>
            </div>
            
            <div className="mt-12">
                 <button onClick={() => setView('admin-login')} className="text-sm text-gray-600 hover:text-white transition-colors">Admin Login</button>
            </div>
        </div>
    </div>
  );

  const renderLeadCapture = () => (
      <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 w-full max-w-lg relative z-10 animate-fade-in">
              <button onClick={() => setView('welcome')} className="absolute top-6 left-6 text-gray-500 hover:text-white"><ArrowLeft size={20}/></button>
              <h2 className="text-3xl font-bold text-white mb-2">Personal Profile</h2>
              <p className="text-gray-400 mb-8">Let's setup your assessment profile.</p>
              <form onSubmit={(e) => { e.preventDefault(); startAssessment('personal'); }} className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Full Name</label>
                      <input type="text" required className="input-field" value={userInfo.name} onChange={e => setUserInfo({...userInfo, name: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
                      <input type="email" required className="input-field" value={userInfo.email} onChange={e => setUserInfo({...userInfo, email: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Occupation (Optional)</label>
                      <input type="text" className="input-field" value={userInfo.occupation} onChange={e => setUserInfo({...userInfo, occupation: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl mt-4">Begin Assessment</button>
              </form>
          </div>
      </div>
  );

  const renderCorporateCapture = () => (
      <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 w-full max-w-lg relative z-10 animate-fade-in">
              <button onClick={() => setView('welcome')} className="absolute top-6 left-6 text-gray-500 hover:text-white"><ArrowLeft size={20}/></button>
              <h2 className="text-3xl font-bold text-white mb-2 text-blue-500">Corporate Audit</h2>
              <p className="text-gray-400 mb-8">Analyze your organization's health.</p>
              <form onSubmit={(e) => { e.preventDefault(); startAssessment('corporate'); }} className="space-y-4">
                   <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Company Name</label>
                      <input type="text" required className="input-field" value={userInfo.companyName} onChange={e => setUserInfo({...userInfo, companyName: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Representative Name</label>
                            <input type="text" required className="input-field" value={userInfo.name} onChange={e => setUserInfo({...userInfo, name: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Team Size</label>
                            <select className="input-field" value={userInfo.companySize} onChange={e => setUserInfo({...userInfo, companySize: e.target.value})}>
                                <option value="">Select...</option>
                                <option value="1-10">1-10</option>
                                <option value="11-50">11-50</option>
                                <option value="51-200">51-200</option>
                                <option value="200+">200+</option>
                            </select>
                        </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Work Email</label>
                      <input type="email" required className="input-field" value={userInfo.email} onChange={e => setUserInfo({...userInfo, email: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-4">Start Audit</button>
              </form>
          </div>
      </div>
  );

  const renderAssessment = () => {
      const section = sections[currentSectionIndex];
      const progress = ((currentSectionIndex) / sections.length) * 100;
      
      return (
        <div className="min-h-screen pt-20 pb-10 px-6 max-w-4xl mx-auto">
             {/* Progress */}
             <div className="fixed top-0 left-0 w-full h-2 bg-gray-900 z-50">
                 <div className={`h-full transition-all duration-500 ${assessmentType === 'corporate' ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${progress}%` }}></div>
             </div>

             <div className="flex items-center justify-between mb-8">
                 <div>
                     <span className={`text-xs font-bold uppercase tracking-widest ${assessmentType === 'corporate' ? 'text-blue-500' : 'text-orange-500'}`}>
                         Section {currentSectionIndex + 1} of {sections.length}
                     </span>
                     <h2 className="text-3xl md:text-4xl font-black text-white mt-1">{section.title}</h2>
                     <p className="text-gray-400 mt-2">{section.category}</p>
                 </div>
                 <div className="hidden md:block">
                      {getSectionIcon(section.category) && React.createElement(getSectionIcon(section.category), { size: 48, className: "text-gray-700" })}
                 </div>
             </div>

             <div className="space-y-4 mb-12">
                 {section.questions.map((q, idx) => (
                     <label key={idx} className="flex items-start gap-4 p-6 bg-gray-900/50 hover:bg-gray-800 border border-white/5 rounded-2xl cursor-pointer transition-all group">
                         <div className={`mt-1 w-6 h-6 rounded border flex items-center justify-center transition-colors ${answers[section.id]?.[idx] ? (assessmentType === 'corporate' ? 'bg-blue-500 border-blue-500' : 'bg-orange-500 border-orange-500') : 'border-gray-600 group-hover:border-gray-400'}`}>
                             {answers[section.id]?.[idx] && <CheckCircle size={14} className="text-white" />}
                         </div>
                         <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={!!answers[section.id]?.[idx]}
                            onChange={(e) => handleAnswerChange(section.id, idx, e.target.checked)}
                         />
                         <span className={`text-lg ${answers[section.id]?.[idx] ? 'text-white' : 'text-gray-400'}`}>{q.text}</span>
                     </label>
                 ))}
             </div>

             <div className="flex justify-between items-center bg-gray-900/80 backdrop-blur p-6 rounded-2xl border border-white/5 sticky bottom-6 shadow-2xl">
                 <button 
                    onClick={() => {
                        if (currentSectionIndex > 0) {
                            setCurrentSectionIndex(prev => prev - 1);
                            window.scrollTo(0,0);
                        }
                    }}
                    disabled={currentSectionIndex === 0}
                    className="text-gray-400 hover:text-white disabled:opacity-30 font-bold px-6 py-3"
                 >
                     Back
                 </button>
                 
                 {currentSectionIndex < sections.length - 1 ? (
                     <button 
                        onClick={() => {
                            setCurrentSectionIndex(prev => prev + 1);
                            window.scrollTo(0,0);
                        }}
                        className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${assessmentType === 'corporate' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-orange-600 hover:bg-orange-500'}`}
                     >
                         Next Section
                     </button>
                 ) : (
                     <button 
                        onClick={handleAssessmentComplete}
                        disabled={isSubmitting}
                        className={`px-8 py-3 rounded-xl font-bold text-white transition-all flex items-center gap-2 ${assessmentType === 'corporate' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-green-600 hover:bg-green-500'}`}
                     >
                         {isSubmitting ? 'Analyzing...' : 'Complete Assessment'}
                         {!isSubmitting && <ArrowRight size={18} />}
                     </button>
                 )}
             </div>
        </div>
      );
  };
  
  // --- RENDER LOGIC FOR ADMIN DASHBOARD ---
  if (view === 'admin-dashboard') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-orange-500 bg-[#050505]">Loading Dashboard...</div>}>
          <DashboardLayout 
            currentTab={adminTab} 
            onTabChange={(tab) => {
              setAdminTab(tab);
              setSelectedSubmissionId(null);
              setActiveSessionLeadId(null); 
            }}
            onLogout={() => setView('welcome')}
          >
            {activeSessionLeadId ? (
                <SessionMode 
                    lead={leadsCache.find(l => l.id === activeSessionLeadId) || { id: 'err', name: 'Unknown', email:'', responses: {motivation:'', struggle:'', intent:''}, status:'booked', createdAt:'' }} 
                    onBack={() => setActiveSessionLeadId(null)}
                />
            ) : selectedSubmissionId ? (
              <SubmissionDetail 
                  submissionId={selectedSubmissionId} 
                  onBack={() => setSelectedSubmissionId(null)} 
              />
            ) : (
              <>
                {adminTab === 'overview' && <Overview />}
                {adminTab === 'pipeline' && <Pipeline onStartSession={setActiveSessionLeadId} />} 
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

  // ... (Welcome Screen logic remains same)

  // ... (Assessment logic remains same)

  
  const renderResults = () => (
     <div className="max-w-7xl mx-auto pt-12 px-6 pb-20 animate-fade-in min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
                <div className={`h-1 w-10 ${assessmentType === 'corporate' ? 'bg-blue-500' : 'bg-orange-500'} rounded-full`}></div>
                <div className={`${assessmentType === 'corporate' ? 'text-blue-500' : 'text-orange-500'} font-bold tracking-widest uppercase text-xs`}>
                    {assessmentType === 'corporate' ? 'Organizational Analysis' : 'Official Analysis'}
                </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-600">Profile</span></h2>
          </div>
          <div className="flex gap-4">
            <button onClick={handleDownloadPDF} disabled={generatingPDF} className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] text-sm flex items-center gap-2 disabled:opacity-50">
                {generatingPDF ? (<div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>) : (<Download size={16} />)} {generatingPDF ? 'Generating...' : 'Download PDF'}
            </button>
            <button onClick={() => setView('welcome')} className="text-gray-400 hover:text-white text-sm border border-gray-700 hover:border-gray-500 px-8 py-3 rounded-full transition-colors backdrop-blur-sm">Close</button>
          </div>
      </div>
      {previousScores && (
         <div className="mb-10 bg-gray-800/40 backdrop-blur-xl border border-orange-500/30 p-6 rounded-2xl flex items-center gap-6 shadow-[0_0_30px_rgba(0,0,0,0.3)] relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none"></div>
             <div className="bg-orange-500 p-4 rounded-xl shadow-lg shadow-orange-500/20 z-10"><Activity className="text-white w-8 h-8" /></div>
             <div className="z-10"><h4 className="text-white font-bold text-xl mb-1">Growth Tracking Active</h4><p className="text-sm text-gray-300">We've overlaid your previous results (dashed line) to visualize your progress over time.</p></div>
         </div>
      )}
      <div className="glass-panel p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-6 items-center md:items-start border border-white/5">
         <div className={`w-16 h-16 bg-gradient-to-br ${assessmentType === 'corporate' ? 'from-blue-500 to-blue-700' : 'from-orange-500 to-red-600'} rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
             {assessmentType === 'corporate' ? <Building2 size={32} /> : userInfo.name.charAt(0)}
         </div>
         <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white">{userInfo.name}</h3>
            {assessmentType === 'corporate' && <p className="text-blue-400 font-bold text-lg">{userInfo.companyName}</p>}
            <div className="flex flex-wrap gap-4 mt-2 justify-center md:justify-start text-sm text-gray-400">
               <div className="flex items-center gap-1"><User size={14}/> {userInfo.email}</div>
               {userInfo.occupation && <div className="flex items-center gap-1"><Briefcase size={14}/> {userInfo.occupation}</div>}
               {userInfo.dob && <div className="flex items-center gap-1"><Calendar size={14}/> {userInfo.dob}</div>}
               {userInfo.companySize && <div className="flex items-center gap-1"><Users size={14}/> Team: {userInfo.companySize}</div>}
            </div>
         </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className="lg:col-span-7 glass-panel chart-container p-8 md:p-14 rounded-[2.5rem] flex flex-col items-center relative overflow-hidden">
           <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none ambient-glow"></div>
           <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none ambient-glow"></div>
           <h3 className="text-sm font-bold text-gray-400 mb-10 uppercase tracking-[0.2em] relative z-10 flex items-center gap-3"><Sparkles size={14} className="text-orange-500" />{previousScores ? 'Comparative Analysis' : 'Zerkers Model Visualization'}</h3>
           <div className="relative z-10 w-full flex justify-center"><PerformanceModelChart scores={scores} previousScores={previousScores} type={assessmentType} /></div>
        </div>
        <div className="lg:col-span-5 space-y-6">
           
           {/* UPDATED: Pass Assessment Context to AI */}
           <GeminiInsights 
                scores={scores} 
                submissionId={currentSubmissionId || undefined} 
                type={assessmentType}
                name={userInfo.name}
                companyName={userInfo.companyName}
           />
           
           <div className="glass-panel score-card p-8 rounded-3xl">
                <h4 className="text-gray-400 uppercase tracking-wider text-xs font-bold mb-6">Raw Score Breakdown</h4>
                <div className="grid grid-cols-2 gap-4">
                    {Object.entries(scores).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-sm text-gray-300">{key}</span>
                            <span className={`font-mono font-bold ${typeof val === 'number' && val >= 6 ? 'text-green-400' : typeof val === 'number' && val >= 4 ? 'text-orange-400' : 'text-red-400'}`}>
                                {typeof val === 'number' ? val.toFixed(1) : val}
                            </span>
                        </div>
                    ))}
                </div>
           </div>
        </div>
      </div>
      {/* ... Rest of Render (Show Answers / PDF) ... */}
       <div className="glass-panel rounded-3xl overflow-hidden mb-8 border border-white/10">
          <button onClick={() => setShowAnswers(!showAnswers)} className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3"><div className="bg-orange-500/20 p-2 rounded-lg text-orange-400"><ShieldCheck size={20} /></div><div className="text-left"><h3 className="text-white font-bold text-lg">Review Your Responses</h3><p className="text-sm text-gray-400">See your answers for each section.</p></div></div>
              {showAnswers ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
          </button>
          {showAnswers && (
              <div className="p-6 md:p-8 space-y-8 bg-[#0a0a0a]/50">
                  {sections.map(section => (
                      <div key={section.id}>
                          <h4 className="text-orange-400 font-bold uppercase text-xs tracking-wider mb-4 border-b border-white/10 pb-2">{section.title}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {section.questions.map((q, idx) => {
                                  const isYes = answers[section.id]?.[idx];
                                  return (
                                      <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${isYes ? 'bg-green-900/10 border-green-500/20' : 'bg-gray-800/30 border-white/5'}`}>
                                          <div className={`mt-0.5 flex-shrink-0 ${isYes ? 'text-green-400' : 'text-gray-500'}`}>{isYes ? <CheckCircle size={16} /> : <XCircle size={16} />}</div>
                                          <span className={`text-sm ${isYes ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>{q.text}</span>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
      <div ref={pdfRef} style={{ display: 'none', background: 'white', padding: '40px', color: '#000', fontFamily: 'sans-serif' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #f97316', paddingBottom: '20px' }}>
            <div><h1 style={{ fontSize: '28px', fontWeight: '900', color: '#000', margin: 0 }}>Conscious Human Performance</h1><p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>{assessmentType === 'corporate' ? 'Organizational Health Profile' : 'Official Assessment Profile'}</p></div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{userInfo.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{userInfo.companyName}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{new Date().toLocaleDateString()}</div>
            </div>
         </div>
         <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
             <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', color: '#f97316', marginBottom: '15px' }}>Score Breakdown</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {Object.entries(scores).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}><span style={{ fontSize: '12px', fontWeight: 'bold' }}>{key}</span><span style={{ fontSize: '12px', fontWeight: 'bold' }}>{typeof val === 'number' ? val.toFixed(1) : val}</span></div>
                    ))}
                </div>
             </div>
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', fontWeight: '900', color: '#f97316' }}>{Object.values(scores).reduce((a,b) => (typeof a === 'number' && typeof b === 'number') ? a + b : 0, 0) / 9 >= 5 ? 'High' : 'Growing'}</div>
                      <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666', letterSpacing: '1px' }}>Performance Level</div>
                  </div>
             </div>
         </div>
         {/* Pass Context to PDF version too if possible, although prompts trigger on button click usually */}
         <div style={{ marginBottom: '30px' }}><h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', color: '#f97316', marginBottom: '15px' }}>AI Strategic Analysis</h3><GeminiInsights scores={scores} type={assessmentType} name={userInfo.name} companyName={userInfo.companyName} /></div>
         <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '10px', color: '#999' }}>&copy; 2025 Conscious Human Performance. All Rights Reserved.</div>
      </div>
     </div>
  );
  
  if (view === 'admin-login') {
    return (
      <ErrorBoundary>
         <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-orange-500 bg-[#050505]">Loading...</div>}>
             <Login onLogin={() => setView('admin-dashboard')} />
         </Suspense>
      </ErrorBoundary>
    );
  }

  // --- MAIN RENDER SWITCH (Same as before) ---
  return (
    <div className="min-h-screen selection:bg-orange-500/30 text-gray-100">
      <main>
        {view === 'welcome' && (
            <div className="relative">
                {renderWelcome()}
                {/* Note: Added z-50 to ensure it is clickable if needed, though it's just text */}
                <div className="absolute top-4 left-0 w-full text-center z-50">
                    <div className="inline-block px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-xs text-gray-400">
                        Please wait for your coach before starting the assessment.
                    </div>
                </div>
            </div>
        )}
        
        {/* UPDATED: onComplete goes to 'assessment', fixing loop */}
        {view === 'micro-qualify' && <MicroQualify onComplete={() => setView('assessment')} onAdminLogin={() => setView('admin-login')} />} 
        
        {view === 'assessment' && renderAssessment()}
        {view === 'lead-capture' && renderLeadCapture()}
        {view === 'corporate-capture' && renderCorporateCapture()}
        {view === 'results' && renderResults()}
      </main>
      <footer className="text-center text-gray-600 py-10 border-t border-white/5 text-xs font-mono">
        &copy; 2025 Conscious Human Performance. All Rights Reserved.
      </footer>
    </div>
  );
};

export default App;
