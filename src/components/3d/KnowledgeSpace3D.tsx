import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { KnowledgeDocument } from '../../types/fraud';
import { FileText, Search, Sparkles, BookOpen } from 'lucide-react';

interface KnowledgeSpace3DProps {
  documents: KnowledgeDocument[];
  onSelectDocument?: (doc: KnowledgeDocument) => void;
  className?: string;
  isSearching?: boolean;
}

export const KnowledgeSpace3D: React.FC<KnowledgeSpace3DProps> = ({
  documents = [],
  onSelectDocument = (_doc?: KnowledgeDocument) => {},
  className = '',
  isSearching = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [hoveredDoc, setHoveredDoc] = useState<KnowledgeDocument | null>(null);

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
      const height = container.clientHeight || 420;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 20, 160);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const libraryGroup = new THREE.Group();
      scene.add(libraryGroup);

      // Floor cyber grid
      const grid = new THREE.GridHelper(160, 16, 0x334155, 0x111827);
      grid.position.y = -35;
      libraryGroup.add(grid);

      // Laser scanning plane (shows when isSearching is true)
      const scanPlaneGeo = new THREE.PlaneGeometry(140, 60);
      const scanPlaneMat = new THREE.MeshBasicMaterial({
        color: 0xe50914,
        transparent: true,
        opacity: isSearching ? 0.25 : 0.05,
        side: THREE.DoubleSide
      });
      const scanPlane = new THREE.Mesh(scanPlaneGeo, scanPlaneMat);
      scanPlane.rotation.x = Math.PI / 2;
      libraryGroup.add(scanPlane);

      // 3D Floating Document Cards
      const cardMeshes: { mesh: THREE.Mesh; doc: KnowledgeDocument }[] = [];
      const count = Math.min(documents.length, 12);
      const radius = 65;

      documents.slice(0, count).forEach((doc, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(angle * 3) * 12;

        // Card tablet geometry
        const cardGeo = new THREE.BoxGeometry(16, 22, 1);
        const cardMat = new THREE.MeshBasicMaterial({
          color: 0x182234,
          transparent: true,
          opacity: 0.85
        });
        const cardMesh = new THREE.Mesh(cardGeo, cardMat);
        cardMesh.position.set(x, y, z);
        cardMesh.lookAt(0, y, 0); // Orient facing center

        // Glowing border edge
        const edgeGeo = new THREE.EdgesGeometry(cardGeo);
        const edgeMat = new THREE.LineBasicMaterial({
          color: doc.category === 'EMERGENCY_PLAYBOOK' ? 0xe50914 : 0x38bdf8,
          linewidth: 1.5
        });
        const edge = new THREE.LineSegments(edgeGeo, edgeMat);
        cardMesh.add(edge);

        libraryGroup.add(cardMesh);
        cardMeshes.push({ mesh: cardMesh, doc });
      });

      // Raycasting
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera!);
        const intersects = raycaster.intersectObjects(cardMeshes.map(c => c.mesh));
        if (intersects.length > 0) {
          const hit = cardMeshes.find(c => c.mesh === intersects[0].object);
          if (hit) {
            setHoveredDoc(hit.doc);
            container.style.cursor = 'pointer';
            return;
          }
        }
        setHoveredDoc(null);
        container.style.cursor = 'default';
      };

      const onClick = () => {
        if (hoveredDoc) {
          onSelectDocument(hoveredDoc);
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

      // Animate
      let clock = new THREE.Clock();
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Slow smooth carousel rotation
        libraryGroup.rotation.y = t * 0.12;

        // Laser scan sweep
        scanPlane.position.y = Math.sin(t * 2) * 25;

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
      console.warn('[KnowledgeSpace3D] WebGL error:', err);
      setHasWebGL(false);
    }
  }, [documents, isSearching, onSelectDocument, hoveredDoc]);

  return (
    <div className={`relative flex flex-col rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden ${className}`}>
      {/* HUD Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/40 text-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-red-500" />
          <span className="font-bold text-white">3D Neural Knowledge Space (Vector Embeddings)</span>
        </div>
        {isSearching && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            Laser Vector Scan in Progress...
          </div>
        )}
      </div>

      {/* 3D Canvas / 2D Fallback */}
      <div 
        ref={containerRef} 
        className="relative w-full h-[400px] flex items-center justify-center overflow-hidden bg-radial from-slate-950 via-[#06080d] to-black"
      >
        {!hasWebGL && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full h-full overflow-y-auto">
            {documents.map(d => (
              <div
                key={d.id}
                onClick={() => onSelectDocument(d)}
                className="p-3 rounded-lg border border-white/10 bg-black/60 hover:border-red-500/50 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-red-400 text-[10px]">{d.category}</span>
                  <span className="text-[10px] text-slate-400">{d.chunks?.length || 0} chunks</span>
                </div>
                <div className="font-semibold text-white text-xs truncate">{d.title}</div>
              </div>
            ))}
          </div>
        )}

        {/* Hover Document Dossier Card */}
        {hoveredDoc && (
          <div className="absolute top-4 left-4 max-w-sm bg-black/85 backdrop-blur-md border border-white/15 rounded-xl p-3.5 shadow-2xl z-20 animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-1">
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold">
                {hoveredDoc.category}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {hoveredDoc.chunks?.length || 1} Chunks
              </span>
            </div>
            <div className="font-bold text-white text-sm mt-1">
              {hoveredDoc.title}
            </div>
            <p className="text-[11px] text-slate-300 mt-1 line-clamp-3">
              {hoveredDoc.content}
            </p>
            <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-red-400 font-mono flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Click to open document chunks & policies
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
