import { KnowledgeDocument, KnowledgeChunk, RagSearchResult } from '../../src/types/fraud';

// Clean text tokenizer for BM25
function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9_\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
}

// Pseudo-dense embedding vector simulator for deterministic hybrid vector search
function getVector(text: string, dim = 64): number[] {
  const tokens = tokenize(text);
  const vec = new Array(dim).fill(0);
  for (const t of tokens) {
    let hash = 0;
    for (let i = 0; i < t.length; i++) {
      hash = (hash * 31 + t.charCodeAt(i)) & 0xffffffff;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1;
  }
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

function cosineSimilarity(v1: number[], v2: number[]): number {
  let dot = 0;
  for (let i = 0; i < v1.length; i++) dot += v1[i] * v2[i];
  return Math.max(0, Math.min(1, dot));
}

export class RagEngine {
  private documents: Map<string, KnowledgeDocument> = new Map();
  private allChunks: KnowledgeChunk[] = [];
  private chunkVectors: Map<string, number[]> = new Map();

  constructor() {
    this.seedInitialKnowledge();
  }

  private seedInitialKnowledge() {
    // 1. FinCEN
    this.addDocument({
      id: 'DOC-FINCEN-2023',
      title: 'FinCEN Advisory FIN-2023-A001: Red Flags for Account Takeover & Card-Testing Attacks',
      category: 'REGULATION',
      filename: 'fincen_account_takeover_2023.pdf',
      fileSize: 485000,
      chunkCount: 3,
      uploadedAt: '2026-01-15T08:00:00Z',
      uploadedBy: 'Compliance Officer (Automated)',
      summary: 'Guidance on suspicious activity indicators relating to automated credential stuffing, rapid consecutive micro-charges, and sudden IP/device shifts.',
      tags: ['FINCEN', 'ACCOUNT_TAKEOVER', 'CARD_TESTING', 'AML'],
      chunks: [
        {
          id: 'CHK-FINCEN-01',
          documentId: 'DOC-FINCEN-2023',
          chunkIndex: 0,
          content: 'FinCEN Red Flag Indicator 4.1: Card-Testing Activity. Cybercriminals execute low-dollar authorizations (often $0.50 to $3.00) against e-commerce or donation endpoints to validate stolen PANs prior to high-value cash-out. Financial institutions should immediately freeze or flag card series exhibiting consecutive micropayments.',
          metadata: { title: 'FinCEN Red Flags - Card Testing', keywords: ['card testing', 'micropayments', 'pan', 'low dollar'] }
        },
        {
          id: 'CHK-FINCEN-02',
          documentId: 'DOC-FINCEN-2023',
          chunkIndex: 1,
          content: 'FinCEN Red Flag Indicator 7.3: Account Takeover via Hardware Disconnect. When a customer account switches from a registered physical mobile device to an unrecognized residential proxy or VPN with simultaneous rapid password/MFA resets and immediate high-value outgoing wires, investigate for SIM swap or session hijacking.',
          metadata: { title: 'FinCEN Red Flags - Account Takeover', keywords: ['account takeover', 'vpn', 'proxy', 'wire', 'mfa'] }
        },
        {
          id: 'CHK-FINCEN-03',
          documentId: 'DOC-FINCEN-2023',
          chunkIndex: 2,
          content: 'Filing Suspicious Activity Reports (SAR): Institutions must document entity linkages (shared IP addresses, device identifiers, and common beneficiary accounts) and retain logs for a minimum of 5 years pursuant to Bank Secrecy Act obligations.',
          metadata: { title: 'SAR Filing Requirements', keywords: ['sar', 'bsa', 'audit', 'compliance'] }
        }
      ]
    });

    // 2. FATF
    this.addDocument({
      id: 'DOC-FATF-R16',
      title: 'FATF Recommendation 16 & Crypto Asset Travel Rule Enforcement Guidelines',
      category: 'REGULATION',
      filename: 'fatf_r16_travel_rule.pdf',
      fileSize: 620000,
      chunkCount: 2,
      uploadedAt: '2026-02-01T10:00:00Z',
      uploadedBy: 'AML Director',
      summary: 'Standards for cross-border originator and beneficiary identification, high-risk merchant categories, and impossible travel sanction evasion.',
      tags: ['FATF', 'CRYPTO', 'CROSS_BORDER', 'SANCTIONS'],
      chunks: [
        {
          id: 'CHK-FATF-01',
          documentId: 'DOC-FATF-R16',
          chunkIndex: 0,
          content: 'FATF Guidance Section 28: Crypto-Asset Gateway Risks. Transfers routed through non-custodial mixers, rapid crypto on-ramps without tier-2 KYC, or exchanges domiciled in non-cooperative jurisdictions represent severe AML exposure requiring enhanced due diligence (EDD) prior to settlement.',
          metadata: { title: 'FATF Crypto Gateways', keywords: ['crypto', 'kyc', 'edd', 'aml', 'gateway'] }
        },
        {
          id: 'CHK-FATF-02',
          documentId: 'DOC-FATF-R16',
          chunkIndex: 1,
          content: 'FATF Guidance Section 34: Geo-velocity Sanctions Screening. Transactions originating from IP blocks geographically associated with sanctioned jurisdictions within hours of domestic transactions indicate potential proxy hopping to bypass OFAC/FATF controls.',
          metadata: { title: 'FATF Geo-velocity Sanctions', keywords: ['sanctions', 'ofac', 'geo-velocity', 'impossible travel'] }
        }
      ]
    });

    // 3. Internal SOP
    this.addDocument({
      id: 'DOC-SOP-SOC',
      title: 'Standard Operating Procedure: SOC Fraud Incident Triage & Human Review Escalation Matrix',
      category: 'SOP',
      filename: 'fraudshield_soc_sop_v2.pdf',
      fileSize: 310000,
      chunkCount: 2,
      uploadedAt: '2026-03-01T09:30:00Z',
      uploadedBy: 'Lead Fraud Architect',
      summary: 'Internal operational protocol defining mandatory analyst review steps for high-risk scores, shared device clusters, and temporary block procedures.',
      tags: ['SOP', 'TRIAGE', 'ESCALATION', 'HUMAN_REVIEW'],
      chunks: [
        {
          id: 'CHK-SOP-01',
          documentId: 'DOC-SOP-SOC',
          chunkIndex: 0,
          content: 'SOP Rule 3.2: Escalation to Senior Reviewer. Any transaction flagged with Risk Score >= 85 (CRITICAL) or exhibiting Multi-Account Hardware Collusion MUST NOT be closed as False Positive without approval from a Level 2 Analyst or Compliance Reviewer. Automated AI agents are advisory only.',
          metadata: { title: 'SOC Triage Escalation Protocol', keywords: ['escalation', 'risk score', 'hardware', 'false positive'] }
        },
        {
          id: 'CHK-SOP-02',
          documentId: 'DOC-SOP-SOC',
          chunkIndex: 1,
          content: 'SOP Rule 5.1: Customer Contact & Verification. When reviewing Velocity Attacks or Impossible Travel alerts, analyst must request out-of-band biometric or SMS confirmation before releasing provisional credit or unfreezing digital cards.',
          metadata: { title: 'Verification Protocols', keywords: ['velocity', 'impossible travel', 'out of band', 'sms'] }
        }
      ]
    });

    // 4. Historical Case Archive
    this.addDocument({
      id: 'DOC-HIST-CASES',
      title: 'Confirmed Historical Fraud Case Studies & Syndicate MO Database (2024-2025)',
      category: 'HISTORICAL_PATTERN',
      filename: 'historical_syndicate_cases.pdf',
      fileSize: 840000,
      chunkCount: 3,
      uploadedAt: '2026-01-20T14:00:00Z',
      uploadedBy: 'Special Investigations Unit (SIU)',
      summary: 'Retrospective analyses of confirmed fraudulent operations including Device Ring "Phantom-779" and Tor Botnet Velocity attacks.',
      tags: ['HISTORICAL_CASES', 'SYNDICATE', 'DEVICE_RING', 'INVESTIGATION'],
      chunks: [
        {
          id: 'CHK-HIST-01',
          documentId: 'DOC-HIST-CASES',
          chunkIndex: 0,
          content: 'Historical Case #CASE-2024-884 (Syndicate Phantom-779): A device cluster sharing fingerprint DEV-RING-779 rotated 24 stolen debit card credentials across 8 distinct customer accounts within 3 hours. Modus Operandi involved card testing at Shell Express followed by luxury purchases at jewelry and crypto merchants. Outcome: Confirmed Fraud, cards revoked, SAR filed.',
          metadata: { title: 'Case Study: Phantom-779 Device Ring', keywords: ['dev-ring-779', 'shared device', 'crypto', 'jewelry', 'shell express'] }
        },
        {
          id: 'CHK-HIST-02',
          documentId: 'DOC-HIST-CASES',
          chunkIndex: 1,
          content: 'Historical Case #CASE-2025-102 (Tor Exit Velocity Burst): Fraudster utilized IP 185.220.101.5 to issue 9 successive transfer requests under $1,000 to Western Union and Binance OTC within 18 minutes. Outcome: Blocked by Rule-001 (Velocity Burst) and Rule-006 (VPN/Proxy). Analyst confirmed unauthorized credential breach.',
          metadata: { title: 'Case Study: Tor Exit Velocity Burst', keywords: ['185.220.101.5', 'velocity', 'western union', 'binance', 'tor'] }
        },
        {
          id: 'CHK-HIST-03',
          documentId: 'DOC-HIST-CASES',
          chunkIndex: 2,
          content: 'Historical Case #CASE-2025-339 (Transcontinental Travel Anomaly): Customer account initiated login in Singapore at 14:10 SGT, followed by a $3,200 transaction in Frankfurt at 15:40 SGT (9,500 km displacement in 90 minutes). Outcome: Confirmed Account Takeover; physical cardholder was verified still residing in Singapore.',
          metadata: { title: 'Case Study: Impossible Travel Account Takeover', keywords: ['impossible travel', 'displacement', 'singapore', 'frankfurt', 'takeover'] }
        }
      ]
    });
  }

  public addDocument(doc: KnowledgeDocument): KnowledgeDocument {
    this.documents.set(doc.id, doc);
    for (const chunk of doc.chunks) {
      this.allChunks.push(chunk);
      this.chunkVectors.set(chunk.id, getVector(`${chunk.metadata.title} ${chunk.content}`));
    }
    return doc;
  }

  public getDocuments(): KnowledgeDocument[] {
    return Array.from(this.documents.values());
  }

  public deleteDocument(docId: string): boolean {
    if (!this.documents.has(docId)) return false;
    this.documents.delete(docId);
    this.allChunks = this.allChunks.filter(c => c.documentId !== docId);
    return true;
  }

  /**
   * Hybrid search: Combines BM25 lexical relevance + Dense Vector Cosine Similarity
   */
  public search(query: string, topK = 4): RagSearchResult[] {
    if (!query || query.trim().length === 0) return [];

    const queryTokens = tokenize(query);
    const queryVec = getVector(query);

    const scoredResults: {
      chunk: KnowledgeChunk;
      bm25Score: number;
      denseScore: number;
      hybridScore: number;
    }[] = [];

    for (const chunk of this.allChunks) {
      const chunkTokens = tokenize(`${chunk.metadata.title} ${chunk.content}`);
      
      // BM25 term frequency matching
      let matchCount = 0;
      for (const qToken of queryTokens) {
        if (chunkTokens.includes(qToken)) matchCount += 1;
      }
      const bm25Score = queryTokens.length > 0 ? (matchCount / queryTokens.length) : 0;

      // Dense cosine vector similarity
      const chunkVec = this.chunkVectors.get(chunk.id) || getVector(chunk.content);
      const denseScore = cosineSimilarity(queryVec, chunkVec);

      // Hybrid combination with reranking weight
      const hybridScore = (bm25Score * 0.45) + (denseScore * 0.55);

      if (hybridScore > 0.08 || bm25Score > 0) {
        scoredResults.push({ chunk, bm25Score, denseScore, hybridScore });
      }
    }

    scoredResults.sort((a, b) => b.hybridScore - a.hybridScore);

    const results: RagSearchResult[] = scoredResults.slice(0, topK).map(res => {
      const parentDoc = this.documents.get(res.chunk.documentId);
      return {
        chunkId: res.chunk.id,
        documentId: res.chunk.documentId,
        documentTitle: parentDoc ? parentDoc.title : 'Internal Knowledge Archive',
        category: parentDoc ? parentDoc.category : 'REGULATION',
        content: res.chunk.content,
        score: Number(res.hybridScore.toFixed(3)),
        denseScore: Number(res.denseScore.toFixed(3)),
        bm25Score: Number(res.bm25Score.toFixed(3)),
        matchReason: res.bm25Score > 0.3 
          ? `High lexical keyword concordance + semantic vector alignment (${(res.hybridScore * 100).toFixed(0)}%)` 
          : `Dense semantic similarity matching fraud typology (${(res.denseScore * 100).toFixed(0)}%)`
      };
    });

    return results;
  }
}

export const globalRagEngine = new RagEngine();
