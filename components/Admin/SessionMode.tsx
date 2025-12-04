import React, { useState, useEffect } from 'react';
import { Lead, ActivationPlan } from '../../types';
import { ArrowLeft, Save, Sparkles, CheckCircle, FileText, Database } from 'lucide-react';
import { generateActivationPlan } from '../../services/geminiService';
import { saveSession, fetchSessionByLeadId } from '../../services/clientService';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore helpers
import { db } from '../../services/firebase';     // Import DB

interface SessionModeProps {
  lead: Lead;
  onBack: () => void;
}

const SessionMode: React.FC<SessionModeProps> = ({ lead: initialLead, onBack }) => {
  const [lead, setLead] = useState<Lead>(initialLead); // Local state for lead
  
  const [notes, setNotes] = useState({
    challenges: '',
    goals: '',
    gap: '',
  });
  
  const [agreements, setAgreements] = useState({
    permissionToCoach: false,
    commitmentToChange: false,
    financialReady: false,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<ActivationPlan | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // 1. Ensure we have the full lead data (Fix for "Unknown" issue)
  useEffect(() => {
    const fetchFullLead = async () => {
        // If the passed lead is missing data (like name is 'Unknown' or responses are missing), fetch it.
        if (initialLead.id && initialLead.id !== 'err' && (!initialLead.responses || initialLead.name === 'Unknown')) {
            console.log("Lead data incomplete. Fetching full details for:", initialLead.id);
            try {
                const docRef = doc(db, 'leads', initialLead.id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setLead({ id: docSnap.id, ...docSnap.data() } as Lead);
                }
            } catch (e) {
                console.error("Error fetching full lead details:", e);
            }
        } else {
            setLead(initialLead);
        }
    };
    fetchFullLead();
  }, [initialLead]);

  // 2. Load existing session data (Fix for "Data Not Loading")
  useEffect(() => {
    const loadSession = async () => {
        if (lead.id && lead.id !== 'err') {
            console.log("Loading session history for lead:", lead.id);
            const existingSession = await fetchSessionByLeadId(lead.id);
            
            if (existingSession) {
                console.log("Found existing session:", existingSession);
                
                // Populate state
                setNotes(prev => ({
                    challenges: existingSession.notes.challenges || lead.responses?.struggle || '',
                    goals: existingSession.notes.goals || '',
                    gap: existingSession.notes.gap || ''
                }));
                
                if (existingSession.agreements) setAgreements(existingSession.agreements);
                if (existingSession.activationPlan) setPlan(existingSession.activationPlan);
                
                setIsSaved(true);
                setDataLoaded(true);
            } else
