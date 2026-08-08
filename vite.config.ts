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

/**
 * `vite build # commentaire` peut passer `#` comme répertoire racine (→ index.tsx#/index.html).
 * On retire ces args avant que Vite ne les interprète.
 */
const hashArgIndex = process.argv.indexOf('#');
if (hashArgIndex !== -1) {
  process.argv.splice(hashArgIndex);
}

/** Vendor splitting — isoler les grosses libs sans créer de cycles React ↔ motion ↔ others. */
function inkflowManualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;

  // React + motion + radix : ne PAS isoler en chunks séparés — cycle vendor-react ↔ vendor-others ↔ vendor-motion
  // casse createContext en prod (page blanche). Rollup les garde dans le graphe principal / chunks cohérents.
  if (
    id.includes('/react-dom/') ||
    id.includes('/react/') ||
    id.includes('scheduler/') ||
    id.includes('use-sync-external-store') ||
    id.includes('framer-motion') ||
    id.includes('motion-dom') ||
    id.includes('radix-ui') ||
    id.includes('@radix-ui')
  ) {
    return undefined;
  }

  if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
  if (id.includes('@supabase')) return 'vendor-supabase';
  if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
  if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-leaflet';
  if (id.includes('react-joyride')) return 'vendor-joyride';
  if (id.includes('lucide-react')) return 'vendor-icons';
  if (id.includes('@sentry')) return 'vendor-sentry';
  if (id.includes('posthog-js')) return 'vendor-analytics';
  if (id.includes('antd-mobile')) return 'vendor-antd-mobile';
  if (id.includes('gsap')) return 'vendor-gsap';

  // Pas de catch-all vendor-others — provoquait un blob 1 Mo+ avec imports croisés vers motion/react.
  return undefined;
}

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
  const isProductionBuild = mode === 'production';
  return {
    /** Racine explicite — évite qu’un arg `#` (commentaire npm mal interprété) ne casse le build. */
    root: __dirname,
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
      // Rapport treemap uniquement avec ANALYZE=1 — évite stats.html dans le precache PWA.
      ...(isProductionBuild && bundleAnalyze
        ? [
            visualizer({
              filename: path.resolve(__dirname, 'dist/stats.html'),
              open: bundleAnalyze && !process.env.CI,
              gzipSize: true,
              brotliSize: true,
              template: 'treemap',
            }),
          ]
        : []),
      VitePWA({
        disable: pwaDisabled,
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'sw.js',
        registerType: 'autoUpdate',
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
            '**/stats.html',
            '**/apple-splash-*.png',
            '**/images/azzzzssss.png',
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
      // Lazy routes + manualChunks — voir dist/stats.html après chaque build prod.
      chunkSizeWarningLimit: 800,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks: inkflowManualChunks,
        },
      },
    },
    optimizeDeps: {
      include: ['tslib', '@supabase/supabase-js', 'motion-dom', 'framer-motion', 'leaflet'],
    },
  };
});
