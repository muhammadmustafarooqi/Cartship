import { MetadataRoute } from 'next';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cartship.pk').replace(/\/$/, '');

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    await connectDB();
    const products = await Product.find({ isActive: true })
      .select('slug updatedAt')
      .lean();

    if (products && products.length > 0) {
      productEntries = products.map((product: any) => ({
        url: `${SITE_URL}/products/${product.slug}`,
        lastModified: new Date(product.updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error('Sitemap generation failed to fetch products from DB:', error);
  }

  // Core static & essential legal/policy routes required for Google Merchant Center
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/pages/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/pages/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/pages/return-refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/pages/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/pages/contact-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/pages/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  return [...staticRoutes, ...productEntries];
}
