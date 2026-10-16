import * as React from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { ease } from '@/lib/motion';

/**
 * PageContentTransition
 * Smoothly crossfades between loading skeleton and live page content.
 * Prevents jarring sudden pops when async queries resolve.
 */
export function PageContentTransition({
  isLoading,
  skeleton,
  children,
  className = 'w-full',
}) {
  const hasLoadedRef = React.useRef(false);

  if (!isLoading) {
    hasLoadedRef.current = true;
  }

  // Only show skeleton on the very first initial load of the page.
  // Subsequent query refetches, filters, sorts, or pagination MUST NOT unmount the page.
  const showSkeleton = isLoading && !hasLoadedRef.current;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {showSkeleton ? (
        <m.div
          key="skeleton-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.1, ease: ease.out } }}
          transition={{ duration: 0.14, ease: ease.out }}
          className={className}
        >
          {skeleton}
        </m.div>
      ) : (
        <m.div
          key="content-view"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: ease.out }}
          className={className}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default PageContentTransition;
