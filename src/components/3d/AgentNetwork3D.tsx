import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AgentStepResult } from '../../types/fraud';

interface AgentNetwork3DProps {
  agentSteps?: AgentStepResult[];
  activeAgentIndex?: number;
  onSelectAgent?: (index: number) => void;
  className?: string;
  isExecuting?: boolean;
}

export const AgentNetwork3D: React.FC<AgentNetwork3DProps> = ({
  agentSteps = [],
  activeAgentIndex = 0,
  onSelectAgent = (_index?: number) => {},
  className = '',
  isExecuting = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);

  const AGENT_LIST = [
    { name: 'Transaction Agent', key: 'tx', role: 'Feature Extraction & Raw Risk Scoring' },
    { name: 'Pattern Detection Agent', key: 'pattern', role: 'Velocity, Carding, & Anomaly Signatures' },
    { name: 'Behavioral Agent', key: 'behavior', role: 'Baseline Deviations & Device Biometrics' },
    { name: 'Network Agent', key: 'network', role: 'Syndicate Clustering & Graph Adjacency' },
    { name: 'RAG Knowledge Agent', key: 'rag', role: 'Historical Fraud Typology & Policy Lookup' },
    { name: 'Risk Decision Agent', key: 'decision', role: 'Risk Aggregation & Escalation Calibration' },
    { name: 'Gemini Reasoning Agent', key: 'gemini', role: 'Deep Multimodal LLM Chain-of-Thought' },
    { name: 'Fallback Agent', key: 'fallback', role: 'Rule Baseline & Redundancy Verification' }
  ];

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
      const width = container.clientWidth || 600;
      const height = container.clientHeight || 420;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.set(0, 40, 180);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const networkGroup = new THREE.Group();
      scene.add(networkGroup);

      // Central core node (AI Orchestrator Kernel)
      const centerGeo = new THREE.OctahedronGeometry(12, 2);
      const centerMat = new THREE.MeshBasicMaterial({
        color: 0xe50914,
        wireframe: true,
        transparent: true,
        opacity: 0.6
      });
      const centerMesh = new THREE.Mesh(centerGeo, centerMat);
      networkGroup.add(centerMesh);

      // Inner glowing core
      const innerCenterGeo = new THREE.SphereGeometry(6, 16, 16);
      const innerCenterMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const innerCenterMesh = new THREE.Mesh(innerCenterGeo, innerCenterMat);
      networkGroup.add(innerCenterMesh);

      // Arrange 8 agent nodes in an ellipse / cyber orbit
      const nodeCount = 8;
      const radiusX = 85;
      const radiusZ = 65;
      const nodeMeshes: THREE.Mesh[] = [];
      const nodePositions: THREE.Vector3[] = [];

      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const x = Math.cos(angle) * radiusX;
        const z = Math.sin(angle) * radiusZ;
        const y = Math.sin(angle * 2) * 15; // 3D elevation wave

        const pos = new THREE.Vector3(x, y, z);
        nodePositions.push(pos);

        // Determine color based on agent execution status
        const step = agentSteps[i];
        let nodeColor = 0x3b82f6; // default blue
        if (i === activeAgentIndex) {
          nodeColor = 0xe50914; // active crimson
        } else if (step?.status === 'COMPLETED') {
          nodeColor = 0x10b981; // green success
        } else if (step?.status === 'FAILED') {
          nodeColor = 0xf59e0b; // amber warning
        }

        const nodeGeo = new THREE.IcosahedronGeometry(7.5, 1);
        const nodeMat = new THREE.MeshBasicMaterial({
          color: nodeColor,
          wireframe: i !== activeAgentIndex,
          transparent: true,
          opacity: 0.85
        });
        const mesh = new THREE.Mesh(nodeGeo, nodeMat);
        mesh.position.copy(pos);
        networkGroup.add(mesh);
        nodeMeshes.push(mesh);

        // Line to central kernel
        const spokeGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pos]);
        const spokeMat = new THREE.LineBasicMaterial({
          color: i === activeAgentIndex ? 0xe50914 : 0x1f293d,
          transparent: true,
          opacity: i === activeAgentIndex ? 0.9 : 0.35
        });
        const spoke = new THREE.Line(spokeGeo, spokeMat);
        networkGroup.add(spoke);

        // Line to adjacent neighbors
        if (i > 0) {
          const adjGeo = new THREE.BufferGeometry().setFromPoints([nodePositions[i - 1], pos]);
          const adjMat = new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.4 });
          networkGroup.add(new THREE.Line(adjGeo, adjMat));
        }
      }

      // Close loop between first and last node
      if (nodePositions.length === 8) {
        const closeGeo = new THREE.BufferGeometry().setFromPoints([nodePositions[7], nodePositions[0]]);
        networkGroup.add(new THREE.Line(closeGeo, new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.4 })));
      }

      // Traveling data packets
      const packetCount = 12;
      const packetGeo = new THREE.SphereGeometry(1.6, 8, 8);
      const packetMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const packets: { mesh: THREE.Mesh; fromIdx: number; toIdx: number; progress: number; speed: number }[] = [];

      for (let p = 0; p < packetCount; p++) {
        const pMesh = new THREE.Mesh(packetGeo, packetMat);
        networkGroup.add(pMesh);
        const from = p % nodeCount;
        const to = (from + 1) % nodeCount;
        packets.push({
          mesh: pMesh,
          fromIdx: from,
          toIdx: to,
          progress: Math.random(),
          speed: 0.008 + Math.random() * 0.012
        });
      }

      // Raycasting for node hover / click
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onPointerMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera!);
        const intersects = raycaster.intersectObjects(nodeMeshes);
        if (intersects.length > 0) {
          const idx = nodeMeshes.indexOf(intersects[0].object as THREE.Mesh);
          if (idx !== -1) {
            setHoveredAgent(idx);
            container.style.cursor = 'pointer';
            return;
          }
        }
        setHoveredAgent(null);
        container.style.cursor = 'default';
      };

      const onClick = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera!);
        const intersects = raycaster.intersectObjects(nodeMeshes);
        if (intersects.length > 0) {
          const idx = nodeMeshes.indexOf(intersects[0].object as THREE.Mesh);
          if (idx !== -1) {
            onSelectAgent(idx);
          }
        }
      };

      container.addEventListener('mousemove', onPointerMove);
      container.addEventListener('click', onClick);

      // Resize observer
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

      // Animation Loop
      let clock = new THREE.Clock();
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Slow gentle orbit rotation
        networkGroup.rotation.y = t * 0.15;
        centerMesh.rotation.y = -t * 0.4;
        centerMesh.rotation.x = t * 0.3;

        // Pulse active agent node
        if (activeAgentIndex >= 0 && activeAgentIndex < nodeMeshes.length) {
          const activeMesh = nodeMeshes[activeAgentIndex];
          const pulse = 1 + Math.sin(t * 6) * 0.25;
          activeMesh.scale.setScalar(pulse);
        }

        // Animate traveling data packets
        packets.forEach(pkt => {
          pkt.progress += pkt.speed * (isExecuting ? 2.5 : 1);
          if (pkt.progress >= 1) {
            pkt.progress = 0;
            pkt.fromIdx = pkt.toIdx;
            pkt.toIdx = (pkt.toIdx + 1) % nodeCount;
          }
          const fromPos = nodePositions[pkt.fromIdx];
          const toPos = nodePositions[pkt.toIdx];
          pkt.mesh.position.lerpVectors(fromPos, toPos, pkt.progress);
        });

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
        centerGeo.dispose();
        centerMat.dispose();
        innerCenterGeo.dispose();
        innerCenterMat.dispose();
        packetGeo.dispose();
        packetMat.dispose();
      };
    } catch (err) {
      console.warn('[AgentNetwork3D] WebGL error:', err);
      setHasWebGL(false);
    }
  }, [agentSteps, activeAgentIndex, isExecuting, onSelectAgent]);

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* 3D Canvas / 2D Fallback */}
      <div 
        ref={containerRef} 
        className="w-full h-80 sm:h-96 relative flex items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-[#0a0a0a]"
      >
        {!hasWebGL && (
          // 2D Cyber Agent Grid Fallback
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 w-full h-full overflow-y-auto">
            {AGENT_LIST.map((agent, i) => {
              const isActive = i === activeAgentIndex;
              const step = agentSteps[i];
              return (
                <button
                  key={agent.name}
                  onClick={() => onSelectAgent(i)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isActive 
                      ? 'bg-red-500/10 border-red-500 text-red-300 shadow-[0_0_15px_rgba(229,9,20,0.3)]' 
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-slate-400">Node #{i + 1}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      step?.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {step?.status || (isActive ? 'RUNNING' : 'QUEUED')}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-white truncate">{agent.name}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-2 mt-1">{agent.role}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Hover / Active Node Telemetry Overlay */}
        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-white/10 rounded-lg p-3 text-xs pointer-events-none max-w-xs shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-slate-400 uppercase text-[10px] tracking-wider">
              {isExecuting ? 'PIPELINE ACTIVE' : '8-AGENT NEURAL TOPOLOGY'}
            </span>
          </div>
          {hoveredAgent !== null || activeAgentIndex !== null ? (
            <div>
              <div className="font-bold text-white text-sm">
                {AGENT_LIST[hoveredAgent ?? activeAgentIndex]?.name}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {AGENT_LIST[hoveredAgent ?? activeAgentIndex]?.role}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between font-mono text-[10px]">
                <span className="text-slate-400">STATUS:</span>
                <span className="text-emerald-400 font-bold">
                  {agentSteps[hoveredAgent ?? activeAgentIndex]?.status || (isExecuting ? 'ACTIVE' : 'READY')}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-slate-400">Click any agent node to inspect telemetry & findings</span>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Active</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Ready</span>
        </div>
      </div>
    </div>
  );
};
