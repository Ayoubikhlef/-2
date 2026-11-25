import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  api,
  setAccessToken,
  setStoredUser,
  getStoredUser,
  refreshToken,
  hasSessionMarker,
  clearSessionMarker,
} from '../utils/api';

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
  login: (email: string, password: string, twoFactorCode?: string, captchaToken?: string) => Promise<LoginResult>;
  startTwoFactorSetup: (challengeToken: string) => Promise<TwoFactorSetupData>;
  confirmTwoFactorSetup: (
    challengeToken: string,
    code: string
  ) => Promise<{ backupCodes: string[]; user: User }>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isCustomer: boolean;
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
      // OAuth callbacks land on /#account with no localStorage snapshot yet,
      // but they do carry the readable session marker. Probe refresh in both
      // cases so the account area can open straight away.
      if (stored || hasSessionMarker()) {
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
    async (email: string, password: string, twoFactorCode?: string, captchaToken?: string): Promise<LoginResult> => {
      // The response is a discriminated step result rather than an error.
      const data: any = await api.auth.login({ email, password, twoFactorCode, captchaToken });

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
    // No session is created here: the account must confirm its email first.
    return api.auth.register(data);
  }, []);

  const logout = useCallback(async () => {
    try { await api.auth.logout(); } catch {}
    setAccessToken(null);
    setStoredUser(null);
    clearSessionMarker();
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
  const isCustomer = user?.role === 'CUSTOMER';

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
        isCustomer,
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
