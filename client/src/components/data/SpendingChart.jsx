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
import { Table, LineChart as ChartIcon } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { useMotionTier } from '@/hooks/useMotionTier';
import { Money } from './Money';

/**
 * Custom Tooltip for SpendingChart (matches popover style)
 */
function ChartCustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0];
    const amount = dataPoint.value;

    return (
      <div className="rounded-[8px] border border-line bg-surface p-2.5 shadow-[var(--elevation-2)] text-xs text-fg">
        <div className="text-fg-3 font-normal mb-1">{label || dataPoint.payload?.date}</div>
        <div className="font-semibold text-sm">
          <Money value={amount} currency="INR" />
        </div>
      </div>
    );
  }
  return null;
}

/**
 * SpendingChart Component
 * Step 9.6:
 * - Area/line for spend over time: 1.5px stroke chart-1, 8% fill, no dots until hover
 * - Horizontal gridlines only (line-subtle), 12px axis labels fg-3, tabular
 * - Popover style tooltip with date + exact amount
 * - Text alternative table toggle ("View as table")
 * - role="img" with descriptive label
 * - No animation on load (isAnimationActive={false})
 */
export function SpendingChart({
  data = [],
  title = 'Spend Over Time',
  height = 240,
  className,
}) {
  const [viewAsTable, setViewAsTable] = React.useState(false);
  const tier = useMotionTier();

  // Formatter for Y-axis numbers in thousands/lakhs
  const formatYAxis = (val) => {
    if (val === 0) return '0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  return (
    <div
      className={cn(
        'rounded-[12px] border border-line bg-surface p-4 shadow-2xs text-left h-full flex flex-col justify-between',
        className
      )}
      role="region"
      aria-label={title}
    >
      {/* Chart Header with accessible View Toggle */}
      <div className="flex items-center justify-between mb-3 border-b border-line-subtle pb-2.5 shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
          {title}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewAsTable(!viewAsTable)}
          className="h-7 px-2 text-xs text-fg-2 hover:text-fg gap-1.5"
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
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-hover">
                  <td className="p-2 text-fg-2">{row.label || row.date}</td>
                  <td className="p-2 text-right">
                    <Money value={row.amount || row.spend || 0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Recharts SVG Chart */
        <div
          role="img"
          aria-label={`${title}: Area chart displaying spending trends over time`}
          className="flex-1 w-full"
          style={{ minHeight: height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
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
              />

              <RechartsTooltip content={<ChartCustomTooltip />} />

              <Area
                type="monotone"
                dataKey="amount"
                stroke="var(--chart-1)"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#spendGradient)"
                isAnimationActive={tier === 'full'}
                animationDuration={600}
                animationEasing="ease-out"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: 'var(--chart-1)',
                  stroke: 'var(--bg-surface)',
                  strokeWidth: 2,
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
