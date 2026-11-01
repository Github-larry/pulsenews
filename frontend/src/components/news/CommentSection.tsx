'use client';
// src/components/news/CommentSection.tsx
import { useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Comment } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { EmptyState } from '@/components/ui';

interface Props {
  comments: Comment[];
  onSubmit: (content: string) => Promise<boolean>;
  onAuthRequired: () => void;
}

export function CommentSection({ comments, onSubmit, onAuthRequired }: Props) {
  const { user, isAuthenticated } = useAuthStore();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const MAX = 1000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if (!isAuthenticated) { onAuthRequired(); return; }

    setSubmitting(true);
    const ok = await onSubmit(text.trim());
    if (ok) setText('');
    setSubmitting(false);
  }

  return (
    <section className="mt-8">
      <h3 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
        <MessageCircle size={20} />
        Comments ({comments.length})
      </h3>

      {/* Input box */}
      <div className="flex gap-3 mb-6">
        <div className="w-9 h-9 rounded-full bg-accent text-white text-sm font-semibold
          flex items-center justify-center shrink-0">
          {isAuthenticated && user ? getInitials(user.name) : '?'}
        </div>
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder={isAuthenticated ? 'Share your thoughts...' : 'Sign in to join the conversation'}
            disabled={!isAuthenticated}
            rows={3}
            className="w-full px-4 py-3 bg-paper-warm border border-[#e2dfd8] rounded-xl
              text-sm resize-none outline-none transition-all
              focus:border-accent focus:ring-2 focus:ring-accent/10 focus:bg-white
              disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-ink-muted"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-ink-muted">{text.length}/{MAX}</span>
            {isAuthenticated ? (
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="btn btn-primary btn-sm"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
                Post Comment
              </button>
            ) : (
              <button
                type="button"
                onClick={onAuthRequired}
                className="btn btn-ghost btn-sm"
              >
                Sign in to comment
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Comment list */}
      {comments.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No comments yet"
          description="Be the first to share your thoughts on this story."
        />
      ) : (
        <div className="space-y-0 divide-y divide-[#e2dfd8]">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 py-4">
              <div className="w-8 h-8 rounded-full bg-accent text-white text-xs font-semibold
                flex items-center justify-center shrink-0">
                {getInitials(comment.author.name)}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-semibold text-ink">{comment.author.name}</span>
                  <span className="text-xs text-ink-muted">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
