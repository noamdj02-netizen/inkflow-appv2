import React, { useCallback, useRef, useState } from 'react';
import { Phone, Eye, Archive, Star } from 'lucide-react';
import type { Client } from '../../types';
import { getClientStatusColor, getClientCardLeftAccent } from './clientListUtils';
import { formatEuroPrivacy } from '../../contexts/StudioPrivacyContext';
import { hapticSuccess } from '../../lib/haptics';

function phoneHref(raw: string): string {
  const d = (raw || '').replace(/\s/g, '').replace(/^0/, '+33');
  if (d.startsWith('+')) return `tel:${d}`;
  if (/^\d{10}$/.test(d)) return `tel:+33${d.slice(1)}`;
  return `tel:${raw}`;
}

const SWIPE_MAX = 152;
const REVEAL = 120;

interface ClientListMobileRowProps {
  client: Client;
  privacyMode: boolean;
  onOpen: () => void;
  onArchive: () => void;
  canArchive: boolean;
}

/**
 * Ligne client mobile : swipe pour Appeler (tel:) ou archiver (statut inactif).
 */
export const ClientListMobileRow: React.FC<ClientListMobileRowProps> = ({
  client,
  privacyMode,
  onOpen,
  onArchive,
  canArchive,
}) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startOff = useRef(0);
  const dragging = useRef(false);
  const leftAccent = getClientCardLeftAccent(client.status);

  const getStatusIcon = (status: string) => {
    if (status === 'vip') {
      return (
        <Star
          className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-blue-600/15 dark:fill-blue-400/15"
          strokeWidth={2}
          aria-hidden
        />
      );
    }
    return null;
  };

  const closeSwipe = useCallback(() => {
    setOffset(0);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    startX.current = e.touches[0].clientX;
    startOff.current = offset;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const next = Math.max(-SWIPE_MAX, Math.min(0, startOff.current + dx));
    setOffset(next);
  };

  const onTouchEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (offset < -REVEAL / 2) {
      setOffset(-REVEAL);
    } else {
      setOffset(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl touch-pan-y">
      <div
        className="absolute inset-y-0 right-0 z-0 flex w-[152px] max-w-[42vw] border-l border-zinc-200/80 dark:border-zinc-700"
        aria-hidden
      >
        <a
          href={phoneHref(client.phone)}
          onClick={() => hapticSuccess()}
          className="flex flex-1 min-w-0 items-center justify-center gap-1 bg-blue-600 text-white text-xs font-semibold active:opacity-90 dark:bg-blue-500"
        >
          <Phone className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          Appeler
        </a>
        {canArchive ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              hapticSuccess();
              onArchive();
              closeSwipe();
            }}
            className="flex flex-1 min-w-0 items-center justify-center gap-1 bg-zinc-500 text-white text-xs font-semibold active:opacity-90"
          >
            <Archive className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            Archiver
          </button>
        ) : (
          <div className="flex flex-1 min-w-0 items-center justify-center bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-medium text-center px-0.5">
            Inactif
          </div>
        )}
      </div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
        onClick={() => {
          if (offset < -20) {
            closeSwipe();
            return;
          }
          onOpen();
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={{ transform: `translateX(${offset}px)` }}
        className={`relative z-10 w-full text-left touch-pan-y bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 border-l-4 ${leftAccent} shadow-sm p-5 rounded-2xl`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {client.avatar ? (
              <img src={client.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                {client.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold truncate text-[var(--text-primary)]">
                {client.name}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${getClientStatusColor(client.status)}`}
              >
                {getStatusIcon(client.status)}
                {client.status === 'vip'
                  ? 'VIP'
                  : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </span>
            </div>
            <div className="text-sm text-[var(--text-secondary)] truncate mt-0.5">
              {client.email}
            </div>
          </div>
          <Eye
            className="w-[18px] h-[18px] text-[var(--text-tertiary)] flex-shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)] text-sm">
          <span className="text-[var(--text-secondary)]">{client.appointmentsCount} RDV</span>
          <span className="font-bold tabular-nums text-blue-600 dark:text-blue-400">
            {formatEuroPrivacy(client.totalSpent, privacyMode)}
          </span>
          <span className="text-[var(--text-tertiary)] text-xs">
            {client.lastVisit
              ? new Date(client.lastVisit).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })
              : 'Jamais'}
          </span>
        </div>
      </div>
    </div>
  );
};
