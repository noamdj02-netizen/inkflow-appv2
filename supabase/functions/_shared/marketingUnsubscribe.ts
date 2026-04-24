/**
 * Lien signé one-click désinscription marketing (emails post-RDV J+1/J+7/J+30, parrainage…).
 * Secret : EMAIL_UNSUBSCRIBE_SECRET (Supabase secrets).
 */

const encoder = new TextEncoder();

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signUnsubscribeToken(emailNorm: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(emailNorm));
  return toHex(sig);
}

export function base64UrlEncode(str: string): string {
  const b64 = btoa(str);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecodeToString(b64url: string): string {
  const pad = 4 - (b64url.length % 4 || 4);
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + (pad < 4 ? "=".repeat(pad) : "");
  return atob(b64);
}

export async function buildMarketingUnsubscribeUrlAsync(email: string): Promise<string | null> {
  const secret = Deno.env.get("EMAIL_UNSUBSCRIBE_SECRET")?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/+$/, "");
  if (!secret || !supabaseUrl) return null;
  const norm = email.trim().toLowerCase();
  const e = base64UrlEncode(norm);
  const t = await signUnsubscribeToken(norm, secret);
  return `${supabaseUrl}/functions/v1/email-marketing-unsubscribe?e=${encodeURIComponent(e)}&t=${t}`;
}

/** En-têtes List-Unsubscribe (RFC 2369 + recommandation Gmail). */
export async function listUnsubscribeHeaders(recipientEmail: string): Promise<Record<string, string>> {
  const oneClick = await buildMarketingUnsubscribeUrlAsync(recipientEmail);
  const mailto =
    "mailto:contact@ink-flow.me?subject=" + encodeURIComponent("Se désabonner des e-mails InkFlow (suivi)");
  if (oneClick) {
    return {
      "List-Unsubscribe": `<${oneClick}>, <${mailto}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }
  return {
    "List-Unsubscribe": `<${mailto}>`,
  };
}
