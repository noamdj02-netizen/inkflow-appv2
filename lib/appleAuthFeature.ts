/**
 * Affiche les boutons « Se connecter avec Apple » (même logique que Google : visible par défaut
 * quand l’auth Supabase est active). Pour masquer le bouton sans désactiver Supabase :
 * `VITE_ENABLE_APPLE_AUTH=false` ou `0` (Vercel + `.env.local` au build).
 */
export function isAppleSignInEnabled(): boolean {
  const v = import.meta.env.VITE_ENABLE_APPLE_AUTH;
  if (v === 'false' || v === '0') return false;
  return true;
}
