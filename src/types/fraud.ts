export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TransactionStatus = 'APPROVED' | 'FLAGGED' | 'BLOCKED' | 'UNDER_REVIEW';

export type CaseStatus = 
  | 'NEW' 
  | 'INVESTIGATING' 
  | 'NEEDS_REVIEW' 
  | 'CONFIRMED_FRAUD' 
  | 'FALSE_POSITIVE' 
  | 'ESCALATED' 
  | 'CLOSED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type UserRole = 'ADMIN' | 'ANALYST' | 'REVIEWER' | 'VIEWER';

export interface LocationInfo {
  city: string;
  country: string;
  lat: number;
  lon: number;
  ip: string;
  ipAddress?: string;
  vpnDetected: boolean;
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'POS';
  os: string;
  browser: string;
  isNewDevice: boolean;
  fingerprintHash: string;
  isEmulator?: boolean;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  accountNumber: string;
  amount: number;
  currency: string;
  merchant: string;
  merchantCategory: string; // MCC e.g., 'CRYPTO', 'ELECTRONICS', 'LUXURY_JEWELRY', 'GROCERY'
  merchantRiskScore: number;
  location: LocationInfo;
  device: DeviceInfo;
  timestamp: string;
  transactionType: 'PURCHASE' | 'TRANSFER' | 'WITHDRAWAL' | 'ONLINE_PAYMENT' | 'ATM';
  cardLast4: string;
  paymentMethod: 'CREDIT' | 'DEBIT' | 'WIRE' | 'CRYPTO_ONRAMP' | 'DIGITAL_WALLET';
  status: TransactionStatus;
  fraudProbability: number; // 0.00 to 1.00
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  fraudPattern?: string; // e.g. 'VELOCITY_ATTACK', 'IMPOSSIBLE_TRAVEL', etc.
  isSynthetic: boolean;
  shapValues?: ShapFeature[];
  userId?: string;
  merchantName?: string;
  channel?: string;
}

export interface TriggeredRule {
  ruleId: string;
  ruleName: string;
  description: string;
  severity: RiskLevel;
  scoreContribution: number;
  actualValue: string | number;
  expectedValue: string | number;
  evidence: string;
  category: 'VELOCITY' | 'AMOUNT' | 'LOCATION' | 'DEVICE' | 'MERCHANT' | 'BEHAVIORAL';
}

export interface ShapFactor {
  featureName: string;
  featureValue: string | number;
  shapValue: number; // Positive = pushes risk higher, Negative = lowers risk
  category: string;
  impactDescription: string;
  feature?: string;
  value?: number;
  description?: string;
}

export interface ShapFeature {
  feature: string;
  value: number;
  description?: string;
  category?: string;
  featureName?: string;
  featureValue?: string | number;
  shapValue?: number;
  impactDescription?: string;
}

export interface RiskScoreBreakdown {
  overallScore: number;
  riskLevel: RiskLevel;
  mlProbability: number;
  ruleScore: number;
  velocityScore: number;
  amountAnomalyScore: number;
  locationAnomalyScore: number;
  deviceRiskScore: number;
  ipRiskScore: number;
  merchantRiskScore: number;
  historicalSimilarityScore: number;
  behavioralDeviationScore: number;
  confidence: number;
  topRiskFactors: string[];
  shapFactors: ShapFactor[];
  triggeredRules: TriggeredRule[];
  calculatedAt: string;
  disclaimer: string;
}

export interface FraudAlert {
  id: string;
  transactionId: string;
  transaction: Transaction;
  riskScore: number;
  riskLevel: RiskLevel;
  triggeredRulesCount: number;
  topRuleName: string;
  status: 'UNRESOLVED' | 'ASSIGNED' | 'CONVERTED_TO_CASE' | 'DISMISSED';
  timestamp: string;
  assignedTo?: string;
  caseId?: string;
}

export interface InvestigationCase {
  id: string;
  title: string;
  linkedTransactionIds: string[];
  primaryTransaction: Transaction;
  assignedAnalyst: string;
  analystEmail: string;
  priority: Priority;
  status: CaseStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  notes: CaseNote[];
  evidenceList: CaseEvidence[];
  timeline: CaseEvent[];
  agentReport?: AgentInvestigationReport;
  analystDecision?: AnalystDecision;
  createdAt: string;
  updatedAt: string;
  auditLogs: AuditLogEntry[];
}

export interface CaseNote {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  isAutomated: boolean;
}

export interface CaseEvidence {
  id: string;
  type: 'RULE_TRIGGER' | 'SHAP_FEATURE' | 'HISTORICAL_CASE' | 'POLICY_MATCH' | 'GRAPH_CLUSTER' | 'USER_UPLOAD';
  title: string;
  description: string;
  confidence: number; // 0-1
  sourceReference: string;
  sourceUrl?: string;
  metadata?: Record<string, any>;
  verified: boolean;
}

export interface CaseEvent {
  id: string;
  timestamp: string;
  actor: string;
  eventType: string;
  description: string;
  details?: Record<string, any>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  previousState?: string;
  newState?: string;
}

export type AgentName =
  | 'Transaction Risk Agent'
  | 'Behavioral Analysis Agent'
  | 'Fraud Pattern Agent'
  | 'Historical Case Retrieval Agent'
  | 'Policy and Compliance Agent'
  | 'Evidence Validation Agent'
  | 'Investigation Report Agent'
  | 'Human Review Agent';

