import React from 'react';
import { FraudGlobe3D } from './3d/FraudGlobe3D';
import { RiskoraLogo } from './RiskoraLogo';
import { ShieldAlert, Play, PlusCircle, Network, Flame, Zap, ArrowUpRight } from 'lucide-react';

interface NetflixHeroProps {
  threatLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  onLaunchInvestigation?: () => void;
  onOpenIngest?: () => void;
  onOpenGraph?: () => void;
  onOpenReports?: () => void;
  blockedAmount?: number;
  activeSyndicatesCount?: number;
  flaggedTransactionsCount?: number;
}

export const NetflixHero: React.FC<NetflixHeroProps> = ({
  threatLevel = 'HIGH',
  onLaunchInvestigation = () => {},
  onOpenIngest = () => {},
  onOpenGraph = () => {},
  onOpenReports = () => {},
  blockedAmount = 142850,
  activeSyndicatesCount = 3,
  flaggedTransactionsCount = 38
}) => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-radial from-[#18090a] via-[#0d0d0d] to-[#080808] p-6 sm:p-8 lg:p-10 shadow-2xl">
      {/* Cinematic Red Glow Gradient in background */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-red-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 -translate-y-1/2 w-96 h-96 rounded-full bg-red-600/10 blur-[140px] pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Headline & Actions */}
        <div className="lg:col-span-7 space-y-5">
          {/* Status Indicator Pill with Logo */}
          <div className="flex flex-wrap items-center gap-3">
            <RiskoraLogo size="header" subtitle="intelligent risk detection" />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-wider text-red-300 uppercase">
                DEFCON 2 • 8-AGENT AI SOC ACTIVE
              </span>
            </div>
          </div>

          {/* Main Title */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              Autonomous Risk Defense & Syndicate Radar
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Real-time multi-agent orchestration, SHAP explainability, and graph clustering intercepting high-velocity card testing and account takeover syndicates in sub-15ms.
            </p>
          </div>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-3 gap-3 max-w-lg pt-1">
            <div className="p-3 rounded-xl bg-black/50 border border-white/10 backdrop-blur-xs">
              <div className="text-[10px] font-mono uppercase text-slate-400">Blocked Fraud</div>
              <div className="text-xl font-bold font-mono text-red-400 mt-0.5">
                ${(blockedAmount / 1000).toFixed(1)}k
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/50 border border-white/10 backdrop-blur-xs">
              <div className="text-[10px] font-mono uppercase text-slate-400">Active Syndicates</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                {activeSyndicatesCount} Rings
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/50 border border-white/10 backdrop-blur-xs">
              <div className="text-[10px] font-mono uppercase text-slate-400">AI Latency</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1">
                <Zap className="h-4 w-4 text-emerald-400" /> 14 ms
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onLaunchInvestigation}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(229,9,20,0.4)] hover:shadow-[0_0_35px_rgba(229,9,20,0.6)] transition-all active:scale-98 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-white" />
              Launch Agent Investigation
            </button>

            <button
              onClick={onOpenIngest}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/15 backdrop-blur-md transition-all active:scale-98 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4 text-red-400" />
              Ingest & Simulate Attack
            </button>

            <button
              onClick={onOpenGraph}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white font-medium text-xs sm:text-sm border border-white/10 transition-all cursor-pointer"
            >
              <Network className="h-4 w-4 text-sky-400" />
              Syndicate Graph
            </button>
          </div>
        </div>

        {/* Right 3D Threat Globe */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-full aspect-square max-w-[380px] flex items-center justify-center">
            <FraudGlobe3D
              threatLevel={threatLevel}
              className="w-full h-full"
              interactive={true}
            />
            {/* Globe Telemetry Overlay Badge */}
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md border border-white/15 rounded-lg px-3 py-1.5 text-[10px] font-mono text-slate-300 pointer-events-none flex items-center gap-2 shadow-lg">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>{flaggedTransactionsCount} Threat Beacons Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
