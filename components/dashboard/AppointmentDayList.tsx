/**
 * Liste de RDV du jour pour professionnel.
 * Chaque ligne : heure (gras), avatar, nom client, badge statut.
 * Quick actions au survol : coche (terminé), crayon (modifier), message (contacter).
 */
import React from 'react';
import { Check, Pencil, MessageCircle } from 'lucide-react';
import type { Appointment, Client } from '../../types';

interface AppointmentDayListProps {
  appointments: Appointment[];
  clients: Client[];
  onSelectAppointment?: (apt: Appointment) => void;
  onMarkComplete?: (apt: Appointment) => void;
  onEdit?: (apt: Appointment) => void;
  onMessage?: (apt: Appointment) => void;
}

function getAvatarUrl(apt: Appointment, clients: Client[]): string | undefined {
  const client = clients.find(c => c.id === apt.clientId);
  return client?.avatar;
}

function getStatusLabel(status: Appointment['status']): string {
  const map: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    in_progress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
    no_show: 'Absent',
  };
  return map[status] ?? status;
}

function getStatusBadgeClass(status: Appointment['status']): string {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'pending':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'in_progress':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'completed':
      return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400';
    default:
      return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400';
  }
}

export const AppointmentDayList: React.FC<AppointmentDayListProps> = ({
  appointments,
  clients,
  onSelectAppointment,
  onMarkComplete,
  onEdit,
  onMessage,
}) => {
  const sorted = [...appointments].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Aucun RDV aujourd&apos;hui
      </p>
    );
  }

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
      {sorted.map((apt) => {
        const avatarUrl = getAvatarUrl(apt, clients);
        return (
          <div
            key={apt.id}
            role={onSelectAppointment ? 'button' : undefined}
            tabIndex={onSelectAppointment ? 0 : undefined}
            onClick={onSelectAppointment ? () => onSelectAppointment(apt) : undefined}
            onKeyDown={onSelectAppointment ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectAppointment(apt); } } : undefined}
            className={`group flex items-center gap-4 py-4 px-1 -mx-1 rounded-lg hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 active:scale-[0.995] transition-all ${onSelectAppointment ? 'cursor-pointer' : ''}`}
          >
            {/* Heure — en gras */}
            <div className="w-14 flex-shrink-0">
              <span className="text-[15px] font-bold text-zinc-900 dark:text-white">
                {apt.time || '—'}
              </span>
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 ring-2 ring-white dark:ring-zinc-800">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-300">
                  {apt.clientName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Nom client */}
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-zinc-900 dark:text-white truncate">
                {apt.clientName || 'Client'}
              </p>
            </div>

            {/* Badge statut */}
            <span
              className={`flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-md ${getStatusBadgeClass(apt.status)}`}
            >
              {getStatusLabel(apt.status)}
            </span>

            {/* Quick actions — visibles au survol (desktop) / toujours visibles (mobile touch) */}
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
              {onMarkComplete && apt.status !== 'completed' && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onMarkComplete(apt); }}
                  className="p-2.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center sm:min-w-0 sm:min-h-0"
                  title="Marquer comme terminé"
                  aria-label="Marquer comme terminé"
                >
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(apt); }}
                  className="p-2.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center sm:min-w-0 sm:min-h-0"
                  title="Modifier"
                  aria-label="Modifier"
                >
                  <Pencil className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
              {onMessage && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onMessage(apt); }}
                  className="p-2.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center sm:min-w-0 sm:min-h-0"
                  title="Contacter"
                  aria-label="Contacter le client"
                >
                  <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
