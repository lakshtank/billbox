import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { usePreferences } from './PreferencesContext';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize user from cached session if token exists
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('billbox_token');
      const savedUser = localStorage.getItem('billbox_user');
      return token && savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('billbox_token');
    const savedUser = localStorage.getItem('billbox_user');
    // If we have cached token and user, don't block the UI while validating
    return Boolean(token && !savedUser);
  });

  const { syncFromUser } = usePreferences();

  // Validate session against backend on mount
  useEffect(() => {
    const token = localStorage.getItem('billbox_token');
    if (!token) {
      if (typeof document !== 'undefined') {
        document.cookie = 'billbox_token=; path=/; max-age=0; SameSite=Lax';
      }
      setLoading(false);
      setUser(null);
      localStorage.removeItem('billbox_user');
      return;
    }

    // Ensure cookie matches cached token for seamless iframe/img streaming
    if (typeof document !== 'undefined') {
      document.cookie = `billbox_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
    }

    api
      .get('/auth/me')
      .then((res) => {
        const u = res.data.data.user;
        setUser(u);
        localStorage.setItem('billbox_user', JSON.stringify(u));
        if (u?.uiPreferences) {
          syncFromUser(u.uiPreferences);
        }
      })
      .catch((err) => {
        // ONLY clear auth credentials if the server explicitly rejects the token as invalid/expired (401/403)
        // If it's a network glitch, server reload, or 5xx, keep the user logged in!
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('billbox_token');
          localStorage.removeItem('billbox_user');
          if (typeof document !== 'undefined') {
            document.cookie = 'billbox_token=; path=/; max-age=0; SameSite=Lax';
          }
          setUser(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [syncFromUser]);

  const loginUser = useCallback(
    (token, userData) => {
      localStorage.setItem('billbox_token', token);
      if (typeof document !== 'undefined') {
        document.cookie = `billbox_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
      }
      if (userData) {
        localStorage.setItem('billbox_user', JSON.stringify(userData));
      }
      setUser(userData);
      if (userData?.uiPreferences) {
        syncFromUser(userData.uiPreferences);
      }
    },
    [syncFromUser]
  );

  const logoutUser = useCallback(() => {
    localStorage.removeItem('billbox_token');
    localStorage.removeItem('billbox_user');
    if (typeof document !== 'undefined') {
      document.cookie = 'billbox_token=; path=/; max-age=0; SameSite=Lax';
    }
    setUser(null);
  }, []);

  const updateUser = useCallback((userData) => {
    setUser((prev) => {
      const updated = { ...prev, ...userData };
      localStorage.setItem('billbox_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    user,
    setUser,
    updateUser,
    isAuthenticated: Boolean(user),
    loading,
    loginUser,
    logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
