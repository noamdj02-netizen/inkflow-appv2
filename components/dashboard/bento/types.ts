/** Créneau du jour — dérivé de `Appointment[]` côté parent (pas de re-fetch). */
export interface TodaySlot {
  id: string;
  start: string;
  end: string;
  title: string;
  clientName: string;
  avatarUrl?: string;
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

/** Client rapide — empty state planning / accueil mobile. */
export interface QuickClientRow {
  id: string;
  name: string;
  avatarUrl?: string;
}

/** Aperçu client lié à un RDV (jours 2–3 du mois ou prochains créneaux). */
export interface DayClientPreview {
  appointmentId: string;
  clientId?: string;
  clientName: string;
  avatarUrl?: string;
  service: string;
  date: string;
  dateLabel: string;
  time: string;
  status: TodaySlot['status'];
}

export interface ProjectInboxRow {
  id: string;
  clientName: string;
  motif: string;
  createdAt: string;
  urgency: 'bas' | 'normal' | 'haut';
}
