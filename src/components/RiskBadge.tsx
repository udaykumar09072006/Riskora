import React from 'react';
import { RiskLevel } from '../types/fraud';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ 
  level, 
  score, 
  size = 'md', 
  showScore = true 
}) => {
  let badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let dotColor = 'bg-emerald-400';

  if (level === 'CRITICAL') {
    badgeStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-xs shadow-rose-950/40';
    dotColor = 'bg-rose-500 animate-pulse';
  } else if (level === 'HIGH') {
    badgeStyle = 'bg-amber-500/15 text-amber-400 border-amber-500/35';
    dotColor = 'bg-amber-400';
  } else if (level === 'MEDIUM') {
    badgeStyle = 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
    dotColor = 'bg-yellow-400';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs font-medium gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-semibold gap-2'
  }[size];

  return (
    <span 
      id={`risk-badge-${level.toLowerCase()}`}
      className={`inline-flex items-center rounded-full border tracking-wide whitespace-nowrap select-none ${sizeClasses} ${badgeStyle}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      <span>{level}</span>
      {showScore && typeof score === 'number' && (
        <span className="opacity-75 font-mono text-[11px]">({score})</span>
      )}
    </span>
  );
};
