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
    <div className="flex h-screen bg-[#030305] overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0a0a0a]/80 backdrop-blur-2xl border-r border-white/5 flex flex-col relative z-20">
        <div className="p-8 border-b border-white/5 flex items-center gap-3">
          <div className="bg-orange-600/20 p-2 rounded-lg border border-orange-600/30">
             <Zap className="text-orange-500 w-6 h-6" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-white block">CHP Admin</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Control Center</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-orange-600 text-white font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)] transform translate-x-1' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Environment Indicator */}
        <div className="px-6 pb-4">
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-green-500/20 p-2 rounded-full border border-green-500/20 relative">
                    <Database size={16} className="text-green-500" />
                    <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">System Status</div>
                    <div className="text-xs text-gray-300 font-bold">Live Database</div>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/10 hover:text-red-300 rounded-xl transition-colors border border-transparent hover:border-red-900/20"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative z-10 custom-scrollbar">
        {/* Header Gradient Overlay */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-orange-900/10 to-transparent pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto p-10 relative">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;