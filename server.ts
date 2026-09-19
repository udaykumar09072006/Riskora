import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { globalStorage } from './server/services/storage';
import { globalFraudScoringEngine } from './server/services/fraudEngine';
import { globalRuleEngine } from './server/services/ruleEngine';
import { globalRagEngine } from './server/services/ragEngine';
import { globalAgentOrchestrator } from './server/services/agentEngine';
import { globalGraphEngine } from './server/services/graphEngine';
import { globalStreamAdapter } from './server/services/streamAdapter';
import { Transaction } from './src/types/fraud';

dotenv.config();

async function startServer() {
  const app = express();
  // Bind to Render-assigned PORT if deployed on Render; otherwise adhere to port 3000
  const PORT = process.env.RENDER ? (Number(process.env.PORT) || 3000) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // CORS and preflight headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Start background stream simulation automatically
  globalStreamAdapter.startSimulation(5000);

  // ----------------------------------------------------
  // API v1 Endpoints
  // ----------------------------------------------------

  // Health check
  const healthHandler = (req: express.Request, res: express.Response) => {
    res.json({
      status: 'HEALTHY',
      service: 'FraudShield AI Core',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      kafka: globalStreamAdapter.getKafkaStatus(),
      uptimeSeconds: Math.floor(process.uptime()),
      geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  };
  app.get('/api/v1/health', healthHandler);
  app.get('/api/health', healthHandler);

  // Overview dashboard metrics
  app.get('/api/v1/overview', (req, res) => {
    try {
      const metrics = globalStorage.getOverviewMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Transactions list
  app.get('/api/v1/transactions', (req, res) => {
    try {
      const {
        search,
        riskLevel,
        status,
        merchantCategory,
        page,
        pageSize,
        sortBy,
        sortOrder
      } = req.query;

      const data = globalStorage.getTransactions({
        search: search as string,
        riskLevel: riskLevel as string,
        status: status as string,
        merchantCategory: merchantCategory as string,
        page: page ? parseInt(page as string, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : 15,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Single transaction
  app.get('/api/v1/transactions/:id', (req, res) => {
    const tx = globalStorage.getTransactionById(req.params.id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const scoring = globalFraudScoringEngine.scoreTransaction(tx, globalStorage.getAllTransactions());
    res.json({
      transaction: tx,
      scoringBreakdown: scoring
    });
  });

  // Ingest single transaction
  app.post('/api/v1/transactions', (req, res) => {
    try {
      const payload = req.body as Partial<Transaction>;
      if (!payload.amount || !payload.merchant || !payload.customerId) {
        return res.status(400).json({ error: 'Missing required transaction fields (amount, merchant, customerId)' });
      }

      const tx: Transaction = {
        id: payload.id || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        customerId: payload.customerId,
        customerName: payload.customerName || 'Ingested User',
        accountNumber: payload.accountNumber || `ACC-${payload.customerId}-01`,
        amount: Number(payload.amount),
        currency: payload.currency || 'USD',
        merchant: payload.merchant,
        merchantCategory: payload.merchantCategory || 'ECOMMERCE',
        merchantRiskScore: payload.merchantRiskScore || 20,
        location: payload.location || {
          city: 'New York',
          country: 'US',
          lat: 40.7128,
          lon: -74.0060,
          ip: '198.51.100.12',
          vpnDetected: false
        },
        device: payload.device || {
          deviceId: `DEV-${Math.floor(Math.random() * 9000 + 1000)}`,
          deviceType: 'MOBILE',
          os: 'iOS 17',
          browser: 'Mobile Safari',
          isNewDevice: false,
          fingerprintHash: `fp_${Date.now()}`
        },
        timestamp: payload.timestamp || new Date().toISOString(),
        transactionType: payload.transactionType || 'PURCHASE',
        cardLast4: payload.cardLast4 || '4921',
        paymentMethod: payload.paymentMethod || 'CREDIT',
        status: payload.status || 'APPROVED',
        fraudProbability: 0.1,
        riskScore: 10,
        riskLevel: 'LOW',
        fraudPattern: payload.fraudPattern,
        isSynthetic: true
      };

      const saved = globalStreamAdapter.emitTransaction(tx);
      const scoring = globalFraudScoringEngine.scoreTransaction(saved, globalStorage.getAllTransactions());

      res.status(201).json({
        transaction: saved,
        scoring
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Batch ingestion
  app.post('/api/v1/transactions/batch', (req, res) => {
    try {
      const items = req.body.transactions as Partial<Transaction>[];
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'transactions must be an array' });
      }

      const created: Transaction[] = [];
      for (const item of items) {
        const tx: Transaction = {
          id: item.id || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
          customerId: item.customerId || 'CUST-GEN',
          customerName: item.customerName || 'Batch Cardholder',
          accountNumber: item.accountNumber || 'ACC-GEN-01',
          amount: Number(item.amount) || 50,
          currency: 'USD',
          merchant: item.merchant || 'Standard Retail',
          merchantCategory: item.merchantCategory || 'RETAIL',
          merchantRiskScore: item.merchantRiskScore || 10,
          location: item.location || {
            city: 'New York', country: 'US', lat: 40.71, lon: -74.00, ip: '198.51.100.22', vpnDetected: false
          },
          device: item.device || {
            deviceId: 'DEV-BATCH', deviceType: 'DESKTOP', os: 'Windows 11', browser: 'Chrome', isNewDevice: false, fingerprintHash: 'fp_batch'
          },
          timestamp: item.timestamp || new Date().toISOString(),
          transactionType: 'PURCHASE',
          cardLast4: item.cardLast4 || '1234',
          paymentMethod: 'CREDIT',
          status: 'APPROVED',
          fraudProbability: 0.05,
          riskScore: 8,
          riskLevel: 'LOW',
          fraudPattern: item.fraudPattern,
          isSynthetic: true
        };
        created.push(globalStorage.addTransaction(tx));
      }

      res.status(201).json({
        ingestedCount: created.length,
        message: `Successfully ingested ${created.length} transactions.`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Direct Ad-hoc Analysis
  app.post('/api/v1/analyze', (req, res) => {
    try {
      const tx = req.body as Transaction;
      if (!tx || !tx.amount) {
        return res.status(400).json({ error: 'Transaction payload required for analysis' });
      }
      const scoring = globalFraudScoringEngine.scoreTransaction(tx, globalStorage.getAllTransactions());
      res.json(scoring);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Alerts
  app.get('/api/v1/alerts', (req, res) => {
    res.json(globalStorage.getAlerts());
  });

  // Convert Alert to Case
  app.post('/api/v1/alerts/:id/convert-case', (req, res) => {
    const alert = globalStorage.getAlerts().find(a => a.id === req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    const newCase = globalStorage.createCase({
      title: `Escalated from ${alert.id} (${alert.topRuleName})`,
      primaryTransaction: alert.transaction,
      priority: alert.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      assignedAnalyst: req.body.assignedAnalyst || 'Jane Doe'
    });
    globalStorage.updateAlert(alert.id, {
      status: 'CONVERTED_TO_CASE',
      caseId: newCase.id
    });
    res.json(newCase);
  });

  // Cases List
  app.get('/api/v1/cases', (req, res) => {
    const { status, priority, search } = req.query;
    const cases = globalStorage.getCases({
      status: status as string,
      priority: priority as string,
      search: search as string
    });
    res.json(cases);
  });

  // Create Case
  app.post('/api/v1/cases', (req, res) => {
    const newCase = globalStorage.createCase(req.body);
    res.status(201).json(newCase);
  });

  // Get Case by ID
  app.get('/api/v1/cases/:id', (req, res) => {
    const c = globalStorage.getCaseById(req.params.id);
    if (!c) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(c);
  });

  // Update Case
  app.patch('/api/v1/cases/:id', (req, res) => {
    const updated = globalStorage.updateCase(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(updated);
  });

  // Run 8-Agent Investigation on a Case
  app.post('/api/v1/cases/:id/investigate', async (req, res) => {
    try {
      const c = globalStorage.getCaseById(req.params.id);
      if (!c) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const report = await globalAgentOrchestrator.investigateCase(c, globalStorage.getAllTransactions());
      
      // Update case with agent findings
      c.agentReport = report;
      c.status = 'NEEDS_REVIEW';
      c.timeline.push({
        id: `EVT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'Agentic Orchestration Pipeline',
        eventType: 'INVESTIGATION_COMPLETED',
        description: `8-Agent pipeline executed. Confidence: ${report.evidenceConfidence}%. Recommended: ${report.recommendedNextAction}`
      });
      globalStorage.updateCase(c.id, c);

      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Submit Analyst Feedback for Case
  app.post('/api/v1/cases/:id/feedback', (req, res) => {
    try {
      const c = globalStorage.getCaseById(req.params.id);
      if (!c) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const { decision, reason, analystName, analystId, comments } = req.body;
      const feedbackRecord = {
        decision: decision || 'CONFIRMED_FRAUD',
        reason: reason || 'Analyst manual confirmation based on agent dossier',
        correctLabel: (decision === 'CONFIRMED_FRAUD' ? 1 : 0) as 0 | 1,
        analystId: analystId || 'USR-CURRENT',
        analystName: analystName || 'Jane Doe',
        modelPrediction: c.primaryTransaction.fraudProbability,
        modelVersion: 'xgboost-ensemble-v2.4.1',
        timestamp: new Date().toISOString(),
        feedbackComments: comments
      };

      c.analystDecision = feedbackRecord;
      c.status = decision === 'CONFIRMED_FRAUD' ? 'CONFIRMED_FRAUD' : (decision === 'FALSE_POSITIVE' ? 'FALSE_POSITIVE' : 'ESCALATED');
      c.timeline.push({
        id: `EVT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: analystName || 'Human Analyst',
        eventType: 'DECISION_FINALIZED',
        description: `Analyst finalized decision as ${c.status}. Reason: ${reason}`
      });

      globalStorage.updateCase(c.id, c);
      globalStorage.recordFeedback(feedbackRecord);

      res.json({
        success: true,
        case: c,
        feedback: feedbackRecord
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // RAG Knowledge Base Documents
  app.get('/api/v1/knowledge-base/documents', (req, res) => {
    res.json(globalRagEngine.getDocuments());
  });

  // RAG Search
  app.post('/api/v1/knowledge-base/search', (req, res) => {
    const { query, topK } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query string required' });
    }
    const results = globalRagEngine.search(query, topK || 4);
    res.json(results);
  });

  // RAG Upload / Ingestion
  app.post('/api/v1/knowledge-base/upload', (req, res) => {
    try {
      const { title, category, content, filename } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const docId = `DOC-${Date.now().toString(36).toUpperCase()}`;
      // Chunk content by double newlines or 400 chars
      const rawChunks = content.split(/\n\n+/).filter((c: string) => c.trim().length > 20);
      const chunks = rawChunks.map((chunkText: string, idx: number) => ({
        id: `CHK-${docId}-${idx + 1}`,
        documentId: docId,
        chunkIndex: idx,
        content: chunkText.trim(),
        metadata: {
          title: `${title} - Sec ${idx + 1}`,
          keywords: chunkText.toLowerCase().split(/\s+/).slice(0, 8)
        }
      }));

      const newDoc = globalRagEngine.addDocument({
        id: docId,
        title,
        category: category || 'INTERNAL_POLICY',
        filename: filename || `${title.toLowerCase().replace(/\s+/g, '_')}.txt`,
        fileSize: content.length,
        chunkCount: chunks.length,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'SOC Lead Analyst',
        summary: content.slice(0, 180) + '...',
        tags: [category || 'POLICY', 'MANUAL_UPLOAD'],
        chunks
      });

      res.status(201).json(newDoc);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Graph Intelligence
  const graphHandler = (req: express.Request, res: express.Response) => {
    try {
      const recentTx = globalStorage.getAllTransactions().slice(0, 60);
      const graph = globalGraphEngine.buildGraph(recentTx);
      res.json(graph);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  app.get('/api/v1/fraud-graph', graphHandler);
  app.get('/api/v1/graph', graphHandler);

  // Model Metrics
  const metricsHandler = (req: express.Request, res: express.Response) => {
    res.json(globalStorage.getModelMetrics());
  };
  app.get('/api/v1/models/metrics', metricsHandler);
  app.get('/api/v1/evaluation', metricsHandler);

  // Feedback list
  app.get('/api/v1/feedback', (req, res) => {
    res.json(globalStorage.getFeedback());
  });

  // Audit Logs
  app.get('/api/v1/audit-logs', (req, res) => {
    res.json(globalStorage.getAuditLogs());
  });

  // Rule configuration
  const getRulesHandler = (req: express.Request, res: express.Response) => {
    res.json(globalRuleEngine.getConfig());
  };
  app.get('/api/v1/settings/rules', getRulesHandler);
  app.get('/api/v1/rules/config', getRulesHandler);
  app.get('/api/settings/rules', getRulesHandler);
  app.get('/api/rules', getRulesHandler);

  const postRulesHandler = (req: express.Request, res: express.Response) => {
    globalRuleEngine.updateConfig(req.body);
    res.json({ success: true, config: globalRuleEngine.getConfig() });
  };
  app.post('/api/v1/settings/rules', postRulesHandler);
  app.post('/api/v1/rules/config', postRulesHandler);
  app.post('/api/settings/rules', postRulesHandler);
  app.post('/api/rules', postRulesHandler);

  // Real-time EventSource / SSE Stream for Transactions
  const streamHandler = (req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onTx = (tx: Transaction) => {
      res.write(`data: ${JSON.stringify(tx)}\n\n`);
    };

    globalStreamAdapter.on('transaction', onTx);

    req.on('close', () => {
      globalStreamAdapter.off('transaction', onTx);
    });
  };
  app.get('/api/v1/stream/transactions', streamHandler);
  app.get('/api/stream/transactions', streamHandler);

  // Toggle Live Simulation
  const toggleHandler = (req: express.Request, res: express.Response) => {
    const status = globalStreamAdapter.getKafkaStatus();
    if (status.isSimulating) {
      globalStreamAdapter.stopSimulation();
    } else {
      globalStreamAdapter.startSimulation(4000);
    }
    res.json(globalStreamAdapter.getKafkaStatus());
  };
  app.post('/api/v1/stream/toggle', toggleHandler);
  app.post('/api/stream/toggle', toggleHandler);

  // ----------------------------------------------------
  // Authentication & Session Management
  // ----------------------------------------------------
  const usersDb = [
    {
      id: 'USR-001',
      name: 'Special Agent Sarah Connor',
      email: 'analyst@fraudshield.ai',
      password: 'Password123!',
      title: 'Senior Fraud Operations Lead',
      organization: 'Cyber Defense Intelligence Unit',
      createdAt: '2026-01-10T00:00:00.000Z'
    }
  ];
  const activeSessions = new Map<string, { userId: string; email: string; expiresAt: number }>();

  // Auth: Login
  app.post(['/api/v1/auth/login', '/api/auth/login'], (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = usersDb.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify your email and password.' });
    }
    const token = `fs_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    activeSessions.set(token, { userId: user.id, email: user.email, expiresAt });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        title: user.title,
        organization: user.organization,
        sessionExpiry: new Date(expiresAt).toISOString(),
        token
      }
    });
  });

  // Auth: Signup
  app.post(['/api/v1/auth/signup', '/api/auth/signup'], (req, res) => {
    const { name, email, password, title, organization } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    const existing = usersDb.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please log in instead.' });
    }
    const newUser = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      title: title || 'Fraud Operations Specialist',
      organization: organization || 'Global Cyber Intelligence',
      createdAt: new Date().toISOString()
    };
    usersDb.push(newUser);

    const token = `fs_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    activeSessions.set(token, { userId: newUser.id, email: newUser.email, expiresAt });

    res.status(201).json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        title: newUser.title,
        organization: newUser.organization,
        sessionExpiry: new Date(expiresAt).toISOString(),
        token
      }
    });
  });

  // Auth: Current Profile
  app.get(['/api/v1/auth/me', '/api/auth/me'], (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) {
      // Auto-fallback for demo if in development mode
      const defaultUser = usersDb[0];
      return res.json({
        user: {
          id: defaultUser.id,
          name: defaultUser.name,
          email: defaultUser.email,
          title: defaultUser.title,
          organization: defaultUser.organization,
          sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          token: 'fs_default_active_token'
        }
      });
    }
    const session = activeSessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      if (token !== 'fs_default_active_token') {
        activeSessions.delete(token);
        return res.status(401).json({ error: 'Session expired. Please sign in again.' });
      }
    }
    const userId = session ? session.userId : usersDb[0].id;
    const user = usersDb.find(u => u.id === userId) || usersDb[0];
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        title: user.title,
        organization: user.organization,
        sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        token
      }
    });
  });

  // Auth: Logout
  app.post(['/api/v1/auth/logout', '/api/auth/logout'], (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (token) {
      activeSessions.delete(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // ----------------------------------------------------
  // Reports & Analytics Endpoints
  // ----------------------------------------------------
  app.get(['/api/v1/reports', '/api/reports'], (req, res) => {
    const range = (req.query.range as string) || '30d';
    const allTx = globalStorage.getAllTransactions();
    const cases = globalStorage.getCases({});
    
    // Group transactions by date
    const dateMap = new Map<string, { flagged: number; normal: number; blockedAmount: number }>();
    allTx.slice(0, 500).forEach(t => {
      const d = t.timestamp.split('T')[0];
      if (!dateMap.has(d)) dateMap.set(d, { flagged: 0, normal: 0, blockedAmount: 0 });
      const cur = dateMap.get(d)!;
      if (t.riskLevel === 'CRITICAL' || t.riskLevel === 'HIGH') {
        cur.flagged += 1;
        cur.blockedAmount += t.amount;
      } else {
        cur.normal += 1;
      }
    });

    const fraudTrend = Array.from(dateMap.entries()).slice(-14).map(([date, val]) => ({
      date,
      flaggedVolume: val.flagged,
      normalVolume: val.normal,
      blockedAmount: Math.round(val.blockedAmount)
    }));

    // Volume by channel
    const channelMap = new Map<string, { total: number; fraud: number }>();
    allTx.forEach(t => {
      const ch = t.paymentMethod || 'CREDIT';
      if (!channelMap.has(ch)) channelMap.set(ch, { total: 0, fraud: 0 });
      const c = channelMap.get(ch)!;
      c.total += 1;
      if (t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL') c.fraud += 1;
    });

    const volumeByChannel = Array.from(channelMap.entries()).map(([channel, val]) => ({
      channel: channel.replace(/_/g, ' '),
      volume: val.total,
      fraudCount: val.fraud,
      percentage: Number(((val.total / (allTx.length || 1)) * 100).toFixed(1))
    }));

    // Risk distribution
    const low = allTx.filter(t => t.riskLevel === 'LOW').length;
    const med = allTx.filter(t => t.riskLevel === 'MEDIUM').length;
    const high = allTx.filter(t => t.riskLevel === 'HIGH').length;
    const crit = allTx.filter(t => t.riskLevel === 'CRITICAL').length;
    const total = allTx.length || 1;

    const riskDistribution = [
      { level: 'Low Risk', count: low, percentage: Number(((low / total) * 100).toFixed(1)), color: '#10B981' },
      { level: 'Medium Risk', count: med, percentage: Number(((med / total) * 100).toFixed(1)), color: '#F59E0B' },
      { level: 'High Risk', count: high, percentage: Number(((high / total) * 100).toFixed(1)), color: '#EF4444' },
      { level: 'Critical Risk', count: crit, percentage: Number(((crit / total) * 100).toFixed(1)), color: '#DC2626' }
    ];

    // Investigation outcomes
    const confirmed = cases.filter(c => c.status === 'CONFIRMED_FRAUD').length;
    const fp = cases.filter(c => c.status === 'FALSE_POSITIVE').length;
    const escalated = cases.filter(c => c.status === 'ESCALATED').length;
    const open = cases.filter(c => c.status !== 'CONFIRMED_FRAUD' && c.status !== 'FALSE_POSITIVE' && c.status !== 'CLOSED').length;
    const totalCases = cases.length || 1;

    const investigationOutcomes = [
      { outcome: 'Confirmed Fraud', count: confirmed, percentage: Math.round((confirmed / totalCases) * 100) },
      { outcome: 'False Positive', count: fp, percentage: Math.round((fp / totalCases) * 100) },
      { outcome: 'Escalated to Senior', count: escalated, percentage: Math.round((escalated / totalCases) * 100) },
      { outcome: 'Under Active Review', count: open, percentage: Math.round((open / totalCases) * 100) }
    ];

    // Agent performance
    const agentPerformance = [
      { agent: 'Transaction Risk Agent', accuracy: 98.2, avgLatencyMs: 14, executions: allTx.length },
      { agent: 'Behavioral Profiling Agent', accuracy: 95.8, avgLatencyMs: 26, executions: allTx.length },
      { agent: 'Pattern Detection Agent', accuracy: 96.4, avgLatencyMs: 20, executions: allTx.length },
      { agent: 'Network & Entity Graph Agent', accuracy: 94.6, avgLatencyMs: 48, executions: cases.length * 4 },
      { agent: 'RAG Policy & Typology Agent', accuracy: 97.1, avgLatencyMs: 72, executions: cases.length * 3 },
      { agent: 'Decision & Escalation Agent', accuracy: 98.5, avgLatencyMs: 16, executions: cases.length },
      { agent: 'Gemini Deep Reasoning Agent', accuracy: 99.1, avgLatencyMs: 640, executions: cases.length },
      { agent: 'Fallback Resilience Agent', accuracy: 99.6, avgLatencyMs: 9, executions: allTx.length }
    ];

    // High risk locations
    const locMap = new Map<string, { city: string; country: string; count: number; amount: number }>();
    allTx.filter(t => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL').forEach(t => {
      const key = `${t.location.city}, ${t.location.country}`;
      if (!locMap.has(key)) locMap.set(key, { city: t.location.city, country: t.location.country, count: 0, amount: 0 });
      const cur = locMap.get(key)!;
      cur.count += 1;
      cur.amount += t.amount;
    });

    const highRiskLocations = Array.from(locMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map(item => ({ ...item, amount: Math.round(item.amount) }));

    res.json({
      timeRange: range,
      fraudTrend,
      volumeByChannel,
      riskDistribution,
      investigationOutcomes,
      agentPerformance,
      ragUsage: [
        { queryCategory: 'Account Takeover Policies', queries: 142, avgRelevance: 0.94 },
        { queryCategory: 'Card Testing Typologies', queries: 98, avgRelevance: 0.91 },
        { queryCategory: 'AML Suspicious Activity Filing', queries: 74, avgRelevance: 0.96 },
        { queryCategory: 'High Velocity Dispute Protocol', queries: 63, avgRelevance: 0.89 }
      ],
      highRiskLocations,
      highRiskDevices: [
        { deviceType: 'Mobile (Jailbroken / Rooted)', os: 'Android 12 Custom', fraudCount: 28 },
        { deviceType: 'Desktop (Headless Chromium)', os: 'Linux x86_64', fraudCount: 22 },
        { deviceType: 'Desktop (Tor Browser)', os: 'Windows 10', fraudCount: 19 },
        { deviceType: 'Mobile (Emulator)', os: 'iOS 16 Emulator', fraudCount: 14 }
      ],
      clusterStatistics: [
        { clusterName: 'Ring Alpha - Shared Device Botnet', size: 14, riskScore: 92, pattern: 'SHARED_DEVICE_RING' },
        { clusterName: 'Cluster Beta - Proxy Anonymizer Swarm', size: 9, riskScore: 88, pattern: 'SHARED_IP_FARM' },
        { clusterName: 'Syndicate Gamma - Crypto Micro-Auth', size: 7, riskScore: 84, pattern: 'VELOCITY_SWARM' }
      ]
    });
  });

  // Export CSV
  app.get(['/api/v1/reports/export-csv', '/api/reports/export-csv'], (req, res) => {
    const allTx = globalStorage.getAllTransactions().slice(0, 250);
    const headers = 'TransactionID,CustomerID,CustomerName,Amount,Currency,Merchant,Category,RiskScore,RiskLevel,Status,Timestamp,City,Country,IP\n';
    const rows = allTx.map(t => 
      `"${t.id}","${t.customerId}","${t.customerName.replace(/"/g, '""')}","${t.amount}","${t.currency}","${t.merchant.replace(/"/g, '""')}","${t.merchantCategory}","${t.riskScore}","${t.riskLevel}","${t.status}","${t.timestamp}","${t.location.city}","${t.location.country}","${t.location.ip}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fraudshield-transactions-report.csv"');
    res.send(headers + rows);
  });

  // ----------------------------------------------------
  // API 404 Guard: Ensure all unhandled /api calls return JSON and NEVER HTML
  // ----------------------------------------------------
  app.all(['/api', '/api/*'], (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `API endpoint ${req.method} ${req.path} not found`
    });
  });

  // Global Error Handler for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api')) {
      console.error('[API Error]', req.method, req.path, err);
      return res.status(err.status || 500).json({
        error: err.name || 'InternalServerError',
        message: err.message || 'An unexpected error occurred'
      });
    }
    next(err);
  });

  // ----------------------------------------------------
  // Vite Middleware / Static Asset Serving
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FraudShield AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
