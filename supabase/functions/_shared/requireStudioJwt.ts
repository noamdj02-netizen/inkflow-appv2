import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getGoTrueUser } from "./supabaseAuth.ts";
import { resolveStudioRowForUser } from "./resolveStudioForJwt.ts";

type StudioRow = {
  id: string;
  email: string;
  slug: string;
  stripe_connect_account_id?: string | null;
};

export type StudioAccessContext = {
  user: { id: string; email: string | null };
  studio: StudioRow;
  isOwner: boolean;
};

/** JWT tatoueur + studioId doit appartenir au user (owner ou collaborateur). */
export async function requireStudioAccessFromRequest(
  req: Request,
  corsHeaders: Record<string, string>,
  studioId: string | undefined | null,
  supabaseUrl: string,
  anonKey: string,
  serviceRoleKey: string,
): Promise<StudioAccessContext | Response> {
  const json = (body: Record<string, unknown>, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  const authHeader = req.headers.get("Authorization") ?? "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m?.[1]?.trim()) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (!anonKey || !serviceRoleKey) {
    return json({ error: "Configuration serveur incomplète" }, 503);
  }

  const user = await getGoTrueUser(supabaseUrl, anonKey, m[1].trim());
  if (!user?.id) {
    return json({ error: "Unauthorized" }, 401);
  }

  const sid = studioId?.trim();
  if (!sid) {
    return json({ error: "studioId requis" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const resolved = await resolveStudioRowForUser(admin, user, sid);
  if (!resolved) {
    return json({ error: "Accès refusé à ce studio" }, 403);
  }

  return {
    user: { id: user.id, email: user.email ?? null },
    studio: resolved.studio,
    isOwner: resolved.isOwner,
  };
}
