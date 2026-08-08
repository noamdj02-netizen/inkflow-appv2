/**
 * POST — Refuse une demande projet (optionnel : message artiste stocké dans artist_message).
 * Auth : Bearer JWT (RLS studio).
 */
import { getGoTrueUser, createSupabaseUserClient } from "../_shared/supabaseAuth.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

interface Body {
  project_request_id?: string;
  artist_message?: string | null;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  cors: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  });
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized", code: "missing_authorization" }, 401, corsHeaders);
  }
  const accessToken = authHeader.slice(7).trim();
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return jsonResponse({ error: "Server misconfiguration" }, 500, corsHeaders);
  }

  const caller = await getGoTrueUser(SUPABASE_URL, SUPABASE_ANON_KEY, accessToken);
  if (!caller?.id) {
    return jsonResponse({ error: "Session invalide ou expirée", code: "invalid_session" }, 401, corsHeaders);
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
  }

  const projectRequestId = typeof body.project_request_id === "string" ? body.project_request_id.trim() : "";
  if (!projectRequestId) {
    return jsonResponse({ error: "project_request_id requis" }, 400, corsHeaders);
  }

  const artistMessage =
    typeof body.artist_message === "string" ? body.artist_message.trim() || null : null;

  const userSb = createSupabaseUserClient(SUPABASE_URL, SUPABASE_ANON_KEY, accessToken);

  const { data: row, error: selErr } = await userSb
    .from("inkflow_project_requests")
    .select("id, studio_id, status")
    .eq("id", projectRequestId)
    .maybeSingle();

  if (selErr) {
    console.error("[project-request-reject] select", selErr);
    return jsonResponse({ error: selErr.message }, 400, corsHeaders);
  }
  if (!row) {
    return jsonResponse({ error: "Demande introuvable ou accès refusé" }, 404, corsHeaders);
  }
  if (row.status !== "pending") {
    return jsonResponse(
      { error: "Seules les demandes en attente peuvent être refusées", status: row.status },
      409,
      corsHeaders,
    );
  }

  const patch: Record<string, unknown> = { status: "rejected" };
  if (artistMessage !== null) {
    patch.artist_message = artistMessage;
  }

  const { error: upErr } = await userSb
    .from("inkflow_project_requests")
    .update(patch)
    .eq("id", projectRequestId)
    .eq("studio_id", row.studio_id);

  if (upErr) {
    console.error("[project-request-reject] update", upErr);
    return jsonResponse({ error: upErr.message }, 400, corsHeaders);
  }

  return jsonResponse({ ok: true, project_request_id: projectRequestId }, 200, corsHeaders);
});
