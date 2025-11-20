
import React, { useState } from 'react';
import { SECTIONS } from '../../constants';
import { Settings as SettingsIcon, Shield, Database, ToggleLeft, ToggleRight } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('questions');
  // Mock state for toggling questions
  const [disabledQuestions, setDisabledQuestions] = useState<string[]>([]);

  const toggleQuestion = (text: string) => {
    if (disabledQuestions.includes(text)) {
      setDisabledQuestions(prev => prev.filter(t => t !== text));
    } else {
      setDisabledQuestions(prev => [...prev, text]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <header>
            <h1 className="text-3xl font-bold text-white">System Settings</h1>
            <p className="text-gray-400 mt-1">Manage assessment configuration and administrative access.</p>
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
            <div className="space-y-8">
                {SECTIONS.map((section) => (
                    <div key={section.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-white font-bold">{section.title}</h3>
                                <span className="text-xs text-gray-500 uppercase">{section.category}</span>
                            </div>
                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">{section.questions.length} Questions</span>
                        </div>
                        <div className="divide-y divide-gray-700">
                            {section.questions.map((q, i) => {
                                const isDisabled = disabledQuestions.includes(q.text);
                                return (
                                    <div key={i} className="p-4 flex items-start gap-4 hover:bg-gray-700/20 transition-colors">
                                        <div className="flex-1 text-sm text-gray-300">{q.text}</div>
                                        <button 
                                            onClick={() => toggleQuestion(q.text)}
                                            className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold border transition-colors ${
                                                isDisabled 
                                                ? 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/30' 
                                                : 'bg-green-900/20 text-green-400 border-green-900/50 hover:bg-green-900/30'
                                            }`}
                                        >
                                            {isDisabled ? 'Inactive' : 'Active'}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
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