import { DEMO_ACCOUNT_EMAIL } from '../data/demoData';

/**
 * Comptes e-mail pour lesquels l’app affiche des données de démonstration
 * (dashboard pro + espace client), avec libellés explicites — pas des métriques réelles.
 */
const INKFLOW_DEMO_ACCOUNT_EMAILS = new Set<string>([DEMO_ACCOUNT_EMAIL.toLowerCase()]);

export function isInkflowDemoAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  return INKFLOW_DEMO_ACCOUNT_EMAILS.has(email.trim().toLowerCase());
}
