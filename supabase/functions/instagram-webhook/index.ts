/**
 * Webhook Meta pour Instagram Messaging
 * GET: vérification (hub.mode, hub.verify_token, hub.challenge)
 * POST: réception des messages — signature X-Hub-Signature-256 obligatoire si META_APP_SECRET est défini.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { verifyMetaSignature256 } from "../_shared/metaWebhookSignature.ts";

const META_WEBHOOK_VERIFY_TOKEN = (Deno.env.get("META_WEBHOOK_VERIFY_TOKEN") ?? "").trim();
const META_APP_SECRET = (Deno.env.get("META_APP_SECRET") ?? Deno.env.get("FACEBOOK_APP_SECRET") ?? "").trim();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req: Request) => {
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (!META_WEBHOOK_VERIFY_TOKEN) {
      console.error("[instagram-webhook] META_WEBHOOK_VERIFY_TOKEN non configuré — refus handshake");
      return new Response("Misconfigured", { status: 503 });
    }
    if (mode === "subscribe" && token === META_WEBHOOK_VERIFY_TOKEN && challenge) {
      return new Response(challenge, { headers: { "Content-Type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "POST") {
    if (!META_APP_SECRET) {
      console.error("[instagram-webhook] META_APP_SECRET (ou FACEBOOK_APP_SECRET) requis pour les POST");
      return new Response(JSON.stringify({ error: "misconfigured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();
    const sig = req.headers.get("X-Hub-Signature-256");
    const ok = await verifyMetaSignature256(rawBody, sig, META_APP_SECRET);
    if (!ok) {
      console.warn("[instagram-webhook] signature invalide ou absente");
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "misconfigured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = JSON.parse(rawBody) as { object?: string; entry?: unknown[] };

      if (body.object !== "instagram") {
        return new Response(JSON.stringify({ status: "ignored" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      for (const entry of body.entry || []) {
        const igAccountId = (entry as { id?: string }).id;
        if (!igAccountId) continue;
        for (const msg of ((entry as { messaging?: unknown[] }).messaging) || []) {
          const m = msg as {
            message?: { text?: string; mid?: string };
            sender?: { id?: string };
            timestamp?: string;
          };
          if (m.message?.text) {
            const { data: conn } = await supabase
              .from("instagram_connections")
              .select("studio_id")
              .eq("ig_account_id", igAccountId)
              .single();
            if (conn) {
              await supabase.from("instagram_messages").insert({
                studio_id: conn.studio_id,
                ig_account_id: igAccountId,
                from_id: m.sender?.id,
                to_id: igAccountId,
                message_id: m.message?.mid,
                text: m.message.text,
                direction: "inbound",
                timestamp: m.timestamp
                  ? new Date(parseInt(m.timestamp, 10)).toISOString()
                  : new Date().toISOString(),
              });
            }
          }
        }
      }

      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[instagram-webhook]", err instanceof Error ? err.message : String(err));
      return new Response(JSON.stringify({ status: "error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
