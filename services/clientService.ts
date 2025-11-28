
import { db, isConfigured } from './firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { Lead, Session } from '../types';

const LEADS_COLLECTION = 'leads';
const SESSIONS_COLLECTION = 'sessions';

// This function saves the initial lead data from the Micro-Qualify form.
export const createLead = async (data: Omit<Lead, 'id' | 'createdAt' | 'status'>): Promise<string> => {
  const timestamp = new Date().toISOString();
  // Basic qualification logic (can be expanded)
  const isQualified = true; 

  const leadData: Omit<Lead, 'id'> = {
    ...data,
    status: isQualified ? 'qualified' : 'disqualified',
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
    console.log("Mock Lead Created:", leadData);
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
      console.error("Error updating lead status:", e);
    }
  }
};

// --- PHASE 3: SESSIONS ---

export const saveSession = async (sessionData: Omit<Session, 'id'>): Promise<string> => {
    if (isConfigured && db) {
        try {
            // Save as a new document (Snapshot history)
            const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), sessionData);
            return docRef.id;
        } catch (e) {
            console.error("Error saving session:", e);
            throw e;
        }
    } else {
        console.log("Mock Session Saved:", sessionData);
        return "mock_session_id";
    }
};

export const fetchSessionByLeadId = async (leadId: string): Promise<Session | null> => {
    if (!isConfigured || !db) return null;

    try {
        const q = query(
            collection(db, SESSIONS_COLLECTION),
            where('leadId', '==', leadId),
            orderBy('date', 'desc'),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Session;
        }
        return null;
    } catch (e: any) {
        console.error("Error fetching session:", e);
        if (e.code === 'failed-precondition') {
            console.warn("MISSING INDEX: You need to create a composite index for 'sessions' (leadId ASC, date DESC) in Firebase Console.");
        }
        return null;
    }
};
