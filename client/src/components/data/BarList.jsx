import * as React from 'react';
import { useState } from 'react';
import { cn } from 'cn';
import { Money } from './Money';

/**
 * BarList Component
 * Step 10: Hover focus for bar lists
 * - Hovered bar stays full opacity (1.0)
 * - Sibling bars drop to 0.45
 * - Transition: opacity 120ms (transition-opacity duration-[120ms] ease-out)
 * - Accessible with keyboard focus (tabIndex={0}, onFocus, onBlur)
 */
export function BarList({
  data = [],
  currency = 'INR',
  className = '',
  onItemClick,
}) {
  const [hoveredKey, setHoveredKey] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-fg-3">
        No breakdown data available
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="Category breakdown bar list"
      className={cn('space-y-3.5 flex-1 justify-center flex flex-col', className)}
      onMouseLeave={() => setHoveredKey(null)}
    >
      {data.map((item) => {
        const key = item.name || item.label || item.id;
        const isHovered = hoveredKey === key;
        const isDimmed = hoveredKey !== null && !isHovered;
        const barPercent = Math.min(100, Math.max(item.percentage ?? 0, 4));

        return (
          <div
            key={key}
            role="listitem"
            tabIndex={0}
            onMouseEnter={() => setHoveredKey(key)}
            onFocus={() => setHoveredKey(key)}
            onBlur={() => setHoveredKey(null)}
            onClick={() => onItemClick?.(item)}
            className={cn(
              'space-y-1 text-xs select-none outline-none rounded-[6px] p-1 -m-1',
              'transition-opacity duration-[120ms] ease-out',
              isDimmed && 'opacity-45',
              isHovered && 'opacity-100',
              onItemClick && 'cursor-pointer hover:bg-hover/50'
            )}
            aria-label={`${item.name || key}: ${item.value ?? item.spend ?? 0}`}
          >
            {/* Header: Label + Value */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-fg truncate">
                {item.name || item.label}
              </span>
              <span className="tnum font-semibold text-fg shrink-0">
                <Money value={item.value ?? item.spend ?? 0} currency={currency} />
              </span>
            </div>

            {/* Horizontal Bar Track */}
            <div className="w-full bg-subtle rounded-full h-2 overflow-hidden border border-line-subtle">
              <div
                className={cn('h-full rounded-full transition-all duration-300', item.color || 'bg-accent')}
                style={{ width: `${barPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BarList;
