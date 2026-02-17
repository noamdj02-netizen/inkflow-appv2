// ============================================
// ⚙️ NEXT.JS CONFIGURATION - InkFlow
// next.config.js
// ============================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================
  // 1. SECURITY HEADERS
  // ============================================
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          }
        ],
      },
    ];
  },

  // ============================================
  // 2. IMAGE OPTIMIZATION
  // ============================================
  images: {
    domains: [
      'ink-flow.me',
      'cdn.ink-flow.me',
      'storage.googleapis.com', // Si vous utilisez GCS
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ============================================
  // 3. COMPRESSION
  // ============================================
  compress: true,

  // ============================================
  // 4. REDIRECTS
  // ============================================
  async redirects() {
    return [
      // Force www ou non-www
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.ink-flow.me' }],
        destination: 'https://ink-flow.me/:path*',
        permanent: true,
      },
      // Anciennes URLs
      {
        source: '/old-page',
        destination: '/new-page',
        permanent: true,
      },
    ];
  },

  // ============================================
  // 5. REWRITES (optionnel)
  // ============================================
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
      {
        source: '/robots.txt',
        destination: '/api/robots',
      },
    ];
  },

  // ============================================
  // 6. ENVIRONMENT VARIABLES
  // ============================================
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // ============================================
  // 7. WEBPACK CONFIGURATION
  // ============================================
  webpack: (config, { isServer }) => {
    // Optimizations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // ============================================
  // 8. EXPERIMENTAL FEATURES
  // ============================================
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  // ============================================
  // 9. PRODUCTION OPTIMIZATIONS
  // ============================================
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false, // Remove X-Powered-By header
};

module.exports = nextConfig;


// ============================================
// 🗺️ SITEMAP DYNAMIQUE
// app/sitemap.ts (Next.js App Router)
// ============================================

