import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import { useMotionTier } from '@/hooks/useMotionTier';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * Step 14.1 Lenis Smooth Scroll
 * Runs only on desktop fine pointer devices (mouse/trackpad with hover capability)
 * and when user motion tier is 'full' (respecting prefers-reduced-motion).
 * Disabled on touch/mobile to preserve native iOS/Android momentum scrolling.
 * Also disabled on virtualised heavy review tables.
 */
export function SmoothScroll({ children }) {
  const tier = useMotionTier();
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  const location = useLocation();

  const isSmoothDisabled = React.useMemo(() => {
    // Disable smooth scrolling on virtualized batch review table if present
    return location.pathname.includes('/batch-review');
  }, [location.pathname]);

  if (tier !== 'full' || !fine || isSmoothDisabled) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ lerp: 0.12, smoothWheel: true, syncTouch: false, anchors: true }}>
      {children}
    </ReactLenis>
  );
}

export default SmoothScroll;

