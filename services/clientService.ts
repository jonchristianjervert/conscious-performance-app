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

// UPDATED FUNCTION: Removes orderBy to fix Index Requirement
export const fetchSessionByLeadId = async (leadId: string): Promise<Session | null> => {
  if (!isConfigured || !db) return null;

  try {
    // We query ONLY by leadId to avoid complex Composite Index requirements.
    // If multiple sessions exist, this gets one of them.
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where("leadId", "==", leadId),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log(`[sessions] No session found for leadId=${leadId}`);
      return null;
    }

    const sessionDoc = snapshot.docs[0];
    const data = sessionDoc.data();

    console.log("[sessions] Session loaded:", data);

    return { id: sessionDoc.id, ...data } as Session;
  } catch (e) {
    console.error("Error fetching session by leadId:", e);
    return null;
  }
