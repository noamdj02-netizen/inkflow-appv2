import { isPosthogInitialized, posthog } from './posthogInit';

/**
 * Événements produit (PostHog, opt-in cookies « Tout accepter » + VITE_POSTHOG_KEY).
 * Taxonomie stable pour funnels, rétention et intelligence produit.
 */
export const AnalyticsEvents = {
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_COMPLETED: 'login_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  BOOKING_REQUEST_SUBMITTED: 'booking_request_submitted',
  PROJECT_REQUEST_SUBMITTED: 'project_request_submitted',
  CRM_CLIENTS_IMPORTED: 'crm_clients_imported',
  INSTAGRAM_CONNECTION_STARTED: 'instagram_connection_started',
  INSTAGRAM_DISCONNECTED: 'instagram_disconnected',
  /** Funnel tatoueur — étapes explicites pour graphiques PostHog */
  ONBOARDING_FUNNEL: 'onboarding_funnel',
  /** North star — séquence inscription → lien public → RDV/agenda → acompte (voir docs/NORTH-STAR-FUNNEL.md) */
  NORTH_STAR_FUNNEL: 'north_star_funnel',
  FIRST_CLIENT_CREATED: 'first_client_created',
  FIRST_APPOINTMENT_CREATED: 'first_appointment_created',
  TATTOOER_FIRST_DEPOSIT: 'tattooer_first_deposit_received',
  BOOK_PAGE_VIEWED: 'book_page_viewed',
  CLIENT_BOOKING_DEPOSIT_SUCCEEDED: 'client_booking_deposit_succeeded',
  /** Studio a passé le RDV en confirmé + e-mail au client */
  CLIENT_RDV_CONFIRMED_BY_STUDIO: 'client_rdv_confirmed_by_studio',
  NPS_SCORE: 'nps_score',
  NPS_DISMISSED: 'nps_prompt_dismissed',
} as const;

export type OnboardingFunnelStep =
  | 'signup'
  | 'first_client'
  | 'first_appointment'
  | 'first_deposit_received'
  | 'book_page_viewed';

export type NorthStarFunnelStep =
  | 'public_booking_url_live'
  | 'first_appointment_in_agenda'
  | 'first_deposit_received';

export function captureEvent(event: string, properties?: Record<string, unknown>): void {
  if (!isPosthogInitialized()) return;
  try {
    posthog.capture(event, properties);
  } catch {
    /* ignore */
  }
}

export function trackOnboardingFunnel(
  step: OnboardingFunnelStep,
  extra?: Record<string, string | number | boolean | null | undefined>
): void {
  captureEvent(AnalyticsEvents.ONBOARDING_FUNNEL, {
    step,
    funnel: 'tattooer_activation',
    ...extra,
  });
}

export function trackNorthStarFunnelStep(
  step: NorthStarFunnelStep,
  extra?: Record<string, string | number | boolean | null | undefined>
): void {
  captureEvent(AnalyticsEvents.NORTH_STAR_FUNNEL, {
    step,
    funnel: 'tattooer_growth',
    ...extra,
  });
}

export function identifyStudioUser(
  userId: string,
  props: { email?: string; name?: string; studio_id?: string | null }
): void {
  if (!isPosthogInitialized() || !userId) return;
  try {
    posthog.identify(userId, {
      email: props.email,
      name: props.name,
      user_type: 'tattooer',
      ...(props.studio_id ? { studio_id: props.studio_id } : {}),
    });
  } catch {
    /* ignore */
  }
}
