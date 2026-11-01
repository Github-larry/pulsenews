// lib/utils.ts — Shared utility functions
import { clsx, type ClassValue } from 'clsx';

// ── Class name merger ─────────────────────────────────────────
export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
}

// ── Initials from name ────────────────────────────────────────
export function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Time ago ──────────────────────────────────────────────────
export function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);
  if (minutes < 1)  return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours   < 24) return `${hours}h ago`;
  if (days    < 7)  return `${days}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

// ── Format date ───────────────────────────────────────────────
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Format large numbers ──────────────────────────────────────
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ── Category badge class ──────────────────────────────────────
export function getCategoryClass(category: string): string {
  const map: Record<string, string> = {
    Politics:    'badge badge-accent',
    Business:    'badge badge-green',
    Technology:  'badge badge-blue',
    Health:      'badge badge-green',
    Sports:      'badge badge-blue',
    Culture:     'badge badge-gold',
    Environment: 'badge badge-green',
    Crime:       'badge badge-accent',
    Other:       'badge',
  };
  return map[category] ?? 'badge badge-accent';
}

// ── Sanitize text for display ─────────────────────────────────
export function sanitizeText(text: string): string {
  return text.replace(/[<>]/g, '');
}

// ── Truncate text ─────────────────────────────────────────────
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// ── Validate image file ───────────────────────────────────────
export function validateImageFile(file: File): string | null {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) return 'Only JPEG, PNG, and WebP images are allowed';
  if (file.size > 10 * 1024 * 1024)  return 'Image must be under 10MB';
  return null;
}
