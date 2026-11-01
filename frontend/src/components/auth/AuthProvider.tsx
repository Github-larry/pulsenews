'use client';
// src/components/auth/AuthProvider.tsx
// Restores auth session on app load by fetching /me with stored token
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, login, logout, setLoading } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function restoreSession() {
      setLoading(true);
      try {
        if (accessToken) {
          // Verify the stored token is still valid
          const { data } = await api.get('/auth/me');
          if (data.success) {
            login(data.data, accessToken);
          } else {
            logout();
          }
        } else {
          // Try refreshing with httpOnly cookie
          const { data } = await api.post('/auth/refresh');
          if (data.success) {
            // Fetch user profile with new access token
            const meRes = await api.get('/auth/me');
            if (meRes.data.success) {
              login(meRes.data.data, data.data.accessToken);
            }
          }
        }
      } catch {
        // No valid session — clear state silently
        logout();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
