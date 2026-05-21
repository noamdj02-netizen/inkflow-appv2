/**
 * Orchestrateur — encaissement manuel dashboard.
 * 1. Marque le solde payé en BDD (si besoin)
 * 2. Génère le PDF (`generateFacturePdf`)
 * 3. Upload Storage `client-dossier/{studioId}/{clientId}/{num_facture}.pdf`
 * 4. Journal `inkflow_payment_invoices`
 * 5. Téléchargement immédiat pour le tatoueur
 */
import { supabase } from '../supabase';
import type { Appointment, User } from '../../types';
import { appointmentRemainingBalanceEuros } from '../appointmentBalance';
import { generateFacturePdf } from '../generateFacturePdf';
import { markBalanceAsPaid } from '../supabaseDashboard';
import {
  factureDocumentNumber,
  isReceiptPaymentKind,
  receiptDocumentNumber,
} from './documentNumber';
import { resolveClientIdForAppointment } from '../resolveClientIdForAppointment';
import type {
  HandleClientPaymentSuccessParams,
  PaymentAutomationResult,
  PaymentInvoiceKind,
  PaymentInvoiceRow,
} from './types';

const APT_SELECT =
  'id,studio_id,client_id,client_name,client_email,client_phone,date,time,service,duration,price,deposit,deposit_paid,balance_paid_at,status,tattoo_type';

async function fetchExistingInvoice(
  studioId: string,
  appointmentId: string,
  paymentKind: PaymentInvoiceKind
): Promise<PaymentInvoiceRow | null> {
  const { data, error } = await supabase
    .from('inkflow_payment_invoices')
    .select('*')
    .eq('studio_id', studioId)
    .eq('appointment_id', appointmentId)
    .eq('payment_kind', paymentKind)
    .maybeSingle();

  if (error || !data) return null;
  return data as PaymentInvoiceRow;
}

