import { useState } from 'react';

/**
 * Custom hook to persist viewMode ('table' | 'grid') across page navigation,
 * browser reloads, and user sessions/logouts using localStorage.
 *
 * @param {string} key - Unique localStorage key for the page
 * @param {'table' | 'grid'} defaultMode - Default fallback view mode (default: 'table')
 * @returns {[string, (mode: string) => void]} [viewMode, setViewMode]
 */
export const usePersistentViewMode = (key = 'billbox_view_mode', defaultMode = 'table') => {
  const [viewMode, setViewModeState] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const pageSaved = localStorage.getItem(key);
        if (pageSaved === 'grid' || pageSaved === 'table') {
          return pageSaved;
        }
        const globalSaved = localStorage.getItem('billbox_global_view_mode');
        if (globalSaved === 'grid' || globalSaved === 'table') {
          return globalSaved;
        }
      }
    } catch {
      // Fallback if localStorage is inaccessible
    }
    return defaultMode;
  });

  const setViewMode = (mode) => {
    setViewModeState(mode);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, mode);
        localStorage.setItem('billbox_global_view_mode', mode);
      }
    } catch {
      // Ignore quota or permission errors
    }
  };

  return [viewMode, setViewMode];
};

export default usePersistentViewMode;
