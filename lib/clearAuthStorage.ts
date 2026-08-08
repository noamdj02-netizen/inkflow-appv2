/**
 * Vide tout le stockage local et session lié à l'app et au tenant (InkFlow).
 * À appeler impérativement à la déconnexion pour éviter qu'un autre utilisateur
 * sur le même appareil voie des données en cache (localStorage / sessionStorage).
 */

const INKFLOW_PREFIX = 'inkflow';

export function clearAllInkflowStorage(): void {
  if (typeof window === 'undefined') return;

  /** Conservés : préférences onboarding par compte (sinon re-login = note du fondateur à nouveau). */
  const keepKey = (key: string) =>
    key.startsWith('inkflow_welcome_done_') || key.startsWith('inkflow_founder_note_');

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.toLowerCase().startsWith(INKFLOW_PREFIX) && !keepKey(key)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  sessionStorage.removeItem('redirectAfterLogin');
}
