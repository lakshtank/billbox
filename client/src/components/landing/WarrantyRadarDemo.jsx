import React, { useState } from 'react';
import * as m from 'motion/react-m';
import { ShieldCheck, Clock, AlertTriangle, Bell, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DEMO_DEVICES = [
  { name: 'Apple iPhone 16 Pro', store: 'Apple Store', totalMonths: 12, cost: '₹1,29,900' },
  { name: 'Sony WH-1000XM5', store: 'Croma', totalMonths: 12, cost: '₹29,990' },
  { name: 'Philips Induction Cooktop', store: 'Reliance Digital', totalMonths: 12, cost: '₹3,299' },
  { name: 'IKEA MARKUS Chair', store: 'IKEA Mumbai', totalMonths: 120, cost: '₹14,990' },
];

export default function WarrantyRadarDemo({ className = '' }) {
  // Simulated day offset from purchase (0 to 395 days)
  const [daysElapsed, setDaysElapsed] = useState(340);

  const totalPeriodDays = 365;
  const daysRemaining = Math.max(0, totalPeriodDays - daysElapsed);

  let bucket = 'active';
  let badgeColor = 'ok';
  let statusText = 'Safe & Fully Covered (>90 Days)';
  let alertMessage = 'Zero urgency. BillBox checks serial coverage in the background.';

  if (daysRemaining === 0) {
    bucket = 'expired';
    badgeColor = 'bad';
    statusText = 'Warranty Expired';
    alertMessage = 'Coverage has ended. Receipt remains safely archived for resale or tax proof.';
  } else if (daysRemaining <= 30) {
    bucket = 'due_soon';
    badgeColor = 'warn';
    statusText = `Due Soon: Only ${daysRemaining} Days Left!`;
    alertMessage = 'Automated BillBox alert dispatched! Claim repairs or free battery swap before expiry.';
  } else if (daysRemaining <= 90) {
    bucket = 'next_90';
    badgeColor = 'neutral';
    statusText = `Upcoming Expiry: ${daysRemaining} Days Left`;
    alertMessage = 'Approaching final quarter. BillBox places this on your 90-day dashboard priority list.';
  }

  return (
    <div className={`rounded-2xl bg-surface/90 border border-line shadow-xl p-5 sm:p-7 backdrop-blur-xl ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-accent" />
            <h3 className="text-base sm:text-lg font-bold text-fg">
              Interactive 30d & 90d Warranty Radar
            </h3>
          </div>
          <p className="text-xs text-fg-3 mt-1">
            Drag the time slider to experience how BillBox auto-detects and alerts you at key milestones.
          </p>
        </div>

        <Badge variant={badgeColor} className="text-xs font-mono shrink-0 py-1 px-3">
          {statusText}
        </Badge>
      </div>

      {/* Interactive Slider */}
      <div className="py-6 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-fg">
          <span>Day 0 (Purchased)</span>
          <span className="font-mono text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
            Day {daysElapsed} / 365
          </span>
          <span>Day 365 (End)</span>
        </div>

        <input
          type="range"
          min="0"
          max="380"
          value={daysElapsed}
          onChange={(e) => setDaysElapsed(Number(e.target.value))}
          className="w-full h-2.5 bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
          aria-label="Warranty timeline simulator slider"
        />

        {/* Milestone Tick Marks */}
        <div className="grid grid-cols-4 text-[10px] sm:text-xs text-fg-3 font-medium text-center pt-1">
          <div className="text-left">
            <span className="block font-semibold text-fg">Active</span>
            <span>Day 0–275</span>
          </div>
          <div>
            <span className="block font-semibold text-neutral-400">90d Window</span>
            <span>Day 276–335</span>
          </div>
          <div>
            <span className="block font-semibold text-amber-400">≤30d Alert!</span>
            <span>Day 336–364</span>
          </div>
          <div className="text-right">
            <span className="block font-semibold text-rose-400">Expired</span>
            <span>Day 365+</span>
          </div>
        </div>
      </div>

      {/* Live Alert Notification Banner Preview */}
      <div className={`p-4 rounded-xl border transition-all ${
        bucket === 'due_soon'
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          : bucket === 'next_90'
          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
          : bucket === 'expired'
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
      }`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-surface/80 border border-line shrink-0 text-fg">
            <Bell className="size-4 text-accent" />
          </div>
          <div className="text-xs">
            <p className="font-semibold text-fg flex items-center gap-1.5">
              <span>BillBox Smart Notification Engine</span>
              <span className="text-[10px] font-mono text-fg-3">• Real-Time</span>
            </p>
            <p className="text-fg-2 mt-0.5 leading-relaxed">{alertMessage}</p>
          </div>
        </div>
      </div>

      {/* Simulated Device Cards Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DEMO_DEVICES.map((dev, idx) => {
          const devDaysRemaining = idx === 2 ? Math.min(20, daysRemaining) : daysRemaining;
          const isUrgent = devDaysRemaining > 0 && devDaysRemaining <= 30;
          return (
            <div
              key={dev.name}
              className="p-3.5 rounded-xl bg-subtle/50 border border-line-subtle flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-fg truncate">{dev.name}</p>
                <p className="text-[11px] text-fg-3">{dev.store} • {dev.cost}</p>
              </div>

              <div className="text-right shrink-0">
                <Badge
                  variant={isUrgent ? 'warn' : devDaysRemaining === 0 ? 'bad' : 'ok'}
                  className="font-mono text-[10px]"
                >
                  {devDaysRemaining === 0 ? 'Expired' : `${devDaysRemaining}d left`}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
