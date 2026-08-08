/**
 * Tunnel obligatoire espace client : mot de passe → identité → questionnaire santé.
 */
import type { User } from '@supabase/supabase-js';
import { clientNeedsPassword } from './clientAuth';
import { fetchClientHealthProfile, isHealthFormComplete } from './clientHealthProfile';

export const CLIENT_ONBOARDING_FINALIZE_PATH = '/onboarding/finaliser-profil';

/** Hub web client canonique : profil, photo, téléphone, questionnaire santé. */
export const CLIENT_ACCOUNT_HUB_PATH = '/discover' as const;

const PHONE_MIN = 10;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

/** Prénom, nom et téléphone renseignés (métadonnées Auth). */
export function clientProfileFieldsComplete(meta: Record<string, unknown>): boolean {
  const fn = typeof meta.client_first_name === 'string' ? meta.client_first_name.trim() : '';
  const ln = typeof meta.client_last_name === 'string' ? meta.client_last_name.trim() : '';
  const phoneRaw = typeof meta.client_phone === 'string' ? meta.client_phone.trim() : '';
  if (!fn || !ln) return false;
  return digitsOnly(phoneRaw).length >= PHONE_MIN;
}

/**
 * Profil + santé complets — débloque réservation / favoris côté app client.
 */
export async function isClientPortalFullyReady(user: User | null): Promise<boolean> {
  if (!user) return false;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (clientNeedsPassword(meta)) return false;
  if (!clientProfileFieldsComplete(meta)) return false;
  const hp = await fetchClientHealthProfile(user.id);
  return isHealthFormComplete(hp);
}
