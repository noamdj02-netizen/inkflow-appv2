/**
 * Rate limiting distribué (Upstash Redis) pour les Edge Functions d’auth.
 * Sans `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` : les contrôles sont ignorés
 * (log en avertissement une fois en prod — préférer configurer Upstash en production).
 */
import { Redis } from "https://esm.sh/@upstash/redis@1.34.0";

let _redis: Redis | null | undefined;

export function getUpstashRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = (Deno.env.get("UPSTASH_REDIS_REST_URL") || "").trim();
  const token = (Deno.env.get("UPSTASH_REDIS_REST_TOKEN") || "").trim();
  if (!url || !token) {
    _redis = null;
    return null;
  }
  _redis = new Redis({ url, token });
  return _redis;
}

const WINDOW_SEC = 3600;

export function getClientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  return "unknown";
}

async function shortHash16(input: string): Promise<string> {
  const b = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)),
  );
  return [...b.slice(0, 8)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function hourBucket(): number {
  return Math.floor(Date.now() / 1000 / WINDOW_SEC);
}

export type AuthRateLimitNs = "studio-auth" | "pwd-recovery";

const LIMITS: Record<AuthRateLimitNs, { maxIp: number; maxEmail: number }> = {
  "studio-auth": { maxIp: 25, maxEmail: 6 },
  "pwd-recovery": { maxIp: 20, maxEmail: 5 },
};

/**
 * Vérifie IP puis e-mail. Retourne null si autorisé, ou une Response 429 (JSON) si bloqué.
 */
export async function tryAuthRateLimitResponse(
  req: Request,
  emailNormalized: string,
  ns: AuthRateLimitNs,
): Promise<Response | null> {
  const redis = getUpstashRedis();
  if (!redis) {
    return null;
  }
  const { maxIp, maxEmail } = LIMITS[ns];
  const t = hourBucket();
  const ip = getClientIp(req);
  const ipKey = `rl:${ns}:ip:${ip}:${t}`;
  const emKey = `rl:${ns}:em:${await shortHash16(emailNormalized.toLowerCase())}:${t}`;

  const nIp = await redis.incr(ipKey);
  if (nIp === 1) await redis.expire(ipKey, WINDOW_SEC);
  if (nIp > maxIp) {
    return rateLimitResponse(WINDOW_SEC);
  }

  const nEm = await redis.incr(emKey);
  if (nEm === 1) await redis.expire(emKey, WINDOW_SEC);
  if (nEm > maxEmail) {
    return rateLimitResponse(WINDOW_SEC);
  }
  return null;
}

function rateLimitResponse(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({
      error: "Trop de tentatives. Réessayez plus tard ou contactez le support.",
      retryAfter: retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
