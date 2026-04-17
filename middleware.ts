/**
 * Aperçus de liens (Instagram, WhatsApp, etc.) : les crawlers n'exécutent pas le JS de la SPA.
 * On sert le même index.html avec des meta OG remplacées pour /book/:slug et /studio/:slug,
 * en s’appuyant sur get_studio_public_by_slug + inkflow_vitrine_data (cover, avatar, texte vitrine).
 */
import { next } from '@vercel/functions';
import { isTemplateStockImageUrl, LEGACY_VITRINE_NAME } from './lib/vitrineTemplateGuards';

const DEFAULT_OG_IMAGE = 'https://ink-flow.me/og-image.png';

/** User-agents connus pour les prévisualisations de liens (Meta, X, Slack, etc.) */
const SOCIAL_BOT_UA =
  /facebookexternalhit|Facebot|Instagram|Twitterbot|LinkedInBot|WhatsApp|Slack|TelegramBot|Discordbot|Pinterest|redditbot|vkShare|Embedly|Quora Link Preview|Slackbot|Discord|Google-Structured-Data-TestingTool|TikTok/i;

export const config = {
  matcher: ['/book/:path*', '/studio/:path*'],
};

type StudioPublicRow = {
  id: string;
  name?: string;
  studio_name?: string;
  avatar_url?: string | null;
  portfolio_cover_url?: string | null;
};

/** Champs utiles du JSON vitrine (aligné sur getVitrineDataBySlugFromSupabase). */
type VitrineOgJson = {
  name?: string;
  tagline?: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  portfolio?: Array<{ url?: string }>;
};

function getSupabaseRestConfig(): { base: string; key: string } | null {
  const base = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');
  const key = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  )
    .trim()
    .replace(/^['"]|['"]$/g, '');
  if (!base || !key) return null;
  return { base, key };
}

function normalizeSlug(s: string): string {
  return (s || '').trim().toLowerCase();
}

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function absolutizeImage(url: string | null | undefined, origin: string, fallback: string): string {
  const u = (url || '').trim();
  if (!u) return fallback;
  if (/^https?:\/\//i.test(u)) return u;
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${origin.replace(/\/$/, '')}${path}`;
}

function patchHtmlMeta(
  html: string,
  opts: {
    title: string;
    description: string;
    canonical: string;
    ogImage: string;
    ogImageAlt: string;
  }
): string {
  let out = html;
  /** Tolère `/>` ou `>` et espaces variables (build / minify). */
  const metaAttr = (property: string, value: string) =>
    `<meta property="${property}" content="${escAttr(value)}" />`;
  const nameAttr = (name: string, value: string) =>
    `<meta name="${name}" content="${escAttr(value)}" />`;

  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    metaAttr('og:title', opts.title)
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    metaAttr('og:description', opts.description)
  );
  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    metaAttr('og:url', opts.canonical)
  );
  out = out.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/,
    metaAttr('og:image', opts.ogImage)
  );
  out = out.replace(
    /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/,
    metaAttr('og:image:alt', opts.ogImageAlt)
  );
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    nameAttr('twitter:title', opts.title)
  );
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    nameAttr('twitter:description', opts.description)
  );
  out = out.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/,
    nameAttr('twitter:image', opts.ogImage)
  );
  out = out.replace(
    /<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/?>/,
    nameAttr('twitter:image:alt', opts.ogImageAlt)
  );
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    nameAttr('description', opts.description)
  );
  out = out.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${escAttr(opts.canonical)}" />`
  );
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escAttr(opts.title)}</title>`);
  return out;
}

async function fetchStudioRow(
  slug: string,
  cfg: { base: string; key: string } | null
): Promise<StudioPublicRow | null> {
  if (!cfg) return null;

  try {
    const res = await fetch(`${cfg.base}/rest/v1/rpc/get_studio_public_by_slug`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
      },
      body: JSON.stringify({ p_slug: normalizeSlug(slug) }),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== 'object' || !('id' in row)) return null;
    return row as StudioPublicRow;
  } catch {
    return null;
  }
}

async function fetchVitrineOgJson(
  studioId: string,
  cfg: { base: string; key: string }
): Promise<VitrineOgJson | null> {
  try {
    const res = await fetch(
      `${cfg.base}/rest/v1/inkflow_vitrine_data?studio_id=eq.${encodeURIComponent(studioId)}&select=data`,
      {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows: unknown = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const row = rows[0] as { data?: unknown };
    if (!row?.data || typeof row.data !== 'object') return null;
    return row.data as VitrineOgJson;
  } catch {
    return null;
  }
}

function firstPortfolioUrl(v: VitrineOgJson | null): string {
  const list = v?.portfolio;
  if (!Array.isArray(list)) return '';
  for (const p of list) {
    const u = p && typeof p === 'object' && 'url' in p ? String((p as { url?: string }).url || '').trim() : '';
    if (u && !isTemplateStockImageUrl(u)) return u;
  }
  return '';
}

function resolveOgImage(
  vitrine: VitrineOgJson | null,
  studio: StudioPublicRow | null,
  origin: string,
  fallback: string
): string {
  const pick = (...candidates: string[]) => {
    for (const c of candidates) {
      const t = (c || '').trim();
      if (t && !isTemplateStockImageUrl(t)) return t;
    }
    return '';
  };

  const coverFromVitrine = (vitrine?.coverImage || '').trim();
  const rowCover = (studio?.portfolio_cover_url || '').trim();
  const rowAvatar = (studio?.avatar_url || '').trim();
  const avatarFromVitrine = (vitrine?.avatar || '').trim();
  const firstP = firstPortfolioUrl(vitrine);

  const raw = pick(
    coverFromVitrine,
    rowCover,
    rowAvatar,
    firstP,
    avatarFromVitrine
  );
  return absolutizeImage(raw, origin, fallback);
}

function resolveDisplayName(
  vitrine: VitrineOgJson | null,
  studio: StudioPublicRow | null,
  slug: string
): string {
  const fromVitrine = (vitrine?.name || '').trim();
  const fromRow = (studio?.studio_name || studio?.name || '').trim();
  if (fromVitrine && fromVitrine !== LEGACY_VITRINE_NAME) return fromVitrine;
  if (fromRow) return fromRow;
  if (fromVitrine) return fromVitrine;
  return slug;
}

function resolveOgDescription(
  vitrine: VitrineOgJson | null,
  displayName: string,
  isBook: boolean
): string {
  const desc = (vitrine?.description || '').trim();
  const tag = (vitrine?.tagline || '').trim();
  const text = desc || tag;
  if (text) return text.length > 300 ? `${text.slice(0, 297)}…` : text;
  return isBook
    ? `Prenez rendez-vous et réglez l'acompte en ligne chez ${displayName}.`
    : `Vitrine et réservation en ligne — ${displayName}.`;
}

