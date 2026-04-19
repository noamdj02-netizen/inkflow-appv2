/**
 * Enregistre un abonnement Web Push (JSON PushSubscription) pour le studio courant.
 * Auth : JWT tatoueur (email = inkflow_studios.email pour studio_id).
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getGoTrueUser } from "../_shared/supabaseAuth.ts";

interface BodyPayload {
  studioId?: string;
  subscription?: {
    endpoint?: string;
    expirationTime?: number | null;
    keys?: { p256dh?: string; auth?: string };
  };
}

function isValidSubscription(sub: BodyPayload["subscription"]): sub is NonNullable<BodyPayload["subscription"]> & {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} {
  if (!sub?.endpoint?.trim()) return false;
  const k = sub.keys;
  return Boolean(k?.p256dh && k?.auth);
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  const user = await getGoTrueUser(supabaseUrl, anonKey, bearer);
  if (!user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: BodyPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const studioId = typeof payload.studioId === "string" ? payload.studioId.trim() : "";
  if (!studioId || !isValidSubscription(payload.subscription)) {
    return new Response(JSON.stringify({ error: "studioId and valid subscription (endpoint, keys) required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: studio, error: studioErr } = await admin
    .from("inkflow_studios")
    .select("id, email")
    .eq("id", studioId)
    .maybeSingle();

  if (studioErr || !studio?.email) {
    return new Response(JSON.stringify({ error: "Studio not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (studio.email.toLowerCase() !== user.email.toLowerCase()) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const subscription = {
    endpoint: payload.subscription!.endpoint!,
    expirationTime: payload.subscription!.expirationTime ?? null,
    keys: {
      p256dh: payload.subscription!.keys!.p256dh!,
      auth: payload.subscription!.keys!.auth!,
    },
  };

  const endpoint = subscription.endpoint;
  const { data: existingRows, error: listErr } = await admin
    .from("inkflow_push_subscriptions")
    .select("id, subscription")
    .eq("studio_id", studioId);

  if (listErr) {
    return new Response(JSON.stringify({ error: listErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const dupIds = (existingRows ?? [])
    .filter((r) => {
      const sub = r.subscription as { endpoint?: string } | null;
      return sub?.endpoint === endpoint;
    })
    .map((r) => r.id as string);

  for (const rid of dupIds) {
    await admin.from("inkflow_push_subscriptions").delete().eq("id", rid);
  }

  const { error: insErr } = await admin.from("inkflow_push_subscriptions").insert({
    studio_id: studioId,
    subscription,
  });

  if (insErr) {
    return new Response(JSON.stringify({ error: insErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
