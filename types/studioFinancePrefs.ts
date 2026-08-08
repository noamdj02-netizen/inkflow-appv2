import type { AmountInputBasis, DisplayBasis } from '../lib/financeDisplay';
import type { AESocialPresetId } from '../lib/frenchMicroEnterpriseConstants';

/** Fréquence de déclaration URSSAF (indicatif — à confirmer sur ton compte). */
export type DeclarationFrequency = 'monthly' | 'trimestrial';

/** Régime TVA — affichage pédagogique (PRD pilotage v2). */
export type RegimeTva = 'franchise' | 'reel_simplifie' | 'reel_normal';

export interface StudioFinancePrefs {
  amount_input_basis: AmountInputBasis;
  display_basis: DisplayBasis;
  vat_rate_bps: number;
  ae_cotisation_rate_bps: number;
  ae_social_preset: AESocialPresetId;
  ae_plafond_ca_eur: number;
  share_prices_collaborative_opt_in: boolean;
  /** Déclaration CA URSSAF : mensuelle ou trimestrielle (résumé onboarding). */
  declaration_frequency: DeclarationFrequency;
  /** Versement libératoire d’impôt sur le revenu (si tu l’as choisi à la création). */
  versement_liberatoire: boolean;
  /** Taux VL indicatif en basis points (170 = 1,70 %). */
  vl_rate_bps: number;
  regime_tva: RegimeTva;
  /** Wizard fiscal 1ère visite complété. */
  fiscal_onboarding_done: boolean;

  /** Rappels personnels facultatifs (YYYY‑MM‑DD) — vérifie sur tes courriers officiels. */
  pilotage_next_urssaf_due_date: string | null;
  pilotage_next_fiscal_due_date: string | null;
}

export const DEFAULT_STUDIO_FINANCE_PREFS: StudioFinancePrefs = {
  amount_input_basis: 'ttc',
  display_basis: 'ttc',
  vat_rate_bps: 2000,
  ae_cotisation_rate_bps: 2110,
  ae_social_preset: 'services',
  ae_plafond_ca_eur: 77_700,
  share_prices_collaborative_opt_in: false,
  declaration_frequency: 'trimestrial',
  versement_liberatoire: false,
  vl_rate_bps: 170,
  regime_tva: 'franchise',
  fiscal_onboarding_done: false,
  pilotage_next_urssaf_due_date: null,
  pilotage_next_fiscal_due_date: null,
};

export function normalizeStudioFinancePrefs(
  raw: Record<string, unknown> | null | undefined
): StudioFinancePrefs {
  const base = { ...DEFAULT_STUDIO_FINANCE_PREFS };
  if (!raw || typeof raw !== 'object') return base;

  const ib = raw.amount_input_basis;
  if (ib === 'ht' || ib === 'ttc') base.amount_input_basis = ib;

  const db = raw.display_basis;
  if (db === 'ht' || db === 'ttc') base.display_basis = db;

  const vat = Number(raw.vat_rate_bps);
  if (Number.isFinite(vat) && vat >= 0 && vat <= 5000) base.vat_rate_bps = Math.round(vat);

  const ae = Number(raw.ae_cotisation_rate_bps);
  if (Number.isFinite(ae) && ae >= 0 && ae <= 6000) base.ae_cotisation_rate_bps = Math.round(ae);

  const preset = raw.ae_social_preset;
  if (preset === 'services' || preset === 'bic' || preset === 'custom') {
    base.ae_social_preset = preset;
  }

  const plaf = Number(raw.ae_plafond_ca_eur);
  if (Number.isFinite(plaf) && plaf > 0 && plaf < 1_000_000)
    base.ae_plafond_ca_eur = Math.round(plaf);

  if (typeof raw.share_prices_collaborative_opt_in === 'boolean') {
    base.share_prices_collaborative_opt_in = raw.share_prices_collaborative_opt_in;
  }

  const df = raw.declaration_frequency;
  if (df === 'monthly' || df === 'trimestrial') base.declaration_frequency = df;

  if (typeof raw.versement_liberatoire === 'boolean') {
    base.versement_liberatoire = raw.versement_liberatoire;
  }

  const vlBps = Number(raw.vl_rate_bps);
  if (Number.isFinite(vlBps) && vlBps >= 0 && vlBps <= 1000) base.vl_rate_bps = Math.round(vlBps);

  const rt = raw.regime_tva;
  if (rt === 'franchise' || rt === 'reel_simplifie' || rt === 'reel_normal') {
    base.regime_tva = rt;
  }

  if (typeof raw.fiscal_onboarding_done === 'boolean') {
    base.fiscal_onboarding_done = raw.fiscal_onboarding_done;
  }

  const isoMaybe = (v: unknown): string | null => {
    if (typeof v !== 'string') return null;
    const s = v.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  };
  if ('pilotage_next_urssaf_due_date' in raw) {
    if (raw.pilotage_next_urssaf_due_date === null || raw.pilotage_next_urssaf_due_date === '') {
      base.pilotage_next_urssaf_due_date = null;
    } else {
      const udue = isoMaybe(raw.pilotage_next_urssaf_due_date);
      base.pilotage_next_urssaf_due_date = udue;
    }
  }
  if ('pilotage_next_fiscal_due_date' in raw) {
    if (raw.pilotage_next_fiscal_due_date === null || raw.pilotage_next_fiscal_due_date === '') {
      base.pilotage_next_fiscal_due_date = null;
    } else {
      const fdue = isoMaybe(raw.pilotage_next_fiscal_due_date);
      base.pilotage_next_fiscal_due_date = fdue;
    }
  }

  return base;
}
