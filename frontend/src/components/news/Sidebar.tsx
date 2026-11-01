'use client';
// src/components/news/Sidebar.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, BarChart2, Tag, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { Post } from '@/types';
import { formatCount, timeAgo, getCategoryColor } from '@/lib/utils';
import { Skeleton } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const CATEGORIES = [
  { label: 'Politics', emoji: '🏛️' },
  { label: 'Business', emoji: '💼' },
  { label: 'Technology', emoji: '💻' },
  { label: 'Health', emoji: '🏥' },
  { label: 'Sports', emoji: '⚽' },
  { label: 'Culture', emoji: '🎭' },
  { label: 'Environment', emoji: '🌿' },
];

interface Stats {
  totalPosts: number;
  totalUsers: number;
  totalLikes: number;
  totalComments: number;
}

export function Sidebar({ activeCategory }: { activeCategory?: string }) {
  const { isAuthenticated } = useAuthStore();
  const [trending, setTrending] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    // Fetch trending posts
    api.get('/posts', { params: { limit: 5, sort: 'likes' } })
      .then(({ data }) => { if (data.success) setTrending(data.data); })
      .catch(() => {})
      .finally(() => setLoadingTrending(false));

    // Fetch public stats
    api.get('/posts/stats')
      .then(({ data }) => { if (data.success) setStats(data.data); })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  return (
    <aside className="space-y-5">
      {/* Submit CTA */}
      {!isAuthenticated && (
        <div className="bg-ink rounded-xl p-5 text-white">
          <div className="font-display text-lg font-bold mb-1.5">Your story matters</div>
          <p className="text-sm text-white/60 leading-relaxed mb-4">
            Share breaking news and events from your community with the world.
          </p>
          <Link href="/submit" className="block text-center btn-primary btn w-full">
            ✏️ Submit a Story
          </Link>
        </div>
      )}

      {/* Trending */}
      <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e2dfd8]">
          <Flame size={15} className="text-accent" />
          <span className="text-xs font-bold uppercase tracking-wide text-ink">Trending Now</span>
        </div>
        {loadingTrending ? (
          <div className="divide-y divide-[#e2dfd8]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-3 flex gap-3">
                <Skeleton className="w-6 h-5" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[#e2dfd8]">
            {trending.map((post, i) => (
              <Link
                key={post.id}
                href={`/news/${post.id}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-paper-warm transition-colors"
              >
                <span className={`font-mono text-lg font-medium leading-none mt-0.5 min-w-[1.25rem] ${
                  i < 3 ? 'text-accent' : 'text-[#c5c0b8]'
                }`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink leading-snug line-clamp-2 mb-1">
                    {post.title}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    ❤️ {post.likeCount} · {timeAgo(post.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Platform Stats */}
      <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e2dfd8]">
          <BarChart2 size={15} className="text-accent" />
          <span className="text-xs font-bold uppercase tracking-wide text-ink">Platform Stats</span>
        </div>
        {loadingStats ? (
          <div className="grid grid-cols-2 divide-x divide-y divide-[#e2dfd8]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 space-y-1.5">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 divide-x divide-y divide-[#e2dfd8]">
            <StatCell num={stats.totalPosts} label="Stories" />
            <StatCell num={stats.totalUsers} label="Reporters" />
            <StatCell num={stats.totalLikes} label="Reactions" />
            <StatCell num={stats.totalComments} label="Comments" />
          </div>
        ) : null}
      </div>

      {/* Categories */}
      <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e2dfd8]">
          <Tag size={15} className="text-accent" />
          <span className="text-xs font-bold uppercase tracking-wide text-ink">Browse Topics</span>
        </div>
        <div className="p-3 flex flex-wrap gap-2">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${!activeCategory
                ? 'bg-ink text-white border-ink'
                : 'bg-paper-warm border-[#e2dfd8] text-ink-soft hover:bg-ink hover:text-white hover:border-ink'
              }`}
          >
            🌍 All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={`/?category=${cat.label}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${activeCategory === cat.label
                  ? 'bg-ink text-white border-ink'
                  : 'bg-paper-warm border-[#e2dfd8] text-ink-soft hover:bg-ink hover:text-white hover:border-ink'
                }`}
            >
              {cat.emoji} {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* About card */}
      <div className="bg-paper-warm border border-[#e2dfd8] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={15} className="text-accent" />
          <span className="text-xs font-bold uppercase tracking-wide">About PulseNews</span>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">
          PulseNews is a citizen journalism platform where anyone can submit real-time news from their community.
          All content is reviewed by our moderation team before publication.
        </p>
      </div>
    </aside>
  );
}

function StatCell({ num, label }: { num: number; label: string }) {
  return (
    <div className="p-4">
      <div className="font-display text-2xl font-bold leading-none text-ink">{formatCount(num)}</div>
      <div className="text-[10px] text-ink-muted uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}
