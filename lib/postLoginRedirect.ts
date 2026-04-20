import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { sanitizePostAuthRedirect } from './urls';
import { normalizePublicMessageThreadId } from './threadIds';
import { isInkflowInternalStaffEmail } from './inkflowInternalStaff';

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

/** Path seul, sans query/hash — pour comparer `/dashboard` et `/dashboard?subscribe=…`. */
function pathnameOnly(raw: string): string {
  const s = String(raw || '').trim();
  if (!s) return '/';
  if (s.startsWith('/')) {
    const noHash = s.split('#')[0] ?? s;
    return (noHash.split('?')[0] || '/').replace(/\/+$/, '') || '/';
  }
  try {
    const u = new URL(s);
    let p = u.pathname || '/';
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p || '/';
  } catch {
    return '/';
  }
}

/**
 * Nom affiché pour les messages publics (sans formulaire) : métadonnées, partie locale de l’e-mail, ou « Client ».
 */
export function getPublicMessageSenderDisplayName(user: User | null): string {
  if (!user) return 'Client';
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  if (typeof meta?.full_name === 'string' && meta.full_name.trim()) return meta.full_name.trim();
  if (typeof meta?.name === 'string' && meta.name.trim()) return meta.name.trim();
  const local = user.email?.split('@')[0]?.trim();
  if (local) return local;
  return 'Client';
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
  const tid = normalizePublicMessageThreadId(threadId);

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

  if (tid.startsWith('pr_')) {
    const { data } = await supabase
      .from('inkflow_project_requests')
      .select('client_name, client_email')
      .eq('id', tid)
      .maybeSingle();
    if (data?.client_email && emailNorm(data.client_email) === emailNorm(user.email)) {
      const dn = (data.client_name && String(data.client_name).trim()) || fallbackName;
      return { skipNameGate: true, displayName: dn };
    }
    return { skipNameGate: false, displayName: '' };
  }

  if (tid.startsWith('bk_')) {
    const { data } = await supabase
      .from('inkflow_bookings')
      .select('client_name, client_email')
      .eq('id', tid)
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
 * Après connexion : applique la cible `redirect` / sessionStorage / défaut (souvent `/dashboard`).
 * Ne force plus `/client/dashboard` selon le seul profil portail : la page `/login` (« Bon retour »)
 * mène au dashboard tatoueur ; l’espace client passe par `/client` ou une URL sous `/client/…`.
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
    /**
     * Comptes équipe InkFlow (@ink-flow.me, @inkflow.me, VITE_FOUNDER_ADMIN_EMAILS).
     * Après OAuth / lien magique, la cible est souvent `/dashboard?subscribe=…` : l’égalité stricte
     * sur `base === '/dashboard'` échouait → dashboard tatoueur en prod.
     */
    if (isInkflowInternalStaffEmail(user.email)) {
      const p = pathnameOnly(base);
      if (p.startsWith('/onboarding')) return base;
      if (p.startsWith('/client')) return base;
      if (p === '/admin' || p.startsWith('/admin/')) return base;
      return '/admin';
    }
    return base;
  } catch {
    return base;
  }
}
