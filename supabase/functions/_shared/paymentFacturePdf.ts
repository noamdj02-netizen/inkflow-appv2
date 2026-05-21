/**
 * Génération facture PDF (Deno / Edge) — aligné lib/generateFacturePdf.ts (premium épuré).
 */
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

export type EdgePaymentInvoiceKind = "deposit" | "balance" | "full_payment" | "manual_balance";

export interface EdgeFactureInput {
  studioName: string;
  artistName?: string | null;
  studioEmail?: string | null;
  studioSiret?: string | null;
  clientName: string;
  clientEmail?: string | null;
  appointmentId: string;
  date: string;
  time: string;
  duration: number;
  service: string;
  tattooType?: string | null;
  price: number;
  deposit: number;
  depositPaid: boolean;
  paymentKind: EdgePaymentInvoiceKind;
  amountPaidNow: number;
}

const INK = {
  page: [255, 255, 255] as const,
  pureBlack: [9, 9, 11] as const,
  ink: [24, 24, 27] as const,
  muted: [113, 113, 122] as const,
  lightMuted: [161, 161, 170] as const,
  divider: [244, 244, 245] as const,
  bgBlock: [250, 250, 250] as const,
};

export function edgeFactureDocumentNumber(
  appointmentId: string,
  paymentKind: EdgePaymentInvoiceKind,
  emissionDate: Date = new Date(),
): string {
  const ymd = emissionDate.toISOString().slice(0, 10).replace(/-/g, "");
  const tail =
    appointmentId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "000000";
  const isReceipt =
    paymentKind === "balance" ||
    paymentKind === "manual_balance" ||
    paymentKind === "deposit";
  const prefix =
    paymentKind === "balance" || paymentKind === "manual_balance"
      ? "REC-SOL"
      : paymentKind === "deposit"
        ? "REC-AC"
        : "FAC";
  if (!isReceipt) return `${prefix}-${ymd}-${tail}`;
  return `${prefix}-${ymd}-${tail}`;
}

export function edgeFacturePdfFilename(documentNumber: string): string {
  const safe = documentNumber.replace(/[^\w.-]/g, "_");
  if (documentNumber.startsWith("REC-")) return `Recu_${safe}.pdf`;
  return `${safe}.pdf`;
}

function formatEuro(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

function paymentKindLabel(kind: EdgePaymentInvoiceKind): string {
  switch (kind) {
    case "deposit":
      return "REÇU D'ACOMPTE";
    case "balance":
    case "manual_balance":
      return "REÇU DE PAIEMENT";
    default:
      return "FACTURE";
  }
}

function drawDivider(doc: jsPDF, y: number, L: number, R: number): number {
  doc.setDrawColor(...INK.divider);
  doc.setLineWidth(0.15);
  doc.line(L, y, R, y);
  return y + 6;
}

function drawRow(
  doc: jsPDF,
  y: number,
  L: number,
  R: number,
  label: string,
  value: string,
  isBoldValue = false,
): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK.muted);
  doc.text(label, L, y);
  doc.setFont("helvetica", isBoldValue ? "bold" : "normal");
  doc.setTextColor(...(isBoldValue ? INK.pureBlack : INK.ink));
  doc.text(value.slice(0, 72), R, y, { align: "right" });
  return y + 6.5;
}

