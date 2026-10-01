import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  return siteUrl ? [{ url: siteUrl.href }] : [];
}