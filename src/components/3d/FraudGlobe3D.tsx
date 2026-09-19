import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface FraudGlobe3DProps {
  threatLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  className?: string;
  interactive?: boolean;
}

export const FraudGlobe3D: React.FC<FraudGlobe3DProps> = ({
  threatLevel = 'HIGH',
  className = '',
  interactive = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return { hex: 0xdc2626, css: '#dc2626' };
      case 'HIGH': return { hex: 0xe50914, css: '#e50914' };
      case 'MEDIUM': return { hex: 0xf59e0b, css: '#f59e0b' };
      default: return { hex: 0x10b981, css: '#10b981' };
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        setIsLoading(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      setIsLoading(false);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let animId: number | null = null;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    try {
      const width = container.clientWidth || 400;
      const height = container.clientHeight || 400;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 240;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const threatTheme = getThreatColor(threatLevel);

      // Root Globe Group
      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      // 1. Inner dark core sphere
      const coreGeo = new THREE.SphereGeometry(68, 32, 32);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x080c14,
        transparent: true,
        opacity: 0.85
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      globeGroup.add(coreMesh);

      // 2. Wireframe latitude/longitude sphere
      const wireGeo = new THREE.SphereGeometry(70, 24, 24);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x22334e,
        wireframe: true,
        transparent: true,
        opacity: 0.35
      });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      globeGroup.add(wireMesh);

      // 3. Subtle outer cyber atmosphere halo
      const haloGeo = new THREE.SphereGeometry(72, 32, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: threatTheme.hex,
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      globeGroup.add(haloMesh);

      // 4. Dot grid representing continents / global sensor network
      const particleCount = 450;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const baseColor = new THREE.Color(0x38bdf8);
      const threatColor = new THREE.Color(threatTheme.hex);

      for (let i = 0; i < particleCount; i++) {
        // Golden spiral on sphere
        const phi = Math.acos(-1 + (2 * i) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;
        const radius = 70.5;

        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Threat hotspots
        const isHotspot = (i % 28 === 0);
        const col = isHotspot ? threatColor : baseColor;
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }

      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 2.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.85
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      globeGroup.add(particles);

      // 5. Pulsing threat nodes with rings
      const hotspots = [
        { lat: 40.71, lon: -74.0, label: 'New York (ATO Wave)', isHigh: true },
        { lat: 51.50, lon: -0.12, label: 'London (Card Testing)', isHigh: true },
        { lat: 35.67, lon: 139.65, label: 'Tokyo (Normal)', isHigh: false },
        { lat: 1.35, lon: 103.81, label: 'Singapore (Proxy Cluster)', isHigh: true },
        { lat: 50.11, lon: 8.68, label: 'Frankfurt (Banking Hub)', isHigh: false },
        { lat: 6.52, lon: 3.37, label: 'Lagos (Velocity Burst)', isHigh: true }
      ];

      const markersGroup = new THREE.Group();
      hotspots.forEach(h => {
        const phi = (90 - h.lat) * (Math.PI / 180);
        const theta = (h.lon + 180) * (Math.PI / 180);
        const r = 71.5;

        const x = -(r * Math.sin(phi) * Math.cos(theta));
        const z = r * Math.sin(phi) * Math.sin(theta);
        const y = r * Math.cos(phi);

        const beaconGeo = new THREE.SphereGeometry(h.isHigh ? 2.2 : 1.4, 12, 12);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: h.isHigh ? threatTheme.hex : 0x10b981
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(x, y, z);
        markersGroup.add(beacon);
      });
      globeGroup.add(markersGroup);

      // 6. Orbital ring with traveling cyber satellites
      const ringGeo = new THREE.RingGeometry(95, 96, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2.8;
      scene.add(ringMesh);

      // Orbiting satellites
      const satGeo = new THREE.SphereGeometry(1.8, 8, 8);
      const satMat = new THREE.MeshBasicMaterial({ color: threatTheme.hex });
      const satellite1 = new THREE.Mesh(satGeo, satMat);
      const satellite2 = new THREE.Mesh(satGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      scene.add(satellite1);
      scene.add(satellite2);

      // Mouse drag controls
      if (interactive) {
        const onMouseDown = (e: MouseEvent) => {
          isDragging = true;
          prevMouseX = e.clientX;
          prevMouseY = e.clientY;
        };

        const onMouseMove = (e: MouseEvent) => {
          if (!isDragging) return;
          const deltaX = e.clientX - prevMouseX;
          const deltaY = e.clientY - prevMouseY;
          globeGroup.rotation.y += deltaX * 0.005;
          globeGroup.rotation.x += deltaY * 0.005;
          prevMouseX = e.clientX;
          prevMouseY = e.clientY;
        };

        const onMouseUp = () => {
          isDragging = false;
        };

        container.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        // Touch support
        const onTouchStart = (e: TouchEvent) => {
          if (e.touches.length === 1) {
            isDragging = true;
            prevMouseX = e.touches[0].clientX;
            prevMouseY = e.touches[0].clientY;
          }
        };
        const onTouchMove = (e: TouchEvent) => {
          if (!isDragging || e.touches.length !== 1) return;
          const deltaX = e.touches[0].clientX - prevMouseX;
          const deltaY = e.touches[0].clientY - prevMouseY;
          globeGroup.rotation.y += deltaX * 0.005;
          globeGroup.rotation.x += deltaY * 0.005;
          prevMouseX = e.touches[0].clientX;
          prevMouseY = e.touches[0].clientY;
        };
        const onTouchEnd = () => { isDragging = false; };

        container.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd);
      }

      // Responsive Resize
      const resizeObserver = new ResizeObserver(entries => {
        if (!entries || !entries[0] || !renderer || !camera) return;
        const { width: newW, height: newH } = entries[0].contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      });
      resizeObserver.observe(container);

      // Render loop
      let clock = new THREE.Clock();
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        if (!isDragging) {
          globeGroup.rotation.y += 0.0035;
        }

        // Orbit satellites
        const satAngle1 = elapsedTime * 0.8;
        const satRadius = 95.5;
        satellite1.position.x = Math.cos(satAngle1) * satRadius;
        satellite1.position.z = Math.sin(satAngle1) * satRadius * Math.cos(Math.PI / 2.8);
        satellite1.position.y = Math.sin(satAngle1) * satRadius * Math.sin(Math.PI / 2.8);

        const satAngle2 = satAngle1 + Math.PI;
        satellite2.position.x = Math.cos(satAngle2) * satRadius;
        satellite2.position.z = Math.sin(satAngle2) * satRadius * Math.cos(Math.PI / 2.8);
        satellite2.position.y = Math.sin(satAngle2) * satRadius * Math.sin(Math.PI / 2.8);

        // Pulse outer halo
        haloMesh.scale.setScalar(1 + Math.sin(elapsedTime * 2) * 0.02);

        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };

      animate();
      setIsLoading(false);

      // Cleanup
      return () => {
        if (animId) cancelAnimationFrame(animId);
        resizeObserver.disconnect();
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }
        coreGeo.dispose();
        coreMat.dispose();
        wireGeo.dispose();
        wireMat.dispose();
        haloGeo.dispose();
        haloMat.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        ringGeo.dispose();
        ringMat.dispose();
        satGeo.dispose();
        satMat.dispose();
      };
    } catch (err) {
      console.warn('[FraudGlobe3D] WebGL initialization fallback:', err);
      setHasWebGL(false);
      setIsLoading(false);
    }
  }, [threatLevel, interactive]);

  if (!hasWebGL) {
    // 2D Cyber Radar Fallback
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="relative w-64 h-64 rounded-full border border-red-500/30 bg-black/60 flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(229,9,20,0.2)]">
          <div className="absolute inset-0 rounded-full border border-slate-800" />
          <div className="absolute inset-4 rounded-full border border-dashed border-red-500/20" />
          <div className="absolute inset-12 rounded-full border border-slate-800/80" />
          <div className="absolute inset-20 rounded-full border border-cyan-500/20" />
          {/* Radar Sweep */}
          <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 via-transparent to-transparent animate-spin [animation-duration:4s]" />
          {/* Center Point */}
          <div className="h-3 w-3 rounded-full bg-red-600 animate-ping" />
          <div className="h-2 w-2 rounded-full bg-red-500 relative z-10" />
          {/* Blips */}
          <div className="absolute top-12 left-16 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <div className="absolute bottom-16 right-20 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <div className="absolute top-24 right-14 h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative cursor-grab active:cursor-grabbing ${className}`}
      title={interactive ? "Drag to rotate 3D Threat Globe" : undefined}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-xs">
          <div className="h-8 w-8 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" />
        </div>
      )}
    </div>
  );
};
