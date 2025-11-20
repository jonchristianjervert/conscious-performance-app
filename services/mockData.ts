
import { DashboardMetrics, Submission, Scores, Answers, QuestionStat, UserProfile } from '../types';
import { SECTIONS } from '../constants';
import { db, isConfigured } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, Timestamp, where } from 'firebase/firestore';

// --- FALLBACK MOCK GENERATORS ---
// These are used if Firebase is not configured or fails.

const NAMES = [
  "Alex Rivera", "Jordan Lee", "Casey Smith", "Taylor Morgan", "Riley Chen", 
  "Morgan Davis", "Quinn Campbell", "Avery Johnson", "Reese Wilson", "Charlie Brown",
  "Sam Taylor", "Jamie Oliver", "Drew Barry", "Cameron Diaz", "Hayden Pan"
];

const generateRandomScores = (): Scores => ({
  Energy: Math.floor(Math.random() * 4) + 4,
  Awareness: Math.floor(Math.random() * 5) + 2,
  Love: Math.floor(Math.random() * 4) + 3,
  Tribe: Math.floor(Math.random() * 7) + 1,
  Career: Math.floor(Math.random() * 6) + 1,
  Abundance: Math.floor(Math.random() * 5) + 2,
  Fitness: Math.floor(Math.random() * 7) + 1,
  Health: Math.floor(Math.random() * 5) + 3,
  Adventure: Math.floor(Math.random() * 7) + 1,
});

const generateMockAnswers = (scores: Scores): Answers => {
    const answers: Answers = {};
    const scoreMap: Record<string, keyof Scores> = {
        'A': 'Energy', 'B': 'Awareness', 'C': 'Love', 'D': 'Tribe',
        'E': 'Career', 'F': 'Abundance', 'G': 'Fitness', 'H': 'Health',
        'I': 'Adventure', 'J': 'Adventure'
    };
    SECTIONS.forEach(section => {
        const targetScore = scores[scoreMap[section.id]];
        const probability = targetScore / 7;
        answers[section.id] = section.questions.map(() => Math.random() < probability);
    });
    return answers;
};

const generateHistory = (count: number): Submission[] => {
  const submissions: Submission[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    const scores = generateRandomScores();
    const answers = generateMockAnswers(scores);
    submissions.push({
      id: `sub_mock_${Math.random().toString(36).substr(2, 9)}`,
      userId: `user_mock_${Math.random().toString(36).substr(2, 9)}`,
      userProfile: {
        id: `user_mock_${Math.random().toString(36).substr(2, 9)}`,
        name: NAMES[Math.floor(Math.random() * NAMES.length)],
        email: `user${i}@example.com`,
        role: 'user',
        createdAt: date.toISOString(),
      },
      timestamp: date.toISOString(),
      scores: scores,
      answers: answers,
      metadata: {
        device: Math.random() > 0.5 ? 'Mobile' : 'Desktop',
        location: Math.random() > 0.7 ? 'United States' : 'International',
        completionTimeSeconds: 120 + Math.floor(Math.random() * 300),
      }
    });
  }
  return submissions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// --- MOCK STATE (Fallback) ---
let MOCK_SUBMISSIONS: Submission[] = [];
const STORAGE_KEY = 'chp_assessment_submissions_fallback';

const initMockData = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            MOCK_SUBMISSIONS = JSON.parse(stored);
            return;
        }
    } catch (e) {}
    const seed = generateHistory(35);
    // Ensure Demo User
    const jonUser: Submission = {
        id: 'sub_jon_christian_fixed',
        userId: 'user_jon_christian',
        userProfile: {
            id: 'user_jon_christian',
            name: 'Jon Christian',
            email: 'jon.christian@zerkers.com',
            role: 'admin',
            createdAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        scores: { Energy: 7, Awareness: 7, Love: 6, Tribe: 7, Career: 7, Abundance: 7, Fitness: 6, Health: 5, Adventure: 6.5 },
        answers: generateMockAnswers({ Energy: 7, Awareness: 7, Love: 6, Tribe: 7, Career: 7, Abundance: 7, Fitness: 6, Health: 5, Adventure: 6.5 }),
        metadata: { device: 'Desktop', location: 'Headquarters', completionTimeSeconds: 420 }
    };
    MOCK_SUBMISSIONS = [jonUser, ...seed];
};

// Initialize mock data just in case
initMockData();


