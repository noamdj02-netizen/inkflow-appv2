/**
 * Reçoit les webhooks Supabase (INSERT/UPDATE) sur inkflow_bookings, inkflow_project_requests,
 * inkflow_appointments et envoie une notification Web Push au studio.
 * À configurer dans Supabase Dashboard > Database > Webhooks.
 */

import { getCorsHeaders } from "../_shared/cors.ts";
import { assertInternalFunctionAuthorized } from "../_shared/edgeInvokeAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
}

function getStudioId(record: Record<string, unknown> | null): string | null {
  if (!record || typeof record.studio_id !== "string") return null;
  return record.studio_id.trim() || null;
}

function truncate(s: string, max: number): string {
  if (!s || typeof s !== "string") return "";
  return s.length <= max ? s : s.slice(0, max) + "…";
}

function formatDate(dateStr: string | unknown): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return String(dateStr);
  }
}

function buildPushPayload(payload: WebhookPayload): { studioId: string; title: string; body: string; url: string; tag: string } | null {
  const { type, table, record, old_record } = payload;
  const studioId = getStudioId(record);
  if (!studioId) return null;

  if (table === "inkflow_bookings" && type === "INSERT" && record) {
    const clientName = String(record.client_name ?? "").trim() || "Un client";
    const desc = String(record.description ?? "").trim();
    const date = formatDate(record.requested_date);
    return {
      studioId,
      title: "Nouvelle demande RDV",
      body: `${clientName} souhaite un RDV${date ? ` le ${date}` : ""}${desc ? ` — ${truncate(desc, 60)}` : ""}`,
      url: "/dashboard?tab=requests",
      tag: "inkflow-booking",
    };
  }

  if (table === "inkflow_project_requests" && type === "INSERT" && record) {
    const clientName = String(record.client_name ?? "").trim() || "Un client";
    const desc = String(record.description ?? "").trim();
    return {
      studioId,
      title: "Nouvelle demande de projet",
      body: `${clientName} — ${truncate(desc, 60) || "Projet personnalisé"}`,
      url: "/dashboard?tab=requests",
      tag: "inkflow-project",
    };
  }

  if (table === "inkflow_appointments" && type === "INSERT" && record) {
    const status = String(record.status ?? "").toLowerCase().trim();
    const depositPaid = Boolean(record.deposit_paid);
    const depositNum = record.deposit != null && record.deposit !== "" ? Number(record.deposit) : 0;
    const awaitingDeposit =
      !depositPaid && status === "pending" && !Number.isNaN(depositNum) && depositNum > 0;
    if (awaitingDeposit) {
      return null;
    }
    const clientName = String(record.client_name ?? "").trim() || "Un client";
    const service = String(record.service ?? "").trim() || "RDV";
    const date = formatDate(record.date);
    const time = String(record.time ?? "").trim();
    return {
      studioId,
      title: "Nouveau rendez-vous",
      body: `${clientName} — ${service}${date ? ` le ${date}` : ""}${time ? ` à ${time}` : ""}`,
      url: "/dashboard?tab=appointments",
      tag: "inkflow-appointment",
    };
  }

  if (table === "inkflow_appointments" && type === "UPDATE" && record && old_record) {
    const wasPaid = Boolean(old_record?.deposit_paid);
    const isPaid = Boolean(record?.deposit_paid);
    if (!wasPaid && isPaid) {
      const clientName = String(record.client_name ?? "").trim() || "Un client";
      const amount = Number(record.deposit ?? 0) || 0;
      return {
        studioId,
        title: "Acompte reçu",
        body: `${clientName} a payé ${amount.toFixed(0)}€`,
        url: "/dashboard?tab=finance",
        tag: "inkflow-deposit",
      };
    }
  }

  return null;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);
  const jsonHeaders = { "Content-Type": "application/json", ...cors };
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const denied = assertInternalFunctionAuthorized(req, origin);
  if (denied) return denied;

  try {
    const body: WebhookPayload = await req.json();
    const pushPayload = buildPushPayload(body);
    if (!pushPayload) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "no_push_needed" }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    const fnUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-push-notification`;
    const res = await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(pushPayload),
    });

    const resBody = await res.text();
    if (!res.ok) {
      console.error("[notification-webhook] send-push-notification failed:", res.status, resBody);
      return new Response(JSON.stringify({ ok: false, error: resBody }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    return new Response(JSON.stringify({ ok: true, push: JSON.parse(resBody || "{}") }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[notification-webhook] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
