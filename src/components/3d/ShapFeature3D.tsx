import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ShapFeature } from '../../types/fraud';

interface ShapFeature3DProps {
  features: ShapFeature[];
  baseValue?: number;
  predictionScore?: number;
  className?: string;
  onSelectFeature?: (feature: ShapFeature) => void;
}

export const ShapFeature3D: React.FC<ShapFeature3DProps> = ({
  features = [],
  baseValue = 18.5,
  predictionScore = 84.2,
  className = '',
  onSelectFeature = (_feature?: ShapFeature) => {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [hoveredFeature, setHoveredFeature] = useState<ShapFeature | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'ABSOLUTE' | 'NAME'>('ABSOLUTE');

  // Filter & sort features
  const filteredFeatures = [...features]
    .filter(f => {
      if (filterType === 'POSITIVE') return f.value > 0;
      if (filterType === 'NEGATIVE') return f.value < 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'ABSOLUTE') return Math.abs(b.value) - Math.abs(a.value);
      return a.feature.localeCompare(b.feature);
    })
    .slice(0, 10); // Display top 10 for 3D clarity

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
      const width = container.clientWidth || 650;
      const height = container.clientHeight || 380;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 35, 140);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const group = new THREE.Group();
      scene.add(group);

      // Glass Pedestal Floor Grid
      const gridHelper = new THREE.GridHelper(140, 14, 0x334155, 0x1e293b);
      gridHelper.position.y = -20;
      group.add(gridHelper);

      // Baseline reference marker
      const baselineGeo = new THREE.BoxGeometry(130, 0.5, 0.5);
      const baselineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.6 });
      const baselineMesh = new THREE.Mesh(baselineGeo, baselineMat);
      baselineMesh.position.set(0, -10, 0);
      group.add(baselineMesh);

      // 3D Bars for features
      const barMeshes: { mesh: THREE.Mesh; feature: ShapFeature }[] = [];
      const count = filteredFeatures.length;
      const spacing = 12;
      const startX = -((count - 1) * spacing) / 2;

      filteredFeatures.forEach((feat, idx) => {
        const isPositive = feat.value >= 0;
        const barHeight = Math.max(4, Math.abs(feat.value) * 1.8);
        const barColor = isPositive ? 0xe50914 : 0x10b981;

        // Bar Geometry
        const barGeo = new THREE.BoxGeometry(7, barHeight, 7);
        const barMat = new THREE.MeshBasicMaterial({
          color: barColor,
          transparent: true,
          opacity: 0.85
        });
        const barMesh = new THREE.Mesh(barGeo, barMat);

        // Center on y based on sign
        const yPos = isPositive ? -10 + barHeight / 2 : -10 - barHeight / 2;
        barMesh.position.set(startX + idx * spacing, yPos, 0);

        // Top cap glow
        const capGeo = new THREE.BoxGeometry(7.2, 1, 7.2);
        const capMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.y = isPositive ? barHeight / 2 : -barHeight / 2;
        barMesh.add(capMesh);

        group.add(barMesh);
        barMeshes.push({ mesh: barMesh, feature: feat });
      });

      // Mouse raycasting
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera!);
        const intersects = raycaster.intersectObjects(barMeshes.map(b => b.mesh));
        if (intersects.length > 0) {
          const hit = barMeshes.find(b => b.mesh === intersects[0].object || b.mesh.children.includes(intersects[0].object as THREE.Mesh));
          if (hit) {
            setHoveredFeature(hit.feature);
            container.style.cursor = 'pointer';
            return;
          }
        }
        setHoveredFeature(null);
        container.style.cursor = 'default';
      };

      const onClick = () => {
        if (hoveredFeature) {
          onSelectFeature(hoveredFeature);
        }
      };

      container.addEventListener('mousemove', onMouseMove);
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

      // Animation loop
      let clock = new THREE.Clock();
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Subtle stage breathing
        group.rotation.y = Math.sin(t * 0.4) * 0.08;

        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };

      animate();

      return () => {
        if (animId) cancelAnimationFrame(animId);
        resizeObserver.disconnect();
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('click', onClick);
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }
      };
    } catch (err) {
      console.warn('[ShapFeature3D] WebGL error:', err);
      setHasWebGL(false);
    }
  }, [filteredFeatures, onSelectFeature, hoveredFeature]);

  return (
    <div className={`flex flex-col rounded-xl border border-white/5 bg-[#0a0a0a] p-4 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 text-xs">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
            3D SHAP Local Feature Attribution
          </h3>
          <p className="text-[11px] text-slate-400">
            Base Prior: <span className="font-mono text-slate-300">{baseValue.toFixed(1)}</span> → Model Prediction: <span className="font-mono text-red-400 font-bold">{predictionScore.toFixed(1)}</span>
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-black/60 p-0.5 border border-white/10">
            {(['ALL', 'POSITIVE', 'NEGATIVE'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase transition-all ${
                  filterType === type 
                    ? 'bg-red-600 text-white font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type === 'POSITIVE' ? '+ Risk' : type === 'NEGATIVE' ? '- Mitig' : 'All'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSortBy(s => s === 'ABSOLUTE' ? 'NAME' : 'ABSOLUTE')}
            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300 hover:bg-white/10"
          >
            SORT: {sortBy}
          </button>
        </div>
      </div>

      {/* 3D Canvas / 2D Fallback */}
      <div 
        ref={containerRef} 
        className="relative w-full h-80 flex items-center justify-center overflow-hidden my-2"
      >
        {!hasWebGL && (
          // 2D Waterfall Bars Fallback
          <div className="w-full space-y-2 p-2 overflow-y-auto max-h-72">
            {filteredFeatures.map(f => {
              const isPos = f.value >= 0;
              const widthPct = Math.min(100, Math.abs(f.value) * 3.5);
              return (
                <div key={f.feature} className="flex items-center gap-2 text-xs">
                  <div className="w-36 font-mono text-slate-300 truncate">{f.feature}</div>
                  <div className="flex-1 flex items-center h-4 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${isPos ? 'bg-red-500 ml-auto' : 'bg-emerald-500'}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <div className={`w-14 text-right font-mono font-bold ${isPos ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isPos ? `+${f.value.toFixed(1)}` : f.value.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hover Feature Telemetry Card */}
        {hoveredFeature && (
          <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md border border-white/15 rounded-lg p-3 text-xs pointer-events-none max-w-xs shadow-xl animate-in fade-in duration-150">
            <div className="text-[10px] font-mono uppercase text-slate-400 mb-0.5">SHAP ATTRIBUTION</div>
            <div className="font-bold text-white text-sm">{hoveredFeature.feature}</div>
            <div className="mt-1 flex items-center justify-between font-mono">
              <span className="text-slate-400">Impact Delta:</span>
              <span className={`font-bold ${hoveredFeature.value >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {hoveredFeature.value >= 0 ? `+${hoveredFeature.value.toFixed(2)}` : hoveredFeature.value.toFixed(2)}
              </span>
            </div>
            {hoveredFeature.description && (
              <div className="mt-2 text-[11px] text-slate-300 border-t border-white/10 pt-1.5">
                {hoveredFeature.description}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-2 right-2 flex items-center gap-3 bg-black/75 px-3 py-1 rounded-md border border-white/10 text-[10px] font-mono">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-xs bg-red-600" /> Increases Fraud Risk</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-xs bg-emerald-500" /> Decreases Fraud Risk</span>
        </div>
      </div>
    </div>
  );
};
