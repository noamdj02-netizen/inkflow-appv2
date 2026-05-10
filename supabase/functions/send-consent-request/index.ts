/**
 * Envoie ou prépare l’envoi du lien de consentement signable pour un RDV (inkflow_consent_forms + appointment_id).
 * Mail : Resend. SMS : Twilio (desktop / option) ou handoff natif (mobile) avec smsBody + toE164 renvoyés au client.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { wrapEmailLayout, getAppUrl } from "../_shared/emailLayout.ts";
import { addPreviewBccToPayload } from "../_shared/resend.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitByIp, verifyTattooerOwnsStudio } from "../_shared/edgeInvokeAuth.ts";
import { normalizePhoneToE164Fr } from "../_shared/phoneE164.ts";
import { sendTwilioTransactionalSms } from "../_shared/twilioSms.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = (Deno.env.get("SUPABASE_ANON_KEY") || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface Payload {
  studioId: string;
  appointmentId: string;
  channel: "email" | "sms";
  /** sms + natif = lien préparé + timestamp ; sms + twilio = envoi Twilio */
  smsDelivery?: "native" | "twilio";
  template: string;
  title: string;
  studioName?: string;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (!rateLimitByIp(req, "send-consent-request", 60)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload = (await req.json()) as Payload;
    const studioId = payload.studioId?.trim();
    const appointmentId = payload.appointmentId?.trim();
    const template = (payload.template || "").trim();
    const title = (payload.title || "Consentement tatouage").trim();

    if (!studioId || !appointmentId || !template) {
      return new Response(
        JSON.stringify({ error: "studioId, appointmentId and template are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const allowed = await verifyTattooerOwnsStudio(
      req,
      studioId,
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY,
    );
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: apt, error: aptErr } = await admin
      .from("inkflow_appointments")
      .select("id, studio_id, client_name, client_email, client_phone")
      .eq("id", appointmentId)
      .maybeSingle();

    if (aptErr || !apt || String(apt.studio_id) !== studioId) {
      return new Response(JSON.stringify({ error: "Appointment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let studioLabel = (payload.studioName || "").trim();
    if (!studioLabel) {
      const { data: st } = await admin
        .from("inkflow_studios")
        .select("name, studio_name")
        .eq("id", studioId)
        .maybeSingle();
      const r = st as { name?: string | null; studio_name?: string | null } | null;
      studioLabel = String(r?.studio_name || r?.name || "Ton studio").trim();
    }

    const clientName = String(apt.client_name || "Client").trim() || "Client";
    const clientEmail = String(apt.client_email || "").trim();
    const clientPhone = apt.client_phone as string | null | undefined;

    const { data: existingList, error: exErr } = await admin
      .from("inkflow_consent_forms")
      .select("id")
      .eq("studio_id", studioId)
      .eq("appointment_id", appointmentId)
      .is("signed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (exErr) {
      console.error("[send-consent-request] select existing", exErr);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const existingId = existingList?.[0] && typeof (existingList[0] as { id: string }).id === "string"
      ? (existingList[0] as { id: string }).id
      : null;

    let consentFormId: string;

    if (existingId) {
      consentFormId = existingId;
      const patch: Record<string, string> = {
        client_name: clientName,
        template,
      };
      if (clientEmail) patch.client_email = clientEmail;
      const { error: upErr } = await admin
        .from("inkflow_consent_forms")
        .update(patch)
        .eq("id", consentFormId)
        .eq("studio_id", studioId);
      if (upErr) {
        console.error("[send-consent-request] update", upErr);
        return new Response(JSON.stringify({ error: "Could not update consent form" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    } else {
      if (!clientEmail) {
        return new Response(
          JSON.stringify({
            error: "client_email_required",
            userMessage:
              "Ajoute l’e-mail client sur le rendez-vous avant de créer le formulaire de consentement.",
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      consentFormId = `cf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const { error: insErr } = await admin.from("inkflow_consent_forms").insert({
        id: consentFormId,
        studio_id: studioId,
        appointment_id: appointmentId,
        client_name: clientName,
        client_email: clientEmail,
        template,
      });
      if (insErr) {
        console.error("[send-consent-request] insert", insErr);
        return new Response(JSON.stringify({ error: "Could not create consent form" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const appUrl = getAppUrl();
    const signUrl = `${appUrl}/consent/${encodeURIComponent(consentFormId)}`;

    const markOutreach = async (channel: "email" | "sms") => {
      const { error: markErr } = await admin
        .from("inkflow_consent_forms")
        .update({
          consent_outreach_sent_at: new Date().toISOString(),
          consent_outreach_channel: channel,
        })
        .eq("id", consentFormId)
        .eq("studio_id", studioId);
      if (markErr) console.error("[send-consent-request] mark outreach", markErr);
    };

    if (payload.channel === "email") {
      if (!clientEmail) {
        return new Response(
          JSON.stringify({
            error: "client_email_required",
            userMessage: "Ajoute l’e-mail client sur le RDV pour envoyer par mail.",
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      if (!RESEND_API_KEY) {
        return new Response(JSON.stringify({ error: "resend_not_configured" }), {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const html = wrapEmailLayout({
        tag: "CONSENTEMENT",
        title: `Formulaire — ${title}`,
        greetingName: clientName,
        introLine: `${studioLabel} te demande de signer le formulaire de consentement avant ta séance.`,
        bodyHtml:
          `<p style="margin:0;font-size:16px;color:#363c3b;line-height:1.6;font-family:Outfit, Helvetica, Arial, sans-serif;">` +
          `Clique sur le bouton ci-dessous pour lire et signer en ligne. Le lien est personnel.` +
          `</p>`,
        button: { text: "Signer le consentement", url: signUrl },
        preheader: `Signe ton consentement pour ${studioLabel}.`,
      });

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          addPreviewBccToPayload({
            from: RESEND_FROM,
            to: [clientEmail],
            subject: `Consentement tatouage — ${studioLabel}`,
            html,
          }),
        ),
      });

      if (!resendRes.ok) {
        const errBody = await resendRes.text();
        console.error("Resend error:", resendRes.status, errBody);
        return new Response(
          JSON.stringify({ error: "Email send failed", details: errBody.slice(0, 300) }),
          { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      await markOutreach("email");

      return new Response(
        JSON.stringify({ success: true, consentFormId, signUrl, channel: "email" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // SMS
    const e164 = normalizePhoneToE164Fr(clientPhone || undefined);
    if (!e164) {
      return new Response(
        JSON.stringify({
          error: "phone_required",
          userMessage:
            "Ajoute un numéro de mobile valide (France) sur le RDV pour envoyer par SMS.",
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const smsBody =
      `Bonjour ${clientName}, signe ton consentement ${studioLabel} : ${signUrl}`.slice(0, 1520);

    const smsDelivery = payload.smsDelivery === "native" ? "native" : "twilio";

    if (smsDelivery === "native") {
      await markOutreach("sms");
      return new Response(
        JSON.stringify({
          success: true,
          consentFormId,
          signUrl,
          smsBody,
          toE164: e164,
          channel: "sms",
          smsDelivery: "native",
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const twilio = await sendTwilioTransactionalSms({ toE164: e164, body: smsBody });
    if (!twilio.ok) {
      if (twilio.error === "twilio_not_configured") {
        return new Response(
          JSON.stringify({
            error: twilio.error,
            userMessage:
              "SMS serveur indisponible (Twilio non configuré). Utilise l’e-mail ou ouvre Messages sur ton téléphone.",
          }),
          { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      return new Response(
        JSON.stringify({ error: twilio.error || "sms_failed" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    await markOutreach("sms");

    return new Response(
      JSON.stringify({
        success: true,
        consentFormId,
        signUrl,
        channel: "sms",
        smsDelivery: "twilio",
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    console.error("send-consent-request", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...getCorsHeaders(req.headers.get("origin")) },
    });
  }
});
