/**
 * Génère sitemap.xml pour le SEO (Vite/React SPA).
 * À exécuter avant le build : node scripts/generate-sitemap.mjs
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-sitemap.mjs
 * ou:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/generate-sitemap.mjs
 *
 * Les slugs des studios sont récupérés depuis Supabase (table inkflow_studios).
 * Si Supabase n'est pas configuré, le sitemap contient uniquement l'URL de base.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const SITE_URL = 'https://ink-flow.me';

// Charger .env.local (Node 18+ : --env-file=.env.local peut être utilisé à la place)
const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

/** Récupère tous les slugs des studios publics depuis Supabase */
async function fetchStudioSlugs() {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.length < 10) {
    console.log('[sitemap] Supabase non configuré, sitemap avec URL de base uniquement.');
    return [];
  }
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('inkflow_studios')
      .select('slug')
      .not('slug', 'is', null);
    if (error) {
      console.warn('[sitemap] Erreur Supabase:', error.message);
      return [];
    }
    const slugs = (data || []).map((r) => r.slug).filter(Boolean);
    console.log(`[sitemap] ${slugs.length} studio(s) trouvé(s) dans Supabase.`);
    return slugs;
  } catch (err) {
    console.warn('[sitemap] Erreur:', err.message);
    return [];
  }
}

/** @typedef {{ path: string; priority?: string; changefreq?: string }} SitemapEntry */

/** Génère le XML du sitemap */
function buildSitemapXml(entries) {
  const lastmod = new Date().toISOString().split('T')[0];
  const urlEntries = entries
    .map((entry) => {
      const path = typeof entry === 'string' ? entry : entry.path;
      const priority = typeof entry === 'string' ? (path === '/' ? '1.0' : '0.8') : entry.priority ?? '0.75';
      const changefreq = typeof entry === 'string' ? 'weekly' : entry.changefreq ?? 'monthly';
      return `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

async function main() {
  /** Pages marketing & conversion (alignées routes App.tsx) */
  const staticEntries = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/login', priority: '0.7', changefreq: 'monthly' },
    { path: '/signup', priority: '0.9', changefreq: 'monthly' },
    { path: '/demo', priority: '0.8', changefreq: 'weekly' },
    { path: '/dashboard-demo', priority: '0.75', changefreq: 'weekly' },
    { path: '/politique-confidentialite', priority: '0.5', changefreq: 'yearly' },
    { path: '/conditions-utilisation', priority: '0.5', changefreq: 'yearly' },
    { path: '/aide', priority: '0.65', changefreq: 'monthly' },
    ...[
      'vue-ensemble',
      'demandes',
      'rendez-vous',
      'galerie-flash',
      'clients',
      'messagerie',
      'portfolio',
      'finance',
      'parametres',
    ].map((slug) => ({
      path: `/${slug}`,
      priority: '0.75',
      changefreq: 'monthly',
    })),
  ];

  const studioSlugs = await fetchStudioSlugs();
  const studioUrls = studioSlugs.map((slug) => ({
    path: `/studio/${slug}`,
    priority: '0.85',
    changefreq: 'weekly',
  }));
  const bookUrls = studioSlugs.map((slug) => ({
    path: `/book/${slug}`,
    priority: '0.85',
    changefreq: 'weekly',
  }));

  const allPaths = [...staticEntries, ...studioUrls, ...bookUrls];
  const xml = buildSitemapXml(allPaths);

  const outDir = resolve(process.cwd(), 'public');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, 'sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');
  console.log(`[sitemap] Écrit: ${outPath} (${allPaths.length} URLs)`);
}

main().catch((err) => {
  console.error('[sitemap] Erreur fatale:', err);
  process.exit(1);
});
