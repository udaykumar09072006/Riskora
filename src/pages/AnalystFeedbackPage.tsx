import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle 
} from 'lucide-react';
import { AnalystDecision } from '../types/fraud';
import { api } from '../services/api';

export const AnalystFeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<AnalystDecision[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const list = await api.getFeedbackList();
      setFeedbacks(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const confirmedCount = feedbacks.filter(f => f.decision === 'CONFIRMED_FRAUD').length;
  const falsePositiveCount = feedbacks.filter(f => f.decision === 'FALSE_POSITIVE').length;

  return (
    <div id="view-analyst-feedback" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Analyst Feedback & Continuous Calibration</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-mono">
              ACTIVE LEARNING LOOP
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Human-in-the-loop adjudication logs continuously feeding the ML ensemble retraining dataset.
          </p>
        </div>

        <button
          onClick={fetchFeedback}
          className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 transition-all self-start sm:self-auto"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Total Adjudications Logged</div>
          <div className="text-2xl font-bold font-mono text-slate-100">{feedbacks.length}</div>
          <div className="text-[11px] text-slate-400">Human-verified ground truth records</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Confirmed Fraud Cases</div>
          <div className="text-2xl font-bold font-mono text-rose-400">{confirmedCount}</div>
          <div className="text-[11px] text-slate-400">Corroborated by SOC analysts</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">False Positive Retraining Signals</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{falsePositiveCount}</div>
          <div className="text-[11px] text-slate-400">Used for friction reduction re-weighting</div>
        </div>
      </div>

      {/* Feedback Records Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200 font-mono uppercase">
            Analyst Review Audit Trail
          </span>
          <span className="text-slate-400">Immutable ground truth feedback</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Adjudication Decision</th>
                <th className="py-3 px-4">Regulatory Justification</th>
                <th className="py-3 px-4">Analyst Comments & Model Notes</th>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4">Model Prediction</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading analyst feedback ledger...
                  </td>
                </tr>
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No analyst adjudications recorded yet. Open a case and submit an adjudication.
                  </td>
                </tr>
              ) : (
                feedbacks.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      {f.decision === 'CONFIRMED_FRAUD' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold">
                          CONFIRMED FRAUD
                        </span>
                      ) : f.decision === 'FALSE_POSITIVE' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                          FALSE POSITIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                          ESCALATED
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-200 max-w-xs truncate">
                      {f.reason}
                    </td>

                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {f.feedbackComments || 'Standard model performance.'}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {f.analystName}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {(f.modelPrediction * 100).toFixed(1)}% prob
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(f.timestamp).toLocaleDateString()}
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
