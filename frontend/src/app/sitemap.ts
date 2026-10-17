import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dzprimeacademy.live';

  const publicRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/bot', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/dawarat', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/exams', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/card', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/leaderboard', priority: 0.7, changeFrequency: 'daily' as const },
    { path: '/community', priority: 0.7, changeFrequency: 'daily' as const },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // The bare root only redirects to a locale, so it is not listed.
  // Localized entries for Arabic and French
  for (const route of publicRoutes) {
    for (const locale of ['ar', 'fr']) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: {
            ar: `${baseUrl}/ar${route.path}`,
            fr: `${baseUrl}/fr${route.path}`,
            'x-default': `${baseUrl}/ar${route.path}`,
          },
        },
      });
    }
  }

  return sitemapEntries;
}
