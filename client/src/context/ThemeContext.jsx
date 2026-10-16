import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export const ThemeProvider = ({
  children,
  defaultTheme = 'light',
  storageKey = 'billbox.theme',
}) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'dark' || saved === 'gentle') return saved;
      return 'light'; // Default theme for all users, system theme permanently removed
    } catch {
      return defaultTheme;
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    if (theme === 'dark') return 'dark';
    if (theme === 'gentle') return 'gentle';
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const active = theme === 'dark' || theme === 'gentle' ? theme : 'light';
      setResolvedTheme(active);
      root.dataset.theme = active;
      if (active === 'dark' || active === 'gentle') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    const validTheme = newTheme === 'dark' || newTheme === 'gentle' ? newTheme : 'light';
    try {
      localStorage.setItem(storageKey, validTheme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e);
    }
    const root = document.documentElement;
    if (!window.__isThemeTransitioning) {
      root.classList.add('theme-transition');
      window.clearTimeout(window.__themeTransitionTimer);
      window.__themeTransitionTimer = window.setTimeout(() => {
        root.classList.remove('theme-transition');
      }, 180);
    }
    setThemeState(validTheme);
  }, [storageKey]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeProvider;