// --- REAL DATA SERVICE FUNCTIONS ---

export const submitAssessment = async (
  user: { name: string; email: string },
  scores: Scores,
  answers: Answers
): Promise<void> => {
    // 1. REAL FIREBASE SUBMISSION
    if (isConfigured && db) {
        try {
            // We create the user profile object directly on the submission for denormalization
            // In a larger app, you'd check/create a separate Users collection first
            const submissionData = {
                userId: `user_${user.email.replace(/[^a-zA-Z0-9]/g, '')}`,
                userProfile: {
                    id: `user_${user.email.replace(/[^a-zA-Z0-9]/g, '')}`,
                    name: user.name,
                    email: user.email,
                    role: 'user',
                    createdAt: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                scores: scores,
                answers: answers,
                metadata: {
                    device: navigator.userAgent.indexOf('Mobile') > -1 ? 'Mobile' : 'Desktop',
                    location: 'Online', // Would need GeoIP service for real location
                    completionTimeSeconds: 0, // Tracking not implemented in frontend yet
                }
            };
            
            await addDoc(collection(db, 'submissions'), submissionData);
            return;
        } catch (e) {
            console.error("Firebase Submit Error:", e);
            // Fallthrough to mock save if real db fails
        }
    }

    // 2. MOCK SUBMISSION (Fallback)
    await new Promise(resolve => setTimeout(resolve, 500));
    const newSubmission: Submission = {
        id: `sub_${Date.now()}`,
        userId: `user_${Date.now()}`,
        userProfile: {
            id: `user_${Date.now()}`,
            name: user.name,
            email: user.email,
            role: 'user',
            createdAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        scores: scores,
        answers: answers,
        metadata: {
            device: 'Desktop',
            location: 'Online',
            completionTimeSeconds: 300, 
        }
    };
    MOCK_SUBMISSIONS = [newSubmission, ...MOCK_SUBMISSIONS];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_SUBMISSIONS)); } catch (e) {}
};

export const getPreviousSubmission = async (email: string): Promise<Submission | null> => {
    // 1. REAL FIREBASE FETCH
    if (isConfigured && db) {
        try {
            // Note: To use 'orderBy' with 'where', Firebase often requires a composite index.
            // For simplicity in "Test Mode" without indexes, we fetch by email and sort in memory.
            const q = query(
                collection(db, 'submissions'), 
                where('userProfile.email', '==', email)
            );
            
            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
            
            if (docs.length === 0) return null;
            
            // Sort descending by date
            docs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            // We want the most recent one. 
            // Logic assumption: This is called BEFORE saving the NEW submission, so the "latest" is the previous one.
            return docs[0];
        } catch (e) {
            console.error("Error fetching previous submission:", e);
            return null;
        }
    }

    // 2. MOCK FETCH
    const previous = MOCK_SUBMISSIONS
        .filter(s => s.userProfile.email === email)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
    return previous.length > 0 ? previous[0] : null;
};

export const fetchSubmissions = async (): Promise<Submission[]> => {
    // 1. REAL FIREBASE FETCH
    if (isConfigured && db) {
        try {
            const q = query(collection(db, 'submissions'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Submission));
        } catch (e) {
            console.error("Firebase Fetch Error:", e);
        }
    }

    // 2. MOCK FETCH
    await new Promise(resolve => setTimeout(resolve, 400));
    return MOCK_SUBMISSIONS;
};

export const fetchSubmissionById = async (id: string): Promise<Submission | undefined> => {
    // 1. REAL FIREBASE FETCH
    if (isConfigured && db && !id.startsWith('sub_mock') && !id.startsWith('sub_jon')) {
        try {
            const docRef = doc(db, 'submissions', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Submission;
            }
        } catch (e) {
             console.error("Firebase Fetch ID Error:", e);
        }
    }

    // 2. MOCK FETCH
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_SUBMISSIONS.find(s => s.id === id);
};

