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
  // Check URL for view parameter (Deep Linking)
  const [view, setView] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'assessment') return 'assessment';
    if (viewParam === 'micro-qualify') return 'micro-qualify';
    if (viewParam === 'welcome') return 'welcome';
    return 'micro-qualify'; // Default
  });

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
