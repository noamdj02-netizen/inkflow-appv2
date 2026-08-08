/**
 * POST — Accepte une demande projet : créneau proposé + message artiste, e-mail client automatique.
 * Auth : Bearer JWT (propriétaire / membre studio via RLS).
 */
import { getGoTrueUser, createSupabaseUserClient } from "../_shared/supabaseAuth.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/resend.ts";
import { wrapEmailLayout, escapeHtml, getEmailNavigationBaseUrls } from "../_shared/emailLayout.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

interface Body {
  project_request_id?: string;
  proposed_slot?: string;
  slot_expires_at?: string;
  artist_message?: string | null;
}

const SLOT_TIMEZONE = "Europe/Paris";
const ACTIVE_APPOINTMENT_STATUSES = ["pending", "confirmed", "in_progress", "completed"] as const;
const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "accepted"] as const;

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  cors: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  });
}

function parseIso(s: string | undefined): Date | null {
  if (!s || typeof s !== "string" || !s.trim()) return null;
  const d = new Date(s.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function getSlotDateParts(slot: Date, timeZone = SLOT_TIMEZONE): { date: string; time: string } {
  return {
    date: slot.toLocaleDateString("en-CA", { timeZone }),
    time: normalizeTime(
      slot.toLocaleTimeString("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    ) || "00:00",
  };
}

async function isSlotStillAvailable(
  supabase: ReturnType<typeof createSupabaseUserClient>,
  studioId: string,
  projectRequestId: string,
  proposedSlot: Date,
): Promise<boolean> {
  const { date, time } = getSlotDateParts(proposedSlot);

  const { data: appointments, error: appointmentsError } = await supabase
    .from("inkflow_appointments")
    .select("id, time")
    .eq("studio_id", studioId)
    .eq("date", date)
    .in("status", [...ACTIVE_APPOINTMENT_STATUSES]);

  if (appointmentsError) throw appointmentsError;
  if ((appointments || []).some((row) => normalizeTime((row.time as string | null) ?? null) === time)) {
    return false;
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("inkflow_bookings")
    .select("id, requested_time")
    .eq("studio_id", studioId)
    .eq("requested_date", date)
    .in("status", [...ACTIVE_BOOKING_STATUSES]);

  if (bookingsError) throw bookingsError;
  if (
    (bookings || []).some(
      (row) => normalizeTime((row.requested_time as string | null) ?? null) === time,
    )
  ) {
    return false;
  }

  const { data: projectRequests, error: projectRequestsError } = await supabase
    .from("inkflow_project_requests")
    .select("id, proposed_slot, slot_expires_at")
    .eq("studio_id", studioId)
    .eq("status", "accepted")
    .neq("id", projectRequestId)
    .not("proposed_slot", "is", null);

  if (projectRequestsError) throw projectRequestsError;

  const nowMs = Date.now();
  for (const row of projectRequests || []) {
    const expiresAt = parseIso((row.slot_expires_at as string | null) ?? undefined);
    if (expiresAt && expiresAt.getTime() < nowMs) continue;
    const otherSlot = parseIso((row.proposed_slot as string | null) ?? undefined);
    if (!otherSlot) continue;
    const otherParts = getSlotDateParts(otherSlot);
    if (otherParts.date === date && otherParts.time === time) {
      return false;
    }
  }

  return true;
}

function buildClientEmail(params: {
  clientName: string;
  studioName: string;
  proposedSlot: Date;
  slotExpiresAt: Date;
  artistMessage: string | null;
  clientAppUrl: string;
}): string {
  const when = params.proposedSlot.toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
  const expires = params.slotExpiresAt.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
  const safeName = escapeHtml(params.clientName);
  const safeStudio = escapeHtml(params.studioName);
  const msgBlock = params.artistMessage?.trim()
    ? `<p style="color:#363c3b;font-size:15px;line-height:1.6;margin:0 0 16px;border-left:4px solid #0b5394;padding-left:12px;">${escapeHtml(params.artistMessage.trim())}</p>`
    : "";
  const bodyHtml = `<p style="color:#333333;font-size:16px;line-height:1.55;margin:0 0 12px;">Bonjour <strong>${safeName}</strong>,</p>
    <p style="color:#363c3b;font-size:15px;line-height:1.6;margin:0 0 12px;"><strong>${safeStudio}</strong> a accepté ta demande de projet et te propose un créneau.</p>
    ${msgBlock}
    <p style="color:#363c3b;font-size:15px;line-height:1.6;margin:0 0 8px;"><strong>Créneau proposé :</strong> ${escapeHtml(when)}</p>
    <p style="color:#666666;font-size:13px;line-height:1.5;margin:0 0 20px;">Réponse attendue avant le <strong>${escapeHtml(expires)}</strong> (heure de Paris).</p>
    <p style="color:#666666;font-size:13px;margin:0;">Tu recevras une prochaine étape pour l’acompte une fois le créneau confirmé selon le flux du studio.</p>`;
  return wrapEmailLayout({
    tag: "PROJET ACCEPTÉ",
    title: "Ta demande a été acceptée",
    bodyHtml,
    button: { text: "Voir sur InkFlow", url: params.clientAppUrl },
  });
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized", code: "missing_authorization" }, 401, corsHeaders);
  }
  const accessToken = authHeader.slice(7).trim();
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return jsonResponse({ error: "Server misconfiguration" }, 500, corsHeaders);
  }

  const caller = await getGoTrueUser(SUPABASE_URL, SUPABASE_ANON_KEY, accessToken);
  if (!caller?.id) {
    return jsonResponse({ error: "Session invalide ou expirée", code: "invalid_session" }, 401, corsHeaders);
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
  }

  const projectRequestId = typeof body.project_request_id === "string" ? body.project_request_id.trim() : "";
  if (!projectRequestId) {
    return jsonResponse({ error: "project_request_id requis" }, 400, corsHeaders);
  }

  const proposed = parseIso(body.proposed_slot);
  const expires = parseIso(body.slot_expires_at);
  if (!proposed || !expires) {
    return jsonResponse(
      { error: "proposed_slot et slot_expires_at requis (ISO 8601)" },
      400,
      corsHeaders,
    );
  }
  if (expires.getTime() <= proposed.getTime()) {
    return jsonResponse(
      { error: "slot_expires_at doit être après proposed_slot" },
      400,
      corsHeaders,
    );
  }

  const artistMessage =
    typeof body.artist_message === "string" ? body.artist_message.trim() || null : null;

  const userSb = createSupabaseUserClient(SUPABASE_URL, SUPABASE_ANON_KEY, accessToken);

  const { data: row, error: selErr } = await userSb
    .from("inkflow_project_requests")
    .select("id, studio_id, client_name, client_email, status")
    .eq("id", projectRequestId)
    .maybeSingle();

  if (selErr) {
    console.error("[project-request-accept] select", selErr);
    return jsonResponse({ error: selErr.message }, 400, corsHeaders);
  }
  if (!row) {
    return jsonResponse({ error: "Demande introuvable ou accès refusé" }, 404, corsHeaders);
  }
  if (row.status !== "pending") {
    return jsonResponse(
      { error: "Seules les demandes en attente peuvent être acceptées", status: row.status },
      409,
      corsHeaders,
    );
  }

  try {
    const slotStillAvailable = await isSlotStillAvailable(
      userSb,
      row.studio_id,
      projectRequestId,
      proposed,
    );
    if (!slotStillAvailable) {
      return jsonResponse(
        {
          error:
            "Ce créneau n'est plus disponible. Rechargez les disponibilités avant de proposer une autre date.",
          code: "slot_conflict",
        },
        409,
        corsHeaders,
      );
    }
  } catch (slotError) {
    console.error("[project-request-accept] slot-check", slotError);
    const message =
      slotError instanceof Error ? slotError.message : "Impossible de vérifier la disponibilité";
    return jsonResponse({ error: message, code: "slot_check_failed" }, 400, corsHeaders);
  }

  const { error: upErr } = await userSb
    .from("inkflow_project_requests")
    .update({
      status: "accepted",
      proposed_slot: proposed.toISOString(),
      slot_expires_at: expires.toISOString(),
      artist_message: artistMessage,
    })
    .eq("id", projectRequestId)
    .eq("studio_id", row.studio_id);

  if (upErr) {
    console.error("[project-request-accept] update", upErr);
    return jsonResponse({ error: upErr.message }, 400, corsHeaders);
  }

  const { data: studio } = await userSb
    .from("inkflow_studios")
    .select("studio_name, slug")
    .eq("id", row.studio_id)
    .maybeSingle();

  const studioName = studio?.studio_name?.trim() || "Ton studio";
  const { clientDashboardUrl } = getEmailNavigationBaseUrls();
  const clientAppUrl = clientDashboardUrl;

  const html = buildClientEmail({
    clientName: row.client_name,
    studioName: studioName,
    proposedSlot: proposed,
    slotExpiresAt: expires,
    artistMessage,
    clientAppUrl,
  });

  const subject = `${studioName} — créneau proposé pour ton projet · InkFlow`;

  const sent = await sendEmail({
    to: [row.client_email],
    subject,
    html,
  });
  if (!sent) {
    return jsonResponse(
      {
        ok: true,
        warning: "Demande mise à jour mais l’e-mail client n’a pas pu être envoyé (Resend).",
        project_request_id: projectRequestId,
      },
      200,
      corsHeaders,
    );
  }

  return jsonResponse(
    { ok: true, project_request_id: projectRequestId, email_id: sent.id },
    200,
    corsHeaders,
  );
});
