import type { jsPDF } from 'jspdf';
import type { Appointment } from '../types';
import type { StudioFinancePrefs } from '../types/studioFinancePrefs';
import { csvEscapeCell, downloadBlobAsFile, downloadTextFile } from './studioDataExport';
import { formatEUR } from './financeDisplay';
import {
  PDF_INK,
  PDF_LEAD,
  PDF_SIZE,
  applyPdfFooterLine,
  drawPdfKeyValueRows,
  drawPdfSectionTitle,
  pdfSetTextColor,
} from './pdfTypography';

export interface CashLikeEntry {
  date: string;
  amount: number;
  label: string;
}

export interface PilotageMonthTotals {
  monthLabel: string;
  monthKey: string;
  rangeStart: string;
  rangeEnd: string;
  inkflowCompletedSum: number;
  cashSum: number;
  /** RDV terminés où un encaissement carte en ligne a été repéré (`balancePaidAt`). */
  completedWithOnlineBalanceSum: number;
}

export function pilotageMonthRange(monthKey: string): { rangeStart: string; rangeEnd: string } {
  const [y, m] = monthKey.split('-').map(Number);
  const rangeStart = `${monthKey}-01`;
  const last = new Date(y, m, 0).getDate();
  const rangeEnd = `${monthKey}-${String(last).padStart(2, '0')}`;
  return { rangeStart, rangeEnd };
}

export interface PilotageLedgerRow {
  date: string;
  type: string;
  label: string;
  detail: string;
  amount: number;
}

