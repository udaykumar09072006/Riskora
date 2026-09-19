import { globalRuleEngine } from '../server/services/ruleEngine';
import { globalFraudScoringEngine } from '../server/services/fraudEngine';
import { globalRagEngine } from '../server/services/ragEngine';
import { globalStorage } from '../server/services/storage';
import { globalAgentOrchestrator } from '../server/services/agentEngine';
import { globalGraphEngine } from '../server/services/graphEngine';
import { Transaction } from '../src/types/fraud';

console.log('====================================================');
console.log('🧪 Running FraudShield AI Test Suite');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  // Test 1: Synthetic Dataset & Storage Seeding
  const allTx = globalStorage.getAllTransactions();
  assert(allTx.length >= 1000, `Storage seeded with >= 1000 transactions (Actual: ${allTx.length})`);

  // Test 2: Rule Engine Evaluation
  const testTx: Transaction = {
    id: 'TEST-TX-001',
    customerId: 'CUST-TEST',
    customerName: 'Test Cardholder',
    accountNumber: 'ACC-TEST-01',
    amount: 8500.00,
    currency: 'USD',
    merchant: 'Casino Royale Macau',
    merchantCategory: 'GAMBLING',
    merchantRiskScore: 92,
    location: {
      city: 'Macau',
      country: 'MO',
      lat: 22.1987,
      lon: 113.5439,
      ip: '185.220.101.5',
      vpnDetected: true
    },
    device: {
      deviceId: 'DEV-RING-779',
      deviceType: 'MOBILE',
      os: 'iOS 17',
      browser: 'Safari',
      isNewDevice: true,
      fingerprintHash: 'fp_ring_779'
    },
    timestamp: new Date().toISOString(),
    transactionType: 'PURCHASE',
    cardLast4: '0012',
    paymentMethod: 'CREDIT',
    status: 'APPROVED',
    fraudProbability: 0.9,
    riskScore: 95,
    riskLevel: 'CRITICAL',
    fraudPattern: 'SHARED_DEVICE_RING',
    isSynthetic: true
  };

  const triggeredRules = globalRuleEngine.evaluate(testTx, allTx);
  assert(triggeredRules.length >= 3, `Rule engine triggered expected anomalies (Count: ${triggeredRules.length})`);
  assert(triggeredRules.some(r => r.ruleId === 'RULE-002'), 'Rule-002 (Unusually Large Transaction) triggered');
  assert(triggeredRules.some(r => r.ruleId === 'RULE-006'), 'Rule-006 (Known VPN / Anonymizer) triggered');
  assert(triggeredRules.some(r => r.ruleId === 'RULE-007'), 'Rule-007 (High-Risk Merchant MCC) triggered');

  // Test 3: Fraud Scoring Engine & SHAP attributions
  const scoring = globalFraudScoringEngine.scoreTransaction(testTx, allTx);
  assert(scoring.overallScore >= 80, `Scoring engine computes CRITICAL risk (Actual: ${scoring.overallScore})`);
  assert(scoring.shapFactors.length >= 4, `SHAP factors generated (Count: ${scoring.shapFactors.length})`);
  assert(scoring.shapFactors.some(s => s.shapValue > 0), 'SHAP contains positive risk contributors');
  assert(scoring.disclaimer.includes('assistive'), 'Legal disclaimer included');

  // Test 4: RAG Hybrid Retrieval
  const ragResults = globalRagEngine.search('card testing micropayments authorization', 3);
  assert(ragResults.length > 0, `RAG returned citations for card-testing query (Count: ${ragResults.length})`);
  assert(ragResults[0].score > 0, `Top RAG result score > 0 (Actual: ${ragResults[0].score})`);
  assert(ragResults[0].documentTitle.includes('FinCEN'), `RAG matches verified FinCEN regulatory source`);

  // Test 5: Graph Engine Adjacency & Clusters
  const graph = globalGraphEngine.buildGraph([testTx, ...allTx.slice(0, 20)]);
  assert(graph.nodes.length > 0, `Graph generated nodes (Count: ${graph.nodes.length})`);
  assert(graph.edges.length > 0, `Graph generated edges (Count: ${graph.edges.length})`);
  assert(graph.clusters.length >= 1, `Syndicate clusters detected in network graph (Count: ${graph.clusters.length})`);

  // Test 6: Agentic Investigation Pipeline (8 Agents)
  const testCase = globalStorage.createCase({
    title: 'Automated Test Case',
    primaryTransaction: testTx,
    priority: 'CRITICAL'
  });

  const report = await globalAgentOrchestrator.investigateCase(testCase, allTx);
  assert(report.agentPipelineExecution.length === 8, `8 specialized agents executed in sequence (Count: ${report.agentPipelineExecution.length})`);
  assert(report.evidenceConfidence > 80, `Evidence confidence calculated (Actual: ${report.evidenceConfidence}%)`);
  assert(Boolean(report.caseSummary), 'Report contains synthesized case summary');
  assert(Boolean(report.humanReviewRequirement), 'Report enforces human review governance gate');

  console.log('\n====================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
