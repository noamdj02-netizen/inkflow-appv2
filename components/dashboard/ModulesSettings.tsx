import React, { useCallback, useMemo, useState } from 'react';
import { Star, Sparkles, FileCheck, Heart, Wallet, Calendar, Globe } from 'lucide-react';
import type { StudioDashboardPreferences, StudioModuleId } from '../../types/studioPreferences';
import {
  DEFAULT_STUDIO_DASHBOARD_PREFERENCES,
  STUDIO_PREFERENCES_SCHEMA_VERSION,
} from '../../types/studioPreferences';
import { saveDashboardPreferencesToSupabase } from '../../lib/supabaseDashboard';
import { useToast } from '../../contexts/ToastContext';

const MODULE_CORE_ROWS: {
  id: StudioModuleId;
  label: string;
  description: string;
  Icon: typeof Wallet;
}[] = [
  {
    id: 'planning',
    label: 'Planning & rendez-vous',
    description: 'Demande inbox, agenda et créneaux — le flux principal résa/client.',
    Icon: Calendar,
  },
  {
    id: 'vitrine',
    label: 'Page vitrine & app client',
    description: 'Lien studio, page book et expérience côté client.',
    Icon: Globe,
  },
  {
    id: 'flash_shop',
    label: 'Galerie flash & portfolio',
    description: 'Flashs, vitrine médias.',
    Icon: Sparkles,
  },
];

/** Modules optionnels ou « niveau salon » — cache-les tant que le cœur n’est pas ancré. */
const MODULE_PRO_ROWS: typeof MODULE_CORE_ROWS = [
  { id: 'finance', label: 'Finance', description: 'Revenus, acomptes et pilotage.', Icon: Wallet },
  { id: 'loyalty', label: 'Fidélité', description: 'Points et récompenses clients.', Icon: Star },
  {
    id: 'consent_forms',
    label: 'Consentements',
    description: 'Modèles de formulaires de consentement.',
    Icon: FileCheck,
  },
  {
    id: 'healing_followup',
    label: 'Soins post-tattoo',
    description: 'Fiches de soins et suivi après séance.',
    Icon: Heart,
  },
];

interface ModulesSettingsProps {
  studioId: string;
  value: StudioDashboardPreferences;
  onChange: (next: StudioDashboardPreferences) => void;
}

export const ModulesSettings: React.FC<ModulesSettingsProps> = ({ studioId, value, onChange }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const merged = useMemo(
    () => ({
      ...DEFAULT_STUDIO_DASHBOARD_PREFERENCES,
      ...value,
      schema_version: STUDIO_PREFERENCES_SCHEMA_VERSION,
      modules: {
        ...DEFAULT_STUDIO_DASHBOARD_PREFERENCES.modules,
        ...value.modules,
      },
    }),
    [value]
  );

  const setModule = useCallback(
    (id: StudioModuleId, enabled: boolean) => {
      onChange({
        ...merged,
        modules: {
          ...merged.modules,
          [id]: { ...merged.modules[id], enabled },
        },
      });
    },
    [merged, onChange]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveDashboardPreferencesToSupabase(studioId, merged);
      toast.success('Modules enregistrés');
    } catch {
      toast.error('Impossible d’enregistrer les modules');
    } finally {
      setSaving(false);
    }
  }, [studioId, merged, toast]);

  const renderModuleRow = (row: (typeof MODULE_CORE_ROWS)[0]) => {
    const { id, label, description, Icon } = row;
    const enabled = merged.modules[id]?.enabled !== false;
    return (
      <div
        key={id}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5"
      >
        <div className="flex gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700">
            <Icon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-white">{label}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setModule(id, !enabled)}
          className={`relative inline-flex h-9 w-[52px] shrink-0 cursor-pointer rounded-xl border transition-all active:scale-[0.98] ${
            enabled
              ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500'
              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-7 w-7 mt-0.5 rounded-lg bg-white dark:bg-zinc-900 shadow-sm transition-transform ${
              enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-2xl w-full">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Modules
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base mt-1.5 max-w-2xl">
          Le <strong>cœur InkFlow</strong> couvre réservations, lien book et médias ; activez
          ensuite le bloc <strong>Pro & suivi</strong> (finance, fidélité, conformité). Les données
          restent en base si vous masquez un module.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Cœur — réservations & vitrine
        </h3>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
          {MODULE_CORE_ROWS.map((row) => renderModuleRow(row))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Pro & suivi (avancé)
        </h3>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
          {MODULE_PRO_ROWS.map((row) => renderModuleRow(row))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 font-semibold text-sm  transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
};
