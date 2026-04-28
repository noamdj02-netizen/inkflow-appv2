import type { Appointment } from '../types';

/** Reste à payer (€) : prix total − acompte déjà encaissé (même règle que remind-balance-day-of / checkout balance). */
export function appointmentRemainingBalanceEuros(
  apt: Pick<Appointment, 'price' | 'deposit' | 'depositPaid'>
): number {
  const total = Number(apt.price) || 0;
  const accompte = Number(apt.deposit) || 0;
  const paid = apt.depositPaid === true ? accompte : 0;
  return Math.max(0, Math.round((total - paid) * 100) / 100);
}
