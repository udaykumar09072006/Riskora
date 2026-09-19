import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Search, 
  Filter, 
  RotateCcw, 
  AlertTriangle, 
  Smartphone, 
  CreditCard, 
  User, 
  Globe, 
  Store, 
  CheckCircle2, 
  Layers,
  Orbit,
  LayoutGrid
} from 'lucide-react';
import { FraudGraphData, GraphNode, GraphEdge, GraphCluster } from '../types/fraud';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { NetworkGraph3D } from '../components/3d/NetworkGraph3D';

export const FraudGraphPage: React.FC = () => {
  const [graphData, setGraphData] = useState<FraudGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [highlightClusterId, setHighlightClusterId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const data = await api.getFraudGraph();
      setGraphData(data);
      if (data.nodes.length > 0) {
        const flagged = data.nodes.find(n => n.riskScore >= 70) || data.nodes[0];
        setSelectedNode(flagged);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const getNodeColor = (node: GraphNode) => {
    if (highlightClusterId && node.clusterId === highlightClusterId) {
      return '#EC4899';
    }
    if (node.riskScore >= 80) return '#EF4444';
    if (node.riskScore >= 60) return '#F97316';
    if (node.riskScore >= 35) return '#F59E0B';

    switch (node.type) {
      case 'CUSTOMER': return '#6366F1';
      case 'DEVICE': return '#8B5CF6';
      case 'IP': return '#06B6D4';
      case 'CARD': return '#EC4899';
      case 'MERCHANT': return '#10B981';
      default: return '#64748B';
    }
  };

  const getNodeIcon = (type: GraphNode['type']) => {
    switch (type) {
      case 'CUSTOMER': return User;
      case 'DEVICE': return Smartphone;
      case 'CARD': return CreditCard;
      case 'IP': return Globe;
      case 'MERCHANT': return Store;
    }
  };

  const filteredNodes = graphData?.nodes.filter(n => {
    if (filterType !== 'ALL' && n.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q);
    }
    return true;
  }) || [];

  return (
    <div id="view-fraud-graph" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Syndicate Graph Intelligence
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cross-entity link analysis uncovering multi-account hardware rings, proxy IP farms, and shared merchant syndicates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View toggle */}
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === '3d' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Orbit className="h-3.5 w-3.5" />
              <span>Topology View</span>
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === '2d' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>2D Planar</span>
            </button>
          </div>

          <button
            onClick={fetchGraph}
            className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh graph"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Detected Clusters Banner */}
      {graphData && graphData.clusters.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#0d0d0d] border border-red-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span>Detected Syndicate Rings ({graphData.clusters.length})</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Click to isolate cluster</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {graphData.clusters.map(cluster => (
              <button
                key={cluster.clusterId}
                onClick={() => setHighlightClusterId(highlightClusterId === cluster.clusterId ? null : cluster.clusterId)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  highlightClusterId === cluster.clusterId
                    ? 'bg-red-600/30 border-red-500 text-red-200 shadow-[0_0_15px_rgba(229,9,20,0.3)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <strong>{cluster.name}</strong> ({cluster.nodeIds.length} Entities • Risk {cluster.riskScore})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Layout: Graph on Left, Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph Display Area */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0d0d0d] border border-white/10 flex flex-col overflow-hidden h-[540px]">
          {/* Controls Bar */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between gap-3 text-xs bg-[#090909]">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px]">Filter Entity:</span>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-[#141414] border border-white/10 text-slate-300 text-xs focus:outline-none focus:border-red-500"
              >
                <option value="ALL">All Types ({graphData?.nodes.length || 0})</option>
                <option value="DEVICE">Devices</option>
                <option value="CUSTOMER">Customers</option>
                <option value="CARD">Cards</option>
                <option value="IP">IP Addresses</option>
                <option value="MERCHANT">Merchants</option>
              </select>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Critical
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> Customer
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-purple-500" /> Device
              </span>
            </div>
          </div>

          {/* Graph Visualization: 3D or 2D */}
          <div className="flex-1 relative bg-[#060606] overflow-hidden">
            {viewMode === '3d' && graphData ? (
              <NetworkGraph3D
                nodes={filteredNodes}
                edges={graphData.edges}
                selectedNodeId={selectedNode?.id}
                onSelectNode={(n) => setSelectedNode(n)}
                highlightClusterId={highlightClusterId}
                height="100%"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                <svg className="w-full h-full min-w-[500px] min-h-[400px]">
                  {graphData?.edges.map((edge, idx) => {
                    const srcNode = graphData.nodes.find(n => n.id === edge.source);
                    const tgtNode = graphData.nodes.find(n => n.id === edge.target);
                    if (!srcNode || !tgtNode) return null;

                    const isHighlighted = (selectedNode && (srcNode.id === selectedNode.id || tgtNode.id === selectedNode.id)) ||
                      (highlightClusterId && srcNode.clusterId === highlightClusterId && tgtNode.clusterId === highlightClusterId);

                    return (
                      <line
                        key={idx}
                        x1={srcNode.x || 100}
                        y1={srcNode.y || 100}
                        x2={tgtNode.x || 200}
                        y2={tgtNode.y || 200}
                        stroke={isHighlighted ? '#e50914' : '#222'}
                        strokeWidth={isHighlighted ? 2.5 : 1}
                        strokeDasharray={edge.isSuspicious ? '4 2' : undefined}
                      />
                    );
                  })}

                  {filteredNodes.map(node => {
                    const isSelected = selectedNode?.id === node.id;
                    const color = getNodeColor(node);
                    const radius = isSelected ? 18 : (node.riskScore >= 70 ? 14 : 11);

                    return (
                      <g 
                        key={node.id}
                        transform={`translate(${node.x || 150}, ${node.y || 150})`}
                        onClick={() => setSelectedNode(node)}
                        className="cursor-pointer"
                      >
                        <circle
                          r={radius}
                          fill={color}
                          stroke={isSelected ? '#ffffff' : '#000000'}
                          strokeWidth={isSelected ? 3 : 1}
                          opacity={0.9}
                        />
                        <text
                          y={radius + 12}
                          fontSize="9"
                          fill="#94a3b8"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Entity Inspector */}
        <div className="rounded-2xl bg-[#0d0d0d] border border-white/10 p-5 flex flex-col justify-between space-y-4">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold">
                  Node Inspector
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 font-mono text-[10px] font-bold border border-red-500/30">
                  Risk {selectedNode.riskScore}/100
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{selectedNode.label}</h3>
                <span className="text-xs font-mono text-slate-500">{selectedNode.id}</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Entity Type</span>
                  <span className="text-white font-bold">{selectedNode.type}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Syndicate Ring</span>
                  <span className="text-red-400 font-bold">{selectedNode.clusterId || 'Isolated'}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Direct Degrees</span>
                  <span className="text-sky-400 font-bold">{selectedNode.degree || 4} Connected Edges</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-400 leading-relaxed">
                Correlated through common fingerprint signatures, rapid authorization velocity, and shared IP subnet ranges.
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Click any node in the graph topology to inspect its syndicate links.
            </div>
          )}

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>GRAPH DB ONLINE</span>
            <span>NEO4J / CYPHER READY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
