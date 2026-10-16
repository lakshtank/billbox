import * as React from 'react';
import NumberFlow from '@number-flow/react';
import { useMotionTier } from '@/hooks/useMotionTier';

/**
 * KpiValue
 * Step 5.2 from animation_instruction.md:
 * Rolling number animation with NumberFlow for KPI tiles.
 * - Digits roll individually on mount and on range changes (30d -> 90d)
 * - 700ms timing with cubic-bezier(.16, 1, .3, 1)
 * - Tabular figures (tnum) so width never jitters
 * - Accessible aria-label with exact formatted number from frame 1
 */
export function KpiValue({ value, currency, className = '' }) {
  const tier = useMotionTier();
  const [animatedValue, setAnimatedValue] = React.useState(0);
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;

  React.useEffect(() => {
    if (tier === 'none') {
      setAnimatedValue(numValue);
      return;
    }
    const id = requestAnimationFrame(() => setAnimatedValue(numValue));
    return () => cancelAnimationFrame(id);
  }, [numValue, tier]);

  const formattedAccessible = React.useMemo(() => {
    try {
      if (currency) {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(numValue);
      }
      return new Intl.NumberFormat('en-IN').format(numValue);
    } catch {
      return String(numValue);
    }
  }, [numValue, currency]);

  if (tier === 'none') {
    return (
      <span className={`tnum text-[28px] font-bold tracking-tight text-fg ${className}`} aria-label={formattedAccessible}>
        {formattedAccessible}
      </span>
    );
  }

  return (
    <NumberFlow
      value={animatedValue}
      locales="en-IN"
      format={
        currency
          ? { style: 'currency', currency, maximumFractionDigits: 0 }
          : undefined
      }
      transformTiming={{ duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
      spinTiming={{ duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
      className={`tnum text-[28px] font-bold tracking-tight text-fg ${className}`}
      aria-label={formattedAccessible}
    />
  );
}

export default KpiValue;
