import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { request } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await request('/api/auth/me', { token });
        setUser(data);
      } catch (err) {
        console.error(err);
        setToken(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = useCallback(async (email, password) => {
    setError(null);
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    localStorage.setItem('token', data.token);
    setToken(data.token);

    const userData = await request('/api/auth/me', { token: data.token });
    setUser(userData);

    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    setError(null);

    const data = await request('/api/auth/register', {
      method: 'POST',
      body: { name, email, password }
    });

    return data;
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
    try {
      if (token) {
        await request('/api/auth/logout', { method: 'POST', token });
      }
    } catch (err) {
      console.error('Logout API error:', err.message);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await request('/api/auth/me', { token });
      setUser(data);
      return data;
    } catch (err) {
      console.error('Refresh user failed:', err.message);
      return null;
    }
  }, [token]);

  const authRequest = useCallback(
    async (path, options = {}) => {
      return request(path, { ...options, token });
    },
    [token]
  );

  return (
    <AuthContext.Provider value={{ token, user, loading, error, login, logout, register, forgotPassword, resetPassword, authRequest, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
