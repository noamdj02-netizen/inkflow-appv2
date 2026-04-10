/**
 * Liens mailto — normalisation + ouverture explicite pour PWA / WebView mobiles.
 */
import type { MouseEvent } from 'react';

const SIMPLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeClientEmail(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = String(raw).trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
  if (!t || !SIMPLE_EMAIL.test(t)) return null;
  return t;
}

export function buildMailtoHref(email: string | null | undefined, subject: string): string | null {
  const n = normalizeClientEmail(email);
  if (!n) return null;
  const addr = encodeURIComponent(n).replace(/%40/g, '@');
  return `mailto:${addr}?subject=${encodeURIComponent(subject)}`;
}

/**
 * Ouvre le client mail de façon fiable (certaines WebViews bloquent le clic natif sur &lt;a href="mailto:"&gt;).
 */
export function handleMailtoClick(
  e: MouseEvent<HTMLAnchorElement>,
  href: string | null
): void {
  e.stopPropagation();
  if (!href) {
    e.preventDefault();
    return;
  }
  e.preventDefault();
  window.location.assign(href);
}
