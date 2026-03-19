import type { Metadata, Viewport } from 'next';

// ─── PWA Viewport ────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: '#0d0d0d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // safe-area-inset support iOS
};

// ─── Metadata ────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'InkFlow — Gestion de studio tattoo',
  description: "L'app tout-en-un pour tatoueurs : clients, agenda, réservations.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'InkFlow',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="overflow-x-hidden">
      {/*
        overflow-x: hidden + box-sizing appliqué globalement ici.
        Le même fix doit être injecté dans Framer via Custom Code (voir TACHE_1).
      */}
      <body
        style={{
          backgroundColor: '#0d0d0d',
          overflowX: 'hidden',
          maxWidth: '100vw',
        }}
      >
        {children}
      </body>
    </html>
  );
}
