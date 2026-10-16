import * as React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useInView, useSpring } from 'motion/react';
import * as m from 'motion/react-m';
import { Table, LineChart as ChartIcon } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { useMotionTier } from '@/hooks/useMotionTier';
import { Money } from './Money';

/**
 * Custom Tooltip for SpendingChart
 * Step 10:
 * - Follows cursor with useSpring x/y for a slightly weighted feel
 * - Content swaps instantly (no fade)
 * - Accessible popover style
 */
function ChartCustomTooltip({ active, payload, label, coordinate, viewBox }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <ChartCustomTooltipInner
      payload={payload}
      label={label}
      coordinate={coordinate}
      viewBox={viewBox}
    />
  );
}

function ChartCustomTooltipInner({ payload, label, coordinate, viewBox }) {
  const tier = useMotionTier();
  const dataPoint = payload[0];
  const amount =
    dataPoint?.value ??
    dataPoint?.payload?.total ??
    dataPoint?.payload?.amount ??
    dataPoint?.payload?.spend ??
    0;
  const dateLabel = label || dataPoint?.payload?.date || dataPoint?.payload?.label;

  const targetX = coordinate?.x ?? 0;
  const targetY = coordinate?.y ?? 0;

  const springConfig = { stiffness: 420, damping: 28 };
  const springX = useSpring(targetX, springConfig);
  const springY = useSpring(targetY, springConfig);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (coordinate?.x != null && coordinate?.y != null) {
      if (isFirstRender.current) {
        springX.jump(coordinate.x);
        springY.jump(coordinate.y);
        isFirstRender.current = false;
      } else {
        springX.set(coordinate.x);
        springY.set(coordinate.y);
      }
    }
  }, [coordinate?.x, coordinate?.y, springX, springY]);

  // Keep tooltip within chart boundaries
  const chartWidth = viewBox?.width ?? 600;
  const isNearRight = targetX > chartWidth - 110;
  const isNearLeft = targetX < 80;

  return (
    <m.div
      style={
        tier !== 'none'
          ? { x: springX, y: springY }
          : { transform: `translate(${targetX}px, ${targetY}px)` }
      }
      className="pointer-events-none absolute top-0 left-0 z-30 select-none"
    >
      <div
        className={cn(
          'rounded-[8px] border border-line bg-surface/95 backdrop-blur-xs px-3 py-2 shadow-md text-xs text-fg min-w-[110px] -mt-2',
          isNearRight
            ? '-translate-x-full -translate-y-full ml-4'
            : isNearLeft
            ? '-translate-y-full -ml-4'
            : '-translate-x-1/2 -translate-y-full'
        )}
      >
        <div className="text-fg-3 font-normal text-[11px] mb-0.5">{dateLabel}</div>
        <div className="font-semibold text-sm tnum">
          <Money value={amount} currency="INR" />
        </div>
      </div>
    </m.div>
  );
}

/**
 * SpendingChart Component
 * Step 10 from animation_instruction.md:
 * - AreaChart with fillSpend linearGradient (0.14 -> 0 opacity)
 * - Reveal: chart draws left -> right once when scrolled into view (useInView)
 * - Tooltip: follows cursor with useSpring x/y, content swaps instantly
 * - Legend toggle: toggling a series fades it to 0 and re-scales the axis
 * - Recharts animates path interpolation (morphs) on data change
 */
