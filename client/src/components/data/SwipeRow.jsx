import * as React from 'react';
import * as m from 'motion/react-m';
import { useMotionValue, useTransform, animate } from 'motion/react';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Step 6.6: Mobile swipe actions for list rows
 * - Drag left reveals Share and Delete actions
 * - Rubber-band dragElastic={0.08}
 * - Snap threshold: -64px or velocity < -400px/s snaps open to -128px
 * - Respects spring.snappy
 */
export function SwipeRow({ children, onDelete, onShare, className }) {
  const x = useMotionValue(0);
  const actionsOpacity = useTransform(x, [-120, -40], [1, 0]);

  return (
    <div className={cn('relative overflow-hidden select-none', className)}>
      {/* Revealed action buttons */}
      <m.div
        style={{ opacity: actionsOpacity }}
        className="absolute inset-y-0 right-0 flex items-stretch z-0"
      >
        {onShare && (
          <button
            type="button"
            className="w-16 bg-accent text-on-accent font-medium text-xs flex items-center justify-center cursor-pointer transition-colors hover:brightness-110 active:brightness-95"
            onClick={onShare}
            aria-label="Share"
          >
            Share
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="w-16 bg-bad-solid text-white font-medium text-xs flex items-center justify-center cursor-pointer transition-colors hover:brightness-110 active:brightness-95"
            onClick={onDelete}
            aria-label="Delete"
          >
            Delete
          </button>
        )}
      </m.div>

      {/* Draggable surface container */}
      <m.div
        drag="x"
        dragConstraints={{ left: -128, right: 0 }}
        dragElastic={0.08}
        style={{ x }}
        onDragEnd={(_, i) =>
          animate(x, i.offset.x < -64 || i.velocity.x < -400 ? -128 : 0, spring.snappy)
        }
        className="relative z-10 bg-surface"
      >
        {children}
      </m.div>
    </div>
  );
}

export default SwipeRow;
