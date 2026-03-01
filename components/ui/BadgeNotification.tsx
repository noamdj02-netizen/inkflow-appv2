import React from 'react';

interface BadgeNotificationProps {
  count: number;
  className?: string;
}

/**
 * Pastille de notification (point rouge, sans chiffre).
 * Positionnée en -top-1 -right-1 sur l’icône parent (parent en relative).
 * Point rouge sans chiffre ; le count reste utilisé pour aria-label.
 */
export const BadgeNotification: React.FC<BadgeNotificationProps> = ({ count, className = '' }) => {
  if (count <= 0) return null;

  return (
    <span
      className={`
        absolute -top-1 -right-1
        block h-2 w-2 rounded-full
        bg-blue-600
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
