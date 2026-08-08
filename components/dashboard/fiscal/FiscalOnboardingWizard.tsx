import React, { useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import type {
  DeclarationFrequency,
  RegimeTva,
  StudioFinancePrefs,
} from '../../../types/studioFinancePrefs';

const STEPS = 4;

interface FiscalOnboardingWizardProps {
  isOpen: boolean;
  onDismiss: () => void;
  prefs: StudioFinancePrefs;
  setPrefs: React.Dispatch<React.SetStateAction<StudioFinancePrefs>>;
  /** Sauveguarde le profil fusionné puis ferme pour le parent. */
  onPersist: (merged: StudioFinancePrefs) => Promise<void>;
}

export const FiscalOnboardingWizard: React.FC<FiscalOnboardingWizardProps> = ({
  isOpen,
  onDismiss,
  prefs,
  setPrefs,
  onPersist,
}) => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const persistDone = async () => {
    setSaving(true);
    try {
      await onPersist({ ...prefs, fiscal_onboarding_done: true });
    } finally {
      setSaving(false);
    }
  };

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));

  return (
    <Modal isOpen={isOpen} onClose={onDismiss} title="Profil fiscal (≈ 2 min)" size="lg">
      <div className="space-y-6">
        <p className="type-body text-muted-foreground">
          Étape {step + 1} / {STEPS} — personnaliser les estimations du pilotage (pédagogique, sans
          valeur juridique).
        </p>

        {step === 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Déclarations CA URSSAF plutôt sur une base…
            </p>
            <label className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <input
                type="radio"
                name="decl_freq_ob"
                checked={prefs.declaration_frequency === 'trimestrial'}
                onChange={() =>
                  setPrefs((p) => ({
                    ...p,
                    declaration_frequency: 'trimestrial' as DeclarationFrequency,
                  }))
                }
              />
              <span className="text-sm text-zinc-800 dark:text-zinc-200">Trimestrielle</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <input
                type="radio"
                name="decl_freq_ob"
                checked={prefs.declaration_frequency === 'monthly'}
                onChange={() =>
                  setPrefs((p) => ({
                    ...p,
                    declaration_frequency: 'monthly' as DeclarationFrequency,
                  }))
                }
              />
              <span className="text-sm text-zinc-800 dark:text-zinc-200">Mensuelle</span>
            </label>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Versement libératoire ?
            </p>
            <p className="text-xs text-zinc-500">
              Réponse indicative pour estimer une retenue d’impôt sur le CA (si activée dans ton
              dossier).
            </p>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.versement_liberatoire}
                onChange={(e) =>
                  setPrefs((p) => ({
                    ...p,
                    versement_liberatoire: e.target.checked,
                  }))
                }
                className="rounded border-zinc-300 w-4 h-4"
              />
              <span className="text-sm text-zinc-800 dark:text-zinc-200">
                Oui — inclure une estimation d’impôt (sur la base VL indiquée dans les réglages)
              </span>
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              SIRET & identifiants officiels
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Vérifie toujours tes identifiants (SIRET, numéros URSSAF) sur tes courriers ou le
              portail auto-entrepreneur avant toute déclaration.
            </p>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Régime TVA (mention UI)
            </p>
            <select
              value={prefs.regime_tva}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  regime_tva: e.target.value as RegimeTva,
                }))
              }
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-white"
            >
              <option value="franchise">Franchise en base (indication)</option>
              <option value="reel_simplifie">TVA réelle simplifiée (indication)</option>
              <option value="reel_normal">TVA réelle normale (indication)</option>
            </select>
          </div>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between sm:items-center pt-2 border-t border-zinc-200/80 dark:border-zinc-700">
          <button
            type="button"
            disabled={saving}
            onClick={onDismiss}
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 py-2 disabled:opacity-50"
          >
            Reporter
          </button>
          <div className="flex gap-2">
            {step < STEPS - 1 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm active:scale-[0.98] transition-all"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => void persistDone()}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Terminer
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
