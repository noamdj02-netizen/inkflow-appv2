import { supabase } from './supabase';

export interface SendCollaboratorInviteParams {
  studioId: string;
  collaboratorEmail: string;
  collaboratorName: string;
}

const SESSION_HINT =
  'Session expirée ou invalide. Déconnectez-vous, reconnectez-vous avec le compte propriétaire du studio, puis renvoyez l’invitation.';

/** Évite d’afficher le message brut Supabase (« Invalid JWT ») dans les toasts. */
function mapAuthNoise(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes('invalid jwt') ||
    lower.includes('jwt expired') ||
    (lower.includes('jwt') && (lower.includes('malformed') || lower.includes('invalid')))
  ) {
    return SESSION_HINT;
  }
  return raw;
}

/**
 * Résout un access_token utilisable pour les Edge Functions (rafraîchit si proche de l’expiration).
 */
async function resolveAccessToken(): Promise<string | null> {
  let {
    data: { session },
  } = await supabase.auth.getSession();
  const soon =
    session?.expires_at != null && session.expires_at * 1000 < Date.now() + 120_000;
  if (!session?.access_token || soon) {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session?.access_token) {
      return data.session.access_token;
    }
    ({
      data: { session },
    } = await supabase.auth.getSession());
  }
  return session?.access_token ?? null;
}

function isJwtFailure(status: number, rawMessage: string | null): boolean {
  if (status === 401 || status === 403) return true;
  if (!rawMessage) return false;
  const l = rawMessage.toLowerCase();
  return l.includes('invalid jwt') || l.includes('jwt expired');
}

/**
 * Envoie l’email d’invitation (Edge Function + Resend).
 * Utilise `fetch` au lieu de `supabase.functions.invoke` pour toujours lire le JSON du corps,
 * même quand le statut HTTP n’est pas 2xx (évite le message générique « non-2xx » sans détail).
 */
export async function sendCollaboratorInviteEmail(
  params: SendCollaboratorInviteParams
): Promise<{ ok: boolean; message?: string }> {
  const baseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (!baseUrl || !anonKey) {
    return { ok: false, message: 'Configuration Supabase manquante (URL ou clé).' };
  }

  const pickString = (v: unknown): string | null =>
    typeof v === 'string' && v.trim() ? v.trim() : null;

  const parseResponse = (res: Response, text: string): Record<string, unknown> => {
    if (!text) return {};
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return {};
    }
  };

  const extractBizError = (parsed: Record<string, unknown>): string | null => {
    const nestedErr = parsed.error;
    const nestedMsg =
      nestedErr !== null &&
      typeof nestedErr === 'object' &&
      'message' in nestedErr &&
      typeof (nestedErr as { message: unknown }).message === 'string'
        ? pickString((nestedErr as { message: string }).message)
        : null;
    return (
      (typeof nestedErr === 'string' ? pickString(nestedErr) : null) ??
      nestedMsg ??
      pickString(parsed.message) ??
      pickString(parsed.msg)
    );
  };

  const finalizeFailure = (res: Response, parsed: Record<string, unknown>): { ok: false; message: string } => {
    if (parsed.ok === true) {
      return { ok: false, message: "L'invitation n'a pas abouti. Réessayez." };
    }

    const bizError = extractBizError(parsed);
    if (bizError) {
      return { ok: false, message: mapAuthNoise(bizError) };
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return { ok: false, message: SESSION_HINT };
      }
      return {
        ok: false,
        message:
          "L'invitation n'a pas pu être envoyée (réseau ou service e-mail). Réessayez dans un instant ou vérifiez la configuration Resend côté projet.",
      };
    }

    return { ok: false, message: "L'invitation n'a pas abouti. Réessayez." };
  };

  let accessToken = await resolveAccessToken();
  if (!accessToken) {
    return {
      ok: false,
      message: 'Session expirée ou absente. Reconnectez-vous puis renvoyez l’invitation.',
    };
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/functions/v1/send-collaborator-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: anonKey,
        },
        body: JSON.stringify(params),
      });
    } catch {
      return {
        ok: false,
        message: 'Réseau indisponible. Vérifiez votre connexion et réessayez.',
      };
    }

    let text = '';
    try {
      text = await res.text();
    } catch {
      return {
        ok: false,
        message: `Réponse serveur illisible (${res.status}). Réessayez plus tard.`,
      };
    }

    const parsed = parseResponse(res, text);

    if (parsed.ok === true) {
      return { ok: true };
    }

    const bizError = extractBizError(parsed);
    if (attempt === 0 && isJwtFailure(res.status, bizError)) {
      await supabase.auth.refreshSession().catch(() => {});
      const next = await resolveAccessToken();
      if (!next) {
        return { ok: false, message: SESSION_HINT };
      }
      accessToken = next;
      continue;
    }

    if (!text || Object.keys(parsed).length === 0) {
      if (!res.ok && (res.status === 401 || res.status === 403)) {
        return { ok: false, message: SESSION_HINT };
      }
      return {
        ok: false,
        message: `Réponse serveur illisible (${res.status}). Réessayez plus tard.`,
      };
    }

    return finalizeFailure(res, parsed);
  }

  return { ok: false, message: SESSION_HINT };
}
