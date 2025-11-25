
import { db, isConfigured } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SECTIONS } from '../constants';
import { Section } from '../types';

const CONFIG_COLLECTION = 'app_config';
const CONFIG_DOC = 'assessment_questions';

export const getQuestions = async (): Promise<Section[]> => {
  // If no DB, fall back to constants
  if (!isConfigured || !db) return SECTIONS;

  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.sections && Array.isArray(data.sections)) {
        return data.sections as Section[];
      }
    }
  } catch (error) {
    console.error("Error fetching custom questions:", error);
  }
  
  // Return default constants if no custom config exists or error occurs
  return SECTIONS;
};

export const saveQuestions = async (sections: Section[]): Promise<void> => {
  if (!isConfigured || !db) throw new Error("Database not connected. configure VITE_FIREBASE_API_KEY.");
  await setDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC), { 
    sections,
    updatedAt: new Date().toISOString()
  });
};

export const resetQuestionsToDefault = async (): Promise<Section[]> => {
   if (!isConfigured || !db) throw new Error("Database not connected.");
   // Overwrite with default SECTIONS
   await setDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC), { 
    sections: SECTIONS,
    updatedAt: new Date().toISOString()
  });
  return SECTIONS;
}
