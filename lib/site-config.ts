const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

function getPublicSiteUrl(value: string | undefined): URL | undefined {
  if (!value) return undefined;

  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  const isLocalAddress =
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local');

  if (!['http:', 'https:'].includes(url.protocol) || isLocalAddress) {
    return undefined;
  }

  return new URL(url.origin);
}

export const siteUrl = getPublicSiteUrl(configuredSiteUrl);