export function buildPilotageLedgerRows(
  appointments: Appointment[],
  cashEntries: CashLikeEntry[],
  monthKey: string
): PilotageLedgerRow[] {
  const { rangeStart, rangeEnd } = pilotageMonthRange(monthKey);

  const rows: PilotageLedgerRow[] = [];

  for (const a of appointments) {
    if (a.status !== 'completed' || a.date < rangeStart || a.date > rangeEnd) {
      continue;
    }
    const stripeHint = a.balancePaidAt ? 'encaissement en ligne repéré' : 'hors signal en ligne';
    rows.push({
      date: a.date,
      type: 'RDV',
      label: a.clientName || '—',
      detail: `${a.service ?? 'RDV'} — ${stripeHint}`,
      amount: a.price,
    });
  }

  for (const e of cashEntries) {
    if (e.date < rangeStart || e.date > rangeEnd) continue;
    rows.push({
      date: e.date,
      type: 'Espèces',
      label: e.label || 'Espèces',
      detail: '',
      amount: e.amount,
    });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

function truncatePdfCell(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

export function computePilotageMonthTotals(
  appointments: Appointment[],
  cashEntries: CashLikeEntry[],
  monthKey: string
): PilotageMonthTotals {
  const { rangeStart, rangeEnd } = pilotageMonthRange(monthKey);
  const [y, mo] = monthKey.split('-').map(Number);
  const monthLabel = new Date(y, mo - 1, 15).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  let inkflowCompletedSum = 0;
  let completedWithOnlineBalanceSum = 0;

  for (const a of appointments) {
    if (a.status !== 'completed' || a.date < rangeStart || a.date > rangeEnd) {
      continue;
    }
    inkflowCompletedSum += a.price;
    if (a.balancePaidAt && String(a.balancePaidAt).trim().length > 0) {
      completedWithOnlineBalanceSum += a.price;
    }
  }

  const cashSum = cashEntries
    .filter((e) => e.date >= rangeStart && e.date <= rangeEnd)
    .reduce((s, e) => s + e.amount, 0);

  return {
    monthLabel,
    monthKey,
    rangeStart,
    rangeEnd,
    inkflowCompletedSum,
    cashSum,
    completedWithOnlineBalanceSum,
  };
}

/** Grand livre simplifié RDV + espèces pour le mois pilotage. */
export function buildPilotageMonthLedgerCsv(
  appointments: Appointment[],
  cashEntries: CashLikeEntry[],
  monthKey: string,
  prefsSummary: string
): string {
  const rows = buildPilotageLedgerRows(appointments, cashEntries, monthKey).map((r) => ({
    ...r,
    type: r.type === 'RDV' ? 'rdv_termine' : 'especes_revenus',
  }));

  const totals = computePilotageMonthTotals(appointments, cashEntries, monthKey);

  const lines: string[] = [];
  lines.push('# InkFlow Pilotage — export tableau (lignes suivantes = CSV)');
  lines.push(`# ${prefsSummary}`);
  lines.push(
    `# Mois ${monthKey} | RDV terminés ${totals.inkflowCompletedSum.toFixed(2)} EUR | Espèces ${totals.cashSum.toFixed(2)} EUR | Encaissement ligne repéré ${totals.completedWithOnlineBalanceSum.toFixed(2)} EUR`
  );
  lines.push('date,type,libelle,detail,montant_eur');
  for (const r of rows) {
    lines.push(
      [
        csvEscapeCell(r.date),
        csvEscapeCell(r.type),
        csvEscapeCell(r.label),
        csvEscapeCell(r.detail),
        csvEscapeCell(r.amount),
      ].join(',')
    );
  }
  return lines.join('\r\n');
}

export function downloadPilotageMonthCsv(
  filename: string,
  appointments: Appointment[],
  cashEntries: CashLikeEntry[],
  monthKey: string,
  prefsSummary: string
): void {
  const content = buildPilotageMonthLedgerCsv(appointments, cashEntries, monthKey, prefsSummary);
  downloadTextFile(filename, content);
}

/** Paramètres pour un PDF « dossier » détaillé (multipage). */
export interface PilotageDetailedPdfParams {
  studioName: string;
  /** Ex. utilisateur@gmail.com pour traçabilité */
  exporterLabel?: string;
  monthKey: string;
  year: number;
  /** Déjà formaté localement (ex. Intl fr-FR) */
  generatedAtLabel: string;
  prefs: StudioFinancePrefs;
  totals: PilotageMonthTotals;
  /** Somme RDV terminés + espèces année avant décomposition HT/TTC */
  caAggregateBrutYtd: number;
  htYtd: number;
  ttcYtd: number;
  /** Base cotisations (TTC) — alignée pilotage InkFlow */
  caAggregateYtdTtc: number;
  fiscalCotisationsEur: number;
  impotVlEur: number;
  netEstYtd: number;
  totalChargesEur: number;
  marginPedagogique: number;
  progressPct: number;
  appointments: Appointment[];
  cashEntries: CashLikeEntry[];
}

function isoDateToFr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function regimenTvaLabel(r: StudioFinancePrefs['regime_tva']): string {
  if (r === 'franchise') return 'Franchise en base de TVA (affichage app)';
  if (r === 'reel_simplifie') return 'Réel simplifié (affichage app)';
  return 'Réel normal (affichage app)';
}

function declFreqLabel(f: StudioFinancePrefs['declaration_frequency']): string {
  return f === 'monthly' ? 'Mensuelle (indicatif)' : 'Trimestrielle (indicatif)';
}

function ensureSpace(
  doc: jsPDF,
  ctx: { y: number; ml: number; ymax: number },
  needed: number
): void {
  if (ctx.y + needed > ctx.ymax) {
    doc.addPage();
    ctx.y = ctx.ml + 6;
  }
}

function finalizePageFooters(doc: jsPDF): void {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  const footerText = 'InkFlow — rapport de pilotage (document de travail, non officiel)';
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    applyPdfFooterLine(doc, pw / 2, ph - 8, footerText, total, i);
  }
}

export async function downloadPilotageMonthPdf(params: PilotageDetailedPdfParams): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 14;
  const mr = 14;
  const contentW = pw - ml - mr;
  const rightCol = pw - mr;
  const labelMaxW = contentW - 52;
  const ymax = ph - 22;

  const total = params.totals;
  const rangeFr = `${isoDateToFr(total.rangeStart)} → ${isoDateToFr(total.rangeEnd)}`;
  const ledgerRows = buildPilotageLedgerRows(
    params.appointments,
    params.cashEntries,
    params.monthKey
  );

  /* ——— En-tête couverture ——— */
  doc.setFillColor(14, 14, 17);
  doc.rect(0, 0, pw, 52, 'F');
  doc.setFillColor(PDF_INK.primary[0], PDF_INK.primary[1], PDF_INK.primary[2]);
  doc.rect(0, 49, pw, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(PDF_SIZE.coverTitle);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport de pilotage fiscal', ml, 24);
  doc.setFontSize(PDF_SIZE.coverKicker);
  doc.setFont('times', 'italic');
  doc.setTextColor(218, 220, 228);
  doc.text('InkFlow — synthèse pédagogique (non opposable aux administrations)', ml, 32);
  doc.setFontSize(PDF_SIZE.coverStudio);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(params.studioName, ml, 43);
  doc.setTextColor(0, 0, 0);

  let y = 62;
  doc.setFontSize(PDF_SIZE.meta);
  doc.setFont('times', 'normal');
  pdfSetTextColor(doc, PDF_INK.muted);
  doc.text(`Mois analysé : ${total.monthLabel} (${params.monthKey})`, ml, y);
  y += 5.2;
  doc.text(`Période calendaire couverte : ${rangeFr}`, ml, y);
  y += 5.2;
  doc.text(`Année civile de référence (agrégats YTD) : ${params.year}`, ml, y);
  y += 5.2;
  doc.text(`Document généré : ${params.generatedAtLabel}`, ml, y);
  if (params.exporterLabel) {
    y += 5;
    doc.text(`Export demandé par : ${params.exporterLabel}`, ml, y);
  }
  y += 9;
  doc.setDrawColor(200, 202, 210);
  doc.setLineWidth(0.4);
  doc.line(ml, y, pw - ml, y);
  y += 10;

  const ctx = { y, ml, ymax };

  doc.setFontSize(PDF_SIZE.intro);
  doc.setFont('times', 'normal');
  const intro = doc.splitTextToSize(
    'Ce rapport regroupe les encaissements suivis dans InkFlow (rendez-vous terminés et saisie des espèces dans l’onglet Revenus). Les cotisations et impositions sont des simulations à partir des taux présents dans les réglages du studio ; seuls tes portails officiels URSSAF / impôt font foi pour les montants et dates.',
    contentW
  );
  pdfSetTextColor(doc, PDF_INK.muted);
  doc.text(intro, ml, ctx.y);
  ctx.y += intro.length * PDF_LEAD.intro + 7;
  doc.setTextColor(0, 0, 0);

  /* ——— §1 Synthèse année ——— */
  ensureSpace(doc, ctx, 45);
  ctx.y = drawPdfSectionTitle(doc, ml, contentW, ctx.y, `1. Synthèse cumulative — ${params.year}`);
  const synthRows: { label: string; value: string }[] = [
    {
      label: 'Somme suivie avant décomposition HT / TTC (RDV terminés + espèces)',
      value: formatEUR(params.caAggregateBrutYtd),
    },
    {
      label: `Montants équivalents après TVA (${(params.prefs.vat_rate_bps / 100).toFixed(2)} %) — HT`,
      value: formatEUR(params.htYtd),
    },
    { label: '— TTC', value: formatEUR(params.ttcYtd) },
    {
      label: 'Base utilisée pour les cotisations sociales (montant TTC)',
      value: formatEUR(params.caAggregateYtdTtc),
    },
    {
      label: `Cotisations sociales estimées (taux ${(params.prefs.ae_cotisation_rate_bps / 100).toFixed(2)} %)`,
      value: formatEUR(params.fiscalCotisationsEur),
    },
  ];
  if (params.prefs.versement_liberatoire && params.impotVlEur > 0) {
    synthRows.push({
      label: `Impôt sur le revenu — versement libératoire (taux indicatif ${(params.prefs.vl_rate_bps / 100).toFixed(2)} %)`,
      value: formatEUR(params.impotVlEur),
    });
  }
  synthRows.push(
    {
      label:
        'Net après charges sociales' +
        (params.prefs.versement_liberatoire ? ' et impôt VL estimé' : '') +
        ', sur la base InkFlow',
      value: formatEUR(params.netEstYtd),
    },
    {
      label: 'Charges directes renseignées (liste InkFlow)',
      value: formatEUR(params.totalChargesEur),
    },
    {
      label: 'Marge indicative (TTC annuel agrégé − charges)',
      value: formatEUR(params.marginPedagogique),
    },
    {
      label: 'Plafond micro-entrepreneur (référence saisie)',
      value: formatEUR(params.prefs.ae_plafond_ca_eur),
    },
    { label: 'Niveau de remplissage du plafond', value: `${params.progressPct} %` }
  );
  ctx.y = drawPdfKeyValueRows(doc, ml, rightCol, labelMaxW, ctx.y, synthRows);
  ctx.y += 6;

  /* ——— §2 Mois ——— */
  ensureSpace(doc, ctx, 50);
  ctx.y = drawPdfSectionTitle(
    doc,
    ml,
    contentW,
    ctx.y,
    `2. Zoom sur le mois — ${total.monthLabel}`
  );
  const monthRows: { label: string; value: string }[] = [
    {
      label: 'Encaissements issus des RDV terminés (mois civil)',
      value: formatEUR(total.inkflowCompletedSum),
    },
    { label: 'Espèces et revenus hors RDV saisis (mois civil)', value: formatEUR(total.cashSum) },
    {
      label: 'Total InkFlow pour le mois (RDV + espèces)',
      value: formatEUR(total.inkflowCompletedSum + total.cashSum),
    },
    {
      label: 'Sous-total des RDV avec solde en ligne repéré (proxy « carte / Stripe » dans l’app)',
      value: formatEUR(total.completedWithOnlineBalanceSum),
    },
  ];
  ctx.y = drawPdfKeyValueRows(doc, ml, rightCol, labelMaxW, ctx.y, monthRows);
  ctx.y += 6;

  /* ——— §3 Paramètres ——— */
  ensureSpace(doc, ctx, 55);
  ctx.y = drawPdfSectionTitle(
    doc,
    ml,
    contentW,
    ctx.y,
    '3. Paramètres et hypothèses retenus dans InkFlow'
  );
  const prefRows: { label: string; value: string }[] = [
    {
      label: 'Base de saisie des montants (studio)',
      value: params.prefs.amount_input_basis.toUpperCase(),
    },
    {
      label: 'Taux de TVA pour décomposition HT/TTC (affichage)',
      value: `${(params.prefs.vat_rate_bps / 100).toFixed(2)} %`,
    },
    { label: 'Préréglage cotisations (profil)', value: params.prefs.ae_social_preset },
    {
      label: 'Fréquence déclaration CA (rappel)',
      value: declFreqLabel(params.prefs.declaration_frequency),
    },
    {
      label: 'Versement libératoire activé dans les réglages',
      value: params.prefs.versement_liberatoire ? 'Oui' : 'Non',
    },
    { label: 'Régime TVA (mention interface)', value: regimenTvaLabel(params.prefs.regime_tva) },
  ];
  ctx.y = drawPdfKeyValueRows(doc, ml, rightCol, labelMaxW, ctx.y, prefRows);
  ctx.y += 8;

  /* ——— Nouvelle page : annexe ——— */
  doc.addPage();
  ctx.y = ml + 6;
  ctx.y = drawPdfSectionTitle(
    doc,
    ml,
    contentW,
    ctx.y,
    `4. Annexe — Mouvements du mois (${ledgerRows.length} ligne(s))`
  );
  doc.setFontSize(PDF_SIZE.bodyCompact);
  doc.setFont('times', 'italic');
  pdfSetTextColor(doc, PDF_INK.muted);
  const annIntro = doc.splitTextToSize(
    'Détail des lignes incluses dans le total du mois. Les libellés proviennent des fiches clients et de la liste des entrées espèces.',
    contentW
  );
  doc.text(annIntro, ml, ctx.y);
  ctx.y += annIntro.length * PDF_LEAD.intro + 6;
  doc.setTextColor(0, 0, 0);

  doc.setTextColor(0, 0, 0);
  doc.setFont('times', 'normal');

  /* En-tête tableau */
  doc.setFillColor(245, 246, 248);
  doc.setDrawColor(226, 230, 236);
  doc.roundedRect(ml, ctx.y - 2, contentW, 8.5, 0.5, 0.5, 'F');
  doc.setFontSize(PDF_SIZE.tableHead);
  doc.setFont('helvetica', 'bold');
  pdfSetTextColor(doc, PDF_INK.ink);
  doc.text('Date', ml + 2, ctx.y + 3.9);
  doc.text('Type', ml + 24, ctx.y + 3.9);
  doc.text('Client / Libellé', ml + 40, ctx.y + 3.9);
  doc.text('Détail', ml + 100, ctx.y + 3.9);
  doc.text('Montant €', rightCol - 2, ctx.y + 3.9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  ctx.y += 12.5;

  if (ledgerRows.length === 0) {
    ensureSpace(doc, ctx, 10);
    doc.setFontSize(PDF_SIZE.bodyCompact);
    doc.setFont('times', 'italic');
    pdfSetTextColor(doc, PDF_INK.muted);
    doc.text('Aucun mouvement pour ce mois dans InkFlow.', ml, ctx.y);
    ctx.y += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'normal');
  } else {
    for (const row of ledgerRows) {
      const rowH =
        Math.max(
          5.2,
          doc.splitTextToSize(truncatePdfCell(row.label, 42), 52).length * PDF_LEAD.table,
          doc.splitTextToSize(truncatePdfCell(row.detail, 55), 70).length * PDF_LEAD.table
        ) + 5;
      ensureSpace(doc, ctx, rowH + 2);
      doc.setDrawColor(228, 230, 235);
      doc.line(ml, ctx.y - 1, pw - ml, ctx.y - 1);
      doc.setFontSize(PDF_SIZE.tableCell);
      doc.setFont('helvetica', 'normal');
      pdfSetTextColor(doc, PDF_INK.muted);
      doc.text(isoDateToFr(row.date), ml + 1, ctx.y + 3.2);
      doc.text(row.type, ml + 24, ctx.y + 3.2);
      doc.setFont('times', 'normal');
      const lbl = doc.splitTextToSize(truncatePdfCell(row.label, 56), 52);
      doc.text(lbl, ml + 39, ctx.y + 3.2);
      const det = doc.splitTextToSize(truncatePdfCell(row.detail || '—', 90), 70);
      doc.text(det, ml + 96, ctx.y + 3.2);
      doc.setFont('helvetica', 'bold');
      pdfSetTextColor(doc, PDF_INK.ink);
      doc.text(formatEUR(row.amount), rightCol - 1, ctx.y + 3.2, { align: 'right' });
      doc.setFont('times', 'normal');
      doc.setTextColor(0, 0, 0);
      ctx.y += rowH;
    }
  }

  /* ——— Page mentions légales ——— */
  doc.addPage();
  ctx.y = ml + 6;
  ctx.y = drawPdfSectionTitle(doc, ml, contentW, ctx.y, '5. Mentions légales et limites d’usage');
  const legalBlocks = [
    'Ce document est produit automatiquement par InkFlow à partir des données saisies dans l’application. Il ne constitue ni une liasse fiscale officielle, ni une liasse comptable certifiée, ni une preuve auprès de l’administration.',
    'Les montants d’URSSAF, d’impôt sur le revenu et de TVA effectifs figurent sur tes espaces professionnels (auto-entrepreneur, impots.gouv.fr…) et tes courriers. Vérifie toujours SIRET, mentions obligatoires et échéances sur les sources officielles.',
    'Facturation électronique, Factur‑X et plateformes de dématérialisation obligatoires (PDP) : cadre légal en évolution. InkFlow ne génère pas ici un fichier structuré au format Factur‑X ni un envoi PDP.',
    `Export du ${params.generatedAtLabel} — fichier ${params.monthKey} — rapport interne InkFlow.`,
  ];
  doc.setFontSize(PDF_SIZE.legal);
  doc.setFont('times', 'normal');
  pdfSetTextColor(doc, PDF_INK.muted);
  for (const block of legalBlocks) {
    const wrapped = doc.splitTextToSize(block, contentW);
    ensureSpace(doc, ctx, wrapped.length * PDF_LEAD.legal + 6);
    doc.text(wrapped, ml, ctx.y);
    ctx.y += wrapped.length * PDF_LEAD.legal + 5;
  }

  finalizePageFooters(doc);

  const pdfBlob = doc.output('blob');
  downloadBlobAsFile(`inkflow-pilotage-${params.monthKey}-detaille.pdf`, pdfBlob);
}
