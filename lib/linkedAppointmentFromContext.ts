/**
 * Choisit un RDV « principal » pour un projet (plusieurs séances possibles sur l’année).
 * Priorité : prochain RDV non annulé à partir d’aujourd’hui, sinon le plus récent.
 */
export function pickLinkedAppointmentForProjectRequest(
  rows: { id: string; date: string; status: string }[],
  todayYyyyMmDd: string
): string | null {
  if (!rows.length) return null;
  const active = rows.filter((r) => r.status !== 'cancelled');
  const pool = active.length ? active : rows;
  const futureOrToday = pool.filter((r) => r.date >= todayYyyyMmDd);
  const sorted = (futureOrToday.length ? futureOrToday : [...pool]).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.id.localeCompare(b.id);
  });
  return sorted[0]?.id ?? null;
}
