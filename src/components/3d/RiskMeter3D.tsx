import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface RiskMeter3DProps {
  score: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  className?: string;
  size?: number;
}

export const RiskMeter3D: React.FC<RiskMeter3DProps> = ({
  score,
  riskLevel,
  className = '',
  size = 280
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [displayScore, setDisplayScore] = useState(0);

  // Animated count-up score
  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, score));
    const duration = 1200;
    const startTime = performance.now();

    const frame = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplayScore(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };
    const id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [score]);

  const getColorTheme = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return { primary: 0xdc2626, glow: '#dc2626', badge: 'bg-red-500/20 text-red-400 border-red-500/40' };
      case 'HIGH':
        return { primary: 0xe50914, glow: '#e50914', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40' };
      case 'MEDIUM':
        return { primary: 0xf59e0b, glow: '#f59e0b', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      default:
        return { primary: 0x10b981, glow: '#10b981', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
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
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      camera.position.z = 180;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const theme = getColorTheme(riskLevel);

      const rootGroup = new THREE.Group();
      scene.add(rootGroup);

      // 1. Central glowing risk core
      const coreGeo = new THREE.SphereGeometry(32, 24, 24);
      const coreMat = new THREE.MeshBasicMaterial({
        color: theme.primary,
        wireframe: true,
        transparent: true,
        opacity: 0.35
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      rootGroup.add(coreMesh);

      // Inner dense core
      const innerCoreGeo = new THREE.SphereGeometry(22, 16, 16);
      const innerCoreMat = new THREE.MeshBasicMaterial({
        color: 0x050505,
        transparent: true,
        opacity: 0.95
      });
      const innerMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
      rootGroup.add(innerMesh);

      // 2. Swirling risk particles
      // Particle density and speed scale with risk score!
      const particleCount = Math.max(40, Math.floor(score * 2.5));
      const particleGeo = new THREE.BufferGeometry();
      const pos = new Float32Array(particleCount * 3);
      const col = new Float32Array(particleCount * 3);
      const riskCol = new THREE.Color(theme.primary);
      const blueCol = new THREE.Color(0x38bdf8);

      for (let i = 0; i < particleCount; i++) {
        const radius = 40 + Math.random() * 26;
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const sinPhi = Math.sin(phi);

        pos[i * 3] = radius * sinPhi * Math.cos(theta);
        pos[i * 3 + 1] = radius * sinPhi * Math.sin(theta);
        pos[i * 3 + 2] = radius * Math.cos(phi);

        const mixColor = Math.random() > 0.3 ? riskCol : blueCol;
        col[i * 3] = mixColor.r;
        col[i * 3 + 1] = mixColor.g;
        col[i * 3 + 2] = mixColor.b;
      }

      particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      particleGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 2.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      rootGroup.add(particles);

      // 3. Score Arc Meter (calibrated to the score percentage)
      const arcMax = (score / 100) * (Math.PI * 1.5);
      const arcPoints = [];
      const arcRadius = 55;
      for (let a = 0; a <= arcMax; a += 0.05) {
        arcPoints.push(new THREE.Vector3(
          Math.cos(a - Math.PI * 0.75) * arcRadius,
          Math.sin(a - Math.PI * 0.75) * arcRadius,
          0
        ));
      }
      if (arcPoints.length > 1) {
        const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
        const arcMat = new THREE.LineBasicMaterial({
          color: theme.primary,
          linewidth: 3,
          transparent: true,
          opacity: 0.9
        });
        const arcLine = new THREE.Line(arcGeo, arcMat);
        rootGroup.add(arcLine);
      }

      // Outer baseline gauge ring
      const basePoints = [];
      for (let a = 0; a <= Math.PI * 1.5; a += 0.05) {
        basePoints.push(new THREE.Vector3(
          Math.cos(a - Math.PI * 0.75) * arcRadius,
          Math.sin(a - Math.PI * 0.75) * arcRadius,
          0
        ));
      }
      const baseGeo = new THREE.BufferGeometry().setFromPoints(basePoints);
      const baseMat = new THREE.LineBasicMaterial({
        color: 0x27272a,
        linewidth: 1,
        transparent: true,
        opacity: 0.4
      });
      const baseLine = new THREE.Line(baseGeo, baseMat);
      rootGroup.add(baseLine);

      // Render loop
      let clock = new THREE.Clock();
      const speedMultiplier = 1 + (score / 100) * 2;

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        rootGroup.rotation.y = t * 0.4 * speedMultiplier;
        rootGroup.rotation.x = Math.sin(t * 0.6) * 0.2;
        particles.rotation.y = -t * 0.6 * speedMultiplier;

        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };

      animate();

      return () => {
        if (animId) cancelAnimationFrame(animId);
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }
        coreGeo.dispose();
        coreMat.dispose();
        innerCoreGeo.dispose();
        innerCoreMat.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        baseGeo.dispose();
        baseMat.dispose();
      };
    } catch (err) {
      console.warn('[RiskMeter3D] WebGL error:', err);
      setHasWebGL(false);
    }
  }, [score, riskLevel, size]);

  const theme = getColorTheme(riskLevel);

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* 3D Canvas or 2D Fallback */}
      <div 
        ref={containerRef} 
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center"
      >
        {!hasWebGL && (
          <div className="relative w-48 h-48 rounded-full border-4 border-slate-800 flex items-center justify-center bg-black/60 shadow-[0_0_30px_rgba(229,9,20,0.15)]">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#1f2937"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={theme.glow}
                strokeWidth="8"
                strokeDasharray={`${(score / 100) * 251.2} 251.2`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}

        {/* Center Digital Readout HUD */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold mb-0.5">
            RISK SCORE
          </div>
          <div 
            className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
            style={{ color: theme.glow }}
          >
            {displayScore}
            <span className="text-xl font-normal text-slate-500 ml-0.5">/100</span>
          </div>
          <div className={`mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${theme.badge}`}>
            {riskLevel} RISK
          </div>
        </div>
      </div>

      {/* Risk Spectrum Legend */}
      <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> 0-30 Low</span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> 31-70 Med</span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> 71-85 High</span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-600" /> 86+ Crit</span>
      </div>
    </div>
  );
};
