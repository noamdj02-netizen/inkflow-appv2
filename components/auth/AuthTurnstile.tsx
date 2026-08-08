import React, { useCallback, useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { TURNSTILE_SITE_KEY, isTurnstileEnabled } from '../../lib/turnstileConfig';

type Props = {
  onToken: (token: string | null) => void;
};

/**
 * Affiche Cloudflare Turnstile quand `VITE_TURNSTILE_SITE_KEY` est défini.
 */
export const AuthTurnstile: React.FC<Props> = ({ onToken }) => {
  const [id] = useState(() => `ts-${Math.random().toString(36).slice(2)}`);

  const handleSuccess = useCallback(
    (t: string) => {
      onToken(t);
    },
    [onToken]
  );

  if (!isTurnstileEnabled()) return null;

  return (
    <div className="flex justify-center min-h-[65px]">
      <Turnstile
        id={id}
        siteKey={TURNSTILE_SITE_KEY}
        onSuccess={handleSuccess}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
      />
    </div>
  );
};
