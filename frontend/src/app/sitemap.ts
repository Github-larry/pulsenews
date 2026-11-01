// src/app/sitemap.ts — Dynamic XML sitemap for SEO
// Next.js 14 generates /sitemap.xml automatically from this file
import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsenews.vercel.app';
const API_URL  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:5000/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes — always included
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic post routes — fetch from API
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(
      `${API_URL}/posts?limit=200&sort=latest`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (res.ok) {
      const data = await res.json() as {
        success: boolean;
        data: Array<{ id: string; updatedAt: string; category: string }>;
      };

      if (data.success && Array.isArray(data.data)) {
        postRoutes = data.data.map((post) => ({
          url: `${BASE_URL}/news/${post.id}`,
          lastModified: new Date(post.updatedAt),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
      }
    }
  } catch {
    // Silently fail — sitemap still works with static routes
    console.warn('Sitemap: Could not fetch posts from API');
  }

  // Category pages
  const categories = [
    'Politics', 'Business', 'Technology', 'Health',
    'Sports', 'Culture', 'Environment', 'Crime',
  ];
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/?category=${cat}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...postRoutes];
}
