/**
 * OAuth Google Business Profile (Account Management API) — validation + quotas Google Cloud.
 *
 * - **Par défaut (variable absente ou vide) : désactivé** → parcours Place ID + témoignages (MVP sans approbation Google).
 * - Activer l’UI « Connecter Google Business » : `VITE_GOOGLE_BUSINESS_OAUTH_ENABLED=true` sur Vercel / `.env.local`.
 */
export function isGoogleBusinessOAuthUiEnabled(): boolean {
  const raw = (import.meta.env.VITE_GOOGLE_BUSINESS_OAUTH_ENABLED as string | undefined)?.trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'on' || raw === 'yes') return true;
  return false;
}
