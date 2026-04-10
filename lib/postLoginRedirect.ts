import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { sanitizePostAuthRedirect } from './urls';
const CLIENT_HOME = '/client/dashboard';

/**
 * Client espace client (même logique que {@link resolvePostLoginPath}) : metadata ou ligne portail.
 * Utilisé par ex. `/messages/:threadId` pour préremplir le nom sans écran intermédiaire.
 */
export async function getInkflowPortalClientInfo(
  user: User | null
): Promise<{ isPortalClient: boolean; displayName: string }> {
  if (!user) return { isPortalClient: false, displayName: '' };
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const displayName =
    typeof meta?.full_name === 'string' && meta.full_name.trim()
      ? meta.full_name.trim()
      : typeof meta?.name === 'string' && meta.name.trim()
        ? meta.name.trim()
        : user.email?.split('@')[0] ?? 'Client';

  if (meta?.account_type === 'client' || meta?.role === 'client') {
    return { isPortalClient: true, displayName };
  }

  const { data: profile } = await supabase
    .from('inkflow_client_portal_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profile) return { isPortalClient: true, displayName };
  return { isPortalClient: false, displayName: '' };
}

function emailNorm(e: string | undefined): string {
  return (e || '').toLowerCase().trim();
}

/**
 * Page publique `/messages/:threadId` : évite l’écran « nom » si le visiteur est le bon client.
 * - `pr_*` : e-mail auth = client_email sur la demande projet (RLS `project_requests_client_self`).
 * - `bk_*` : e-mail auth = client_email sur la réservation (policy existante `client_booking_self`).
 * - autres fils : client portail (metadata / profil) comme avant.
 */
export async function resolvePublicMessageAutoProfile(
  threadId: string,
  user: User | null
): Promise<{ skipNameGate: boolean; displayName: string }> {
  if (!user?.email?.trim()) {
    return { skipNameGate: false, displayName: '' };
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fallbackName =
    typeof meta?.full_name === 'string' && meta.full_name.trim()
      ? meta.full_name.trim()
      : typeof meta?.name === 'string' && meta.name.trim()
        ? meta.name.trim()
        : user.email.split('@')[0];

  if (threadId.startsWith('pr_')) {
    const prId = threadId.slice(3);
    const { data } = await supabase
      .from('inkflow_project_requests')
      .select('client_name, client_email')
      .eq('id', prId)
      .maybeSingle();
    if (data?.client_email && emailNorm(data.client_email) === emailNorm(user.email)) {
      const dn = (data.client_name && String(data.client_name).trim()) || fallbackName;
      return { skipNameGate: true, displayName: dn };
    }
    return { skipNameGate: false, displayName: '' };
  }

  if (threadId.startsWith('bk_')) {
    const { data } = await supabase
      .from('inkflow_bookings')
      .select('client_name, client_email')
      .eq('id', threadId)
      .maybeSingle();
    if (data?.client_email && emailNorm(data.client_email) === emailNorm(user.email)) {
      const dn = (data.client_name && String(data.client_name).trim()) || fallbackName;
      return { skipNameGate: true, displayName: dn };
    }
    return { skipNameGate: false, displayName: '' };
  }

  const portal = await getInkflowPortalClientInfo(user);
  if (portal.isPortalClient && portal.displayName.trim()) {
    return { skipNameGate: true, displayName: portal.displayName.trim() };
  }

  return { skipNameGate: false, displayName: '' };
}

/**
 * Après connexion : envoie les clients portail vers /client/dashboard, les pros vers la cible habituelle.
 */
export async function resolvePostLoginPath(
  raw: string | null | undefined,
  options?: { defaultPath?: string }
): Promise<string> {
  const base = sanitizePostAuthRedirect(raw, options);
  /** Chemins explicites (ex. tunnel onboarding) : ne pas écraser avec la home client. */
  if (base.startsWith('/onboarding')) return base;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return base;
    const { isPortalClient } = await getInkflowPortalClientInfo(user);
    if (isPortalClient) return CLIENT_HOME;
    return base;
  } catch {
    return base;
  }
}
