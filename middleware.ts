/**
 * Aperçus de liens (Instagram, WhatsApp, etc.) : les crawlers n'exécutent pas le JS de la SPA.
 * On sert le même index.html avec des meta OG remplacées pour /book/:slug et /studio/:slug,
 * en s’appuyant sur la RPC publique get_studio_public_by_slug (couverture + avatar studio).
 */
import { next } from '@vercel/functions';

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
  out = out.replace(
    /<meta property="og:title" content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${escAttr(opts.title)}" />`
  );
  out = out.replace(
    /<meta property="og:description" content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${escAttr(opts.description)}" />`
  );
  out = out.replace(
    /<meta property="og:url" content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${escAttr(opts.canonical)}" />`
  );
  out = out.replace(
    /<meta property="og:image" content="[^"]*"\s*\/>/,
    `<meta property="og:image" content="${escAttr(opts.ogImage)}" />`
  );
  out = out.replace(
    /<meta property="og:image:alt" content="[^"]*"\s*\/>/,
    `<meta property="og:image:alt" content="${escAttr(opts.ogImageAlt)}" />`
  );
  out = out.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${escAttr(opts.title)}" />`
  );
  out = out.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${escAttr(opts.description)}" />`
  );
  out = out.replace(
    /<meta name="twitter:image" content="[^"]*"\s*\/>/,
    `<meta name="twitter:image" content="${escAttr(opts.ogImage)}" />`
  );
  out = out.replace(
    /<meta name="twitter:image:alt" content="[^"]*"\s*\/>/,
    `<meta name="twitter:image:alt" content="${escAttr(opts.ogImageAlt)}" />`
  );
  out = out.replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escAttr(opts.description)}" />`
  );
  out = out.replace(
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${escAttr(opts.canonical)}" />`
  );
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escAttr(opts.title)}</title>`);
  return out;
}

async function fetchStudioRow(slug: string): Promise<StudioPublicRow | null> {
  const base = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !key) return null;

  const res = await fetch(`${base}/rest/v1/rpc/get_studio_public_by_slug`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ p_slug: normalizeSlug(slug) }),
  });
  if (!res.ok) return null;
  const data: unknown = await res.json();
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object' || !('id' in row)) return null;
  return row as StudioPublicRow;
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

  const studio = await fetchStudioRow(slug);
  const origin = url.origin;
  const canonical = `${origin}${url.pathname}${url.search}`;

  const displayName = (studio?.studio_name || studio?.name || slug).trim();
  const isBook = seg0 === 'book';
  const title = isBook
    ? `Réserver chez ${displayName} | InkFlow`
    : `${displayName} | InkFlow`;
  const description = isBook
    ? `Prenez rendez-vous et réglez l'acompte en ligne chez ${displayName}.`
    : `Vitrine et réservation en ligne — ${displayName}.`;

  const ogImage = absolutizeImage(
    studio?.portfolio_cover_url || studio?.avatar_url,
    origin,
    DEFAULT_OG_IMAGE
  );
  const ogImageAlt = isBook ? `Réservation tatouage — ${displayName}` : displayName;

  const indexUrl = new URL('/index.html', origin);
  const indexRes = await fetch(indexUrl.toString(), {
    headers: { 'User-Agent': ua },
  });
  if (!indexRes.ok) {
    return next();
  }

  const html = patchHtmlMeta(await indexRes.text(), {
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
