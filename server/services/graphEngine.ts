import { Transaction, GraphNode, GraphEdge, FraudGraphData } from '../../src/types/fraud';

export class GraphEngine {
  /**
   * Constructs an entity network graph from a set of transactions.
   */
  public buildGraph(transactions: Transaction[]): FraudGraphData {
    const nodeMap = new Map<string, GraphNode>();
    const edgeList: GraphEdge[] = [];
    const edgeKeySet = new Set<string>();

    const addNode = (node: GraphNode) => {
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, node);
      } else {
        // Upgrade risk if higher
        const existing = nodeMap.get(node.id)!;
        if (node.riskScore > existing.riskScore) {
          existing.riskScore = node.riskScore;
          existing.isSuspicious = existing.isSuspicious || node.isSuspicious;
        }
      }
    };

    const addEdge = (source: string, target: string, relation: string, weight = 1, isSuspicious = false) => {
      const edgeKey = `${source}->${target}:${relation}`;
      if (!edgeKeySet.has(edgeKey)) {
        edgeKeySet.add(edgeKey);
        edgeList.push({
          id: `EDGE-${edgeList.length + 1}`,
          source,
          target,
          relation,
          weight,
          isSuspicious
        });
      }
    };

    // Tracking for multi-account rings
    const deviceToCustomers = new Map<string, Set<string>>();
    const ipToCustomers = new Map<string, Set<string>>();

    for (const tx of transactions) {
      // 1. Transaction Node
      const isTxSuspicious = tx.riskLevel === 'HIGH' || tx.riskLevel === 'CRITICAL';
      addNode({
        id: tx.id,
        label: `${tx.id} ($${tx.amount.toFixed(0)})`,
        type: 'TRANSACTION',
        riskScore: tx.riskScore,
        isSuspicious: isTxSuspicious,
        metadata: { amount: tx.amount, timestamp: tx.timestamp, status: tx.status }
      });

      // 2. Customer Node
      addNode({
        id: tx.customerId,
        label: tx.customerName,
        type: 'CUSTOMER',
        riskScore: isTxSuspicious ? tx.riskScore : 15,
        isSuspicious: isTxSuspicious,
        metadata: { customerId: tx.customerId }
      });
      addEdge(tx.customerId, tx.id, 'INITIATED', 1, isTxSuspicious);

      // 3. Account Node
      addNode({
        id: tx.accountNumber,
        label: tx.accountNumber,
        type: 'ACCOUNT',
        riskScore: isTxSuspicious ? tx.riskScore - 5 : 10,
        isSuspicious: isTxSuspicious,
        metadata: { customerId: tx.customerId }
      });
      addEdge(tx.customerId, tx.accountNumber, 'OWNS_ACCOUNT', 1, false);
      addEdge(tx.accountNumber, tx.id, 'FUNDED_FROM', 1, isTxSuspicious);

      // 4. Card Node
      const cardId = `CARD-****-${tx.cardLast4}`;
      addNode({
        id: cardId,
        label: `Card ending ${tx.cardLast4}`,
        type: 'CARD',
        riskScore: tx.fraudPattern === 'CARD_TESTING' ? 88 : (isTxSuspicious ? 65 : 10),
        isSuspicious: tx.fraudPattern === 'CARD_TESTING' || isTxSuspicious,
        metadata: { cardLast4: tx.cardLast4 }
      });
      addEdge(tx.customerId, cardId, 'HOLDS_CARD', 1, false);
      addEdge(cardId, tx.id, 'USED_FOR_PAYMENT', 1, isTxSuspicious);

      // 5. Device Node
      const devId = tx.device.deviceId;
      if (!deviceToCustomers.has(devId)) deviceToCustomers.set(devId, new Set());
      deviceToCustomers.get(devId)!.add(tx.customerId);

      const isDevSuspicious = devId.includes('RING') || (deviceToCustomers.get(devId)?.size || 0) > 1 || isTxSuspicious;
      addNode({
        id: devId,
        label: `${devId} (${tx.device.os})`,
        type: 'DEVICE',
        riskScore: devId.includes('RING') ? 95 : (isDevSuspicious ? 75 : 12),
        isSuspicious: isDevSuspicious,
        metadata: { os: tx.device.os, browser: tx.device.browser }
      });
      addEdge(tx.id, devId, 'TRANSACTED_ON_DEVICE', 1, isDevSuspicious);

      // 6. IP Node
      const ipId = `IP-${tx.location.ip}`;
      if (!ipToCustomers.has(tx.location.ip)) ipToCustomers.set(tx.location.ip, new Set());
      ipToCustomers.get(tx.location.ip)!.add(tx.customerId);

      const isIpSuspicious = tx.location.vpnDetected || (ipToCustomers.get(tx.location.ip)?.size || 0) > 1 || isTxSuspicious;
      addNode({
        id: ipId,
        label: tx.location.ip,
        type: 'IP',
        riskScore: tx.location.vpnDetected ? 85 : (isIpSuspicious ? 70 : 8),
        isSuspicious: isIpSuspicious,
        metadata: { vpnDetected: tx.location.vpnDetected, city: tx.location.city }
      });
      addEdge(tx.id, ipId, 'ROUTED_THROUGH_IP', 1, isIpSuspicious);

      // 7. Merchant Node
      const merchantId = `MERC-${tx.merchant.replace(/\s+/g, '_')}`;
      addNode({
        id: merchantId,
        label: tx.merchant,
        type: 'MERCHANT',
        riskScore: tx.merchantRiskScore,
        isSuspicious: tx.merchantRiskScore > 65,
        metadata: { category: tx.merchantCategory, risk: tx.merchantRiskScore }
      });
      addEdge(tx.id, merchantId, 'BENEFICIARY_MERCHANT', 1, tx.merchantRiskScore > 65);

      // 8. Location Node
      const locId = `LOC-${tx.location.city.replace(/\s+/g, '_')}`;
      addNode({
        id: locId,
        label: `${tx.location.city}, ${tx.location.country}`,
        type: 'LOCATION',
        riskScore: isTxSuspicious ? 50 : 10,
        isSuspicious: isTxSuspicious,
        metadata: { city: tx.location.city, country: tx.location.country }
      });
      addEdge(tx.id, locId, 'ORIGINATED_IN_LOCATION', 1, false);
    }

    // Identify Syndicate Clusters
    const clusters: FraudGraphData['clusters'] = [];

    // Check shared device rings
    for (const [devId, customers] of deviceToCustomers.entries()) {
      if (customers.size > 1 || devId.includes('RING')) {
        const clusterId = `CLUST-DEV-${devId}`;
        const nodeIds = [devId, ...Array.from(customers)];
        clusters.push({
          id: clusterId,
          clusterId,
          name: `Device Syndicate (${devId})`,
          riskScore: 94,
          patternType: 'SHARED_DEVICE_RING',
          nodeIds,
          description: `Device ${devId} is actively multiplexed across ${customers.size} distinct customer identities, indicating automated fraud farm activity.`
        });

        // Tag nodes
        for (const nid of nodeIds) {
          const n = nodeMap.get(nid);
          if (n) n.clusterId = clusterId;
        }
      }
    }

    // Check shared IP farms
    for (const [ip, customers] of ipToCustomers.entries()) {
      if (customers.size > 1 && (ip.startsWith('185.220.') || ip.startsWith('193.106.'))) {
        const clusterId = `CLUST-IP-${ip}`;
        const nodeIds = [`IP-${ip}`, ...Array.from(customers)];
        clusters.push({
          id: clusterId,
          clusterId,
          name: `Tor Exit / VPN Proxy Cluster (${ip})`,
          riskScore: 91,
          patternType: 'SHARED_IP_FARM',
          nodeIds,
          description: `IP ${ip} serves as an anonymized egress relay connecting multiple unrelated accounts across simultaneous sessions.`
        });

        for (const nid of nodeIds) {
          const n = nodeMap.get(nid);
          if (n) n.clusterId = clusterId;
        }
      }
    }

    // Compute topological degrees and layout positions
    const nodes = Array.from(nodeMap.values());
    const degreeMap = new Map<string, number>();
    for (const e of edgeList) {
      degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
    }

    const centerX = 380;
    const centerY = 240;
    const total = nodes.length;

    nodes.forEach((node, i) => {
      node.degree = degreeMap.get(node.id) || 1;
      // Arrange suspicious or cluster nodes towards center, regular nodes along concentric rings
      const isClustered = Boolean(node.clusterId);
      const angle = (i / total) * 2 * Math.PI;
      const radius = isClustered ? 100 + (i % 3) * 35 : 180 + (i % 4) * 40;
      node.x = Math.round(centerX + radius * Math.cos(angle));
      node.y = Math.round(centerY + radius * Math.sin(angle));
    });

    return {
      nodes,
      edges: edgeList,
      clusters
    };
  }
}

export const globalGraphEngine = new GraphEngine();
