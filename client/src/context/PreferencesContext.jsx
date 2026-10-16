import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useTheme } from './ThemeContext';
import api from '../api/axios';

const PreferencesContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  density: 'comfortable',
  setDensity: () => {},
  viewMode: 'table',
  setViewMode: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  toggleSidebarCollapse: () => {},
  syncFromUser: () => {},
});

const STORAGE_KEYS = {
  DENSITY: 'billbox.density',
  VIEW_MODE: 'billbox.viewMode',
  SIDEBAR_COLLAPSED: 'billbox.sidebarCollapsed',
};

export const PreferencesProvider = ({ children }) => {
  const { theme, resolvedTheme, setTheme: setBaseTheme } = useTheme();

  // 1. Density: 'comfortable' (40px) or 'compact' (32px)
  const [density, setDensityState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DENSITY) || 'comfortable';
    } catch {
      return 'comfortable';
    }
  });

  // 2. Table vs Grid view mode
  const [viewMode, setViewModeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.VIEW_MODE) || 'table';
    } catch {
      return 'table';
    }
  });

  // 3. Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
    } catch {
      return false;
    }
  });

  // Sync density attribute to root document
  useEffect(() => {
    try {
      document.documentElement.dataset.density = density;
    } catch (e) {
      console.warn('Could not set dataset.density:', e);
    }
  }, [density]);

  // Sync to backend profile when user is authenticated
  const syncToProfile = useCallback((updates) => {
    const token = localStorage.getItem('billbox_token');
    if (!token) return;
    try {
      api.put('/auth/profile', { uiPreferences: updates }).catch((err) => {
        // Silently catch sync error to avoid breaking offline or optimistic flow
        console.warn('Could not sync uiPreferences to profile:', err?.message);
      });
    } catch {
      // ignore
    }
  }, []);

  const setTheme = useCallback((newTheme) => {
    setBaseTheme(newTheme);
    syncToProfile({ theme: newTheme });
  }, [setBaseTheme, syncToProfile]);

  const setDensity = useCallback((newDensity) => {
    const valid = newDensity === 'compact' ? 'compact' : 'comfortable';
    try {
      localStorage.setItem(STORAGE_KEYS.DENSITY, valid);
    } catch (e) {
      console.warn('Failed to save density preference:', e);
    }
    setDensityState(valid);
    syncToProfile({ density: valid });
  }, [syncToProfile]);

  const setViewMode = useCallback((newMode) => {
    const valid = newMode === 'grid' ? 'grid' : 'table';
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW_MODE, valid);
    } catch (e) {
      console.warn('Failed to save viewMode preference:', e);
    }
    setViewModeState(valid);
    syncToProfile({ viewMode: valid });
  }, [syncToProfile]);

  const setSidebarCollapsed = useCallback((collapsed) => {
    const bool = Boolean(collapsed);
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(bool));
    } catch (e) {
      console.warn('Failed to save sidebarCollapsed preference:', e);
    }
    setSidebarCollapsedState(bool);
    syncToProfile({ sidebarCollapsed: bool });
  }, [syncToProfile]);

  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next));
      } catch (e) {
        console.warn('Failed to save sidebarCollapsed preference:', e);
      }
      syncToProfile({ sidebarCollapsed: next });
      return next;
    });
  }, [syncToProfile]);

  // Called when user logs in or profile loads from API
  const syncFromUser = useCallback((uiPreferences) => {
    if (!uiPreferences) return;
    if (uiPreferences.theme && ['light', 'dark', 'system'].includes(uiPreferences.theme)) {
      setBaseTheme(uiPreferences.theme);
    }
    if (uiPreferences.density && ['comfortable', 'compact'].includes(uiPreferences.density)) {
      try {
        localStorage.setItem(STORAGE_KEYS.DENSITY, uiPreferences.density);
      } catch {}
      setDensityState(uiPreferences.density);
    }
    if (uiPreferences.viewMode && ['table', 'grid'].includes(uiPreferences.viewMode)) {
      try {
        localStorage.setItem(STORAGE_KEYS.VIEW_MODE, uiPreferences.viewMode);
      } catch {}
      setViewModeState(uiPreferences.viewMode);
    }
    if (typeof uiPreferences.sidebarCollapsed === 'boolean') {
      try {
        localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(uiPreferences.sidebarCollapsed));
      } catch {}
      setSidebarCollapsedState(uiPreferences.sidebarCollapsed);
    }
  }, [setBaseTheme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      density,
      setDensity,
      viewMode,
      setViewMode,
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebarCollapse,
      syncFromUser,
    }),
    [
      theme,
      resolvedTheme,
      setTheme,
      density,
      setDensity,
      viewMode,
      setViewMode,
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebarCollapse,
      syncFromUser,
    ]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
export default PreferencesProvider;
