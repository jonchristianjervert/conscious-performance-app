
import { db, isConfigured } from './firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Lead } from '../types';

const LEADS_COLLECTION = 'leads';

// This function saves the initial lead data from the Micro-Qualify form.
// In the future, a Firebase Cloud Function can trigger onCreate to sync this with HubSpot/GHL.
export const createLead = async (data: Omit<Lead, 'id' | 'createdAt' | 'status'>): Promise<string> => {
  const timestamp = new Date().toISOString();
  
  // Basic Auto-Qualification Logic
  // You can make this more complex later (e.g., keyword detection in their answers)
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
    // Fallback for demo/local mode
    console.log("Mock Lead Created:", leadData);
    return `mock_lead_${Date.now()}`;
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
