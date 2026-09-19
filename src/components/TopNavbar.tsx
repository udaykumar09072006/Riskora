import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Radio, 
  PlusCircle, 
  Sliders, 
  Layers, 
  BarChart3, 
  Network, 
  BookOpen, 
  Cpu, 
  Activity, 
  X,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { RiskoraLogo } from './RiskoraLogo';
import { FraudAlert, UserProfile } from '../types/fraud';

interface TopNavbarProps {
  activeTab: string;
  onNavigate: (tab: string, id?: string) => void;
  activeAlertsCount?: number;
  alerts?: FraudAlert[];
  currentUser?: UserProfile | null;
  onOpenIngestModal?: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  isSimulating?: boolean;
  onToggleSimulation?: () => void;
  onGlobalSearch?: (query: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  onNavigate,
  activeAlertsCount = 0,
  alerts = [],
  currentUser,
  onOpenIngestModal = () => {},
  onOpenAuthModal = () => {},
  onLogout = () => {},
  isSimulating = true,
  onToggleSimulation = () => {},
  onGlobalSearch = (_query?: string) => {}
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setIsAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Global keyboard shortcut Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsAlertsOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { id: 'overview', label: 'Dashboard' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'investigation', label: 'Investigations' },
    { id: 'graph', label: 'Network Graph' },
    { id: 'shap', label: 'SHAP Analysis' },
    { id: 'rag', label: 'RAG Knowledge' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onGlobalSearch(searchQuery.trim());
      setIsSearchOpen(false);
      onNavigate('transactions');
    }
  };

  return (
    <>
      <header 
        id="riskora-top-navbar"
        className="sticky top-0 z-40 h-16 w-full border-b border-white/10 bg-[#080808]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between transition-all"
      >
        {/* Left: Brand Logo & Main Nav Tabs */}
        <div className="flex items-center gap-6">
          {/* Riskora Logo */}
          <RiskoraLogo 
            size="header" 
            onClick={() => onNavigate('overview')} 
            subtitle="intelligent risk detection"
          />

          {/* Desktop Horizontal Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 text-xs">
            {navLinks.map(link => {
              const isActive = activeTab === link.id || (link.id === 'shap' && activeTab === 'evaluation') || (link.id === 'investigation' && activeTab === 'cases');
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    isActive 
                      ? 'text-white bg-white/10 border-b-2 border-red-600 shadow-xs' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center: Live Simulator Toggle */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onToggleSimulation}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              isSimulating 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
            title="Toggle Live Stream Simulator"
          >
            <Radio className={`h-3.5 w-3.5 ${isSimulating ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{isSimulating ? 'STREAM: LIVE' : 'STREAM: PAUSED'}</span>
          </button>
        </div>

        {/* Right: Global Search, Quick Ingest, Notifications, Profile */}
        <div className="flex items-center gap-2.5">
          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs transition-all cursor-pointer"
            title="Global Search (Ctrl+K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search entities...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[9px] font-mono text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Quick Ingest Button */}
          <button
            onClick={onOpenIngestModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(229,9,20,0.3)] transition-all cursor-pointer active:scale-98"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Ingest</span>
          </button>

          {/* Notification Indicator & Drawer */}
          <div ref={alertsRef} className="relative">
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Notifications & Alerts"
            >
              <Bell className="h-4 w-4" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md animate-pulse">
                  {activeAlertsCount > 99 ? '99+' : activeAlertsCount}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Drawer */}
            {isAlertsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-white/15 bg-[#101010] shadow-2xl p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Active Fraud Alerts</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono text-[10px] font-bold">
                      {activeAlertsCount} Active
                    </span>
                  </div>
                  <button
                    onClick={() => { setIsAlertsOpen(false); onNavigate('alerts'); }}
                    className="text-[11px] text-red-400 hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No active critical alerts. System nominal.
                    </div>
                  ) : (
                    alerts.slice(0, 5).map(alert => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          setIsAlertsOpen(false);
                          if (alert.caseId) onNavigate('investigation', alert.caseId);
                          else onNavigate('alerts');
                        }}
                        className="p-2.5 rounded-lg border border-white/10 bg-white/5 hover:border-red-500/40 hover:bg-white/10 cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white truncate max-w-[180px]">
                            {alert.title || alert.type}
                          </span>
                          <span className="font-mono text-red-400 font-bold text-[10px]">
                            {alert.riskScore}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {alert.description || 'Elevated anomaly signature flagged by multi-agent filter.'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Logout Dropdown */}
          <div ref={profileRef} className="relative">
            {currentUser ? (
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                <div className="h-6 w-6 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xs font-bold">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="hidden md:inline text-xs font-medium text-slate-200 truncate max-w-[110px]">
                  {currentUser.name}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Profile Dropdown Menu */}
            {isProfileOpen && currentUser && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/15 bg-[#121212] shadow-2xl p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="pb-3 border-b border-white/10 mb-2">
                  <div className="font-bold text-white text-sm">{currentUser.name}</div>
                  <div className="text-slate-400 text-[11px]">{currentUser.email}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono text-[9px] font-bold">
                      {currentUser.role}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {currentUser.organization || 'Riskora SOC'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => { setIsProfileOpen(false); onNavigate('settings'); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left"
                  >
                    <Sliders className="h-3.5 w-3.5 text-slate-400" />
                    <span>SOC Rules & Preferences</span>
                  </button>

                  <button
                    onClick={() => { setIsProfileOpen(false); onNavigate('reports'); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left"
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Reports & Analytics</span>
                  </button>

                  <button
                    onClick={() => { setIsProfileOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-left font-medium mt-1 border-t border-white/10 pt-2"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#121212] shadow-2xl overflow-hidden">
            <form onSubmit={handleSearchSubmit} className="flex items-center p-4 border-b border-white/10 gap-3">
              <Search className="h-5 w-5 text-red-500 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search transactions, IP addresses, devices, cards, or typologies..."
                className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </form>

            <div className="p-4 text-xs text-slate-400 space-y-2">
              <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Suggested Searches</div>
              <div className="flex flex-wrap gap-2">
                {['TX-2026-9921', 'IP 185.220.101', 'Card Testing Botnet', 'Tor Exit Node', 'Wire Transfer > $10k'].map(term => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchQuery(term);
                      onGlobalSearch(term);
                      setIsSearchOpen(false);
                      onNavigate('transactions');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