/** Évite doublon si encaissement manuel puis webhook Stripe `balance`. */
async function fetchAnyBalanceInvoice(
  studioId: string,
  appointmentId: string
): Promise<PaymentInvoiceRow | null> {
  const { data } = await supabase
    .from('inkflow_payment_invoices')
    .select('*')
    .eq('studio_id', studioId)
    .eq('appointment_id', appointmentId)
    .in('payment_kind', ['balance', 'manual_balance'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as PaymentInvoiceRow | null) ?? null;
}

async function persistInvoiceRow(params: {
  studioId: string;
  appointmentId: string;
  clientId: string | null;
  paymentKind: PaymentInvoiceKind;
  paymentReference: string | null;
  documentNumber: string;
  storagePath: string | null;
  publicUrl: string | null;
  amountPaidEur: number;
  totalEur: number;
  depositEur: number;
}): Promise<{ error?: string }> {
  const { error } = await supabase.from('inkflow_payment_invoices').upsert(
    {
      studio_id: params.studioId,
      appointment_id: params.appointmentId,
      client_id: params.clientId,
      payment_kind: params.paymentKind,
      payment_reference: params.paymentReference,
      document_number: params.documentNumber,
      storage_path: params.storagePath,
      public_url: params.publicUrl,
      amount_paid_eur: params.amountPaidEur,
      total_eur: params.totalEur,
      deposit_eur: params.depositEur,
    },
    { onConflict: 'studio_id,appointment_id,payment_kind' }
  );

  if (error) return { error: error.message };
  return {};
}

function mapAppointmentRow(aptRow: Record<string, unknown>): Appointment {
  const now = new Date().toISOString();
  return {
    id: String(aptRow.id),
    clientId: String(aptRow.client_id || ''),
    clientName: String(aptRow.client_name || 'Client'),
    clientEmail: String(aptRow.client_email || ''),
    clientPhone: String(aptRow.client_phone || ''),
    date: String(aptRow.date),
    time: String(aptRow.time || '09:00'),
    service: String(aptRow.service || 'Séance'),
    duration: Number(aptRow.duration) || 60,
    price: Number(aptRow.price) || 0,
    deposit: Number(aptRow.deposit) || 0,
    depositPaid: aptRow.deposit_paid === true,
    balancePaidAt: (aptRow.balance_paid_at as string) || null,
    status: aptRow.status as Appointment['status'],
    tattooType: (aptRow.tattoo_type as 'custom' | 'flash') || 'custom',
    location: 'other',
    size: 'medium',
    consentFormSigned: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Point d’entrée unique côté client après « Encaisser + facture PDF ».
 */
export async function handleClientPaymentSuccess(
  params: HandleClientPaymentSuccessParams & { artist: User }
): Promise<PaymentAutomationResult> {
  const {
    appointmentId,
    studioId,
    artist,
    paymentKind,
    amountPaidEur,
    paymentReference,
    downloadPdf = true,
    skipIfExists = true,
  } = params;

  const { data: aptRow, error: aptErr } = await supabase
    .from('inkflow_appointments')
    .select(APT_SELECT)
    .eq('id', appointmentId)
    .eq('studio_id', studioId)
    .maybeSingle();

  if (aptErr || !aptRow) {
    return {
      ok: false,
      reason: aptErr?.message || 'Rendez-vous introuvable',
      savedToDossier: false,
      downloaded: false,
    };
  }

  const appointment = mapAppointmentRow(aptRow as Record<string, unknown>);

  if (
    (paymentKind === 'balance' || paymentKind === 'manual_balance') &&
    !appointment.balancePaidAt
  ) {
    const paidAt = new Date().toISOString();
    try {
      await markBalanceAsPaid(appointmentId, studioId, paidAt);
      appointment.balancePaidAt = paidAt;
    } catch (e) {
      return {
        ok: false,
        reason: e instanceof Error ? e.message : 'Impossible de marquer le solde payé',
        savedToDossier: false,
        downloaded: false,
      };
    }
  }

  if (skipIfExists) {
    const existing =
      paymentKind === 'manual_balance' || paymentKind === 'balance'
        ? await fetchAnyBalanceInvoice(studioId, appointmentId)
        : await fetchExistingInvoice(studioId, appointmentId, paymentKind);
    if (existing?.storage_path && existing.public_url) {
      return {
        ok: true,
        skipped: true,
        documentNumber: existing.document_number,
        storagePath: existing.storage_path,
        publicUrl: existing.public_url,
        savedToDossier: true,
        downloaded: false,
      };
    }
  }

  const { data: studioRow } = await supabase
    .from('inkflow_studios')
    .select('siret')
    .eq('id', studioId)
    .maybeSingle();

  const paidNow =
    amountPaidEur > 0
      ? amountPaidEur
      : paymentKind === 'balance' || paymentKind === 'manual_balance'
        ? appointmentRemainingBalanceEuros(appointment)
        : paymentKind === 'deposit'
          ? Math.min(appointment.deposit, appointment.price)
          : appointment.price;

  const resolvedClientId = await resolveClientIdForAppointment(studioId, appointment);
  const appointmentForPdf = resolvedClientId
    ? { ...appointment, clientId: resolvedClientId }
    : appointment;

  const pdfResult = await generateFacturePdf({
    appointment: appointmentForPdf,
    artist,
    studioId,
    paymentKind,
    amountPaidNow: paidNow,
    studioSiret: (studioRow?.siret as string) || null,
    downloadPdf,
  });

  const docNum =
    pdfResult.documentNumber ||
    (isReceiptPaymentKind(paymentKind)
      ? receiptDocumentNumber(appointmentId, paymentKind)
      : factureDocumentNumber(appointmentId, paymentKind));
  const ref =
    paymentReference?.trim() || `manual-${appointment.balancePaidAt || new Date().toISOString()}`;

  const rowPersist = await persistInvoiceRow({
    studioId,
    appointmentId,
    clientId: resolvedClientId || appointment.clientId?.trim() || null,
    paymentKind,
    paymentReference: ref,
    documentNumber: docNum,
    storagePath: pdfResult.storagePath ?? null,
    publicUrl: pdfResult.publicUrl ?? null,
    amountPaidEur: paidNow,
    totalEur: appointment.price,
    depositEur: appointment.deposit,
  });

  if (rowPersist.error) {
    return {
      ok: pdfResult.savedToDossier || pdfResult.downloaded,
      reason: rowPersist.error,
      documentNumber: docNum,
      filename: pdfResult.filename,
      storagePath: pdfResult.storagePath,
      publicUrl: pdfResult.publicUrl,
      savedToDossier: pdfResult.savedToDossier,
      downloaded: pdfResult.downloaded,
    };
  }

  return {
    ok: true,
    documentNumber: docNum,
    filename: pdfResult.filename,
    storagePath: pdfResult.storagePath,
    publicUrl: pdfResult.publicUrl,
    savedToDossier: pdfResult.savedToDossier,
    downloaded: pdfResult.downloaded,
  };
}
