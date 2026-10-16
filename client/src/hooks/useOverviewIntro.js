import { useEffect } from 'react';
import { useMotionTier } from './useMotionTier';

/**
 * useOverviewIntro
 * Step 5.1 from animation_instruction.md:
 * GSAP Intro timeline for the Overview dashboard.
 * - Lazy loads gsap dynamically to keep initial bundle tiny
 * - Plays once per session (sessionStorage.billbox_intro_played)
 * - Defaults ease: power3.out
 * - Header -> KPIs -> Panels -> Rows choreography (<900ms total)
 * - Safe fallback: uses gsap.from(), so elements are visible by default in CSS if JS fails
 * - Honors prefers-reduced-motion: reduce and motion tier
 */
export function useOverviewIntro(scopeRef, ready) {
  const tier = useMotionTier();

  useEffect(() => {
    if (!ready || tier !== 'full' || typeof window === 'undefined') return;
    if (sessionStorage.getItem('billbox_intro_played')) return;

    let isCancelled = false;

    import('gsap').then(({ gsap }) => {
      if (isCancelled || !scopeRef?.current) return;
      sessionStorage.setItem('billbox_intro_played', '1');

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const container = scopeRef.current;
        if (!container) return;

        const headers = container.querySelectorAll('[data-intro="header"]');
        const kpis = container.querySelectorAll('[data-intro="kpi"]');
        const panels = container.querySelectorAll('[data-intro="panel"]');
        const rows = container.querySelectorAll('[data-intro="row"]');

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (headers.length) {
          tl.from(headers, { y: 8, opacity: 0, duration: 0.35 });
        }
        if (kpis.length) {
          tl.from(kpis, { y: 14, opacity: 0, duration: 0.45, stagger: 0.06 }, '-=0.15');
        }
        if (panels.length) {
          tl.from(panels, { y: 16, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.25');
        }
        if (rows.length) {
          tl.from(rows, { x: -8, opacity: 0, duration: 0.3, stagger: 0.03 }, '-=0.3');
        }
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [scopeRef, ready, tier]);
}

export default useOverviewIntro;
