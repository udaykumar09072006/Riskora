import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  ArrowRight, 
  RotateCcw, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus 
} from 'lucide-react';
import { InvestigationCase } from '../types/fraud';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

interface CaseManagementProps {
  onOpenInvestigation: (caseId: string) => void;
  onOpenIngestModal: () => void;
}

export const CaseManagement: React.FC<CaseManagementProps> = ({
  onOpenInvestigation,
  onOpenIngestModal
}) => {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await api.getCases({
        status: statusFilter,
        search
      });
      setCases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, search]);

  const getStatusBadge = (status: InvestigationCase['status']) => {
    switch (status) {
      case 'CONFIRMED_FRAUD':
        return <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-mono">CONFIRMED FRAUD</span>;
      case 'FALSE_POSITIVE':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">FALSE POSITIVE</span>;
      case 'ESCALATED':
        return <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-mono">ESCALATED</span>;
      case 'NEEDS_REVIEW':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono">NEEDS REVIEW</span>;
      case 'INVESTIGATING':
        return <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">INVESTIGATING</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-mono">NEW</span>;
    }
  };

  return (
    <div id="view-cases" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Fraud Case Management</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-mono">
              {cases.length} REGISTERED CASES
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Formal investigation files with multi-agent intelligence dossiers, RAG citations, and human audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchCases()}
            className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenIngestModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-xs transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Open New Case</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search cases by Case ID, merchant, customer, or analyst..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Workflow Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="CONFIRMED_FRAUD">Confirmed Fraud</option>
            <option value="FALSE_POSITIVE">False Positive</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Incident Description</th>
                <th className="py-3 px-4">Risk Evaluation</th>
                <th className="py-3 px-4">Assigned Analyst</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4">Updated</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading investigation files...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No cases match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                cases.map(c => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onOpenInvestigation(c.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-slate-200">{c.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {c.linkedTransactionIds.length} Linked Txn
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{c.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {c.primaryTransaction.customerName} • ${c.primaryTransaction.amount.toFixed(2)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <RiskBadge level={c.riskLevel} score={c.riskScore} size="sm" />
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{c.assignedAnalyst}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(c.status)}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenInvestigation(c.id); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-medium border border-indigo-500/30 transition-all text-xs"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
