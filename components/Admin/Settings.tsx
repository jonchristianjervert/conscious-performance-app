
import React, { useState, useEffect } from 'react';
import { Section } from '../../types';
import { getQuestions, saveQuestions, resetQuestionsToDefault } from '../../services/questionService';
import { Settings as SettingsIcon, Shield, Database, Save, RotateCcw, Check, AlertTriangle } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('questions');
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    const data = await getQuestions();
    setSections(data);
    setLoading(false);
  };

  const handleQuestionChange = (sectionIndex: number, questionIndex: number, newText: string) => {
    const updated = [...sections];
    updated[sectionIndex].questions[questionIndex].text = newText;
    setSections(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await saveQuestions(sections);
      setSuccessMsg("Questions updated successfully! Changes are live.");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg("Failed to save changes. Check connection.");
      console.error(err);
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if(!window.confirm("Are you sure? This will revert all questions to the original template.")) return;
    setSaving(true);
    try {
      const defaults = await resetQuestionsToDefault();
      setSections(defaults);
      setSuccessMsg("Questions reset to default.");
    } catch (err) {
      setErrorMsg("Failed to reset.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <header className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-white">System Settings</h1>
                <p className="text-gray-400 mt-1">Manage assessment configuration and administrative access.</p>
            </div>
            {successMsg && (
                <div className="bg-green-900/30 text-green-400 px-4 py-2 rounded-lg border border-green-500/30 flex items-center gap-2 animate-fade-in">
                    <Check size={16} /> {successMsg}
                </div>
            )}
             {errorMsg && (
                <div className="bg-red-900/30 text-red-400 px-4 py-2 rounded-lg border border-red-500/30 flex items-center gap-2 animate-fade-in">
                    <AlertTriangle size={16} /> {errorMsg}
                </div>
            )}
        </header>

        <div className="flex gap-6 border-b border-gray-700">
            <button 
                onClick={() => setActiveTab('questions')}
                className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'questions' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}
            >
                Assessment Questions
            </button>
            <button 
                onClick={() => setActiveTab('admins')}
                className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'admins' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}
            >
                Admin Users
            </button>
            <button 
                 onClick={() => setActiveTab('data')}
                 className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'data' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}
            >
                Data Management
            </button>
        </div>

        {activeTab === 'questions' && (
            <div className="space-y-6">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
                    <p className="text-sm text-gray-400">Edit the text below and click save to update the live assessment.</p>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleReset}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm border border-transparent hover:border-red-900/30"
                        >
                            <RotateCcw size={16} /> Reset Default
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-orange-900/20"
                        >
                            {saving ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : <Save size={18} />}
                            Save Changes
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-gray-500 py-12">Loading Questions configuration...</div>
                ) : (
                    <div className="space-y-8">
                        {sections.map((section, sIdx) => (
                            <div key={section.id} className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
                                <div className="p-4 bg-gray-900/50 border-b border-gray-700/50 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-white font-bold">{section.title}</h3>
                                        <span className="text-xs text-gray-500 uppercase">{section.category}</span>
                                    </div>
                                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">{section.questions.length} Items</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    {section.questions.map((q, qIdx) => (
                                        <div key={qIdx} className="flex gap-4 items-start">
                                            <span className="mt-3 text-xs text-gray-500 font-mono w-6">{qIdx + 1}.</span>
                                            <textarea 
                                                value={q.text}
                                                onChange={(e) => handleQuestionChange(sIdx, qIdx, e.target.value)}
                                                className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all resize-none"
                                                rows={2}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'admins' && (
             <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center py-16">
                <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Access Control</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                    Role-based access control management is restricted to the Master Administrator account. 
                    Please contact support to add new admin users.
                </p>
             </div>
        )}

        {activeTab === 'data' && (
             <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center py-16">
                <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Database Maintenance</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                   Perform manual backups or clear test submission data.
                </p>
                <button className="bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-900/50 px-4 py-2 rounded font-medium text-sm transition-colors">
                    Clear All Test Data
                </button>
             </div>
        )}
    </div>
  );
};

export default Settings;
