
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
