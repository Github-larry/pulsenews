// src/app/news/[id]/metadata.ts — generateMetadata for post pages
// This file is imported by the page to generate per-post SEO metadata
import type { Metadata } from 'next';

const API_URL  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:5000/api';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL  || 'https://pulsenews.vercel.app';

interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  location?: string;
  author: { name: string };
  createdAt: string;
}

export async function generatePostMetadata(id: string): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/posts/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return defaultMetadata();

    const data = await res.json() as { success: boolean; data: Post };
    if (!data.success) return defaultMetadata();

    const post = data.data;
    const excerpt = post.description.slice(0, 160).replace(/\n/g, ' ');
    const url = `${BASE_URL}/news/${post.id}`;

    return {
      title: post.title,
      description: excerpt,
      authors: [{ name: post.author.name }],
      openGraph: {
        type: 'article',
        title: post.title,
        description: excerpt,
        url,
        siteName: 'PulseNews',
        images: post.imageUrl
          ? [{ url: post.imageUrl, width: 1200, height: 675, alt: post.title }]
          : [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 }],
        publishedTime: post.createdAt,
        section: post.category,
        ...(post.location && { tags: [post.category, post.location] }),
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: excerpt,
        images: post.imageUrl ? [post.imageUrl] : undefined,
      },
      alternates: { canonical: url },
    };
  } catch {
    return defaultMetadata();
  }
}

function defaultMetadata(): Metadata {
  return {
    title: 'Story Not Found | PulseNews',
    description: 'This story could not be found on PulseNews.',
  };
}
