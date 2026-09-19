import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  FileCheck, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  CheckCircle2, 
  ShieldCheck,
  Bot,
  Network,
  CreditCard,
  Flame,
  Zap,
  Play
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { OverviewMetrics, FraudAlert, Transaction, InvestigationCase } from '../types/fraud';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { NetflixHero } from '../components/NetflixHero';
import { HorizontalRow } from '../components/HorizontalRow';
import { TiltCard } from '../components/TiltCard';

interface OverviewDashboardProps {
  onNavigate?: (page: string, id?: string) => void;
  onOpenInvestigation?: (caseId: string) => void;
  onSelectTransaction?: (tx: Transaction) => void;
  onOpenIngestModal?: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ 
  onNavigate,
  onOpenInvestigation,
  onSelectTransaction,
  onOpenIngestModal = () => {}
}) => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState(true);

  const handleNav = (page: string, id?: string) => {
    let target = page;
    if (page === 'dashboard') target = 'overview';
    if (page === 'fraud-graph') target = 'graph';
    if (page === 'models') target = 'evaluation';

    if (target === 'investigation' && id && onOpenInvestigation) {
      onOpenInvestigation(id);
      return;
    }
    if (typeof onNavigate === 'function') {
      onNavigate(target, id);
    }
  };

  const loadData = async () => {
    try {
      const [overviewData, txList, caseList] = await Promise.all([
        api.getOverview(),
        api.getTransactions(),
        api.getCases()
      ]);
      setMetrics(overviewData);
      setTransactions(Array.isArray(txList) ? txList : (txList?.transactions || []));
      setCases(caseList || []);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 space-y-3 min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
        <span className="text-xs font-mono">Initializing Security Command Center...</span>
      </div>
    );
  }

  const riskPieData = [
    { name: 'Low Risk', value: metrics.riskDistribution.low, color: '#10B981' },
    { name: 'Medium Risk', value: metrics.riskDistribution.medium, color: '#F59E0B' },
    { name: 'High Risk', value: metrics.riskDistribution.high, color: '#F97316' },
    { name: 'Critical Risk', value: metrics.riskDistribution.critical, color: '#DC2626' }
  ];

  // Critical alerts sorted by score
  const criticalAlerts = [...(metrics.recentAlerts || [])].sort((a, b) => b.riskScore - a.riskScore);
  // Live high risk transactions
  const highRiskTxs = transactions.filter(t => t.riskScore >= 60).slice(0, 8);

  return (
    <div id="view-dashboard" className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. Cinematic Hero Section with 3D Threat Globe */}
      <NetflixHero
        threatLevel="HIGH"
        onLaunchInvestigation={() => handleNav('investigation', cases[0]?.id || 'CASE-2026-001')}
        onOpenIngest={onOpenIngestModal}
        onOpenGraph={() => handleNav('graph')}
        onOpenReports={() => handleNav('reports')}
        blockedAmount={142850}
        activeSyndicatesCount={3}
        flaggedTransactionsCount={criticalAlerts.length || 38}
      />

      {/* 2. Horizontal Row: Critical Alerts & High-Risk Anomalies */}
      <HorizontalRow
        title="Critical Fraud Alerts & Anomalies"
        subtitle="Active high-velocity alerts intercepting card testing and account takeover waves"
        badge="REAL-TIME"
        badgeColor="bg-red-600/20 text-red-400 border-red-500/30"
        onViewAll={() => handleNav('alerts')}
      >
        {criticalAlerts.map(alert => (
          <div key={alert.id} className="min-w-[280px] sm:min-w-[320px] snap-start">
            <TiltCard
              glowColor="red"
              className="p-4 flex flex-col justify-between h-44 group"
              onClick={() => {
                if (alert.caseId) handleNav('investigation', alert.caseId);
                else handleNav('alerts');
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-red-600/20 text-red-400 text-[10px] font-mono font-bold border border-red-500/30">
                    SCORE {alert.riskScore}/100
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{alert.id}</span>
                </div>
                <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors line-clamp-1">
                  {alert.transaction?.merchant || alert.type}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {alert.topRuleName || 'Anomalous velocity detected exceeding standard baseline.'}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-white">
                  ${alert.transaction?.amount ? alert.transaction.amount.toFixed(2) : '4,950.00'}
                </span>
                <span className="text-[11px] font-mono text-red-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Investigate →
                </span>
              </div>
            </TiltCard>
          </div>
        ))}
      </HorizontalRow>

      {/* 3. Horizontal Row: Live Ingestion Stream (Real-Time Transactions) */}
      <HorizontalRow
        title="Live Transaction Stream"
        subtitle="Streaming ledger transactions scored by TreeSHAP and CatBoost neural models"
        badge="18.4 TPS"
        badgeColor="bg-sky-500/20 text-sky-400 border-sky-500/30"
        onViewAll={() => handleNav('transactions')}
      >
        {(highRiskTxs.length > 0 ? highRiskTxs : transactions.slice(0, 8)).map(tx => (
          <div key={tx.id} className="min-w-[260px] sm:min-w-[290px] snap-start">
            <TiltCard
              glowColor={tx.riskScore > 70 ? 'red' : tx.riskScore > 30 ? 'amber' : 'green'}
              className="p-4 flex flex-col justify-between h-40 group"
              onClick={() => onSelectTransaction ? onSelectTransaction(tx) : handleNav('transactions')}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    tx.riskScore > 70 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {tx.channel}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-300">
                    {tx.riskScore}/100
                  </span>
                </div>
                <div className="font-semibold text-xs text-white truncate">{tx.merchantName}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {tx.location?.city}, {tx.location?.country} • {tx.device?.deviceType}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-white">${tx.amount.toFixed(2)}</span>
                <span className="text-[10px] font-mono text-slate-400">Inspect payload &rarr;</span>
              </div>
            </TiltCard>
          </div>
        ))}
      </HorizontalRow>

      {/* 4. Horizontal Row: Multi-Agent Active Cases */}
      <HorizontalRow
        title="Multi-Agent Case Investigations"
        subtitle="Autonomous cases synthesized by 8-agent reasoning pipeline with human-in-the-loop gate"
        badge={`${cases.length} CASES`}
        badgeColor="bg-amber-500/20 text-amber-400 border-amber-500/30"
        onViewAll={() => handleNav('cases')}
      >
        {cases.slice(0, 6).map(c => (
          <div key={c.id} className="min-w-[290px] sm:min-w-[320px] snap-start">
            <TiltCard
              glowColor="amber"
              className="p-4 flex flex-col justify-between h-44 group"
              onClick={() => handleNav('investigation', c.id)}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold border border-amber-500/30">
                    {c.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{c.id}</span>
                </div>
                <h3 className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {c.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {c.summary || 'Multi-agent consensus gathered across 8 forensic nodes.'}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                  <Bot className="h-3 w-3" />
                  <span>{c.agentSteps?.filter(s => s.status === 'COMPLETED').length || 8}/8 Agents Done</span>
                </div>
                <span className="text-[11px] font-mono text-amber-400 font-bold">Review &rarr;</span>
              </div>
            </TiltCard>
          </div>
        ))}
      </HorizontalRow>

      {/* 5. Deep Analytics: Risk Distribution & Typology Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Donut */}
        <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="font-bold text-white text-xs uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              Composite Risk Score Distribution
            </span>
            <span className="text-[10px] font-mono text-slate-400">REAL-TIME INFERENCE</span>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#E2E8F0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
            {riskPieData.map(item => (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5 font-mono">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400 text-[11px]">{item.name}</span>
                </div>
                <span className="text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Typologies Bar Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-white text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-500" />
                Institutional Fraud Typology Signatures
              </span>
              <button
                onClick={() => handleNav('graph')}
                className="text-[11px] font-mono text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>Syndicate Graph</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>

            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.fraudPatternDistribution} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#94A3B8" 
                    fontSize={11} 
                    tickLine={false} 
                    width={140}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#E2E8F0' }}
                    formatter={(value: any) => [`${value} incidents`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#e50914" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/10">
            <span>Pattern matching across velocity bursts, device sharing, and card testing</span>
            <span className="font-mono text-red-400 font-bold">14ms Mean Latency</span>
          </div>
        </div>
      </div>
    </div>
  );
};
