export interface TapToPayParams {
  studioId: string;
  appointmentId: string;
  amountEuros: number;
}

/**
 * Parse `https://app.ink-flow.me/tap-to-pay?appointment=&studio=&amountEuros=`
 * (handoff depuis SessionCloseoutSheet). Utilisé par le shell natif pour éviter de charger
 * cette URL dans la WebView (navigation pleine page → écran blanc / perte du dashboard).
 */
export function tryParseTapToPayAppHttpsUrl(url: string): TapToPayParams | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:') return null;
    if (parsed.hostname !== 'app.ink-flow.me') return null;
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    if (path !== '/tap-to-pay') return null;

    const appointmentId = parsed.searchParams.get('appointment')?.trim();
    const studioId = parsed.searchParams.get('studio')?.trim();
    const amountRaw = parsed.searchParams.get('amountEuros')?.trim();
    if (!appointmentId || !studioId || !amountRaw) return null;
    const amountEuros = parseFloat(amountRaw.replace(',', '.'));
    if (!Number.isFinite(amountEuros) || amountEuros < 0) return null;
    return { appointmentId, studioId, amountEuros };
  } catch {
    return null;
  }
}

/** Parse `inkflowpro://tap-to-pay?appointment=&studio=&amountEuros=` (depuis `SessionCloseoutSheet`). */
export function tryParseTapToPayDeepLink(url: string): TapToPayParams | null {
  const u = url.trim();
  if (!/^inkflowpro:\/\//i.test(u)) return null;
  if (!/tap-to-pay/i.test(u)) return null;
  const qIndex = u.indexOf('?');
  if (qIndex === -1) return null;
  const qs = u.slice(qIndex + 1);
  const params = new URLSearchParams(qs);
  const appointmentId = params.get('appointment')?.trim();
  const studioId = params.get('studio')?.trim();
  const amountRaw = params.get('amountEuros');
  if (!appointmentId || !studioId) return null;
  if (!amountRaw?.trim()) return null;
  const amountEuros = parseFloat(amountRaw.replace(',', '.'));
  if (!Number.isFinite(amountEuros) || amountEuros < 0) return null;
  return { appointmentId, studioId, amountEuros };
}
