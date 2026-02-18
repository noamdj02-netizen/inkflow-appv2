import React from 'react';

interface BadgeNotificationProps {
  count: number;
  className?: string;
}

/**
 * Pastille de notification (nombre de demandes en attente, etc.).
 * Positionnée en -top-1 -right-1 sur l’icône parent (parent en relative).
 * Affiche "9+" si count > 9.
 */
export const BadgeNotification: React.FC<BadgeNotificationProps> = ({ count, className = '' }) => {
  if (count <= 0) return null;

  const label = count > 9 ? '9+' : String(count);

  return (
    <span
      key={count}
      className={`
        absolute -top-1 -right-1
        flex h-4 min-w-[1rem] items-center justify-center rounded-full
        bg-red-600 text-[10px] font-bold text-white
        px-1
        animate-badge-in
        animate-pulse
        [animation-duration:2s]
        ${className}
      `}
      aria-live="polite"
      aria-label={`${count} demande${count > 1 ? 's' : ''} en attente`}
    >
      {label}
    </span>
  );
};
