import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Manrope, Kameron, Barlow } from 'next/font/google';
import '@/styles/globals.css';
import { APP_CONFIG } from '@/constants/config';
import { MobilePanelProvider, CompanyProvider } from '@/contexts';
import { ErrorBoundary } from '@/components/error-boundary';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const kameron = Kameron({
  subsets: ['latin'],
  variable: '--font-kameron',
  display: 'swap',
  weight: '400',
});

const barlow = Barlow({
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: 'Professional fleet management solution for tracking vehicles, drivers, trips, and maintenance.',
  keywords: ['fleet management', 'vehicle tracking', 'driver management', 'maintenance'],
  icons: {
    icon: '/logos/mono-logo.svg',
    apple: '/logos/mono-logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${kameron.variable} ${barlow.variable}`}>
      <body className="min-h-screen bg-white font-sans antialiased flex flex-col">
        <Providers>
          <CompanyProvider>
            <MobilePanelProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </MobilePanelProvider>
          </CompanyProvider>
        </Providers>
      </body>
    </html>
  );
}
