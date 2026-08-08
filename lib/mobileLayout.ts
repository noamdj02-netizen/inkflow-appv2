/**
 * Tokens layout mobile InkFlow — une seule source pour shell, dock et touch targets.
 * Aligné Apple HIG (44px) et patterns ant-design-mobile (ConfigProvider dashboard).
 */

/** Breakpoint shadcn / dashboard mobile (< md). */
export const MOBILE_MAX_WIDTH_PX = 767;

/** Tablette sans sidebar permanente (< lg) — dock mobile actif. */
export const TABLET_MAX_WIDTH_PX = 1023;

/** Cible tactile minimum (Apple HIG). */
export const TOUCH_TARGET_PX = 44;

/** Réserve bas contenu dashboard (pill dock + respiration), en rem. */
export const MOBILE_DOCK_RESERVE_REM = 4.75;

/** Réserve bas Inkflow Pro shell (WebView native, dock compact). */
export const MOBILE_DOCK_RESERVE_SHELL_REM = 4.25;

/** Hauteur sticky CTA landing mobile (barre basse + safe area approx.). */
export const LANDING_MOBILE_STICKY_CTA_REM = 4.5;

/** Barre sticky vitrine mobile (Réserver + Contact + safe area). */
export const VITRINE_MOBILE_STICKY_BAR_REM = 4.75;

export const mobileLayoutCssVars = {
  touchMin: `${TOUCH_TARGET_PX}px`,
  dockReserve: `${MOBILE_DOCK_RESERVE_REM}rem`,
  dockReserveShell: `${MOBILE_DOCK_RESERVE_SHELL_REM}rem`,
  landingStickyCta: `${LANDING_MOBILE_STICKY_CTA_REM}rem`,
  vitrineStickyBar: `${VITRINE_MOBILE_STICKY_BAR_REM}rem`,
} as const;
