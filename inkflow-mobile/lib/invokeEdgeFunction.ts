import { supabase, isSupabaseConfigured } from './supabase';

function getSupabaseUrl(): string {
  const s =
    (typeof process !== 'undefined' && (process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined)) || '';
  return String(s).trim().replace(/\/$/, '');
}

function getAnonKey(): string {
  const s =
    (typeof process !== 'undefined' && (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined)) || '';
  return String(s).trim();
}

/** Appelle une Edge Function Supabase avec le JWT courant (même contrat que le web `invokeEdgeFunctionViaFetch`). */
export async function invokeEdgeFunctionViaFetch<TBody extends Record<string, unknown>>(
  functionName: string,
  body: TBody
): Promise<{ data: unknown; error: string | null }> {
  const baseUrl = getSupabaseUrl();
  const apikey = getAnonKey();
  if (!baseUrl || !apikey) {
    return { data: null, error: 'Supabase (URL ou clé anon) non configuré dans l’app.' };
  }
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: 'Supabase non initialisé.' };
  }

  const runOnce = async (accessToken: string) => {
    const fnUrl = `${baseUrl}/functions/v1/${functionName}`;
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { _nonJson: text.slice(0, 600) };
      }
    }
    return { res, parsed };
  };

  await supabase.auth.getUser().catch(() => {});
  const {
    data: { session },
  } = await supabase.auth.getSession();
  let token = session?.access_token;
  if (!token) {
    await supabase.auth.refreshSession().catch(() => {});
    const {
      data: { session: s2 },
    } = await supabase.auth.getSession();
    token = s2?.access_token;
  }
  if (!token) {
    return { data: null, error: 'Session expirée. Reconnecte-toi dans InkFlow puis réessaie.' };
  }

  let { res, parsed } = await runOnce(token);

  if (res.status === 401 || res.status === 403) {
    await supabase.auth.refreshSession().catch(() => {});
    const {
      data: { session: s3 },
    } = await supabase.auth.getSession();
    const t2 = s3?.access_token;
    if (t2) {
      const out = await runOnce(t2);
      res = out.res;
      parsed = out.parsed;
    }
  }

  if (res.ok) {
    const obj =
      parsed && typeof parsed === 'object' ? (parsed as { success?: boolean; error?: string }) : {};
    if (obj.success === false && typeof obj.error === 'string' && obj.error.trim()) {
      return { data: parsed, error: obj.error.trim() };
    }
    return { data: parsed, error: null };
  }

  const obj = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  const msg =
    (typeof obj.error === 'string' && obj.error.trim()) ||
    (typeof obj.message === 'string' && obj.message.trim()) ||
    `Erreur HTTP ${res.status} — ${functionName}`;
  return { data: parsed, error: msg };
}
