import type { AmountInputBasis, DisplayBasis } from '../lib/financeDisplay';
import type { AESocialPresetId } from '../lib/frenchMicroEnterpriseConstants';

export interface StudioFinancePrefs {
  amount_input_basis: AmountInputBasis;
  display_basis: DisplayBasis;
  vat_rate_bps: number;
  ae_cotisation_rate_bps: number;
  ae_social_preset: AESocialPresetId;
  ae_plafond_ca_eur: number;
  share_prices_collaborative_opt_in: boolean;
}

export const DEFAULT_STUDIO_FINANCE_PREFS: StudioFinancePrefs = {
  amount_input_basis: 'ttc',
  display_basis: 'ttc',
  vat_rate_bps: 2000,
  ae_cotisation_rate_bps: 2110,
  ae_social_preset: 'services',
  ae_plafond_ca_eur: 77_700,
  share_prices_collaborative_opt_in: false,
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

  return base;
}
