import React from 'react';
import { Archive, ChevronRight, Phone, Star } from 'lucide-react';
import type { Client } from '../../types';
import { getClientStatusColor } from './clientListUtils';
import { formatEuroPrivacy } from '../../contexts/StudioPrivacyContext';
import { hapticSuccess } from '../../lib/haptics';
import { ClientPhotoAvatar } from '../common/ClientPhotoAvatar';
import { Badge } from '@/components/ui/badge';
import {
  dashboardListAvatarFrame,
  dashboardListRowHover,
  dashboardSecondaryBtn,
} from '@/components/dashboard/ui/dashboardPilotagePage';

function phoneHref(raw: string): string {
  const d = (raw || '').replace(/\s/g, '').replace(/^0/, '+33');
  if (d.startsWith('+')) return `tel:${d}`;
  if (/^\d{10}$/.test(d)) return `tel:+33${d.slice(1)}`;
  return `tel:${raw}`;
}

const MOBILE_ICON_BTN = `${dashboardSecondaryBtn} size-11 shrink-0 p-0`;

interface ClientListMobileRowProps {
  client: Client;
  privacyMode: boolean;
  onOpen: () => void;
  onArchive: () => void;
  canArchive: boolean;
}

/** Ligne client mobile — même cellule que DashboardOverviewPilotageTable. */
export const ClientListMobileRow: React.FC<ClientListMobileRowProps> = ({
  client,
  privacyMode,
  onOpen,
  onArchive,
  canArchive,
}) => {
  const statusLabel =
    client.status === 'vip'
      ? 'VIP'
      : client.status.charAt(0).toUpperCase() + client.status.slice(1);

  return (
    <div className={dashboardListRowHover}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99]"
        >
          <div className={dashboardListAvatarFrame}>
            <ClientPhotoAvatar
              name={client.name}
              src={client.avatar}
              className="size-full"
              textClassName="text-xs font-semibold text-zinc-600 dark:text-zinc-300"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-medium text-foreground">{client.name}</span>
              {client.status === 'vip' ? (
                <Star className="size-3.5 shrink-0 fill-primary/85 text-primary" aria-hidden />
              ) : null}
              <span
                className={`hidden shrink-0 sm:inline-flex ${getClientStatusColor(client.status)}`}
              >
                {statusLabel}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">{client.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
              <span className={getClientStatusColor(client.status)}>{statusLabel}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="text-xs tabular-nums text-muted-foreground">
                {client.appointmentsCount} RDV
              </span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {formatEuroPrivacy(client.totalSpent, privacyMode)}
              </span>
              <Badge variant="outline" className="gap-1.5 text-[10px] font-semibold">
                <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                {client.lastVisit
                  ? new Date(client.lastVisit).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'Jamais'}
              </Badge>
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {client.phone ? (
            <a
              href={phoneHref(client.phone)}
              onClick={() => hapticSuccess()}
              className={MOBILE_ICON_BTN}
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
              className={MOBILE_ICON_BTN}
              aria-label={`Archiver ${client.name}`}
            >
              <Archive className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpen}
            className={MOBILE_ICON_BTN}
            aria-label={`Ouvrir ${client.name}`}
          >
            <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
};
