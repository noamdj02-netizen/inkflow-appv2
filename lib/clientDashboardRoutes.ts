/**
 * Chemins stables de l’espace client web.
 *
 * Portail canonique : `/discover` → `ClientAccountHubPage` (compte, santé, magic link).
 * Exploration tatoueurs : `/explorer`, `/discover/:city`, etc.
 *
 * `@deprecated` L’ancien monolithe `ClientDashboard.tsx` et `/client/dashboard` sont retirés ;
 * redirects dans `App.tsx` (`ClientLegacySubpathRedirect`).
 */
export type ClientDashboardTab = 'home' | 'explore' | 'favorites' | 'map' | 'rdv' | 'profile';

export const PATH_CLIENT_DASHBOARD = '/discover' as const;

export const CLIENT_DASHBOARD_TABS: ClientDashboardTab[] = [
  'home',
  'explore',
  'favorites',
  'map',
  'rdv',
  'profile',
];

export function pathForClientDashboardTab(t: ClientDashboardTab): string {
  if (t === 'home') return PATH_CLIENT_DASHBOARD;
  return `${PATH_CLIENT_DASHBOARD}?tab=${encodeURIComponent(t)}`;
}

export function readClientDashboardTabFromLocation(): ClientDashboardTab {
  if (typeof window === 'undefined') return 'home';
  const t = new URLSearchParams(window.location.search).get('tab');
  if (t && (CLIENT_DASHBOARD_TABS as string[]).includes(t)) return t as ClientDashboardTab;
  return 'home';
}

/** URL absolue pour e-mails / partages (suffixe = path, origin sans slash final). */
export function absoluteUrlForClientDashboardTab(origin: string, t: ClientDashboardTab): string {
  const base = origin.replace(/\/$/, '');
  return `${base}${pathForClientDashboardTab(t)}`;
}
