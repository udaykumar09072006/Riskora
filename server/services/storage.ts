import { 
  Transaction, 
  FraudAlert, 
  InvestigationCase, 
  AnalystDecision, 
  AuditLogEntry, 
  ModelMetrics, 
  OverviewMetrics 
} from '../../src/types/fraud';
import { generateSyntheticTransactions } from './dataGenerator';
import { globalFraudScoringEngine } from './fraudEngine';

export class StorageService {
  private transactions: Transaction[] = [];
  private alerts: FraudAlert[] = [];
  private cases: InvestigationCase[] = [];
  private feedbackRecords: AnalystDecision[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private modelMetrics: ModelMetrics;

  constructor() {
    this.seedDatabase();
    this.modelMetrics = this.initializeModelMetrics();
  }

  private seedDatabase() {
    // Generate 1000 realistic synthetic transactions
    this.transactions = generateSyntheticTransactions(1000);

    // Populate initial alerts from high risk transactions
    const suspiciousTxns = this.transactions.filter(t => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL');
    
    suspiciousTxns.slice(0, 45).forEach((tx, idx) => {
      const scoring = globalFraudScoringEngine.scoreTransaction(tx, this.transactions);
      const alertId = `ALT-${8000 + idx}`;
      const isCase = idx < 12;
      const caseId = isCase ? (idx === 0 ? 'CASE-2026-001' : `CASE-2026-${100 + idx}`) : undefined;

      const alert: FraudAlert = {
        id: alertId,
        transactionId: tx.id,
        transaction: tx,
        riskScore: tx.riskScore,
        riskLevel: tx.riskLevel,
        triggeredRulesCount: scoring.triggeredRules.length,
        topRuleName: scoring.triggeredRules[0]?.ruleName || 'Statistical Anomaly Flag',
        status: isCase ? 'CONVERTED_TO_CASE' : 'UNRESOLVED',
        timestamp: tx.timestamp,
        assignedTo: isCase ? 'Analyst Jane Doe' : undefined,
        caseId
      };
      this.alerts.push(alert);

      // Create initial investigation cases
      if (isCase && caseId) {
        const statuses: InvestigationCase['status'][] = [
          'NEW', 'INVESTIGATING', 'NEEDS_REVIEW', 'CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'ESCALATED'
        ];
        const status = statuses[idx % statuses.length];

        const newCase: InvestigationCase = {
          id: caseId,
          title: `Suspicious ${tx.fraudPattern || 'Anomalous Activity'} - ${tx.merchant} ($${tx.amount.toFixed(2)})`,
          linkedTransactionIds: [tx.id],
          primaryTransaction: tx,
          assignedAnalyst: 'Jane Doe (L2 Analyst)',
          analystEmail: 'jane.doe@fraudshield.internal',
          priority: tx.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          status,
          riskScore: tx.riskScore,
          riskLevel: tx.riskLevel,
          notes: [
            {
              id: `NOTE-${idx}-1`,
              author: 'System Autopilot',
              text: `Automated case created from alert ${alertId}. ML probability: ${(tx.fraudProbability * 100).toFixed(0)}%.`,
              timestamp: tx.timestamp,
              isAutomated: true
            }
          ],
          evidenceList: scoring.triggeredRules.map((r, rIdx) => ({
            id: `EVID-${idx}-${rIdx}`,
            type: 'RULE_TRIGGER',
            title: r.ruleName,
            description: r.evidence,
            confidence: 0.95,
            sourceReference: r.ruleId,
            verified: true
          })),
          timeline: [
            {
              id: `EVT-${idx}-1`,
              timestamp: tx.timestamp,
              actor: 'FraudShield Ingestion Engine',
              eventType: 'TRANSACTION_INGESTED',
              description: `Transaction of $${tx.amount} received via card ending in ${tx.cardLast4}.`
            },
            {
              id: `EVT-${idx}-2`,
              timestamp: new Date(new Date(tx.timestamp).getTime() + 150).toISOString(),
              actor: 'Rule & Scoring Engine',
              eventType: 'ANOMALY_FLAGGED',
              description: `Score elevated to ${tx.riskScore}/100. Alert ${alertId} generated.`
            }
          ],
          createdAt: tx.timestamp,
          updatedAt: new Date().toISOString(),
          auditLogs: []
        };

        // If completed status, seed feedback
        if (status === 'CONFIRMED_FRAUD' || status === 'FALSE_POSITIVE') {
          const decision: AnalystDecision = {
            decision: status,
            reason: status === 'CONFIRMED_FRAUD' 
              ? 'Corroborated multi-account hardware ring with unauthorized crypto off-ramping.' 
              : 'Customer verified travel itinerary and valid international billing authorization.',
            correctLabel: status === 'CONFIRMED_FRAUD' ? 1 : 0,
            analystId: 'USR-8912',
            analystName: 'Jane Doe',
            modelPrediction: tx.fraudProbability,
            modelVersion: 'xgboost-ensemble-v2.4.1',
            timestamp: new Date().toISOString(),
            feedbackComments: 'Model precision was satisfactory. Rule 008 was the definitive indicator.'
          };
          newCase.analystDecision = decision;
          this.feedbackRecords.push(decision);
        }

        this.cases.push(newCase);
      }
    });

    // Seed audit log
    this.addAuditLog({
      id: 'AUDIT-001',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userId: 'USR-ADMIN',
      userName: 'Chief Security Officer',
      userRole: 'ADMIN',
      action: 'SYSTEM_BOOTSTRAP',
      entityType: 'PLATFORM',
      entityId: 'FRAUDSHIELD-CORE',
      ipAddress: '10.0.4.1'
    });
  }

  private initializeModelMetrics(): ModelMetrics {
    return {
      version: 'xgboost-ensemble-v2.4.1',
      name: 'FraudShield Multi-Stage TreeSHAP Ensemble',
      trainedOn: '2026-02-15T00:00:00Z',
      evaluationDate: new Date().toISOString(),
      precision: 0.942,
      recall: 0.918,
      f1Score: 0.930,
      rocAuc: 0.976,
      prAuc: 0.948,
      precisionAtK: [
        { k: 50, precision: 0.980 },
        { k: 100, precision: 0.960 },
        { k: 250, precision: 0.944 },
        { k: 500, precision: 0.912 }
      ],
      falsePositiveRate: 0.024,
      confusionMatrix: {
        truePositive: 184,
        falsePositive: 11,
        trueNegative: 785,
        falseNegative: 20
      },
      patternPerformance: [
        { pattern: 'Velocity Attack', detected: 48, total: 50, accuracy: 0.96 },
        { pattern: 'Amount Anomaly', detected: 42, total: 44, accuracy: 0.954 },
        { pattern: 'Card Testing', detected: 36, total: 39, accuracy: 0.923 },
        { pattern: 'Shared Device Ring', detected: 29, total: 30, accuracy: 0.967 },
        { pattern: 'Impossible Travel', detected: 26, total: 27, accuracy: 0.963 },
        { pattern: 'High Risk MCC', detected: 32, total: 35, accuracy: 0.914 }
      ],
      thresholdComparison: [
        { threshold: 0.30, precision: 0.81, recall: 0.98, f1Score: 0.88, alertsGenerated: 242 },
        { threshold: 0.50, precision: 0.89, recall: 0.95, f1Score: 0.92, alertsGenerated: 186 },
        { threshold: 0.70, precision: 0.94, recall: 0.91, f1Score: 0.93, alertsGenerated: 145 },
        { threshold: 0.85, precision: 0.98, recall: 0.82, f1Score: 0.89, alertsGenerated: 92 }
      ],
      driftMetrics: {
        featureDriftDetected: false,
        dataDriftScore: 0.042, // Kolmogorov-Smirnov score < 0.10 is stable
        predictionDriftScore: 0.038,
        lastChecked: new Date().toISOString()
      }
    };
  }

  // Transactions
  public getTransactions(params: {
    search?: string;
    riskLevel?: string;
    status?: string;
    merchantCategory?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    let list = [...this.transactions];

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(t => 
        t.id.toLowerCase().includes(q) ||
        t.customerId.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.merchant.toLowerCase().includes(q) ||
        t.location.city.toLowerCase().includes(q) ||
        t.device.deviceId.toLowerCase().includes(q) ||
        t.location.ip.toLowerCase().includes(q)
      );
    }

    if (params.riskLevel && params.riskLevel !== 'ALL') {
      list = list.filter(t => t.riskLevel === params.riskLevel);
    }

    if (params.status && params.status !== 'ALL') {
      list = list.filter(t => t.status === params.status);
    }

    if (params.merchantCategory && params.merchantCategory !== 'ALL') {
      list = list.filter(t => t.merchantCategory === params.merchantCategory);
    }

    // Sort
    const sortBy = params.sortBy || 'timestamp';
    const sortOrder = params.sortOrder || 'desc';
    list.sort((a, b) => {
      let aVal = (a as any)[sortBy];
      let bVal = (b as any)[sortBy];
      if (sortBy === 'amount' || sortBy === 'riskScore') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (sortBy === 'timestamp') {
        const at = new Date(aVal).getTime();
        const bt = new Date(bVal).getTime();
        return sortOrder === 'asc' ? at - bt : bt - at;
      }
      return sortOrder === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(5, Math.min(100, params.pageSize || 15));
    const total = list.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = list.slice(startIndex, startIndex + pageSize);

    return {
      transactions: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  public getTransactionById(id: string): Transaction | undefined {
    return this.transactions.find(t => t.id === id);
  }

  public addTransaction(tx: Transaction): Transaction {
    // Score the transaction
    const scoreResult = globalFraudScoringEngine.scoreTransaction(tx, this.transactions);
    tx.riskScore = scoreResult.overallScore;
    tx.riskLevel = scoreResult.riskLevel;
    tx.fraudProbability = scoreResult.mlProbability;
    
    if (tx.riskLevel === 'CRITICAL' || tx.riskLevel === 'HIGH') {
      tx.status = 'FLAGGED';
    }

    this.transactions.unshift(tx);

    // If flagged, create alert
    if (tx.status === 'FLAGGED') {
      const alertId = `ALT-${8000 + this.alerts.length}`;
      this.alerts.unshift({
        id: alertId,
        transactionId: tx.id,
        transaction: tx,
        riskScore: tx.riskScore,
        riskLevel: tx.riskLevel,
        triggeredRulesCount: scoreResult.triggeredRules.length,
        topRuleName: scoreResult.triggeredRules[0]?.ruleName || 'Suspicious Activity',
        status: 'UNRESOLVED',
        timestamp: tx.timestamp
      });
    }

    return tx;
  }

  // Alerts
  public getAlerts() {
    return [...this.alerts];
  }

  public updateAlert(id: string, updates: Partial<FraudAlert>): FraudAlert | undefined {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      Object.assign(alert, updates);
    }
    return alert;
  }

  // Cases
  public getCases(params: { status?: string; priority?: string; search?: string }) {
    let list = [...this.cases];
    if (params.status && params.status !== 'ALL') {
      list = list.filter(c => c.status === params.status);
    }
    if (params.priority && params.priority !== 'ALL') {
      list = list.filter(c => c.priority === params.priority);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(c => 
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.assignedAnalyst.toLowerCase().includes(q) ||
        c.primaryTransaction.customerName.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getCaseById(id: string): InvestigationCase | undefined {
    const found = this.cases.find(c => c.id === id);
    if (found) return found;
    if ((id === 'CASE-2026-001' || !id) && this.cases.length > 0) {
      return this.cases[0];
    }
    return undefined;
  }

  public createCase(data: Partial<InvestigationCase>): InvestigationCase {
    const caseId = `CASE-2026-${100 + this.cases.length + 1}`;
    const tx = data.primaryTransaction || this.transactions[0];
    const newCase: InvestigationCase = {
      id: caseId,
      title: data.title || `Investigation - ${tx.merchant} ($${tx.amount.toFixed(2)})`,
      linkedTransactionIds: [tx.id],
      primaryTransaction: tx,
      assignedAnalyst: data.assignedAnalyst || 'Jane Doe (L2 Analyst)',
      analystEmail: 'jane.doe@fraudshield.internal',
      priority: data.priority || (tx.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH'),
      status: 'NEW',
      riskScore: tx.riskScore,
      riskLevel: tx.riskLevel,
      notes: [
        {
          id: `NOTE-${Date.now()}`,
          author: 'System',
          text: 'Manual case opened by analyst.',
          timestamp: new Date().toISOString(),
          isAutomated: true
        }
      ],
      evidenceList: [],
      timeline: [
        {
          id: `EVT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Analyst',
          eventType: 'CASE_CREATED',
          description: `Case ${caseId} initialized.`
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditLogs: []
    };
    this.cases.unshift(newCase);
    return newCase;
  }

  public updateCase(id: string, updates: Partial<InvestigationCase>): InvestigationCase | undefined {
    const c = this.cases.find(item => item.id === id);
    if (!c) return undefined;
    Object.assign(c, updates);
    c.updatedAt = new Date().toISOString();
    return c;
  }

  public recordFeedback(feedback: AnalystDecision) {
    this.feedbackRecords.unshift(feedback);
    // Recalibrate confusion matrix count dynamically
    if (feedback.correctLabel === 1) {
      this.modelMetrics.confusionMatrix.truePositive += 1;
    } else {
      this.modelMetrics.confusionMatrix.falsePositive += 1;
    }
  }

  public getFeedback() {
    return [...this.feedbackRecords];
  }

  public getModelMetrics() {
    return { ...this.modelMetrics };
  }

  public addAuditLog(entry: AuditLogEntry) {
    this.auditLogs.unshift(entry);
  }

  public getAuditLogs() {
    return [...this.auditLogs];
  }

  // Dashboard Overview Metrics
  public getOverviewMetrics(): OverviewMetrics {
    const totalTransactions = this.transactions.length;
    const suspiciousTransactions = this.transactions.filter(t => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL').length;
    const confirmedFraudCases = this.cases.filter(c => c.status === 'CONFIRMED_FRAUD').length;
    const pendingInvestigations = this.cases.filter(c => c.status === 'NEW' || c.status === 'INVESTIGATING' || c.status === 'NEEDS_REVIEW').length;
    const fraudDetectionRate = Number(((suspiciousTransactions / totalTransactions) * 100).toFixed(1));

    const riskDistribution = {
      low: this.transactions.filter(t => t.riskLevel === 'LOW').length,
      medium: this.transactions.filter(t => t.riskLevel === 'MEDIUM').length,
      high: this.transactions.filter(t => t.riskLevel === 'HIGH').length,
      critical: this.transactions.filter(t => t.riskLevel === 'CRITICAL').length
    };

    const patternMap = new Map<string, { count: number; totalAmount: number }>();
    this.transactions.forEach(t => {
      const pattern = t.fraudPattern || 'Baseline Normal';
      if (!patternMap.has(pattern)) patternMap.set(pattern, { count: 0, totalAmount: 0 });
      const cur = patternMap.get(pattern)!;
      cur.count += 1;
      cur.totalAmount += t.amount;
    });

    const fraudPatternDistribution = Array.from(patternMap.entries())
      .filter(([name]) => name !== 'Baseline Normal')
      .map(([name, val]) => ({
        name: name.replace(/_/g, ' '),
        count: val.count,
        riskWeightedAmount: Math.round(val.totalAmount)
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalTransactions,
      suspiciousTransactions,
      confirmedFraudCases,
      pendingInvestigations,
      fraudDetectionRate,
      avgInvestigationTimeHours: 1.4,
      modelPrecision: this.modelMetrics.precision,
      modelRecall: this.modelMetrics.recall,
      riskDistribution,
      fraudPatternDistribution,
      recentAlerts: this.alerts.slice(0, 6),
      realTimeThroughputTps: 18.4
    };
  }

  public getAllTransactions(): Transaction[] {
    return [...this.transactions];
  }
}

export const globalStorage = new StorageService();
