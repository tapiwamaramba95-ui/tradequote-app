import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/api/',
        '/auth/callback',
        '/_next/',
        '/admin/'
      ],
    },
    sitemap: 'https://tradequote.au/sitemap.xml',
  }
}