import React from 'react';
import { Calculator, Loader2, Save } from 'lucide-react';
import {
  AE_SOCIAL_PRESETS_BPS,
  FINANCE_LEGAL_DISCLAIMER_FR,
} from '../../lib/frenchMicroEnterpriseConstants';
import type { StudioFinancePrefs } from '../../types/studioFinancePrefs';

export interface FinancePilotageSettingsFormProps {
  prefs: StudioFinancePrefs;
  setPrefs: React.Dispatch<React.SetStateAction<StudioFinancePrefs>>;
  onSave: () => void | Promise<void>;
  saving: boolean;
  /** Bloque les champs si pas de synchro Studio (ex. Supabase absent). */
  inputsDisabled?: boolean;
  /** Désactive le bouton Enregistrer même si les champs sont visibles */
  saveDisabled?: boolean;
  /** Réduit la marge du bandeau légal dans un panneau déjà dense */
  compactLegalDisclaimer?: boolean;
  /** Masque le bandeau légal (ex. lorsque le même texte figure déjà au-dessus). */
  hideLegalDisclaimer?: boolean;
}

export const FinancePilotageSettingsForm: React.FC<FinancePilotageSettingsFormProps> = ({
  prefs,
  setPrefs,
  onSave,
  saving,
  inputsDisabled = false,
  saveDisabled = false,
  compactLegalDisclaimer = false,
  hideLegalDisclaimer = false,
}) => {
  const baseInput = inputsDisabled ? 'opacity-60 pointer-events-none' : '';

  return (
    <div className="space-y-8">
      {!hideLegalDisclaimer ? (
        <div
          className={`rounded-2xl border border-amber-500/40 border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-sm text-zinc-700 dark:text-zinc-300 ${
            compactLegalDisclaimer ? 'px-4 py-2.5' : 'px-4 py-3'
          }`}
        >
          {FINANCE_LEGAL_DISCLAIMER_FR}
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Affichage des montants
          </h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Indique comment tu saisis les prix (RDV, espèces) et comment tu préfères les lire à
          l’écran.
        </p>

        <div className={`grid gap-4 sm:grid-cols-2 ${baseInput}`}>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Base de saisie
            </span>
            <select
              value={prefs.amount_input_basis}
              disabled={inputsDisabled}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  amount_input_basis: e.target.value as StudioFinancePrefs['amount_input_basis'],
                }))
              }
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-white"
            >
              <option value="ttc">TTC (toutes taxes comprises)</option>
              <option value="ht">HT (hors taxes)</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Affichage principal
            </span>
            <select
              value={prefs.display_basis}
              disabled={inputsDisabled}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  display_basis: e.target.value as StudioFinancePrefs['display_basis'],
                }))
              }
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-white"
            >
              <option value="ttc">Mettre en avant le TTC</option>
              <option value="ht">Mettre en avant le HT</option>
            </select>
          </label>
        </div>

        <label className={`block space-y-1.5 ${baseInput}`}>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            TVA (basis points — 2000 = 20,00 %)
          </span>
          <input
            type="number"
            min={0}
            max={5000}
            step={10}
            disabled={inputsDisabled}
            value={prefs.vat_rate_bps}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                vat_rate_bps: Math.max(0, parseInt(e.target.value, 10) || 0),
              }))
            }
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-white"
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Pilotage auto-entrepreneur
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Presets indicatifs pour les cotisations — ajuste le taux si tu connais ta situation.
        </p>
        <label className={`block space-y-1.5 ${baseInput}`}>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Preset</span>
          <select
            value={prefs.ae_social_preset}
            disabled={inputsDisabled}
            onChange={(e) => {
              const id = e.target.value as StudioFinancePrefs['ae_social_preset'];
              const bps = AE_SOCIAL_PRESETS_BPS[id] ?? prefs.ae_cotisation_rate_bps;
              setPrefs((p) => ({ ...p, ae_social_preset: id, ae_cotisation_rate_bps: bps }));
            }}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-white"
          >
            <option value="services">Prestations (indicatif)</option>
            <option value="bic">Ventes / BIC (indicatif)</option>
            <option value="custom">Personnalisé</option>
          </select>
        </label>
        <label className={`block space-y-1.5 ${baseInput}`}>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Taux cotisations (basis points sur le CA)
          </span>
          <input
            type="number"
            min={0}
            max={6000}
            step={10}
            disabled={inputsDisabled}
            value={prefs.ae_cotisation_rate_bps}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                ae_cotisation_rate_bps: Math.max(0, parseInt(e.target.value, 10) || 0),
                ae_social_preset: 'custom',
              }))
            }
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-white"
          />
        </label>
        <label className={`block space-y-1.5 ${baseInput}`}>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Plafond CA annuel (€, indicatif)
          </span>
          <input
            type="number"
            min={1000}
            max={500000}
            step={100}
            disabled={inputsDisabled}
            value={prefs.ae_plafond_ca_eur}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                ae_plafond_ca_eur: Math.max(1, parseInt(e.target.value, 10) || 0),
              }))
            }
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-white"
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Profil fiscal (indicatif)
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Pour les estimations et les rappels URSSAF — aucune donnée envoyée aux administrations
          depuis InkFlow.
        </p>
        <label className={`block space-y-1.5 ${baseInput}`}>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Fréquence de déclaration
          </span>
          <select
            value={prefs.declaration_frequency}
            disabled={inputsDisabled}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                declaration_frequency: e.target
                  .value as StudioFinancePrefs['declaration_frequency'],
              }))
            }
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-white"
          >
            <option value="trimestrial">Trimestrielle (indication)</option>
            <option value="monthly">Mensuelle (indication)</option>
          </select>
        </label>
        <label className={`flex items-center gap-3 ${baseInput}`}>
          <input
            type="checkbox"
            disabled={inputsDisabled}
            checked={prefs.versement_liberatoire}
            onChange={(e) => setPrefs((p) => ({ ...p, versement_liberatoire: e.target.checked }))}
            className="rounded border-zinc-300 w-4 h-4"
          />
          <span className="text-sm text-zinc-800 dark:text-zinc-200">
            Versement libératoire (estimation d’impôt sur les cartes si cochée)
          </span>
        </label>
        <label className={`block space-y-1.5 ${baseInput}`}>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Taux VL (bps — 170 ≈ 1,70 %)
          </span>
          <input
            type="number"
            min={0}
            max={1000}
            step={10}
            disabled={inputsDisabled || !prefs.versement_liberatoire}
            value={prefs.vl_rate_bps}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                vl_rate_bps: Math.max(0, parseInt(e.target.value, 10) || 0),
              }))
            }
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-white"
          />
        </label>
        <label className={`block space-y-1.5 ${baseInput}`}>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Mention TVA</span>
          <select
            value={prefs.regime_tva}
            disabled={inputsDisabled}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                regime_tva: e.target.value as StudioFinancePrefs['regime_tva'],
              }))
            }
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-white"
          >
            <option value="franchise">Franchise en base</option>
            <option value="reel_simplifie">TVA réelle simplifiée</option>
            <option value="reel_normal">TVA réelle normale</option>
          </select>
        </label>
      </section>

      <section className="space-y-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Comparateur prix (opt-in)
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Si tu actives l’option, tu pourras envoyer des contributions de prix anonymisées
          (catégorie + libellé) pour alimenter une base collaborative — fonctionnalité en évolution.
        </p>
        <label className={`flex items-center gap-3 cursor-pointer ${baseInput}`}>
          <input
            type="checkbox"
            disabled={inputsDisabled}
            checked={prefs.share_prices_collaborative_opt_in}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, share_prices_collaborative_opt_in: e.target.checked }))
            }
            className="rounded border-zinc-300 w-4 h-4"
          />
          <span className="text-sm text-zinc-800 dark:text-zinc-200">
            J’accepte de contribuer aux indicateurs de prix (données agrégées, jamais mon studio
            seul).
          </span>
        </label>
      </section>

      <button
        type="button"
        onClick={() => void onSave()}
        disabled={saving || saveDisabled || inputsDisabled}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Enregistrer les réglages
      </button>
    </div>
  );
};
