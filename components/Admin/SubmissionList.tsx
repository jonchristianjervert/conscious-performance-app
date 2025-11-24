
import React, { useEffect, useState } from 'react';
import { Search, Filter, ChevronRight, Download, Trash2 } from 'lucide-react';
import { fetchSubmissions, downloadCSV, deleteSubmission } from '../../services/mockData';
import { Submission } from '../../types';

interface SubmissionListProps {
  onSelectSubmission: (id: string) => void;
}

const SubmissionList: React.FC<SubmissionListProps> = ({ onSelectSubmission }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions().then(data => {
      setSubmissions(data);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening the detail view
    if (window.confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
      await deleteSubmission(id);
      // Remove from UI immediately
      setSubmissions(prev => prev.filter(s => s.id !== id));
    }
  };

  const filtered = submissions.filter(s => 
    s.userProfile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.userProfile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreBadgeColor = (score: number) => {
    if (score >= 6) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 4) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Submissions</h1>
        <button 
          onClick={downloadCSV}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg border border-gray-700 transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:border-orange-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600">
          <Filter size={18} />
          <span>Filter</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">User</th>
                <th className="p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Date</th>
                <th className="p-4 text-gray-400 font-medium text-sm uppercase tracking-wider text-center">Adv. Score</th>
                <th className="p-4 text-gray-400 font-medium text-sm uppercase tracking-wider text-center">Avg Score</th>
                <th className="p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Device</th>
                <th className="p-4 text-gray-400 font-medium text-sm uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No submissions found.</td></tr>
              ) : (
                filtered.map((sub) => {
                    const avg = (Object.values(sub.scores) as number[]).reduce((a,b) => a+b, 0) / 9;
                    return (
                        <tr key={sub.id} className="hover:bg-gray-700/50 transition-colors group cursor-pointer" onClick={() => onSelectSubmission(sub.id)}>
                        <td className="p-4">
                            <div className="font-medium text-white">{sub.userProfile.name}</div>
                            <div className="text-sm text-gray-500">{sub.userProfile.email}</div>
                        </td>
                        <td className="p-4 text-gray-400 text-sm">
                            {new Date(sub.timestamp).toLocaleDateString()}
                            <div className="text-xs text-gray-600">{new Date(sub.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="p-4 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold border ${getScoreBadgeColor(sub.scores.Adventure)}`}>
                            {sub.scores.Adventure.toFixed(1)}
                            </span>
                        </td>
                        <td className="p-4 text-center text-gray-300 font-medium">
                            {avg.toFixed(1)}
                        </td>
                        <td className="p-4 text-gray-400 text-sm">
                            {sub.metadata.device}
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-3">
                            <button 
                                onClick={(e) => handleDelete(e, sub.id)}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete Record"
                            >
                                <Trash2 size={18} />
                            </button>
                            <ChevronRight className="inline-block text-gray-600 group-hover:text-orange-500 transition-colors" />
                        </td>
                        </tr>
                    )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-right text-xs text-gray-500">
        Showing {filtered.length} results
      </div>
    </div>
  );
};

export default SubmissionList;
