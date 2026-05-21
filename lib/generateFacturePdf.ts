/**
 * Facture PDF post-encaissement — design premium épuré (InkFlow Studio).
 */
import type { Appointment, User } from '../types';
import {
  factureDocumentNumber,
  facturePdfFilename,
  isReceiptPaymentKind,
  receiptDocumentNumber,
  receiptPdfFilename,
} from './automations/documentNumber';
import type { PaymentInvoiceKind } from './automations/types';
import { savePdfToClientDossier } from './clientDossierDocuments';
import { formatEUR } from './financeDisplay';
import { downloadBlobAsFile } from './studioDataExport';
import { PDF_SIZE, pdfSetTextColor } from './pdfTypography';

export interface FacturePdfOptions {
  appointment: Appointment;
  artist: User;
  studioId?: string | null;
  paymentKind: PaymentInvoiceKind;
  amountPaidNow: number;
  studioSiret?: string | null;
}

export interface BuiltFacturePdf {
  blob: Blob;
  filename: string;
  documentNumber: string;
}

/** Palette épurée haut de gamme (style Apple / Stripe UX) */
const INK = {
  page: [255, 255, 255] as const,
  pureBlack: [9, 9, 11] as const,
  ink: [24, 24, 27] as const,
  muted: [113, 113, 122] as const,
  lightMuted: [161, 161, 170] as const,
  divider: [244, 244, 245] as const,
  bgBlock: [250, 250, 250] as const,
};

function paymentKindLabel(kind: PaymentInvoiceKind): string {
  switch (kind) {
    case 'deposit':
      return "REÇU D'ACOMPTE";
    case 'balance':
    case 'manual_balance':
      return 'REÇU DE PAIEMENT';
    default:
      return 'FACTURE';
  }
}

function prestationLabel(apt: Appointment): string {
  const svc = apt.service?.trim() || 'Prestation tatouage';
  if (apt.tattooType === 'flash') return `${svc} (Modèle Flash)`;
  return svc;
}

function drawDivider(doc: import('jspdf').jsPDF, y: number, L: number, R: number): number {
  doc.setDrawColor(...INK.divider);
  doc.setLineWidth(0.15);
  doc.line(L, y, R, y);
  return y + 6;
}

function drawRow(
  doc: import('jspdf').jsPDF,
  y: number,
  L: number,
  R: number,
  label: string,
  value: string,
  isBoldValue = false
): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  pdfSetTextColor(doc, INK.muted);
  doc.text(label, L, y);

  doc.setFont('helvetica', isBoldValue ? 'bold' : 'normal');
  pdfSetTextColor(doc, isBoldValue ? INK.pureBlack : INK.ink);
  doc.text(value.slice(0, 72), R, y, { align: 'right' });
  return y + 6.5;
}

