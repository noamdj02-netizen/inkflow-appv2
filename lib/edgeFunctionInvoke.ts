import { supabase } from './supabase';

/** Passerelle Supabase : rejette certains JWT (ex. ES256) avant Deno — message actionnable pour le tatoueur. */
function augmentGatewayJwtError(parsed: unknown, fallbackMsg: string): string {
  if (!parsed || typeof parsed !== 'object') return fallbackMsg;
  const o = parsed as Record<string, unknown>;
  const code = typeof o.code === 'string' ? o.code : '';
  const message = typeof o.message === 'string' ? o.message : '';
  if (
    code === 'UNAUTHORIZED_UNSUPPORTED_TOKEN_ALGORITHM' ||
    /unsupported jwt algorithm|ES256/i.test(message)
  ) {
    return 'Envoi bloqué par la passerelle (jeton ES256). Côté studio : redéploie la fonction Edge avec npm run deploy:function:send-alternative-date-proposal puis réessaie.';
  }
  return fallbackMsg;
}

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

/**
 * Corps JSON de l’erreur HTTP (SDK récents : `await error.context.json()`, pas seulement `context.body`).
 * À utiliser pour les toasts / logs quand `invoke` renvoie une erreur.
 */
function parseJsonErrorFields(body: unknown): string | null {
  if (body && typeof body === 'object') {
    const b = body as { error?: string; details?: string; message?: string; userMessage?: string };
    const msg = b.userMessage || b.details || b.error || b.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }
  return null;
}

/**
 * Lit le corps HTTP de l’erreur invoke (Response fetch, ou objet avec .json()).
 * clone() évite « body already read » sur certains navigateurs / versions du SDK.
 */
async function readErrorContextBody(ctx: object): Promise<string | null> {
  const asResponse = typeof Response !== 'undefined' && ctx instanceof Response ? ctx : null;
  if (asResponse) {
    try {
      const text = await asResponse.clone().text();
      const t = text.trim();
      if (!t) return null;
      try {
        const parsed = JSON.parse(t) as { error?: string; details?: string; message?: string };
        return parseJsonErrorFields(parsed) || t.slice(0, 800);
      } catch {
        return t.length > 800 ? `${t.slice(0, 800)}…` : t;
      }
    } catch {
      /* ignore */
    }
    return null;
  }
  const maybeJson = (ctx as { json?: () => Promise<unknown> }).json;
  if (typeof maybeJson === 'function') {
    try {
      const body = await maybeJson.call(ctx);
      const fromObj = parseJsonErrorFields(body);
      if (fromObj) return fromObj;
      if (typeof body === 'string' && body.trim()) {
        try {
          const j = JSON.parse(body) as { error?: string; details?: string };
          return j.details || j.error || body.trim();
        } catch {
          return body.trim().slice(0, 500);
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export async function parseFunctionsInvokeErrorFromContext(err: unknown): Promise<string | null> {
  if (!err || typeof err !== 'object') return null;
  const ctx = (err as { context?: unknown }).context;
  if (!ctx || typeof ctx !== 'object') return null;
  const fromCtx = await readErrorContextBody(ctx as object);
  if (fromCtx) return fromCtx;
  return parseFunctionsInvokeErrorBody(err);
}

/**
 * Message lisible pour un échec `functions.invoke` (combine `data`, `context.json()`, `context.body`, puis `message`).
 */
export async function getInvokeFailureMessage(
  err: unknown,
  data: unknown,
  fallback = 'Échec de l’appel',
): Promise<string> {
  if (data && typeof data === 'object') {
    const d = data as { userMessage?: string; error?: string; details?: string; message?: string };
    if (typeof d.userMessage === 'string' && d.userMessage.trim()) return d.userMessage.trim();
    if (typeof d.details === 'string' && d.details.trim()) return d.details.trim();
    if (typeof d.error === 'string' && d.error.trim()) return d.error.trim();
    if (typeof d.message === 'string' && d.message.trim()) return d.message.trim();
  }
  const fromContext = await parseFunctionsInvokeErrorFromContext(err);
  if (fromContext) return fromContext;
  const sync = parseFunctionsInvokeErrorBody(err);
  if (sync) return sync;
  return getInvokeErrorMessage(err, fallback);
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
 *
 * Appelle d’abord `getUser()` pour resynchroniser le JWT (évite les 401 si `getSession()` était
 * encore vide juste après chargement du dashboard — cas fréquent pour les mails transactionnels).
 */
/**
 * Appelle une Edge Function via `fetch` direct (JWT + apikey), sans passer par `supabase.functions.invoke`.
 * Utile quand le SDK renvoie une erreur générique (« non-2xx ») avec `data: null` alors que le corps JSON
 * contient pourtant `error` / `details` (cas fréquents : 502 Resend, 400 validation).
 */
export async function invokeEdgeFunctionViaFetch<TBody extends Record<string, unknown>>(
  functionName: string,
  body: TBody,
): Promise<{ data: unknown; error: string | null }> {
  const baseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const apikey = getAnonKeyForHeaders();
  if (!baseUrl || !apikey) {
    return { data: null, error: 'Supabase (URL ou clé anon) non configuré.' };
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
  let {
    data: { session },
  } = await supabase.auth.getSession();
  let token = session?.access_token;
  if (!token) {
    await supabase.auth.refreshSession().catch(() => {});
    const {
      data: { session: refreshedSession },
    } = await supabase.auth.getSession();
    token = refreshedSession?.access_token;
  }
  if (!token) {
    return { data: null, error: 'Session expirée. Reconnecte-toi puis réessaie.' };
  }

  let fetchOut: { res: Response; parsed: unknown };
  try {
    fetchOut = await runOnce(token);
  } catch (e) {
    const m = e instanceof Error ? e.message : 'Réseau indisponible';
    return { data: null, error: m };
  }

  let { res, parsed } = fetchOut;

  if (res.status === 401 || res.status === 403) {
    await supabase.auth.refreshSession().catch(() => {});
    const {
      data: { session: s3 },
    } = await supabase.auth.getSession();
    const t2 = s3?.access_token;
    if (t2) {
      try {
        fetchOut = await runOnce(t2);
        res = fetchOut.res;
        parsed = fetchOut.parsed;
      } catch (e) {
        const m = e instanceof Error ? e.message : 'Réseau indisponible';
        return { data: null, error: m };
      }
    }
  }

  if (res.ok) {
    const obj = parsed && typeof parsed === 'object' ? (parsed as { success?: boolean; error?: string }) : {};
    if (obj.success === false && typeof obj.error === 'string' && obj.error.trim()) {
      return { data: parsed, error: obj.error.trim() };
    }
    return { data: parsed, error: null };
  }

  const obj = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  const msg =
    (typeof obj.userMessage === 'string' && obj.userMessage.trim()) ||
    (typeof obj.error === 'string' && obj.error.trim()) ||
    (typeof obj.details === 'string' && obj.details.trim()) ||
    (typeof obj.message === 'string' && obj.message.trim()) ||
    `Erreur HTTP ${res.status} — ${functionName}`;
  return { data: parsed, error: augmentGatewayJwtError(parsed, msg) };
}

export async function invokeWithJwtRetry<TBody extends Record<string, unknown>>(
  functionName: string,
  body: TBody
): Promise<{ data: unknown; error: unknown }> {
  const run = async () => {
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
