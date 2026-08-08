import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getMainTabLabel,
  getQuickAccessLabel,
  getSettingsMainTabs,
  getSettingsTabMeta,
  getTabHeroModel,
  type TabHeroParams,
} from '@/lib/dashboardI18n';

export function useDashboardI18n() {
  const { t, lang } = useLanguage();

  return useMemo(() => {
    const settingsTabMeta = getSettingsTabMeta(t);
    const settingsMainTabs = getSettingsMainTabs(t);

    return {
      lang,
      t,
      settingsTabMeta,
      settingsMainTabs,
      getMainTabLabel: (id: string) => getMainTabLabel(t, id),
      getQuickAccessLabel: (id: Parameters<typeof getQuickAccessLabel>[1]) =>
        getQuickAccessLabel(t, id),
      getTabHero: (params: Omit<TabHeroParams, 'settingsTabMeta'>) =>
        getTabHeroModel(t, { ...params, settingsTabMeta }),
    };
  }, [t, lang]);
}
