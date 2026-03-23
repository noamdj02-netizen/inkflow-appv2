/**
 * generateDevis — Génère un PDF de devis professionnel pour tatoueurs.
 *
 * Inclut : numérotation auto, validité 30j, TVA art. 293B CGI,
 * zones de signature client + artiste.
 */

import type { Appointment } from '../types';
import type { User } from '../types';

export interface DevisOptions {
  appointment: Appointment;
  artist: User;
  projectDescription?: string;
  notes?: string;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

function devisNumber(appointmentId: string): string {
  const now = new Date();
  const suffix = appointmentId.slice(-4).toUpperCase();
  return `INK-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${suffix}`;
}

function frDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function frDateNow(): string {
  const now = new Date();
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
}

function frDatePlus30(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function trunc(s: string, max: number): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export async function generateDevis(opts: DevisOptions): Promise<void> {
  const { appointment: apt, artist, projectDescription, notes } = opts;
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const L = 20;
  const R = W - 20;
  const COL2 = W / 2 + 5;

  const devNum = devisNumber(apt.id);
  const emissionDate = frDateNow();
  const validityDate = frDatePlus30();

  // Couleurs
  const OCRE_R = 201, OCRE_G = 169, OCRE_B = 110;
  const DARK_R = 23, DARK_G = 23, DARK_B = 23;
  const MUTED_R = 120, MUTED_G = 113, MUTED_B = 108;
  const BORDER_R = 220, BORDER_G = 214, BORDER_B = 204;

  // Fond
  doc.setFillColor(250, 248, 245);
  doc.rect(0, 0, W, H, 'F');

  // Header sombre
  doc.setFillColor(DARK_R, DARK_G, DARK_B);
  doc.rect(0, 0, W, 38, 'F');
  doc.setFillColor(OCRE_R, OCRE_G, OCRE_B);
  doc.rect(0, 38, W, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(trunc(artist.studioName || 'InkFlow', 28), L, 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(201, 185, 155);
  doc.text('Tatouage sur mesure', L, 31);

  doc.setTextColor(OCRE_R, OCRE_G, OCRE_B);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('DEVIS', R, 22, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 170, 150);
  doc.text(`N° ${devNum}`, R, 29, { align: 'right' });

  // Dates
  let y = 50;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED_R, MUTED_G, MUTED_B);
  doc.text("Date d'émission : ", L, y);
  doc.setTextColor(DARK_R, DARK_G, DARK_B);
  doc.setFont('helvetica', 'bold');
  doc.text(emissionDate, L + 35, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED_R, MUTED_G, MUTED_B);
  doc.text("Valable jusqu'au : ", COL2, y);
  doc.setTextColor(DARK_R, DARK_G, DARK_B);
  doc.setFont('helvetica', 'bold');
  doc.text(validityDate, COL2 + 35, y);

  y += 12;

  // Blocs Studio / Client
  const blockTop = y;
  const blockH = 36;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(BORDER_R, BORDER_G, BORDER_B);
  doc.setLineWidth(0.3);
  doc.roundedRect(L, blockTop, 80, blockH, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(OCRE_R, OCRE_G, OCRE_B);
  doc.text('ARTISTE / STUDIO', L + 4, blockTop + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(DARK_R, DARK_G, DARK_B);
  doc.text(trunc(artist.studioName || 'Studio', 30), L + 4, blockTop + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED_R, MUTED_G, MUTED_B);
  if (artist.email) doc.text(trunc(artist.email, 35), L + 4, blockTop + 20);
  const siretOrPhone = artist.siret
    ? `SIRET ${artist.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')}`
    : artist.phone ? String(artist.phone) : '';
  if (siretOrPhone) doc.text(siretOrPhone, L + 4, blockTop + 26);

  const clientX = COL2 - 5;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(clientX, blockTop, 80, blockH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(OCRE_R, OCRE_G, OCRE_B);
  doc.text('CLIENT', clientX + 4, blockTop + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(DARK_R, DARK_G, DARK_B);
  doc.text(trunc(apt.clientName || 'Client', 30), clientX + 4, blockTop + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED_R, MUTED_G, MUTED_B);
  if (apt.clientEmail) doc.text(trunc(apt.clientEmail, 35), clientX + 4, blockTop + 20);
  if (apt.clientPhone) doc.text(apt.clientPhone, clientX + 4, blockTop + 26);

  y = blockTop + blockH + 10;

  // Section Prestation
  doc.setFillColor(DARK_R, DARK_G, DARK_B);
  doc.rect(L, y, R - L, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PRESTATION', L + 3, y + 4.8);
  y += 7;

  const C1 = L, C2 = L + 60, C3 = R - 28;
  doc.setFillColor(245, 241, 234);
  doc.rect(L, y, R - L, 6, 'F');
  doc.setTextColor(MUTED_R, MUTED_G, MUTED_B);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SERVICE', C1 + 3, y + 4.2);
  doc.text('DÉTAILS', C2, y + 4.2);
  doc.text('MONTANT', C3, y + 4.2, { align: 'right' });
  y += 6;

  const rowH = projectDescription ? 26 : 18;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(BORDER_R, BORDER_G, BORDER_B);
  doc.setLineWidth(0.25);
  doc.rect(L, y, R - L, rowH, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(DARK_R, DARK_G, DARK_B);
  doc.text(trunc(apt.service || 'Tatouage', 22), C1 + 3, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(MUTED_R, MUTED_G, MUTED_B);
  const details: string[] = [];
  if (apt.date) details.push(`Séance : ${frDate(apt.date)}${apt.time ? ' à ' + apt.time : ''}`);
  if (apt.duration) details.push(`Durée estimée : ${apt.duration} min`);
  if (apt.location && apt.location !== 'other') details.push(`Placement : ${apt.location}`);
  if (apt.size) details.push(`Taille : ${apt.size}`);
  details.forEach((d, i) => doc.text(d, C2, y + 6 + i * 5));

  if (projectDescription) {
    doc.setFontSize(7.5);
    const descLines = doc.splitTextToSize(trunc(projectDescription, 120), C2 - C1 - 6);
    doc.text(descLines, C1 + 3, y + 14);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(DARK_R, DARK_G, DARK_B);
  doc.text(`${apt.price.toLocaleString('fr-FR')} €`, C3, y + 7, { align: 'right' });

  y += rowH;

  // Tableau financier (aligné à droite)
  const deposit = apt.deposit || 0;
  const remaining = Math.max(0, apt.price - deposit);
  const depositPct = deposit > 0 && apt.price > 0 ? Math.round((deposit / apt.price) * 100) : 0;

  interface FinRow { label: string; value: string; bold?: boolean; accent?: boolean }
  const finRows: FinRow[] = [
    { label: 'Total HT', value: `${apt.price.toLocaleString('fr-FR')} €` },
    { label: 'TVA (exonération art. 293B CGI)', value: '0,00 €' },
    { label: 'TOTAL TTC', value: `${apt.price.toLocaleString('fr-FR')} €`, bold: true },
    { label: `Acompte (${depositPct}%)`, value: `${deposit.toLocaleString('fr-FR')} €`, accent: true },
    { label: 'Reste à payer à la séance', value: `${remaining.toLocaleString('fr-FR')} €`, bold: true },
  ];

  const finW = 105;
  const finX = R - finW;
  const rh = 6.5;

  finRows.forEach((row) => {
    if (row.accent) {
      doc.setFillColor(OCRE_R, OCRE_G, OCRE_B);
    } else if (row.bold) {
      doc.setFillColor(245, 241, 234);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.setDrawColor(BORDER_R, BORDER_G, BORDER_B);
    doc.setLineWidth(0.25);
    doc.rect(finX, y, finW, rh, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
    doc.setTextColor(row.accent ? 23 : (row.bold ? DARK_R : MUTED_R), row.accent ? 23 : (row.bold ? DARK_G : MUTED_G), row.accent ? 23 : (row.bold ? DARK_B : MUTED_B));
    doc.text(row.label, finX + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(row.accent ? 23 : DARK_R, row.accent ? 23 : DARK_G, row.accent ? 23 : DARK_B);
    doc.text(row.value, R - 2, y + 4.5, { align: 'right' });
    y += rh;
  });

  y += 10;

  // Notes
  const noteText = notes || apt.notes || '';
  if (noteText) {
    const noteLines = doc.splitTextToSize(noteText, R - L - 6);
    const noteH = 10 + noteLines.length * 5;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(BORDER_R, BORDER_G, BORDER_B);
    doc.roundedRect(L, y, R - L, noteH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(OCRE_R, OCRE_G, OCRE_B);
    doc.text('NOTES', L + 3, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(DARK_R, DARK_G, DARK_B);
    doc.text(noteLines, L + 3, y + 11);
    y += noteH + 8;
  }

  // Conditions
  const conditions = [
    "• Ce devis est valable 30 jours à compter de la date d'émission.",
    "• L'acompte est requis pour confirmer le rendez-vous et réserver le créneau.",
    "• L'acompte n'est pas remboursable en cas d'annulation moins de 48h avant la séance.",
    "• Le tatoueur est exonéré de TVA (art. 293B du Code Général des Impôts).",
  ];
  const condH = 8 + conditions.length * 5;
  doc.setFillColor(249, 246, 240);
  doc.setDrawColor(BORDER_R, BORDER_G, BORDER_B);
  doc.roundedRect(L, y, R - L, condH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(MUTED_R, MUTED_G, MUTED_B);
  doc.text('CONDITIONS GÉNÉRALES', L + 3, y + 5);
  conditions.forEach((c, i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED_R, MUTED_G, MUTED_B);
    doc.text(c, L + 3, y + 11 + i * 5);
  });

  y += condH + 12;

  // Signatures
  if (y > H - 55) { doc.addPage(); doc.setFillColor(250, 248, 245); doc.rect(0, 0, W, H, 'F'); y = 20; }

  const sigW = 78;
  const sigH = 28;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(BORDER_R, BORDER_G, BORDER_B);
  doc.roundedRect(L, y, sigW, sigH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(OCRE_R, OCRE_G, OCRE_B);
  doc.text("Signature de l'artiste", L + 3, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(MUTED_R, MUTED_G, MUTED_B);
  doc.text(artist.studioName || '', L + 3, y + 12);
  doc.setDrawColor(BORDER_R, BORDER_G, BORDER_B);
  doc.setLineWidth(0.3);
  doc.line(L + 3, y + sigH - 4, L + sigW - 3, y + sigH - 4);

  const sigX2 = R - sigW;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(sigX2, y, sigW, sigH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(OCRE_R, OCRE_G, OCRE_B);
  doc.text('Bon pour accord — Client', sigX2 + 3, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(MUTED_R, MUTED_G, MUTED_B);
  doc.text(trunc(apt.clientName || '', 28), sigX2 + 3, y + 12);
  doc.line(sigX2 + 3, y + sigH - 4, sigX2 + sigW - 3, y + sigH - 4);

  // Footer
  doc.setFillColor(DARK_R, DARK_G, DARK_B);
  doc.rect(0, H - 14, W, 14, 'F');
  doc.setFillColor(OCRE_R, OCRE_G, OCRE_B);
  doc.rect(0, H - 14, W, 1, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(160, 150, 130);
  doc.text(`Devis N° ${devNum} — Émis le ${emissionDate} via InkFlow (app.ink-flow.me)`, W / 2, H - 5.5, { align: 'center' });

  // Téléchargement
  const filename = `Devis_${devNum}_${(apt.clientName || 'client').replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
