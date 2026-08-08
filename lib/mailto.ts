/**
 * Liens mailto — normalisation + clic fiable (PWA / iOS / WebView).
 *
 * Ne pas utiliser `window.location.assign('mailto:…')` : ça peut remplacer toute la fenêtre
 * ou ne rien ouvrir en mode standalone. Le comportement natif du `<a href="mailto:">` reste
 * le plus fiable tant qu’on n’appelle pas `preventDefault()` sans bonne raison.
 */
import type { MouseEvent } from 'react';

/** E-mail ASCII simple (MVP) — domaine avec au moins un point. */
const SIMPLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeClientEmail(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let t = String(raw).trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
  if (!t) return null;

  // "Jean Dupont <client@studio.fr>"
  const angle = t.match(/<([^>\s]+@[^>\s]+)>/);
  if (angle?.[1]) t = angle[1].trim();

  if (/^mailto:/i.test(t)) {
    t = t.replace(/^mailto:/i, '').split('?')[0]?.trim() ?? '';
  }

  if (!t || !SIMPLE_EMAIL.test(t)) return null;
  return t;
}

export function buildMailtoHref(email: string | null | undefined, subject: string): string | null {
  const n = normalizeClientEmail(email);
  if (!n) return null;
  try {
    const u = new URL(`mailto:${n}`);
    u.searchParams.set('subject', subject);
    return u.href;
  } catch {
    return `mailto:${encodeURIComponent(n).replace(/%40/g, '@')}?subject=${encodeURIComponent(subject)}`;
  }
}

/**
 * À utiliser sur les `<a href="mailto:…">` : coupe la propagation (évite clic sur ligne / carte)
 * sans bloquer l’ouverture du client mail.
 */
export function handleMailtoClick(
  e: MouseEvent<HTMLAnchorElement>,
  href: string | null
): void {
  e.stopPropagation();
  if (!href) {
    e.preventDefault();
  }
  // Si href est défini : ne pas preventDefault — laisser le navigateur gérer mailto:
}

/**
 * Ouverture hors `<a>` (ex. bouton) — même geste utilisateur, sans `location.assign`.
 */
export function openMailtoHref(href: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.rel = 'noopener noreferrer';
  a.setAttribute('aria-hidden', 'true');
  a.style.position = 'fixed';
  a.style.left = '-9999px';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
