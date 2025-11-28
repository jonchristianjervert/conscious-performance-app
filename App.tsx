import React, { useState, useMemo, Suspense, useRef, useEffect } from 'react';
import { SECTIONS } from './constants';
import { Answers, Scores, Section, Lead } from './types';
import PerformanceModelChart from './components/PerformanceModelChart';
import GeminiInsights from './components/GeminiInsights';
import { submitAssessment, getPreviousSubmission } from './services/mockData';
import { sendSubmissionEmails } from './services/automation';
import { getQuestions } from './services/questionService';
import { fetchLeads } from './services/clientService';
import MicroQualify from './components/MicroQualify'; 
import { ShieldCheck, Sparkles, ChevronRight, ArrowRight, Star, Activity, PlayCircle, Zap, Heart, Briefcase, Dumbbell, Mountain, CheckCircle, XCircle, ChevronDown, ChevronUp, Download, User, Calendar } from 'lucide-react';

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
  const [view, setView] = useState<string>('micro-qualify');
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

  const [userInfo, setUserInfo] = useState({ name: '', email: '', dob: '', occupation: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousScores, setPreviousScores] = useState<Scores | null>(null);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
  
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
        setSections(loadedSections);
        setAnswers(prev => {
          const newAnswers: Answers = {};
          loadedSections.forEach(section => {
             if (prev[section.id] && prev[section.id].length === section.questions.length) {
                newAnswers[section.id] = prev[section.id];
             } else {
                newAnswers[section.id] = Array(section.questions.length).fill(false);
             }
          });
          return newAnswers;
        });
      } catch (err) {
        console.error("Failed to load questions", err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    loadQuestions();
  }, []);

  useEffect(() => {
    if (view === 'admin-dashboard') {
        fetchLeads().then(setLeadsCache);
    }
  }, [view]);

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
        const newId = await submitAssessment(userInfo, scores, answers);
        setCurrentSubmissionId(newId);
        
        await sendSubmissionEmails(userInfo, scores);
        setView('results');
    } catch
