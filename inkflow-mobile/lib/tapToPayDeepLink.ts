export interface TapToPayParams {
  studioId: string;
  appointmentId: string;
  amountEuros: number;
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
