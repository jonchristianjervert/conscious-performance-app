
import React from 'react';
import { LayoutDashboard, Users, Settings, LogOut, Zap, FileText, Database } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  currentTab, 
  onTabChange, 
  onLogout 
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'submissions', label: 'Submissions', icon: Users },
    { id: 'reports', label: 'Reports & Export', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700 flex items-center gap-3">
          <Zap className="text-orange-500 w-6 h-6" />
          <span className="font-bold text-lg tracking-tight text-white">CHP Admin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-gray-700 text-orange-500 font-medium' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Environment Indicator */}
        <div className="px-4 pb-2">
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 flex items-center gap-3">
                <div className="bg-yellow-500/20 p-2 rounded-full">
                    <Database size={14} className="text-yellow-500" />
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Data Source</div>
                    <div className="text-xs text-gray-300 font-medium">Local Browser</div>
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-gray-700">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-900 relative">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;