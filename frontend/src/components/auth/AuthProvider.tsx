
'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, login, logout, ready } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    // Wait until the saved login information has loaded.
    if (!ready || initialized.current) return;

    initialized.current = true;

    async function restoreSession() {
      try {
        if (accessToken) {
          // Verify the stored token is still valid.
          const { data } = await api.get('/auth/me');

          if (data.success) {
            login(data.data, accessToken);
          } else {
            logout();
          }
        } else {
          // Try refreshing the session using the httpOnly cookie.
          const { data } = await api.post('/auth/refresh');

          if (data.success && data.data?.accessToken) {
            const newToken = data.data.accessToken;

            // Fetch the user profile using the new access token.
            const meRes = await api.get('/auth/me');

            if (meRes.data.success) {
              login(meRes.data.data, newToken);
            } else {
              logout();
            }
          } else {
            logout();
          }
        }
      } catch {
        // No valid session: clear authentication state.
        logout();
      }
    }

    restoreSession();
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
