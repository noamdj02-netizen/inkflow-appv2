import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { visualizer } from 'rollup-plugin-visualizer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PWA_ICON_SIZES = [48, 72, 96, 128, 144, 152, 192, 384, 512] as const;
const pwaWebManifestIcons = [
  ...PWA_ICON_SIZES.map((s) => ({
    src: `/pwa-${s}x${s}.png` as const,
    sizes: `${s}x${s}` as const,
    type: 'image/png' as const,
  })),
  {
    src: '/maskable-icon-512x512.png' as const,
    sizes: '512x512' as const,
    type: 'image/png' as const,
    purpose: 'maskable' as const,
  },
];

function injectPwaAppleSplashHead(): Plugin {
  return {
    name: 'inject-pwa-apple-splash-head',
    transformIndexHtml(html) {
      const fp = path.join(__dirname, 'pwa-apple-splash-head.html');
      if (!fs.existsSync(fp)) return html;
      const frag = fs.readFileSync(fp, 'utf-8').trim();
      if (!frag) return html;
      return html.replace('</head>', `${frag}\n</head>`);
    },
  };
}

export default defineConfig(({ mode }) => {
  /** En dev, pas de Service Worker — évite splash / app bloqués par un cache PWA obsolète. */
  const pwaDisabled = mode === 'development' || process.env.DISABLE_PWA === '1';
  // En worktree, le .env.local est dans le repo principal (inkdlow)
  const envDir = process.cwd().includes('mystifying-burnell')
    ? 'C:/Users/lanie/OneDrive/.limpc/Bureau/inkdlow'
    : '.';
  const env = loadEnv(mode, envDir, '');
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN;
  const bundleAnalyze = process.env.ANALYZE === '1';
  return {
    envDir,
    server: {
      port: 3000,
      host: '0.0.0.0',
      fs: {
        strict: false,
      },
      /**
       * Pré-transforme les entrées lazy volumineuses au démarrage du serveur dev.
       * Réduit les échecs sporadiques « Failed to fetch dynamically imported module »
       * lors de la première navigation (ex. `/studio/:slug` → PublicStudioPagePro).
       */
      warmup: {
        clientFiles: [
          './App.tsx',
          './pages/public/PublicStudioPagePro.tsx',
          './pages/public/PublicBookingPage.tsx',
          './pages/public/PublicBookingRecapPage.tsx',
          './pages/public/ClientAccountHubPage.tsx',
        ],
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      injectPwaAppleSplashHead(),
      ...(sentryAuthToken
        ? [
            sentryVitePlugin({
              org: env.SENTRY_ORG || process.env.SENTRY_ORG,
              project: env.SENTRY_PROJECT || process.env.SENTRY_PROJECT,
              authToken: sentryAuthToken,
              sourcemaps: { assets: './dist/**' },
            }),
          ]
        : []),
      ...(bundleAnalyze
        ? [
            visualizer({
              filename: 'dist/stats.html',
              gzipSize: true,
              brotliSize: true,
              open: process.env.CI ? false : true,
              template: 'treemap',
            }),
          ]
        : []),
      VitePWA({
        disable: pwaDisabled,
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'sw.js',
        registerType: 'prompt',
        /** Pas de apple-splash dans precache (fichiers lourds + iOS les prend via <link> au besoin). */
        includeAssets: [
          'favicon.ico',
          'icon.svg',
          'offline.html',
          'apple-touch-icon-180x180.png',
          'icon-ios-1024.png',
          'images/mockup-profil.webp',
          'pwa-*.png',
          'maskable-*.png',
        ],
        manifest: {
          name: 'InkFlow - Assistant Tatoueur',
          short_name: 'InkFlow',
          description:
            'La plateforme tout-en-un pour tatoueurs. Réservations, paiements, galerie Flash, CRM, messagerie, IA.',
          theme_color: '#0a0a0a',
          background_color: '#0a0a0a',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui', 'browser'],
          orientation: 'portrait',
          scope: '/',
          start_url: '/dashboard',
          id: '/dashboard',
          categories: ['business', 'productivity'],
          lang: 'fr-FR',
          dir: 'ltr',
          icons: pwaWebManifestIcons,
        },
        injectManifest: {
          globPatterns: ['**/*.{js,html,ico,png,svg,woff2}'],
          globIgnores: [
            '**/node_modules/**',
            '**/sw.js',
            '**/workbox-*.js',
            '**/*.map',
            '**/*.css',
            '**/index.html',
            '**/apple-splash-*.png',
          ],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB (images landing > 2 MB)
        },
      }),
    ],
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        tslib: path.resolve(__dirname, 'node_modules/tslib/tslib.es6.mjs'),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      sourcemap: !!sentryAuthToken,
      target: 'es2020',
      // Lazy routes + manualChunks : index (~730k) et DashboardPro (~740k) restent volumineux mais attendus.
      chunkSizeWarningLimit: 800,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('html2canvas')) return 'vendor-html2canvas';
            if (id.includes('framer-motion') || id.includes('motion-dom'))
              return 'vendor-framer-motion';
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-leaflet';
            if (id.includes('react-joyride')) return 'vendor-joyride';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            return undefined;
          },
        },
      },
    },
    optimizeDeps: {
      include: ['tslib', '@supabase/supabase-js', 'motion-dom', 'framer-motion', 'leaflet'],
    },
  };
});
