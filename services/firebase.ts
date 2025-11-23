
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// SECURITY UPDATE: API Key is now loaded from Environment Variables
// to satisfy GitHub Secret Scanning.
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "conscious-human-performance.firebaseapp.com",
  projectId: "conscious-human-performance",
  storageBucket: "conscious-human-performance.firebasestorage.app",
  messagingSenderId: "833740671940",
  appId: "1:833740671940:web:404635f85fef547e4c7291",
  measurementId: "G-98N6HKZ6QW"
};

let app;
let db;
let analytics;
let auth;

// Check if keys are populated
const isConfigured = !!apiKey && apiKey !== "YOUR_API_KEY_HERE";

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    analytics = getAnalytics(app);
    auth = getAuth(app);
    console.log("🔥 Firebase connected successfully.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.log("⚠️ Firebase not configured. Missing VITE_FIREBASE_API_KEY.");
}

export { db, isConfigured, analytics, auth };
