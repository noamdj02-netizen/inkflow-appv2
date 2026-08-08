/**
 * Affichage fiscal HT/TTC — calculs purement mécaniques.
 * Les taux et seuils légaux doivent être validés avec un expert ; l’app affiche des estimations.
 */

export type AmountInputBasis = 'ht' | 'ttc';
export type DisplayBasis = 'ht' | 'ttc';

/** Taux TVA en basis points (2000 = 20,00 %). */
export type BasisPoints = number;

export function bpsToRatio(bps: BasisPoints): number {
  if (!Number.isFinite(bps) || bps < 0) return 0;
  return bps / 10_000;
}

/** Montant en unité affichage (euros), arrondi à 2 décimales. */
export function roundMoneyEUR(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Interprète `amountEUR` selon la base de saisie studio et renvoie paire { ht, ttc }.
 */
export function interpretAmountHTTTC(
  amountEUR: number,
  inputBasis: AmountInputBasis,
  vatRateBps: BasisPoints
): { ht: number; ttc: number } {
  const r = bpsToRatio(vatRateBps);
  if (inputBasis === 'ht') {
    const ht = roundMoneyEUR(amountEUR);
    const ttc = roundMoneyEUR(ht * (1 + r));
    return { ht, ttc };
  }
  const ttc = roundMoneyEUR(amountEUR);
  const ht = r === -1 ? ttc : roundMoneyEUR(ttc / (1 + r));
  return { ht, ttc };
}

export function formatEUR(value: number, privacyMode = false): string {
  if (privacyMode) return '••••';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Net estimé après cotisations sociales (auto-entrepreneur) sur le CA TTC encaissé. */
export function estimateNetAfterSocialCharges(
  caTtcEUR: number,
  socialRateBps: BasisPoints
): number {
  const rate = bpsToRatio(socialRateBps);
  return roundMoneyEUR(Math.max(0, caTtcEUR * (1 - rate)));
}
