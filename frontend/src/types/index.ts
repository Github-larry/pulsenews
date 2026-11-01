// types/index.ts — Shared TypeScript interfaces and types

// ── Auth ──────────────────────────────────────────────────────
export interface AuthUser {
  id:         string;
  name:       string;
  email:      string;
  role:       'USER' | 'ADMIN';
  avatarUrl?: string;
  country?:   string;
  bio?:       string;
  status?:    string;
  createdAt?: string;
}

// ── Posts ─────────────────────────────────────────────────────
export interface Author {
  id:        string;
  name:      string;
  avatarUrl?: string;
  country?:  string;
}

export interface Comment {
  id:        string;
  content:   string;
  createdAt: string;
  author:    Author;
}

export interface Post {
  id:           string;
  slug:         string;
  title:        string;
  description:  string;
  category:     string;
  imageUrl?:    string;
  location?:    string;
  status:       'PENDING' | 'APPROVED' | 'REJECTED';
  featured:     boolean;
  viewCount:    number;
  likeCount:    number;
  commentCount: number;
  isLiked?:     boolean;
  createdAt:    string;
  updatedAt:    string;
  author:       Author;
  comments?:    Comment[];
}

// ── Pagination ────────────────────────────────────────────────
export interface PaginationMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

// ── API response ──────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?:   T;
  meta?:   PaginationMeta;
  errors?: Array<{ field: string; message: string }>;
}

// ── Admin ─────────────────────────────────────────────────────
export interface AdminStats {
  totalPosts:    number;
  pendingPosts:  number;
  approvedPosts: number;
  rejectedPosts: number;
  totalUsers:    number;
  bannedUsers:   number;
  totalComments: number;
  totalLikes:    number;
  openReports:   number;
}

export interface AdminUser {
  id:        string;
  name:      string;
  email:     string;
  role:      string;
  status:    string;
  country?:  string;
  createdAt: string;
}

export interface Report {
  id:          string;
  reason:      string;
  details?:    string;
  status:      string;
  createdAt:   string;
  post:        { id: string; title: string };
  reportedBy:  { id: string; name: string };
}

// ── Categories ────────────────────────────────────────────────
export const CATEGORIES = [
  'Politics', 'Business', 'Technology', 'Health',
  'Sports', 'Culture', 'Environment', 'Crime', 'Other',
] as const;

export type Category = typeof CATEGORIES[number];
