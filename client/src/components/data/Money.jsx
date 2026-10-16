import * as React from 'react';
import { cn } from 'cn';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

/**
 * Money component
 * Step 9.2:
 * - Formats amounts with locale-aware grouping (e.g., en-IN for INR: ₹1,29,682.00)
 * - Tabular numbers (.tnum)
 * - Negative values rendered in bad-fg with minus sign
 * - Missing / null / undefined values rendered as "—"
 * - Optional original prop displays a "Converted" tooltip chip showing the original amount
 * - Never animates numbers
 */
export function Money({
  value,
  currency = 'INR',
  original,
  className,
  showZero = true,
}) {
  if (value === null || value === undefined || value === '') {
    return <span className={cn('text-fg-3 select-none', className)}>—</span>;
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) {
    return <span className={cn('text-fg-3 select-none', className)}>—</span>;
  }

  if (num === 0 && !showZero) {
    return <span className={cn('text-fg-3 select-none', className)}>—</span>;
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const normalizedCurrency = (currency || 'INR').toUpperCase();

  const locale = normalizedCurrency === 'INR' ? 'en-IN' : 'en-US';

  let formatted = '';
  try {
    formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absNum);
  } catch {
    formatted = `${normalizedCurrency} ${absNum.toFixed(2)}`;
  }

  const content = (
    <span
      className={cn(
        'tnum whitespace-nowrap font-medium',
        isNegative ? 'text-bad-fg' : 'text-fg',
        className
      )}
    >
      {isNegative ? `−${formatted}` : formatted}
    </span>
  );

  if (original) {
    const origAmount = typeof original === 'object' ? original.amount : original;
    const origCurrency = typeof original === 'object' ? original.currency : 'USD';
    const formattedOriginal = `${origCurrency} ${Number(origAmount || 0).toLocaleString()}`;

    return (
      <span className="inline-flex items-center gap-1.5">
        {content}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center text-[10px] font-normal text-fg-3 bg-subtle hover:bg-hover border border-line px-1.5 py-0.2 rounded cursor-help transition-colors select-none">
              Converted
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <span>Original: {formattedOriginal}</span>
          </TooltipContent>
        </Tooltip>
      </span>
    );
  }

  return content;
}

export default Money;
