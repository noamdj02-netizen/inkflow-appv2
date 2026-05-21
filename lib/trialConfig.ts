/** Durée d'essai studio (BDD + Stripe Checkout trial). Garder aligné avec la migration Supabase. */
export const TRIAL_PERIOD_DAYS = 30;

export const TRIAL_COPY = {
  fr: {
    short: "1 mois d'essai",
    free: "1 mois d'essai gratuit",
    freeNoCard: "1 mois d'essai gratuit • Sans carte bancaire",
    seo: 'Essai gratuit 1 mois sans carte bancaire',
    ended: "Votre mois d'essai gratuit est terminé",
    during: 'Profitez de toutes les fonctionnalités Pro pendant 1 mois, sans carte bancaire.',
    faq: "Vous pouvez tester InkFlow pendant 1 mois sans engagement. Aucune carte bancaire n'est requise pour commencer. À la fin de l'essai, vous choisissez le plan qui vous convient.",
  },
  en: {
    short: '1-month trial',
    free: '1-month free trial',
    freeNoCard: '1-month free trial • No credit card required',
    seo: '1-month free trial, no credit card',
    ended: 'Your free trial month has ended',
    during: 'Enjoy full Pro features for 1 month with no credit card.',
    faq: 'You can try InkFlow for 1 month with no commitment. No credit card is required to start. At the end of the trial, choose the plan that fits you.',
  },
} as const;
