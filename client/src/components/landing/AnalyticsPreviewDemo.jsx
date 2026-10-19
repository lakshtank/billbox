import React, { useState, useEffect, useRef } from 'react';
import * as m from 'motion/react-m';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Sparkles,
  PieChart,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Simulated realistic trend data for different time horizons
const DATA_30D = [
  { date: 'Sep 20', spend: 12400, warranties: 1 },
  { date: 'Sep 25', spend: 28900, warranties: 2 },
  { date: 'Sep 30', spend: 34500, warranties: 3 },
  { date: 'Oct 05', spend: 52100, warranties: 4 },
  { date: 'Oct 10', spend: 89000, warranties: 6 },
  { date: 'Oct 15', spend: 145000, warranties: 7 },
  { date: 'Oct 19', spend: 173700, warranties: 8 },
];

const DATA_90D = [
  { date: 'Jul', spend: 45000, warranties: 3 },
  { date: 'Aug', spend: 98000, warranties: 5 },
  { date: 'Sep', spend: 165000, warranties: 7 },
  { date: 'Oct', spend: 248700, warranties: 11 },
];

const DATA_1Y = [
  { date: 'Q1', spend: 75000, warranties: 4 },
  { date: 'Q2', spend: 140000, warranties: 8 },
  { date: 'Q3', spend: 215000, warranties: 11 },
  { date: 'Q4', spend: 312000, warranties: 14 },
];

export default function AnalyticsPreviewDemo({ className = '' }) {
  const containerRef = useRef(null);
  const [horizon, setHorizon] = useState('30d');
  const [animKey, setAnimKey] = useState(0);
  const [inView, setInView] = useState(false);

  // Re-trigger animation every time user scrolls to/reaches this section
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setInView(true);
          // Increment animation key to restart chart and card entrance animations
          setAnimKey((k) => k + 1);
          if (window.lenis) {
            window.lenis.resize();
          }
        } else {
          setInView(false);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleHorizonChange = (h) => {
    setHorizon(h);
    setAnimKey((k) => k + 1);
    if (window.lenis) {
      setTimeout(() => window.lenis.resize(), 50);
    }
  };

  let currentData = DATA_30D;
  let totalSpend = '₹1,73,700';
  let activeWarranties = '8 Items';
  let expiringSoon = '2 Critical';
  let growth = '+24.5%';

  if (horizon === '90d') {
    currentData = DATA_90D;
    totalSpend = '₹2,48,700';
    activeWarranties = '11 Items';
    expiringSoon = '3 Approaching';
    growth = '+38.2%';
  } else if (horizon === '1y') {
    currentData = DATA_1Y;
    totalSpend = '₹3,12,000';
    activeWarranties = '14 Items';
    expiringSoon = '4 Covered';
    growth = '+52.0%';
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-3xl bg-surface border border-line shadow-xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-lg sm:text-xl font-bold text-fg">
              Real-Time Spending &amp; Warranty Intelligence
            </h3>
          </div>
          <p className="text-xs text-fg-3 mt-1">
            Dynamic Recharts tracking aggregate invoice value and active protection coverage.
          </p>
        </div>

        {/* Horizon Tabs */}
        <div className="inline-flex items-center p-1 rounded-xl bg-subtle border border-line-subtle text-xs font-semibold">
          {[
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
            { id: '1y', label: '1 Year' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleHorizonChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                horizon === tab.id
                  ? 'bg-surface text-fg shadow-xs font-bold'
                  : 'text-fg-3 hover:text-fg'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Cards with smooth entrance flourish on each visit */}
      <m.div
        key={`kpi-row-${animKey}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-6"
      >
        <div className="p-4 rounded-2xl bg-subtle/50 border border-line-subtle hover:border-accent/30 transition-colors">
          <p className="text-[11px] font-medium text-fg-3 uppercase tracking-wider">
            Protected Expenditure
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl sm:text-2xl font-extrabold font-mono text-fg">
              {totalSpend}
            </p>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="size-3" />
              {growth}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-subtle/50 border border-line-subtle hover:border-accent/30 transition-colors">
          <p className="text-[11px] font-medium text-fg-3 uppercase tracking-wider">
            Active Hardware Warranties
          </p>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-accent mt-1">
            {activeWarranties}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-subtle/50 border border-line-subtle hover:border-accent/30 transition-colors">
          <p className="text-[11px] font-medium text-fg-3 uppercase tracking-wider">
            Critical Expiry Alerts
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-xl sm:text-2xl font-extrabold font-mono text-amber-600">
              {expiringSoon}
            </p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold">
              ≤30d
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-subtle/50 border border-line-subtle hover:border-accent/30 transition-colors">
          <p className="text-[11px] font-medium text-fg-3 uppercase tracking-wider">
            Verified Store Proofs
          </p>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 mt-1">
            100% Synced
          </p>
        </div>
      </m.div>

      {/* Interactive Area Chart - Keyed by animKey so it smoothly draws every time user scrolls to it */}
      <div className="w-full h-64 sm:h-72 mt-2 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            key={`chart-${animKey}-${horizon}`}
            data={currentData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="spendGradientAnimated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-3 rounded-xl bg-surface border border-line shadow-xl text-xs font-sans">
                      <p className="font-bold text-fg">{label}</p>
                      <p className="text-accent font-mono font-semibold mt-1">
                        Spend: ₹{Number(payload[0].value).toLocaleString('en-IN')}
                      </p>
                      <p className="text-emerald-600 font-mono text-[11px]">
                        Active Warranties: {payload[0].payload.warranties}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#spendGradientAnimated)"
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Category Highlights */}
      <div className="pt-4 border-t border-line-subtle mt-4 flex items-center justify-between text-xs text-fg-3 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-accent" />
            <span>Electronics (68%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Appliances (22%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            <span>Furniture (10%)</span>
          </span>
        </div>
        <p className="text-[11px] font-mono text-fg-muted">
          Updated in real-time from receipt OCR extracts
        </p>
      </div>
    </div>
  );
}
