import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';

/**
 * Step 7.4 Theme Toggle
 * Cycles through: light -> dark -> system -> light
 * Accessible, keyboard navigable, with proper tooltip / aria label.
 */
export const ThemeToggle = ({ className = '', variant = 'outline' }) => {
  const { theme, resolvedTheme, setTheme } = usePreferences();

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
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
