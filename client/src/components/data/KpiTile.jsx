import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Minus } from 'lucide-react';
import { cn } from 'cn';
import { KpiValue } from './KpiValue';

/**
 * KpiTile component
 * Step 5 & 9.5:
 * - Surface, radius 12, 1px line, 16px padding
 * - Spotlight border on fine-pointer devices (Step 5.5)
 * - Rolling digits with NumberFlow via KpiValue (Step 5.2)
 * - Overline label (11px uppercase)
 * - Value: display 28px tnum font-bold
 * - Delta line: 13px with arrow icon + ok-fg/bad-fg/fg-3, "vs previous 30 days"
 * - Optional footer link: "View →"
 * - Entire tile is a link/button when it navigates
 * - Zero state: 0 with fg-3 hint
 */
export function KpiTile({
  label,
  value,
  numericValue,
  currency,
  unit,
  delta,
  deltaLabel = 'vs previous 30 days',
  deltaDirection, // 'up' | 'down' | 'neutral'
  to,
  href,
  onClick,
  footerLinkText,
  hint,
  className,
  'data-intro': dataIntro,
}) {
  const isInteractive = Boolean(to || href || onClick);
  const tileRef = React.useRef(null);

  // Spotlight border pointer position tracking (Step 5.5)
  const handlePointerMove = React.useCallback((e) => {
    if (!tileRef.current) return;
    const rect = tileRef.current.getBoundingClientRect();
    tileRef.current.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    tileRef.current.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, []);

  // Compute delta styling & icon
  let deltaColor = 'text-fg-3';
  let DeltaIcon = Minus;

  if (delta !== undefined && delta !== null && delta !== '') {
    if (deltaDirection === 'up') {
      deltaColor = 'text-ok-fg';
      DeltaIcon = ArrowUpRight;
    } else if (deltaDirection === 'down') {
      deltaColor = 'text-bad-fg';
      DeltaIcon = ArrowDownRight;
    } else if (typeof delta === 'number') {
      if (delta > 0) {
        deltaColor = 'text-ok-fg';
        DeltaIcon = ArrowUpRight;
      } else if (delta < 0) {
        deltaColor = 'text-bad-fg';
        DeltaIcon = ArrowDownRight;
      }
    } else if (typeof delta === 'string') {
      if (delta.startsWith('+')) {
        deltaColor = 'text-ok-fg';
        DeltaIcon = ArrowUpRight;
      } else if (delta.startsWith('-') || delta.startsWith('−')) {
        deltaColor = 'text-bad-fg';
        DeltaIcon = ArrowDownRight;
      }
    }
  }

  const renderValue = () => {
    if (numericValue !== undefined && numericValue !== null) {
      return <KpiValue value={numericValue} currency={currency} />;
    }
    if (typeof value === 'number') {
      return <KpiValue value={value} currency={currency} />;
    }
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
    return '0';
  };

  const content = (
    <div
      ref={tileRef}
      onPointerMove={handlePointerMove}
      data-intro={dataIntro}
      className={cn(
        'kpi spotlight group relative flex flex-col justify-between h-full rounded-[12px] border border-line bg-surface p-4 shadow-2xs transition-colors duration-fast text-left select-none overflow-hidden',
        isInteractive && 'hover:border-line-strong hover:bg-hover/50 cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Top Overline Label */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-3 line-clamp-1">
          {label}
        </span>
        {isInteractive && (
          <ArrowRight className="size-3.5 text-fg-3 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>

      {/* Main Metric Value */}
      <div className="my-2 flex items-baseline gap-2">
        <div className="value text-[28px] font-bold tracking-tight text-fg tnum leading-tight">
          {renderValue()}
        </div>
        {unit && <span className="text-xs text-fg-3 font-normal">{unit}</span>}
      </div>

      {/* Delta Line / Footer */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1 border-t border-line-subtle text-[13px]">
        {delta !== undefined && delta !== null && delta !== '' ? (
          <div className="delta flex items-center gap-1.5 line-clamp-1">
            <span className={cn('inline-flex items-center font-medium tnum gap-0.5', deltaColor)}>
              <DeltaIcon className="size-3.5 shrink-0" />
              <span>{typeof delta === 'number' && delta > 0 ? `+${delta}%` : delta}</span>
            </span>
            <span className="text-fg-3 text-xs line-clamp-1">{deltaLabel}</span>
          </div>
        ) : (
          <span className="text-xs text-fg-3">{hint || 'All time'}</span>
        )}

        {footerLinkText && (
          <span className="text-xs font-medium text-accent inline-flex items-center gap-1 ml-auto group-hover:underline">
            {footerLinkText}
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline h-full">
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className="block no-underline h-full">
        {content}
      </a>
    );
  }

  return content;
}

export default KpiTile;
