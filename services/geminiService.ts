
import { GoogleGenAI } from "@google/genai";
import { Scores, Submission, DashboardMetrics } from "../types";

const getAIClient = () => {
    if (!process.env.API_KEY) {
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getInsightsFromGemini = async (scores: Scores): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "API key not found. Please ensure it is configured in your environment variables.";

  const prompt = `
You are a certified Conscious Human Performance Strategist, based on the model developed by Jon Christian. A user has completed the Conscious Human Performance assessment and received the following scores out of 7:
- Energy: ${scores.Energy}
- Awareness: ${scores.Awareness}
- Love: ${scores.Love}
- Tribe: ${scores.Tribe}
- Career: ${scores.Career}
- Abundance: ${scores.Abundance}
- Fitness: ${scores.Fitness}
- Health: ${scores.Health}
- Adventure: ${scores.Adventure.toFixed(1)}

Based on these scores, please provide personalized, encouraging, and actionable insights.
1.  Start with a positive and empowering summary of their current state.
2.  Identify 1-2 areas with the lowest scores as potential areas for growth.
3.  For each identified area, provide 2-3 specific, practical, and actionable tips for improvement, in the spirit of the Conscious Human Performance model.
4.  Keep the tone positive, non-judgmental, and focused on potential and growth, as mentioned in the assessment's introduction.
5.  Format the response using markdown for readability (e.g., headings, bullet points).
`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching insights from Gemini:", error);
    return "There was an error generating insights. Please try again later.";
  }
};

// --- Admin AI Functions ---

export const generateAdminTrendAnalysis = async (metrics: DashboardMetrics): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "API key missing.";

    // Identify top 3 highest and lowest performing questions
    const sortedQuestions = [...metrics.questionStats].sort((a, b) => b.percentageTrue - a.percentageTrue);
    const top3 = sortedQuestions.slice(0, 3).map(q => `"${q.questionText}" (${q.percentageTrue}% positive)`);
    const bottom3 = sortedQuestions.slice(-3).map(q => `"${q.questionText}" (${q.percentageTrue}% positive)`);

    const prompt = `
    You are an expert Data Analyst for the Conscious Human Performance program.
    Analyze the following aggregate dataset from the last 30 days of assessment submissions:

    Total Submissions: ${metrics.totalSubmissions}
    Average Scores (out of 7):
    ${JSON.stringify(metrics.averageScores, null, 2)}
    
    Specific Question Analytics:
    - Participants are MOST confident in: ${top3.join('; ')}
    - Participants are LEAST confident in: ${bottom3.join('; ')}

    Please provide a high-level executive summary for the program administrators.
    1. Identify the strongest quadrant (Consciousness, Connection, Contribution, or Commitment).
    2. Identify the "Bottleneck" - the area with the lowest average performance.
    3. Provide an insight based on the specific questions people are struggling with (the bottom 3 list). What does this say about the audience?
    4. Suggest 2 strategic initiatives the administrators could run (e.g., a webinar topic, a challenge) to address the bottleneck.

    Keep it professional, concise, and strategic. Use Markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        return "Failed to generate trend analysis.";
    }
};

export const generateIndividualAdminReport = async (submission: Submission): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "API key missing.";

    const prompt = `
    You are an Admin Auditor for the Conscious Human Performance Assessment.
    Review this specific user submission:
    User: ${submission.userProfile.name}
    Scores: ${JSON.stringify(submission.scores)}
    
    Provide a private administrative note on this profile:
    1. Is this user a "High Performer" (mostly 6s and 7s), "Balanced", or "At Risk"?
    2. Highlight one specific score discrepancy (e.g., high Career but low Health) that indicates a potential burnout risk.
    3. Recommended coaching approach: Should the coach push them harder or focus on restoration?
    
    Keep this short and internal-facing.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        return "Failed to generate report.";
    }
};

export const generateWeeklyReportSummary = async (range: string, metrics: DashboardMetrics): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "API key missing.";
    
    const prompt = `
    Generate a formal Monthly Report Summary for the Conscious Human Performance platform.
    Date Range: ${range}
    Total Submissions: ${metrics.totalSubmissions}
    Completion Rate: ${metrics.completionRate}%
    
    Provide 3 bullet points summarizing the key performance indicators for the month.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        return "Failed to generate report summary.";
    }
};