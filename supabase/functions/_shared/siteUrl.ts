/**
 * Normalise `SITE_URL` pour les redirections Stripe (success_url / cancel_url).
 * Stripe exige des URL absolues avec schéma ; sinon erreur `url_invalid`.
 *
 * Cas couverts : domaine sans schéma (`app.ink-flow.me`), `localhost:3000`, secret mal saisi.
 */
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
