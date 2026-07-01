import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, setAccessToken, setStoredUser, getStoredUser, refreshToken } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const stored = getStoredUser();
      if (stored) {
        const refreshed = await refreshToken();
        if (refreshed) {
          setUser(refreshed.user);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    setAccessToken(data.accessToken);
    setStoredUser(data.user);
    setUser(data.user);
  }, []);

  const register = useCallback(async (data: { email: string; password: string; name: string; phone?: string }) => {
    const result = await api.auth.register(data);
    setAccessToken(result.accessToken);
    setStoredUser(result.user);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try { await api.auth.logout(); } catch {}
    setAccessToken(null);
    setStoredUser(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
