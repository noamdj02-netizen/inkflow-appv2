import React, { useState, useEffect } from 'react';

interface TrialCountdownProps {
  /** Date de fin d'essai (ISO string ou null) */
  trialEndsAt: string | null | undefined;
}

function pad(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

export const TrialCountdown: React.FC<TrialCountdownProps> = ({ trialEndsAt }) => {
  const [remaining, setRemaining] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!trialEndsAt) {
      setRemaining(null);
      return;
    }
    const end = new Date(trialEndsAt).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setIsExpired(true);
        setRemaining(null);
        return;
      }
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      setRemaining({ days, hours, minutes });
      setIsExpired(false);
    };

    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, [trialEndsAt]);

  if (!trialEndsAt) return null;

  if (isExpired || (remaining && remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0)) {
    return (
      <span className="inline-block mt-2 text-sm font-semibold text-red-600 dark:text-red-400">
        Essai terminé — Compte restreint
      </span>
    );
  }

  if (!remaining) return null;

  const totalHours = remaining.days * 24 + remaining.hours;
  const isUrgent = totalHours < 24;

  return (
    <div className={`flex items-center gap-4 mt-3 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
      <div className="flex items-center gap-1">
        <span className={`text-2xl font-bold tabular-nums ${isUrgent ? 'animate-pulse' : ''}`}>{pad(remaining.days)}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">Jours</span>
      </div>
      <span className="text-lg font-bold opacity-60">:</span>
      <div className="flex items-center gap-1">
        <span className={`text-2xl font-bold tabular-nums ${isUrgent ? 'animate-pulse' : ''}`}>{pad(remaining.hours)}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">Heures</span>
      </div>
      <span className="text-lg font-bold opacity-60">:</span>
      <div className="flex items-center gap-1">
        <span className={`text-2xl font-bold tabular-nums ${isUrgent ? 'animate-pulse' : ''}`}>{pad(remaining.minutes)}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">Mins</span>
      </div>
    </div>
  );
};
