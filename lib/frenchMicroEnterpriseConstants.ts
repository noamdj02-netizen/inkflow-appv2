/**
 * Constantes indicatives pour l’UI « auto-entrepreneur » (France).
 * Les plafonds et taux évoluent : l’utilisateur peut les surcharger dans les préférences studio.
 *
 * NE PAS présenter comme conseil juridique ou fiscal.
 */

export const FINANCE_LEGAL_DISCLAIMER_FR =
  'Les montants et taux sont des estimations à titre pédagogique. Ils ne remplacent pas un expert-comptable ni les règles en vigueur pour votre activité.';

/** Plafond CA par défaut (€ / an) — valeur indicative, configurable par studio. */
export const DEFAULT_AE_PLAFOND_CA_EUR = 77_700;

/** TVA France taux standard indicatif (basis points). */
export const DEFAULT_VAT_RATE_BPS = 2000;

/**
 * Cotisations sociales indicatives (basis points sur le CA selon le preset choisi).
 * Ex. 2110 = 21,10 %. À ajuster manuellement par l’utilisateur.
 */
export const AE_SOCIAL_PRESETS_BPS = {
  /** Prestations de services (ordre de grandeur fréquent) */
  services: 2110,
  /** Ventes / BIC (ordre de grandeur — à valider selon votre case) */
  bic: 1280,
  /** Neutre — l’utilisateur saisit son taux */
  custom: 2110,
} as const;

export type AESocialPresetId = keyof typeof AE_SOCIAL_PRESETS_BPS;
