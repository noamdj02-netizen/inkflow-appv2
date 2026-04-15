/**
 * Comptes e-mail pour lesquels l’app affiche des données de démonstration
 * (dashboard pro + espace client), avec libellés explicites — pas des métriques réelles.
 * (Liste vide par défaut : ajouter un e-mail uniquement pour une démo contrôlée.)
 */
const INKFLOW_DEMO_ACCOUNT_EMAILS = new Set<string>();

export function isInkflowDemoAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  return INKFLOW_DEMO_ACCOUNT_EMAILS.has(email.trim().toLowerCase());
}
