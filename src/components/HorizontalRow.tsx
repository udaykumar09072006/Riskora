import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalRowProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  onViewAll?: () => void;
  className?: string;
}

export const HorizontalRow: React.FC<HorizontalRowProps> = ({
  title,
  subtitle,
  badge,
  badgeColor = 'bg-red-500/20 text-red-400 border-red-500/30',
  children,
  onViewAll,
  className = ''
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;
    const scrollAmount = clientWidth * 0.75;
    rowRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section className={`relative space-y-3 group/row ${className}`}>
      {/* Row Header */}
      <div className="flex items-end justify-between px-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              {title}
            </h2>
            {badge && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-mono text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            Explore all <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Row Content Container with Side Chevron Arrows */}
      <div className="relative">
        {/* Left Scroll Chevron */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/80 hover:bg-red-600/90 text-white border border-white/20 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-200 shadow-xl backdrop-blur-xs disabled:opacity-0"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={rowRef}
          className="flex items-stretch gap-4 overflow-x-auto scrollbar-none px-4 sm:px-6 py-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>

        {/* Right Scroll Chevron */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/80 hover:bg-red-600/90 text-white border border-white/20 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-200 shadow-xl backdrop-blur-xs"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
};
