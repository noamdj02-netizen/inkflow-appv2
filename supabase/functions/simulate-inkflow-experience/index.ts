/**
 * Mode Simulation Inkflow — UNIQUEMENT pour noamdj02@gmail.com (compte test produit).
 * Envoie des emails / notifications fictifs pour valider les templates sur mobile (PWA).
 *
 * Déploiement : supabase functions deploy simulate-inkflow-experience
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/resend.ts";
import { wrapEmailLayout, escapeHtml, emailInfoBox } from "../_shared/emailLayout.ts";

const ALLOWED_EMAIL = "noamdj02@gmail.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_URL = (Deno.env.get("APP_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");

/** Données fictives réalistes (Thomas / manchette / 450 €) */
const DEMO = {
  clientName: "Thomas Bernard",
  description: "Manchette florale — réalisme botanique, préférence avant-bras gauche.",
  budget: "450 €",
  placement: "Avant-bras gauche",
  requestedDate: "2026-04-15",
  requestedTime: "14:00",
  promoCode: "INKFLOW80",
};

type Step = { name: string; ok: boolean; detail?: string };

async function getUserEmailFromJwt(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const jwt = auth.slice(7);
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

async function invokeEdgeFunction(name: string, body: Record<string, unknown>): Promise<Step> {
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    return { name, ok: false, detail: `${res.status} ${text.slice(0, 400)}` };
  }
  return { name, ok: true, detail: text.slice(0, 120) };
}

function buildReminder24hHtml(studioName: string): string {
  const safeStudio = escapeHtml(studioName);
  const apt = {
    client_name: DEMO.clientName,
    service: "Manchette florale",
    date: DEMO.requestedDate,
    time: DEMO.requestedTime,
  };
  const infoContent = `<p style="margin:0 0 8px;color:#171717;font-size:14px;"><strong>Service :</strong> ${escapeHtml(String(apt.service))}</p>
        <p style="margin:0 0 8px;color:#171717;font-size:14px;"><strong>Date :</strong> ${escapeHtml(String(apt.date))}</p>
        <p style="margin:0;color:#171717;font-size:14px;"><strong>Heure :</strong> ${escapeHtml(String(apt.time))}</p>`;
  const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;">Salut <strong>${escapeHtml(String(apt.client_name))}</strong>,</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 16px;">Rappel : ton rendez-vous chez <strong>${safeStudio}</strong> est prévu <strong>demain</strong>.</p>
      ${emailInfoBox(infoContent)}
      <p style="color:#737373;font-size:13px;margin:0;text-align:center;">En cas d'empêchement, contacte le studio au plus vite.</p>`;
  return wrapEmailLayout({ title: "Rappel RDV demain", bodyHtml });
}

