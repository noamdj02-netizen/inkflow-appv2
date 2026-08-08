/** Entrées du journal public — mettre à jour à chaque release notable. */
export type ChangelogEntry = {
  date: string;
  title: string;
  summary: string;
  tags?: ('feature' | 'fix' | 'improvement')[];
};

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: '2026-04',
    title: 'Product analytics & support',
    summary:
      'Mesure produit (PostHog, opt-in cookies), événements clés (inscription, premier client, RDV, acompte), page Nouveautés, NPS léger, FAQ et contact support affinés.',
    tags: ['feature', 'improvement'],
  },
  {
    date: '2026-03',
    title: 'Tunnel de réservation & Demandes',
    summary:
      'Parcours /book optimisé mobile, file demandes (agenda, page book, brief), relances et confirmations e-mail.',
    tags: ['feature', 'improvement'],
  },
  {
    date: '2026-02',
    title: 'Stripe Connect & acomptes',
    summary: 'Encaissement des acomptes en ligne pour les studios connectés à Stripe.',
    tags: ['feature'],
  },
];