export default async function middleware(request: Request): Promise<Response> {
  const ua = request.headers.get('user-agent') || '';
  if (!SOCIAL_BOT_UA.test(ua)) {
    return next();
  }

  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const seg0 = parts[0];
  const slug = parts[1];
  if (!slug || (seg0 !== 'book' && seg0 !== 'studio')) {
    return next();
  }

  const cfg = getSupabaseRestConfig();
  const studio = await fetchStudioRow(slug, cfg);
  const vitrine =
    studio?.id && cfg ? await fetchVitrineOgJson(studio.id, cfg) : null;

  const origin = url.origin;
  const canonical = `${origin}${url.pathname}${url.search}`;

  const displayName = resolveDisplayName(vitrine, studio, slug);
  const isBook = seg0 === 'book';
  const title = isBook
    ? `Réserver chez ${displayName} | InkFlow`
    : `${displayName} | InkFlow`;
  const description = resolveOgDescription(vitrine, displayName, isBook);

  const ogImage = resolveOgImage(vitrine, studio, origin, DEFAULT_OG_IMAGE);
  const ogImageAlt = isBook ? `Réservation tatouage — ${displayName}` : displayName;

  const indexUrl = new URL('/index.html', origin);
  let indexRes: Response;
  try {
    indexRes = await fetch(indexUrl.toString(), {
      headers: { 'User-Agent': ua },
    });
  } catch {
    return next();
  }
  if (!indexRes.ok) {
    return next();
  }

  let htmlBody: string;
  try {
    htmlBody = await indexRes.text();
  } catch {
    return next();
  }

  const html = patchHtmlMeta(htmlBody, {
    title,
    description,
    canonical,
    ogImage,
    ogImageAlt,
  });

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
