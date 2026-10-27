import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { useToast } from './ToastContext';
import { getCookie, setCookie, deleteCookie } from '../utils/cookieUtils';
import {
  loginToBackend,
  registerToBackend,
  fetchCurrentUser,
  getStoredToken,
  setStoredToken,
} from '../services/graphql';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoginModalOpen: boolean;
  isLogoutModalOpen: boolean;
  isAccountModalOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  openLogout: () => void;
  closeLogout: () => void;
  openAccount: () => void;
  closeAccount: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; redirectUrl?: string; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; user?: User; redirectUrl?: string; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = getCookie('aura_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const { showToast } = useToast();

  // Validate active session token against backend on mount
  useEffect(() => {
    let isMounted = true;
    async function verifySession() {
      const stored = getStoredToken();
      if (stored) {
        try {
          const remoteUser = await fetchCurrentUser();
          if (remoteUser && isMounted) {
            setUser(remoteUser);
            setCookie('aura_user', JSON.stringify(remoteUser), 7);
          } else if (!remoteUser && isMounted) {
            // Token is invalid or expired
            setUser(null);
            setToken(null);
            setStoredToken(null);
            deleteCookie('aura_user');
          }
        } catch {
          // Keep existing cached session if offline
        }
      }
    }
    void verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      setCookie('aura_user', JSON.stringify(user), 7);
    } else {
      deleteCookie('aura_user');
    }
  }, [user]);

  const openLogin = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLogin = useCallback(() => setIsLoginModalOpen(false), []);
  const openLogout = useCallback(() => setIsLogoutModalOpen(true), []);
  const closeLogout = useCallback(() => setIsLogoutModalOpen(false), []);
  const openAccount = useCallback(() => setIsAccountModalOpen(true), []);
  const closeAccount = useCallback(() => setIsAccountModalOpen(false), []);

  const login = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; user?: User; redirectUrl?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const result = await loginToBackend(cleanEmail, pass);
      setCookie('aura_user', JSON.stringify(result.user), 7);
      setStoredToken(result.token);
      setUser(result.user);
      setToken(result.token);
      setIsLoginModalOpen(false);
      showToast(`Welcome back, ${result.user.name}!`, 'success');
      return { success: true, user: result.user, redirectUrl: result.redirectUrl };
    } catch (backendErr: any) {
      console.warn('Backend login request error:', backendErr?.message);

      const msg = backendErr?.message || '';
      if (
        msg.includes('Invalid email or password') ||
        msg.includes('Authentication failed')
      ) {
        return { success: false, error: 'Invalid email or password. Please verify your credentials.' };
      }

      return {
        success: false,
        error: 'Unable to reach the authentication server. Please check your internet connection.',
      };
    }
  };

  const register = async (
    name: string,
    email: string,
    pass: string
  ): Promise<{ success: boolean; user?: User; redirectUrl?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const result = await registerToBackend(name, cleanEmail, pass);
      setCookie('aura_user', JSON.stringify(result.user), 7);
      setStoredToken(result.token);
      setUser(result.user);
      setToken(result.token);
      setIsLoginModalOpen(false);
      showToast(`Welcome to AURA, ${result.user.name}! Account created.`, 'success');
      return { success: true, user: result.user, redirectUrl: result.redirectUrl };
    } catch (backendErr: any) {
      console.warn('Backend registration error:', backendErr?.message);

      const msg = backendErr?.message || '';
      if (msg.includes('already exists')) {
        return { success: false, error: 'An account with this email address already exists. Please log in.' };
      }

      return {
        success: false,
        error: 'Unable to reach the server to create your account. Please check your connection and try again.',
      };
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setStoredToken(null);
    deleteCookie('aura_user');
    try {
      localStorage.removeItem('aura_token');
      localStorage.removeItem('aura_user');
    } catch {
      // ignore
    }
    setIsLogoutModalOpen(false);
    showToast('Signed out successfully.', 'info');
  }, [showToast]);

  const isAdmin =
    user?.role?.toUpperCase() === 'ADMIN' || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin,
        isLoginModalOpen,
        isLogoutModalOpen,
        isAccountModalOpen,
        openLogin,
        closeLogin,
        openLogout,
        closeLogout,
        openAccount,
        closeAccount,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
