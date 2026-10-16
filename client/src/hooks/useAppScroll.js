import { useEffect } from 'react';
import { useMotionValue, useTransform } from 'motion/react';
import { useScrollContainer } from '../context/ScrollContainerContext';

/**
 * useAppScroll
 * Reliable scroll-tracking hook that binds to the primary scroll container (<main id="main">)
 * or window, without microtask race conditions or unhydrated ref errors.
 * Returns { scrollY, scrollYProgress, borderOpacity }.
 */
export function useAppScroll() {
  const containerRef = useScrollContainer();
  const scrollY = useMotionValue(0);
  const scrollYProgress = useMotionValue(0);

  useEffect(() => {
    let mainEl =
      (containerRef && 'current' in containerRef ? containerRef.current : null) ||
      (typeof document !== 'undefined' ? document.getElementById('main') : null);

    const updateScroll = () => {
      const target = mainEl || (typeof window !== 'undefined' ? window : null);
      if (!target) return;

      const isWin = target === window;
      const currentY = isWin ? window.scrollY : target.scrollTop;
      const scrollHeight = isWin
        ? document.documentElement.scrollHeight
        : target.scrollHeight;
      const clientHeight = isWin ? window.innerHeight : target.clientHeight;
      const maxScroll = Math.max(1, scrollHeight - clientHeight);

      scrollY.set(currentY);
      scrollYProgress.set(Math.min(1, Math.max(0, currentY / maxScroll)));
    };

    updateScroll();

    const handleMainScroll = () => updateScroll();
    const handleWinScroll = () => updateScroll();

    if (mainEl) {
      mainEl.addEventListener('scroll', handleMainScroll, { passive: true });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleWinScroll, { passive: true });
    }

    // Hydration check in case containerRef / #main was mounted asynchronously
    const retryTimer = setTimeout(() => {
      if (!mainEl && typeof document !== 'undefined') {
        mainEl = document.getElementById('main');
        if (mainEl) {
          mainEl.addEventListener('scroll', handleMainScroll, { passive: true });
          updateScroll();
        }
      }
    }, 100);

    return () => {
      clearTimeout(retryTimer);
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleMainScroll);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleWinScroll);
      }
    };
  }, [containerRef, scrollY, scrollYProgress]);

  // Step 4.2: at scroll 0 opacity is 0; by 16px opacity is 1
  const borderOpacity = useTransform(scrollY, [0, 16], [0, 1]);

  return { scrollY, scrollYProgress, borderOpacity };
}

export default useAppScroll;
