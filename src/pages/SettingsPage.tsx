import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  Radio, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Lock, 
  Zap 
} from 'lucide-react';
import { api } from '../services/api';

const FALLBACK_RULE_CONFIG = {
  maxVelocityPerHour: 5,
  maxVelocityPerDay: 15,
  extremeAmountThreshold: 5000,
  amountMultiplierThreshold: 3.5,
  maxTransactionsPerMinute: 4,
  largeTransactionMultiplier: 3.5,
  impossibleTravelSpeedKmh: 900,
  sharedDeviceThreshold: 3,
  cardTestingMaxAmount: 3.00,
  highRiskMccScoresThreshold: 70,
  highRiskCategories: ['CRYPTO', 'GAMBLING', 'REMITTANCE', 'LUXURY_JEWELRY']
};

export const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<any>(FALLBACK_RULE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const cfg = await api.getRuleConfig();
      if (cfg && typeof cfg === 'object') {
        setConfig({ ...FALLBACK_RULE_CONFIG, ...cfg });
      } else {
        setConfig(FALLBACK_RULE_CONFIG);
      }
      const health = await api.getHealth();
      setIsSimulating(health.kafka?.isSimulating ?? true);
    } catch (e) {
      console.error(e);
      setConfig(FALLBACK_RULE_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      await api.updateRuleConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStream = async () => {
    try {
      const status = await api.toggleSimulation();
      setIsSimulating(status.isSimulating);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !config) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        Loading rule engine configuration...
      </div>
    );
  }

  return (
    <div id="view-settings" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Rule Engine & Platform Settings</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-mono">
              DYNAMIC POLICIES
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time threshold adjustments for velocity limits, geo-travel constraints, and ingestion pipelines.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all self-start sm:self-auto"
        >
          <Save className="h-4 w-4" />
          <span>{saved ? 'Settings Saved!' : 'Save Rule Configuration'}</span>
        </button>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Rule engine updated successfully. New thresholds applied to all incoming transactions.</span>
        </div>
      )}

      {/* Grid of Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity & Threshold Rules */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase font-mono">
            <Sliders className="h-4 w-4 text-indigo-400" />
            <span>Velocity & Outlier Thresholds</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Max Transactions per Hour (Rule-001)</span>
                <span className="font-mono text-indigo-400">{config?.maxVelocityPerHour ?? 5} tx/hr</span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                value={config?.maxVelocityPerHour ?? 5}
                onChange={e => setConfig({ ...config, maxVelocityPerHour: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Max Transactions per 24 Hours (Rule-010)</span>
                <span className="font-mono text-indigo-400">{config?.maxVelocityPerDay ?? 15} tx/day</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={config?.maxVelocityPerDay ?? 15}
                onChange={e => setConfig({ ...config, maxVelocityPerDay: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Extreme Dollar Amount Threshold ($ USD)</span>
                <span className="font-mono text-indigo-400">${(config?.extremeAmountThreshold ?? 5000).toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={config?.extremeAmountThreshold ?? 5000}
                onChange={e => setConfig({ ...config, extremeAmountThreshold: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Historical Baseline Variance Ratio</span>
                <span className="font-mono text-indigo-400">{config?.amountMultiplierThreshold ?? 3.5}x user mean</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="8.0"
                step="0.5"
                value={config?.amountMultiplierThreshold ?? 3.5}
                onChange={e => setConfig({ ...config, amountMultiplierThreshold: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Location, Device & Network */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase font-mono">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span>Hardware & Geo-Velocity Constraints</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Max Theoretical Travel Speed (Rule-005)</span>
                <span className="font-mono text-indigo-400">{config?.impossibleTravelSpeedKmh ?? 900} km/h</span>
              </div>
              <input
                type="range"
                min="400"
                max="1200"
                step="50"
                value={config?.impossibleTravelSpeedKmh ?? 900}
                onChange={e => setConfig({ ...config, impossibleTravelSpeedKmh: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Shared Device Syndicate Limit (Rule-008)</span>
                <span className="font-mono text-indigo-400">{config?.sharedDeviceThreshold ?? 3} distinct cards</span>
              </div>
              <input
                type="range"
                min="2"
                max="8"
                value={config?.sharedDeviceThreshold ?? 3}
                onChange={e => setConfig({ ...config, sharedDeviceThreshold: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Card Testing Micro-probe Threshold ($)</span>
                <span className="font-mono text-indigo-400">${(config?.cardTestingMaxAmount ?? 3.00).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="5.00"
                step="0.25"
                value={config?.cardTestingMaxAmount ?? 3.00}
                onChange={e => setConfig({ ...config, cardTestingMaxAmount: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Streaming Adapter & RBAC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stream Ingestion Adapter */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase font-mono">
              <Radio className="h-4 w-4 text-emerald-400" />
              <span>Kafka / Stream Adapter Status</span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {isSimulating ? 'SIMULATOR RUNNING' : 'STREAM IDLE'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-normal">
            FraudShield AI includes a native high-throughput streaming consumer capable of ingesting simulated transactions or binding directly to external Apache Kafka clusters.
          </p>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Kafka Topic:</span>
              <span className="text-slate-200">fraudshield.transactions.incoming</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Consumer Group:</span>
              <span className="text-slate-200">fraudshield-scoring-consumer</span>
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={handleToggleStream}
              className={`w-full py-2 rounded-lg border text-xs font-medium transition-all ${
                isSimulating 
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/20' 
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              {isSimulating ? 'Pause Stream Ingestion' : 'Resume Stream Ingestion'}
            </button>
          </div>
        </div>

        {/* RBAC Security & Analyst Permissions */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase font-mono">
            <Lock className="h-4 w-4 text-indigo-400" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>

          <p className="text-xs text-slate-400 leading-normal">
            Platform roles enforce separation of duties pursuant to SOC 2 Type II and regulatory compliance.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">L1 Triage Analyst</div>
                <div className="text-[10px] text-slate-400">Alert monitoring and initial case opening</div>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 font-bold">READ & TRIAGE</span>
            </div>

            <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">L2 Senior SOC Analyst (Active)</div>
                <div className="text-[10px] text-slate-400">Full 8-agent case investigation and human adjudication</div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">FULL ADJUDICATION</span>
            </div>

            <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Chief Compliance Officer</div>
                <div className="text-[10px] text-slate-400">SAR filing, audit trails, and model governance</div>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-bold">AUDIT & GOVERNANCE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
