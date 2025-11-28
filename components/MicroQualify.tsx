
import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle, Calendar, MessageSquare, Lock } from 'lucide-react';
import { createLead, markLeadAsBooked } from '../services/clientService';

// REPLACE THIS with your actual Booking URL (GHL or Google Calendar Appointment Page)
const BOOKING_URL = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3wEmWe9fD1zfp1GR_yMqJrqmZrCO_tkm4ieXYD_Rv0HQx1P5JBscI-cQe3Mv3Ifyf3xNQuGlXR?gv=true"; 

interface MicroQualifyProps {
  onComplete: () => void; 
  onAdminLogin: () => void; 
}

const MicroQualify: React.FC<MicroQualifyProps> = ({ onComplete, onAdminLogin }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    motivation: '', 
    struggle: '',   
    intent: ''      
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const id = await createLead({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        responses: {
          motivation: formData.motivation,
          struggle: formData.struggle,
          intent: formData.intent
        }
      });
      setLeadId(id);
      setStep(4); // Move to Booking
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualBookingConfirmation = async () => {
    if (leadId) {
        await markLeadAsBooked(leadId);
        // Optional: Add visual feedback or auto-advance
        alert("Booking Confirmed! We look forward to speaking with you.");
        onComplete(); // Move to assessment or welcome
    } else {
        onComplete();
    }
  };

  // --- RENDER STEPS ---

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        {/* COACH LOGIN BUTTON (Top Right) */}
        <div className="absolute top-6 right-6 z-50">
            <button 
                onClick={onAdminLogin}
                className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-transparent hover:border-white/10 hover:bg-white/5 transition-all"
            >
                <Lock size={12} /> Coach Login
            </button>
        </div>

        {/* Background FX */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 w-full max-w-2xl relative z-10 animate-fade-in">
           <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30">
              <MessageSquare className="text-blue-400" size={32} />
           </div>
           
           <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Let's see if we're a match.</h2>
           <p className="text-gray-400 text-lg mb-8">Before we dive deep, I want to make sure I can actually help you with where you're at.</p>
           
           <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">What made you want to explore this right now?</label>
                <textarea 
                  className="input-field text-lg h-32 resize-none" 
                  placeholder="I'm feeling stuck in..."
                  value={formData.motivation}
                  onChange={(e) => setFormData({...formData, motivation: e.target.value})}
                />
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={handleNext}
                  disabled={!formData.motivation}
                  className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
         
         <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 w-full max-w-2xl relative z-10 animate-fade-in">
           <div className="w-full bg-gray-800 h-1 mb-8 rounded-full overflow-hidden">
             <div className="h-full bg-purple-500 w-1/2 transition-all duration-500"></div>
           </div>
           
           <h2 className="text-3xl font-bold text-white mb-6">The Bottleneck</h2>
           
           <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">What feels most off or unsustainable currently?</label>
                <textarea 
                  className="input-field text-lg h-32 resize-none" 
                  placeholder="My energy is drained by..."
                  value={formData.struggle}
                  onChange={(e) => setFormData({...formData, struggle: e.target.value})}
                />
              </div>
              <div className="flex justify-between items-center">
                 <button onClick={() => setStep(1)} className="text-gray-500 hover:text-white transition-colors">Back</button>
                 <button 
                    onClick={handleNext}
                    disabled={!formData.struggle}
                    className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    Next <ArrowRight size={18} />
                  </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>
         
         <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 w-full max-w-2xl relative z-10 animate-fade-in">
           <div className="w-full bg-gray-800 h-1 mb-8 rounded-full overflow-hidden">
             <div className="h-full bg-orange-500 w-full transition-all duration-500"></div>
           </div>
           
           <h2 className="text-3xl font-bold text-white mb-2">Final Details</h2>
           <p className="text-gray-400 mb-8">Where should we send your next steps?</p>
           
           <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Are you looking for clarity, support, or both?</label>
                <select 
                    className="input-field text-lg"
                    value={formData.intent}
                    onChange={(e) => setFormData({...formData, intent: e.target.value})}
                >
                    <option value="">Select an option...</option>
                    <option value="Clarity">I just need Clarity right now.</option>
                    <option value="Support">I'm ready for Support/Coaching.</option>
                    <option value="Both">Both - I want the full roadmap.</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Your Name</label>
                    <input 
                      type="text" required
                      className="input-field" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Phone (Optional)</label>
                    <input 
                      type="tel" 
                      className="input-field" 
                      placeholder="(555) 555-5555"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email Address</label>
                <input 
                    type="email" required
                    className="input-field" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                 <button type="button" onClick={() => setStep(2)} className="text-gray-500 hover:text-white transition-colors">Back</button>
                 <button 
                    type="submit"
                    disabled={loading || !formData.intent || !formData.name || !formData.email}
                    className="bg-orange-600 hover:bg-orange-500 text-white px-10 py-4 rounded-full font-bold transition-all shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Analyzing...' : 'See Next Step'}
                    {!loading && <Sparkles size={18} />}
                  </button>
              </div>
           </form>
        </div>
      </div>
    );
  }

  // STEP 4: BOOKING / SUCCESS
  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-20 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-green-900/20 to-black pointer-events-none"></div>

        <div className="w-full max-w-4xl relative z-10 animate-fade-in text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full text-green-400 font-bold uppercase text-xs tracking-widest mb-6">
                <CheckCircle size={14} /> Qualified for Strategy Session
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6">Let's Build Your Roadmap.</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                Based on what you shared, the next step is a <strong>15-minute Connection Call</strong>.
                This is strictly to see if working together makes sense — no pressure either way.
            </p>

            <div className="glass-panel p-2 rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-white h-[600px] md:h-[700px] relative">
                {/* Placeholder for GHL / Calendar Embed */}
                {/* Replace src with your actual booking URL */}
                <iframe 
                    src={BOOKING_URL} 
                    width="100%" 
                    height="100%" 
                    frameBorder="0"
                    // REMOVED onLoad here to prevent premature status change
                ></iframe>
                
                {/* Fallback if no URL is set */}
                {(!BOOKING_URL || BOOKING_URL.includes("google.com/calendar/appointments")) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-8">
                        <Calendar size={64} className="text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Calendar Integration Pending</h3>
                        <p className="text-gray-400 max-w-md text-center mb-6">
                            The booking system is currently being configured. <br/>
                            We have received your application and will contact you at <strong>{formData.email}</strong> shortly.
                        </p>
                        <button onClick={onComplete} className="text-orange-500 hover:text-white underline">
                            Return to Home
                        </button>
                    </div>
                )}
            </div>
            
            <div className="mt-8 flex justify-center gap-4 items-center">
                <button 
                    onClick={handleManualBookingConfirmation}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-green-900/20 transition-all hover:scale-105 flex items-center gap-2"
                >
                    <CheckCircle size={18} /> I have booked my time
                </button>
                <button onClick={onComplete} className="text-gray-500 hover:text-white text-sm underline">
                    Skip for now
                </button>
            </div>
        </div>
    </div>
  );
};

export default MicroQualify;
