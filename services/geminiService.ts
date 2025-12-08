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

export const generateActivationPlan = async (name: string, notes: { challenges: string, goals: string, gap: string }): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "API key missing.";

    const prompt = `
    You are a high-performance coach using the Zerkers Model. You just finished a strategy session with a client named ${name}.
    
    Client Context:
    - Current Struggle: ${notes.challenges}
    - Desired Goal: ${notes.goals}
    - The Gap: ${notes.gap}

    Create a "4-Day Activation Plan" to bridge this gap immediately.
    The goal is NOT to solve everything, but to create momentum.

    Structure the response in JSON format exactly like this:
    {
        "dailyFocus": [
            "Day 1: [Specific Action]",
            "Day 2: [Specific Action]",
            "Day 3: [Specific Action]",
            "Day 4: [Specific Action]"
        ],
        "coreInsight": "One powerful sentence summarizing their bottleneck.",
        "mantra": "A short 5-word affirmation for them."
    }
    
    Do not add markdown formatting like \`\`\`json. Just return the raw JSON object.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("AI Plan Gen Error", error);
        return "{}";
    }
};

export const generateProgramRecommendation = async (submission: Submission): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "API key missing.";

    const prompt = `
    You are the Sales Director for Zerkers, an adventure-based leadership development company.
    Based on the client's assessment data, recommend the SINGLE best program fit.

    CLIENT DATA:
    Name: ${submission.userProfile.name}
    Occupation: ${submission.userProfile.occupation || "Unknown"}
    Scores: ${JSON.stringify(submission.scores)}

    ZERKERS PROGRAM CATALOG:
    1. "Challenge Z.E.R.O." (Online, ~$99/mo)
       - Ideal for: People lacking discipline, focus, or mental toughness. Low scores in Energy/Health/Fitness. Needs a system.
    
    2. "The 5 Challenges" (Online Premium, ~$799/mo)
       - Ideal for: Leaders who want deep mastery but can't travel yet. Needs community + accountability.
    
    3. "1:1 Alignment Accelerator" (Coaching, $3k-$5k/12 weeks)
       - Ideal for: High-performing Founders/Execs who are burned out, misaligned, or "successful but empty." High Career score but low Love/Health/Adventure.
    
    4. "Executive Overlanding Retreat" (In-Person, 3 Days)
       - Ideal for: Stressed executives needing a hard reset in nature. High stress indicators.
    
    5. "Leadership Intensive" (In-Person, 1-2 Days)
       - Ideal for: Managers needing presence, communication skills, and EQ. Low Tribe/Connection scores.

    OUTPUT FORMAT (HTML):
    Provide a specific recommendation in this HTML structure (no markdown):
    <div class="space-y-3">
        <div class="font-bold text-lg text-emerald-400">Recommended: [Program Name]</div>
        <p class="text-sm text-gray-300"><strong>Why:</strong> [One sentence connecting their lowest score to the program benefit].</p>
        <div class="bg-emerald-900/30 p-3 rounded border border-emerald-500/30">
            <p class="text-xs text-emerald-200 font-bold uppercase mb-1">Sales Pivot / Talking Point</p>
            <p class="text-sm italic text-gray-300">"[A direct question or statement the coach can say to transition to this offer]."--</p>
        </div>
    </div>
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        return "Failed to generate recommendation.";
    }
};

// --- NEW: ADVANCED RESEARCH REPORT ---

export const generateAdvancedResearchReport = async (occupation: string, allSubmissions: Submission[]): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "API key missing.";

    // Pre-process data to save tokens and context
    const segment = allSubmissions.filter(s => 
        s.userProfile.occupation && s.userProfile.occupation.toLowerCase().includes(occupation.toLowerCase())
    );

    const segmentData = segment.map(s => ({
        role: s.userProfile.occupation,
        scores: s.scores
    }));

    const globalDataSample = allSubmissions.slice(0, 50).map(s => s.scores); // Sample for global baseline

    const prompt = `
    SYSTEM INSTRUCTION
    You are a research-grade analytical engine responsible for creating comprehensive, academically rigorous administrative reports based on the Conscious Human Performance Assessment dataset. Your output must match the quality of elite institutions such as Harvard Business Review, Stanford GSB, and MIT Sloan.

    CORE OBJECTIVES
    1. Segment Analysis: Analyze the occupation group: "${occupation}".
    2. Trends: Evaluate trends within Consciousness, Connection, Contribution, Commitment, Adventure.
    3. External Research: Integrate findings from HBR, McKinsey, Gallup, etc.
    4. Benchmarking: Compare the Segment vs Global trends.

    DATASET CONTEXT
    Target Segment ("${occupation}") Count: ${segment.length}
    Global Dataset Count: ${allSubmissions.length}
    
    Segment Data Sample (JSON):
    ${JSON.stringify(segmentData.slice(0, 30))} 

    Global Baseline Sample (JSON):
    ${JSON.stringify(globalDataSample)}

    REPORT STRUCTURE REQUIRED (Use Markdown):
    
    # Advanced Research Report: ${occupation} Performance Profile

    ## 1. Executive Summary
    (Ultra-Short 1-Paragraph Summary for high-level executives)

    ## 2. Key Findings & Behavioral Archetypes
    (Identify patterns, strengths, weaknesses. Generate 3 behavioral archetypes for this occupation.)

    ## 3. Comparative Analysis (Segment vs Global)
    (How does this group compare to the average? Use specific score differences.)

    ## 4. Risk & Opportunity Indicators
    (Burnout predictors, misalignment patterns, leadership leverage points.)

    ## 5. Strategic Implications & Recommendations
    (High-impact interventions. "Fastest win" + "Deepest long-term lever".)

    ## 6. Leadership Maturity Score (LMS)
    (Generate a composite score based on Self-Awareness, Regulation, Alignment.)

    Make it data-driven, strategic, and concise.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error(error);
        return "Failed to generate research report.";
    }
};
