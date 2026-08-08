import React from 'react';

interface BadgeNotificationProps {
  count: number;
  className?: string;
  /** Affiche le nombre (pastille rouge) au lieu du seul point */
  showCount?: boolean;
}

/**
 * Pastille sur l’icône parent (parent en `relative`).
 * Par défaut : point rouge animé. Avec `showCount` : disque rouge + chiffre (mobile Demandes).
 */
export const BadgeNotification: React.FC<BadgeNotificationProps> = ({ count, className = '', showCount = false }) => {
  if (count <= 0) return null;

  if (showCount) {
    return (
      <span
        className={`
          absolute -top-1.5 -right-2 z-10
          min-w-[18px] h-[18px] px-1 flex items-center justify-center
          rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm
          animate-badge-in
          ${className}
        `}
        aria-live="polite"
        aria-label={`${count} demande${count > 1 ? 's' : ''} en attente`}
      >
        {count > 99 ? '99+' : count}
      </span>
    );
  }

  return (
    <span
      className={`
        absolute -top-1 -right-1
        block h-2.5 w-2.5 rounded-full
        bg-red-500
        ring-2 ring-white dark:ring-zinc-950
        animate-badge-in
        animate-pulse
        [animation-duration:2s]
        ${className}
      `}
      aria-live="polite"
      aria-label={`${count} demande${count > 1 ? 's' : ''} en attente`}
    />
  );
};
