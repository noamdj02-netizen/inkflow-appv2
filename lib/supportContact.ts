/** Contact produit — affiché dans l’app (footer, aide, signalements). */
export const SUPPORT_EMAIL = 'contact@ink-flow.me';

export const supportMailto = (subject?: string) =>
  subject
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${SUPPORT_EMAIL}`;
