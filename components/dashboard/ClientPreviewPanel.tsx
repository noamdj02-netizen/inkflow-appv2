import React from 'react';
import { Calendar, Euro, Mail, Phone } from 'lucide-react';
import { buildMailtoHref, handleMailtoClick } from '../../lib/mailto';
import { useToast } from '../../contexts/ToastContext';
import type { Appointment, Client } from '../../types';

export interface ClientPreviewData {
  /** Données du rendez-vous (clientName, clientEmail, etc.) */
  appointment: Appointment;
  /** Client CRM optionnel pour stats enrichies */
  client?: Client | null;
}

interface ClientPreviewPanelProps {
  data: ClientPreviewData;
  /** Conservé pour compat API (drawer) — non utilisé pour la messagerie. */
  studioId: string;
  artistName: string;
  /** Mode compact pour le drawer */
  compact?: boolean;
  /** Callback au clic sur la carte profil (ex: ouvrir le drawer) */
  onClientClick?: () => void;
}

export const ClientPreviewPanel: React.FC<ClientPreviewPanelProps> = ({
  data,
  studioId: _studioId,
  artistName: _artistName,
  compact = false,
  onClientClick,
}) => {
  const toast = useToast();
  const { appointment, client } = data;

  const mailtoHref = buildMailtoHref(appointment.clientEmail, 'À propos de votre rendez-vous');

  const pseudo = client?.name?.split(' ')[0] || appointment.clientName?.split(' ')[0] || 'Client';
  const avatarLetter = (appointment.clientName || '?').charAt(0).toUpperCase();
  const avatarUrl = client?.avatar;

  return (
    <div className={`flex flex-col gap-4 ${compact ? 'min-w-0' : ''}`}>
      {/* Carte Profil Client */}
      <div
        role={onClientClick ? 'button' : undefined}
        tabIndex={onClientClick ? 0 : undefined}
        onClick={onClientClick}
        onKeyDown={onClientClick ? (e) => e.key === 'Enter' && onClientClick() : undefined}
        className={`rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden ${onClientClick ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors' : ''}`}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">{avatarLetter}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-[var(--text-primary)] truncate">
                {appointment.clientName}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">@{pseudo.replace(/\s/g, '_').toLowerCase()}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-[var(--text-secondary)]">
                {appointment.clientEmail && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {appointment.clientEmail}
                  </span>
                )}
                {appointment.clientPhone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {appointment.clientPhone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-hover)]">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">RDV</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {client?.appointmentsCount ?? 1}+
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-hover)]">
              <Euro className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">Dépensé</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {client ? `${client.totalSpent}€` : `${appointment.price}€`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact — e-mail uniquement (pas de messagerie intégrée) */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
          <span className="font-semibold text-sm text-[var(--text-primary)]">Contacter le client</span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
            Les échanges se font par <strong className="text-[var(--text-secondary)]">e-mail</strong> ou{' '}
            <strong className="text-[var(--text-secondary)]">Instagram</strong> — la messagerie intégrée Inkflow n’est pas utilisée pour les demandes.
          </p>
          {mailtoHref ? (
            <a
              href={mailtoHref}
              onClick={(e) => {
                handleMailtoClick(e, mailtoHref);
              }}
              className="flex items-center justify-center gap-2 min-h-[44px] w-full px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-[0.98] transition-all touch-manipulation"
            >
              <Mail className="w-4 h-4 shrink-0" />
              Écrire par e-mail
            </a>
          ) : (
            <button
              type="button"
              onClick={() => toast.error('Adresse e-mail du client invalide ou manquante.')}
              className="flex items-center justify-center gap-2 min-h-[44px] w-full px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-tertiary)] opacity-60 cursor-not-allowed"
            >
              <Mail className="w-4 h-4 shrink-0" />
              Écrire par e-mail
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
