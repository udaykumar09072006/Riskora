import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Bell, 
  Briefcase, 
  Bot, 
  Share2, 
  BookOpen, 
  Cpu, 
  ThumbsUp, 
  Sliders, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Activity,
  Menu,
  X
} from 'lucide-react';
import { RiskoraLogo } from './RiskoraLogo';

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  alertCount?: number;
  caseCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  setActiveTab,
  alertCount = 0,
  caseCount = 0,
  isMobileOpen = false,
  onCloseMobile = () => {}
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navCategories = [
    {
      category: 'OPERATIONS',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'transactions', label: 'Transactions', icon: Receipt },
        { id: 'alerts', label: 'Fraud Alerts', icon: Bell, count: alertCount, isAlert: true },
        { id: 'cases', label: 'Case Management', icon: Briefcase, count: caseCount }
      ]
    },
    {
      category: 'INTELLIGENCE',
      items: [
        { id: 'investigation', label: 'AI Investigation', icon: Bot },
        { id: 'graph', label: 'Network Graph', icon: Share2 },
        { id: 'shap', label: 'SHAP Analysis', icon: Cpu },
        { id: 'rag', label: 'RAG Knowledge', icon: BookOpen }
      ]
    },
    {
      category: 'ANALYTICS & SOC',
      items: [
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'evaluation', label: 'Model Metrics', icon: Activity },
        { id: 'feedback', label: 'Analyst Feedback', icon: ThumbsUp },
        { id: 'settings', label: 'Rules & Settings', icon: Sliders }
      ]
    }
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-white/10 select-none">
      {/* Top Toggle Header with Logo */}
      <div className={`h-14 flex items-center ${isCollapsed ? 'justify-center px-1' : 'justify-between px-3'} border-b border-white/10`}>
        <RiskoraLogo 
          size="sidebar" 
          collapsed={isCollapsed} 
          onClick={() => handleSelect('overview')}
          subtitle="intelligent risk detection"
        />
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all ${isCollapsed ? 'mt-2' : ''}`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 space-y-5 px-2">
        {navCategories.map(cat => (
          <div key={cat.category} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                {cat.category}
              </div>
            )}
            {cat.items.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'shap' && activeTab === 'evaluation') || (item.id === 'investigation' && activeTab === 'cases' && !cat.items.some(i => i.id === 'cases'));
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                    isActive 
                      ? 'bg-red-600/15 text-white border border-red-500/30 shadow-[0_0_15px_rgba(229,9,20,0.2)]' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-red-500' : 'text-slate-400 group-hover:text-white'
                    }`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.count !== undefined && item.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      item.isAlert 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer System Status */}
      {!isCollapsed && (
        <div className="p-3 border-t border-white/10 text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>HEURISTICS OK</span>
          </div>
          <span className="text-[10px] text-slate-600">v3.4.0</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:block transition-all duration-300 z-30 shrink-0 ${isCollapsed ? 'w-16' : 'w-60'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 flex">
          <div className="w-64 h-full">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
};
