/** Créneau du jour — dérivé de `Appointment[]` côté parent (pas de re-fetch). */
export interface TodaySlot {
  id: string;
  start: string;
  end: string;
  title: string;
  clientName: string;
  status: 'confirmé' | 'provisoire' | 'en_attente';
}

/**
 * Ligne acompte — montant en centimes pour un formatage cohérent avec l’ancien flux Bento /
 * `Intl.NumberFormat`.
 */
export interface StripeDepositRow {
  id: string;
  amountCents: number;
  currency: string;
  clientLabel: string;
  receivedAt: string;
  status: 'réussi' | 'en_cours' | 'remboursé';
}

export interface ProjectInboxRow {
  id: string;
  clientName: string;
  motif: string;
  createdAt: string;
  urgency: 'bas' | 'normal' | 'haut';
}