export interface AgentStepResult {
  agentName: AgentName;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  durationMs: number;
  summary: string;
  findings: string[];
  riskContribution: number;
  confidenceScore: number;
  extractedEntities?: string[];
  dataPayload?: Record<string, any>;
}

export interface AgentInvestigationReport {
  caseSummary: string;
  riskScore: number;
  riskLevel: RiskLevel;
  detectedFraudPatterns: string[];
  timeline: { time: string; event: string; tag: string }[];
  triggeredRules: TriggeredRule[];
  modelExplanations: {
    positiveRiskContributors: ShapFactor[];
    negativeRiskContributors: ShapFactor[];
    baselineRisk: number;
  };
  relatedEntities: {
    sharedDevices: string[];
    sharedIPs: string[];
    associatedAccounts: string[];
    flaggedMerchants: string[];
  };
  similarHistoricalCases: {
    caseId: string;
    similarityScore: number;
    description: string;
    outcome: string;
    relevance: string;
  }[];
  retrievedPolicyReferences: {
    documentId: string;
    documentTitle: string;
    clause: string;
    relevanceScore: number;
    guidelineAction: string;
  }[];
  evidenceConfidence: number; // 0 - 100
  recommendedNextAction: 'CONFIRM_FRAUD' | 'DISMISS_FALSE_POSITIVE' | 'ESCALATE_TO_SENIOR' | 'REQUEST_IDENTITY_VERIFICATION';
  limitations: string[];
  humanReviewRequirement: string;
  generatedAt: string;
  agentPipelineExecution: AgentStepResult[];
}

export interface AnalystDecision {
  decision: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'ESCALATED';
  reason: string;
  correctLabel: 0 | 1;
  analystId: string;
  analystName: string;
  modelPrediction: number;
  modelVersion: string;
  timestamp: string;
  feedbackComments?: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: 'REGULATION' | 'INTERNAL_POLICY' | 'HISTORICAL_PATTERN' | 'AML_KYC' | 'SOP';
  filename: string;
  fileSize: number;
  chunkCount: number;
  uploadedAt: string;
  uploadedBy: string;
  summary: string;
  tags: string[];
  chunks: KnowledgeChunk[];
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  metadata: {
    title: string;
    section?: string;
    keywords: string[];
  };
}

export interface RagSearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  category: string;
  content: string;
  score: number; // hybrid score
  denseScore: number;
  bm25Score: number;
  matchReason: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'CUSTOMER' | 'ACCOUNT' | 'CARD' | 'DEVICE' | 'IP' | 'MERCHANT' | 'LOCATION' | 'TRANSACTION' | 'USER';
  riskScore: number;
  isSuspicious?: boolean;
  metadata?: Record<string, any>;
  clusterId?: string;
  degree?: number;
  connections?: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string; // e.g., 'USED_DEVICE', 'TRANSACTED_AT', 'ASSOCIATED_WITH', 'ROUTED_THROUGH'
  weight: number;
  isSuspicious: boolean;
}

export interface GraphCluster {
  id: string;
  clusterId?: string;
  name: string;
  riskScore: number;
  nodeIds: string[];
  patternType: 'SHARED_DEVICE_RING' | 'SHARED_IP_FARM' | 'VELOCITY_SWARM' | 'MERCHANT_COLLUSION';
  description: string;
}

export interface FraudGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
}

export interface ModelMetrics {
  version: string;
  name: string;
  trainedOn: string;
  evaluationDate: string;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  prAuc: number;
  precisionAtK: { k: number; precision: number }[];
  falsePositiveRate: number;
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
  patternPerformance: {
    pattern: string;
    detected: number;
    total: number;
    accuracy: number;
  }[];
  thresholdComparison: {
    threshold: number;
    precision: number;
    recall: number;
    f1Score: number;
    alertsGenerated: number;
  }[];
  driftMetrics: {
    featureDriftDetected: boolean;
    dataDriftScore: number; // Kolmogorov-Smirnov test proxy
    predictionDriftScore: number;
    lastChecked: string;
  };
}

export interface OverviewMetrics {
  totalTransactions: number;
  suspiciousTransactions: number;
  confirmedFraudCases: number;
  pendingInvestigations: number;
  fraudDetectionRate: number; // percentage
  avgInvestigationTimeHours: number;
  modelPrecision: number;
  modelRecall: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  fraudPatternDistribution: {
    name: string;
    count: number;
    riskWeightedAmount: number;
  }[];
  recentAlerts: FraudAlert[];
  realTimeThroughputTps: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  title: string;
  organization: string;
  sessionExpiry: string;
  token: string;
}

export interface ReportData {
  timeRange: string;
  fraudTrend: { date: string; flaggedVolume: number; normalVolume: number; blockedAmount: number }[];
  volumeByChannel: { channel: string; volume: number; fraudCount: number; percentage: number }[];
  riskDistribution: { level: string; count: number; percentage: number; color: string }[];
  investigationOutcomes: { outcome: string; count: number; percentage: number }[];
  agentPerformance: { agent: string; accuracy: number; avgLatencyMs: number; executions: number }[];
  ragUsage: { queryCategory: string; queries: number; avgRelevance: number }[];
  highRiskLocations: { city: string; country: string; fraudCount: number; amount: number }[];
  highRiskDevices: { deviceType: string; os: string; fraudCount: number }[];
  clusterStatistics: { clusterName: string; size: number; riskScore: number; pattern: string }[];
}
