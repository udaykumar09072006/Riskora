import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  ArrowRight, 
  Briefcase, 
  CheckCircle2, 
  RotateCcw, 
  AlertOctagon 
} from 'lucide-react';
import { FraudAlert } from '../types/fraud';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

interface AlertsPageProps {
  onOpenInvestigation: (caseId: string) => void;
  onSelectTransaction: (tx: any) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  onOpenInvestigation,
  onSelectTransaction
}) => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleConvertToCase = async (alert: FraudAlert) => {
    try {
      const newCase = await api.convertAlertToCase(alert.id, 'Jane Doe (L2 Analyst)');
      await fetchAlerts();
      onOpenInvestigation(newCase.id);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = alerts.filter(a => {
    if (filterLevel !== 'ALL' && a.riskLevel !== filterLevel) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.id.toLowerCase().includes(q) ||
        a.transaction.customerName.toLowerCase().includes(q) ||
        a.transaction.merchant.toLowerCase().includes(q) ||
        a.topRuleName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div id="view-alerts" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Fraud Alerts Triage</h1>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-mono">
              {alerts.length} ALERTS GENERATED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Incoming high-risk flags automatically triaged from the real-time scoring stream.
          </p>
        </div>

        <button
          onClick={() => fetchAlerts()}
          className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 transition-all self-start sm:self-auto"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts by customer, merchant, rule..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Filter Risk:</span>
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
          </select>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            Loading triage queue...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            No alerts found matching search criteria.
          </div>
        ) : (
          filtered.map(alert => (
            <div
              key={alert.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-slate-300">{alert.id}</span>
                  <RiskBadge level={alert.riskLevel} score={alert.riskScore} size="sm" />
                </div>

                <div>
                  <div className="font-semibold text-slate-100 text-sm">{alert.transaction.merchant}</div>
                  <div className="text-xs text-slate-400 flex items-center justify-between mt-0.5">
                    <span>{alert.transaction.customerName}</span>
                    <span className="font-mono font-bold text-slate-200">${alert.transaction.amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                  <div className="text-slate-400 text-[10px] font-mono uppercase">Primary Anomaly Trigger</div>
                  <div className="font-medium text-amber-300 leading-snug">{alert.topRuleName}</div>
                  <div className="text-[10px] text-slate-400 pt-0.5">
                    {alert.triggeredRulesCount} total rule triggers recorded
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => onSelectTransaction(alert.transaction)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  View Details
                </button>

                {alert.caseId ? (
                  <button
                    onClick={() => onOpenInvestigation(alert.caseId!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-medium border border-indigo-500/30 transition-all"
                  >
                    <span>Open Case</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleConvertToCase(alert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-xs transition-all"
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>Create Case</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
