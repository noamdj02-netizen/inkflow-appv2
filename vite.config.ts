import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const sentryAuthToken = env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN;
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
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
          disable: process.env.DISABLE_PWA === '1',
          strategies: 'injectManifest',
          srcDir: 'public',
          filename: 'sw.js',
          registerType: 'prompt',
          includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png', 'icon-ios-1024.png', 'images/mockup-profil.webp'],
          manifest: {
            name: 'InkFlow - Assistant Tatoueur',
            short_name: 'InkFlow',
            description: 'La plateforme tout-en-un pour tatoueurs. Réservations, paiements, galerie Flash, CRM, messagerie, IA.',
            theme_color: '#6328d4',
            background_color: '#ddd6f7',
            display: 'standalone',
            display_override: ['standalone', 'fullscreen', 'minimal-ui', 'browser'],
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            id: '/',
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
        commonjsOptions: {
          transformMixedEsModules: true,
        },
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-charts': ['recharts'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-pdf': ['jspdf'],
              'vendor-framer-motion': ['framer-motion'],
            },
          },
        },
      },
      optimizeDeps: {
        include: ['tslib', '@supabase/supabase-js'],
      }
    };
});
