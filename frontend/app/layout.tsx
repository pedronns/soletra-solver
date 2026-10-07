
import './globals.css'

import type { Metadata } from 'next'

import { siteUrl } from '@/lib/site-config'

const siteName = 'Soletra Solver'

const siteDescription =
  'Encontre palavras possíveis usando as sete letras selecionadas e a letra obrigatória.'

export const metadata: Metadata = {
  ...(siteUrl
    ? {
        metadataBase: siteUrl,
        alternates: {
          canonical: siteUrl,
        },
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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='pt-BR'>
      <body>{children}</body>
    </html>
  )
}