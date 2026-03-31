import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import LogProvider from '@/contexts/LogContext';

export const metadata: Metadata = {
  title: 'NextStripe',
  description: 'BJJ Training Tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NextStripe',
  },
  icons: {
    icon: '/icons/favicon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#007AFF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var theme = localStorage.getItem('theme');
            var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (theme === 'dark' || (!theme || theme === 'system') && prefersDark) {
              document.documentElement.classList.add('dark');
            }
          })();
        `}} />
      </head>
      <body>
        <AuthProvider>
          {/* LogProvider intercepts console.error, console.warn, and uncaught
              errors app-wide and writes them to Realtime Database for the debug page */}
          <LogProvider>
            <Navigation>{children}</Navigation>
          </LogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
