/**
 * Règles pour les notifications « nouveau RDV » vs tunnel paiement.
 * Un RDV inséré avant redirection Stripe est pending / non payé : on ne spam pas le studio
 * jusqu’à réception de l’acompte (notif « Acompte reçu » sur UPDATE).
 */

export function shouldNotifyAppointmentInsert(row: Record<string, unknown>): boolean {
  const status = String(row.status ?? '').toLowerCase().trim();
  const depositPaid = Boolean(row.deposit_paid);
  const depositRaw = row.deposit;
  const deposit =
    depositRaw != null && depositRaw !== '' ? Number(depositRaw) : 0;
  if (Number.isNaN(deposit)) return true;

  if (!depositPaid && status === 'pending' && deposit > 0) {
    return false;
  }
  return true;
}
