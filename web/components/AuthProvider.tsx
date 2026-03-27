"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import {
  clearAuthState,
  getAccessToken,
  roleCanUseDashboard,
  setAccessToken,
  setRefreshToken,
  setStoredUser
} from "@/lib/auth";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  canUseDashboard: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  updateUserLocally: (nextUser: User) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const currentUser = await api.getCurrentUser();
        if (!isMounted) {
          return;
        }
        setStoredUser(currentUser);
        setUser(currentUser);
      } catch {
        if (!isMounted) {
          return;
        }
        clearAuthState();
        setUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokenPayload = await api.login(email, password);
    setAccessToken(tokenPayload.access_token);
    setRefreshToken(tokenPayload.refresh_token);

    const currentUser = await api.getCurrentUser();
    setStoredUser(currentUser);
    setUser(currentUser);

    return currentUser;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await api.getCurrentUser();
      setStoredUser(currentUser);
      setUser(currentUser);
      return currentUser;
    } catch {
      clearAuthState();
      setUser(null);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthState();
    setUser(null);
  }, []);

  const updateUserLocally = useCallback((nextUser: User) => {
    setStoredUser(nextUser);
    setUser(nextUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      canUseDashboard: roleCanUseDashboard(user?.role),
      login,
      logout,
      refreshUser,
      updateUserLocally
    }),
    [user, loading, login, logout, refreshUser, updateUserLocally]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}