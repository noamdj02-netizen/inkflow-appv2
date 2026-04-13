import { isJustSignedUp, isWelcomeDone } from './welcomeStorage';

/** Affiche le flux d’accueil uniquement après création de compte (pas après une simple connexion). */
export function shouldShowWelcomeFlow(userScopedId: string | null | undefined): boolean {
  return !isWelcomeDone(userScopedId) && isJustSignedUp();
}
