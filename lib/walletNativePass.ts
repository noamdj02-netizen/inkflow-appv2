/**
 * Ajout carte fidélité Inkflow dans Apple Wallet / Google Wallet.
 * L’Edge Function renvoie soit un .pkpass (Apple), soit du JSON (config / Google save URL).
 */

const getSupabaseUrl = () => import.meta.env.VITE_SUPABASE_URL as string | undefined;
const getAnonKey = () => import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface WalletPassJsonOk {
  ok: true;
  platform: 'apple' | 'google';
  /** true si le backend peut déjà émettre un pass / lien Google */
  configured: boolean;
  userMessage: string;
  /** Lien « Enregistrer dans Google Wallet » (JWT Google), si configuré côté serveur */
  googleWalletSaveUrl?: string;
  clientCode?: string;
  balanceEuros?: string;
}

export interface WalletPassJsonError {
  ok: false;
  error: string;
}

export type WalletPassJson = WalletPassJsonOk | WalletPassJsonError;

export type WalletPassResult =
  | { success: true; kind: 'pkpass'; blob: Blob }
  | { success: true; kind: 'json'; data: WalletPassJsonOk }
  | { success: false; error: string };

function extractHttpError(data: unknown, res: Response): string {
  if (typeof data === 'object' && data !== null) {
    const o = data as Record<string, unknown>;
    for (const k of ['error', 'message', 'msg', 'hint'] as const) {
      const v = o[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }
  if (res.status === 404) {
    return 'Fonction Wallet non trouvée (404). Déploie l’Edge Function `wallet-loyalty-pass` : supabase functions deploy wallet-loyalty-pass';
  }
  if (res.status === 401 || res.status === 403) {
    return 'Session expirée ou accès refusé. Reconnecte-toi et réessaie.';
  }
  return `Erreur serveur (${res.status}). Vérifie que l’Edge Function wallet-loyalty-pass est déployée et que le projet Supabase est actif.`;
}

export async function requestWalletPass(
  accessToken: string,
  platform: 'apple' | 'google'
): Promise<WalletPassResult> {
  const base = getSupabaseUrl()?.replace(/\/$/, '');
  const anon = getAnonKey();
  if (!base || !anon) {
    return { success: false, error: 'Application non configurée (Supabase).' };
  }

  let res: Response;
  try {
    res = await fetch(`${base}/functions/v1/wallet-loyalty-pass`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anon,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ platform }),
    });
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      error: `Connexion impossible à Supabase (${m}). Vérifie la connexion, l’URL du projet et le déploiement des Edge Functions.`,
    };
  }

  const ct = res.headers.get('content-type') ?? '';

  if (ct.includes('application/vnd.apple.pkpass')) {
    const blob = await res.blob();
    if (!res.ok) {
      return { success: false, error: 'Réponse pass invalide.' };
    }
    return { success: true, kind: 'pkpass', blob };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return {
      success: false,
      error: !res.ok
        ? extractHttpError(null, res)
        : 'Réponse serveur illisible.',
    };
  }

  if (!res.ok) {
    return { success: false, error: extractHttpError(data, res) };
  }

  const obj = data as WalletPassJson;
  if (obj && typeof obj === 'object' && 'ok' in obj && obj.ok === true) {
    return { success: true, kind: 'json', data: obj as WalletPassJsonOk };
  }
  if (obj && typeof obj === 'object' && 'ok' in obj && obj.ok === false) {
    return { success: false, error: (obj as WalletPassJsonError).error || 'Refusé' };
  }

  return { success: false, error: 'Format de réponse inattendu.' };
}

/** Ouvre ou télécharge un .pkpass (Safari iOS ouvre souvent Wallet directement). */
export function triggerApplePkpassInstall(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  if (isIOS) {
    window.location.assign(url);
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = 'inkflow-fidelite.pkpass';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

export function openGoogleWalletSaveUrl(saveUrl: string): void {
  window.open(saveUrl, '_blank', 'noopener,noreferrer');
}
