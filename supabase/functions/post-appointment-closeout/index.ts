/**
 * Après passage d’un RDV en « completed » : push tatoueur (solde + traçabilité).
 * Idempotent via `closeout_push_sent_at`. Appelé par trigger pg_net (comme la fidélité tampons).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      appointmentId?: string;
      studioId?: string;
      clientId?: string;
      clientEmail?: string;
      clientName?: string;
      event?: string;
    };
    const appointmentId = body.appointmentId?.trim() || "";
    const studioId = body.studioId?.trim() || "";
    let clientId = body.clientId?.trim() || "";

    if (!appointmentId || !studioId) {
      return new Response(
        JSON.stringify({ error: "appointmentId et studioId requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: claimed, error: claimErr } = await supabase
      .from("inkflow_appointments")
      .update({ closeout_push_sent_at: new Date().toISOString() })
      .eq("id", appointmentId)
      .eq("studio_id", studioId)
      .is("closeout_push_sent_at", null)
      .select("id, client_id, client_name, client_email, date, time, duration, status, balance_paid_at")
      .maybeSingle();

    if (claimErr) {
      console.error("[post-appointment-closeout] claim:", claimErr.message);
      return new Response(JSON.stringify({ error: claimErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!claimed) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!clientId && claimed.client_id) {
      clientId = String(claimed.client_id);
    }

    const q = new URLSearchParams();
    q.set("tab", "stock");
    q.set("appointmentId", appointmentId);
    if (clientId) q.set("clientId", clientId);
    const path = `/dashboard?${q.toString()}`;

    // Marque explicitement en base que le lifecycle post-séance doit se déclencher
    // (sans dépendre d'un clic UI). Best-effort et idempotent via inkflow_reminder_logs.
    try {
      const aptDate = (claimed.date as string | null) || "";
      const aptTime = (claimed.time as string | null) || "";
      const dur = typeof claimed.duration === "number" && claimed.duration > 0 ? claimed.duration : 60;
      const now = new Date();
      const start = aptDate && aptTime ? new Date(`${aptDate}T${String(aptTime).slice(0, 5)}:00`) : null;
      const end = start && !Number.isNaN(start.getTime()) ? new Date(start.getTime() + dur * 60 * 1000) : null;

      const planned = [
        { type: `lifecycle_plan:j1:${aptDate}`, when: aptDate },
        { type: `lifecycle_plan:j7:${aptDate}`, when: aptDate },
        { type: `lifecycle_plan:j30:${aptDate}`, when: aptDate },
        { type: `lifecycle_plan:feedback:${aptDate}`, when: end ? end.toISOString() : now.toISOString() },
      ];

      for (const p of planned) {
        await supabase.from("inkflow_reminder_logs").insert({
          id: `lc_${Date.now()}_${appointmentId}_${p.type}`.slice(0, 120),
          appointment_id: appointmentId,
          type: p.type,
        }).catch(() => undefined);
      }
    } catch {
      // ignore
    }

    const pushUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-push-notification`;
    const pushRes = await fetch(pushUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        studioId,
        title: "Séance terminée",
        body: `Encaisse le solde si besoin et trace le matériel (aiguille) — ${
          (claimed.client_name as string) || body.clientName || "Client"
        }.`,
        url: path,
        tag: `inkflow-closeout-${appointmentId}`,
      }),
    });

    if (!pushRes.ok) {
      const t = await pushRes.text();
      console.error("[post-appointment-closeout] push:", pushRes.status, t);
    }

    return new Response(JSON.stringify({ ok: true, pushOk: pushRes.ok }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[post-appointment-closeout]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
