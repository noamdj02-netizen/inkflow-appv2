/**
 * Persistance du flux d'accueil (Note du fondateur + config studio).
 * Clés scoppées par compte pour éviter les mélanges multi-profils sur le même navigateur.
 */

const LEGACY_WELCOME_KEY = 'inkflow_welcome_done';

function scopedKey(suffix: string, userId: string): string {
  const safe = userId.replace(/[^a-zA-Z0-9@._-]/g, '_').slice(0, 120);
  return `inkflow_${suffix}_${safe}`;
}

/** Flux configuration terminé (disponibilités + sauvegarde). */
export function isWelcomeDone(userScopedId: string | null | undefined): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (userScopedId?.trim()) {
      if (localStorage.getItem(scopedKey('welcome_done', userScopedId)) === '1') return true;
    }
    if (localStorage.getItem(LEGACY_WELCOME_KEY) === '1') return true;
    return false;
  } catch {
    return true;
  }
}

export function setWelcomeDone(userScopedId: string): void {
  try {
    localStorage.setItem(scopedKey('welcome_done', userScopedId), '1');
  } catch {
    // ignore
  }
}

/**
 * L’utilisateur a validé « C’est parti » sur la note du fondateur — ne plus afficher cette page.
 * Indépendant de la fin du flux (studio / dispos).
 */
export function isFounderNoteDone(userScopedId: string | null | undefined): boolean {
  if (typeof window === 'undefined') return true;
  if (!userScopedId?.trim()) return false;
  try {
    return localStorage.getItem(scopedKey('founder_note', userScopedId)) === '1';
  } catch {
    return true;
  }
}

export function setFounderNoteDone(userScopedId: string): void {
  try {
    localStorage.setItem(scopedKey('founder_note', userScopedId), '1');
  } catch {
    // ignore
  }
}

/**
 * Marqué lors de la création du compte (sessionStorage — persiste entre redirects,
 * disparaît à la fermeture de l'onglet).
 */
export function markJustSignedUp(): void {
  try {
    sessionStorage.setItem('inkflow_just_signed_up', '1');
  } catch {
    // ignore
  }
}

export function isJustSignedUp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem('inkflow_just_signed_up') === '1';
  } catch {
    return false;
  }
}

export function clearJustSignedUp(): void {
  try {
    sessionStorage.removeItem('inkflow_just_signed_up');
  } catch {
    // ignore
  }
}

/** Reprise du flux après rechargement ou retour Stripe (même onglet / session). */
export type WelcomeFlowStepId =
  | 'founder'
  | 'studio'
  | 'phone'
  | 'avatar'
  | 'siret'
  | 'availability'
  | 'establishment'
  | 'notifications'
  | 'payments';

const WELCOME_STEP_ORDER: WelcomeFlowStepId[] = [
  'founder',
  'studio',
  'phone',
  'avatar',
  'siret',
  'availability',
  'establishment',
  'notifications',
  'payments',
];

export function getWelcomeFlowCheckpoint(userScopedId: string | null | undefined): WelcomeFlowStepId | null {
  if (typeof window === 'undefined' || !userScopedId?.trim()) return null;
  try {
    const raw = localStorage.getItem(scopedKey('welcome_checkpoint', userScopedId));
    if (!raw || !WELCOME_STEP_ORDER.includes(raw as WelcomeFlowStepId)) return null;
    return raw as WelcomeFlowStepId;
  } catch {
    return null;
  }
}

export function setWelcomeFlowCheckpoint(userScopedId: string, step: WelcomeFlowStepId): void {
  try {
    localStorage.setItem(scopedKey('welcome_checkpoint', userScopedId), step);
  } catch {
    // ignore
  }
}

export function clearWelcomeFlowCheckpoint(userScopedId: string): void {
  try {
    localStorage.removeItem(scopedKey('welcome_checkpoint', userScopedId));
  } catch {
    // ignore
  }
}

/**
 * Nouveau compte pro : oblige à terminer l’onboarding (localStorage, survit fermeture d’onglet).
 * À associer à l’e-mail normalisé (même clé que le dashboard).
 */
export function markWelcomeRequired(userScopedId: string): void {
  try {
    localStorage.setItem(scopedKey('welcome_required', userScopedId.trim().toLowerCase()), '1');
  } catch {
    // ignore
  }
}

export function isWelcomeRequired(userScopedId: string | null | undefined): boolean {
  if (!userScopedId?.trim()) return false;
  try {
    return localStorage.getItem(scopedKey('welcome_required', userScopedId.trim().toLowerCase())) === '1';
  } catch {
    return false;
  }
}

export function clearWelcomeRequired(userScopedId: string): void {
  try {
    localStorage.removeItem(scopedKey('welcome_required', userScopedId.trim().toLowerCase()));
  } catch {
    // ignore
  }
}

/**
 * Support / test : rejouer l’onboarding (efface la progression locale puis remet l’obligation).
 */
export function replayWelcomeOnboardingLocal(userScopedId: string): void {
  const s = userScopedId.trim().toLowerCase();
  if (!s) return;
  try {
    localStorage.removeItem(scopedKey('welcome_done', s));
    localStorage.removeItem(scopedKey('founder_note', s));
    localStorage.removeItem(scopedKey('welcome_checkpoint', s));
    localStorage.setItem(scopedKey('welcome_required', s), '1');
    sessionStorage.setItem('inkflow_just_signed_up', '1');
  } catch {
    // ignore
  }
}
