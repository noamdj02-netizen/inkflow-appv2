/**
 * Envoie une notification Web Push (VAPID) **et**, si des jetons Expo sont enregistrés,
 * via l’API Expo Push (`inkflow_native_device_tokens.studio_id`).
 *
 * Secrets : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT ;
 * optionnel Expo : EXPO_ACCESS_TOKEN (https://expo.dev/accounts/_/settings/access-tokens)
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
const EXPO_ACCESS_TOKEN = (Deno.env.get("EXPO_ACCESS_TOKEN") ?? "").trim();

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

function isExpoPushToken(token: string): boolean {
  const t = token.trim();
  return t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken[");
}

async function sendExpoNotificationsForStudio(
  admin: ReturnType<typeof createClient>,
  studioId: string,
  title: string,
  bodyText: string,
  url: string,
): Promise<{ sent: number; total: number }> {
  const { data: rows, error } = await admin
    .from("inkflow_native_device_tokens")
    .select("token")
    .eq("studio_id", studioId);

  if (error) {
    console.error("[send-push-notification] native tokens:", error.message);
    return { sent: 0, total: 0 };
  }

  const tokens = [
    ...new Set(
      (rows ?? [])
        .map((r: { token: string }) => r.token)
        .filter((t) => typeof t === "string" && isExpoPushToken(t)),
    ),
  ];
  if (tokens.length === 0) return { sent: 0, total: 0 };

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };
  if (EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${EXPO_ACCESS_TOKEN}`;

  let sent = 0;
  const batchSize = 99;
  for (let i = 0; i < tokens.length; i += batchSize) {
    const chunk = tokens.slice(i, i + batchSize);
    const messages = chunk.map((to) => ({
      to,
      sound: "default" as const,
      title,
      body: bodyText,
      priority: "high" as const,
      data: { url, actionUrl: url },
    }));

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
    });
    const raw = await res.text();
    if (!res.ok) {
      console.error("[send-push-notification] Expo HTTP", res.status, raw);
      continue;
    }
    try {
      const parsed = JSON.parse(raw) as { data?: Array<{ status?: string }> };
      for (const item of parsed.data ?? []) {
        if (item?.status === "ok") sent++;
      }
    } catch {
      console.error("[send-push-notification] Expo response parse:", raw.slice(0, 500));
    }
  }

  return { sent, total: tokens.length };
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

  const vapidOk = Boolean(VAPID_PUBLIC && VAPID_PRIVATE);
  if (!vapidOk) {
    console.warn("[send-push-notification] VAPID keys missing — Web Push désactivé (Expo peut rester actif).");
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

    let webSent = 0;
    let webTotal = 0;

    if (vapidOk) {
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
      webTotal = subs.length;

      const payload = JSON.stringify({
        title,
        body: bodyText,
        tag,
        data: { url, actionUrl: url },
        requireInteraction: false,
      });

      for (const row of subs) {
        const pushSub = parseSubscription(row);
        if (!pushSub) continue;
        try {
          await webpush.sendNotification(pushSub, payload);
          webSent++;
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          const endpoint = row.subscription?.endpoint;
          if ((statusCode === 410 || statusCode === 404) && endpoint) {
            await supabase.from("inkflow_push_subscriptions").delete().eq("id", row.id);
          }
        }
      }
    }

    const expo = await sendExpoNotificationsForStudio(supabase, studioId, title, bodyText, url);

    if (!vapidOk && webTotal === 0 && expo.total === 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error:
            "Aucune route push : configure VAPID (Web Push) ou enregistre l’app Expo (jetons avec studio_id).",
          expoSent: 0,
          expoTotal: 0,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sent: webSent,
        total: webTotal,
        expoSent: expo.sent,
        expoTotal: expo.total,
      }),
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
