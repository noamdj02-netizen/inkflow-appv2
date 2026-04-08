/**
 * Thème visuel de l’app client (/client/dashboard).
 * Même logique d’interface que le dashboard studio (sidebar, header, carte centrale, colonne droite).
 * Pour changer uniquement les couleurs, modifiez `CLIENT_DASHBOARD_THEME` ci-dessous.
 */

export interface ClientDashboardTheme {
  /** Fond de page (zone derrière la carte principale) */
  pageBg: string;
  /** Fond sidebar gauche */
  sidebarBg: string;
  /** Bordure sidebar / séparateurs forts */
  sidebarBorder: string;
  /** Fond de la grande carte de contenu */
  contentCardBg: string;
  /** Surfaces secondaires (chips inactifs, champs) */
  elevatedSurface: string;
  /** Surface des modales / bottom sheet */
  modalSurface: string;
  border: string;
  borderMid: string;
  text: string;
  textSub: string;
  muted: string;
  /** Couleur principale (liens actifs, boutons primaires, jalons calendrier) */
  accent: string;
  accentMuted: string;
  accentGlow: string;
  /** Pour box-shadow autour des éléments accent */
  accentShadow: string;
  /** Texte sur fond accent */
  onAccent: string;
  success: string;
  danger: string;
  warning: string;
  /** Header sticky (barre du haut) */
  headerBg: string;
  /** Badge flottant sur la carte */
  mapBadgeBg: string;
  mapBadgeFg: string;
  mapTileUrl: string;
  mapBaseBg: string;
  scrim: string;
  skeleton: string;
  sheetHandle: string;
  mediaOverlayBtnBg: string;
  mediaOverlayBtnFg: string;
  blur: string;
  radius: { sm: number; md: number; lg: number; xl: number; full: number };
  shadow: string;
  shadowLg: string;
}

/** Palette type dashboard SaaS clair (bleu primaire) — ajustez ici pour une autre charte. */
export const CLIENT_DASHBOARD_THEME: ClientDashboardTheme = {
  pageBg: '#F4F4F5',
  sidebarBg: '#FFFFFF',
  sidebarBorder: 'rgba(24, 24, 27, 0.08)',
  contentCardBg: '#FFFFFF',
  elevatedSurface: '#F4F4F5',
  modalSurface: '#FFFFFF',
  border: 'rgba(24, 24, 27, 0.08)',
  borderMid: 'rgba(24, 24, 27, 0.14)',
  text: '#18181B',
  textSub: '#52525B',
  muted: '#71717A',
  accent: '#2563EB',
  accentMuted: 'rgba(37, 99, 235, 0.12)',
  accentGlow: 'rgba(37, 99, 235, 0.08)',
  accentShadow: 'rgba(37, 99, 235, 0.28)',
  onAccent: '#FFFFFF',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#CA8A04',
  headerBg: 'rgba(255, 255, 255, 0.92)',
  mapBadgeBg: 'rgba(255, 255, 255, 0.96)',
  mapBadgeFg: '#2563EB',
  mapTileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  mapBaseBg: '#E4E4E7',
  scrim: 'rgba(15, 23, 42, 0.45)',
  skeleton: '#E4E4E7',
  sheetHandle: 'rgba(24, 24, 27, 0.22)',
  mediaOverlayBtnBg: 'rgba(255, 255, 255, 0.94)',
  mediaOverlayBtnFg: '#18181B',
  blur: 'blur(12px)',
  radius: { sm: 10, md: 12, lg: 16, xl: 20, full: 9999 },
  shadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  shadowLg: '0 16px 48px rgba(0, 0, 0, 0.08)',
};

/**
 * Jetons compatibles avec l’ancien objet `D` (inline styles) + champs supplémentaires.
 */
export function buildClientDesignTokens(T: ClientDashboardTheme) {
  return {
    bg: T.pageBg,
    surface: T.modalSurface,
    card: T.elevatedSurface,
    cardHover: T.contentCardBg,
    border: T.border,
    borderMid: T.borderMid,
    gold: T.accent,
    goldDim: T.accentMuted,
    goldGlow: T.accentGlow,
    text: T.text,
    textSub: T.textSub,
    muted: T.muted,
    green: T.success,
    red: T.danger,
    warning: T.warning,
    blur: T.blur,
    r: T.radius,
    shadow: T.shadow,
    shadowLg: T.shadowLg,
    onAccent: T.onAccent,
    accentShadow: T.accentShadow,
    mapTileUrl: T.mapTileUrl,
    mapBaseBg: T.mapBaseBg,
    scrim: T.scrim,
    skeleton: T.skeleton,
    sidebarBg: T.sidebarBg,
    sidebarBorder: T.sidebarBorder,
    contentCardBg: T.contentCardBg,
    headerBg: T.headerBg,
    mapBadgeBg: T.mapBadgeBg,
    mapBadgeFg: T.mapBadgeFg,
    sheetHandle: T.sheetHandle,
    mediaOverlayBtnBg: T.mediaOverlayBtnBg,
    mediaOverlayBtnFg: T.mediaOverlayBtnFg,
    /** Badge prix sur vignette image */
    priceBadgeBg: T.mediaOverlayBtnBg,
    priceBadgeFg: T.text,
  };
}

export type ClientDesignTokens = ReturnType<typeof buildClientDesignTokens>;
