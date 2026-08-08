/**
 * Objectif produit « première réservation en ligne » — jalons guidés tatoueur.
 */
import type { Appointment, Booking, FlashDesign } from '@/types';
import {
  computeDashboardActivationPercent,
  type DashboardActivationInput,
} from './onboardingMetrics';

export type FirstBookingStepId = 'vitrine' | 'availability' | 'share' | 'flash' | 'first_booking';

export interface FirstBookingStep {
  id: FirstBookingStepId;
  label: string;
  hint: string;
}

export const FIRST_BOOKING_STEPS: FirstBookingStep[] = [
  {
    id: 'vitrine',
    label: 'URL vitrine prête',
    hint: 'Choisis le lien que tu partages (Paramètres → Vitrine).',
  },
  {
    id: 'availability',
    label: 'Créneaux ouverts',
    hint: 'Les clients doivent voir des dates réservables.',
  },
  {
    id: 'share',
    label: 'Lien partagé',
    hint: 'Story, bio Instagram ou message — une fois suffit.',
  },
  {
    id: 'flash',
    label: 'Au moins un flash (recommandé)',
    hint: 'Accélère les réservations vitrine.',
  },
  {
    id: 'first_booking',
    label: 'Première demande reçue',
    hint: 'Une réservation ou un brief depuis ta page.',
  },
];

const SHARE_MARK_KEY = 'inkflow-vitrine-link-shared';

export function markVitrineLinkShared(): void {
  try {
    localStorage.setItem(SHARE_MARK_KEY, '1');
  } catch {
    //
  }
}

export function hasMarkedVitrineLinkShared(): boolean {
  try {
    return localStorage.getItem(SHARE_MARK_KEY) === '1';
  } catch {
    return false;
  }
}

export interface FirstBookingGoalInput {
  studioSlug: string | null | undefined;
  flashDesigns: FlashDesign[];
  appointments: Appointment[];
  bookings: Booking[];
  availabilitySetupComplete?: boolean;
  paymentsSetupComplete?: boolean;
  /** Sync Supabase ou localStorage — prioritaire si défini. */
  vitrineLinkShared?: boolean;
}

export interface FirstBookingGoalState {
  steps: Record<FirstBookingStepId, boolean>;
  completedCount: number;
  totalSteps: number;
  percent: number;
  isGoalReached: boolean;
  /** Checklist dashboard classique (hors partage manuel). */
  activationPercent: number;
  nextStepId: FirstBookingStepId | null;
}

export function computeFirstBookingGoalState(input: FirstBookingGoalInput): FirstBookingGoalState {
  const hasSlug = Boolean(input.studioSlug?.trim());
  const hasAvailability = input.availabilitySetupComplete === true;
  const hasShared =
    input.vitrineLinkShared === true ||
    (input.vitrineLinkShared !== false && hasMarkedVitrineLinkShared());
  const hasFlash = input.flashDesigns.length > 0;
  const hasBooking = input.bookings.some(
    (b) => b.status !== 'rejected' && b.status !== 'cancelled'
  );

  const steps: Record<FirstBookingStepId, boolean> = {
    vitrine: hasSlug,
    availability: hasAvailability,
    share: hasShared,
    flash: hasFlash,
    first_booking: hasBooking,
  };

  const entries = FIRST_BOOKING_STEPS.map((s) => steps[s.id]);
  const completedCount = entries.filter(Boolean).length;
  const totalSteps = FIRST_BOOKING_STEPS.length;
  const percent = Math.round((completedCount / totalSteps) * 100);
  const isGoalReached = steps.first_booking;
  const nextStepId = FIRST_BOOKING_STEPS.find((s) => !steps[s.id])?.id ?? null;

  const activationPercent = computeDashboardActivationPercent({
    studioSlug: input.studioSlug,
    flashCount: input.flashDesigns.length,
    availabilitySetupComplete: input.availabilitySetupComplete,
    paymentsSetupComplete: input.paymentsSetupComplete,
    appointmentCount: input.appointments.length,
  } satisfies DashboardActivationInput);

  return {
    steps,
    completedCount,
    totalSteps,
    percent,
    isGoalReached,
    activationPercent,
    nextStepId,
  };
}
