import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  MapPin, 
  Smartphone, 
  CreditCard, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Transaction, RiskScoreBreakdown } from '../types/fraud';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { ShapWaterfall } from '../components/ShapWaterfall';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onOpenInvestigation: (caseId: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onOpenInvestigation
}) => {
  if (!transaction) return null;

  const [scoring, setScoring] = useState<RiskScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScoring = async () => {
      setLoading(true);
      try {
        const res = await api.getTransactionById(transaction.id);
        setScoring(res.scoringBreakdown);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchScoring();
  }, [transaction.id]);

  const handleLaunchInvestigation = async () => {
    try {
      const newCase = await api.createCase({
        title: `Investigation - ${transaction.merchant} ($${transaction.amount.toFixed(2)})`,
        primaryTransaction: transaction,
        priority: transaction.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH'
      });
      onClose();
      onOpenInvestigation(newCase.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        id="modal-transaction-detail"
        className="w-full max-w-4xl bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-100 font-mono">{transaction.id}</h2>
                <RiskBadge level={transaction.riskLevel} score={transaction.riskScore} size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                Transaction initiated at {transaction.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'Recent'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLaunchInvestigation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-xs shadow-indigo-900/30 transition-all"
            >
              <span>Escalate to Case</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Attributes Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Transaction Amount</div>
              <div className="text-lg font-bold font-mono text-slate-100">${transaction.amount.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400">{transaction.currency} • {transaction.transactionType}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Merchant & MCC</div>
              <div className="font-semibold text-slate-200 truncate">{transaction.merchant}</div>
              <div className="text-[10px] font-mono text-indigo-400">{transaction.merchantCategory}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Customer Profile</div>
              <div className="font-semibold text-slate-200 truncate">{transaction.customerName}</div>
              <div className="text-[10px] font-mono text-slate-400">{transaction.customerId}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Payment Instrument</div>
              <div className="font-semibold text-slate-200 font-mono">•••• {transaction.cardLast4}</div>
              <div className="text-[10px] text-slate-400">{transaction.paymentMethod}</div>
            </div>
          </div>

          {/* Device & Location Telemetry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Device */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-medium">
                <Smartphone className="h-4 w-4 text-indigo-400" />
                <span>Hardware & Device Fingerprint</span>
              </div>
              <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Device ID:</span>
                  <span>{transaction.device.deviceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">OS / Platform:</span>
                  <span>{transaction.device.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Browser:</span>
                  <span>{transaction.device.browser}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Device Status:</span>
                  <span className={transaction.device.isNewDevice ? 'text-amber-400' : 'text-emerald-400'}>
                    {transaction.device.isNewDevice ? 'First Observed Session' : 'Recognized Hardware'}
                  </span>
                </div>
              </div>
            </div>

            {/* Location & Network */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-medium">
                <MapPin className="h-4 w-4 text-indigo-400" />
                <span>Geo Location & Network Telemetry</span>
              </div>
              <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">IP Address:</span>
                  <span>{transaction.location.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Origin City:</span>
                  <span>{transaction.location.city}, {transaction.location.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coordinates:</span>
                  <span>{transaction.location.lat.toFixed(4)}, {transaction.location.lon.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Proxy Status:</span>
                  <span className={transaction.location.vpnDetected ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {transaction.location.vpnDetected ? 'VPN / TOR ANONYMIZER DETECTED' : 'Direct ISP Gateway'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Triggered Rule Anomalies */}
          {scoring && scoring.triggeredRules.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase font-mono">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Deterministic Rule Engine Flags ({scoring.triggeredRules.length})</span>
                </div>
                <span className="text-xs text-slate-400">Rule Score: {scoring.ruleScore}/100</span>
              </div>

              <div className="space-y-2">
                {scoring.triggeredRules.map(r => (
                  <div 
                    key={r.ruleId} 
                    className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-rose-300 font-mono">{r.ruleId}: {r.ruleName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {r.severity} (+{r.weightScore} pts)
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{r.evidence}</p>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 pt-0.5">
                      <span>Expected: {r.expectedValue}</span>
                      <span>•</span>
                      <span>Observed: {r.actualValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SHAP Waterfall Explainability */}
          {scoring && (
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
              <ShapWaterfall 
                shapFactors={scoring.shapFactors} 
                baseScore={18.5} 
                finalScore={scoring.overallScore} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
