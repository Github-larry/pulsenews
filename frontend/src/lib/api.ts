// lib/api.ts — Axios API client with security and auto token refresh
import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { getStoredToken, clearAuth } from '@/store/authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ── Create axios instance ─────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,
  timeout:         15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach JWT token ────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Track if a refresh is already in progress
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(p => {
    if (error) p.reject(error);
    else       p.resolve(token!);
  });
  failedQueue = [];
}

// ── Response interceptor — auto refresh on 401 ───────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest) {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return api(originalRequest!);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data?.data?.accessToken;
        if (newToken) {
          localStorage.setItem('tws_token', newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          processQueue(null, newToken);
          if (originalRequest) {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Error message extractor ───────────────────────────────────
export function getApiError(err: unknown): string {
  const e = err as AxiosError<{ message?: string }>;
  return e?.response?.data?.message ?? e?.message ?? 'Something went wrong';
}

export default api;
