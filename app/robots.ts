import { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cartship.pk').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/auth/', '/cart', '/checkout', '/order-success'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
