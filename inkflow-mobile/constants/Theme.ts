/**
 * InkFlow Design System — Apple HIG aligned
 * Couleurs, espacements, typographie pour une app iOS haut de gamme
 */
export const COLORS = {
  // Fonds
  bgLight: '#FFFFFF',
  bgDark: '#000000',
  cardLight: '#FFFFFF',
  cardDark: '#18181B',
  // Accent
  accent: '#2563EB', // Bleu électrique
  accentLight: '#3B82F6',
  // Texte
  textPrimaryLight: '#000000',
  textPrimaryDark: '#FFFFFF',
  textSecondary: '#6B7280',
  textTertiaryLight: '#9CA3AF',
  textTertiaryDark: '#A1A1AA',
  // Bordures
  borderLight: '#E5E7EB',
  borderDark: '#27272A',
  // Alertes
  alertBg: '#FEF2F2', // Rouge très clair
  alertBgDark: '#422',
  alertBorder: '#FCA5A5',
  alertText: '#DC2626',
  // Statuts
  statusPending: '#F59E0B',
  statusConfirmed: '#10B981',
  statusPendingBg: '#FFFBEB',
  statusConfirmedBg: '#ECFDF5',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
} as const;