export function buildPaymentFacturePdfBytes(input: EdgeFactureInput): {
  bytes: Uint8Array;
  filename: string;
  documentNumber: string;
} {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const L = 20;
  const R = W - 20;

  const docNum = edgeFactureDocumentNumber(input.appointmentId, input.paymentKind);
  const emissionDate = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const total = Math.max(0, input.price);
  const deposit = Math.max(0, input.deposit);
  const depositApplied = input.depositPaid ? Math.min(deposit, total) : 0;
  const paidNow = Math.max(0, input.amountPaidNow);
  const remainingAfter =
    input.paymentKind === "balance" || input.paymentKind === "manual_balance"
      ? 0
      : Math.max(0, Math.round((total - depositApplied - paidNow) * 100) / 100);

  const prestation =
    input.tattooType === "flash"
      ? `${input.service || "Séance"} (Modèle Flash)`
      : input.service || "Séance";

  doc.setFillColor(...INK.page);
  doc.rect(0, 0, W, H, "F");

  let y = 25;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...INK.pureBlack);
  doc.text(input.studioName.toUpperCase().slice(0, 32), L, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK.pureBlack);
  doc.text(paymentKindLabel(input.paymentKind), R, y, { align: "right" });

  y += 5.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK.muted);
  doc.text(`Artiste : ${input.artistName?.trim() || "—"}`, L, y);
  doc.text(`N° ${docNum}`, R, y, { align: "right" });

  y += 5;
  if (input.studioSiret?.trim()) {
    doc.setFontSize(8);
    doc.text(`SIRET : ${input.studioSiret.trim()}`, L, y);
  }
  doc.setFontSize(9);
  doc.text(`Date d'émission : ${emissionDate}`, R, y, { align: "right" });

  y += 12;
  y = drawDivider(doc, y, L, R);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...INK.muted);
  doc.text("FACTURÉ À", L, y);
  y += 5.5;
  doc.setFontSize(11);
  doc.setTextColor(...INK.pureBlack);
  doc.text(input.clientName, L, y);
  if (input.clientEmail) {
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK.ink);
    doc.text(input.clientEmail, L, y);
  }

  y += 10;
  y = drawDivider(doc, y, L, R);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...INK.muted);
  doc.text("DÉTAILS DE LA SÉANCE", L, y);
  y += 7;

  y = drawRow(doc, y, L, R, "Date & Heure", `${input.date} à ${(input.time || "").slice(0, 5)}`);
  y = drawRow(doc, y, L, R, "Durée estimée", `${input.duration || 60} minutes`);
  y = drawRow(doc, y, L, R, "Nature du projet", prestation);

  y += 6;
  y = drawDivider(doc, y, L, R);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...INK.muted);
  doc.text("RÉCAPITULATIF FINANCIER (TTC)", L, y);
  y += 7;

  y = drawRow(doc, y, L, R, "Tarif total de la prestation", formatEuro(total));
  y = drawRow(
    doc,
    y,
    L,
    R,
    "Acompte déjà déduit",
    input.depositPaid ? formatEuro(depositApplied) : "0,00 €",
  );
  y = drawRow(doc, y, L, R, "Reste à régler avant opération", formatEuro(total - depositApplied));

  y += 4;
  y = drawDivider(doc, y, L, R);
  y += 2;

  doc.setFillColor(...INK.bgBlock);
  doc.rect(L, y, R - L, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK.pureBlack);
  doc.text("MONTANT NET ENCAISSÉ", L + 5, y + 9);
  doc.setFontSize(12);
  doc.text(formatEuro(paidNow), R - 5, y + 9, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK.muted);
  doc.text("Solde restant dû sur ce dossier", L + 5, y + 17);
  doc.setFont("helvetica", remainingAfter > 0 ? "bold" : "normal");
  doc.setTextColor(...(remainingAfter > 0 ? INK.pureBlack : INK.muted));
  doc.text(formatEuro(remainingAfter), R - 5, y + 17, { align: "right" });

  y = H - 32;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK.lightMuted);
  const legalText =
    "Justificatif de paiement généré automatiquement par InkFlow pour le compte du studio émetteur. " +
    "Ce document fait foi de reçu pour les sommes perçues listées ci-dessus.";
  doc.text(doc.splitTextToSize(legalText, R - L), L, y);

  doc.setFontSize(7);
  doc.setTextColor(...INK.lightMuted);
  doc.text(
    `Document certifié · ID pièce : ${docNum} · Généré via InkFlow`,
    W / 2,
    H - 10,
    { align: "center" },
  );

  const filename = edgeFacturePdfFilename(docNum);
  const ab = doc.output("arraybuffer");
  return { bytes: new Uint8Array(ab), filename, documentNumber: docNum };
}
