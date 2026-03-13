import React, { useState, useEffect } from 'react';
import { CreditCard, Percent, Shield, ExternalLink } from 'lucide-react';
import { getStudioId } from '../../lib/supabase';
import { getPaymentSettingsFromSupabase, savePaymentSettingsToSupabase } from '../../lib/supabaseDashboard';
import { useToast } from '../../contexts/ToastContext';
import { useAutoSave } from '../../hooks/useAutoSave';

const STORAGE_KEY = 'inkflow-payment-settings';

interface PaymentSettings {
  depositPercentage: number;
  stripeConnected: boolean;
  requireDeposit: boolean;
}

const defaultSettings: PaymentSettings = { depositPercentage: 30, stripeConnected: false, requireDeposit: true };

interface PaymentsSettingsProps {
  userEmail?: string;
  studioName?: string;
}

export const PaymentsSettings: React.FC<PaymentsSettingsProps> = ({ userEmail, studioName }) => {
  const toast = useToast();
  const [settings, setSettings] = useState<PaymentSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
    } catch {}
    return defaultSettings;
  });
  const useSupabase = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY && userEmail && studioName);
  const studioId = userEmail && studioName ? getStudioId(userEmail, studioName) : null;

  // Load from Supabase on mount
  useEffect(() => {
    if (!studioId || !useSupabase) return;
    getPaymentSettingsFromSupabase(studioId).then((fromDb) => {
      if (Object.keys(fromDb).length > 0) {
        const merged = { ...defaultSettings, ...fromDb } as PaymentSettings;
        setSettings(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
    }).catch(() => {});
  }, [studioId, useSupabase]);

  // Auto-save with debounce (replaces manual useEffect + setTimeout pattern)
  const { saving, saved, saveNow } = useAutoSave(settings, async (s) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    if (studioId && useSupabase) {
      await savePaymentSettingsToSupabase(studioId, s as unknown as Record<string, unknown>);
    }
  }, { debounceMs: 500 });

  const save = () => {
    saveNow();
    toast.success('Parametres de paiement enregistres');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Paiements</h2>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Acomptes et connexion Stripe</p>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-card-secondary)] border border-[var(--border)]">
          <CreditCard className="w-8 h-8 text-[var(--text-secondary)]" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[var(--text-primary)]">Stripe</div>
            <div className="text-sm text-[var(--text-secondary)]">
              {settings.stripeConnected ? 'Compte connecté' : 'Non connecté (mode démo)'}
            </div>
            {!settings.stripeConnected && (
              <a
                href="https://dashboard.stripe.com/connect/accounts/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2"
              >
                Connecter mon compte Stripe
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <button
            onClick={() => {
              if (!settings.stripeConnected) {
                window.open('https://dashboard.stripe.com/connect/accounts/overview', '_blank');
              }
              setSettings(s => ({ ...s, stripeConnected: !s.stripeConnected }));
            }}
            className={`shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${settings.stripeConnected ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/30' : 'bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600'}`}
          >
            {settings.stripeConnected ? 'Connecté ✓' : 'Connecter'}
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-[var(--text-primary)]">
            <Percent className="w-4 h-4" /> Pourcentage d'acompte (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.depositPercentage}
            onChange={(e) => setSettings(s => ({ ...s, depositPercentage: Number(e.target.value) || 0 }))}
            className="w-full max-w-[200px] px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Ex: 30% sur un tatouage de 150€ = 45€ d'acompte</p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[var(--text-secondary)]" />
            <div>
              <div className="font-semibold text-[var(--text-primary)]">Exiger un acompte</div>
              <div className="text-sm text-[var(--text-secondary)]">Les réservations nécessitent un acompte pour être confirmées</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettings(s => ({ ...s, requireDeposit: !s.requireDeposit }))}
            className={`relative w-12 h-7 rounded-full transition-colors ${settings.requireDeposit ? 'bg-blue-600' : 'bg-[var(--border)]'}`}
          >
            <span
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: settings.requireDeposit ? 26 : 4 }}
            />
          </button>
        </div>

        <button onClick={save} disabled={saving}
          className={`px-6 py-3 rounded-xl font-semibold transition-colors touch-target disabled:opacity-50 ${saved ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600'}`}>
          {saving ? 'Enregistrement...' : saved ? 'Enregistre !' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
};
