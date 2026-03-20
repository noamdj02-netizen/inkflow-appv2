/**
 * CORS headers pour les Edge Functions Supabase.
 * En production : ink-flow.me, inkflow.me et Vercel.
 * En développement local, localhost est également autorisé.
 */

const ALLOWED_ORIGINS = [
  'https://ink-flow.me',
  'https://www.ink-flow.me',
  'https://app.ink-flow.me',
  'https://inkflow.me',
  'https://www.inkflow.me',
  'https://app.inkflow.me',
  'https://inkdlow.vercel.app',
];

const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin = getAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

function getAllowedOrigin(origin?: string | null): string {
  if (!origin) return ALLOWED_ORIGINS[0];
  
  // Production origins
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  
  // Vercel previews (*.vercel.app)
  if (origin.endsWith('.vercel.app')) {
    return origin;
  }
  
  // Development origins (Supabase local ou localhost)
  if (DEV_ORIGINS.includes(origin)) {
    return origin;
  }
  
  // Supabase Studio preview (pour les tests)
  if (origin.includes('supabase.co') || origin.includes('supabase.in')) {
    return origin;
  }

  // Netlify previews / prod
  if (origin.endsWith('.netlify.app')) {
    return origin;
  }

  // Tout domaine HTTPS valide (domaine Vercel custom, sous-domaine client, etc.)
  // Sinon le navigateur bloque supabase.functions.invoke → "Failed to send request to Edge Function"
  try {
    const u = new URL(origin);
    if (
      u.protocol === 'https:' &&
      u.hostname.length > 0 &&
      !u.hostname.includes('..') &&
      u.hostname !== 'localhost'
    ) {
      return origin;
    }
  } catch {
    /* ignore */
  }

  // Default to primary production origin
  return ALLOWED_ORIGINS[0];
}

export function corsResponse(origin?: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}
