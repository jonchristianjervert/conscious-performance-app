
import React, { useEffect, useState } from 'react';
import { fetchLeads, updateLeadStatus } from '../../services/clientService';
import { Lead } from '../../types';
import { MoreHorizontal, Phone, CheckCircle, XCircle, Calendar } from 'lucide-react';

const Pipeline: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    const data = await fetchLeads();
    setLeads(data);
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: Lead['status']) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    await updateLeadStatus(id, newStatus);
  };

  const columns: { id: Lead['status']; label: string; color: string }[] = [
    { id: 'new', label: 'New Leads', color: 'border-blue-500' },
    { id: 'qualified', label: 'Qualified', color: 'border-orange-500' },
    { id: 'booked', label: 'Call Booked', color: 'border-green-500' },
    { id: 'disqualified', label: 'Not a Fit', color: 'border-red-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Coach Pipeline</h1>
        <button onClick={loadLeads} className="text-sm text-gray-400 hover:text-white">Refresh</button>
      </div>

      <div className="flex-1 overflow-x-auto flex gap-6 pb-4">
        {columns.map(col => (
          <div key={col.id} className="w-80 flex-shrink-0 flex flex-col bg-gray-900/50 rounded-xl border border-gray-800">
            <div className={`p-4 border-b border-gray-800 flex justify-between items-center border-t-4 ${col.color} rounded-t-xl bg-gray-800`}>
              <h3 className="font-bold text-white">{col.label}</h3>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                {leads.filter(l => (l.status || 'new') === col.id).length}
              </span>
            </div>
            
            <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="text-center text-gray-600 text-sm py-4">Loading...</div>
              ) : leads.filter(l => (l.status || 'new') === col.id).length === 0 ? (
                <div className="text-center text-gray-600 text-sm py-8 border-2 border-dashed border-gray-800 rounded-lg">No leads</div>
              ) : (
                leads.filter(l => (l.status || 'new') === col.id).map(lead => (
                  <div key={lead.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-lg group hover:border-gray-500 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white">{lead.name}</h4>
                      <span className="text-[10px] text-gray-500">{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3 italic">"{lead.responses?.motivation}"</p>
                    
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <Phone size={12} /> {lead.phone}
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-700 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                       {col.id !== 'booked' && (
                         <button onClick={() => handleStatusChange(lead.id, 'booked')} title="Mark Booked" className="p-1 hover:bg-green-500/20 hover:text-green-400 rounded"><Calendar size={16}/></button>
                       )}
                       {col.id !== 'disqualified' && (
                         <button onClick={() => handleStatusChange(lead.id, 'disqualified')} title="Disqualify" className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded"><XCircle size={16}/></button>
                       )}
                       {col.id === 'disqualified' && (
                         <button onClick={() => handleStatusChange(lead.id, 'new')} title="Restore" className="p-1 hover:bg-blue-500/20 hover:text-blue-400 rounded"><MoreHorizontal size={16}/></button>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pipeline;
