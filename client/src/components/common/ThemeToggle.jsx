import React, { useRef } from 'react';
import { flushSync } from 'react-dom';
import { Sun, Moon } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';

/**
 * Step 13.8 Mind-Blowing Theme Toggle — Circular Ripple Cover View Transition
 * Expands outward from the clicked button or origin coordinates like an elegant circular wave cover.
 * Silky smooth, 60/120fps GPU-composited, perfectly synchronized with zero lag.
 */
export async function setThemeAnimated(next, originEl, applyThemeFn) {
  const root = document.documentElement;
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fallback = () => {
    root.classList.add('theme-transition');
    if (applyThemeFn) {
      applyThemeFn(next);
    } else {
      root.dataset.theme = next;
      if (next === 'dark' || next === 'gentle') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      try {
        localStorage.setItem('billbox.theme', next);
      } catch {}
    }
    window.clearTimeout(window.__themeTransitionTimer);
    window.__themeTransitionTimer = window.setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 180);
  };

  if (!document.startViewTransition || reduced) {
    fallback();
    return;
  }

  // Prevent multiple overlapping transitions
  if (window.__isThemeTransitioning) return;
  window.__isThemeTransitioning = true;

  // Ensure no conflicting element transitions run during view transition snapshot
  root.classList.remove('theme-transition');

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (originEl) {
    if (typeof originEl.clientX === 'number' && typeof originEl.clientY === 'number') {
      x = originEl.clientX;
      y = originEl.clientY;
    } else if (originEl.getBoundingClientRect) {
      const rect = originEl.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  try {
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        if (applyThemeFn) {
          applyThemeFn(next);
        } else {
          root.dataset.theme = next;
          if (next === 'dark' || next === 'gentle') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
          try {
            localStorage.setItem('billbox.theme', next);
          } catch {}
        }
      });
    });

    await transition.ready;

    const anim = document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 360,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
        pseudoElement: '::view-transition-new(root)',
      }
    );

    await anim.finished;
  } catch {
    fallback();
  } finally {
    window.__isThemeTransitioning = false;
  }
}

/**
 * Step 7.4 Theme Toggle
 * Cycles through: light -> gentle -> dark -> light (system theme removed permanently)
 * Accessible, keyboard navigable, with proper tooltip / aria label.
 */
export const ThemeToggle = ({ className = '', variant = 'outline' }) => {
  const { theme, setTheme } = usePreferences();
  const buttonRef = useRef(null);

  const cycleTheme = (e) => {
    let nextTheme;
    if (theme === 'light') {
      nextTheme = 'gentle';
    } else if (theme === 'gentle') {
      nextTheme = 'dark';
    } else {
      nextTheme = 'light';
    }

    const triggerEl = buttonRef.current || e?.currentTarget;
    setThemeAnimated(nextTheme, triggerEl, setTheme);
  };

  const getIcon = () => {
    if (theme === 'gentle') {
      return <Moon className="w-4 h-4 text-sky-400" />;
    }
    if (theme === 'dark') {
      return <Moon className="w-4 h-4 text-accent fill-current" />;
    }
    return <Sun className="w-4 h-4 text-amber-500" />;
  };

  const getLabel = () => {
    if (theme === 'gentle') return 'Theme: Gentle';
    if (theme === 'dark') return 'Theme: Dark';
    return 'Theme: Light';
  };

  const isGhost = variant === 'ghost';

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={cycleTheme}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isGhost
          ? 'bg-transparent hover:bg-hover text-fg-2 hover:text-fg'
          : 'border border-line bg-surface hover:bg-hover text-fg'
      } ${className}`}
      aria-label={`Current theme is ${theme}. Click to switch theme.`}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
};

export default ThemeToggle;
