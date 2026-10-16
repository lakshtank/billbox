import * as React from 'react';
import * as m from 'motion/react-m';
import { useMotionTier } from '@/hooks/useMotionTier';
import { cn } from '../../lib/utils';

/**
 * Step 11 & Step 13.6: 4-segment password strength bar + text label
 * - Levels:
 *   1: Weak (1 red bar bg-bad-solid)
 *   2: Fair (2 amber bars bg-warn-solid)
 *   3: Good (3 cosmic teal bars bg-accent)
 *   4: Strong (4 green bars bg-ok-solid)
 * - Copy rules: sentence case, no exclamation marks.
 * - Staggered scaleX fill with 60ms stagger per active segment.
 */
export function calculatePasswordStrength(password = '') {
  if (!password) return 0;
  if (password.length < 8) return 1;

  let score = 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  return Math.min(4, Math.max(1, score));
}

const STRENGTH_CONFIG = {
  0: { label: '', color: 'bg-subtle', textColor: 'text-fg-3' },
  1: { label: 'Weak', color: 'bg-bad-solid', textColor: 'text-bad-fg' },
  2: { label: 'Fair', color: 'bg-warn-solid', textColor: 'text-warn-fg' },
  3: { label: 'Good', color: 'bg-accent', textColor: 'text-accent' },
  4: { label: 'Strong', color: 'bg-ok-solid', textColor: 'text-ok-fg' },
};

export function PasswordStrengthMeter({ password = '', className }) {
  const tier = useMotionTier();
  const strength = calculatePasswordStrength(password);
  const current = STRENGTH_CONFIG[strength];

  if (!password) {
    return null;
  }

  const shouldAnimate = tier !== 'none';

  return (
    <div className={cn('space-y-1.5 mt-2 font-sans', className)} aria-live="polite">
      {/* 4 segments */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((seg) => {
          const isActive = seg <= strength;
          return (
            <div
              key={seg}
              className="h-full rounded-full bg-subtle overflow-hidden relative"
            >
              <m.div
                initial={false}
                animate={{ scaleX: isActive ? 1 : 0 }}
                transition={
                  shouldAnimate
                    ? {
                        duration: 0.22,
                        delay: isActive ? (seg - 1) * 0.06 : 0,
                        ease: [0.16, 1, 0.3, 1],
                      }
                    : { duration: 0 }
                }
                className={cn(
                  'h-full w-full rounded-full origin-left transition-colors duration-fast',
                  current.color
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Text label */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-fg-3">Strength</span>
        <span className={cn('font-medium', current.textColor)}>
          {current.label}
        </span>
      </div>
    </div>
  );
}

export default PasswordStrengthMeter;

