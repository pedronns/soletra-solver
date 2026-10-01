import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Soletra Solver',
  description: 'Encontre palavras possíveis com as letras do dia.',
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
