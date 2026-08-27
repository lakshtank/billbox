import { useMemo } from 'react';
import { formatCurrency } from '../../utils/formatters';

const SpendingChart = ({ data = [], currency = 'INR' }) => {
  const isRealData = Array.isArray(data) && data.length > 0;

  const chartPoints = useMemo(() => {
    if (isRealData) {
      return data;
    }

    // Default sample fallback matching initial wireframe layout if 0 receipts exist
    return [
      { date: '10 Jul', amount: 2500 },
      { date: '13 Jul', amount: 5600 },
      { date: '16 Jul', amount: 1400 },
      { date: '18 Jul', amount: 2800 },
      { date: '21 Jul', amount: 5200 },
      { date: '23 Jul', amount: 7800 },
      { date: '26 Jul', amount: 6900 },
      { date: '29 Jul', amount: 6400 },
      { date: '31 Jul', amount: 2800 },
      { date: '04 Aug', amount: 5600 },
      { date: '07 Aug', amount: 2500 },
      { date: '09 Aug', amount: 5600 },
    ];
  }, [data, isRealData]);

  const maxAmount = useMemo(() => {
    const rawMax = Math.max(...chartPoints.map((p) => Number(p.amount) || 0), 0);
    if (rawMax === 0) return 1000;
    
    // Dynamic order of magnitude rounding
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const steps = Math.ceil(rawMax / (magnitude / 2)) * (magnitude / 2);
    return steps;
  }, [chartPoints]);

  const yTicks = useMemo(() => {
    return [
      maxAmount,
      Math.round(maxAmount * 0.8),
      Math.round(maxAmount * 0.6),
      Math.round(maxAmount * 0.4),
      Math.round(maxAmount * 0.2),
      0,
    ];
  }, [maxAmount]);

  const formatYTick = (val) => {
    if (val >= 100000) return `₹${(val / 1000).toFixed(0)}K`;
    if (val >= 1000) {
      const k = val / 1000;
      return `₹${Number.isInteger(k) ? k : k.toFixed(1)}K`;
    }
    return `₹${val}`;
  };

  return (
    <div className="w-full space-y-4 font-sans text-[#0F172A]">
      {/* Header & Legend */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
          Spending over time
        </h2>
        <div className="flex items-center gap-2 text-xs text-[#64748B] font-medium">
          <span className="w-3 h-0.5 bg-[#047857] inline-block rounded-full"></span>
          <span>Amount spent (₹)</span>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="pt-2">
        <div className="relative h-48 w-full flex flex-col justify-between">
          {/* Grid lines and Y-axis labels */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {yTicks.map((tick, idx) => (
              <div key={idx} className="flex items-center w-full gap-3">
                <span className="text-[11px] font-medium text-[#64748B] font-tabular w-12 text-right shrink-0">
                  {formatYTick(tick)}
                </span>
                <div className="flex-1 border-b border-dashed border-[#E2E8F0] h-0" />
              </div>
            ))}
          </div>

          {/* Bars Container */}
          <div className="absolute inset-y-0 left-14 right-2 flex items-end justify-around px-1 pt-4">
            {chartPoints.map((pt, idx) => {
              const heightPercent = maxAmount > 0 ? (pt.amount / maxAmount) * 100 : 0;
              // Minimum height of 10% so smaller amounts stay visible & hoverable
              const displayHeight = Math.max(10, Math.min(100, heightPercent));

              return (
                <div key={idx} className="group relative flex flex-col items-center justify-end h-full flex-1 max-w-[18px] sm:max-w-[24px]">
                  {/* Hover Tooltip */}
                  <div className="absolute -top-8 hidden group-hover:flex px-2 py-1 bg-[#0F172A] text-white text-[10px] font-bold rounded shadow-xs z-10 whitespace-nowrap font-tabular">
                    {formatCurrency(pt.amount, currency)} ({pt.date})
                  </div>
                  {/* Bar */}
                  <div
                    className="w-full bg-[#047857] hover:bg-[#059669] transition-all rounded-xs cursor-pointer"
                    style={{ height: `${displayHeight}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic X-axis Dates Row */}
        <div className="flex items-center justify-around pl-14 pr-2 pt-3 text-[11px] font-medium text-[#64748B] font-tabular">
          {chartPoints.map((pt, idx) => (
            <span key={idx} className="truncate max-w-[60px] text-center">
              {pt.date}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpendingChart;
