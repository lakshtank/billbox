import React, { createContext, useContext, useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';

const ViewTransitionContext = createContext({
  transitioningTo: null,
  startTransition: (to, navigateFn) => {
    navigateFn();
  },
});

export function ViewTransitionProvider({ children }) {
  const [transitioningTo, setTransitioningTo] = useState(null);

  const startTransition = useCallback((to, navigateFn) => {
    // If browser supports native Document View Transitions API and not reduced-motion
    const supportsViewTransitions =
      typeof document !== 'undefined' &&
      typeof document.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (supportsViewTransitions) {
      setTransitioningTo(to);
      try {
        const vt = document.startViewTransition(() => {
          // Synchronously flush DOM update so browser takes snapshot of the newly rendered page
          flushSync(() => {
            navigateFn();
          });
        });

        const reset = () => setTransitioningTo(null);
        if (vt && typeof vt.finished?.then === 'function') {
          vt.finished.then(reset, reset);
        } else {
          reset();
        }
      } catch (err) {
        console.warn('View transition fallback:', err);
        setTransitioningTo(null);
        navigateFn();
      }
    } else {
      navigateFn();
    }
  }, []);

  return (
    <ViewTransitionContext.Provider value={{ transitioningTo, startTransition }}>
      {children}
    </ViewTransitionContext.Provider>
  );
}

/**
 * Hook to check if a specific route target is currently part of an active view transition.
 * Only the clicked row has a name at transition time, eliminating duplicate-name errors.
 */
export function useViewTransitionState(to) {
  const context = useContext(ViewTransitionContext);
  if (!context || !context.transitioningTo || !to) return false;
  return context.transitioningTo === to || context.transitioningTo.startsWith(to);
}

/**
 * Enhanced navigation hook that initiates a View Transition before updating the route
 * for drill-down routes (e.g. /receipts/:id), while letting lateral tabs animate via AnimatedOutlet.
 */
export function useViewTransitionNavigate() {
  const navigate = useNavigate();
  const context = useContext(ViewTransitionContext);

  return useCallback(
    (to, options = {}) => {
      const targetPath = typeof to === 'string' ? to : to?.pathname || '';
      // Drill-down shared element transition target check
      const isDrillDown =
        /^\/receipts\/[^/]+$/.test(targetPath) ||
        (targetPath === '/receipts' && window.location.pathname.startsWith('/receipts/'));

      const shouldViewTransition =
        options.viewTransition !== undefined ? options.viewTransition : isDrillDown;

      const { viewTransition: _, ...navOptions } = options;

      if (shouldViewTransition && context?.startTransition) {
        context.startTransition(targetPath, () => {
          navigate(to, navOptions);
        });
      } else {
        navigate(to, navOptions);
      }
    },
    [navigate, context]
  );
}
