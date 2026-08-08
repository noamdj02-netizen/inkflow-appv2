import type { Appointment } from '../types';

/** Reste à payer (€) : prix total − acompte déjà encaissé (même règle que remind-balance-day-of / checkout balance). */
export function appointmentRemainingBalanceEuros(
  apt: Pick<Appointment, 'price' | 'deposit' | 'depositPaid' | 'balancePaidAt'>
): number {
  if (apt.balancePaidAt != null && String(apt.balancePaidAt).trim() !== '') {
    return 0;
  }
  const total = Math.max(0, Number(apt.price) || 0);
  const deposit = Math.max(0, Number(apt.deposit) || 0);
  const paid = apt.depositPaid === true ? Math.min(deposit, total) : 0;
  return Math.max(0, Math.round((total - paid) * 100) / 100);
}
