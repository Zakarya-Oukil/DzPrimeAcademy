import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dzprimeacademy.live';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // `/ambassador` is the private dashboard; `/ambassadors` is the public list, so the
      // dashboard is blocked with `$` and a trailing slash instead of a bare prefix.
      disallow: [
        '/api/',
        '/*/admin',
        '/*/student',
        '/*/teacher',
        '/*/ambassador$',
        '/*/ambassador/',
        '/*/profile',
        '/*/verify',
        '/*/activate',
        '/*/reset-password',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
