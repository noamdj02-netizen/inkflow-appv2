import React from 'react';
import { Archive, ChevronRight, Phone, Star } from 'lucide-react';
import type { Client } from '../../types';
import { getClientStatusColor } from './clientListUtils';
import { formatEuroPrivacy } from '../../contexts/StudioPrivacyContext';
import { hapticSuccess } from '../../lib/haptics';
import { ClientPhotoAvatar } from '../common/ClientPhotoAvatar';
import {
  inkIconActionBtn,
  inkListRow,
  inkMetricRevenue,
  inkMetricVolume,
  inkStatLabel,
  inkSubtitle,
  inkTitle,
} from '@/lib/inkDesignTokens';

function phoneHref(raw: string): string {
  const d = (raw || '').replace(/\s/g, '').replace(/^0/, '+33');
  if (d.startsWith('+')) return `tel:${d}`;
  if (/^\d{10}$/.test(d)) return `tel:+33${d.slice(1)}`;
  return `tel:${raw}`;
}

interface ClientListMobileRowProps {
  client: Client;
  privacyMode: boolean;
  onOpen: () => void;
  onArchive: () => void;
  canArchive: boolean;
}

/** Ligne client — séparateur #262626, actions icônes uniquement. */
export const ClientListMobileRow: React.FC<ClientListMobileRowProps> = ({
  client,
  privacyMode,
  onOpen,
  onArchive,
  canArchive,
}) => {
  const statusBadgeClass = getClientStatusColor(client.status);

  return (
    <div className={inkListRow}>
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99]"
        >
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border-0 dark:bg-white/[0.05]">
            <ClientPhotoAvatar
              name={client.name}
              src={client.avatar}
              className="size-full"
              textClassName="text-sm font-semibold text-zinc-700 dark:text-white"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`truncate ${inkTitle}`}>{client.name}</span>
              <span className={statusBadgeClass}>
                {client.status === 'vip' ? (
                  <Star className="size-3 fill-blue-500/20 text-blue-500" aria-hidden />
                ) : null}
                {client.status === 'vip'
                  ? 'VIP'
                  : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </span>
            </div>
            <p className={`mt-0.5 truncate text-sm ${inkSubtitle}`}>{client.email}</p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className={`text-sm ${inkMetricVolume}`}>{client.appointmentsCount} RDV</span>
              <span className={`text-base ${inkMetricRevenue}`}>
                {formatEuroPrivacy(client.totalSpent, privacyMode)}
              </span>
              <span className={inkStatLabel}>
                {client.lastVisit
                  ? new Date(client.lastVisit).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'Jamais'}
              </span>
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {client.phone ? (
            <a
              href={phoneHref(client.phone)}
              onClick={() => hapticSuccess()}
              className={inkIconActionBtn}
              aria-label={`Appeler ${client.name}`}
            >
              <Phone className="size-4" strokeWidth={1.75} aria-hidden />
            </a>
          ) : null}
          {canArchive ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                hapticSuccess();
                onArchive();
              }}
              className={inkIconActionBtn}
              aria-label={`Archiver ${client.name}`}
            >
              <Archive className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpen}
            className={inkIconActionBtn}
            aria-label={`Ouvrir ${client.name}`}
          >
            <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
};
