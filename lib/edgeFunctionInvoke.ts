import { supabase } from './supabase';

/** Détecte les échecs d’invocation typiques (JWT expiré / passerelle Supabase). */
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
  const run = () => supabase.functions.invoke(functionName, { body });
  let { data, error } = await run();
  if (error && isInvokeUnauthorized(error)) {
    await supabase.auth.refreshSession().catch(() => {});
    ({ data, error } = await run());
  }
  return { data, error };
}
