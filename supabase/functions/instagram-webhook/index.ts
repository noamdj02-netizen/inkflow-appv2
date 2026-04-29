/**
 * Webhook Meta pour Instagram Messaging
 * GET: vérification (hub.mode, hub.verify_token, hub.challenge)
 * POST: réception des messages
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const META_WEBHOOK_VERIFY_TOKEN = Deno.env.get("META_WEBHOOK_VERIFY_TOKEN") || "inkflow_webhook";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req: Request) => {
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === META_WEBHOOK_VERIFY_TOKEN && challenge) {
      return new Response(challenge, { headers: { "Content-Type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body.object !== "instagram") {
        return new Response(JSON.stringify({ status: "ignored" }), { headers: { "Content-Type": "application/json" } });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      for (const entry of body.entry || []) {
        const igAccountId = entry.id;
        for (const msg of entry.messaging || []) {
          if (msg.message?.text) {
            const { data: conn } = await supabase
              .from("instagram_connections")
              .select("studio_id")
              .eq("ig_account_id", igAccountId)
              .single();
            if (conn) {
              await supabase.from("instagram_messages").insert({
                studio_id: conn.studio_id,
                ig_account_id: igAccountId,
                from_id: msg.sender?.id,
                to_id: igAccountId,
                message_id: msg.message?.mid,
                text: msg.message.text,
                direction: "inbound",
                timestamp: msg.timestamp ? new Date(parseInt(msg.timestamp, 10)).toISOString() : new Date().toISOString(),
              });
            }
          }
        }
      }

      return new Response(JSON.stringify({ status: "ok" }), { headers: { "Content-Type": "application/json" } });
    } catch (err) {
      console.error("[instagram-webhook] Erreur traitement message:", err instanceof Error ? err.message : String(err));
      return new Response(JSON.stringify({ status: "error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
