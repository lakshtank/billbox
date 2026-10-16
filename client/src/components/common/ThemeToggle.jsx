import React, { useRef } from 'react';
import { flushSync } from 'react-dom';
import { Sun, Moon, Laptop } from 'lucide-react';
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

  if (!document.startViewTransition || reduced || !originEl) {
    applyThemeFn(next);
    return;
  }

  const { left, top, width, height } = originEl.getBoundingClientRect();
  const x = left + width / 2;
  const y = top + height / 2;
  const r = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const t = document.startViewTransition(() => {
    flushSync(() => {
      applyThemeFn(next);
    });
  });

  try {
    await t.ready;
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${r}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 520,
        easing: 'cubic-bezier(.16,1,.3,1)',
        pseudoElement: '::view-transition-new(root)',
      }
    );
  } catch {
    // Graceful fallback if pseudoElement animation throws
  }
}

/**
 * Step 7.4 Theme Toggle
 * Cycles through: light -> dark -> system -> light
 * Accessible, keyboard navigable, with proper tooltip / aria label.
 */
export const ThemeToggle = ({ className = '', variant = 'outline' }) => {
  const { theme, resolvedTheme, setTheme } = usePreferences();
  const buttonRef = useRef(null);

  const cycleTheme = (e) => {
    let nextTheme;
    if (theme === 'light') {
      nextTheme = 'dark';
    } else if (theme === 'dark') {
      nextTheme = 'system';
    } else {
      nextTheme = 'light';
    }

    const triggerEl = buttonRef.current || e?.currentTarget;
    setThemeAnimated(nextTheme, triggerEl, setTheme);
  };

  const getIcon = () => {
    if (theme === 'system') {
      return <Laptop className="w-4 h-4 text-fg-2" />;
    }
    if (resolvedTheme === 'dark') {
      return <Moon className="w-4 h-4 text-accent" />;
    }
    return <Sun className="w-4 h-4 text-amber-500" />;
  };

  const getLabel = () => {
    if (theme === 'system') return 'Theme: System';
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