export function SpendingChart({
  data = [],
  title = 'Spend over time',
  height = 240,
  className,
}) {
  const [viewAsTable, setViewAsTable] = React.useState(false);
  const [seriesVisibility, setSeriesVisibility] = React.useState({ total: true });
  const tier = useMotionTier();

  const containerRef = React.useRef(null);
  const inView = useInView(containerRef, { once: true, margin: '40px' });
  const [hasRevealed, setHasRevealed] = React.useState(false);

  React.useEffect(() => {
    if (inView && !hasRevealed) {
      setHasRevealed(true);
    }
  }, [inView, hasRevealed]);

  // Normalize data so both total and amount are present for every point
  const normalizedData = React.useMemo(() => {
    return data.map((item) => {
      const val = item.total != null ? item.total : item.amount != null ? item.amount : item.spend || 0;
      return {
        ...item,
        total: val,
        amount: val,
      };
    });
  }, [data]);

  // Formatter for Y-axis numbers in thousands/lakhs
  const formatYAxis = (val) => {
    if (val === 0) return '0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  const toggleSeries = (key) => {
    setSeriesVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Re-scale Y-axis domain based on active series
  const yDomain = React.useMemo(() => {
    if (!seriesVisibility.total) {
      return [0, 100];
    }
    return ['auto', 'auto'];
  }, [seriesVisibility.total]);

  const isAnimationActive = tier === 'full' && (hasRevealed || inView);

  return (
    <div
      ref={containerRef}
      className={cn(
        'rounded-[12px] border border-line bg-surface p-4 shadow-2xs text-left h-full flex flex-col justify-between',
        className
      )}
      role="region"
      aria-label={title}
    >
      {/* Chart Header with Legend Toggle & Accessible View Switch */}
      <div className="flex items-center justify-between mb-3 border-b border-line-subtle pb-2.5 shrink-0 flex-wrap gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
          {title}
        </span>

        <div className="flex items-center gap-2">
          {/* Series Legend Toggle (Step 10: Toggling a series fades it to 0 and re-scales axis) */}
          <button
            type="button"
            onClick={() => toggleSeries('total')}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer select-none',
              seriesVisibility.total
                ? 'bg-subtle text-fg border border-line-subtle'
                : 'bg-transparent text-fg-3 line-through opacity-60 border border-transparent'
            )}
            title={seriesVisibility.total ? 'Hide Spend series' : 'Show Spend series'}
            aria-pressed={seriesVisibility.total}
          >
            <span
              className={cn(
                'size-2 rounded-full transition-colors',
                seriesVisibility.total ? 'bg-[var(--chart-1)]' : 'bg-fg-muted'
              )}
            />
            <span>Spend</span>
          </button>

          {/* Accessible Table View Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewAsTable(!viewAsTable)}
            className="h-7 px-2 text-xs text-fg-2 hover:text-fg gap-1.5 cursor-pointer"
            aria-label={viewAsTable ? 'View as chart' : 'View as table'}
          >
            {viewAsTable ? (
              <>
                <ChartIcon className="size-3" />
                <span>View chart</span>
              </>
            ) : (
              <>
                <Table className="size-3" />
                <span>View as table</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {viewAsTable ? (
        /* Accessible Table Alternative */
        <div
          className="flex-1 overflow-y-auto border border-line-subtle rounded-[8px]"
          style={{ minHeight: height }}
        >
          <table className="w-full text-xs text-left">
            <thead className="bg-subtle text-fg-3 sticky top-0 border-b border-line">
              <tr>
                <th className="p-2 font-semibold">Date / Period</th>
                <th className="p-2 font-semibold text-right">Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {normalizedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-hover">
                  <td className="p-2 text-fg-2">{row.label || row.date}</td>
                  <td className="p-2 text-right">
                    <Money value={row.total} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Recharts Area SVG Chart */
        <div
          role="img"
          aria-label={`${title}: Area chart displaying spending trends over time`}
          className="flex-1 w-full"
          style={{ minHeight: height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={normalizedData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Horizontal gridlines only */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--line-subtle)"
              />

              <XAxis
                dataKey="label"
                stroke="var(--fg-muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
              />

              <YAxis
                stroke="var(--fg-muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
                domain={yDomain}
              />

              <RechartsTooltip
                cursor={{ stroke: 'var(--line-strong)', strokeDasharray: '3 3' }}
                content={<ChartCustomTooltip />}
                isAnimationActive={false}
                position={{ x: 0, y: 0 }}
              />

              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--chart-1)"
                strokeWidth={1.5}
                fill="url(#fillSpend)"
                isAnimationActive={isAnimationActive}
                animationDuration={800}
                animationEasing="ease-out"
                dot={false}
                style={{
                  transition: 'opacity 200ms ease-out',
                  opacity: seriesVisibility.total ? 1 : 0,
                }}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: 'var(--bg-surface)',
                  fill: 'var(--chart-1)',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default SpendingChart;
