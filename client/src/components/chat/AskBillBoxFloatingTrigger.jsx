import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { Sparkles } from 'lucide-react';
import useUiStore from '../../store/uiStore';
import useAuth from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

/**
 * Sticky Bottom-Right Floating AI Trigger
 * - Default: Circular round button with glowing ambient pulse and sparkle icon
 * - Hover: Expands smoothly into a rounded rectangle containing "Ask BillBox" and shortcut badge
 * - Hidden gracefully when the Ask BillBox drawer is active
 */
export function AskBillBoxFloatingTrigger() {
  const { user } = useAuth();
  const { isAskBillBoxOpen, toggleAskBillBox } = useUiStore();
  const [isHovered, setIsHovered] = useState(false);

  // Only render for authenticated users
  if (!user) return null;

  return (
    <AnimatePresence>
      {!isAskBillBoxOpen && (
        <m.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 select-none"
        >
          {/* Ambient Glow Aura */}
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-accent/30 via-teal-400/25 to-accent/30 blur-md opacity-60 group-hover:opacity-100 animate-pulse pointer-events-none transition-opacity duration-300" />

          {/* Trigger Button */}
          <button
            type="button"
            onClick={toggleAskBillBox}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="Ask BillBox AI"
            title="Ask BillBox AI (Cmd+J / Ctrl+J)"
            className={cn(
              'group relative flex items-center justify-center cursor-pointer',
              'h-13 sm:h-14 bg-surface/95 dark:bg-card/95 backdrop-blur-xl',
              'border border-accent/40 hover:border-accent',
              'shadow-xl shadow-accent/20 hover:shadow-2xl hover:shadow-accent/35',
              'text-fg transition-all duration-300 ease-out',
              // Round circle by default; rounded rectangle on hover
              isHovered
                ? 'rounded-2xl px-4.5 sm:px-5 w-auto'
                : 'rounded-full w-13 sm:w-14 px-0'
            )}
          >
            {/* Inner subtle gradient sheen */}
            <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-accent/[0.08] via-transparent to-accent/[0.04] pointer-events-none" />

            {/* Sparkles Icon with rotating hover effect */}
            <div className="relative flex items-center justify-center shrink-0">
              <Sparkles className="size-5 sm:size-6 text-accent group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 ease-out" />
              
              {/* Subtle pulsing live indicator dot */}
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-500 ring-2 ring-surface animate-ping" />
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-500 ring-2 ring-surface" />
            </div>

            {/* Expanding Text & Badge (Round Rectangular Hover Effect) */}
            <div
              className={cn(
                'flex items-center overflow-hidden transition-all duration-300 ease-out whitespace-nowrap',
                isHovered
                  ? 'max-w-48 opacity-100 ml-2.5'
                  : 'max-w-0 opacity-0 ml-0'
              )}
            >
              <span className="font-semibold text-sm text-fg tracking-tight">
                Ask BillBox
              </span>

              {/* Keyboard Shortcut Badge */}
              <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/20 ml-2">
                ⌘J
              </kbd>
            </div>
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default AskBillBoxFloatingTrigger;
