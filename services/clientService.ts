import { db, isConfigured } from './firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { Lead, Session } from '../types';

const LEADS_COLLECTION = 'leads';
const SESSIONS_COLLECTION = 'sessions';

// --- LEADS ---

export const createLead = async (data: Omit<Lead, 'id' | 'createdAt' | 'status'>): Promise<string> => {
  const timestamp = new Date().toISOString();
  const leadData: Omit<Lead, 'id'> = {
    ...data,
    status: 'qualified',
    createdAt: timestamp,
  };

  if (isConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, LEADS_COLLECTION), leadData);
      return docRef.id;
    } catch (e) {
      console.error("Error creating lead:", e);
      throw e;
    }
  } else {
    return `mock_lead_${Date.now()}`;
  }
};

export const fetchLeads = async (): Promise<Lead[]> => {
  if (!isConfigured || !db) return []; 

  try {
    const q = query(collection(db, LEADS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
  } catch (e) {
    console.error("Error fetching leads:", e);
    return [];
  }
};

export const updateLeadStatus = async (leadId: string, status: Lead['status']) => {
  if (isConfigured && db) {
    try {
      const docRef = doc(db, LEADS_COLLECTION, leadId);
      await updateDoc(docRef, { status });
    } catch (e) {
      console.error("Error updating lead status:", e);
    }
  }
};

export const markLeadAsBooked = async (leadId: string) => {
  if (isConfigured && db && !leadId.startsWith('mock_')) {
    try {
      const docRef = doc(db, LEADS_COLLECTION, leadId);
      await updateDoc(docRef, { status: 'booked' });
    } catch (e) {
      console.error("Error marking lead booked:", e);
    }
  }
};

// --- SESSIONS (Coach Mode) ---

export const saveSession = async (sessionData: Omit<Session, 'id'>): Promise<string> => {
    if (isConfigured && db) {
        try {
            const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), sessionData);
            return docRef.id;
        } catch (e) {
            console.error("Error saving session:", e);
            throw e;
        }
    } else {
        return "mock_session_id";
    }
};

export const fetchSessionByLeadId = async (leadId: string): Promise<Session | null> => {
    if (!isConfigured || !db) return null;

    try {
        console.log("Fetching session for Lead ID:", leadId);
        
        // SIMPLE QUERY: No orderBy, No limit. Just get matches.
        // This avoids "Missing Index" errors.
        const q = query(
            collection(db, SESSIONS_COLLECTION),
            where('leadId', '==', leadId)
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            console.log("No previous sessions found.");
            return null;
        }

        // Sort in Javascript (Client-side) to find the most recent
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
        docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        console.log("Session Loaded:", docs[0]);
        return docs[0];

    } catch (e) {
        console.error("Error fetching session:", e);
        return null;
    }
};
