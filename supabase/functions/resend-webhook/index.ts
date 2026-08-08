/**
 * Webhook Resend (Svix) — bounces & plaintes → table email_suppressions.
 * Dashboard Resend : créer un endpoint pointant vers cette URL, cocher email.bounced, email.complained.
 * Secret : RESEND_WEBHOOK_SECRET (signing secret affiché une fois à la création du webhook).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { Webhook } from "https://esm.sh/svix@1.92.2?target=deno";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") || "";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[resend-webhook] missing RESEND_WEBHOOK_SECRET or Supabase env");
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const rawBody = await req.text();
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return jsonResponse({ error: "Missing Svix headers" }, 400);
  }

  let payload: { type?: string; data?: Record<string, unknown> };
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    payload = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type?: string; data?: Record<string, unknown> };
  } catch (e) {
    console.error("[resend-webhook] verify failed", e);
    return jsonResponse({ error: "Invalid signature" }, 400);
  }

  const type = payload.type;
  const data = payload.data || {};
  const toList = (data as { to?: string[] }).to;
  const emails: string[] = Array.isArray(toList)
    ? toList.map((e) => String(e).trim().toLowerCase()).filter(Boolean)
    : [];

  if ((type === "email.bounced" || type === "email.complained") && emails.length) {
    const reason =
      type === "email.complained"
        ? "complaint"
        : String((data as { bounce?: { type?: string; message?: string } }).bounce?.type || "bounce");
    const detail = (data as { bounce?: { message?: string } }).bounce?.message || type;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    for (const email of emails) {
      const { error } = await supabase.from("email_suppressions").upsert(
        {
          email,
          reason: `${reason}: ${detail}`.slice(0, 500),
          source: "resend_webhook",
        },
        { onConflict: "email" },
      );
      if (error) {
        console.error("[resend-webhook] upsert", email, error);
      } else {
        console.log(`[resend-webhook] suppressed ${email} (${type})`);
      }
    }
  }

  return jsonResponse({ ok: true });
});
