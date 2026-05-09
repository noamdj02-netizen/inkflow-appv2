/**
 * Meta / Instagram — vérif X-Hub-Signature-256 (HMAC-SHA256 du corps brut avec App Secret).
 * @see https://developers.facebook.com/docs/graph-api/webhooks/getting-started/#verification-requests
 */

function hexFromBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/**
 * @param rawBody corps POST tel quel (string UTF-8)
 * @param signatureHeader valeur de X-Hub-Signature-256 (ex. "sha256=abc...")
 */
export async function verifyMetaSignature256(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!appSecret || !signatureHeader) return false;
  const expectedPrefix = "sha256=";
  const parts = signatureHeader.split(",").map((p) => p.trim()).filter(Boolean);
  const sigs = parts
    .map((p) => (p.startsWith(expectedPrefix) ? p.slice(expectedPrefix.length) : null))
    .filter((x): x is string => !!x);
  if (sigs.length === 0) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const digestHex = hexFromBuffer(mac);

  for (const s of sigs) {
    if (s.length === digestHex.length && timingSafeEqualHex(s.toLowerCase(), digestHex.toLowerCase())) {
      return true;
    }
  }
  return false;
}
