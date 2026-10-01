import './globals.css';
import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site-config';

const siteName = 'Soletra Solver';
const siteDescription =
  'Encontre palavras possíveis usando as sete letras selecionadas e a letra obrigatória.';

export const metadata: Metadata = {
  ...(siteUrl
    ? {
        metadataBase: siteUrl,
        alternates: { canonical: siteUrl },
      }
    : {}),
  title: siteName,
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    title: siteName,
    description: siteDescription,
    type: 'website',
    locale: 'pt_BR',
    ...(siteUrl ? { url: siteUrl.href } : {}),
  },
  twitter: {
    card: 'summary',
    title: siteName,
    description: siteDescription,
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
