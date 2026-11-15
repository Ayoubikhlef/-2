import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, setAccessToken, setStoredUser, getStoredUser, refreshToken } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  avatar?: string;
  twoFactorEnabled?: boolean;
}

export interface LoginResult {
  user?: User;
  twoFactorRequired?: boolean;
  setupRequired?: boolean;
  challengeToken?: string;
}

export interface TwoFactorSetupData {
  secret: string;
  otpauthUrl: string;
  issuer: string;
  account: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<LoginResult>;
  startTwoFactorSetup: (challengeToken: string) => Promise<TwoFactorSetupData>;
  confirmTwoFactorSetup: (
    challengeToken: string,
    code: string
  ) => Promise<{ backupCodes: string[]; user: User }>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  /** Force a token refresh (used when an API call returns 401). */
  refreshAuth: () => Promise<boolean>;
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
        } else if (getStoredUser()) {
          // Refresh failed (network) but session still stored - keep user
          // so admin dashboard can retry; only force logout on hard reject.
          setUser(getStoredUser());
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = useCallback(
    async (email: string, password: string, twoFactorCode?: string): Promise<LoginResult> => {
      // The response is a discriminated step result rather than an error.
      const data: any = await api.auth.login({ email, password, twoFactorCode });

      if (data?.accessToken) {
        setAccessToken(data.accessToken);
        setStoredUser(data.user);
        setUser(data.user);
        return { user: data.user };
      }

      if (data?.twoFactorSetupRequired) {
        return { setupRequired: true, challengeToken: data.challengeToken };
      }

      return { twoFactorRequired: true, challengeToken: data.challengeToken };
    },
    []
  );

  const startTwoFactorSetup = useCallback(
    (challengeToken: string) => api.auth.twoFactorStart(challengeToken),
    []
  );

  const confirmTwoFactorSetup = useCallback(async (challengeToken: string, code: string) => {
    const result = await api.auth.twoFactorConfirm({ challengeToken, code });
    setAccessToken(result.accessToken);
    setStoredUser(result.user);
    setUser(result.user);
    return { backupCodes: result.backupCodes, user: result.user };
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

  const refreshAuth = useCallback(async () => {
    const refreshed = await refreshToken();
    if (refreshed) {
      setUser(refreshed.user);
      return true;
    }
    setUser(null);
    return false;
  }, []);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        startTwoFactorSetup,
        confirmTwoFactorSetup,
        register,
        logout,
        isAdmin,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
