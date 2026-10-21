import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DayMovement } from '../types';

interface MovementBadgeProps {
  movement: DayMovement;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const MovementBadge: React.FC<MovementBadgeProps> = ({
  movement,
  size = 'md',
  showSubtitle = false
}) => {
  const isUp = movement.direction === 'up';
  const isDown = movement.direction === 'down';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base sm:text-lg px-4 py-2 gap-2 font-semibold',
  };

  const bgClasses = isUp
    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
    : isDown
    ? 'bg-rose-950/60 text-rose-400 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
    : 'bg-gray-800/60 text-gray-300 border border-gray-600/40';

  return (
    <div className="inline-flex flex-col items-start">
      <div className={`inline-flex items-center rounded-full font-mono ${sizeClasses[size]} ${bgClasses}`}>
        {isUp && <TrendingUp className="w-4 h-4 shrink-0 text-emerald-400" />}
        {isDown && <TrendingDown className="w-4 h-4 shrink-0 text-rose-400" />}
        {!isUp && !isDown && <Minus className="w-4 h-4 shrink-0 text-gray-400" />}
        <span>{movement.formatted}</span>
      </div>
      {showSubtitle && movement.referenceDate && (
        <span className="text-[10px] text-gray-500 mt-1 pl-1">
          Compared to benchmark record on {movement.referenceDate}
        </span>
      )}
    </div>
  );
};
