import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
  /** En dev, pas de Service Worker — évite splash / app bloqués par un cache PWA obsolète. */
  const pwaDisabled = mode === 'development' || process.env.DISABLE_PWA === '1';
    // En worktree, le .env.local est dans le repo principal (inkdlow)
    const envDir = process.cwd().includes('mystifying-burnell')
      ? 'C:/Users/lanie/OneDrive/.limpc/Bureau/inkdlow'
      : '.';
    const env = loadEnv(mode, envDir, '');
    const sentryAuthToken = env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN;
    return {
      envDir,
      server: {
        port: 3000,
        host: '0.0.0.0',
        fs: {
          strict: false,
        },
      },
      plugins: [
        react(),
        tailwindcss(),
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
        VitePWA({
          disable: pwaDisabled,
          strategies: 'injectManifest',
          srcDir: 'public',
          filename: 'sw.js',
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png', 'icon-ios-1024.png', 'images/mockup-profil.webp'],
          manifest: {
            name: 'InkFlow - Assistant Tatoueur',
            short_name: 'InkFlow',
            description: 'La plateforme tout-en-un pour tatoueurs. Réservations, paiements, galerie Flash, CRM, messagerie, IA.',
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
            icons: [
              { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
              { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
              { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
              { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
            ]
          },
          injectManifest: {
            globPatterns: ['**/*.{js,html,ico,png,svg,woff2}'],
            globIgnores: ['**/node_modules/**', '**/sw.js', '**/workbox-*.js', '**/*.map', '**/*.css', '**/index.html'],
            maximumFileSizeToCacheInBytes: 3 * 1024 * 1024 // 3 MB (images landing > 2 MB)
          }
        })
      ],
      define: {},
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          tslib: path.resolve(__dirname, 'node_modules/tslib/tslib.es6.mjs'),
        }
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
              if (id.includes('framer-motion') || id.includes('motion-dom')) return 'vendor-framer-motion';
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
      }
    };
});
