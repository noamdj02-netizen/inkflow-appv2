/**
 * Envoie une notification Web Push à tous les appareils abonnés d'un studio.
 * Secrets : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:…)
 *
 * Auth : Bearer SUPABASE_SERVICE_ROLE_KEY (serveur) OU JWT utilisateur propriétaire du studio.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getGoTrueUser } from "../_shared/supabaseAuth.ts";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = (Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@ink-flow.me").trim();

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

interface SendPushPayload {
  studioId: string;
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
}

interface SubscriptionRow {
  id: string;
  subscription: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
}

function parseSubscription(row: SubscriptionRow): { endpoint: string; keys: { p256dh: string; auth: string } } | null {
  const s = row.subscription;
  if (!s?.endpoint || !s.keys?.p256dh || !s.keys?.auth) return null;
  return {
    endpoint: s.endpoint,
    keys: {
      p256dh: s.keys.p256dh,
      auth: s.keys.auth,
    },
  };
}

async function authorizeSendPush(req: Request, studioId: string): Promise<Response | null> {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  if (serviceKey && bearer === serviceKey) {
    return null;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const user = await getGoTrueUser(supabaseUrl, anonKey, bearer);
  if (!user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: studio, error } = await admin
    .from("inkflow_studios")
    .select("email")
    .eq("id", studioId)
    .maybeSingle();

  if (error || !studio?.email) {
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
  return null;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response(
      JSON.stringify({
        error: "VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Supabase Edge Function secrets.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const body: SendPushPayload = await req.json();
    const {
      studioId,
      title = "InkFlow",
      body: bodyText = "Nouvelle notification",
      url = "/dashboard",
      tag = "inkflow-default",
    } = body;

    if (!studioId?.trim()) {
      return new Response(
        JSON.stringify({ error: "studioId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const denied = await authorizeSendPush(req, studioId);
    if (denied) return denied;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: rows, error: fetchError } = await supabase
      .from("inkflow_push_subscriptions")
      .select("id, subscription")
      .eq("studio_id", studioId);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const subs = (rows ?? []) as SubscriptionRow[];
    if (subs.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, message: "No subscriptions for this studio" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = JSON.stringify({
      title,
      body: bodyText,
      tag,
      data: { url, actionUrl: url },
      requireInteraction: false,
    });

    let sent = 0;
    for (const row of subs) {
      const pushSub = parseSubscription(row);
      if (!pushSub) continue;
      try {
        await webpush.sendNotification(pushSub, payload);
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        const endpoint = row.subscription?.endpoint;
        if ((statusCode === 410 || statusCode === 404) && endpoint) {
          await supabase.from("inkflow_push_subscriptions").delete().eq("id", row.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent, total: subs.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
