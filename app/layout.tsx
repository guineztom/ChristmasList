import type {Metadata, Viewport} from 'next';
import {Outfit, Plus_Jakarta_Sans} from 'next/font/google';
import {ErrorBoundary} from '@/components/error-boundary';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#EC4899',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'ChristmasList — Cadeaux & Budgets',
  description:
    'Organisez vos cadeaux de Noël par personne, suivez vos budgets et partagez votre liste par lien.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ChristmasList',
  },
  icons: {
    apple: '/apple-touch-icon.png',
    icon: '/pwa-192x192.png',
  },
  openGraph: {
    title: 'ChristmasList — Cadeaux & Budgets',
    description:
      'Organisez vos cadeaux de Noël par personne, suivez vos budgets et partagez votre liste par lien.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChristmasList — Cadeaux & Budgets',
    description:
      'Organisez vos cadeaux de Noël par personne, suivez vos budgets et partagez votre liste par lien.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="fr" className={`${outfit.variable} ${plusJakarta.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-gradient-to-br from-[#FFF5F9] via-[#FDFBFF] to-[#F3EFFE] text-neutral-900 font-sans antialiased selection:bg-[#EC4899]/20 selection:text-[#BE185D] overflow-x-hidden"
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
