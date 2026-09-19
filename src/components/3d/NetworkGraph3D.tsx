import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FraudGraphData, GraphNode } from '../../types/fraud';
import { ZoomIn, ZoomOut, RotateCcw, Eye, ShieldAlert } from 'lucide-react';

interface NetworkGraph3DProps {
  graphData?: FraudGraphData;
  onSelectNode?: (node: GraphNode) => void;
  className?: string;
}

export const NetworkGraph3D: React.FC<NetworkGraph3DProps> = ({
  graphData,
  onSelectNode = (_node?: GraphNode) => {},
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [clusterHighlight, setClusterHighlight] = useState(true);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Fallback demo nodes if graphData is empty
  const defaultNodes: GraphNode[] = [
    { id: 'usr_882', label: 'User: Arthur Pendelton', type: 'USER', riskScore: 94, clusterId: 'CLUSTER_ALPHA', connections: 6, metadata: { email: 'arthur.p@tempmail.io', country: 'NG' } },
    { id: 'dev_fingerprint_01', label: 'Device: Android Rooted SM-G998B', type: 'DEVICE', riskScore: 88, clusterId: 'CLUSTER_ALPHA', connections: 8, metadata: { os: 'Android 13 Custom ROM', emulator: true } },
    { id: 'ip_185_220_101', label: 'IP: 185.220.101.44 (Tor Exit)', type: 'IP', riskScore: 96, clusterId: 'CLUSTER_ALPHA', connections: 7, metadata: { isp: 'Tor Relay Network', country: 'DE' } },
    { id: 'acc_77192', label: 'Account: #4092-****-8812', type: 'ACCOUNT', riskScore: 78, clusterId: 'CLUSTER_ALPHA', connections: 4, metadata: { bank: 'Fintech NeoBank', balance: '$2,400' } },
    { id: 'usr_391', label: 'User: Elena Rostova', type: 'USER', riskScore: 82, clusterId: 'CLUSTER_ALPHA', connections: 5, metadata: { email: 'elena.rostova@fastvpn.net' } },
    { id: 'merch_crypto_99', label: 'Merchant: Global Crypto Pay', type: 'MERCHANT', riskScore: 65, clusterId: 'CLUSTER_BETA', connections: 9, metadata: { mcc: '6051', volume24h: '$180,000' } },
    { id: 'ip_45_154_255', label: 'IP: 45.154.255.12 (Proxy)', type: 'IP', riskScore: 72, clusterId: 'CLUSTER_BETA', connections: 3, metadata: { isp: 'Hosting Solution AS' } },
    { id: 'tx_99218', label: 'Tx: $4,950.00 Wire', type: 'TRANSACTION', riskScore: 91, clusterId: 'CLUSTER_ALPHA', connections: 3, metadata: { currency: 'USD', instant: true } },
    { id: 'tx_99219', label: 'Tx: $3,800.00 Crypto', type: 'TRANSACTION', riskScore: 85, clusterId: 'CLUSTER_BETA', connections: 2, metadata: { currency: 'USDT', chain: 'Ethereum' } }
  ];

  const nodes = graphData?.nodes?.length ? graphData.nodes : defaultNodes;

  const getNodeColor = (type: string, riskScore: number = 50) => {
    if (riskScore >= 80) return { hex: 0xdc2626, css: '#dc2626' }; // High risk crimson
    switch (type) {
      case 'USER': return { hex: 0x3b82f6, css: '#3b82f6' };
      case 'DEVICE': return { hex: 0xa855f7, css: '#a855f7' };
      case 'IP': return { hex: 0xf59e0b, css: '#f59e0b' };
      case 'ACCOUNT': return { hex: 0x10b981, css: '#10b981' };
      case 'MERCHANT': return { hex: 0x06b6d4, css: '#06b6d4' };
      default: return { hex: 0xe50914, css: '#e50914' };
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let animId: number | null = null;

    try {
      const width = container.clientWidth || 700;
      const height = container.clientHeight || 500;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.set(0, 50, 200);
      cameraRef.current = camera;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const graphGroup = new THREE.Group();
      scene.add(graphGroup);

      // Force/Spherical layout generation for nodes
      const nodeMeshes: { mesh: THREE.Mesh; node: GraphNode }[] = [];
      const nodePositions: Map<string, THREE.Vector3> = new Map();

      nodes.forEach((node, i) => {
        // Group by cluster
        const isClusterAlpha = node.clusterId === 'CLUSTER_ALPHA';
        const clusterCenterX = isClusterAlpha ? -45 : 45;
        const clusterCenterY = isClusterAlpha ? 10 : -10;

        const phi = Math.acos(-1 + (2 * i) / nodes.length);
        const theta = Math.sqrt(nodes.length * Math.PI) * phi;
        const spread = 35;

        const x = clusterCenterX + Math.cos(theta) * spread * 0.8;
        const y = clusterCenterY + Math.sin(theta) * spread * 0.7;
        const z = Math.sin(phi) * spread * 0.6;

        const pos = new THREE.Vector3(x, y, z);
        nodePositions.set(node.id, pos);

        const colorObj = getNodeColor(node.type, node.riskScore);
        const radius = Math.max(3.5, Math.min(8, (node.connections || 3) * 1.1));

        const geo = new THREE.SphereGeometry(radius, 16, 16);
        const mat = new THREE.MeshBasicMaterial({
          color: colorObj.hex,
          transparent: true,
          opacity: 0.9
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);

        // Halo ring around high-risk nodes
        if ((node.riskScore || 0) >= 80) {
          const haloGeo = new THREE.RingGeometry(radius + 1.5, radius + 2.5, 16);
          const haloMat = new THREE.MeshBasicMaterial({
            color: 0xe50914,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
          });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          mesh.add(halo);
        }

        graphGroup.add(mesh);
        nodeMeshes.push({ mesh, node });
      });

      // Connect nodes via edges
      const edgeLinesGroup = new THREE.Group();
      graphGroup.add(edgeLinesGroup);

      // Build edges based on shared cluster or connections
      nodes.forEach((n1, i) => {
        nodes.forEach((n2, j) => {
          if (i < j && (n1.clusterId === n2.clusterId || (i + j) % 5 === 0)) {
            const p1 = nodePositions.get(n1.id);
            const p2 = nodePositions.get(n2.id);
            if (p1 && p2) {
              const edgeGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
              const isHighRiskEdge = (n1.riskScore || 0) >= 80 && (n2.riskScore || 0) >= 80;
              const edgeMat = new THREE.LineBasicMaterial({
                color: isHighRiskEdge ? 0xe50914 : 0x223249,
                transparent: true,
                opacity: isHighRiskEdge ? 0.7 : 0.3
              });
              edgeLinesGroup.add(new THREE.Line(edgeGeo, edgeMat));
            }
          }
        });
      });

      // Raycaster for hover and selection
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onPointerMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera!);
        const intersects = raycaster.intersectObjects(nodeMeshes.map(n => n.mesh));
        if (intersects.length > 0) {
          const hit = nodeMeshes.find(n => n.mesh === intersects[0].object);
          if (hit) {
            setHoveredNode(hit.node);
            container.style.cursor = 'pointer';
            return;
          }
        }
        setHoveredNode(null);
        container.style.cursor = 'default';
      };

      const onClick = () => {
        if (hoveredNode) {
          setSelectedNode(hoveredNode);
          onSelectNode(hoveredNode);
        }
      };

      container.addEventListener('mousemove', onPointerMove);
      container.addEventListener('click', onClick);

      // Resize
      const resizeObserver = new ResizeObserver(entries => {
        if (!entries[0] || !renderer || !camera) return;
        const { width: newW, height: newH } = entries[0].contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      });
      resizeObserver.observe(container);

      // Animation
      let clock = new THREE.Clock();
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Slow smooth 3D orbit
        graphGroup.rotation.y = t * 0.1;
        graphGroup.rotation.x = Math.sin(t * 0.2) * 0.1;

        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };

      animate();

      return () => {
        if (animId) cancelAnimationFrame(animId);
        resizeObserver.disconnect();
        container.removeEventListener('mousemove', onPointerMove);
        container.removeEventListener('click', onClick);
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }
      };
    } catch (err) {
      console.warn('[NetworkGraph3D] WebGL error:', err);
      setHasWebGL(false);
    }
  }, [nodes, onSelectNode, hoveredNode]);

  return (
    <div className={`relative flex flex-col rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden ${className}`}>
      {/* HUD Controls */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/40 backdrop-blur-xs text-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
          <span className="font-bold text-white">Syndicate Entity Graph (3D Force Layout)</span>
          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono text-[10px] border border-red-500/30">
            {nodes.length} Entities Indexed
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setClusterHighlight(!clusterHighlight)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition-all ${
              clusterHighlight ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-400'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            {clusterHighlight ? 'Syndicate Clusters: On' : 'Highlighting Off'}
          </button>
        </div>
      </div>

      {/* 3D Canvas / 2D Fallback */}
      <div 
        ref={containerRef} 
        className="relative w-full h-[460px] flex items-center justify-center overflow-hidden bg-radial from-slate-950 via-[#070707] to-black"
      >
        {!hasWebGL && (
          // 2D Entity List Fallback
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full h-full overflow-y-auto">
            {nodes.map(n => (
              <div 
                key={n.id}
                onClick={() => { setSelectedNode(n); onSelectNode(n); }}
                className="p-3 rounded-lg border border-white/10 bg-black/60 hover:border-red-500/50 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px]">{n.type}</span>
                  <span className="font-mono text-red-400 font-bold">{n.riskScore}/100</span>
                </div>
                <div className="font-semibold text-white text-xs truncate">{n.label}</div>
                <div className="text-[10px] text-slate-400 mt-1">Cluster: {n.clusterId}</div>
              </div>
            ))}
          </div>
        )}

        {/* Hover / Selected Entity Card Drawer */}
        {(hoveredNode || selectedNode) && (
          <div className="absolute bottom-4 left-4 max-w-sm bg-black/85 backdrop-blur-md border border-white/15 rounded-xl p-3.5 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between mb-1.5">
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono uppercase font-bold">
                {(hoveredNode || selectedNode)?.type}
              </span>
              <span className="text-[11px] font-mono font-bold text-red-400">
                Risk Score: {(hoveredNode || selectedNode)?.riskScore}/100
              </span>
            </div>
            <div className="font-bold text-white text-sm">
              {(hoveredNode || selectedNode)?.label}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              ID: <span className="font-mono text-slate-300">{(hoveredNode || selectedNode)?.id}</span> • Cluster: <span className="text-amber-400 font-mono">{(hoveredNode || selectedNode)?.clusterId}</span>
            </div>
            {/* Metadata Preview */}
            {(hoveredNode || selectedNode)?.metadata && (
              <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] space-y-1 font-mono text-slate-300">
                {Object.entries((hoveredNode || selectedNode)!.metadata!).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400 uppercase">{k}:</span>
                    <span className="text-white truncate max-w-[180px]">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-black/75 backdrop-blur-md border border-white/10 p-2.5 rounded-lg text-[10px] font-mono z-10">
          <div className="text-slate-400 font-bold mb-0.5">ENTITY TYPES</div>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> User / Identity</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" /> Device Fingerprint</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> IP / Proxy / VPN</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Bank Account</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-600" /> Flagged Transaction</span>
        </div>
      </div>
    </div>
  );
};
