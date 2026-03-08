/**
 * Envoie une notification Web Push à tous les appareils abonnés d'un studio.
 * Nécessite les secrets Supabase : VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY
 * (générés avec npm run vapid:generate).
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const CONTACT = "mailto:contact@ink-flow.me";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(CONTACT, VAPID_PUBLIC, VAPID_PRIVATE);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendPushPayload {
  studioId: string;
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response(
      JSON.stringify({
        error: "VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Supabase Edge Function secrets.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: SendPushPayload = await req.json();
    const { studioId, title = "InkFlow", body: bodyText = "Nouvelle notification", url = "/dashboard", tag = "inkflow-default" } = body;

    if (!studioId?.trim()) {
      return new Response(
        JSON.stringify({ error: "studioId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: subs, error: fetchError } = await supabase
      .from("inkflow_push_subscriptions")
      .select("endpoint, keys_p256dh, keys_auth")
      .eq("studio_id", studioId);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subs?.length) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, message: "No subscriptions for this studio" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys_p256dh,
              auth: sub.keys_auth,
            },
          },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await supabase.from("inkflow_push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent, total: subs.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
