// src/app/news/[id]/opengraph-image.tsx — Per-post OG image
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Post {
  title: string;
  description: string;
  category: string;
  author: { name: string };
  location?: string;
}

export default async function PostOgImage({
  params,
}: {
  params: { id: string };
}) {
  let post: Post | null = null;

  try {
    const res = await fetch(`${API_URL}/posts/${params.id}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json() as { success: boolean; data: Post };
      if (data.success) post = data.data;
    }
  } catch {
    // Fallback to default image
  }

  const title = post?.title ?? 'Breaking News — PulseNews';
  const category = post?.category ?? 'News';
  const author = post?.author?.name ?? 'PulseNews Reporter';
  const location = post?.location ?? '';

  const categoryColors: Record<string, string> = {
    Politics: '#c8392b', Business: '#267a4d', Technology: '#1a6bcc',
    Health: '#267a4d', Sports: '#1a6bcc', Culture: '#d4a853',
    Environment: '#267a4d', Crime: '#c8392b', News: '#c8392b',
  };
  const catColor = categoryColors[category] ?? '#c8392b';

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f0f0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 72px',
          position: 'relative',
        }}
      >
        {/* Background texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Top: Logo + Category */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px', height: '44px', background: '#c8392b',
                borderRadius: '8px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'white', fontSize: '22px', fontWeight: '900',
              }}
            >
              P
            </div>
            <span style={{ color: 'white', fontSize: '22px', fontWeight: '700' }}>PulseNews</span>
          </div>

          {/* Category badge */}
          <div
            style={{
              background: catColor, color: 'white', padding: '8px 20px',
              borderRadius: '4px', fontSize: '14px', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '1.5px',
            }}
          >
            {category}
          </div>
        </div>

        {/* Center: Title */}
        <div
          style={{
            fontSize: title.length > 80 ? '42px' : '54px',
            fontWeight: '800',
            color: 'white',
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            maxWidth: '1050px',
          }}
        >
          {title}
        </div>

        {/* Bottom: Author + Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: '#c8392b', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: '700',
            }}
          >
            {author[0]}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', fontWeight: '600' }}>
            {author}
          </span>
          {location && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px' }}>·</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '18px' }}>
                📍 {location}
              </span>
            </>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
