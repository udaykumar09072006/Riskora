import React, { useRef, useState } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'red' | 'blue' | 'amber' | 'green' | 'none';
  onClick?: () => void;
  id?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  glowColor = 'red',
  onClick,
  id
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15
    });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  const getGlowStyles = () => {
    switch (glowColor) {
      case 'red':
        return 'hover:border-red-500/50 hover:shadow-[0_0_25px_rgba(229,9,20,0.25)]';
      case 'amber':
        return 'hover:border-amber-500/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]';
      case 'green':
        return 'hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]';
      case 'blue':
        return 'hover:border-sky-500/50 hover:shadow-[0_0_25px_rgba(56,189,248,0.25)]';
      default:
        return 'hover:border-white/20';
    }
  };

  return (
    <div
      id={id}
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, transition: 'transform 0.15s ease-out, box-shadow 0.2s ease, border-color 0.2s ease' }}
      className={`relative rounded-xl border border-white/10 bg-[#0d0d0d] overflow-hidden ${getGlowStyles()} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Glare effect */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
          opacity: glarePos.opacity
        }}
      />
      {children}
    </div>
  );
};
