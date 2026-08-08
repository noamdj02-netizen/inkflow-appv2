import React, { useCallback, useMemo, useState } from 'react';
import { Star, Sparkles, FileCheck, Heart, Wallet, Calendar, Globe } from 'lucide-react';
import type { StudioDashboardPreferences, StudioModuleId } from '../../types/studioPreferences';
import {
  DEFAULT_STUDIO_DASHBOARD_PREFERENCES,
  STUDIO_PREFERENCES_SCHEMA_VERSION,
} from '../../types/studioPreferences';
import { saveDashboardPreferencesToSupabase } from '../../lib/supabaseDashboard';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface ModulesSettingsProps {
  studioId: string;
  value: StudioDashboardPreferences;
  onChange: (next: StudioDashboardPreferences) => void;
}

export const ModulesSettings: React.FC<ModulesSettingsProps> = ({ studioId, value, onChange }) => {
  const toast = useToast();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  const moduleCoreRows = useMemo(
    () =>
      [
        {
          id: 'planning' as StudioModuleId,
          label: t('dashboard.settings.modules.planning.label'),
          description: t('dashboard.settings.modules.planning.desc'),
          Icon: Calendar,
        },
        {
          id: 'vitrine' as StudioModuleId,
          label: t('dashboard.settings.modules.vitrine.label'),
          description: t('dashboard.settings.modules.vitrine.desc'),
          Icon: Globe,
        },
        {
          id: 'flash_shop' as StudioModuleId,
          label: t('dashboard.settings.modules.flash.label'),
          description: t('dashboard.settings.modules.flash.desc'),
          Icon: Sparkles,
        },
      ] as const,
    [t]
  );

  const moduleProRows = useMemo(
    () =>
      [
        {
          id: 'finance' as StudioModuleId,
          label: t('dashboard.settings.modules.finance.label'),
          description: t('dashboard.settings.modules.finance.desc'),
          Icon: Wallet,
        },
        {
          id: 'loyalty' as StudioModuleId,
          label: t('dashboard.settings.modules.loyalty.label'),
          description: t('dashboard.settings.modules.loyalty.desc'),
          Icon: Star,
        },
        {
          id: 'consent_forms' as StudioModuleId,
          label: t('dashboard.settings.modules.consent.label'),
          description: t('dashboard.settings.modules.consent.desc'),
          Icon: FileCheck,
        },
        {
          id: 'healing_followup' as StudioModuleId,
          label: t('dashboard.settings.modules.care.label'),
          description: t('dashboard.settings.modules.care.desc'),
          Icon: Heart,
        },
      ] as const,
    [t]
  );

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
      toast.success(t('dashboard.settings.modules.saved'));
    } catch {
      toast.error(t('dashboard.settings.modules.saveError'));
    } finally {
      setSaving(false);
    }
  }, [studioId, merged, toast, t]);

  const renderModuleRow = (row: (typeof moduleCoreRows)[number]) => {
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
            <p className="type-body text-muted-foreground mt-0.5">{description}</p>
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
        <h2 className="type-heading">{t('dashboard.settings.modules.pageTitle')}</h2>
        <p className="type-subtitle mt-1.5 max-w-2xl">{t('dashboard.settings.modules.pageDesc')}</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          {t('dashboard.settings.modules.coreHeading')}
        </h3>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
          {moduleCoreRows.map((row) => renderModuleRow(row))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t('dashboard.settings.modules.proHeading')}
        </h3>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
          {moduleProRows.map((row) => renderModuleRow(row))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 font-semibold text-sm  transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? t('dashboard.settings.modules.saving') : t('dashboard.settings.modules.save')}
        </button>
      </div>
    </div>
  );
};
