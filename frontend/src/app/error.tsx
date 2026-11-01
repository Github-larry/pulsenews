'use client';
// src/app/error.tsx — Global error boundary (must be client component)
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking service in production (e.g. Sentry)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20
      text-center bg-paper">
      <div className="text-6xl mb-5">⚠️</div>
      <h2 className="font-display text-3xl font-bold text-ink mb-3">
        Something went wrong
      </h2>
      <p className="text-ink-muted text-lg max-w-md mb-8 leading-relaxed">
        An unexpected error occurred. Our team has been notified.
        {error.digest && (
          <span className="block mt-2 font-mono text-xs text-ink-muted">
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={reset} className="btn btn-primary btn-lg">
          Try Again
        </button>
        <a href="/" className="btn btn-ghost btn-lg">
          Go Home
        </a>
      </div>
    </div>
  );
}
