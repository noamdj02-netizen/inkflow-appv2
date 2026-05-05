/**
 * Enregistre un jeton device pour push natif Expo (FCM/APNs). JWT utilisateur requis.
 * Optionnel `studio_id` pour router send-push-notification (titulaire ou collaborateur).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders } from "../_shared/cors.ts";

async function canUserAccessStudio(
  admin: ReturnType<typeof createClient>,
  studioId: string,
  userEmail: string,
): Promise<boolean> {
  const em = userEmail.trim().toLowerCase();
  const { data: st, error: stErr } = await admin
    .from("inkflow_studios")
    .select("email")
    .eq("id", studioId)
    .maybeSingle();
  if (stErr || !st?.email) return false;
  if ((st.email as string).trim().toLowerCase() === em) return true;

  const { data: collab } = await admin
    .from("inkflow_artist_accounts")
    .select("id")
    .eq("studio_id", studioId)
    .ilike("email", userEmail.trim())
    .maybeSingle();

  return Boolean(collab?.id);
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user?.id || !user.email) {
    return new Response(JSON.stringify({ error: "Session invalide" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let body: { token?: string; platform?: string; studio_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalide" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const platform = typeof body.platform === "string" && body.platform.trim()
    ? body.platform.trim().slice(0, 32)
    : "unknown";

  const studioIdRaw =
    typeof body.studio_id === "string"
      ? body.studio_id.trim()
      : typeof (body as { studioId?: string }).studioId === "string"
        ? (body as { studioId: string }).studioId.trim()
        : "";

  if (!token || token.length < 8) {
    return new Response(JSON.stringify({ error: "token requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  let studioIdResolved: string | null = studioIdRaw || null;

  if (studioIdResolved) {
    const allowed = await canUserAccessStudio(admin, studioIdResolved, user.email);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Studio interdit pour ce compte" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  const { error: upsertErr } = await admin.from("inkflow_native_device_tokens").upsert(
    {
      user_id: user.id,
      token,
      platform,
      ...(studioIdResolved ? { studio_id: studioIdResolved } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,token" },
  );

  if (upsertErr) {
    console.error("[register-native-device]", upsertErr);
    return new Response(JSON.stringify({ error: "Enregistrement impossible" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
