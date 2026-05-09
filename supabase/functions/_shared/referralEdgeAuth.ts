/**
 * Auth pour les Edge Functions parrainage client (inkflow_client_referrals).
 * - JWT utilisateur dont l’email = referee_email
 * - ou secret interne partagé (cron / autre Edge), jamais exposé au navigateur.
 */
import { getCorsHeaders } from "./cors.ts";
import { getGoTrueUser } from "./supabaseAuth.ts";

const INTERNAL_ENV = "INKFLOW_REFERRAL_INTERNAL_SECRET";

export function getReferralInternalSecret(): string {
  return (Deno.env.get(INTERNAL_ENV) ?? "").trim();
}

function bearerToken(req: Request): string {
  const auth = req.headers.get("Authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() ?? "";
}

/** True si Bearer ou header dédié = secret interne (serveur uniquement). */
export function isReferralInternalCaller(req: Request, secret: string): boolean {
  if (!secret) return false;
  const b = bearerToken(req);
  const h = (req.headers.get("x-inkflow-referral-secret") ?? "").trim();
  return b === secret || h === secret;
}

/**
 * @param refereeEmailNorm email filleul déjà normalisé en minuscules
 * @returns Response d’erreur JSON + status, ou null si OK
 */
export async function assertRefereeIdentity(
  req: Request,
  supabaseUrl: string,
  anonKey: string,
  refereeEmailNorm: string,
): Promise<Response | null> {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const internal = getReferralInternalSecret();
  if (isReferralInternalCaller(req, internal)) {
    return null;
  }

  const token = bearerToken(req);
  if (!token) {
    return new Response(JSON.stringify({ error: "Authentification requise." }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const user = await getGoTrueUser(supabaseUrl, anonKey, token);
  const em = user?.email?.trim().toLowerCase() ?? "";
  if (!em || em !== refereeEmailNorm) {
    return new Response(
      JSON.stringify({ error: "Session non autorisée pour cet e-mail." }),
      {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
  return null;
}

/**
 * Même règle que assertRefereeIdentity mais **sans** secret interne (inscription publique :
 * uniquement la session dont l’email = filleul).
 */
export async function assertRefereeJwtOnly(
  req: Request,
  supabaseUrl: string,
  anonKey: string,
  refereeEmailNorm: string,
): Promise<Response | null> {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  const token = bearerToken(req);
  if (!token) {
    return new Response(JSON.stringify({ error: "Authentification requise." }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const user = await getGoTrueUser(supabaseUrl, anonKey, token);
  const em = user?.email?.trim().toLowerCase() ?? "";
  if (!em || em !== refereeEmailNorm) {
    return new Response(
      JSON.stringify({ error: "Session non autorisée pour cet e-mail." }),
      {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
  return null;
}