export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
    let submissions: Submission[] = [];

    // 1. GET DATA
    if (isConfigured && db) {
        try {
             // In a production app, use aggregation queries or cloud functions
             // For this scale, we just fetch all
             const q = query(collection(db, 'submissions'));
             const querySnapshot = await getDocs(q);
             submissions = querySnapshot.docs.map(d => d.data() as Submission);
        } catch (e) {
             console.error("Firebase Metrics Error:", e);
             submissions = MOCK_SUBMISSIONS;
        }
    } else {
        await new Promise(resolve => setTimeout(resolve, 600));
        submissions = MOCK_SUBMISSIONS;
    }

    if (submissions.length === 0) {
        return {
            totalSubmissions: 0,
            averageScores: { Energy:0, Awareness:0, Love:0, Tribe:0, Career:0, Abundance:0, Fitness:0, Health:0, Adventure:0 },
            completionRate: 0,
            submissionsLast30Days: [],
            questionStats: []
        };
    }

    // 2. AGGREGATE DATA
    const total = submissions.length;
    const sumScores: Scores = {
      Energy: 0, Awareness: 0, Love: 0, Tribe: 0, Career: 0, Abundance: 0, Fitness: 0, Health: 0, Adventure: 0
    };

    submissions.forEach(sub => {
      (Object.keys(sumScores) as Array<keyof Scores>).forEach(key => {
        if (sub.scores && typeof sub.scores[key] === 'number') {
            sumScores[key] += sub.scores[key];
        }
      });
    });

    const avgScores: Scores = { ...sumScores };
    (Object.keys(avgScores) as Array<keyof Scores>).forEach(key => {
      avgScores[key] = parseFloat((avgScores[key] / total).toFixed(1));
    });

    // Trend
    const daysMap = new Map<string, number>();
    submissions.forEach(sub => {
      const dateKey = sub.timestamp.split('T')[0];
      daysMap.set(dateKey, (daysMap.get(dateKey) || 0) + 1);
    });

    const trendData = Array.from(daysMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    // Question Stats
    const questionAggregation: Record<string, { trueCount: number, total: number, category: string }> = {};
    SECTIONS.forEach(section => {
        section.questions.forEach((q) => {
            questionAggregation[q.text] = { trueCount: 0, total: 0, category: section.title };
        });
    });

    submissions.forEach(sub => {
        if (!sub.answers) return;
        SECTIONS.forEach(section => {
            const userAnswers = sub.answers[section.id];
            if (userAnswers) {
                section.questions.forEach((q, idx) => {
                    if (questionAggregation[q.text]) {
                        questionAggregation[q.text].total += 1;
                        if (userAnswers[idx]) {
                            questionAggregation[q.text].trueCount += 1;
                        }
                    }
                });
            }
        });
    });

    const questionStats: QuestionStat[] = Object.entries(questionAggregation).map(([text, stats]) => ({
        questionText: text,
        percentageTrue: stats.total > 0 ? parseFloat(((stats.trueCount / stats.total) * 100).toFixed(1)) : 0,
        category: stats.category
    }));

    return {
        totalSubmissions: total,
        averageScores: avgScores,
        completionRate: 87.5, // Hard to calc without tracking 'starts'
        submissionsLast30Days: trendData,
        questionStats: questionStats
    };
};

export const seedFirestore = async () => {
    if (!isConfigured || !db) {
        alert("Firebase not configured.");
        return;
    }
    // Add demo data
    const demoData = generateHistory(10);
    for (const sub of demoData) {
         // Remove ID so Firestore generates it
         const { id, ...data } = sub;
         await addDoc(collection(db, 'submissions'), data);
    }
    
    // Add Jon Christian
    const jon = MOCK_SUBMISSIONS.find(s => s.id === 'sub_jon_christian_fixed');
    if (jon) {
         const { id, ...data } = jon;
         await addDoc(collection(db, 'submissions'), data);
    }
    
    alert("Database Seeded! Reload page to see changes.");
};

export const downloadCSV = async () => {
    const subs = await fetchSubmissions(); // Will get Real or Mock depending on config
    
    const headers = ['ID', 'Name', 'Email', 'Date', 'Energy', 'Awareness', 'Love', 'Tribe', 'Career', 'Abundance', 'Fitness', 'Health', 'Adventure'];
    const rows = subs.map(s => [
        s.id,
        s.userProfile?.name || 'Unknown',
        s.userProfile?.email || 'Unknown',
        new Date(s.timestamp).toLocaleDateString(),
        s.scores.Energy,
        s.scores.Awareness,
        s.scores.Love,
        s.scores.Tribe,
        s.scores.Career,
        s.scores.Abundance,
        s.scores.Fitness,
        s.scores.Health,
        s.scores.Adventure
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'conscious_performance_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
