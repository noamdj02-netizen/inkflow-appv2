import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Percent, Shield, ExternalLink } from 'lucide-react';
import { getStudioId } from '../../lib/supabase';
import { getPaymentSettingsFromSupabase, savePaymentSettingsToSupabase } from '../../lib/supabaseDashboard';
import { useToast } from '../../contexts/ToastContext';

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
  const [saved, setSaved] = useState(false);
  const useSupabase = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY && userEmail && studioName);
  const studioId = userEmail && studioName ? getStudioId(userEmail, studioName) : null;

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

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (!studioId || !useSupabase) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      savePaymentSettingsToSupabase(studioId, settings as unknown as Record<string, unknown>).catch(console.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      saveTimeoutRef.current = null;
    }, 500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [settings, studioId, useSupabase]);

  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      if (studioId && useSupabase) {
        await savePaymentSettingsToSupabase(studioId, settings as unknown as Record<string, unknown>);
      }
      setSaved(true);
      toast.success('Parametres de paiement enregistres');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Erreur sauvegarde paiements:', err);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Paiements</h2>
        <p className="text-neutral-600 text-sm mt-1">Acomptes et connexion Stripe</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-neutral-200 space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
          <CreditCard className="w-8 h-8 text-neutral-600" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold">Stripe</div>
            <div className="text-sm text-neutral-600">
              {settings.stripeConnected ? 'Compte connecté' : 'Non connecté (mode démo)'}
            </div>
            {!settings.stripeConnected && (
              <a
                href="https://dashboard.stripe.com/connect/accounts/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 underline underline-offset-2"
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
            className={`shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${settings.stripeConnected ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}
          >
            {settings.stripeConnected ? 'Connecté ✓' : 'Connecter'}
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <Percent className="w-4 h-4" /> Pourcentage d'acompte (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.depositPercentage}
            onChange={(e) => setSettings(s => ({ ...s, depositPercentage: Number(e.target.value) || 0 }))}
            className="w-full max-w-[200px] px-4 py-3 border border-neutral-200 rounded-xl"
          />
          <p className="text-sm text-neutral-500 mt-1">Ex: 30% sur un tatouage de 150€ = 45€ d'acompte</p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-neutral-600" />
            <div>
              <div className="font-semibold">Exiger un acompte</div>
              <div className="text-sm text-neutral-600">Les réservations nécessitent un acompte pour être confirmées</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettings(s => ({ ...s, requireDeposit: !s.requireDeposit }))}
            className={`relative w-12 h-7 rounded-full transition-colors ${settings.requireDeposit ? 'bg-neutral-900' : 'bg-neutral-200'}`}
          >
            <span
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: settings.requireDeposit ? 26 : 4 }}
            />
          </button>
        </div>

        <button onClick={save} disabled={saving}
          className={`px-6 py-3 rounded-xl font-semibold transition-colors touch-target disabled:opacity-50 ${saved ? 'bg-green-600 text-white' : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}>
          {saving ? 'Enregistrement...' : saved ? 'Enregistre !' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
};