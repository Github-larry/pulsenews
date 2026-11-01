// src/hooks/useAdmin.ts — Admin dashboard data hooks
'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, getApiError } from '@/lib/api';
import { AdminStats, Post, User } from '@/types';
import toast from 'react-hot-toast';

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => { if (data.success) setStats(data.data); })
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setIsLoading(false));
  }, []);

  return { stats, isLoading };
}

export function useAdminPosts(status?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (status) params.status = status;
      const { data } = await api.get('/admin/posts', { params });
      if (data.success) {
        setPosts(data.data);
        setTotal(data.meta?.total ?? 0);
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => { fetch(1); }, [fetch]);

  const moderatePost = useCallback(async (postId: string, postStatus: 'approved' | 'rejected') => {
    try {
      const { data } = await api.patch(`/admin/posts/${postId}/moderate`, { status: postStatus.toUpperCase() });
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        toast.success(postStatus === 'approved' ? 'Post approved and published!' : 'Post rejected.');
      }
    } catch (err) { toast.error(getApiError(err)); }
  }, []);

  return { posts, isLoading, total, moderatePost, refresh: () => fetch(1) };
}

export function useAdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users', { params: { limit: 50 } })
      .then(({ data }) => { if (data.success) setUsers(data.data); })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setIsLoading(false));
  }, []);

  const toggleBan = useCallback(async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED';
    try {
      const { data } = await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      if (data.success) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: newStatus as User['status'] } : u));
        toast.success(newStatus === 'BANNED' ? 'User banned' : 'User unbanned');
      }
    } catch (err) { toast.error(getApiError(err)); }
  }, []);

  return { users, isLoading, toggleBan };
}

export function useAdminReports() {
  const [reports, setReports] = useState<Array<{
    id: string; reason: string; details?: string; status: string; createdAt: string;
    post: { id: string; title: string }; reportedBy: { id: string; name: string };
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/reports', { params: { limit: 50 } });
      if (data.success) setReports(data.data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const resolveReport = useCallback(async (reportId: string) => {
    try {
      await api.patch(`/admin/reports/${reportId}/resolve`);
      setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: 'RESOLVED' } : r));
      toast.success('Report resolved');
    } catch (err) { toast.error(getApiError(err)); }
  }, []);

  return { reports, isLoading, resolveReport, refresh: fetch };
}
