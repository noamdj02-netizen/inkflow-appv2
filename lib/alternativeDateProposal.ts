/** Libellé d’un créneau du planning (même logique que l’affichage demandes). */
export function formatSlotLabel(slot: string): string {
  const s = String(slot).toLowerCase();
  if (s === 'morning') return 'Matin';
  if (s === 'afternoon') return 'Après-midi';
  if (s === 'evening') return 'Soirée';
  if (/^\d{1,2}:\d{2}$/.test(slot)) return slot;
  return slot;
}

/** Libellé d’un créneau demandé (réservation vitrine). */
export function formatRequestedTimeLabel(t: string | null | undefined): string {
  if (!t) return '';
  const s = String(t).toLowerCase();
  if (s === 'morning') return 'matin';
  if (s === 'afternoon') return 'après-midi';
  if (s === 'evening') return 'soirée';
  if (/^\d{1,2}:\d{2}$/.test(t)) return t;
  return t;
}

/** Texte pour DM Instagram (pas d’API officielle : copier-coller + ouverture ig.me). */
export function buildInstagramAlternativeDateMessage(params: {
  clientName: string;
  studioName: string;
  proposedDate: Date;
  proposedTimeLabel: string;
  /** Ex. « 12 avril 2026, matin » — créneau initialement demandé */
  previousContext?: string;
}): string {
  const dateStr = params.proposedDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  let body = `Bonjour ${params.clientName},\n\n`;
  if (params.previousContext?.trim()) {
    body += `Malheureusement je ne suis pas disponible sur le créneau indiqué (${params.previousContext.trim()}). `;
  } else {
    body += `Merci pour ta demande ! `;
  }
  body += `Je te propose plutôt le ${dateStr} — ${params.proposedTimeLabel}. Dis-moi si ça t’arrange.\n\n— ${params.studioName}`;
  return body;
}
