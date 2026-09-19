import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  BookOpen, 
  Share2, 
  ArrowLeft, 
  Check, 
  X, 
  AlertOctagon, 
  Send, 
  Sparkles, 
  Lock, 
  RotateCw 
} from 'lucide-react';
import { InvestigationCase, AgentInvestigationReport } from '../types/fraud';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { ShapWaterfall } from '../components/ShapWaterfall';
import { AgentNetwork3D } from '../components/3d/AgentNetwork3D';

interface InvestigationWorkflowProps {
  caseId: string;
  onBack: () => void;
  onRefresh: () => void;
}

export const InvestigationWorkflow: React.FC<InvestigationWorkflowProps> = ({
  caseId,
  onBack,
  onRefresh
}) => {
  const [caseData, setCaseData] = useState<InvestigationCase | null>(null);
  const [report, setReport] = useState<AgentInvestigationReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'rag' | 'evidence' | 'timeline'>('overview');

  // Human Review Modal state
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'ESCALATED'>('CONFIRMED_FRAUD');
  const [decisionReason, setDecisionReason] = useState('');
  const [analystComments, setAnalystComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCase = async () => {
    try {
      let data: InvestigationCase | null = null;
      try {
        data = await api.getCaseById(caseId);
      } catch (err) {
        console.warn(`Case ${caseId} not found, falling back to first case`);
        const allCases = await api.getCases();
        if (allCases.length > 0) {
          data = allCases[0];
        }
      }
      if (data) {
        setCaseData(data);
        if (data.agentReport) {
          setReport(data.agentReport);
          setCurrentStepIndex(7);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const handleRunInvestigation = async () => {
    setIsRunning(true);
    setCurrentStepIndex(0);

    // Animate sequential agent progression for high-fidelity analyst feedback
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < 6) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 450);

    try {
      const res = await api.runAgentInvestigation(caseId);
      setReport(res);
      setCurrentStepIndex(7);
      await loadCase();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitDecision = async () => {
    if (!caseData || !decisionReason.trim()) return;
    setIsSubmitting(true);
    try {
      await api.submitFeedback(caseData.id, {
        decision: decisionType,
        reason: decisionReason,
        analystName: 'Jane Doe',
        comments: analystComments
      });
      setIsDecisionModalOpen(false);
      await loadCase();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!caseData) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-4">
        <div className="flex items-center justify-center gap-2">
          <RotateCw className="h-4 w-4 animate-spin text-indigo-400" />
          <span>Loading case investigation file...</span>
        </div>
        <div>
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs transition-colors"
          >
            Return to Cases
          </button>
        </div>
      </div>
    );
  }

  const tx = caseData.primaryTransaction;

  return (
    <div id="view-investigation-workbench" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header with Case Metadata & Action */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-indigo-400">{caseData.id}</span>
                <span className="text-slate-400">•</span>
                <h1 className="text-base font-bold text-slate-100">{caseData.title}</h1>
                <RiskBadge level={caseData.riskLevel} score={caseData.riskScore} size="sm" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Primary Transaction: <span className="font-mono text-slate-300">${tx.amount.toFixed(2)}</span> at {tx.merchant} by {tx.customerName} ({tx.customerId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!report ? (
              <button
                disabled={isRunning}
                onClick={handleRunInvestigation}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/40 transition-all disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>Orchestrating 8 Agents...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Launch 8-Agent Investigation</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunInvestigation}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Re-run Agents
                </button>
                <button
                  onClick={() => setIsDecisionModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Submit Final Analyst Decision</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Tracker */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-3 border-t border-slate-800/80 text-slate-400">
          <div className="flex items-center gap-4">
            <div>Workflow Status: <strong className="text-slate-200">{caseData.status}</strong></div>
            <div>Assigned: <strong className="text-slate-200">{caseData.assignedAnalyst}</strong></div>
            <div>Card: <strong className="font-mono text-slate-200">•••• {tx.cardLast4}</strong></div>
            <div>IP: <strong className="font-mono text-slate-200">{tx.location.ip} ({tx.location.city})</strong></div>
          </div>
          {report && (
            <div className="flex items-center gap-2 text-indigo-300 font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Evidence Confidence: <strong>{report.evidenceConfidence}%</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* 8-Agent Sequential Pipeline Progress Visualizer */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
            <Bot className="h-4 w-4 text-red-500" />
            <span>Agentic Orchestration Pipeline (Neural Network)</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {report ? '8/8 Agents Finished' : (isRunning ? `Executing Agent ${currentStepIndex + 1}/8...` : 'Awaiting Execution')}
          </span>
        </div>

        {/* 3D Agent Network Component */}
        <AgentNetwork3D
          agentSteps={caseData.agentSteps || []}
          activeAgentIndex={currentStepIndex >= 0 ? currentStepIndex : (report ? 7 : -1)}
          isExecuting={isRunning}
          onSelectAgent={(step) => {
            setActiveTab('agents');
          }}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2 border-t border-slate-800">
          {[
            '1. Risk Agent',
            '2. Behavioral',
            '3. Pattern',
            '4. RAG Cases',
            '5. Policy',
            '6. Evidence',
            '7. Dossier',
            '8. Human Gate'
          ].map((name, idx) => {
            const isDone = report || (currentStepIndex >= idx);
            const isActive = isRunning && currentStepIndex === idx;

            return (
              <div
                key={idx}
                className={`p-2 rounded-lg border text-center text-[11px] transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 animate-pulse font-semibold'
                    : isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-medium'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="truncate">{name}</div>
                <div className="text-[10px] opacity-75 mt-0.5 font-mono">
                  {isActive ? 'ANALYZING...' : (isDone ? 'COMPLETE' : 'PENDING')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-800 text-xs font-medium space-x-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Investigation Report
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'agents'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Agent Execution Logs ({report?.agentPipelineExecution.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('rag')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'rag'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          RAG Policy & Case Citations
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'evidence'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Rules & Model Explanations (SHAP)
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'timeline'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit Ledger Timeline
        </button>
      </div>

      {/* Tab 1: Executive Investigation Report */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {report ? (
            <div className="space-y-6">
              {/* Executive Case Summary */}
              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 uppercase font-mono">
                    <FileText className="h-4 w-4" />
                    <span>Evidence-Based Executive Summary</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Synthesized by Investigation Report Agent</span>
                </div>
                <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans">
                  {report.caseSummary}
                </div>
              </div>

              {/* Recommended Next Action & Risk Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400">Recommended Next Action</div>
                  <div className="text-base font-bold text-indigo-300 font-mono">
                    {report.recommendedNextAction.replace(/_/g, ' ')}
                  </div>
                  <p className="text-[11px] text-slate-400">Synthesized by multi-agent risk consensus</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400">Risk Assessment</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-mono text-slate-100">{report.riskScore}/100</span>
                    <RiskBadge level={report.riskLevel} showScore={false} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-400">Corroborated by deterministic rule engine</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400">Detected Typologies</div>
                  <div className="flex flex-wrap gap-1">
                    {report.detectedFraudPatterns.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strict Governance Requirement */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertOctagon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-amber-200">Mandatory Human Review Gate</div>
                  <p className="text-amber-300/90 leading-relaxed">
                    {report.humanReviewRequirement}
                  </p>
                </div>
              </div>

              {/* Analyst Decision History if already reviewed */}
              {caseData.analystDecision && (
                <div className="p-5 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-300 uppercase font-mono">
                      Analyst Adjudication Finalized
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{caseData.analystDecision.timestamp ? new Date(caseData.analystDecision.timestamp).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="text-xs text-slate-200 font-sans">
                    Decision: <strong>{caseData.analystDecision.decision}</strong> by {caseData.analystDecision.analystName}
                  </div>
                  <p className="text-xs text-slate-400 italic">
                    "{caseData.analystDecision.reason}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
              <Bot className="h-10 w-10 text-indigo-400 mx-auto" />
              <div className="text-slate-200 font-semibold text-sm">No Agent Dossier Generated Yet</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Launch the 8-agent sequential verification pipeline to automatically analyze behavior, match fraud typologies, retrieve RAG policy citations, and prepare the executive report.
              </p>
              <button
                onClick={handleRunInvestigation}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                Execute 8-Agent Pipeline
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Agent Execution Logs */}
      {activeTab === 'agents' && (
        <div className="space-y-3">
          {report?.agentPipelineExecution.map((step, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-indigo-400 font-bold">Step {idx + 1}:</span>
                  <span className="font-semibold text-slate-200">{step.agentName}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>Confidence: {(step.confidenceScore * 100).toFixed(0)}%</span>
                  <span>Duration: {step.durationMs}ms</span>
                  <span className="text-emerald-400 font-semibold">{step.status}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-normal">{step.summary}</p>

              {step.findings && step.findings.length > 0 && (
                <div className="pl-3 border-l-2 border-slate-700 space-y-1 text-xs text-slate-400 pt-1">
                  {step.findings.map((f, fIdx) => (
                    <div key={fIdx} className="text-[11px]">• {f}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: RAG Policy & Case Citations */}
      {activeTab === 'rag' && report && (
        <div className="space-y-6">
          {/* Similar Historical Cases */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200 uppercase font-mono">
              <span className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-indigo-400" />
                <span>Similar Historical Precedents (Dense + BM25 Hybrid Retrieval)</span>
              </span>
              <span className="text-slate-400">{report.similarHistoricalCases.length} Precedents Retrieved</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.similarHistoricalCases.map((c, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-indigo-400 font-medium">{c.caseId}</span>
                    <span className="font-mono text-emerald-400 font-bold">{c.similarityScore}% Match</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-normal">{c.description}</p>
                  <div className="text-[10px] text-slate-400 pt-1 font-mono">{c.relevance}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Retrieved Regulatory References */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200 uppercase font-mono">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                <span>Regulatory Policies & SOP Citations</span>
              </span>
              <span className="text-slate-400">{report.retrievedPolicyReferences.length} Citations</span>
            </div>

            <div className="space-y-2">
              {report.retrievedPolicyReferences.map((p, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{p.documentTitle}</span>
                    <span className="font-mono text-indigo-400 text-[11px]">{p.relevanceScore}% Relevance</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed italic">"{p.clause}"</p>
                  <div className="text-[11px] text-amber-300 font-medium pt-0.5">
                    Recommended Compliance Protocol: {p.guidelineAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Rules & SHAP Waterfall */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          {report && (
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
              <ShapWaterfall 
                shapFactors={[
                  ...report.modelExplanations.positiveRiskContributors,
                  ...report.modelExplanations.negativeRiskContributors
                ]} 
                baseScore={report.modelExplanations.baselineRisk}
                finalScore={report.riskScore}
              />
            </div>
          )}

          {/* Triggered Rules Table */}
          {report && report.triggeredRules.length > 0 && (
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-200 uppercase font-mono">
                Corroborated Rule Triggers ({report.triggeredRules.length})
              </div>
              <div className="space-y-2">
                {report.triggeredRules.map(r => (
                  <div key={r.ruleId} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 font-mono">{r.ruleId}: {r.ruleName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {r.severity}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{r.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Timeline */}
      {activeTab === 'timeline' && (
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="text-xs font-semibold text-slate-200 uppercase font-mono">
            Immutable Audit Trail & Activity Ledger
          </div>
          <div className="space-y-3">
            {caseData.timeline.map((evt, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{evt.actor}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{evt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Decision Modal */}
      {isDecisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
                <span>Analyst Case Adjudication</span>
              </div>
              <button onClick={() => setIsDecisionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Select Adjudication Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDecisionType('CONFIRMED_FRAUD')}
                    className={`py-2 rounded-lg border text-center font-medium transition-all ${
                      decisionType === 'CONFIRMED_FRAUD'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Confirm Fraud
                  </button>
                  <button
                    onClick={() => setDecisionType('FALSE_POSITIVE')}
                    className={`py-2 rounded-lg border text-center font-medium transition-all ${
                      decisionType === 'FALSE_POSITIVE'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    False Positive
                  </button>
                  <button
                    onClick={() => setDecisionType('ESCALATED')}
                    className={`py-2 rounded-lg border text-center font-medium transition-all ${
                      decisionType === 'ESCALATED'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Escalate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Justification & Regulatory Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Corroborated multi-account hardware ring with crypto off-ramp..."
                  value={decisionReason}
                  onChange={e => setDecisionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Model Calibration Comments (Feedback Loop)</label>
                <textarea
                  rows={2}
                  placeholder="Add feedback to recalibrate future model predictions and rule engine..."
                  value={analystComments}
                  onChange={e => setAnalystComments(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || !decisionReason.trim()}
                onClick={handleSubmitDecision}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Recording Decision...' : 'Commit Final Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
