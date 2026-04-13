import { supabase } from './supabase';

function getAnonKeyForHeaders(): string {
  return (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
}

/** Détecte les échecs d’invocation typiques (JWT expiré / passerelle Supabase). */
/** Message lisible depuis l’erreur renvoyée par `supabase.functions.invoke` (typée `unknown`). */
export function getInvokeErrorMessage(err: unknown, fallback = 'Erreur'): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim()) return m;
  }
  return fallback;
}

/**
 * Extrait `error` / `details` du corps renvoyé par la passerelle (ex. `FunctionsHttpError.context.body`)
 * pour éviter d’afficher uniquement « Edge Function returned a non-2xx status code ».
 */
export function parseFunctionsInvokeErrorBody(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const ctx = (err as { context?: { body?: unknown } }).context;
  const body = ctx?.body;
  if (body == null) return null;
  if (typeof body === 'string') {
    const t = body.trim();
    if (!t) return null;
    try {
      const j = JSON.parse(t) as { error?: string; details?: string; message?: string };
      return j.error || j.details || j.message || null;
    } catch {
      return t.length > 400 ? `${t.slice(0, 400)}…` : t;
    }
  }
  if (typeof body === 'object') {
    const o = body as { error?: unknown; details?: unknown; message?: unknown };
    const e = typeof o.error === 'string' ? o.error : null;
    const d = typeof o.details === 'string' ? o.details : null;
    const m = typeof o.message === 'string' ? o.message : null;
    return e || d || m || null;
  }
  return null;
}

export function isInvokeUnauthorized(err: unknown): boolean {
  if (!err) return false;
  const e = err as { message?: string; context?: { status?: number } };
  const status = e.context?.status;
  if (status === 401 || status === 403 || status === 461) return true;
  const m = (e.message || '').toLowerCase();
  return (
    m.includes('401') ||
    m.includes('403') ||
    m.includes('non-2xx') ||
    m.includes('unauthorized') ||
    m.includes('invalid jwt')
  );
}

/**
 * Appelle une Edge Function avec le client Supabase ; en cas de 401 / JWT, tente
 * `refreshSession()` puis une seconde invocation (même pattern que send-client-conversation-link).
 */
export async function invokeWithJwtRetry<TBody extends Record<string, unknown>>(
  functionName: string,
  body: TBody
): Promise<{ data: unknown; error: unknown }> {
  const run = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    const apikey = getAnonKeyForHeaders();
    if (!token) {
      return supabase.functions.invoke(functionName, { body });
    }
    return supabase.functions.invoke(functionName, {
      body,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(apikey ? { apikey } : {}),
      },
    });
  };
  let { data, error } = await run();
  if (error && isInvokeUnauthorized(error)) {
    await supabase.auth.refreshSession().catch(() => {});
    ({ data, error } = await run());
  }
  return { data, error };
}
