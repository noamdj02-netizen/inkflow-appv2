/**
 * Normalise une URL de base (APP_URL / SITE_URL) pour les redirections Stripe et OAuth app.
 * Stripe exige des URL absolues avec schéma ; sinon erreur `url_invalid`.
 *
 * Cas couverts : domaine sans schéma (`app.ink-flow.me`), `localhost:3000`, secret mal saisi.
 */

/** Origine SPA prod : dashboard, /book, /reservation-succes (pas la landing Framer). */
export const DEFAULT_APP_ORIGIN = "https://app.ink-flow.me";

/** Préfère APP_URL, puis SITE_URL ; fallback app.ink-flow.me. */
export function resolveAppBaseUrl(): string {
  return resolveAbsoluteSiteBase(
    Deno.env.get("APP_URL") || Deno.env.get("SITE_URL"),
    DEFAULT_APP_ORIGIN,
  );
}

export function resolveAbsoluteSiteBase(envSiteUrl: string | undefined, fallback: string): string {
  const fb = fallback.replace(/\/+$/, "");
  const raw = (envSiteUrl ?? "").trim();
  if (!raw) return fb;

  let s = raw.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(s)) {
    const hostPart = (s.split("/")[0] ?? "").split(":")[0] ?? "";
    const isLocal =
      /^localhost$/i.test(hostPart) ||
      /^127\.\d+\.\d+\.\d+$/i.test(hostPart) ||
      /^\[::1\]$/i.test(hostPart);
    s = isLocal ? `http://${s}` : `https://${s}`;
  }

  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return fb;
    return `${u.protocol}//${u.host}`.replace(/\/+$/, "");
  } catch {
    console.warn("[siteUrl] SITE_URL invalide, utilisation du fallback:", fallback);
    return fb;
  }
}
