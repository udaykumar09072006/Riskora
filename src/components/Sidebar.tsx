import React from 'react';
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
  ShieldCheck,
  MessageSquare,
  Headphones
} from 'lucide-react';
import { RiskoraLogo } from './RiskoraLogo';

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  alertCount?: number;
  caseCount?: number;
  activeAlertsCount?: number;
  openCasesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const selectedTab = props.activeTab || props.currentTab || 'overview';
  const handleSelect = props.setActiveTab || props.onSelectTab || (() => {});
  const alertsCount = props.alertCount ?? props.activeAlertsCount ?? 0;
  const casesCount = props.caseCount ?? props.openCasesCount ?? 0;

  const navItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard, category: 'OPERATIONS' },
    { id: 'transactions', label: 'Live Transactions', icon: Receipt, category: 'OPERATIONS' },
    { id: 'alerts', label: 'Fraud Alerts', icon: Bell, count: alertsCount, countColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30', category: 'OPERATIONS' },
    { id: 'cases', label: 'Case Management', icon: Briefcase, count: casesCount, countColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30', category: 'OPERATIONS' },
    
    { id: 'investigation', label: 'Agent Investigation', icon: Bot, category: 'INTELLIGENCE' },
    { id: 'chat', label: 'Gemini Chatbot', icon: MessageSquare, category: 'INTELLIGENCE' },
    { id: 'voice', label: 'Voice Conversations', icon: Headphones, category: 'INTELLIGENCE' },
    { id: 'graph', label: 'Syndicate Graph', icon: Share2, category: 'INTELLIGENCE' },
    { id: 'rag', label: 'RAG Knowledge Base', icon: BookOpen, category: 'INTELLIGENCE' },

    { id: 'evaluation', label: 'Model Evaluation', icon: Cpu, category: 'GOVERNANCE' },
    { id: 'feedback', label: 'Analyst Feedback', icon: ThumbsUp, category: 'GOVERNANCE' },
    { id: 'settings', label: 'Rules & Settings', icon: Sliders, category: 'GOVERNANCE' },
  ];

  const categories = ['OPERATIONS', 'INTELLIGENCE', 'GOVERNANCE'];

  return (
    <aside 
      id="riskora-sidebar" 
      className="w-64 border-r border-slate-800 bg-[#0B0F19] flex flex-col shrink-0 min-h-screen p-3 select-none"
    >
      {/* Sidebar Logo Header */}
      <div className="px-2 py-2 mb-3 pb-3 border-b border-slate-800/80 flex items-center justify-between">
        <RiskoraLogo 
          size="sidebar" 
          onClick={() => handleSelect('overview')} 
          subtitle="intelligent risk detection"
        />
      </div>

      <div className="space-y-6 flex-1">
        {categories.map(cat => {
          const items = navItems.filter(item => item.category === cat);
          return (
            <div key={cat} className="space-y-1">
              <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                {cat}
              </div>
              {items.map(item => {
                const Icon = item.icon;
                const isActive = selectedTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${item.countColor}`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer System Health card */}
      <div className="pt-4 border-t border-slate-800/80 mt-auto">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Engine Status</span>
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">ALL GREEN</span>
          </div>
          <p className="text-slate-400 text-[10px] leading-relaxed">
            TreeSHAP + RAG Hybrid + 8-Agent Orchestrator operational.
          </p>
        </div>
      </div>
    </aside>
  );
};
