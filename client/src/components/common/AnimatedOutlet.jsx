import { useRef, useEffect, useState, Suspense } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useLocation, useOutlet } from 'react-router-dom';
import { useMotionTier } from '../../hooks/useMotionTier';
import { ease, dur } from '../../lib/motion';
import RouteSkeleton from './RouteSkeleton';
import ErrorBoundary from './ErrorBoundary';

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const tier = useMotionTier();
  const isReduced = tier === 'none';

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const updateMobile = (e) => setIsMobile(e.matches);
    setIsMobile(media.matches);
    media.addEventListener('change', updateMobile);
    return () => media.removeEventListener('change', updateMobile);
  }, []);

  // Calculate route depth by path segments
  const segments = location.pathname.split('/').filter(Boolean);
  const currentDepth = segments.length;
  const section = segments[0] || 'overview'; // only animate when section changes on desktop

  const prevDepthRef = useRef(currentDepth);

  // Direction: +1 for deeper route depth, -1 for shallower (Step 3.3)
  const direction = currentDepth > prevDepthRef.current
    ? 1
    : currentDepth < prevDepthRef.current
    ? -1
    : 0;

  useEffect(() => {
    prevDepthRef.current = currentDepth;
  }, [currentDepth]);

  // Key selection: on mobile when drill-down depth changes, key by pathname so push/pop slides trigger;
  // on desktop (or same depth), key by section so :id or query params do not re-animate lateral transitions.
  const routeKey = isMobile && direction !== 0 ? location.pathname : section;

  const variants = {
    initial: (custom) => {
      if (custom.isReduced) return { opacity: 0 };
      if (custom.isMobile && custom.direction !== 0) {
        // Step 3.3: push transition new page x: 24 -> 0, back transition new page x: -12 -> 0
        return { opacity: 0, x: custom.direction === 1 ? 24 : -12 };
      }
      // Step 3.1: quick crossfade + 6px rise
      return { opacity: 0, y: 6 };
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: dur.base, // 0.18s
        ease: ease.out,     // [0.2, 0, 0, 1]
      },
    },
    exit: (custom) => {
      if (custom.isReduced) {
        return { opacity: 0, transition: { duration: 0.04 } };
      }
      if (custom.isMobile && custom.direction !== 0) {
        // Step 3.3: old page x: 0 -> -12 (push) or x: 0 -> 24 (back) + opacity 0
        return {
          opacity: 0,
          x: custom.direction === 1 ? -12 : 24,
          transition: { duration: 0.08 }, // 80ms exit
        };
      }
      // Step 3.1: exit duration 80ms so navigation never feels slow
      return {
        opacity: 0,
        transition: { duration: 0.08 },
      };
    },
  };

  const custom = {
    direction,
    isMobile,
    isReduced,
  };

  return (
    <AnimatePresence mode="wait" initial={false} custom={custom}>
      <m.div
        key={routeKey}
        custom={custom}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full"
      >
        <ErrorBoundary key={routeKey}>
          <Suspense fallback={<RouteSkeleton />}>
            {outlet}
          </Suspense>
        </ErrorBoundary>
      </m.div>
    </AnimatePresence>
  );
}

export default AnimatedOutlet;
