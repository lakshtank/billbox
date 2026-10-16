import * as React from 'react';
import * as m from 'motion/react-m';
import { useMotionValue, useTransform, animate } from 'motion/react';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Step 6.6: Mobile swipe actions for list rows
 * - Drag left reveals Share and Delete actions
 * - Rubber-band dragElastic={0.08}
 * - Snap threshold: -64px or velocity < -400px/s snaps open to -128px (or -32px / -64px if single action)
 * - Light haptic on open: navigator.vibrate?.(8)
 * - Respects spring.snappy
 */
export function SwipeRow({ children, onDelete, onShare, className }) {
  const x = useMotionValue(0);
  const snapTarget = onShare && onDelete ? -128 : onShare || onDelete ? -64 : 0;
  const threshold = snapTarget / 2;
  const actionsOpacity = useTransform(x, [snapTarget + 8, -20], [1, 0]);

  const handleShare = (e) => {
    e.stopPropagation();
    animate(x, 0, spring.snappy);
    onShare?.(e);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    animate(x, 0, spring.snappy);
    onDelete?.(e);
  };

  return (
    <div className={cn('relative overflow-hidden select-none', className)}>
      {/* Revealed action buttons */}
      {snapTarget < 0 && (
        <m.div
          style={{ opacity: actionsOpacity }}
          className="absolute inset-y-0 right-0 flex items-stretch z-0"
        >
          {onShare && (
            <button
              type="button"
              className="w-16 bg-accent text-on-accent font-medium text-xs flex items-center justify-center cursor-pointer transition-colors hover:brightness-110 active:brightness-95"
              onClick={handleShare}
              aria-label="Share"
            >
              Share
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="w-16 bg-bad-solid text-white font-medium text-xs flex items-center justify-center cursor-pointer transition-colors hover:brightness-110 active:brightness-95"
              onClick={handleDelete}
              aria-label="Delete"
            >
              Delete
            </button>
          )}
        </m.div>
      )}

      {/* Draggable surface container */}
      <m.div
        drag={snapTarget < 0 ? 'x' : false}
        dragConstraints={{ left: snapTarget, right: 0 }}
        dragElastic={0.08}
        style={{ x }}
        onDragEnd={(_, i) => {
          if (snapTarget >= 0) return;
          const shouldOpen = i.offset.x < threshold || i.velocity.x < -400;
          if (shouldOpen) {
            navigator.vibrate?.(8);
          }
          animate(x, shouldOpen ? snapTarget : 0, spring.snappy);
        }}
        className="relative z-10 bg-surface"
      >
        {children}
      </m.div>
    </div>
  );
}

export default SwipeRow;

