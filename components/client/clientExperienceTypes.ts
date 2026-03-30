/**
 * Tokens de design et types partagés — Espace Client Inkflow
 * Direction artistique : minimalisme luxe, inspiré Iara.
 * Palette warm-dark : aucun noir pur, tons charbon chauds, ivoire, or mat.
 */

// ── Palette ─────────────────────────────────────────────────────────────────
export const CX = {
  // Fonds (warm dark, jamais #000000 pur)
  bg:          '#0D0C0A',   // fond principal — charbon chaud
  surface:     '#18150E',   // cartes / drawers
  surfaceEl:   '#211E15',   // surface élevée (modals, sheets)
  surfaceGlass:'rgba(24,21,14,0.82)', // glassmorphism

  // Bordures
  border:      '#2D2920',   // séparateur standard
  borderMid:   '#3C3728',   // séparateur visible
  borderLight: '#4F4A38',   // hover / focus

  // Texte
  text:        '#F1EDE6',   // ivoire chaud principal
  textSub:     '#C8C0B4',   // texte secondaire visible
  muted:       '#7A7263',   // texte désactivé / labels

  // Accent or mat
  accent:      '#C9A96E',   // or/cuivre — unique couleur vive
  accentDim:   'rgba(201,169,110,0.14)',
  accentGlow:  'rgba(201,169,110,0.06)',
  accentText:  '#E8CB96',   // variante claire pour texte sur fond sombre

  // Sémantique
  success:     '#5EDB9A',
  error:       '#F47B7B',
  warning:     '#F5B75C',

  // Effets
  shadow:      '0 8px 32px rgba(0,0,0,0.45)',
  shadowLg:    '0 20px 60px rgba(0,0,0,0.6)',
} as const;

// ── Types ───────────────────────────────────────────────────────────────────
export type ClientTab = 'explore' | 'inspire' | 'rdv' | 'wallet' | 'profile';

export interface ClientAppointment {
  id: string;
  date: string;
  time?: string;
  service: string;
  status: string;
  price: number;
  studio_name?: string;
  studio_address?: string;
  /** FK studio — pour regrouper la progression fidélité par lieu / tatoueur */
  studio_id?: string;
  studio_slug?: string | null;
  /** Cible tampons du studio (`stamp_loyalty_settings.tattoosRequired`), défaut 10 */
  studio_stamp_target?: number;
}
