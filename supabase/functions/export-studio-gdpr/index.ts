import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { getGoTrueUser } from "../_shared/supabaseAuth.ts";
import { allowRateLimit, clientIpFromRequest } from "../_shared/rateLimit.ts";
import { resolveStudioRowForUser } from "../_shared/resolveStudioForJwt.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const RATE_MAX = 6;
const RATE_WINDOW_MS = 60_000;

const TABLES_BY_STUDIO_ID = [
  "inkflow_vitrine_data",
  "inkflow_widgets",
  "inkflow_vitrine_link_settings",
  "inkflow_payment_settings",
  "inkflow_care_templates",
  "inkflow_clients",
  "inkflow_appointments",
  "inkflow_flash_designs",
  "inkflow_notifications",
  "inkflow_payments",
  "inkflow_subscriptions",
  "inkflow_consent_forms",
  "inkflow_reminder_logs",
  "inkflow_messages",
  "inkflow_artist_accounts",
  "inkflow_loyalty",
  "inkflow_bookings",
  "inkflow_project_requests",
  "inkflow_health_forms",
  "inkflow_followups",
  "inkflow_artists",
  "inkflow_reviews",
  "inkflow_push_subscriptions",
  "inkflow_client_stamp_state",
  "inkflow_stamp_appointment_credits",
  "inkflow_stamp_rewards",
  "inkflow_client_studio_favorites",
  "instagram_connections",
  "instagram_messages",
] as const;

async function selectOptional(
  supabase: ReturnType<typeof createClient>,
  table: string,
  studioId: string,
): Promise<unknown> {
  const { data, error } = await supabase.from(table).select("*").eq("studio_id", studioId);
  if (error) {
    console.warn(`[export-studio-gdpr] skip ${table}:`, error.message);
    return { _error: error.message, _table: table };
  }
  return data ?? [];
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return corsResponse(origin);
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Configuration serveur incomplète" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  const jwt = m?.[1]?.trim();
  if (!jwt) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const ip = clientIpFromRequest(req);
  if (!allowRateLimit(`export-gdpr:${ip}`, RATE_MAX, RATE_WINDOW_MS)) {
    return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans une minute." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const user = await getGoTrueUser(SUPABASE_URL, SUPABASE_ANON_KEY, jwt);
  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const body = req.method === "POST"
    ? ((await req.json().catch(() => ({}))) as { studioId?: string })
    : {};
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const emailNorm = user.email?.trim().toLowerCase() ?? "";
  if (!emailNorm) {
    return new Response(JSON.stringify({ error: "E-mail requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const resolved = await resolveStudioRowForUser(
    supabase,
    { id: user.id, email: user.email },
    body.studioId?.trim() || null,
  );
  if (!resolved) {
    return new Response(JSON.stringify({ error: "Studio introuvable ou accès refusé" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const studioId = resolved.studio.id;
  const exportBundle: Record<string, unknown> = {
    _meta: {
      exportedAt: new Date().toISOString(),
      studioId,
      isOwner: resolved.isOwner,
      format: "inkflow_gdpr_export_v1",
    },
    inkflow_studios: null as unknown,
  };

  {
    const { data: stRow, error: stErr } = await supabase
      .from("inkflow_studios")
      .select("*")
      .eq("id", studioId)
      .maybeSingle();
    if (stErr) {
      return new Response(JSON.stringify({ error: stErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    exportBundle.inkflow_studios = stRow;
  }

  for (const t of TABLES_BY_STUDIO_ID) {
    exportBundle[t] = await selectOptional(supabase, t, studioId);
  }

  const { data: refs1 } = await supabase.from("inkflow_referrals").select("*").eq("referrer_id", studioId);
  const { data: refs2 } = await supabase.from("inkflow_referrals").select("*").eq("referee_id", studioId);
  const rmap = new Map<string, unknown>();
  for (const r of (refs1 ?? []) as { id: string }[]) {
    rmap.set(r.id, r);
  }
  for (const r of (refs2 ?? []) as { id: string }[]) {
    rmap.set(r.id, r);
  }
  exportBundle.inkflow_referrals = [...rmap.values()];

  const { data: idRows } = await supabase.from("inkflow_clients").select("id").eq("studio_id", studioId);
  const clientIds = (idRows ?? []).map((r: { id: string }) => r.id);
  if (clientIds.length) {
    const { data: notes } = await supabase.from("inkflow_client_notes").select("*").in("client_id", clientIds);
    exportBundle.inkflow_client_notes = notes ?? [];
  } else {
    exportBundle.inkflow_client_notes = [];
  }

  const safeEmail = String(studioId).replace(/[^a-z0-9-_]/gi, "_");
  const filename = `inkflow-export-${safeEmail.slice(0, 80)}-${new Date().toISOString().slice(0, 10)}.json`;
  const json = JSON.stringify(exportBundle, null, 2);
  if (json.length > 20 * 1024 * 1024) {
    return new Response(
      JSON.stringify({ error: "Export trop volumineux. Contactez le support : contact@ink-flow.me" }),
      { status: 413, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  return new Response(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      ...corsHeaders,
    },
  });
});
