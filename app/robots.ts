import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    ...(siteUrl ? { sitemap: new URL('/sitemap.xml', siteUrl).href } : {}),
  };
}