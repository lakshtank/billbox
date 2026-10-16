import * as React from 'react';
import { useMemo, useEffect, useState } from 'react';
import * as m from 'motion/react-m';
import NumberFlow from '@number-flow/react';
import { useMotionTier } from '@/hooks/useMotionTier';

/**
 * ProductWarrantyTimeline
 * Step 9 from animation_instruction.md:
 * - Line draws left -> right (pathLength, 700ms, ease.emph)
 * - "Today" marker drops in with spring.snappy
 * - Label fades in
 * - Days left rolling digits with NumberFlow
 * - Runs once per visit (session guard)
 * - Static rails, no pulsing
 */
export function ProductWarrantyTimeline({
  productId,
  timelineMetrics,
  className = '',
}) {
  const tier = useMotionTier();
  const shouldAnimate = tier !== 'none';

  const {
    daysLeft,
    daysText,
    statusKey,
    elapsedPercent = 0,
    textColor = 'text-ok-fg',
    purchaseFormatted,
    expiryFormatted,
  } = timelineMetrics;

  const markerColor = useMemo(() => {
    if (statusKey === 'expired') return 'border-bad text-bad-fg';
    if (statusKey === 'expiring') return 'border-warn text-warn-fg';
    return 'border-accent text-accent';
  }, [statusKey]);

  const dotBg = useMemo(() => {
    if (statusKey === 'expired') return 'bg-bad';
    if (statusKey === 'expiring') return 'bg-warn';
    return 'bg-accent';
  }, [statusKey]);

  const clampedElapsed = Math.min(100, Math.max(0, elapsedPercent));
  const targetDays = daysLeft != null ? Math.abs(daysLeft) : 0;
  const initialRoll = targetDays > 0 ? Math.ceil(targetDays * 1.3) + 4 : 0;

  // Animate numbers from initial roll / 0 to target on every mount or product change
  const [animatedDays, setAnimatedDays] = useState(shouldAnimate ? initialRoll : targetDays);
  const [animatedElapsed, setAnimatedElapsed] = useState(shouldAnimate ? 0 : clampedElapsed);

  useEffect(() => {
    if (shouldAnimate) {
      setAnimatedDays(initialRoll);
      setAnimatedElapsed(0);
      const timer = setTimeout(() => {
        setAnimatedDays(targetDays);
        setAnimatedElapsed(clampedElapsed);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setAnimatedDays(targetDays);
      setAnimatedElapsed(clampedElapsed);
    }
  }, [shouldAnimate, targetDays, clampedElapsed, initialRoll, productId]);

  return (
    <div className={`p-5 rounded-[12px] bg-surface border border-line space-y-4 shadow-2xs font-sans select-none ${className}`}>
      {/* Header: Days Left and Elapsed Percentage */}
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider block">
            Warranty status
          </span>
          <div className={`text-3xl font-bold tracking-tight mt-0.5 flex items-baseline gap-2 ${textColor}`}>
            {tier === 'none' || daysLeft == null ? (
              daysText
            ) : daysLeft < 0 ? (
              <span className="inline-flex items-baseline gap-2">
                <span className="text-xl font-semibold font-sans">Expired</span>
                <span className="font-mono tnum">
                  <NumberFlow
                    value={animatedDays}
                    transformTiming={{ duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
                    spinTiming={{ duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
                  />
                </span>
                <span className="text-xl font-semibold font-sans">days ago</span>
              </span>
            ) : daysLeft === 0 ? (
              <span>Expires today</span>
            ) : (
              <span className="inline-flex items-baseline gap-2">
                <span className="font-mono tnum">
                  <NumberFlow
                    value={animatedDays}
                    transformTiming={{ duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
                    spinTiming={{ duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
                  />
                </span>
                <span className="text-xl font-semibold font-sans">
                  {daysLeft === 1 ? 'day left' : 'days left'}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider block">
            Coverage elapsed
          </span>
          <span className="font-mono text-sm font-semibold text-fg tnum">
            {tier !== 'none' ? (
              <NumberFlow
                value={animatedElapsed}
                suffix="%"
                transformTiming={{ duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
                spinTiming={{ duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
              />
            ) : (
              `${clampedElapsed}%`
            )}
          </span>
        </div>
      </div>

      {/* Interactive Timeline Bar */}
      <div className="space-y-2 pt-3">
        <div className="relative w-full h-8 flex items-center">
          {/* Base track line + Solid Active drawing bar */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-subtle overflow-hidden">
            <m.div
              key={`bar-${productId}-${clampedElapsed}`}
              className={`h-full rounded-full ${dotBg}`}
              style={{
                transformOrigin: 'left',
                width: `${clampedElapsed}%`,
                willChange: 'transform',
              }}
              initial={shouldAnimate ? { scaleX: 0 } : { scaleX: 1 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {/* Start Point (Purchased) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 size-3 rounded-full bg-surface border-2 border-accent z-10" />

          {/* Today Marker (drops in from top with spring) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20"
            style={{ left: `${clampedElapsed}%` }}
          >
            <m.div
              key={`today-${productId}-${clampedElapsed}`}
              className="flex flex-col items-center"
              initial={shouldAnimate ? { y: -24, opacity: 0 } : { y: 0, opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: shouldAnimate ? 0.25 : 0,
                type: 'spring',
                stiffness: 420,
                damping: 28,
              }}
            >
              <div
                className={`size-4 rounded-full bg-surface border-2 ${markerColor} shadow-xs flex items-center justify-center ring-2 ring-surface`}
              >
                <div className={`size-1.5 rounded-full ${dotBg}`} />
              </div>
              <m.span
                initial={shouldAnimate ? { opacity: 0, y: -4 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: shouldAnimate ? 0.35 : 0, duration: 0.2 }}
                className="absolute -top-5 text-[10px] font-semibold text-fg bg-surface/90 border border-line-subtle px-1.5 py-0.2 rounded-full shadow-2xs whitespace-nowrap"
              >
                Today
              </m.span>
            </m.div>
          </div>

          {/* End Point (Expires) */}
          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-3 rounded-full bg-surface border-2 z-10 ${
              clampedElapsed >= 100 ? markerColor : 'border-line-strong'
            }`}
          />
        </div>

        {/* Milestone Labels with 140ms fade-in */}
        <m.div
          key={`labels-${productId}`}
          initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: shouldAnimate ? 0.25 : 0 }}
          className="flex items-center justify-between text-[11px] font-mono text-fg-3 pt-1"
        >
          <span>Purchased: {purchaseFormatted}</span>
          <span>Expires: {expiryFormatted}</span>
        </m.div>
      </div>
    </div>
  );
}

export default ProductWarrantyTimeline;
