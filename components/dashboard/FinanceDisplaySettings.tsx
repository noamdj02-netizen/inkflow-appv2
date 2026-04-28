import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import {
  getStudioFinancePrefsFromSupabase,
  saveStudioFinancePrefsToSupabase,
} from '../../lib/supabaseFinanceInventory';
import {
  DEFAULT_STUDIO_FINANCE_PREFS,
  type StudioFinancePrefs,
} from '../../types/studioFinancePrefs';
import { FinancePilotageSettingsForm } from './FinancePilotageSettingsForm';

interface FinanceDisplaySettingsProps {
  studioId: string | null;
  useSupabase: boolean;
}

export const FinanceDisplaySettings: React.FC<FinanceDisplaySettingsProps> = ({
  studioId,
  useSupabase,
}) => {
  const toast = useToast();
  const [prefs, setPrefs] = useState<StudioFinancePrefs>(DEFAULT_STUDIO_FINANCE_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!studioId || !useSupabase) {
      setLoading(false);
      setPrefs(DEFAULT_STUDIO_FINANCE_PREFS);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getStudioFinancePrefsFromSupabase(studioId)
      .then((p) => {
        if (!cancelled) setPrefs(p);
      })
      .catch(() => {
        if (!cancelled) toast.error('Impossible de charger les préférences finance');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studioId, useSupabase, toast]);

  const save = useCallback(async () => {
    if (!studioId || !useSupabase) {
      toast.error('Connecte-toi avec Supabase pour enregistrer');
      return;
    }
    setSaving(true);
    try {
      await saveStudioFinancePrefsToSupabase(studioId, prefs);
      toast.success('Préférences enregistrées');
    } catch {
      toast.error('Erreur à l’enregistrement');
    } finally {
      setSaving(false);
    }
  }, [studioId, useSupabase, prefs, toast]);

  if (!useSupabase || !studioId) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 text-sm text-zinc-600 dark:text-zinc-400">
        Configure Supabase pour synchroniser les préférences HT/TTC et le pilotage
        auto-entrepreneur. Tu retrouveras aussi ces réglages sous{' '}
        <span className="font-medium text-zinc-800 dark:text-zinc-200">
          Finance → Pilotage auto-entrepreneur
        </span>{' '}
        une fois connecté.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm py-8">
        <Loader2 className="w-5 h-5 animate-spin" />
        Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <p className="text-sm text-zinc-600 dark:text-zinc-300 rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 px-4 py-3">
        <span className="font-medium text-zinc-900 dark:text-white">Pilotage centralisé :</span> les
        mêmes réglages sont disponibles sous{' '}
        <span className="font-medium">Finance → Pilotage auto-entrepreneur</span> pour tout voir
        avec les chiffres et les liens officiels.
      </p>
      <FinancePilotageSettingsForm
        prefs={prefs}
        setPrefs={setPrefs}
        onSave={save}
        saving={saving}
        saveDisabled={false}
        inputsDisabled={false}
        compactLegalDisclaimer={false}
      />
    </div>
  );
};
