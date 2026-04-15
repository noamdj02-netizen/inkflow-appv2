/**
 * Retour Stripe Connect : le dashboard nettoie l’URL avant que les enfants puissent lire
 * `?stripe_connect=return`, donc on repère le retour via sessionStorage (posé par DashboardPro).
 * Plusieurs écrans (Paramètres > Paiements, onboarding) peuvent monter : un seul polling partagé
 * recharge le statut pour tous les abonnés.
 */
const STORAGE_KEY = 'inkflow_stripe_connect_resume';

export type StripeConnectResumeKind = 'return' | 'refresh';

export function setStripeConnectResume(kind: StripeConnectResumeKind): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, kind);
  } catch {
    /* ignore */
  }
}

const pollLoads = new Set<() => Promise<void>>();
let pollInFlight = false;

export function registerStripeConnectResumePoll(load: () => Promise<void>): () => void {
  pollLoads.add(load);
  return () => {
    pollLoads.delete(load);
  };
}

const POLL_ROUNDS = 15;
const POLL_INTERVAL_MS = 2000;

/**
 * À appeler après avoir enregistré `load` avec `registerStripeConnectResumePoll`.
 * Au premier appel avec un marqueur en session, lance un cycle de rechargements (webhook / compte Stripe).
 */
export function maybeStartStripeConnectResumePoll(toast: { success: (msg: string) => void }): void {
  let kind: StripeConnectResumeKind | null = null;
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (v === 'return' || v === 'refresh') {
      kind = v;
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    return;
  }
  if (!kind || pollInFlight) return;

  pollInFlight = true;
  toast.success(
    kind === 'refresh'
      ? 'Session Stripe rafraîchie — mise à jour du statut…'
      : 'Retour depuis Stripe — mise à jour du statut…',
  );

  void (async () => {
    try {
      for (let i = 0; i < POLL_ROUNDS; i++) {
        if (i > 0) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        }
        const fns = [...pollLoads];
        await Promise.all(fns.map((fn) => fn().catch(() => undefined)));
      }
    } finally {
      pollInFlight = false;
    }
  })();
}
