import React from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { Sparkles } from 'lucide-react';
import useUiStore from '../../store/uiStore';
import useAuth from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

/**
 * Sticky Bottom-Right Round AI Trigger Button
 * Pure circular floating action button with ambient glow and sparkle icon.
 */
export function AskBillBoxFloatingTrigger() {
  const { user } = useAuth();
  const { isAskBillBoxOpen, toggleAskBillBox } = useUiStore();

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
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-accent/30 via-teal-400/25 to-accent/30 blur-md opacity-60 group-hover:opacity-100 animate-pulse pointer-events-none transition-opacity duration-300" />

          {/* Pure Round Trigger Button */}
          <button
            type="button"
            onClick={toggleAskBillBox}
            aria-label="Ask BillBox AI"
            title="Ask BillBox AI (Cmd+J / Ctrl+J)"
            className={cn(
              'group relative flex items-center justify-center cursor-pointer rounded-full',
              'size-13 sm:size-14 bg-surface/95 dark:bg-card/95 backdrop-blur-xl',
              'border border-accent/40 hover:border-accent',
              'shadow-xl shadow-accent/20 hover:shadow-2xl hover:shadow-accent/35',
              'text-fg hover:scale-105 active:scale-95 transition-all duration-200'
            )}
          >
            {/* Inner subtle gradient sheen */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent/[0.08] via-transparent to-accent/[0.04] pointer-events-none" />

            {/* Sparkles Icon */}
            <div className="relative flex items-center justify-center">
              <Sparkles className="size-5 sm:size-6 text-accent group-hover:rotate-12 transition-transform duration-300" />
              
              {/* Subtle pulsing live indicator dot */}
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-500 ring-2 ring-surface animate-ping" />
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-500 ring-2 ring-surface" />
            </div>
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default AskBillBoxFloatingTrigger;
