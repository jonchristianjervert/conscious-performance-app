import { Scores } from '../types';

// --- EMAIL AUTOMATION SERVICE ---
// Since client-side code cannot securely send emails directly via SMTP,
// the standard practice is to trigger a Webhook (Zapier, Make, or Firebase Cloud Function).

// REPLACE THIS URL with your actual Zapier/Make webhook URL when ready.
// Example: "https://hooks.zapier.com/hooks/catch/123456/abcde/"
const WEBHOOK_URL = ""; 

export const sendSubmissionEmails = async (
  user: { name: string; email: string; dob?: string; occupation?: string }, 
  scores: Scores,
  pdfBlob?: Blob
) => {
    const payload = {
        type: 'NEW_SUBMISSION',
        user: user,
        scores: scores,
        timestamp: new Date().toISOString(),
        // Note: Most webhooks handle JSON data best. Sending the PDF blob directly 
        // usually requires a specific file-upload endpoint, so we send data for the email template.
        dashboardLink: window.location.origin + "/admin", // Link for admin to view
    };

    // 1. SIMULATION (Immediate Feedback)
    console.group("📧 Email Automation Triggered");
    console.log("To User:", `Sending results summary to ${user.email}...`);
    console.log("To Admin:", `Sending lead alert for ${user.name}...`);
    console.log("Payload:", payload);
    console.groupEnd();

    // 2. ACTUAL TRIGGER (If Webhook URL is present)
    if (WEBHOOK_URL) {
        try {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors', // standard for simple webhooks
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            console.log("✅ Webhook trigger sent successfully.");
        } catch (error) {
            console.error("❌ Failed to trigger automation webhook:", error);
        }
    } else {
        // toast/alert simulation
        // In a real app, this is silent, but for development we want to know it happened.
        console.log("⚠️ No Webhook URL configured in services/automation.ts. Email simulation only.");
    }
};
