import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Save, Loader2 } from 'lucide-react';
import type { Client } from '../../types';
import {
  fetchStampLoyaltySettings,
  saveStampLoyaltySettings,
  fetchStampStatesForStudio,
  type StampLoyaltySettings,
  DEFAULT_STAMP_LOYALTY,
} from '../../lib/stampLoyalty';
import { useToast } from '../../contexts/ToastContext';
import { ClientStampCard } from './ClientStampCard';

interface StampLoyaltyTabProps {
  studioId: string | null;
  clients: Client[];
}

export const StampLoyaltyTab: React.FC<StampLoyaltyTabProps> = ({ studioId, clients }) => {
  const toast = useToast();
  const [settings, setSettings] = useState<StampLoyaltySettings>(DEFAULT_STAMP_LOYALTY);
  const [stateByClient, setStateByClient] = useState<Record<string, { stampsInCycle: number; totalCompletedTattoos: number }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!studioId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [s, states] = await Promise.all([
        fetchStampLoyaltySettings(studioId),
        fetchStampStatesForStudio(studioId),
      ]);
      setSettings(s);
      setStateByClient(states);
    } catch {
      toast.error('Impossible de charger la fidélité tampons');
    } finally {
      setLoading(false);
    }
  }, [studioId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!studioId || saving) return;
    setSaving(true);
    try {
      await saveStampLoyaltySettings(studioId, settings);
      toast.success('Paramètres enregistrés');
    } catch {
      toast.error('Erreur à l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (!studioId) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400 p-6">
        Connecte un studio Supabase pour activer la fidélité tampons.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Fidélité — Carte à tampons</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base mt-1.5 max-w-2xl">
          Définissez combien de séances terminées déclenchent un montant offert. Un code promo unique est envoyé au client par email ; vous êtes alerté sur les prochaines demandes de RDV.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Paramètres</h2>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings((p) => ({ ...p, enabled: e.target.checked }))}
            className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
          />
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Activer le programme</span>
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Séances terminées requises</label>
            <input
              type="number"
              min={1}
              max={50}
              value={settings.tattoosRequired}
              onChange={(e) =>
                setSettings((p) => ({ ...p, tattoosRequired: Math.max(1, parseInt(e.target.value, 10) || 1) }))
              }
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Montant offert (€)</label>
            <input
              type="number"
              min={1}
              max={5000}
              value={settings.rewardEuros}
              onChange={(e) =>
                setSettings((p) => ({ ...p, rewardEuros: Math.max(1, parseInt(e.target.value, 10) || 1) }))
              }
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Chaque fois que vous passez un rendez-vous en « Terminé », un tampon est ajouté. Au {settings.tattoosRequired}
          e, un code promo <strong>INK-…</strong> de {settings.rewardEuros}€ est créé et envoyé au client par email.
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Aperçu par client</h3>
        <div className="space-y-4">
          {clients.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun client pour le moment.</p>
          ) : (
            clients.slice(0, 30).map((c) => {
              const st = stateByClient[c.id];
              return (
                <div key={c.id} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
                  <div className="font-medium text-zinc-900 dark:text-white mb-2">{c.name}</div>
                  <ClientStampCard
                    enabled={settings.enabled}
                    tattoosRequired={settings.tattoosRequired}
                    stampsInCycle={st?.stampsInCycle ?? 0}
                    totalCompleted={st?.totalCompletedTattoos}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
