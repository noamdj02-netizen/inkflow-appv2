/**
 * remind-tattooer-pending-inbox — Digest email tatoueur si demandes en attente (cron).
 * verify_jwt = false — EDGE_CRON_SECRET + x-cron-secret.
 *
 * Règles :
 * - Au moins 1 demande pending (book, agenda ou brief)
 * - La plus ancienne a > 4h
 * - Pas de digest envoyé depuis 24h (pending_inbox_digest_sent_at)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { escapeHtml, wrapEmailLayout, EMAIL_STYLES } from "../_shared/emailLayout.ts";
import { addPreviewBccToPayload } from "../_shared/resend.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { assertCronAuthorized } from "../_shared/cronGate.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const APP_ORIGIN = (Deno.env.get("APP_ORIGIN") || "https://app.ink-flow.me").replace(/\/$/, "");

interface StudioRow {
  id: string;
  email: string;
  studio_name: string | null;
  slug: string | null;
}

interface SettingsRow {
  studio_id: string;
  pending_inbox_digest_sent_at: string | null;
}

function oldestMs(dates: (string | null | undefined)[]): number | null {
  const ts = dates
    .filter((d): d is string => Boolean(d))
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t));
  if (ts.length === 0) return null;
  return Math.min(...ts);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const cronDeny = assertCronAuthorized(req, origin);
  if (cronDeny) return cronDeny;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = Date.now();
  const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const { data: studios, error: stErr } = await admin
    .from("inkflow_studios")
    .select("id, email, studio_name, slug")
    .not("email", "is", null);

  if (stErr) {
    return new Response(JSON.stringify({ error: stErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const results: { studioId: string; status: string; reason?: string }[] = [];

  for (const studio of (studios || []) as StudioRow[]) {
    const to = studio.email?.trim();
    if (!to) {
      results.push({ studioId: studio.id, status: "skipped", reason: "no email" });
      continue;
    }

    const { data: settings } = await admin
      .from("inkflow_user_settings")
      .select("studio_id, pending_inbox_digest_sent_at")
      .eq("studio_id", studio.id)
      .maybeSingle();

    const sentAt = (settings as SettingsRow | null)?.pending_inbox_digest_sent_at;
    if (sentAt && sentAt > twentyFourHoursAgo) {
      results.push({ studioId: studio.id, status: "skipped", reason: "digest < 24h" });
      continue;
    }

    const [bookRes, aptRes, prRes] = await Promise.all([
      admin
        .from("inkflow_bookings")
        .select("id, created_at")
        .eq("studio_id", studio.id)
        .eq("status", "pending"),
      admin
        .from("inkflow_appointments")
        .select("id, created_at")
        .eq("studio_id", studio.id)
        .eq("status", "pending"),
      admin
        .from("inkflow_project_requests")
        .select("id, created_at")
        .eq("studio_id", studio.id)
        .eq("status", "pending"),
    ]);

    const bookN = bookRes.data?.length ?? 0;
    const aptN = aptRes.data?.length ?? 0;
    const prN = prRes.data?.length ?? 0;
    const total = bookN + aptN + prN;

    if (total === 0) {
      results.push({ studioId: studio.id, status: "skipped", reason: "inbox empty" });
      continue;
    }

    const oldest = oldestMs([
      ...(bookRes.data || []).map((r: { created_at: string }) => r.created_at),
      ...(aptRes.data || []).map((r: { created_at: string }) => r.created_at),
      ...(prRes.data || []).map((r: { created_at: string }) => r.created_at),
    ]);

    if (oldest === null || oldest > new Date(fourHoursAgo).getTime()) {
      results.push({ studioId: studio.id, status: "skipped", reason: "too recent" });
      continue;
    }

    const name = escapeHtml(
      (studio.studio_name || studio.email.split("@")[0] || "tatoueur").trim().slice(0, 48),
    );
    const lines: string[] = [];
    if (bookN > 0) lines.push(`<li><strong>${bookN}</strong> réservation(s) page book</li>`);
    if (aptN > 0) lines.push(`<li><strong>${aptN}</strong> créneau(x) agenda</li>`);
    if (prN > 0) lines.push(`<li><strong>${prN}</strong> brief(s) sans date</li>`);

    const bodyHtml = `<ul style="${EMAIL_STYLES.text};margin:0;padding-left:1.25rem;">${lines.join("")}</ul>
      <p style="${EMAIL_STYLES.textMuted};margin:16px 0 0;">Les clients attendent une réponse — traite la plus ancienne en premier.</p>`;

    const html = wrapEmailLayout({
      tag: "DEMANDES EN ATTENTE",
      titleBlue: "Ta boîte",
      titleBlack: "a besoin de toi",
      subtitle: "InkFlow Demandes",
      greetingName: name,
      introLine: `Tu as ${total} élément${total > 1 ? "s" : ""} à traiter dans Demandes.`,
      bodyHtml,
      button: { text: "Ouvrir Demandes", url: `${APP_ORIGIN}/dashboard?tab=requests` },
      hideAppPromo: true,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        addPreviewBccToPayload({
          from: RESEND_FROM,
          to: [to],
          subject: `${total} demande${total > 1 ? "s" : ""} en attente — InkFlow`,
          html,
        }),
      ),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      results.push({ studioId: studio.id, status: "error", reason: txt.slice(0, 200) });
      continue;
    }

    const digestNow = new Date().toISOString();
    await admin.from("inkflow_user_settings").upsert(
      {
        studio_id: studio.id,
        pending_inbox_digest_sent_at: digestNow,
        updated_at: digestNow,
      },
      { onConflict: "studio_id" },
    );

    results.push({ studioId: studio.id, status: "sent" });
  }

  return new Response(JSON.stringify({ studios: studios?.length ?? 0, results }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
