import React, { useState, useMemo, Suspense, useRef, useEffect } from 'react';
import { SECTIONS } from './constants';
import { Answers, Scores, Section } from './types';
import PerformanceModelChart from './components/PerformanceModelChart';
import GeminiInsights from './components/GeminiInsights';
import { submitAssessment, getPreviousSubmission } from './services/mockData';
import { sendSubmissionEmails } from './services/automation';
import { getQuestions } from './services/questionService';
import {
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Star,
  Activity,
  PlayCircle,
  Zap,
  Heart,
  Users,
  Briefcase,
  Dumbbell,
  Mountain,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
  User,
  Calendar,
  MapPin
} from 'lucide-react';

// @ts-ignore – html2pdf.js is a UMD bundle, default import at runtime
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
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin Dashboard Error:', error, errorInfo);
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
  const [view, setView] = useState<string>('welcome');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // State for Dynamic Questions
  const [sections, setSections] = useState<Section[]>(SECTIONS);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Initialize answers with SECTIONS constant first to prevent render errors,
  // will update when dynamic questions load
  const [answers, setAnswers] = useState<Answers>(() => {
    return SECTIONS.reduce((acc, section) => {
      acc[section.id] = Array(section.questions.length).fill(false);
      return acc;
    }, {} as Answers);
  });

  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    dob: '',
    occupation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousScores, setPreviousScores] = useState<Scores | null>(null);
  const [adminTab, setAdminTab] = useState('overview');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  // PDF Ref
  const pdfRef = useRef<HTMLDivElement>(null);

  // Load Questions on Mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const loadedSections = await getQuestions();
        setSections(loadedSections);

        // Reset answers structure to match loaded questions
        setAnswers(prev => {
          const newAnswers: Answers = {};
          loadedSections.forEach(section => {
            // Preserve existing answers if length matches, else reset
            if (prev[section.id] && prev[section.id].length === section.questions.length) {
              newAnswers[section.id] = prev[section.id];
            } else {
              newAnswers[section.id] = Array(section.questions.length).fill(false);
            }
          });
          return newAnswers;
        });
      } catch (err) {
        console.error('Failed to load questions', err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    loadQuestions();
  }, []);

  const handleAnswerChange = (sectionId: string, questionIndex: number, isChecked: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].map((ans, i) => (i === questionIndex ? isChecked : ans))
    }));
  };

  const calculateScores = (): Scores => {
    const scores: Partial<Scores> = {};
    const scoreMap: { [key: string]: keyof Scores } = {
      A: 'Energy',
      B: 'Awareness',
      C: 'Love',
      D: 'Tribe',
      E: 'Career',
      F: 'Abundance',
      G: 'Fitness',
      H: 'Health'
    };

    let scoreI = 0;
    let scoreJ = 0;

    for (const section of sections) {
      if (!answers[section.id]) continue;
      const yesCount = answers[section.id].filter(Boolean).length;
      if (scoreMap[section.id]) {
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
      await submitAssessment(userInfo, scores, answers);
      await sendSubmissionEmails(userInfo, scores);
      setView('results');
    } catch (error) {
      console.error('Submission failed', error);
      alert('Something went wrong submitting your results. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = pdfRef.current;
    if (!element) {
      alert('PDF template not ready.');
      return;
    }

    setGeneratingPDF(true);

    try {
      if (!html2pdf) {
        throw new Error('html2pdf library not available');
      }

      const previousDisplay = element.style.display;
      element.style.display = 'block';

      const opt = {
        margin: 0.3,
        filename: `${(userInfo.name || 'Conscious_Performance_Profile').replace(
          /\s+/g,
          '_'
        )}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
      };

      await (html2pdf() as any).set(opt).from(element).save();

      element.style.display = previousDisplay;
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert('PDF error: ' + (err?.message || JSON.stringify(err) || String(err)));
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Icons map for sections to add visual flair
  const getSectionIcon = (category: string) => {
    if (category.includes('CONSCIOUSNESS')) return Zap;
    if (category.includes('CONNECTION')) return Heart;
    if (category.includes('CONTRIBUTION')) return Briefcase;
    if (category.includes('COMMITMENT')) return Dumbbell;
    return Mountain;
  };

  const renderWelcome = () => (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Ambient Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[120px] animate-pulse-glow"></div>
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-glow"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto px-6 animate-fade-in">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-orange-400 text-xs font-bold uppercase tracking-widest mb-10 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-white/10 transition-colors cursor-default">
          <Sparkles size={14} className="text-orange-500 animate-pulse" />
          <span>The Official Zerkers Model</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white mb-8 drop-shadow-2xl">
          <span className="text-gradient block">Conscious</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 block text-5xl md:text-7xl mt-2">
            Human Performance
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-16 font-light">
          Align your <span className="text-orange-500 font-medium glow-text-orange">Consciousness</span>,{' '}
          <span className="text-blue-400 font-medium">Connection</span>,{' '}
          <span className="text-green-400 font-medium">Contribution</span>, and{' '}
          <span className="text-purple-400 font-medium">Commitment</span> to unlock your highest potential.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-24">
          <button
            onClick={() => setView('assessment')}
            className="group relative px-12 py-6 bg-orange-600 hover:bg-orange-500 text-white font-bold text-lg rounded-full transition-all hover:scale-105 shadow-[0_0_40px_rgba(249,115,22,0.4)] flex items-center gap-4 overflow-hidden ring-2 ring-orange-500/50 ring-offset-4 ring-offset-black"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            Start Assessment
            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => setView('admin-login')}
            className="px-10 py-6 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium rounded-full transition-all border border-white/10 hover:border-white/30 backdrop-blur-sm flex items-center gap-2 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <ShieldCheck size={18} />
            Admin Portal
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              title: 'Awareness',
              desc: 'Identify blind spots in your spiritual and emotional fulfillment.',
              icon: Star,
              color: 'text-orange-500'
            },
            {
              title: 'Connection',
              desc: 'Evaluate the strength of your relationships and tribal bonds.',
              icon: Activity,
              color: 'text-blue-500'
            },
            {
              title: 'Action',
              desc: 'Measure your drive, career alignment, and physical vitality.',
              icon: PlayCircle,
              color: 'text-green-500'
            }
          ].map((item, i) => (
            <div
              key={i}
              className="p-8 glass-panel rounded-3xl hover:border-white/20 transition-all duration-500 hover:-translate-y-2 group"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors`}
              >
                <item.icon
                  className={`${item.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                  size={28}
                />
              </div>
              <h3 className="text-white font-bold text-xl mb-3 group-hover:text-orange-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-base text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAssessment = () => {
    if (loadingQuestions)
      return (
        <div className="min-h-screen flex items-center justify-center text-orange-500">
          Loading Assessment...
        </div>
      );

    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return <div>Error loading section</div>;

    const progress = ((currentSectionIndex + 1) / sections.length) * 100;
    const SectionIcon = getSectionIcon(currentSection.category);

    return (
      <div className="min-h-screen flex flex-col max-w-4xl mx-auto pt-12 px-6 pb-16 relative">
        {/* Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-2 bg-gray-900/50 z-50 backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.6)] transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="mb-12 mt-8 flex justify-between items-end">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <SectionIcon className="text-orange-500" size={24} />
            </div>
            <span className="text-orange-500 font-bold tracking-[0.2em] text-sm uppercase">
              {currentSection.category}
            </span>
          </div>
          <span className="text-gray-500 text-sm font-mono">
            {currentSectionIndex + 1} / {sections.length}
          </span>
        </div>

        {/* Question Card */}
        <div key={currentSection.id} className="flex-1 animate-fade-in">
          <div className="mb-10">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2">
              {currentSection.title}
            </h2>
            <div className="h-1 w-20 bg-orange-500 rounded-full"></div>
          </div>

          <div className="space-y-4">
            {currentSection.questions.map((q, i) => (
              <label
                key={i}
                className={`
                group flex items-center p-6 rounded-2xl cursor-pointer transition-all duration-300 border
                ${
                  answers[currentSection.id]?.[i]
                    ? 'bg-gradient-to-r from-orange-900/20 to-orange-900/5 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.1)] translate-x-2'
                    : 'bg-[#121214]/60 border-white/5 hover:bg-[#1a1c23]/80 hover:border-white/10 hover:scale-[1.01]'
                }
              `}
              >
                <div
                  className={`
                    relative flex items-center justify-center h-7 w-7 flex-shrink-0 rounded-lg border-2 transition-all duration-300
                    ${
                      answers[currentSection.id]?.[i]
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-gray-600 bg-transparent group-hover:border-gray-400'
                    }
                `}
                >
                  <input
                    type="checkbox"
                    className="appearance-none absolute inset-0 cursor-pointer"
                    checked={answers[currentSection.id]?.[i] || false}
                    onChange={e =>
                      handleAnswerChange(currentSection.id, i, e.target.checked)
                    }
                  />
                  <ShieldCheck
                    size={16}
                    className={`text-white transform transition-transform duration-300 ${
                      answers[currentSection.id]?.[i] ? 'scale-100' : 'scale-0'
                    }`}
                  />
                </div>
                <span
                  className={`ml-5 text-lg md:text-xl leading-snug transition-colors ${
                    answers[currentSection.id]?.[i]
                      ? 'text-white font-medium'
                      : 'text-gray-400 group-hover:text-gray-200'
                  }`}
                >
                  {q.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="pt-12 mt-4 flex justify-between items-center">
          <button
            onClick={() =>
              currentSectionIndex > 0 &&
              setCurrentSectionIndex(currentSectionIndex - 1)
            }
            disabled={currentSectionIndex === 0}
            className="text-gray-500 hover:text-white font-medium px-6 py-3 transition-colors disabled:opacity-0 hover:bg-white/5 rounded-xl"
          >
            Previous
          </button>

          {currentSectionIndex < sections.length - 1 ? (
            <button
              onClick={() => setCurrentSectionIndex(currentSectionIndex + 1)}
              className="group bg-white text-black hover:bg-gray-200 font-bold py-4 px-10 rounded-full transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-3"
            >
              Next{' '}
              <ChevronRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          ) : (
            <button
              onClick={() => setView('lead-capture')}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-4 px-12 rounded-full transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(249,115,22,0.5)]"
            >
              Complete Profile
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderLeadCapture = () => (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass-panel p-10 md:p-16 rounded-3xl border border-white/10 text-center animate-fade-in w-full max-w-lg relative z-10 shadow-2xl">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(249,115,22,0.4)] transform rotate-3">
          <Sparkles className="text-white w-10 h-10" />
        </div>
        <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Your Profile</h2>
        <p className="text-gray-400 mb-10 text-lg">
          Unlock your personalized Conscious Human Performance report.
        </p>

        <form onSubmit={handleAssessmentComplete} className="space-y-6 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">
              Full Name
            </label>
            <input
              type="text"
              required
              className="input-field text-lg"
              value={userInfo.name}
              onChange={e => setUserInfo({ ...userInfo, name: e.target.value })}
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              className="input-field text-lg"
              value={userInfo.email}
              onChange={e => setUserInfo({ ...userInfo, email: e.target.value })}
              placeholder="name@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">
                Date of Birth
              </label>
              <input
                type="date"
                required
                className="input-field text-lg"
                value={userInfo.dob}
                onChange={e => setUserInfo({ ...userInfo, dob: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">
                Occupation
              </label>
              <input
                type="text"
                required
                className="input-field text-lg"
                value={userInfo.occupation}
                onChange={e =>
                  setUserInfo({ ...userInfo, occupation: e.target.value })
                }
                placeholder="Role / Job"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-5 rounded-xl transition-all mt-6 shadow-[0_0_30px_rgba(249,115,22,0.3)] text-lg hover:scale-[1.02]"
          >
            {isSubmitting ? 'Analyzing Data...' : 'Reveal Results'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="max-w-7xl mx-auto pt-12 px-6 pb-20 animate-fade-in min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-10 bg-orange-500 rounded-full"></div>
            <div className="text-orange-500 font-bold tracking-widest uppercase text-xs">
              Official Analysis
            </div>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
            Performance{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-600">
              Profile
            </span>
          </h2>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
            className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {generatingPDF ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Download size={16} />
            )}
            {generatingPDF ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            onClick={() => setView('welcome')}
            className="text-gray-400 hover:text-white text-sm border border-gray-700 hover:border-gray-500 px-8 py-3 rounded-full transition-colors backdrop-blur-sm"
          >
            Close
          </button>
        </div>
      </div>

      {/* Comparison Badge */}
      {previousScores && (
        <div className="mb-10 bg-gray-800/40 backdrop-blur-xl border border-orange-500/30 p-6 rounded-2xl flex items-center gap-6 shadow-[0_0_30px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none"></div>
          <div className="bg-orange-500 p-4 rounded-xl shadow-lg shadow-orange-500/20 z-10">
            <Activity className="text-white w-8 h-8" />
          </div>
          <div className="z-10">
            <h4 className="text-white font-bold text-xl mb-1">Growth Tracking Active</h4>
            <p className="text-sm text-gray-300">
              We've overlaid your previous results (dashed line) to visualize your
              progress over time.
            </p>
          </div>
        </div>
      )}

      {/* Profile Header Block */}
      <div className="glass-panel p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-6 items-center md:items-start border border-white/5">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {userInfo.name.charAt(0)}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-bold text-white">{userInfo.name}</h3>
          <div className="flex flex-wrap gap-4 mt-2 justify-center md:justify-start text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <User size={14} /> {userInfo.email}
            </div>
            {userInfo.occupation && (
              <div className="flex items-center gap-1">
                <Briefcase size={14} /> {userInfo.occupation}
              </div>
            )}
            {userInfo.dob && (
              <div className="flex items-center gap-1">
                <Calendar size={14} /> {userInfo.dob}
              </div>
            )}
          </div>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">
            Assessment Date
          </div>
          <div className="text-white font-mono">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className="lg:col-span-7 glass-panel chart-container p-8 md:p-14 rounded-[2.5rem] flex flex-col items-center relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none ambient-glow"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none ambient-glow"></div>

          <h3 className="text-sm font-bold text-gray-400 mb-10 uppercase tracking-[0.2em] relative z-10 flex items-center gap-3">
            <Sparkles size={14} className="text-orange-500" />
            {previousScores ? 'Comparative Analysis' : 'Zerkers Model Visualization'}
          </h3>
          <div className="relative z-10 w-full flex justify-center">
            <PerformanceModelChart scores={scores} previousScores={previousScores} />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <GeminiInsights scores={scores} />

          {/* Mini Score Grid for Quick Ref */}
          <div className="glass-panel score-card p-8 rounded-3xl">
            <h4 className="text-gray-400 uppercase tracking-wider text-xs font-bold mb-6">
              Raw Score Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(scores).map(([key, val]) => (
                <div
                  key={key}
                  className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5"
                >
                  <span className="text-sm text-gray-300">{key}</span>
                  <span
                    className={`font-mono font-bold ${
                      typeof val === 'number' && val >= 6
                        ? 'text-green-400'
                        : typeof val === 'number' && val >= 4
                        ? 'text-orange-400'
                        : 'text-red-400'
                    }`}
                  >
                    {typeof val === 'number' ? val.toFixed(1) : val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Responses Section */}
      <div className="glass-panel rounded-3xl overflow-hidden mb-8 border border-white/10">
        <button
          onClick={() => setShowAnswers(!showAnswers)}
          className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-2 rounded-lg text-orange-400">
              <ShieldCheck size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-white font-bold text-lg">Review Your Responses</h3>
              <p className="text-sm text-gray-400">See your answers for each section.</p>
            </div>
          </div>
          {showAnswers ? (
            <ChevronUp className="text-gray-400" />
          ) : (
            <ChevronDown className="text-gray-400" />
          )}
        </button>

        {showAnswers && (
          <div className="p-6 md:p-8 space-y-8 bg-[#0a0a0a]/50">
            {sections.map(section => (
              <div key={section.id}>
                <h4 className="text-orange-400 font-bold uppercase text-xs tracking-wider mb-4 border-b border-white/10 pb-2">
                  {section.title}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.questions.map((q, idx) => {
                    const isYes = answers[section.id]?.[idx];
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                          isYes
                            ? 'bg-green-900/10 border-green-500/20'
                            : 'bg-gray-800/30 border-white/5'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex-shrink-0 ${
                            isYes ? 'text-green-400' : 'text-gray-500'
                          }`}
                        >
                          {isYes ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        </div>
                        <span
                          className={`text-sm ${
                            isYes ? 'text-gray-200 font-medium' : 'text-gray-500'
                          }`}
                        >
                          {q.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HIDDEN PDF TEMPLATE - Only Visible to html2pdf generator */}
      <div
        ref={pdfRef}
        style={{
          display: 'none',
          background: 'white',
          padding: '40px',
          color: '#000',
          fontFamily: 'sans-serif'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            borderBottom: '2px solid #f97316',
            paddingBottom: '20px'
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: '900',
                color: '#000',
                margin: 0
              }}
            >
              Conscious Human Performance
            </h1>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Official Assessment Profile
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{userInfo.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {new Date().toLocaleDateString()}
            </div>
            {userInfo.occupation && (
              <div style={{ fontSize: '12px', color: '#666' }}>{userInfo.occupation}</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: '#f97316',
                marginBottom: '15px'
              }}
            >
              Score Breakdown
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px'
              }}
            >
              {Object.entries(scores).map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px',
                    background: '#f3f4f6',
                    borderRadius: '4px'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{key}</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {typeof val === 'number' ? val.toFixed(1) : val}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '20px'
            }}
          >
            {/* Note: We don't render the complex SVG chart here to avoid canvas tainting issues in PDF. We show the key stats. */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: '900',
                  color: '#f97316'
                }}
              >
                {Object.values(scores).reduce(
                  (a, b) =>
                    typeof a === 'number' && typeof b === 'number' ? a + b : 0,
                  0
                ) /
                  9 >=
                5
                  ? 'High'
                  : 'Growing'}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  color: '#666',
                  letterSpacing: '1px'
                }}
              >
                Performance Level
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: '#f97316',
              marginBottom: '15px'
            }}
          >
            AI Strategic Analysis
          </h3>
          <GeminiInsights scores={scores} />
        </div>

        <div
          style={{
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '1px solid '#eee',
            textAlign: 'center',
            fontSize: '10px',
            color: '#999'
          }}
        >
          &copy; 2025 Conscious Human Performance. All Rights Reserved.
        </div>
      </div>
    </div>
  );

  // --- Admin Router ---
  if (view === 'admin-login') {
    return (
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center text-orange-500 bg-[#050505]">
              Loading...
            </div>
          }
        >
          <Login onLogin={() => setView('admin-dashboard')} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (view === 'admin-dashboard') {
    return (
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center text-orange-500 bg-[#050505]">
              Loading Dashboard...
            </div>
          }
        >
          <DashboardLayout
            currentTab={adminTab}
            onTabChange={tab => {
              setAdminTab(tab);
              setSelectedSubmissionId(null);
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
                {adminTab === 'submissions' && (
                  <SubmissionList onSelectSubmission={setSelectedSubmissionId} />
                )}
                {adminTab === 'reports' && <Reports />}
                {adminTab === 'settings' && <Settings />}
              </>
            )}
          </DashboardLayout>
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen selection:bg-orange-500/30 text-gray-100">
      <main>
        {view === 'welcome' && renderWelcome()}
        {view === 'assessment' && renderAssessment()}
        {view === 'lead-capture' && renderLeadCapture()}
        {view === 'results' && renderResults()}
      </main>
      <footer className="text-center text-gray-600 py-10 border-t border-white/5 text-xs font-mono">
        &copy; 2025 Conscious Human Performance. All Rights Reserved.
      </footer>
    </div>
  );
};

export default App;
