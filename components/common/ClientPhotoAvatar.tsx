import { useEffect, useState } from 'react';
import { getClientNameInitials, trimAvatarUrl } from '../../lib/appointmentClientDisplay';
import { cn } from '@/lib/utils';

export interface ClientPhotoAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
  textClassName?: string;
  imgClassName?: string;
  alt?: string;
}

/**
 * Photo client avec repli : initiales si pas d’URL ou image invalide (404, CORS, etc.).
 */
export function ClientPhotoAvatar({
  name,
  src,
  className,
  textClassName,
  imgClassName,
  alt = '',
}: ClientPhotoAvatarProps) {
  const cleaned = trimAvatarUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [cleaned]);

  const initials = getClientNameInitials(name);
  const showImg = Boolean(cleaned) && !failed;

  return (
    <div
      className={cn('flex h-full w-full min-h-0 min-w-0 items-center justify-center', className)}
    >
      {showImg ? (
        <img
          src={cleaned!}
          alt={alt}
          className={cn('h-full w-full min-h-0 min-w-0 object-cover', imgClassName)}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={cn('select-none', textClassName)} aria-hidden>
          {initials}
        </span>
      )}
    </div>
  );
}
