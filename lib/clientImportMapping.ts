import type { Client } from '../types';
import type { ClientCsvImportRow } from '../components/crm/ClientCsvImport';

/**
 * Mappe les lignes validées du CSV vers des objets Client pour persistance.
 * Table Supabase cible : `inkflow_clients` (pas de table `inkflow_customers` dans ce projet).
 */
export function clientsFromCsvImportRows(rows: ClientCsvImportRow[]): Client[] {
  const seenEmail = new Set<string>();
  const today = new Date().toISOString().split('T')[0];
  const out: Client[] = [];

  for (const r of rows) {
    const email = r.email.trim().toLowerCase();
    if (seenEmail.has(email)) continue;
    seenEmail.add(email);

    const phone = (r.phone ?? '').trim();
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `c_${crypto.randomUUID()}`
        : `c_imp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    out.push({
      id,
      name: r.name.trim(),
      email,
      phone,
      totalSpent: 0,
      appointmentsCount: r.reservationDate ? 1 : 0,
      lastVisit: r.reservationDate ?? undefined,
      firstVisit: r.reservationDate ?? today,
      status: 'active',
      tags: [],
      tattoos: [],
    });
  }

  return out;
}
