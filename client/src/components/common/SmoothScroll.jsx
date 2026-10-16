import * as React from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { LenisContext } from 'lenis/react';
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
  const lenisRef = React.useRef(null);
  const [lenisState, setLenisState] = React.useState(null);

  const isSmoothDisabled = React.useMemo(() => {
    // Disable smooth scrolling on virtualized batch review table if present
    return location.pathname.includes('/batch-review');
  }, [location.pathname]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    if (tier !== 'full' || !fine || isSmoothDisabled) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        setLenisState(null);
      }
      return;
    }

    // Attach to primary scroll container (#main) or window
    const target = document.getElementById('main') || window;

    const instance = new Lenis({
      wrapper: target,
      content: target === window ? document.documentElement : (target.firstElementChild || target),
      lerp: 0.12,
      smoothWheel: true,
      syncTouch: false,
      anchors: true,
      autoRaf: true,
    });

    lenisRef.current = instance;
    setLenisState(instance);

    return () => {
      instance.destroy();
      lenisRef.current = null;
      setLenisState(null);
    };
  }, [tier, fine, isSmoothDisabled]);

  // Recalculate dimensions and update container on route change
  React.useEffect(() => {
    if (!lenisRef.current) return;
    const instance = lenisRef.current;

    const timer = setTimeout(() => {
      const target = document.getElementById('main') || window;
      if (instance.options.wrapper !== target) {
        instance.destroy();
        const newInstance = new Lenis({
          wrapper: target,
          content: target === window ? document.documentElement : (target.firstElementChild || target),
          lerp: 0.12,
          smoothWheel: true,
          syncTouch: false,
          anchors: true,
          autoRaf: true,
        });
        lenisRef.current = newInstance;
        setLenisState(newInstance);
      } else {
        instance.resize();
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const contextValue = React.useMemo(() => {
    if (!lenisState) return null;
    return {
      lenis: lenisState,
      addCallback: (cb) => lenisState.on('scroll', cb),
      removeCallback: (cb) => lenisState.off('scroll', cb),
    };
  }, [lenisState]);

  return (
    <LenisContext.Provider value={contextValue}>
      {children}
    </LenisContext.Provider>
  );
}

export default SmoothScroll;

