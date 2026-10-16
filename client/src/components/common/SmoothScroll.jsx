import * as React from 'react';
import { useMatches } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import { useMotionTier } from '@/hooks/useMotionTier';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * Step 14.1 Lenis Smooth Scroll
 * Runs only on desktop fine pointer devices (mouse/trackpad with hover capability)
 * and when user motion tier is 'full' (respecting prefers-reduced-motion).
 * Disabled on touch/mobile to preserve native iOS/Android momentum scrolling.
 * Also disabled if the active route explicitly sets handle: { smooth: false }.
 */
export function SmoothScroll({ children }) {
  const tier = useMotionTier();
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  const matches = useMatches();

  const isSmoothDisabled = React.useMemo(() => {
    return matches.some((m) => m.handle?.smooth === false);
  }, [matches]);

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

