/**
 * Rate limiting léger en mémoire (par isolate Deno).
 * Ne remplace pas un WAF / Redis ; limite le spam évident sur les fonctions publiques.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

const MAX_BUCKETS = 50_000;

function pruneIfNeeded(): void {
  if (buckets.size < MAX_BUCKETS) return;
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (now > v.resetAt) buckets.delete(k);
  }
}

/** @returns true si la requête est autorisée */
export function allowRateLimit(key: string, max: number, windowMs: number): boolean {
  pruneIfNeeded();
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}

export function clientIpFromRequest(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
