import { db, isConfigured } from './firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { Lead } from '../types';

const LEADS_COLLECTION = 'leads';

// Create a new Lead (Public)
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
    console.log("Mock Lead Created (No DB Connection):", leadData);
    return `mock_lead_${Date.now()}`;
  }
};

// Fetch all Leads (Admin Only)
export const fetchLeads = async (): Promise<Lead[]> => {
  if (!isConfigured || !db) return []; // Return empty if no DB

  try {
    const q = query(collection(db, LEADS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
  } catch (e) {
    console.error("Error fetching leads:", e);
    return [];
  }
};

// Update Lead Status (Admin Only)
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

// Mark as Booked (Public - triggered by calendar embed)
export const markLeadAsBooked = async (leadId: string) => {
  if (isConfigured && db && !leadId.startsWith('mock_')) {
    await updateLeadStatus(leadId, 'booked');
  }
};
