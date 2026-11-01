// authStore.ts — Single source of truth for auth state
'use client';
import { useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  country?: string;
  bio?: string;
  status?: string;
  createdAt?: string;
}

const USER_KEY  = 'tws_user';
const TOKEN_KEY = 'tws_token';

// ── Storage helpers ───────────────────────────────────────────
export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function storeAuth(user: AuthUser, token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_KEY,  JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event('tws-auth-change'));
  } catch {}
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('tws-auth-change'));
  } catch {}
}

// ── React hook — use this in any component ────────────────────
export function useAuthStore() {
  const [user, setUser]   = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydrate from localStorage on mount
    setUser(getStoredUser());
    setToken(getStoredToken());
    setReady(true);

    // Listen for auth changes from other tabs / components
    function onAuthChange() {
      setUser(getStoredUser());
      setToken(getStoredToken());
    }
    window.addEventListener('tws-auth-change', onAuthChange);
    return () => window.removeEventListener('tws-auth-change', onAuthChange);
  }, []);

  const isAuthenticated = !!user && !!token;
  const isAdmin         = user?.role === 'ADMIN';

  function login(u: AuthUser, t: string) {
    storeAuth(u, t);
    setUser(u);
    setToken(t);
  }

  function logout() {
    clearAuth();
    setUser(null);
    setToken(null);
  }

  function updateUser(updates: Partial<AuthUser>) {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  }

  return {
    user,
    token,
    ready,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    updateUser,
    accessToken: token,
  };
}
