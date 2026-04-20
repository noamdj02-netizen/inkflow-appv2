/**
 * Métriques d’activation onboarding (rapport quotidien / analytics).
 * - **Dashboard** : `computeDashboardActivationPercent` (checklist Paramètres / flash / RDV).
 * - **Funnel produit** : `computeActivationPercent` (profil complet + flash + Stripe + réservation).
 */

export interface OnboardingActivationInput {
  hasSlug: boolean;
  hasAvatar: boolean;
  bioDescriptionLength: number;
  flashCount: number;
  stripeConnected: boolean;
  bookingCount: number;
}

/** Profil = slug + avatar + bio (≥ 25 caractères) — aligné Edge `onboarding-automation`. */
export function isProfileActivationComplete(i: OnboardingActivationInput): boolean {
  return Boolean(i.hasSlug && i.hasAvatar && i.bioDescriptionLength >= 25);
}

/** 0–100 % — 4 blocs : profil, flash, Stripe, ≥1 booking. */
export function computeActivationPercent(i: OnboardingActivationInput): number {
  const profile = isProfileActivationComplete(i);
  const flash = i.flashCount > 0;
  const stripe = i.stripeConnected;
  const book = i.bookingCount > 0;
  const steps = [profile, flash, stripe, book];
  const done = steps.filter(Boolean).length;
  return Math.round((done / 4) * 100);
}

export function activationStepsLabelFr(i: OnboardingActivationInput): string[] {
  const lines: string[] = [];
  lines.push(isProfileActivationComplete(i) ? '✓ Profil vitrine' : '○ Profil vitrine');
  lines.push(i.flashCount > 0 ? '✓ Premier flash' : '○ Premier flash');
  lines.push(i.stripeConnected ? '✓ Stripe Connect' : '○ Stripe Connect');
  lines.push(i.bookingCount > 0 ? '✓ Première réservation' : '○ Première réservation');
  return lines;
}

/** Props alignées sur `StudioSetupChecklist` — barre 0–100 % dans l’aperçu dashboard. */
export interface DashboardActivationInput {
  studioSlug: string | null | undefined;
  flashCount: number;
  availabilitySetupComplete?: boolean;
  paymentsSetupComplete?: boolean;
  appointmentCount: number;
}

export function computeDashboardActivationPercent(p: DashboardActivationInput): number {
  const checks: boolean[] = [
    Boolean(p.studioSlug?.trim()),
    p.flashCount > 0,
    p.availabilitySetupComplete === true,
    p.paymentsSetupComplete === true,
    p.appointmentCount > 0,
  ];
  let denom = 0;
  let ok = 0;
  for (let i = 0; i < checks.length; i++) {
    if (i === 2 && p.availabilitySetupComplete === undefined) continue;
    if (i === 3 && p.paymentsSetupComplete === undefined) continue;
    denom++;
    if (checks[i]) ok++;
  }
  if (denom === 0) return 0;
  return Math.round((ok / denom) * 100);
}