import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ink-flow.me';

  // Pages statiques
  const staticPages = [
    '',
    '/a-propos',
    '/fonctionnalites',
    '/tarifs',
    '/contact',
    '/blog',
    '/connexion',
    '/inscription',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Pages dynamiques - Studios de tatoueurs
  // Récupérer depuis votre DB
  const studios = await fetchStudios(); // Votre fonction
  const studioPages = studios.map((studio) => ({
    url: `${baseUrl}/studio/${studio.slug}`,
    lastModified: new Date(studio.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Pages blog
  const posts = await fetchBlogPosts(); // Votre fonction
  const blogPages = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...studioPages, ...blogPages];
}

// Fonction helper (à adapter à votre DB)
async function fetchStudios() {
  // Exemple avec Prisma
  // const studios = await prisma.studio.findMany({
  //   where: { published: true },
  //   select: { slug: true, updatedAt: true }
  // });
  // return studios;
  return [];
}

async function fetchBlogPosts() {
  // return await prisma.post.findMany(...);
  return [];
}


// ============================================
// 🤖 ROBOTS.TXT DYNAMIQUE
// app/robots.ts (Next.js App Router)
// ============================================

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://ink-flow.me';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/studio/*',
          '/blog/*',
          '/a-propos',
          '/fonctionnalites',
          '/tarifs',
          '/contact',
        ],
        disallow: [
          '/dashboard/*',
          '/api/*',
          '/admin/*',
          '/mon-compte/*',
          '/*.json$',
          '/*?*', // Paramètres d'URL
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/admin/'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}


// ============================================
// 📄 EXEMPLE ROBOTS.TXT STATIQUE
// public/robots.txt (alternative)
// ============================================

/*
# ink-flow.me - Robots.txt

User-agent: *
Allow: /
Allow: /studio/
Allow: /blog/

Disallow: /dashboard/
Disallow: /api/
Disallow: /admin/
Disallow: /mon-compte/
Disallow: /*.json$
Disallow: /*?

# Googlebot
User-agent: Googlebot
Allow: /
Disallow: /dashboard/
Disallow: /admin/

# Images
User-agent: Googlebot-Image
Allow: /

# Sitemap
Sitemap: https://ink-flow.me/sitemap.xml

# Crawl-delay (optional)
Crawl-delay: 10
*/


// ============================================
// 🌐 MANIFEST.JSON (PWA)
// app/manifest.ts
// ============================================

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'InkFlow - Logiciel pour tatoueurs',
    short_name: 'InkFlow',
    description: 'Gérez vos rendez-vous et votre portfolio de tatouage',
    start_url: '/',
    display: 'standalone',
    background_color: '#18181b',
    theme_color: '#fb923c',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['business', 'productivity', 'utilities'],
    lang: 'fr-FR',
  };
}


// ============================================
// 📊 ANALYTICS & TRACKING
// components/Analytics.tsx
// ============================================

import Script from 'next/script';

export function Analytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  if (!GA_ID) return null;

  return (
    <>
      {/* Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
          });
        `}
      </Script>

      {/* Google Tag Manager (optionnel) */}
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-XXXXXXX');
        `}
      </Script>
    </>
  );
}


// ============================================
// 🍪 COOKIE CONSENT (RGPD)
// components/CookieConsent.tsx
// ============================================

'use client';

import { useState, useEffect } from 'react';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'all');
    setShowBanner(false);
    // Activer tous les cookies/tracking
    enableAnalytics();
  };

  const acceptNecessary = () => {
    localStorage.setItem('cookie-consent', 'necessary');
    setShowBanner(false);
    // Garder seulement cookies essentiels
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#1f1f23',
      padding: '1.5rem',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.3)',
      zIndex: 9999,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <p style={{ flex: 1, color: '#d4d4d8', fontSize: '0.875rem' }}>
          🍪 Nous utilisons des cookies pour améliorer votre expérience.
          En continuant, vous acceptez notre{' '}
          <a href="/politique-cookies" style={{ color: '#fb923c', textDecoration: 'underline' }}>
            politique de cookies
          </a>.
        </p>
        <button
          onClick={acceptNecessary}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid #d4d4d8',
            color: '#d4d4d8',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Nécessaires uniquement
        </button>
        <button
          onClick={acceptAll}
          style={{
            padding: '0.5rem 1.5rem',
            background: '#fb923c',
            border: 'none',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        >
          Accepter tout
        </button>
      </div>
    </div>
  );
}

function enableAnalytics() {
  // Activer Google Analytics, etc.
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
  }
}


// ============================================
// 📝 FICHIER .ENV.EXAMPLE
// .env.example
// ============================================

/*
# Database
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="générer-avec-openssl-rand-base64-32"
NEXTAUTH_SECRET="autre-secret-généré"
NEXTAUTH_URL="https://ink-flow.me"

# APIs externes
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASSWORD="..."

# Storage (Cloudinary, AWS S3, etc.)
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# App
NEXT_PUBLIC_APP_URL="https://ink-flow.me"
NODE_ENV="production"
*/


// ============================================
// ✅ CHECKLIST DÉPLOIEMENT
// ============================================

/*
SEO :
□ Meta tags sur toutes les pages
□ Sitemap.xml généré et soumis à Google
□ Robots.txt configuré
□ Schema.org sur pages clés
□ Images optimisées (WebP/AVIF)
□ Core Web Vitals < seuils Google
□ Google Search Console configuré
□ Google Analytics installé

Sécurité :
□ HTTPS activé (certificat SSL)
□ Security headers configurés
□ Rate limiting sur API
□ Input validation partout
□ CSRF protection
□ JWT_SECRET en production (fort)
□ npm audit sans vulnérabilités
□ Backups automatiques DB
□ Logs de sécurité activés
□ RGPD : politique cookies + privacy

Performance :
□ Lighthouse Score > 90
□ Code splitting activé
□ Images lazy loading
□ Fonts optimisés
□ CDN configuré
□ Cache headers
□ Compression gzip/brotli

Tests :
□ Lighthouse audit
□ PageSpeed Insights
□ SecurityHeaders.com
□ SSL Labs test
□ npm audit
*/
