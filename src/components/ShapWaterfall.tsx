import React from 'react';
import { ShapFactor } from '../types/fraud';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface ShapWaterfallProps {
  shapFactors: ShapFactor[];
  baseScore?: number;
  finalScore?: number;
}

export const ShapWaterfall: React.FC<ShapWaterfallProps> = ({
  shapFactors,
  baseScore = 18.5,
  finalScore
}) => {
  const sortedFactors = [...shapFactors].sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));

  return (
    <div id="shap-waterfall-panel" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase font-mono">
            SHAP Feature Attributions (TreeSHAP)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Local Explainability
          </span>
        </div>
        <div className="text-right text-xs text-slate-400">
          Population Base: <span className="font-mono text-slate-300 font-medium">{baseScore.toFixed(1)} pts</span>
        </div>
      </div>

      {/* Horizontal Bar Waterfall */}
      <div className="space-y-2.5">
        {sortedFactors.map((factor, idx) => {
          const isPositive = factor.shapValue > 0;
          const absVal = Math.abs(factor.shapValue);
          const maxVal = Math.max(...sortedFactors.map(f => Math.abs(f.shapValue)), 30);
          const barWidthPercent = Math.min(100, Math.max(8, (absVal / maxVal) * 100));

          return (
            <div 
              key={idx} 
              className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <span className="flex items-center gap-1 font-medium text-rose-400">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      +{factor.shapValue.toFixed(1)} pts
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-medium text-emerald-400">
                      <ArrowDownRight className="h-3.5 w-3.5" />
                      {factor.shapValue.toFixed(1)} pts
                    </span>
                  )}
                  <span className="font-mono text-slate-300 font-medium">
                    {factor.featureName}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {factor.featureValue}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPositive 
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{factor.impactDescription}</span>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-medium">
                  {factor.category}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/15 flex items-start gap-2.5 text-xs text-indigo-300/90 leading-relaxed">
        <Info className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
        <div>
          SHAP values represent additive feature contributions toward the final fraud probability log-odds. Factors in red pushed the risk assessment higher; factors in green stabilized or reduced suspicion.
        </div>
      </div>
    </div>
  );
};
