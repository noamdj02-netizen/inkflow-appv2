/**
 * Garde pour Edge Functions appelées par pg_cron / pg_net sans JWT Supabase.
 * Définir EDGE_CRON_SECRET (ou CRON_SECRET) dans les secrets de la fonction et
 * envoyer le même secret en x-cron-secret ou Authorization: Bearer <secret>.
 * Si le secret n'est pas défini, l'accès reste ouvert (compat ; à éviter en prod).
 */
import { getCorsHeaders } from "./cors.ts";

export function getEdgeCronSecret(): string {
  return (Deno.env.get("EDGE_CRON_SECRET") ?? Deno.env.get("CRON_SECRET") ?? "").trim();
}

/** 403 + JSON si non autorisé ; null si OK. */
export function assertCronAuthorized(req: Request, origin: string | null): Response | null {
  const secret = getEdgeCronSecret();
  if (!secret) return null;

  const headerSecret = req.headers.get("x-cron-secret");
  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  if (headerSecret === secret || bearer === secret) return null;

  const corsHeaders = getCorsHeaders(origin);
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 403,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
