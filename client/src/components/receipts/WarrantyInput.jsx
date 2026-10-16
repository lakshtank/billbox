import * as React from 'react';
import { Shield, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Unified Warranty input component
 * Combines numeric duration and unit selector (mo / yr / d) into a single cohesive control.
 */
export function WarrantyInput({
  value = '',
  unit = 'months',
  onValueChange,
  onUnitChange,
  className,
  disabled = false,
  placeholder = '0',
}) {
  const numericVal = Number(value);
  const hasWarranty = !isNaN(numericVal) && numericVal > 0;

  return (
    <div
      className={cn(
        'group inline-flex items-center h-8 rounded-[8px] border border-line bg-surface transition-all shadow-2xs overflow-hidden',
        'hover:border-line-strong focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20',
        hasWarranty && 'border-accent/40 bg-accent/[0.02]',
        disabled && 'opacity-60 pointer-events-none bg-subtle/50',
        className
      )}
      title={hasWarranty ? `Warranty: ${value} ${unit}` : 'No warranty coverage'}
    >
      {/* Decorative Shield Indicator */}
      <div className="pl-2 pr-1 flex items-center justify-center shrink-0">
        <Shield
          className={cn(
            'size-3.5 transition-colors duration-fast',
            hasWarranty
              ? 'text-accent fill-accent/15'
              : 'text-fg-3/40 group-hover:text-fg-3/70'
          )}
        />
      </div>

      {/* Numeric Period Input */}
      <input
        type="number"
        min="0"
        max="999"
        value={value === 0 ? '0' : (value ?? '')}
        onChange={(e) => onValueChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'w-9 min-w-0 flex-1 h-full bg-transparent text-xs font-medium text-center text-fg tnum focus:outline-none placeholder:text-fg-3/40 px-0.5',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
        )}
      />

      {/* Subtle Divider */}
      <span className="w-px h-3.5 bg-line-subtle shrink-0" />

      {/* Unit Selector */}
      <div className="relative flex items-center shrink-0">
        <select
          value={unit || 'months'}
          onChange={(e) => onUnitChange?.(e.target.value)}
          disabled={disabled}
          className="appearance-none bg-transparent text-[11px] font-medium text-fg-2 hover:text-fg focus:outline-none pl-1.5 pr-4 h-8 cursor-pointer disabled:cursor-not-allowed"
          title="Warranty unit"
        >
          <option value="months" className="bg-surface text-fg">mo</option>
          <option value="years" className="bg-surface text-fg">yr</option>
          <option value="days" className="bg-surface text-fg">d</option>
        </select>
        <ChevronDown className="size-3 text-fg-3 pointer-events-none absolute right-1 shrink-0" />
      </div>
    </div>
  );
}

export default WarrantyInput;
