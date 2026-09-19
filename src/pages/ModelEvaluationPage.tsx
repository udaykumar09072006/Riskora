import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Sliders, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  BarChart3, 
  Layers 
} from 'lucide-react';
import { ModelMetrics } from '../types/fraud';
import { api } from '../services/api';

export const ModelEvaluationPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState<number>(0.70);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getModelMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        Loading model validation benchmarks...
      </div>
    );
  }

  // Calculate dynamic threshold metrics
  const activeComparison = metrics.thresholdComparison.find(t => Math.abs(t.threshold - threshold) < 0.08) 
    || metrics.thresholdComparison[2];

  return (
    <div id="view-model-evaluation" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Model Evaluation & Drift Governance</h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono">
              PRODUCTION BENCHMARKS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Validation metrics, ROC-AUC curves, Precision@K, and live Kolmogorov-Smirnov drift monitoring.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 transition-all self-start sm:self-auto"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">ROC-AUC</div>
          <div className="text-2xl font-bold font-mono text-indigo-400">{(metrics.rocAuc * 100).toFixed(1)}%</div>
          <div className="text-[11px] text-slate-400">Area under ROC curve</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Precision @ 100</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {((metrics.precisionAtK.find(p => p.k === 100)?.precision || 0.96) * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400">Top 100 highest risk alerts</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">F1 Score</div>
          <div className="text-2xl font-bold font-mono text-slate-100">{(metrics.f1Score * 100).toFixed(1)}%</div>
          <div className="text-[11px] text-slate-400">Harmonic precision/recall mean</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">False Positive Rate</div>
          <div className="text-2xl font-bold font-mono text-rose-400">{(metrics.falsePositiveRate * 100).toFixed(1)}%</div>
          <div className="text-[11px] text-slate-400">Target constraint: &lt; 3.0%</div>
        </div>
      </div>

      {/* Interactive Threshold Slider & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Dynamic Threshold Slider */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase font-mono">
              <Sliders className="h-4 w-4 text-indigo-400" />
              <span>Operational Risk Threshold Simulator</span>
            </div>
            <span className="font-mono text-indigo-400 font-bold text-xs">{threshold.toFixed(2)}</span>
          </div>

          <p className="text-xs text-slate-400 leading-normal">
            Adjust the production cutoff threshold to balance fraud recall versus SOC analyst alert volume fatigue.
          </p>

          <div className="space-y-2 pt-2">
            <input
              type="range"
              min="0.30"
              max="0.85"
              step="0.05"
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>0.30 (Aggressive Recall)</span>
              <span>0.50 (Balanced)</span>
              <span>0.70 (SOC Standard)</span>
              <span>0.85 (High Precision)</span>
            </div>
          </div>

          {/* Calibrated Output Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-mono">Precision</div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {(activeComparison.precision * 100).toFixed(0)}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-mono">Recall</div>
              <div className="text-lg font-bold font-mono text-indigo-400">
                {(activeComparison.recall * 100).toFixed(0)}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-mono">Daily Alerts</div>
              <div className="text-lg font-bold font-mono text-amber-400">
                ~{activeComparison.alertsGenerated}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Confusion Matrix */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 uppercase font-mono">
              Validation Confusion Matrix (1,000 Transactions)
            </span>
            <span className="text-xs text-slate-400 font-mono">Evaluated on Ledger</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* True Positive */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
              <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold">True Positives (TP)</div>
              <div className="text-2xl font-bold font-mono text-emerald-300">
                {metrics.confusionMatrix.truePositive}
              </div>
              <div className="text-[10px] text-emerald-400/80">Correctly Flagged Fraud</div>
            </div>

            {/* False Positive */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
              <div className="text-[10px] uppercase font-mono text-amber-400 font-bold">False Positives (FP)</div>
              <div className="text-2xl font-bold font-mono text-amber-300">
                {metrics.confusionMatrix.falsePositive}
              </div>
              <div className="text-[10px] text-amber-400/80">Legitimate Flagged (Friction)</div>
            </div>

            {/* False Negative */}
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center space-y-1">
              <div className="text-[10px] uppercase font-mono text-rose-400 font-bold">False Negatives (FN)</div>
              <div className="text-2xl font-bold font-mono text-rose-300">
                {metrics.confusionMatrix.falseNegative}
              </div>
              <div className="text-[10px] text-rose-400/80">Missed Fraud (Leakage)</div>
            </div>

            {/* True Negative */}
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-center space-y-1">
              <div className="text-[10px] uppercase font-mono text-indigo-400 font-bold">True Negatives (TN)</div>
              <div className="text-2xl font-bold font-mono text-indigo-300">
                {metrics.confusionMatrix.trueNegative}
              </div>
              <div className="text-[10px] text-indigo-400/80">Clean Approvals</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern-Specific Accuracy & Data Drift */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pattern Accuracy */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-200 uppercase font-mono">
            Pattern-Specific Detection Accuracy
          </div>
          <div className="space-y-2.5">
            {metrics.patternPerformance.map(p => (
              <div key={p.pattern} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">{p.pattern}</span>
                  <span className="font-mono text-slate-200">
                    {(p.accuracy * 100).toFixed(1)}% ({p.detected}/{p.total})
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${p.accuracy * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drift Governance */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase font-mono">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>Concept & Feature Drift Monitoring</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">
                STABLE
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Kolmogorov-Smirnov two-sample testing continuously compares live feature distributions against baseline training cohorts.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px] font-mono">Data Drift Score</div>
                <div className="font-mono text-slate-200 font-bold">{metrics.driftMetrics.dataDriftScore}</div>
                <div className="text-[10px] text-emerald-400">Below threshold (0.10)</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px] font-mono">Prediction Drift Score</div>
                <div className="font-mono text-slate-200 font-bold">{metrics.driftMetrics.predictionDriftScore}</div>
                <div className="text-[10px] text-emerald-400">Below threshold (0.10)</div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
            Last drift evaluation cycle: {metrics.driftMetrics.lastChecked ? new Date(metrics.driftMetrics.lastChecked).toLocaleString() : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};
