/** Support produit — affiché dans l’app (footer, aide, CTA). */
export const SUPPORT_EMAIL = 'support@ink-flow.me';

export const supportMailto = (subject?: string) =>
  subject
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${SUPPORT_EMAIL}`;
