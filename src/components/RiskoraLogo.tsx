import React, { useState, useRef } from 'react';

export interface RiskoraLogoProps {
  /**
   * Preset sizing:
   * - 'sidebar': compact height (~34px icon, 14px font) for narrow sidebars
   * - 'header': standard navbar height (~40px icon, 17px font)
   * - 'large': prominent display (~76px-84px icon, 24px-28px font) for login/auth/modals
   * - 'icon-only': shield symbol only without text
   */
  size?: 'sidebar' | 'header' | 'large' | 'icon-only';
  /**
   * Optional custom layout style:
   * - 'inline': icon and text side-by-side (default for header & sidebar)
   * - 'stacked': icon on top, text underneath (great for login/large)
   */
  layout?: 'inline' | 'stacked';
  /**
   * If true, renders just the icon (useful for collapsed sidebar state)
   */
  collapsed?: boolean;
  /**
   * Whether to enable interactive hover/tilt effect
   */
  interactive?: boolean;
  /**
   * Optional click handler
   */
  onClick?: () => void;
  /**
   * Additional custom CSS classes
   */
  className?: string;
  /**
   * Optional custom subtitle (defaults to "intelligent risk detection")
   */
  subtitle?: string;
}

export const RiskoraLogo: React.FC<RiskoraLogoProps> = ({
  size = 'header',
  layout = 'inline',
  collapsed = false,
  interactive = true,
  onClick,
  className = '',
  subtitle
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: -(y / (rect.height / 2)) * 6,
      y: (x / (rect.width / 2)) * 6
    });
  };

  const handleMouseEnter = () => {
    if (interactive) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setIsHovered(false);
      setTilt({ x: 0, y: 0 });
    }
  };

  const iconDimensions = {
    sidebar: { w: 34, h: 38 },
    header: { w: 42, h: 46 },
    large: { w: 80, h: 88 },
    'icon-only': { w: 42, h: 46 }
  }[size] || { w: 42, h: 46 };

  const isStacked = layout === 'stacked' || (size === 'large' && layout !== 'inline');
  const showText = !collapsed && size !== 'icon-only';

  const defaultSubtitle = 'intelligent risk detection';
  const displaySubtitle = subtitle !== undefined ? subtitle : defaultSubtitle;

  return (
    <div
      ref={containerRef}
      id={`riskora-logo-${size}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className={`group select-none inline-flex items-center ${
        isStacked ? 'flex-col justify-center text-center gap-3' : 'flex-row gap-3'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'} ${className}`}
      style={{
        perspective: '1000px',
      }}
    >
      {/* Shield Symbol Container */}
      <div
        className="relative shrink-0 transition-transform duration-300 ease-out"
        style={{
          width: iconDimensions.w,
          height: iconDimensions.h,
          transformStyle: 'preserve-3d',
          transform: isHovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.03)`
            : 'rotateX(0deg) rotateY(0deg) scale(1)',
          filter: isHovered
            ? 'drop-shadow(0 0 18px rgba(0, 240, 255, 0.5)) drop-shadow(0 8px 24px rgba(2, 132, 199, 0.45))'
            : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 8px rgba(0, 195, 255, 0.2))',
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), filter 300ms ease'
        }}
      >
        <svg
          viewBox="0 0 100 112"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Outer Metallic Chrome / Titanium Rim */}
            <linearGradient id="rk-metallic-rim" x1="0" y1="0" x2="100" y2="112" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="18%" stopColor="#CBD5E1" />
              <stop offset="38%" stopColor="#64748B" />
              <stop offset="55%" stopColor="#94A3B8" />
              <stop offset="78%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Left Shield Facet */}
            <linearGradient id="rk-shield-left-facet" x1="12" y1="12" x2="50" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F2847" />
              <stop offset="35%" stopColor="#0A3C6E" />
              <stop offset="70%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#082F49" />
            </linearGradient>

            {/* Right Shield Facet */}
            <linearGradient id="rk-shield-right-facet" x1="88" y1="12" x2="50" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#05172A" />
              <stop offset="45%" stopColor="#07223D" />
              <stop offset="85%" stopColor="#031F36" />
              <stop offset="100%" stopColor="#02101F" />
            </linearGradient>

            {/* Electric Blue Core Glow */}
            <radialGradient id="rk-electric-core-glow" cx="50" cy="45" r="45" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.38" />
              <stop offset="45%" stopColor="#0284C7" stopOpacity="0.22" />
              <stop offset="85%" stopColor="#031F36" stopOpacity="0" />
            </radialGradient>

            {/* Stylized "R" Primary Face */}
            <linearGradient id="rk-r-face" x1="30" y1="28" x2="74" y2="82" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="22%" stopColor="#E0F2FE" />
              <stop offset="48%" stopColor="#38BDF8" />
              <stop offset="80%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            {/* Stylized "R" Chamfer Highlight */}
            <linearGradient id="rk-r-chamfer" x1="28" y1="26" x2="36" y2="84" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#BAE6FD" />
              <stop offset="80%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>

            {/* Stylized "R" Depth Extrusion */}
            <linearGradient id="rk-r-shadow" x1="40" y1="36" x2="74" y2="84" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#082F49" />
              <stop offset="60%" stopColor="#021324" />
              <stop offset="100%" stopColor="#010A14" />
            </linearGradient>

            {/* Glass sweep */}
            <linearGradient id="rk-glass-sweep" x1="20" y1="12" x2="75" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
              <stop offset="30%" stopColor="#E0F2FE" stopOpacity="0.18" />
              <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Neon Glow Filter */}
            <filter id="rk-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ambient Back Drop Shadow */}
          <path
            d="M 50,7 C 68,7 86,13 92,20 C 94,48 90,78 50,107 C 10,78 6,48 8,20 C 14,13 32,7 50,7 Z"
            fill="#01060D"
            opacity="0.8"
          />

          {/* Outer Metallic Bevel Rim */}
          <path
            d="M 50,4 C 69,4 88,10 94,18 C 96,48 92,80 50,110 C 8,80 4,48 6,18 C 12,10 31,4 50,4 Z"
            fill="url(#rk-metallic-rim)"
          />

          {/* Cyan Neon Edge Trench */}
          <path
            d="M 50,7 C 67,7 85,12 90,19 C 92,46 88,76 50,105 C 12,76 8,46 10,19 C 15,12 33,7 50,7 Z"
            fill="#05101E"
            stroke="#00F0FF"
            strokeWidth="1.2"
            strokeOpacity="0.85"
            filter="url(#rk-neon-glow)"
          />

          {/* Inner Shield Left Facet */}
          <path
            d="M 50,9 L 12,21 C 10,47 14,75 50,103 L 50,9 Z"
            fill="url(#rk-shield-left-facet)"
          />

          {/* Inner Shield Right Facet */}
          <path
            d="M 50,9 L 88,21 C 90,47 86,75 50,103 L 50,9 Z"
            fill="url(#rk-shield-right-facet)"
          />

          {/* Center Vertical Ridge */}
          <line
            x1="50"
            y1="9"
            x2="50"
            y2="103"
            stroke="#38BDF8"
            strokeWidth="1"
            strokeOpacity="0.4"
          />

          {/* Isometric Micro Grid */}
          <g opacity="0.16" stroke="#00F0FF" strokeWidth="0.6">
            <line x1="22" y1="36" x2="78" y2="36" />
            <line x1="26" y1="52" x2="74" y2="52" />
            <line x1="32" y1="68" x2="68" y2="68" />
            <line x1="38" y1="84" x2="62" y2="84" />
            <circle cx="50" cy="24" r="1.2" fill="#00F0FF" />
            <circle cx="32" cy="52" r="1.2" fill="#00F0FF" />
            <circle cx="68" cy="52" r="1.2" fill="#00F0FF" />
          </g>

          {/* Electric Core Glow */}
          <circle cx="50" cy="48" r="32" fill="url(#rk-electric-core-glow)" />

          {/* Stylized "R" Security Emblem */}
          {/* Shadow Behind "R" */}
          <g transform="translate(1.5, 2.5)" opacity="0.6">
            <path
              d="M 33,27 L 60,27 C 69,27 75,33 75,41 C 75,49 69,54 61,55 L 73,85 L 61,85 L 50,56 L 44,56 L 44,85 L 33,85 Z M 44,38 L 44,46 L 58,46 C 62,46 65,44 65,41 C 65,38 62,38 58,38 Z"
              fill="url(#rk-r-shadow)"
            />
          </g>

          {/* Chamfer Behind "R" */}
          <path
            d="M 32,25 L 61,25 C 70,25 76,32 76,41 C 76,50 70,55 62,56 L 74,86 L 60,86 L 49,57 L 44,57 L 44,86 L 32,86 Z M 44,36 L 44,47 L 59,47 C 63,47 66,45 66,41 C 66,37 63,36 59,36 Z"
            fill="url(#rk-r-chamfer)"
          />

          {/* Main "R" Face */}
          <path
            d="M 33,26 L 60,26 C 68,26 74,32 74,41 C 74,49 68,54 60,55 L 72,85 L 59,85 L 48,56 L 44,56 L 44,85 L 33,85 Z M 44,37 L 44,46 L 58,46 C 62,46 64,44 64,41 C 64,38 62,37 58,37 Z"
            fill="url(#rk-r-face)"
          />

          {/* "R" Loop Specular Core Highlight */}
          <line
            x1="35"
            y1="27"
            x2="59"
            y2="27"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeOpacity="0.95"
          />
          <path
            d="M 44,39 L 57,39 C 60,39 61,40 61,41"
            stroke="#FFFFFF"
            strokeWidth="0.8"
            strokeOpacity="0.8"
            fill="none"
          />

          {/* Diagonal Kick Leg Specular Flare */}
          <line
            x1="52"
            y1="61"
            x2="70"
            y2="83"
            stroke="#E0F2FE"
            strokeWidth="1.2"
            strokeOpacity="0.9"
          />

          {/* Glass Sweep Overlay */}
          <path
            d="M 14,21 C 28,12 68,12 84,21 C 88,38 82,58 64,62 C 40,68 22,54 14,21 Z"
            fill="url(#rk-glass-sweep)"
          />

          {/* Top Crest Metallic Highlights */}
          <path
            d="M 50,5 C 67,5 84,10 90,17"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeOpacity="0.85"
            strokeLinecap="round"
          />
          <path
            d="M 50,5 C 33,5 16,10 10,17"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeOpacity="0.5"
            strokeLinecap="round"
          />

          {/* Bottom Sharp Vertex Indicator */}
          <polygon
            points="50,103 48,98 52,98"
            fill="#00F0FF"
            filter="url(#rk-neon-glow)"
          />
        </svg>

        {isHovered && (
          <div className="absolute -bottom-2 inset-x-2 h-2 bg-cyan-400/25 blur-md rounded-full pointer-events-none transition-opacity duration-300" />
        )}
      </div>

      {/* Typography: "Riskora" — "intelligent risk detection" */}
      {showText && (
        <div className={`flex flex-col ${isStacked ? 'items-center text-center' : 'items-start text-left'}`}>
          {/* Main Brand Name: "Risk" (metallic) + "ora" (electric cyan/blue) */}
          <div className="flex items-baseline tracking-tight font-black font-sans leading-none">
            <span
              className={`font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] ${
                size === 'sidebar'
                  ? 'text-base'
                  : size === 'header'
                  ? 'text-lg sm:text-xl'
                  : 'text-2xl sm:text-3xl'
              }`}
              style={{
                letterSpacing: '-0.02em',
                textShadow: '0 2px 10px rgba(255,255,255,0.08)'
              }}
            >
              Risk
            </span>
            <span
              className={`font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 drop-shadow-[0_0_12px_rgba(0,240,255,0.4)] ${
                size === 'sidebar'
                  ? 'text-base'
                  : size === 'header'
                  ? 'text-lg sm:text-xl'
                  : 'text-2xl sm:text-3xl'
              }`}
              style={{
                letterSpacing: '-0.02em'
              }}
            >
              ora
            </span>
          </div>

          {/* Tagline / Subtitle: "intelligent risk detection" */}
          <div
            className={`flex items-center gap-1.5 mt-1 ${
              isStacked ? 'justify-center' : 'justify-start'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`font-sans font-medium text-slate-300 tracking-normal ${
                  size === 'sidebar'
                    ? 'text-[9px]'
                    : size === 'header'
                    ? 'text-[10px] hidden sm:inline'
                    : 'text-[12px]'
                }`}
              >
                {displaySubtitle}
              </span>
            </div>

            {/* Live radar status indicator */}
            <span className="relative flex h-1.5 w-1.5 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Re-export alias for seamless backwards compatibility
export { RiskoraLogo as FraudShieldLogo };
