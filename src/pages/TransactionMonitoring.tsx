import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  Radio, 
  Sparkles, 
  Eye, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Transaction } from '../types/fraud';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

interface TransactionMonitoringProps {
  onSelectTransaction: (tx: Transaction) => void;
  onOpenInvestigation: (caseId: string) => void;
  onOpenIngestModal: () => void;
}

export const TransactionMonitoring: React.FC<TransactionMonitoringProps> = ({
  onSelectTransaction,
  onOpenInvestigation,
  onOpenIngestModal
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [merchantCategory, setMerchantCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.getTransactions({
        search,
        riskLevel,
        status,
        merchantCategory,
        page,
        pageSize: 15,
        sortBy,
        sortOrder
      });
      setTransactions(res.transactions);
      setTotalPages(res.totalPages);
      setTotalCount(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, riskLevel, status, merchantCategory, sortBy, sortOrder, page]);

  // Connect to SSE stream for live real-time ingestion
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/v1/stream/transactions');
      eventSource.onmessage = (event) => {
        try {
          if (!event.data || event.data.trim().startsWith('<')) return;
          const newTx: Transaction = JSON.parse(event.data);
          setTransactions(prev => {
            // Prepend new transaction if on page 1 and matches filters
            if (page === 1) {
              return [newTx, ...prev.slice(0, 14)];
            }
            return prev;
          });
          setTotalCount(prev => prev + 1);
        } catch (e) {
          // Ignore transient SSE message parse errors
        }
      };
      eventSource.onerror = () => {
        // Suppress noisy EventSource disconnection events in browser devtools
      };
    } catch (e) {
      console.warn('SSE stream unavailable', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [page]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div id="view-transactions" className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Live Transaction Stream</h1>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE INGESTION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time ledger monitoring with sub-millisecond fraud probability calculation and SHAP attribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchTransactions()}
            className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
            title="Refresh Transactions"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenIngestModal}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-xs shadow-indigo-900/30 transition-all"
          >
            Ingest / Simulate
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, customer, merchant, IP, device..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskLevel}
              onChange={e => { setRiskLevel(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Risk (85+)</option>
              <option value="HIGH">High Risk (70-84)</option>
              <option value="MEDIUM">Medium Risk (35-69)</option>
              <option value="LOW">Low Risk (0-34)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={merchantCategory}
              onChange={e => { setMerchantCategory(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="CRYPTO">Crypto OTC & Exchanges</option>
              <option value="GAMBLING">Gambling & Casinos</option>
              <option value="ECOMMERCE">E-Commerce</option>
              <option value="DIGITAL_GOODS">Digital Goods</option>
              <option value="LUXURY_GOODS">Luxury Goods</option>
              <option value="RETAIL">Retail</option>
              <option value="TRAVEL">Travel & Airlines</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>
            Showing <strong className="text-slate-200">{transactions.length}</strong> of{' '}
            <strong className="text-slate-200">{totalCount}</strong> recorded transactions
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px]">Sort By:</span>
            <button
              onClick={() => handleSort('amount')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                sortBy === 'amount' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30' : 'border-slate-800 text-slate-400'
              }`}
            >
              Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('riskScore')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                sortBy === 'riskScore' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30' : 'border-slate-800 text-slate-400'
              }`}
            >
              Risk Score {sortBy === 'riskScore' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('timestamp')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                sortBy === 'timestamp' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30' : 'border-slate-800 text-slate-400'
              }`}
            >
              Time {sortBy === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Merchant & Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Location / Device</th>
                <th className="py-3 px-4">Risk Evaluation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading ledger stream...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No transactions matching filter criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr 
                    key={tx.id} 
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectTransaction(tx)}
                  >
                    {/* Transaction ID & Time */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-medium text-slate-200">{tx.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{tx.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.customerId}</div>
                    </td>

                    {/* Merchant */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{tx.merchant}</div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {tx.merchantCategory}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-slate-100 text-sm">
                        ${tx.amount.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        via •••• {tx.cardLast4}
                      </div>
                    </td>

                    {/* Location & Device */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-200">{tx.location.city}, {tx.location.country}</span>
                        {tx.location.vpnDetected && (
                          <span className="text-[9px] font-mono px-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            VPN
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <span>{tx.device.deviceType}</span>
                        {tx.device.isNewDevice && (
                          <span className="text-amber-400 text-[9px]">(New Device)</span>
                        )}
                      </div>
                    </td>

                    {/* Risk Evaluation */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="sm" />
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ML Prob: {(tx.fraudProbability * 100).toFixed(0)}%
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectTransaction(tx)}
                          className="p-1.5 rounded-md hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
                          title="View SHAP & Transaction Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {(tx.riskLevel === 'CRITICAL' || tx.riskLevel === 'HIGH') && (
                          <button
                            onClick={async () => {
                              const newCase = await api.createCase({
                                title: `Investigation - ${tx.merchant} ($${tx.amount.toFixed(2)})`,
                                primaryTransaction: tx,
                                priority: tx.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH'
                              });
                              onOpenInvestigation(newCase.id);
                            }}
                            className="px-2 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-medium border border-indigo-500/30 transition-all"
                            title="Create and Investigate Case"
                          >
                            Investigate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <span className="font-mono text-slate-200">{page}</span> of <span className="font-mono text-slate-200">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