export async function buildFacturePdf(opts: FacturePdfOptions): Promise<BuiltFacturePdf> {
  const { appointment, artist, paymentKind, amountPaidNow, studioSiret } = opts;
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const L = 20;
  const R = W - 20;

  const useReceipt = isReceiptPaymentKind(paymentKind);
  const docNum = useReceipt
    ? receiptDocumentNumber(appointment.id, paymentKind)
    : factureDocumentNumber(appointment.id, paymentKind);
  const emissionDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const total = Math.max(0, Number(appointment.price) || 0);
  const deposit = Math.max(0, Number(appointment.deposit) || 0);
  const depositPaid = appointment.depositPaid === true;
  const depositApplied = depositPaid ? Math.min(deposit, total) : 0;
  const paidNow = Math.max(0, amountPaidNow);
  const remainingAfter =
    paymentKind === 'balance' || paymentKind === 'manual_balance'
      ? 0
      : Math.max(0, Math.round((total - depositApplied - paidNow) * 100) / 100);

  doc.setFillColor(...INK.page);
  doc.rect(0, 0, W, H, 'F');

  let y = 25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  pdfSetTextColor(doc, INK.pureBlack);
  doc.text((artist.studioName || 'Studio').toUpperCase().slice(0, 32), L, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  pdfSetTextColor(doc, INK.pureBlack);
  doc.text(paymentKindLabel(paymentKind), R, y, { align: 'right' });

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  pdfSetTextColor(doc, INK.muted);
  doc.text(`Artiste : ${artist.name || '—'}`, L, y);
  doc.text(`N° ${docNum}`, R, y, { align: 'right' });

  y += 5;
  if (studioSiret?.trim()) {
    doc.setFontSize(8);
    doc.text(`SIRET : ${studioSiret.trim()}`, L, y);
  }
  doc.setFontSize(9);
  doc.text(`Date d'émission : ${emissionDate}`, R, y, { align: 'right' });

  y += 12;
  y = drawDivider(doc, y, L, R);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  pdfSetTextColor(doc, INK.muted);
  doc.text('FACTURÉ À', L, y);

  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  pdfSetTextColor(doc, INK.pureBlack);
  doc.text(appointment.clientName || 'Client', L, y);

  if (appointment.clientEmail) {
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    pdfSetTextColor(doc, INK.ink);
    doc.text(appointment.clientEmail, L, y);
  }

  y += 10;
  y = drawDivider(doc, y, L, R);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  pdfSetTextColor(doc, INK.muted);
  doc.text('DÉTAILS DE LA SÉANCE', L, y);
  y += 7;

  y = drawRow(
    doc,
    y,
    L,
    R,
    'Date & Heure',
    `${appointment.date} à ${(appointment.time || '').slice(0, 5)}`
  );
  y = drawRow(doc, y, L, R, 'Durée estimée', `${appointment.duration ?? 60} minutes`);
  y = drawRow(doc, y, L, R, 'Nature du projet', prestationLabel(appointment));

  y += 6;
  y = drawDivider(doc, y, L, R);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  pdfSetTextColor(doc, INK.muted);
  doc.text('RÉCAPITULATIF FINANCIER (TTC)', L, y);
  y += 7;

  y = drawRow(doc, y, L, R, 'Tarif total de la prestation', formatEUR(total));
  y = drawRow(
    doc,
    y,
    L,
    R,
    'Acompte déjà déduit',
    depositPaid ? formatEUR(depositApplied) : '0,00 €'
  );
  y = drawRow(doc, y, L, R, 'Reste à régler avant opération', formatEUR(total - depositApplied));

  y += 4;
  y = drawDivider(doc, y, L, R);
  y += 2;

  doc.setFillColor(...INK.bgBlock);
  doc.rect(L, y, R - L, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  pdfSetTextColor(doc, INK.pureBlack);
  doc.text('MONTANT NET ENCAISSÉ', L + 5, y + 9);
  doc.setFontSize(12);
  doc.text(formatEUR(paidNow), R - 5, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  pdfSetTextColor(doc, INK.muted);
  doc.text('Solde restant dû sur ce dossier', L + 5, y + 17);
  doc.setFont('helvetica', remainingAfter > 0 ? 'bold' : 'normal');
  pdfSetTextColor(doc, remainingAfter > 0 ? INK.pureBlack : INK.muted);
  doc.text(formatEUR(remainingAfter), R - 5, y + 17, { align: 'right' });

  y = H - 32;
  doc.setFontSize(PDF_SIZE.legal - 1.5);
  doc.setFont('helvetica', 'normal');
  pdfSetTextColor(doc, INK.lightMuted);

  const legalText =
    'Justificatif de paiement généré automatiquement par InkFlow pour le compte du studio émetteur. ' +
    'Ce document fait foi de reçu pour les sommes perçues listées ci-dessus. ' +
    'Pour toute facturation certifiée conforme Factur-X ou export comptable automatisé, ' +
    'rapprochez-vous de votre espace de gestion InkFlow ou de votre comptable.';
  const legalLines = doc.splitTextToSize(legalText, R - L);
  doc.text(legalLines, L, y);

  doc.setFontSize(7);
  pdfSetTextColor(doc, INK.lightMuted);
  doc.text(`Document certifié · ID pièce : ${docNum} · Généré via InkFlow`, W / 2, H - 10, {
    align: 'center',
  });

  const filename = useReceipt ? receiptPdfFilename(docNum) : facturePdfFilename(docNum);
  return { blob: doc.output('blob'), filename, documentNumber: docNum };
}

export interface GenerateFactureResult {
  savedToDossier: boolean;
  dossierError?: string;
  downloaded: boolean;
  documentNumber: string;
  filename: string;
  publicUrl?: string;
  storagePath?: string;
}

/**
 * Génère la facture, télécharge pour l’utilisateur, enregistre dans
 * `inkflow-assets/client-dossier/{studioId}/{clientId}/{num_facture}.pdf`
 */
export async function generateFacturePdf(
  opts: FacturePdfOptions & { downloadPdf?: boolean }
): Promise<GenerateFactureResult> {
  const built = await buildFacturePdf(opts);
  const downloadPdf = opts.downloadPdf !== false;
  if (downloadPdf) {
    downloadBlobAsFile(built.filename, built.blob);
  }

  const clientId = opts.appointment.clientId?.trim();
  if (!opts.studioId || !clientId) {
    return {
      savedToDossier: false,
      downloaded: downloadPdf,
      documentNumber: built.documentNumber,
      filename: built.filename,
    };
  }

  const saved = await savePdfToClientDossier({
    studioId: opts.studioId,
    clientId,
    filename: built.filename,
    blob: built.blob,
  });

  if ('error' in saved) {
    return {
      savedToDossier: false,
      dossierError: saved.error,
      downloaded: downloadPdf,
      documentNumber: built.documentNumber,
      filename: built.filename,
    };
  }

  return {
    savedToDossier: true,
    downloaded: downloadPdf,
    documentNumber: built.documentNumber,
    filename: built.filename,
    publicUrl: saved.publicUrl,
    storagePath: saved.path,
  };
}
