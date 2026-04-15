import {
  isJustSignedUp,
  isWelcomeDone,
  getWelcomeFlowCheckpoint,
  isWelcomeRequired,
} from './welcomeStorage';

function norm(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

/** Le flux d’accueil est terminé si l’une des clés persistées (email ou id) est marquée « done ». */
function isWelcomeDoneForSession(email: string | null | undefined, userId: string | null | undefined): boolean {
  const e = norm(email);
  const i = (userId ?? '').trim();
  if (e && isWelcomeDone(e)) return true;
  if (i && isWelcomeDone(i)) return true;
  return false;
}

function hasCheckpointOrRequired(email: string | null | undefined, userId: string | null | undefined): boolean {
  const e = norm(email);
  const i = (userId ?? '').trim();
  if (e && (getWelcomeFlowCheckpoint(e) != null || isWelcomeRequired(e))) return true;
  if (i && (getWelcomeFlowCheckpoint(i) != null || isWelcomeRequired(i))) return true;
  return false;
}

/**
 * Affiche le flux d’accueil tant que l’onboarding n’est pas terminé :
 * - obligation pour les comptes marqués `welcome_required` (inscription),
 * - reprise si parcours commencé (checkpoint),
 * - session « vient de s’inscrire » (ne doit plus être effacée avant la fin du flux — voir DashboardPro).
 */
export function shouldShowWelcomeFlow(
  email: string | null | undefined,
  userId: string | null | undefined,
): boolean {
  if (!norm(email) && !(userId ?? '').trim()) return false;
  if (isWelcomeDoneForSession(email, userId)) return false;
  return hasCheckpointOrRequired(email, userId) || isJustSignedUp();
}
