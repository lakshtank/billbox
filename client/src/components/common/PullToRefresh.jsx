import * as React from 'react';
import * as m from 'motion/react-m';
import { useMotionValue, useTransform, animate } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Step 6.7: Pull to refresh (mobile, list pages)
 * - Use a drag="y" container only when scrollTop === 0
 * - Show a 24px spinner that scales/rotates with drag distance (useTransform)
 * - Trigger refetch past 72px
 * - Light haptic vibration on trigger
 * - Release with spring.soft
 */
export function PullToRefresh({
  children,
  onRefresh,
  className,
  disabled = false,
}) {
  const containerRef = React.useRef(null);
  const y = useMotionValue(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [canDrag, setCanDrag] = React.useState(true);

  // Spinner transforms based on pull distance (0 to 72px)
  const spinnerScale = useTransform(y, [0, 72], [0.4, 1]);
  const spinnerRotate = useTransform(y, [0, 72], [0, 360]);
  const spinnerOpacity = useTransform(y, [10, 48], [0, 1]);

  // Monitor scroll position of the window or parent scroll container
  React.useEffect(() => {
    const checkScrollTop = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop || 0;
      setCanDrag(scrollPos <= 2);
    };

    window.addEventListener('scroll', checkScrollTop, { passive: true });
    checkScrollTop();
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, []);

  const handleDragEnd = async (_, info) => {
    if (disabled || isRefreshing) return;

    const pullDistance = info.offset?.y ?? y.get();
    if (pullDistance >= 72 && onRefresh) {
      setIsRefreshing(true);
      navigator.vibrate?.(12);
      // Snap to spinner hold height (48px)
      animate(y, 48, spring.soft);

      try {
        await Promise.resolve(onRefresh());
      } catch (err) {
        console.error('Pull-to-refresh error:', err);
      } finally {
        setIsRefreshing(false);
        animate(y, 0, spring.soft);
      }
    } else {
      animate(y, 0, spring.soft);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* 24px pull indicator / spinner */}
      <m.div
        style={{
          opacity: isRefreshing ? 1 : spinnerOpacity,
          y: useTransform(y, (latest) => Math.min(latest * 0.6, 44)),
        }}
        className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex h-10 items-center justify-center -translate-y-full"
        aria-hidden="true"
      >
        <m.div
          style={{
            scale: isRefreshing ? 1 : spinnerScale,
            rotate: isRefreshing ? undefined : spinnerRotate,
          }}
          className={cn(
            'flex size-8 items-center justify-center rounded-full bg-surface border border-line shadow-sm text-accent',
            isRefreshing && 'animate-spin'
          )}
        >
          <Loader2 className="size-5" />
        </m.div>
      </m.div>

      {/* Draggable surface container */}
      <m.div
        drag={!disabled && canDrag && !isRefreshing ? 'y' : false}
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.35, bottom: 0 }}
        style={{ y }}
        onDragEnd={handleDragEnd}
        className="w-full"
      >
        {children}
      </m.div>
    </div>
  );
}

export default PullToRefresh;
