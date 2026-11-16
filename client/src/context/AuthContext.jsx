import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../services/api.js';

const TOKEN_KEY = 'foodbridge-token';
const USER_KEY = 'foodbridge-user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      if (token && userStr) {
        return { token, user: JSON.parse(userStr) };
      }
      return token ? { token, user: null } : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return Boolean(localStorage.getItem(TOKEN_KEY) && !localStorage.getItem(USER_KEY));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let token = null;
    try {
      token = localStorage.getItem(TOKEN_KEY);
    } catch {
      setLoading(false);
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest('/auth/me', { token })
      .then(({ user }) => {
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch {}
        setSession({ token, user });
      })
      .catch(() => {
        try {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        } catch {}
        setSession(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback((result) => {
    try {
      localStorage.setItem(TOKEN_KEY, result.token);
      if (result.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      }
    } catch {}
    setSession(result);
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
    setSession(null);
  }, []);

  return <AuthContext.Provider value={{ session, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