function buildCancellationHtml(studioName: string, vitrinePath: string): string {
  const safeStudio = escapeHtml(studioName);
  const safeClient = escapeHtml(DEMO.clientName);
  const dateLabel = new Date(DEMO.requestedDate + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;">Bonjour <strong>${safeClient}</strong>,</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 16px;">Le rendez-vous du <strong>${escapeHtml(dateLabel)}</strong> chez <strong>${safeStudio}</strong> a été annulé. Le créneau a été libéré dans notre calendrier.</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0;">Pour reprendre contact ou réserver un autre créneau, utilisez la vitrine ou répondez à cet email.</p>`;
  return wrapEmailLayout({
    titleBlue: "RDV",
    titleBlack: "annulé",
    title: "RDV annulé",
    subtitle: "Votre calendrier a été mis à jour",
    bodyHtml,
    button: { text: "Voir la vitrine", url: `${APP_URL}${vitrinePath}` },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return corsResponse(origin);
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const userEmail = await getUserEmailFromJwt(req);
  if (!userEmail || userEmail.toLowerCase().trim() !== ALLOWED_EMAIL) {
    return new Response(
      JSON.stringify({ error: "Accès réservé au compte de simulation Inkflow." }),
      { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
  const canonicalEmail = userEmail.toLowerCase().trim();

  let action: string;
  try {
    const body = (await req.json()) as { action?: string };
    action = body.action || "";
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalide" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: studio, error: studioErr } = await admin
    .from("inkflow_studios")
    .select("id, studio_name, name, slug, email")
    .eq("email", canonicalEmail)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (studioErr || !studio?.id) {
    return new Response(
      JSON.stringify({
        error: "Studio introuvable pour ce compte. Ouvrez le dashboard une fois pour créer le studio.",
      }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const studioId = studio.id as string;
  const studioName = (studio.studio_name as string) || (studio.name as string) || "Studio InkFlow";
  const slug = (studio.slug as string) || "demo";
  const vitrinePath = `/studio/${slug}`;

  const steps: Step[] = [];

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  try {
    if (action === "loyalty_only") {
      const s = await invokeEdgeFunction("send-stamp-reward-email", {
        studioId,
        clientEmail: canonicalEmail,
        clientName: DEMO.clientName,
        amountEuros: 80,
        promoCode: DEMO.promoCode,
      });
      steps.push(s);
      return new Response(JSON.stringify({ ok: true, steps }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "day_notifications") {
      const rows = [
        {
          title: "Nouveau message de Thomas",
          message: "Bonjour, je confirme la manchette florale — 450 €. Dispo jeudi ?",
          type: "message",
          action_url: "/messagerie",
        },
        {
          title: "Acompte reçu — Thomas Bernard",
          message: "Un acompte de 150 € vient d’être encaissé.",
          type: "payment",
          action_url: "/finance",
        },
        {
          title: "Rappel : RDV demain 14h",
          message: "Manchette florale — pensez à envoyer le consentement signé.",
          type: "reminder",
          action_url: "/rendez-vous",
        },
        {
          title: "Nouvelle demande vitrine",
          message: "Thomas — manchette florale, budget indicatif 450 €.",
          type: "booking",
          action_url: "/requests",
        },
        {
          title: "Synchro calendrier Google",
          message: "3 créneaux mis à jour depuis Google Calendar.",
          type: "reminder",
          action_url: "/parametres",
        },
      ];
      for (const r of rows) {
        const { error: insErr } = await admin.from("inkflow_notifications").insert({
          id: crypto.randomUUID(),
          studio_id: studioId,
          type: r.type,
          title: r.title,
          message: r.message,
          read: false,
          action_url: r.action_url,
          created_at: new Date().toISOString(),
        } as never);
        steps.push({
          name: `in_app:${r.title.slice(0, 24)}`,
          ok: !insErr,
          detail: insErr?.message,
        });
      }
      return new Response(JSON.stringify({ ok: true, steps }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "welcome_pack") {
      steps.push(
        await invokeEdgeFunction("send-booking-confirmation", {
          clientEmail: canonicalEmail,
          clientName: DEMO.clientName,
          studioName,
          requestedDate: DEMO.requestedDate,
          requestedTime: DEMO.requestedTime,
          description: DEMO.description,
          conversationLink: `${APP_URL}/dashboard?tab=messagerie`,
        }),
      );
      await delay(150);

      const reminderHtml = buildReminder24hHtml(studioName);
      const rem = await sendEmail({
        to: [canonicalEmail],
        subject: `Rappel RDV demain - ${studioName} [simulation]`,
        html: reminderHtml,
      });
      steps.push({
        name: "sendEmail:reminder_24h",
        ok: rem != null,
        detail: rem ? undefined : "Resend a refusé",
      });
      await delay(150);

      steps.push(
        await invokeEdgeFunction("send-project-notification", {
          studioId,
          clientName: DEMO.clientName,
          clientEmail: canonicalEmail,
          description: DEMO.description,
          placement: DEMO.placement,
          budget: DEMO.budget,
        }),
      );
      await delay(150);

      steps.push(
        await invokeEdgeFunction("notify-new-booking", {
          bookingId: crypto.randomUUID(),
          studioId,
          clientName: DEMO.clientName,
          clientEmail: "client.simulation@example.com",
          description: DEMO.description,
          requestedDate: DEMO.requestedDate,
          requestedTime: DEMO.requestedTime,
        }),
      );
      await delay(150);

      steps.push(
        await invokeEdgeFunction("send-stamp-reward-email", {
          studioId,
          clientEmail: canonicalEmail,
          clientName: DEMO.clientName,
          amountEuros: 80,
          promoCode: DEMO.promoCode,
        }),
      );
      await delay(150);

      const cancelHtml = buildCancellationHtml(studioName, vitrinePath);
      const cancel = await sendEmail({
        to: [canonicalEmail],
        subject: `Votre rendez-vous a été annulé — ${studioName} [simulation]`,
        html: cancelHtml,
      });
      steps.push({
        name: "sendEmail:cancellation",
        ok: cancel != null,
        detail: cancel ? undefined : "Resend a refusé",
      });

      return new Response(JSON.stringify({ ok: true, steps }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ error: "action inconnue (welcome_pack | day_notifications | loyalty_only)" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (e) {
    console.error("[simulate-inkflow-experience]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
