import React, { useRef } from 'react';
import { flushSync } from 'react-dom';
import { Sun, Moon } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';

/**
 * Step 13.8 Theme toggle — circular reveal (T4)
 * The new theme expands outward from the toggle button like a circular wave.
 * Falls back cleanly to an instant switch if reduced-motion is requested
 * or document.startViewTransition is not supported.
 */
export async function setThemeAnimated(next, originEl, applyThemeFn) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const applyWithCssTransition = () => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    applyThemeFn(next);
    window.clearTimeout(window.__themeTransitionTimer);
    window.__themeTransitionTimer = window.setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 320);
  };

  if (!document.startViewTransition || reduced) {
    applyWithCssTransition();
    return;
  }

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (originEl && originEl.getBoundingClientRect) {
    const { left, top, width, height } = originEl.getBoundingClientRect();
    x = left + width / 2;
    y = top + height / 2;
  }

  const r = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  try {
    const t = document.startViewTransition(() => {
      flushSync(() => {
        applyThemeFn(next);
      });
    });

    await t.ready;
    const anim = document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${r}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 360,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        pseudoElement: '::view-transition-new(root)',
      }
    );
    await anim.finished;
  } catch {
    applyWithCssTransition();
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
