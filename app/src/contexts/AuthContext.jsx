import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { request, SESSION_EXPIRED_EVENT } from '../services/api';
import {
  clearStoredSession,
  getSessionTimes,
  monitorSession,
  storeSession
} from '../helpers/authSession';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const expireSession = useCallback((expiredToken, revoke = false) => {
    if (!clearStoredSession(expiredToken)) return;
    setToken(null);
    setUser(null);
    setLoading(false);
    setSessionExpired(true);
    if (revoke && getSessionTimes(expiredToken)?.expiresAt > Date.now()) {
      request('/api/auth/logout', { method: 'POST', token: expiredToken, skipSessionCheck: true })
        .catch((err) => console.error('Session revocation failed:', err.message));
    }
  }, []);

  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  useEffect(() => {
    if (!token) return undefined;
    return monitorSession(token, () => expireSession(token, true));
  }, [token, expireSession]);

  useEffect(() => {
    const handleExpired = (event) => {
      const current = localStorage.getItem('token');
      if (current && event.detail?.token === current) {
        expireSession(current, event.detail?.code === 'SESSION_IDLE');
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [expireSession]);

  useEffect(() => {
    const syncSession = (event) => {
      if (event.key !== 'token' && event.key !== null) return;
      const stored = localStorage.getItem('token');
      setUser(null);
      setLoading(Boolean(stored));
      setToken(stored);
      setSessionExpired(!stored);
    };
    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await request('/api/auth/me', { token });
        if (active && localStorage.getItem('token') === token) setUser(data);
      } catch (err) {
        console.error(err);
        if (active && clearStoredSession(token)) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();
    return () => { active = false; };
  }, [token]);

  const login = useCallback(async (email, password, twoFactor = {}) => {
    setError(null);
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password, otpToken: twoFactor.otpToken, otp: twoFactor.otp }
    });

    storeSession(data.token);
    setSessionExpired(false);
    setToken(data.token);

    const userData = await request('/api/auth/me', { token: data.token });
    if (localStorage.getItem('token') !== data.token) throw new Error('Sessão expirada. Inicie sessão novamente.');
    setUser(userData);

    return userData;
  }, []);

  const requestLoginCode = useCallback(async (email, password) => {
    return request('/api/auth/verify-credentials', {
      method: 'POST',
      body: { email, password }
    });
  }, []);

  const register = useCallback(async (name, email, password, twoFactor = {}) => {
    setError(null);

    const data = await request('/api/auth/register', {
      method: 'POST',
      body: { name, email, password, otpToken: twoFactor.otpToken, otp: twoFactor.otp }
    });

    storeSession(data.token);
    setSessionExpired(false);
    setToken(data.token);

    const userData = await request('/api/auth/me', { token: data.token });
    if (localStorage.getItem('token') !== data.token) throw new Error('Sessão expirada. Inicie sessão novamente.');
    setUser(userData);

    return userData;
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const data = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email }
    });

    return data;
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    const data = await request('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password }
    });

    return data;
  }, []);

  const logout = useCallback(async () => {
    if (clearStoredSession(token)) {
      setToken(null);
      setUser(null);
      setSessionExpired(false);
    }
    try {
      if (token) {
        await request('/api/auth/logout', { method: 'POST', token, skipSessionCheck: true });
      }
    } catch (err) {
      console.error('Logout API error:', err.message);
    }
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await request('/api/auth/me', { token });
      if (localStorage.getItem('token') !== token) return null;
      setUser(data);
      return data;
    } catch (err) {
      console.error('Refresh user failed:', err.message);
      return null;
    }
  }, [token]);

  const authRequest = useCallback(
    async (path, options = {}) => {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      return request(path, { ...options, token: authToken });
    },
    [token]
  );

  return (
    <AuthContext.Provider value={{ token, user, loading, error, sessionExpired, clearSessionExpired, login, requestLoginCode, logout, register, forgotPassword, resetPassword, authRequest, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
