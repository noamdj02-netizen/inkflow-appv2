/**
 * Design system InkFlow Pro — zinc + bleu électrique, listes groupées, icônes monochromes.
 * Réexporte dashboardChrome pour usage app-wide (dashboard, settings, modales).
 */
export {
  dashboardPageBg,
  dashboardCard,
  dashboardSettingsGroup,
  dashboardSettingsDivide,
  dashboardListPanel,
  dashboardListRow,
  dashboardListRowCompact,
  dashboardSettingsRowIcon,
  dashboardSettingsRowIconAccent,
  dashboardTileIcon,
  dashboardTileIconAccent,
  dashboardAvatarFrame,
  dashboardAvatarSm,
  dashboardAvatarMd,
  dashboardBtnPrimary,
  dashboardBtnAccent,
  dashboardBtnSecondary,
  dashboardBtnDanger,
  dashboardStickyActionBar,
  dashboardStatTile,
  dashboardStatIconBadge,
  dashboardStatusBadge,
  bookingStatusBadgeClass,
  projectStatusBadgeClass,
  dashboardPageHeader,
  dashboardPageSubtitle,
  dashboardSectionTitle,
  dashboardIconMuted,
  dashboardIconStrong,
  dashboardIconButton,
  dashboardCardSurface,
} from '../components/dashboard/ui/dashboardChrome';

/** Alias sémantiques (même tokens). */
export { InkCard, inkCardVariants } from '../components/ui/ink-card';
export { InkButton, inkButtonVariants } from '../components/ui/ink-button';
export { InkBadge, inkBadgeVariants } from '../components/ui/ink-badge';
export {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_LEFT_ACCENT,
  APPOINTMENT_STATUS_DOT,
  APPOINTMENT_STATUS_BADGE,
  APPOINTMENT_CARD_SURFACE,
  APPOINTMENT_CARD_INACTIVE,
} from './inkAppointmentStatus';
export {
  INK,
  inkOledCard,
  inkOledGlass,
  inkOledStack,
  inkSurfaceCard,
  inkTitle,
  inkSubtitle,
  inkStatCard,
  inkStatLabel,
  inkStatValueBase,
  inkStatValueVolume,
  inkStatValueRevenue,
  inkStatValueVip,
  inkMetricRevenue,
  inkMetricVolume,
  inkBadgeBase,
  inkBadgePrimary,
  inkBadgeSuccess,
  inkBadgeError,
  inkBadgeNeutral,
  inkIconActionBtn,
} from './inkDesignTokens';

export {
  inkDarkPage,
  inkDarkCard,
  inkDarkCardRaised,
  inkDarkTextPrimary,
  inkDarkTextSecondary,
  inkDarkCancelledCard,
  inkDarkCancelledBadge,
  inkDarkCtaSubtle,
  inkDarkSegmentActive,
} from './inkDarkSurfaces';

export {
  dashboardPageBg as inkPageBg,
  dashboardCard as inkCard,
  dashboardListPanel as inkListPanel,
  dashboardListRow as inkListRow,
  dashboardListRowCompact as inkListRowCompact,
  dashboardTileIcon as inkTileIcon,
  dashboardTileIconAccent as inkTileIconAccent,
  dashboardAvatarFrame as inkAvatar,
  dashboardBtnPrimary as inkBtnPrimary,
  dashboardBtnAccent as inkBtnAccent,
  dashboardBtnSecondary as inkBtnSecondary,
  dashboardBtnDanger as inkBtnDanger,
  dashboardStickyActionBar as inkStickyBar,
  dashboardStatusBadge as inkStatusBadge,
  dashboardPageHeader as inkPageHeader,
  dashboardPageSubtitle as inkPageSubtitle,
  dashboardSectionTitle as inkSectionTitle,
  dashboardIconMuted as inkIconMuted,
  dashboardIconStrong as inkIconStrong,
  dashboardIconButton as inkIconButton,
  dashboardCardSurface as inkCardSurface,
} from '../components/dashboard/ui/dashboardChrome';
