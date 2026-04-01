import type { StudioDashboardPreferences, StudioModuleId } from '../types/studioPreferences';
import { DEFAULT_STUDIO_DASHBOARD_PREFERENCES } from '../types/studioPreferences';

/** Indique si un module est activé (fusion avec les valeurs par défaut). */
export function isModuleEnabled(
  prefs: StudioDashboardPreferences | null | undefined,
  moduleId: StudioModuleId
): boolean {
  const defToggle = DEFAULT_STUDIO_DASHBOARD_PREFERENCES.modules[moduleId];
  const def = defToggle?.enabled !== false;
  const v = prefs?.modules?.[moduleId]?.enabled;
  return v !== undefined ? v : def;
}
