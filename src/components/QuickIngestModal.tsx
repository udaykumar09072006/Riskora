import React, { useState } from 'react';
import { X, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { Transaction, RiskScoreBreakdown } from '../types/fraud';
import { api } from '../services/api';
import { RiskBadge } from './RiskBadge';

interface QuickIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionIngested?: (tx: Transaction, scoring: RiskScoreBreakdown) => void;
  onTransactionCreated?: (tx: Transaction) => void;
  onOpenInvestigation?: (caseId: string) => void;
}

export const QuickIngestModal: React.FC<QuickIngestModalProps> = ({
  isOpen,
  onClose,
  onTransactionIngested,
  onTransactionCreated,
  onOpenInvestigation
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ tx: Transaction; scoring: RiskScoreBreakdown } | null>(null);

  // Form states for custom
  const [amount, setAmount] = useState('1250.00');
  const [merchant, setMerchant] = useState('Kraken Crypto Exchange');
  const [merchantCategory, setMerchantCategory] = useState('CRYPTO');
  const [customerId, setCustomerId] = useState('CUST-8819');
  const [customerName, setCustomerName] = useState('Elena Rostova');
  const [city, setCity] = useState('Frankfurt');
  const [vpnDetected, setVpnDetected] = useState(true);
  const [isNewDevice, setIsNewDevice] = useState(true);
  const [deviceId, setDeviceId] = useState('DEV-RING-779');

  const presets = [
    {
      name: 'Velocity Burst Attack',
      desc: 'Rapid high-dollar withdrawals from cryptocurrency merchant via unrecognised proxy.',
      data: {
        amount: 4850.00,
        merchant: 'Binance OTC Gateway',
        merchantCategory: 'CRYPTO',
        customerId: 'CUST-VEL-99',
        customerName: 'Marcus Vance',
        city: 'Singapore',
        vpnDetected: true,
        isNewDevice: true,
        deviceId: 'DEV-VEL-01'
      }
    },
    {
      name: 'Card-Testing Microprobe',
      desc: 'Repeated micro-transactions under $2.00 to probe stolen PAN validity.',
      data: {
        amount: 1.45,
        merchant: 'Steam Digital Games',
        merchantCategory: 'DIGITAL_GOODS',
        customerId: 'CUST-PROBE-12',
        customerName: 'Anonymous Buyer',
        city: 'Bucharest',
        vpnDetected: true,
        isNewDevice: true,
        deviceId: 'DEV-BOTNET-33'
      }
    },
    {
      name: 'Impossible Geo-Travel',
      desc: 'Transaction originating 6,000 km away only 14 minutes after previous domestic charge.',
      data: {
        amount: 2980.00,
        merchant: 'Rolex Boutique Dubai',
        merchantCategory: 'LUXURY_GOODS',
        customerId: 'CUST-TRAV-81',
        customerName: 'Sarah Jenkins',
        city: 'Dubai',
        vpnDetected: false,
        isNewDevice: true,
        deviceId: 'DEV-POS-DUBAI'
      }
    },
    {
      name: 'Shared Hardware Syndicate Ring',
      desc: 'Device ID previously observed across 8 distinct cardholders within 48 hours.',
      data: {
        amount: 1750.00,
        merchant: 'Apple Store Online',
        merchantCategory: 'ELECTRONICS',
        customerId: 'CUST-RING-04',
        customerName: 'Dmitri Volkov',
        city: 'Miami',
        vpnDetected: false,
        isNewDevice: false,
        deviceId: 'DEV-RING-779'
      }
    },
    {
      name: 'Normal Verified Consumer (VIP)',
      desc: 'Established customer, domestic location, trusted hardware device, low risk.',
      data: {
        amount: 124.50,
        merchant: 'Whole Foods Market',
        merchantCategory: 'GROCERY',
        customerId: 'CUST-NORM-01',
        customerName: 'Alice Walker',
        city: 'Seattle',
        vpnDetected: false,
        isNewDevice: false,
        deviceId: 'DEV-TRUSTED-APPLE'
      }
    }
  ];

  const handleIngest = async (payload: any) => {
    setLoading(true);
    try {
      const res = await api.ingestTransaction({
        customerId: payload.customerId,
        customerName: payload.customerName,
        amount: Number(payload.amount),
        merchant: payload.merchant,
        merchantCategory: payload.merchantCategory,
        location: {
          city: payload.city,
          country: 'US',
          lat: 40.7,
          lon: -74.0,
          ip: payload.vpnDetected ? '185.220.101.44' : '64.233.160.1',
          vpnDetected: payload.vpnDetected
        },
        device: {
          deviceId: payload.deviceId,
          deviceType: 'MOBILE',
          os: 'iOS 17.4',
          browser: 'Mobile Safari',
          isNewDevice: payload.isNewDevice,
          fingerprintHash: `fp_${payload.deviceId}`
        }
      });

      setResult({ tx: res.transaction, scoring: res.scoring });
      if (typeof onTransactionIngested === 'function') {
        onTransactionIngested(res.transaction, res.scoring);
      }
      if (typeof onTransactionCreated === 'function') {
        onTransactionCreated(res.transaction);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCase = async () => {
    if (!result) return;
    try {
      const newCase = await api.createCase({
        title: `Investigation - ${result.tx.merchant} ($${result.tx.amount})`,
        primaryTransaction: result.tx,
        priority: result.tx.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH'
      });
      onClose();
      if (typeof onOpenInvestigation === 'function') {
        onOpenInvestigation(newCase.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div 
        id="modal-quick-ingest" 
        className="w-full max-w-2xl bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Live Transaction Ingestion & Simulation</h2>
              <p className="text-xs text-slate-400">Inject transactions to evaluate rule engines, ML models, and agents in real time.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Result Banner if already evaluated */}
          {result && (
            <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">Real-Time Scoring Evaluation Complete</span>
                </div>
                <RiskBadge level={result.scoring.riskLevel} score={result.scoring.overallScore} size="md" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Transaction ID</div>
                  <div className="font-mono text-slate-200">{result.tx.id}</div>
                </div>
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">ML Probability</div>
                  <div className="font-mono text-slate-200">{(result.scoring.mlProbability * 100).toFixed(1)}%</div>
                </div>
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Triggered Rules</div>
                  <div className="font-mono text-slate-200">{result.scoring.triggeredRules.length} Anomaly Rules</div>
                </div>
              </div>

              {result.scoring.triggeredRules.length > 0 && (
                <div className="text-xs space-y-1">
                  <div className="text-slate-400 text-[11px] font-mono uppercase">Triggered Anomaly Signatures:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.scoring.triggeredRules.map(r => (
                      <span key={r.ruleId} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]">
                        {r.ruleName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setResult(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Ingest Another
                </button>
                <button
                  onClick={handleOpenCase}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-xs"
                >
                  <span>Launch Agent Investigation</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {!result && (
            <>
              {/* Tab selector */}
              <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
                <button
                  onClick={() => setMode('preset')}
                  className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                    mode === 'preset' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fraud Typology Scenarios (1-Click)
                </button>
                <button
                  onClick={() => setMode('custom')}
                  className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                    mode === 'custom' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom Transaction Attributes
                </button>
              </div>

              {mode === 'preset' ? (
                <div className="space-y-2.5">
                  {presets.map((p, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-200">{p.name}</div>
                        <p className="text-[11px] text-slate-400 leading-normal">{p.desc}</p>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-0.5">
                          <span>${p.data.amount}</span>
                          <span>•</span>
                          <span>{p.data.merchant}</span>
                          <span>•</span>
                          <span>{p.data.city}</span>
                        </div>
                      </div>
                      <button
                        disabled={loading}
                        onClick={() => handleIngest(p.data)}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-medium transition-all"
                      >
                        {loading ? 'Evaluating...' : 'Simulate'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Amount ($ USD)</label>
                      <input 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Merchant Name</label>
                      <input 
                        type="text" 
                        value={merchant} 
                        onChange={e => setMerchant(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Merchant Category</label>
                      <select 
                        value={merchantCategory} 
                        onChange={e => setMerchantCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                      >
                        <option value="CRYPTO">CRYPTO (High Risk)</option>
                        <option value="GAMBLING">GAMBLING (High Risk)</option>
                        <option value="ECOMMERCE">ECOMMERCE</option>
                        <option value="DIGITAL_GOODS">DIGITAL GOODS</option>
                        <option value="RETAIL">RETAIL</option>
                        <option value="TRAVEL">TRAVEL</option>
                        <option value="GROCERY">GROCERY</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">City / Geo Location</label>
                      <input 
                        type="text" 
                        value={city} 
                        onChange={e => setCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Customer Name / ID</label>
                      <input 
                        type="text" 
                        value={customerName} 
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Hardware Device ID</label>
                      <input 
                        type="text" 
                        value={deviceId} 
                        onChange={e => setDeviceId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input 
                        type="checkbox" 
                        checked={vpnDetected} 
                        onChange={e => setVpnDetected(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>VPN / Tor Proxy Detected</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input 
                        type="checkbox" 
                        checked={isNewDevice} 
                        onChange={e => setIsNewDevice(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>First Observed Login (New Device)</span>
                    </label>
                  </div>

                  <div className="pt-3">
                    <button
                      disabled={loading}
                      onClick={() => handleIngest({
                        amount,
                        merchant,
                        merchantCategory,
                        customerId,
                        customerName,
                        city,
                        vpnDetected,
                        isNewDevice,
                        deviceId
                      })}
                      className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? 'Processing through Scoring Engine...' : 'Ingest and Evaluate Transaction'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
