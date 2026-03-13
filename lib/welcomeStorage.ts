/**
 * Persistance du flux d'accueil (Note du fondateur + Config studio)
 */

const WELCOME_KEY = 'inkflow_welcome_done';

export function isWelcomeDone(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(WELCOME_KEY) === '1';
  } catch {
    return true;
  }
}

export function setWelcomeDone(): void {
  try {
    localStorage.setItem(WELCOME_KEY, '1');
  } catch {
    // ignore
  }
}
