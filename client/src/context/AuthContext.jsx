import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../services/api.js';

const TOKEN_KEY = 'foodbridge-token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(() => {
    try {
      return Boolean(localStorage.getItem(TOKEN_KEY));
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
      .then(({ user }) => setSession({ token, user }))
      .catch(() => {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {}
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback((result) => {
    localStorage.setItem(TOKEN_KEY, result.token);
    setSession(result);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setSession(null);
  }, []);

  return <AuthContext.Provider value={{ session, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
