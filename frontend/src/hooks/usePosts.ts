// hooks/usePosts.ts — Reusable data fetching for posts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { api, getApiError } from '@/lib/api';
import { Post, PaginationMeta } from '@/types';
import { getStoredToken } from '@/store/authStore';
import toast from 'react-hot-toast';

interface UsePostsOptions {
  category?:  string;
  search?:    string;
  authorId?:  string;
  includeAll?: boolean;
  limit?:     number;
  sort?:      'latest' | 'trending' | 'views';
}

interface UsePostsReturn {
  posts:          Post[];
  meta:           PaginationMeta | null;
  isLoading:      boolean;
  isFetchingMore: boolean;
  error:          string | null;
  loadMore:       () => Promise<void>;
  toggleLike:     (postId: string, onAuthRequired: () => void) => Promise<void>;
  refresh:        () => Promise<void>;
}

export function usePosts(options: UsePostsOptions = {}): UsePostsReturn {
  const { category, search, authorId, includeAll, limit = 12, sort = 'latest' } = options;

  const [posts,          setPosts]          = useState<Post[]>([]);
  const [meta,           setMeta]           = useState<PaginationMeta | null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [page,           setPage]           = useState(1);

  const fetchPosts = useCallback(async (p: number, append = false) => {
    p === 1 ? setIsLoading(true) : setIsFetchingMore(true);
    setError(null);

    try {
      const params: Record<string, string | number | boolean> = { page: p, limit, sort };
      if (category)  params.category   = category;
      if (search)    params.search     = search;
      if (authorId)  params.authorId   = authorId;
      if (includeAll) params.includeAll = true;

      const { data } = await api.get('/posts', { params });

      if (data.success) {
        setPosts(prev => append ? [...prev, ...data.data] : data.data);
        setMeta(data.meta);
        setPage(p);
      } else {
        setError('Failed to load stories');
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [category, search, authorId, includeAll, limit, sort]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1);
  }, [fetchPosts]);

  const loadMore = useCallback(async () => {
    if (!meta?.hasNext || isFetchingMore) return;
    await fetchPosts(page + 1, true);
  }, [meta, isFetchingMore, page, fetchPosts]);

  const refresh = useCallback(() => fetchPosts(1), [fetchPosts]);

  const toggleLike = useCallback(async (postId: string, onAuthRequired: () => void) => {
    const token = getStoredToken();
    if (!token) { onAuthRequired(); toast.error('Sign in to like stories'); return; }

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }
        : p
    ));

    try {
      await api.post(`/posts/${postId}/like`);
    } catch (err) {
      // Revert on failure
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      ));
      toast.error(getApiError(err));
    }
  }, []);

  return { posts, meta, isLoading, isFetchingMore, error, loadMore, toggleLike, refresh };
}
