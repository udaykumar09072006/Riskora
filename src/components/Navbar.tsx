import React from 'react';
import { 
  Activity, 
  PlusCircle, 
  Bell, 
  Radio, 
  UserCheck 
} from 'lucide-react';
import { RiskoraLogo } from './RiskoraLogo';

interface NavbarProps {
  activeAlertsCount?: number;
  onOpenIngestModal?: () => void;
  onNavigate?: (page: string) => void;
  isSimulating?: boolean;
  onToggleSimulation?: () => void;
  onOpenAuthModal?: () => void;
  currentUser?: { name: string; title?: string; role?: string } | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeAlertsCount = 0,
  onOpenIngestModal = () => {},
  onNavigate = (_page: string) => {},
  isSimulating = true,
  onToggleSimulation = () => {},
  onOpenAuthModal = () => {},
  currentUser = null
}) => {
  const handleNav = (target: string) => {
    if (typeof onNavigate === 'function') {
      onNavigate(target);
    }
  };

  return (
    <header 
      id="riskora-navbar" 
      className="h-16 border-b border-slate-800 bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between"
    >
      {/* Brand & System Title */}
      <div className="flex items-center gap-3">
        <RiskoraLogo 
          size="header" 
          onClick={() => handleNav('overview')} 
          subtitle="intelligent risk detection"
        />
      </div>

      {/* Center Operational Status */}
      <div className="hidden md:flex items-center gap-3 text-xs">
        {/* Stream Status Toggle */}
        <button
          id="btn-stream-toggle"
          onClick={onToggleSimulation}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all ${
            isSimulating 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20' 
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
          }`}
          title="Toggle Kafka / Ingestion Simulator"
        >
          <Radio className={`h-3.5 w-3.5 ${isSimulating ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="font-mono text-[11px]">
            {isSimulating ? 'KAFKA SIMULATOR: LIVE' : 'STREAM: PAUSED'}
          </span>
        </button>

        {/* Throughput Metric */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
          <Activity className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-slate-400 text-[11px]">Throughput:</span>
          <span className="font-mono font-medium text-slate-200">18.4 TPS</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Alert Trigger button */}
        <button
          id="btn-nav-alerts"
          onClick={() => handleNav('alerts')}
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800 transition-colors"
          title="View Active Fraud Alerts"
        >
          <Bell className="h-4 w-4" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
              {activeAlertsCount > 99 ? '99+' : activeAlertsCount}
            </span>
          )}
        </button>

        {/* Quick Ingest / Simulate Attack */}
        <button
          id="btn-quick-ingest"
          onClick={onOpenIngestModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-xs shadow-indigo-900/40 transition-all active:scale-98"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Ingest / Simulate</span>
        </button>

        {/* Analyst Identity Pill / Auth trigger */}
        <button
          onClick={onOpenAuthModal}
          className="hidden sm:flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-lg border border-slate-800/80 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700 transition-all text-xs cursor-pointer group"
          title="SOC User Profile / Sign In"
        >
          <div className="h-7 w-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
            <UserCheck className="h-3.5 w-3.5" />
          </div>
          <div className="text-left">
            <div className="text-slate-200 font-medium leading-none group-hover:text-white">
              {currentUser ? currentUser.name : 'Jane Doe'}
            </div>
            <span className="text-[10px] text-cyan-400/90 leading-none">
              {currentUser?.title || 'L2 Senior Analyst'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
