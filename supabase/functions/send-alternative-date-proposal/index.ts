/**
 * E-mail au client : contre-proposition de date (sans messagerie intégrée).
 * Expéditeur InkFlow, Reply-To = e-mail pro du tatoueur si fourni.
 */

import { wrapEmailLayout, escapeHtml, getEmailNavigationBaseUrls } from "../_shared/emailLayout.ts";
import { addPreviewBccToPayload } from "../_shared/resend.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getGoTrueUser } from "../_shared/supabaseAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";

interface Payload {
  clientEmail: string;
  clientName: string;
  studioName: string;
  proposedDate: string;
  proposedTime: string | null;
  /** Contexte lisible (ex. date initialement demandée par le client) */
  previousContext?: string;
  /** Réponses du client vers cette adresse (boîte pro) */
  replyToEmail?: string;
}

function formatTimeLabel(t: string | null): string {
  if (!t) return "";
  const s = String(t).toLowerCase();
  if (s === "morning") return "Matin";
  if (s === "afternoon") return "Après-midi";
  if (s === "evening") return "Soirée";
  return t;
}

function formatDateDisplay(requestedDate: string, requestedTime: string | null): string {
  const dateStr = requestedDate
    ? new Date(requestedDate + "T12:00:00").toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "";
  const timeStr = formatTimeLabel(requestedTime);
  return timeStr ? `${dateStr} — ${timeStr}` : dateStr;
}

function isValidDateYmd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T12:00:00"));
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders },
  });
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed", allowed: ["POST"] }, 405, corsHeaders);
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
    return jsonResponse(
      { error: "Session invalide ou expirée", code: "invalid_session" },
      401,
      corsHeaders,
    );
  }

  try {
    let payload: Payload;
    try {
      payload = await req.json() as Payload;
    } catch {
      return jsonResponse({ error: "Invalid or empty JSON body" }, 400, corsHeaders);
    }
    const missing: string[] = [];
    if (!payload?.clientEmail?.trim?.()) missing.push("clientEmail");
    if (!payload?.clientName?.trim?.()) missing.push("clientName");
    if (!payload?.studioName?.trim?.()) missing.push("studioName");
    if (!payload?.proposedDate?.trim?.()) missing.push("proposedDate");
    if (missing.length > 0) {
      return jsonResponse({ error: "Champs requis manquants", missing }, 400, corsHeaders);
    }
    if (!isValidDateYmd(payload.proposedDate)) {
      return jsonResponse({ error: "proposedDate invalide (attendu YYYY-MM-DD)" }, 400, corsHeaders);
    }

    if (!RESEND_API_KEY) {
      return jsonResponse(
        { error: "Email service not configured", userMessage: "RESEND_API_KEY manquant côté Edge Function." },
        500,
        corsHeaders,
      );
    }

    const when = formatDateDisplay(payload.proposedDate, payload.proposedTime ?? null);
    const safeClient = escapeHtml(payload.clientName.trim());
    const safeStudio = escapeHtml(payload.studioName.trim());
    const safeWhen = escapeHtml(when);
    const prev = payload.previousContext?.trim();
    const prevBlock = prev
      ? `<p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 12px;">Créneau initialement envisagé : <strong>${escapeHtml(prev)}</strong></p>`
      : "";

    const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;">Bonjour <strong>${safeClient}</strong>,</p>
      ${prevBlock}
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 16px;"><strong>${safeStudio}</strong> te propose une autre date pour ton rendez-vous :</p>
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#F0F0F0;border-radius:12px;margin:0 0 16px;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0;font-size:14px;color:#6b7280;font-weight:600;">Nouvelle proposition</p>
          <p style="margin:8px 0 0;font-size:18px;color:#111827;font-weight:600;">${safeWhen}</p>
        </td></tr>
      </table>
      <p style="color:#525252;font-size:14px;line-height:1.6;margin:0 0 8px;">Tu peux <strong>confirmer ou proposer un autre créneau</strong> en répondant à ce message (ton retour part vers le studio).</p>
      <p style="color:#666666;font-size:13px;line-height:1.5;margin:0;">Tu peux aussi ouvrir InkFlow : bouton ci-dessous pour voir tes rendez-vous dans l&apos;espace client.</p>`;

    const { clientDashboardUrl } = getEmailNavigationBaseUrls();
    const replyTo = payload.replyToEmail?.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mailtoStudio =
      replyTo && emailRegex.test(replyTo)
        ? `mailto:${replyTo}?subject=${encodeURIComponent("Re: Proposition de date — InkFlow")}`
        : "";

    const html = wrapEmailLayout({
      titleBlue: "Autre",
      titleBlack: "date proposée",
      title: "Autre date proposée",
      subtitle: "Le studio te propose un nouveau créneau — réponds par mail ou depuis l’app.",
      bodyHtml,
      button: { text: "Ouvrir mon espace client", url: clientDashboardUrl },
      ...(mailtoStudio
        ? { secondaryButton: { text: "Répondre au studio (e-mail)", url: mailtoStudio } }
        : {}),
      buttonSubtext:
        "Le bouton bleu ouvre l’espace client. « Répondre » dans ta messagerie envoie ta réponse directement au studio.",
    });

    const subject = `Proposition de date — ${payload.studioName.trim()}`;

    const resendBody: Record<string, unknown> = addPreviewBccToPayload({
      from: RESEND_FROM,
      to: [payload.clientEmail.trim()],
      subject,
      html,
    });
    if (replyTo && emailRegex.test(replyTo)) {
      resendBody.reply_to = replyTo;
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendBody),
    });

    const resendText = await resendRes.text();
    let resendJson: { id?: string } = {};
    if (resendText) {
      try {
        resendJson = JSON.parse(resendText) as { id?: string };
      } catch {
        /* non-JSON error body from Resend */
      }
    }

    if (!resendRes.ok) {
      console.error("[send-alternative-date-proposal] Resend:", resendRes.status, resendText);
      return jsonResponse(
        {
          error: "Email send failed",
          details: resendText.length > 2000 ? `${resendText.slice(0, 2000)}…` : resendText,
          status: resendRes.status,
        },
        502,
        corsHeaders,
      );
    }

    return jsonResponse(
      { success: true, emailId: resendJson.id ?? null },
      200,
      corsHeaders,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[send-alternative-date-proposal]", err);
    return jsonResponse(
      {
        error: "Internal server error",
        userMessage: message.length > 300 ? `${message.slice(0, 300)}…` : message,
      },
      500,
      corsHeaders,
    );
  }
});
