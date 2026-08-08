/**
 * Edge Function — génération facture PDF idempotente (post-paiement Stripe ou rattrapage).
 * Storage : inkflow-assets/client-dossier/{studioId}/{clientId}/{num_facture}.pdf
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { isServiceRoleOrInternalSecret } from "../_shared/edgeInvokeAuth.ts";
import {
  buildPaymentFacturePdfBytes,
  edgeFacturePdfFilename,
  type EdgePaymentInvoiceKind,
} from "../_shared/paymentFacturePdf.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const BUCKET = "inkflow-assets";
const DOSSIER_ROOT = "client-dossier";

interface Payload {
  studioId: string;
  appointmentId: string;
  paymentKind: EdgePaymentInvoiceKind;
  amountPaidEur?: number;
  paymentReference?: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsResponse(corsHeaders);
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!SERVICE_KEY) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const serviceOk = isServiceRoleOrInternalSecret(req, SERVICE_KEY);
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const studioId = (body.studioId || "").trim();
  const appointmentId = (body.appointmentId || "").trim();
  const paymentKind = body.paymentKind;

  if (!studioId || !appointmentId || !paymentKind) {
    return new Response(
      JSON.stringify({ error: "Missing studioId, appointmentId or paymentKind" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  if (!serviceOk) {
    const authHeader = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: `Bearer ${authHeader}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: studioRow } = await admin
      .from("inkflow_studios")
      .select("id")
      .eq("id", studioId)
      .eq("email", userData.user.email)
      .maybeSingle();
    if (!studioRow?.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  /** Idempotence : encaissement manuel (`manual_balance`) avant webhook `balance`. */
  if (paymentKind === "balance") {
    const { data: manualRow } = await admin
      .from("inkflow_payment_invoices")
      .select("document_number, storage_path, public_url")
      .eq("studio_id", studioId)
      .eq("appointment_id", appointmentId)
      .eq("payment_kind", "manual_balance")
      .maybeSingle();
    if (manualRow?.storage_path && manualRow.public_url) {
      return new Response(
        JSON.stringify({
          ok: true,
          skipped: true,
          reason: "manual_balance_exists",
          documentNumber: manualRow.document_number,
          storagePath: manualRow.storage_path,
          publicUrl: manualRow.public_url,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  const { data: existing } = await admin
    .from("inkflow_payment_invoices")
    .select("document_number, storage_path, public_url")
    .eq("studio_id", studioId)
    .eq("appointment_id", appointmentId)
    .eq("payment_kind", paymentKind)
    .maybeSingle();

  if (existing?.storage_path && existing.public_url) {
    return new Response(
      JSON.stringify({
        ok: true,
        skipped: true,
        documentNumber: existing.document_number,
        storagePath: existing.storage_path,
        publicUrl: existing.public_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { data: apt, error: aptErr } = await admin
    .from("inkflow_appointments")
    .select(
      "id, studio_id, client_id, client_name, client_email, date, time, duration, service, price, deposit, deposit_paid, tattoo_type",
    )
    .eq("id", appointmentId)
    .eq("studio_id", studioId)
    .maybeSingle();

  if (aptErr || !apt) {
    return new Response(JSON.stringify({ error: "Appointment not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: studio } = await admin
    .from("inkflow_studios")
    .select("studio_name, email, siret")
    .eq("id", studioId)
    .maybeSingle();

  const total = Number(apt.price) || 0;
  const deposit = Number(apt.deposit) || 0;
  const depositPaid = apt.deposit_paid === true;
  const depositApplied = depositPaid ? Math.min(deposit, total) : 0;
  const amountPaid =
    typeof body.amountPaidEur === "number" && body.amountPaidEur > 0
      ? body.amountPaidEur
      : paymentKind === "deposit"
        ? Math.min(deposit, total)
        : paymentKind === "balance" || paymentKind === "manual_balance"
          ? Math.max(0, Math.round((total - depositApplied) * 100) / 100)
          : total;

  const built = buildPaymentFacturePdfBytes({
    studioName: String(studio?.studio_name || "Studio"),
    artistName: String(studio?.studio_name || "—"),
    studioEmail: studio?.email as string | null,
    studioSiret: studio?.siret as string | null,
    clientName: String(apt.client_name || "Client"),
    clientEmail: apt.client_email as string | null,
    appointmentId,
    date: String(apt.date),
    time: String(apt.time || "09:00"),
    duration: Number(apt.duration) || 60,
    service: String(apt.service || "Séance"),
    tattooType: apt.tattoo_type as string | null,
    price: total,
    deposit,
    depositPaid,
    paymentKind,
    amountPaidNow: amountPaid,
  });

  const clientId = (apt.client_id as string | null)?.trim() || "";
  let storagePath: string | null = null;
  let publicUrl: string | null = null;
  const filename = edgeFacturePdfFilename(built.documentNumber);

  if (clientId) {
    storagePath = `${DOSSIER_ROOT}/${studioId}/${clientId}/${filename}`;
    const blob = new Blob([built.bytes], { type: "application/pdf" });
    const { error: upErr } = await admin.storage.from(BUCKET).upload(storagePath, blob, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (upErr) {
      console.error("[generate-payment-invoice] storage:", upErr.message);
    } else {
      const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
      publicUrl = urlData.publicUrl;
    }
  }

  const paymentReference =
    (body.paymentReference || "").trim() || `server-${new Date().toISOString()}`;

  const { error: insErr } = await admin.from("inkflow_payment_invoices").upsert(
    {
      studio_id: studioId,
      appointment_id: appointmentId,
      client_id: clientId || null,
      payment_kind: paymentKind,
      payment_reference: paymentReference,
      document_number: built.documentNumber,
      storage_path: storagePath,
      public_url: publicUrl,
      amount_paid_eur: amountPaid,
      total_eur: total,
      deposit_eur: deposit,
    },
    { onConflict: "studio_id,appointment_id,payment_kind" },
  );

  if (insErr) {
    console.error("[generate-payment-invoice] db:", insErr.message);
    return new Response(JSON.stringify({ error: insErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      documentNumber: built.documentNumber,
      filename,
      storagePath,
      publicUrl,
      savedToDossier: Boolean(storagePath),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
