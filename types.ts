
export interface Question {
  text: string;
}

export interface Section {
  id: string;
  category: string;
  title: string;
  questions: Question[];
}

export type Answers = Record<string, boolean[]>;

export interface Scores {
  Energy: number;
  Awareness: number;
  Love: number;
  Tribe: number;
  Career: number;
  Abundance: number;
  Fitness: number;
  Health: number;
  Adventure: number;
}

// --- Admin & Backend Types ---

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  dob?: string;
  occupation?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Submission {
  id: string;
  userId: string;
  userProfile: UserProfile; // Joined for easier frontend display
  timestamp: string;
  scores: Scores;
  answers: Answers;
  metadata: {
    device: string;
    location: string;
    completionTimeSeconds: number;
  };
  aiSummary?: string; // Stored summary
}

// --- NEW LEAD & CLIENT TYPES (Phase 1) ---

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  responses: {
    motivation: string; // Q1: What made you want to explore this?
    struggle: string;   // Q2: What feels off?
    intent: string;     // Q3: Clarity, Support, Both?
  };
  status: 'new' | 'qualified' | 'booked' | 'disqualified';
  createdAt: string;
}

// --- SESSION & PLAN TYPES (Phase 3) ---

export interface ActivationPlan {
  dailyFocus: string[]; // 4 days of specific actions
  coreInsight: string;
  mantra: string;
}

export interface Session {
  id: string;
  leadId: string;
  coachId: string; // "admin" for now
  date: string;
  notes: {
    challenges: string;
    goals: string;
    gap: string; // The gap between current and desired
  };
  agreements: {
    permissionToCoach: boolean;
    commitmentToChange: boolean;
    financialReady: boolean;
  };
  activationPlan?: ActivationPlan;
  status: 'completed' | 'in-progress';
}

export interface QuestionStat {
  questionText: string;
  percentageTrue: number;
  category: string;
}

export interface DashboardMetrics {
  totalSubmissions: number;
  averageScores: Scores;
  completionRate: number;
  submissionsLast30Days: { date: string; count: number }[];
  questionStats: QuestionStat[];
}
