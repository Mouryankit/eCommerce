import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { useToast } from './ToastContext';
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

const DEFAULT_USERS: Record<string, User> = {
  'admin@aura.store': {
    id: 1,
    name: 'Elena Rostova',
    email: 'admin@aura.store',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  'customer@aura.store': {
    id: 2,
    name: 'Julian Vance',
    email: 'customer@aura.store',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('aura_user');
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
            localStorage.setItem('aura_user', JSON.stringify(remoteUser));
          }
        } catch {
          // Keep existing user if offline
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
      localStorage.setItem('aura_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aura_user');
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

    // 1. Try real backend GraphQL login
    try {
      const result = await loginToBackend(cleanEmail, pass);
      // Synchronously commit to localStorage so callers can read it immediately
      localStorage.setItem('aura_user', JSON.stringify(result.user));
      setStoredToken(result.token);
      setUser(result.user);
      setToken(result.token);
      setIsLoginModalOpen(false);
      showToast(`Welcome back, ${result.user.name}!`, 'success');
      return { success: true, user: result.user, redirectUrl: result.redirectUrl };
    } catch (backendErr: any) {
      console.warn('Backend login request error:', backendErr?.message);

      // If backend error is an explicit invalid credentials message, fail directly
      if (
        backendErr?.message?.includes('Invalid email or password') ||
        backendErr?.message?.includes('Authentication failed')
      ) {
        return { success: false, error: 'Invalid email or password. Please check your credentials.' };
      }

      // 2. Standalone offline fallback
      let fallbackUser: User;
      if (DEFAULT_USERS[cleanEmail]) {
        fallbackUser = DEFAULT_USERS[cleanEmail];
      } else if (cleanEmail.includes('admin') || cleanEmail.startsWith('admin@')) {
        fallbackUser = {
          id: Date.now(),
          name: cleanEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || 'Admin User',
          email: cleanEmail,
          role: 'admin',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        };
      } else {
        fallbackUser = {
          id: Date.now(),
          name: cleanEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || 'Customer User',
          email: cleanEmail,
          role: 'customer',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        };
      }

      const mockToken = `mock_token_${Date.now()}`;
      localStorage.setItem('aura_user', JSON.stringify(fallbackUser));
      setStoredToken(mockToken);
      setUser(fallbackUser);
      setToken(mockToken);
      setIsLoginModalOpen(false);
      showToast(`Signed in as ${fallbackUser.name} (Offline Mode)`, 'info');
      const adminUrl = (import.meta.env.VITE_ADMIN_URL as string) || 'http://localhost:4001';
      const customerUrl = (import.meta.env.VITE_CUSTOMER_URL as string) || 'http://localhost:4000';
      return {
        success: true,
        user: fallbackUser,
        redirectUrl: fallbackUser.role === 'admin' ? adminUrl : customerUrl,
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
      localStorage.setItem('aura_user', JSON.stringify(result.user));
      setStoredToken(result.token);
      setUser(result.user);
      setToken(result.token);
      setIsLoginModalOpen(false);
      showToast(`Welcome to AURA, ${result.user.name}! Account created.`, 'success');
      return { success: true, user: result.user, redirectUrl: result.redirectUrl };
    } catch (backendErr: any) {
      console.warn('Backend registration error:', backendErr?.message);

      if (backendErr?.message?.includes('already exists')) {
        return { success: false, error: 'An account with this email already exists. Please log in.' };
      }

      // Fallback local registration
      const newLocalUser: User = {
        id: Date.now(),
        name: name.trim(),
        email: cleanEmail,
        role: cleanEmail.includes('admin') ? 'admin' : 'customer',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      };
      const mockToken = `mock_token_${Date.now()}`;
      localStorage.setItem('aura_user', JSON.stringify(newLocalUser));
      setStoredToken(mockToken);
      setUser(newLocalUser);
      setToken(mockToken);
      setIsLoginModalOpen(false);
      showToast(`Account created for ${newLocalUser.name}!`, 'success');
      const customerUrl = (import.meta.env.VITE_CUSTOMER_URL as string) || 'http://localhost:4000';
      return { success: true, user: newLocalUser, redirectUrl: customerUrl };
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setStoredToken(null);
    localStorage.removeItem('aura_user');
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
