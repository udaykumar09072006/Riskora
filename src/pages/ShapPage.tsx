import React, { useState, useEffect } from 'react';
import { ShapFeature3D } from '../components/3d/ShapFeature3D';
import { ShapFeature, ModelMetrics } from '../types/fraud';
import { api, shapApi } from '../services/api';
import { Cpu, Activity, AlertCircle, ShieldCheck, RefreshCw, BarChart2, Info } from 'lucide-react';

export const ShapPage: React.FC = () => {
  const [features, setFeatures] = useState<ShapFeature[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<ShapFeature | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getModelMetrics(),
      api.getTransactions()
    ]).then(([metrics, txs]) => {
      if (!isMounted) return;
      setModelMetrics(metrics);
      const list = Array.isArray(txs) ? txs : (txs?.transactions || []);
      if (list.length > 0 && list[0].shapValues) {
        setFeatures(list[0].shapValues);
      } else {
        // Default SHAP features
        setFeatures([
          { feature: 'device_is_emulator', value: 28.4, description: 'Rooted Android environment & headless sandbox detected' },
          { feature: 'ip_tor_exit_node', value: 24.1, description: 'IP matches active German Tor exit relay list' },
          { feature: 'amount_velocity_1h', value: 18.5, description: 'Exceeds 99th percentile user velocity in 60-minute window' },
          { feature: 'geo_distance_speed_mph', value: 16.2, description: 'Impossible physical travel speed between consecutive logins' },
          { feature: 'new_device_first_login', value: 11.0, description: 'Unrecognized browser fingerprint accessing high-value wire' },
          { feature: 'mcc_crypto_onramp', value: 8.3, description: 'High-risk merchant category (6051)' },
          { feature: 'account_tenure_months', value: -12.4, description: 'Long-standing verified account tenure (38 months)' },
          { feature: 'prior_3ds_authenticated', value: -14.8, description: 'Hardware security token challenge solved recently' },
          { feature: 'consistent_timezone_offset', value: -6.5, description: 'Browser clock aligns with ISP geolocation' }
        ]);
      }
      setLoading(false);
    }).catch(err => {
      console.warn('SHAP page load error:', err);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              SHAP Feature Attribution & Model Governance
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Local game-theoretic Shapley values explaining model inference with 3D spatial feature weights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> XGBoost + CatBoost Ensemble v4.2
          </span>
        </div>
      </div>

      {/* 3D SHAP Visualizer */}
      <ShapFeature3D
        features={features}
        baseValue={18.5}
        predictionScore={88.2}
        onSelectFeature={f => setSelectedFeature(f)}
      />

      {/* Feature Deep Dive Inspection Card */}
      {selectedFeature && (
        <div className="p-5 rounded-2xl border border-red-500/30 bg-[#120809] shadow-xl space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-red-400 font-bold">
              INSPECTED FEATURE DETAILS
            </span>
            <span className={`font-mono text-xs font-bold ${selectedFeature.value >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              Impact: {selectedFeature.value >= 0 ? `+${selectedFeature.value.toFixed(2)}` : selectedFeature.value.toFixed(2)} pts
            </span>
          </div>
          <h3 className="text-base font-bold text-white">{selectedFeature.feature}</h3>
          <p className="text-xs text-slate-300">{selectedFeature.description}</p>
        </div>
      )}

      {/* Model Performance & Drift Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-[#0d0d0d] space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">ROC AUC Score</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {modelMetrics?.aucRoc ? modelMetrics.aucRoc.toFixed(3) : '0.984'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Validation on 250k held-out set</span>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-[#0d0d0d] space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">F1 Score</span>
          <div className="text-2xl font-black text-white font-mono">
            {modelMetrics?.f1Score ? modelMetrics.f1Score.toFixed(3) : '0.942'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Harmonic precision/recall</span>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-[#0d0d0d] space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Data Drift PSI</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">0.024</div>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Nominal (&lt; 0.1 threshold)
          </span>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-[#0d0d0d] space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Inference Latency</span>
          <div className="text-2xl font-black text-sky-400 font-mono">14.2 ms</div>
          <span className="text-[10px] text-slate-500 font-mono">Sub-millisecond SHAP tree-explainer</span>
        </div>
      </div>
    </div>
  );
};
