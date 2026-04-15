/**
 * CORS headers pour les Edge Functions Supabase.
 * Liste stricte + origines optionnelles (INKFLOW_CORS_EXTRA_ORIGINS, séparées par des virgules).
 */

const ALLOWED_ORIGINS = [
  "https://ink-flow.me",
  "https://www.ink-flow.me",
  "https://app.ink-flow.me",
  "https://inkflow.me",
  "https://www.inkflow.me",
  "https://app.inkflow.me",
  "https://inkdlow.vercel.app",
];

const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

function extraAllowedOrigins(): string[] {
  const raw = (Deno.env.get("INKFLOW_CORS_EXTRA_ORIGINS") || "").trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin = getAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  };
}

function getAllowedOrigin(origin?: string | null): string {
  if (!origin) return ALLOWED_ORIGINS[0];

  const extras = extraAllowedOrigins();
  if (extras.includes(origin)) {
    return origin;
  }

  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  if (origin.endsWith(".vercel.app")) {
    return origin;
  }

  if (DEV_ORIGINS.includes(origin)) {
    return origin;
  }

  if (origin.includes("supabase.co") || origin.includes("supabase.in")) {
    return origin;
  }

  if (origin.endsWith(".netlify.app")) {
    return origin;
  }

  return ALLOWED_ORIGINS[0];
}

export function corsResponse(origin?: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}
