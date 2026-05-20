/**
 * Statuts RDV — badges pastels 8px, cartes surface #161616, bordure #262626.
 */
import { inkSurfaceCard, inkBadgeBase } from './inkDesignTokens';

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  in_progress: 'En cours',
  no_show: 'Absent',
};

/** Plus de border-l coloré — délimitation par bordure carte uniquement */
export const APPOINTMENT_LEFT_ACCENT: Record<string, string> = {
  pending: '',
  confirmed: '',
  completed: '',
  cancelled: '',
  in_progress: '',
  no_show: '',
};

export const APPOINTMENT_STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-500',
  confirmed: 'bg-[#3b82f6]',
  completed: 'bg-zinc-400',
  cancelled: 'bg-[#ef4444]',
  in_progress: 'bg-[#3b82f6]',
  no_show: 'bg-[#ef4444]',
};

export const APPOINTMENT_STATUS_BADGE: Record<string, string> = {
  pending: `${inkBadgeBase} bg-amber-500/15 text-amber-800 dark:text-amber-400`,
  confirmed: `${inkBadgeBase} bg-blue-500/15 text-blue-800 dark:text-blue-400`,
  completed: `${inkBadgeBase} bg-zinc-500/10 text-zinc-600 dark:text-[#a3a3a3]`,
  cancelled: `${inkBadgeBase} bg-red-500/15 text-red-800 dark:text-[#ef4444]`,
  in_progress: `${inkBadgeBase} bg-blue-500/10 text-blue-800 dark:text-blue-300`,
  no_show: `${inkBadgeBase} bg-red-500/15 text-red-800 dark:text-[#ef4444]`,
};

export const APPOINTMENT_CARD_SURFACE = inkSurfaceCard;

/** Annulé : même surface, texte secondaire atténué */
export const APPOINTMENT_CARD_INACTIVE = 'opacity-70';
