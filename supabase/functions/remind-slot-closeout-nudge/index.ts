/**
 * Cron : RDV confirmé / en cours dont le créneau (date + heure + duration, fuseau Paris) est dépassé
 * → push doux « Pensez à clôturer » (une fois par RDV, idempotence post_slot_nudge_sent_at).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders } from "../_shared/cors.ts";
import { assertCronAuthorized } from "../_shared/cronGate.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const jsonHeaders = { "Content-Type": "application/json", ...corsHeaders };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const denied = assertCronAuthorized(req, origin);
  if (denied) return denied;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: rows, error } = await supabase.rpc("inkflow_list_slot_end_nudges");

    if (error) {
      console.error("[remind-slot-closeout-nudge]", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const list = (rows ?? []) as Array<{
      id: string;
      studio_id: string;
      client_id: string | null;
      client_name: string | null;
    }>;

    let nudged = 0;
    for (const row of list) {
      const id = row.id;
      const studioId = row.studio_id;

      const { data: claimed } = await supabase
        .from("inkflow_appointments")
        .update({ post_slot_nudge_sent_at: new Date().toISOString() })
        .eq("id", id)
        .eq("studio_id", studioId)
        .in("status", ["confirmed", "in_progress"])
        .is("post_slot_nudge_sent_at", null)
        .select("id")
        .maybeSingle();

      if (!claimed) continue;

      const pushUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-push-notification`;
      const r = await fetch(pushUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          studioId,
          title: "Créneau dépassé",
          body: `Pensez à clôturer le RDV — ${row.client_name || "client"}.`,
          url: "/dashboard?tab=appointments",
          tag: `inkflow-slot-nudge-${id}`,
        }),
      });
      if (r.ok) nudged++;
      else console.error("[remind-slot-closeout-nudge] push", id, await r.text());
    }

    return new Response(JSON.stringify({ ok: true, candidates: list.length, nudged }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (e) {
    console.error("[remind-slot-closeout-nudge]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
