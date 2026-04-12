/**
 * E-mail au client : contre-proposition de date (sans messagerie intégrée).
 * Expéditeur InkFlow, Reply-To = e-mail pro du tatoueur si fourni.
 */

import { wrapEmailLayout, escapeHtml } from "../_shared/emailLayout.ts";
import { addPreviewBccToPayload } from "../_shared/resend.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

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

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload: Payload = await req.json();
    const missing: string[] = [];
    if (!payload?.clientEmail?.trim?.()) missing.push("clientEmail");
    if (!payload?.clientName?.trim?.()) missing.push("clientName");
    if (!payload?.studioName?.trim?.()) missing.push("studioName");
    if (!payload?.proposedDate?.trim?.()) missing.push("proposedDate");
    if (missing.length > 0) {
      return new Response(JSON.stringify({ error: "Champs requis manquants", missing }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!isValidDateYmd(payload.proposedDate)) {
      return new Response(JSON.stringify({ error: "proposedDate invalide (attendu YYYY-MM-DD)" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
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
      <p style="color:#525252;font-size:14px;line-height:1.6;margin:0;">Réponds directement à cet e-mail pour confirmer ou proposer un autre créneau. Ton message est adressé au studio.</p>`;

    const html = wrapEmailLayout({
      titleBlue: "Autre",
      titleBlack: "date proposée",
      title: "Autre date proposée",
      subtitle: "Gestion des reports simplifiée — sans discussion inutile.",
      bodyHtml,
    });

    const subject = `Proposition de date — ${payload.studioName.trim()}`;

    const replyTo = payload.replyToEmail?.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("[send-alternative-date-proposal] Resend:", resendRes.status, errBody);
      return new Response(JSON.stringify({ error: "Email send failed", details: errBody }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const result = await resendRes.json();
    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("[send-alternative-date-proposal]", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
