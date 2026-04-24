import React from 'react';
import {
  Banknote,
  Calendar,
  CalendarDays,
  Clock,
  Euro,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Tag,
} from 'lucide-react';
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
  /** Client avec compte espace client (app) : affiche le bloc discussion InkFlow */
  showInkflowClientDiscussion?: boolean;
  /** Fil messagerie connu (pr_…/bk_… ou fil existant) — peut être null si pas encore de messages */
  inkflowMessagingThreadId?: string | null;
  /** Ouvre l’onglet Messagerie (optionnellement le fil) */
  onOpenInkflowDiscussion?: () => void;
}

const STATUS_LABELS: Record<Appointment['status'], string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
  no_show: 'Absent',
};

const STATUS_BADGE_CLASS: Record<Appointment['status'], string> = {
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  confirmed: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  in_progress: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  completed: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30',
  cancelled: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  no_show: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
};

const CLIENT_STATUS_LABEL: Record<Client['status'], string> = {
  active: 'Actif',
  inactive: 'Inactif',
  vip: 'VIP',
};

const LOCATION_LABELS: Record<Appointment['location'], string> = {
  arm: 'Bras',
  leg: 'Jambe',
  back: 'Dos',
  chest: 'Torse',
  other: 'Autre',
};

const SIZE_LABELS: Record<Appointment['size'], string> = {
  small: 'Petit',
  medium: 'Moyen',
  large: 'Grand',
  extra_large: 'Très grand',
};

/** Glyphes d’appoint : teinte secondaire unique + trait légèrement fin (proche SF Symbol à côté du corps de texte). */
const ICON_ROW = 'w-4 h-4 shrink-0 mt-0.5 text-zinc-500 dark:text-zinc-400 stroke-[1.75]';
const ICON_ROW_SM = 'w-3.5 h-3.5 shrink-0 text-zinc-500 dark:text-zinc-400 stroke-[1.75]';
const ICON_STAT = 'w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400 stroke-[1.75]';

function formatDurationMinutes(mins: number): string {
  if (!Number.isFinite(mins) || mins <= 0) return '—';
  if (mins < 60) return `${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

function formatAppointmentWhen(dateStr: string, timeStr: string): string {
  const time = timeStr?.length === 5 ? `${timeStr}:00` : timeStr || '00:00:00';
  const iso = `${dateStr}T${time}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return `${dateStr} · ${timeStr}`;
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatVisitDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function truncateNote(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Écart en jours calendaires (local) entre aujourd’hui et la date du RDV (YYYY-MM-DD). */
function calendarDaysFromToday(appointmentDateYmd: string): number | null {
  const m = appointmentDateYmd.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const apt = new Date(y, mo - 1, d);
  return Math.round((apt.getTime() - startToday.getTime()) / 86400000);
}

/** Libellé du type « Dans 21 jours », « Aujourd’hui », « Il y a 3 jours ». */
function formatRelativeCalendarDay(appointmentDateYmd: string): string {
  const n = calendarDaysFromToday(appointmentDateYmd);
  if (n === null) return '';
  if (n === 0) return 'Aujourd’hui';
  if (n === 1) return 'Demain';
  if (n === -1) return 'Hier';
  if (n > 1) return `Dans ${n} jours`;
  if (n < -1) return `Il y a ${Math.abs(n)} jours`;
  return '';
}

export const ClientPreviewPanel: React.FC<ClientPreviewPanelProps> = ({
  data,
  studioId: _studioId,
  artistName: _artistName,
  compact = false,
  onClientClick,
  showInkflowClientDiscussion = false,
  inkflowMessagingThreadId = null,
  onOpenInkflowDiscussion,
}) => {
  const toast = useToast();
  const { appointment, client } = data;

  const mailtoHref = buildMailtoHref(appointment.clientEmail, 'À propos de votre rendez-vous');
  const phoneDisplay = (appointment.clientPhone || client?.phone || '').trim();
  const telHref = phoneDisplay ? `tel:${phoneDisplay.replace(/\s/g, '')}` : '';

  const avatarLetter = (appointment.clientName || '?').charAt(0).toUpperCase();
  const avatarUrl = client?.avatar;

  const whenLabel = formatAppointmentWhen(appointment.date, appointment.time);

  const crmSubtitle = client
    ? `Fiche CRM · ${CLIENT_STATUS_LABEL[client.status]}`
    : 'Pas encore dans la base clients (données RDV uniquement)';

  const tagPreview = client?.tags?.filter(Boolean).slice(0, compact ? 2 : 4) ?? [];

  const relativeDayLabel = formatRelativeCalendarDay(appointment.date);

  return (
    <div className={`flex flex-col gap-4 ${compact ? 'min-w-0' : ''}`}>
      {/* Ce rendez-vous */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-[var(--text-primary)]">Ce rendez-vous</p>
              {relativeDayLabel ? (
                <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1.5 leading-snug">
                  <CalendarDays className={ICON_ROW_SM} aria-hidden />
                  <span>{relativeDayLabel}</span>
                </p>
              ) : null}
            </div>
            <span
              className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${STATUS_BADGE_CLASS[appointment.status]}`}
            >
              {STATUS_LABELS[appointment.status]}
            </span>
          </div>
        </div>
        <div className={`p-4 space-y-3 ${compact ? 'text-sm' : ''}`}>
          <div className="flex items-start gap-2">
            <Calendar className={ICON_ROW} />
            <div className="min-w-0">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">
                Date & heure
              </p>
              <p className="font-medium text-[var(--text-primary)] capitalize">{whenLabel}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className={ICON_ROW} />
            <div className="min-w-0">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">
                Prestation
              </p>
              <p className="font-medium text-[var(--text-primary)]">{appointment.service || '—'}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {appointment.tattooType === 'flash' ? 'Flash' : 'Projet sur mesure'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Clock className={ICON_ROW} />
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">
                  Durée
                </p>
                <p className="font-medium text-[var(--text-primary)]">
                  {formatDurationMinutes(appointment.duration)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className={ICON_ROW} />
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">
                  Emplacement
                </p>
                <p className="font-medium text-[var(--text-primary)] truncate">
                  {LOCATION_LABELS[appointment.location]} · {SIZE_LABELS[appointment.size]}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-hover)] text-xs">
              <Euro className="w-3.5 h-3.5 shrink-0 text-zinc-500 dark:text-zinc-400 stroke-[1.75]" />
              <span className="text-[var(--text-secondary)]">Prix</span>
              <span className="font-semibold text-[var(--text-primary)]">{appointment.price}€</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-hover)] text-xs">
              <Banknote className="w-3.5 h-3.5 shrink-0 text-zinc-500 dark:text-zinc-400 stroke-[1.75]" />
              <span className="text-[var(--text-secondary)]">Acompte</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {appointment.deposit}€
                {appointment.depositPaid ? (
                  <span className="ml-1 text-blue-600 dark:text-blue-400 font-medium">(payé)</span>
                ) : (
                  <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">
                    (à payer)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Carte Profil Client */}
      <div
        role={onClientClick ? 'button' : undefined}
        tabIndex={onClientClick ? 0 : undefined}
        onClick={onClientClick}
        onKeyDown={onClientClick ? (e) => e.key === 'Enter' && onClientClick() : undefined}
        className={`rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden ${onClientClick ? 'cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors' : ''}`}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-zinc-700 dark:text-zinc-200 font-bold text-xl">
                  {avatarLetter}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-[var(--text-primary)] truncate">
                {appointment.clientName}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{crmSubtitle}</p>
              {tagPreview.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tagPreview.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)]"
                    >
                      <Tag className="w-3 h-3 text-zinc-500 dark:text-zinc-400 stroke-[1.75]" />
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2 mt-3 text-xs text-[var(--text-secondary)]">
                {appointment.clientEmail && (
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-500 dark:text-zinc-400 stroke-[1.75]" />
                    <span className="truncate">{appointment.clientEmail}</span>
                  </span>
                )}
                {phoneDisplay && (
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-500 dark:text-zinc-400 stroke-[1.75]" />
                    <span className="truncate">{phoneDisplay}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {client && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2 text-xs text-[var(--text-secondary)]">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {formatVisitDate(client.firstVisit) && (
                  <span>
                    1<sup>ère</sup> visite :{' '}
                    <strong className="text-[var(--text-primary)] font-medium">
                      {formatVisitDate(client.firstVisit)}
                    </strong>
                  </span>
                )}
                {formatVisitDate(client.lastVisit) && (
                  <span>
                    Dernière visite :{' '}
                    <strong className="text-[var(--text-primary)] font-medium">
                      {formatVisitDate(client.lastVisit)}
                    </strong>
                  </span>
                )}
              </div>
              {client.notes?.trim() && (
                <p className="text-[var(--text-tertiary)] leading-relaxed border-l-2 border-zinc-300 dark:border-zinc-600 pl-2">
                  {truncateNote(client.notes, compact ? 120 : 220)}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-hover)]">
              <Calendar className={ICON_STAT} />
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">
                  RDV (total)
                </p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {client?.appointmentsCount ?? 1}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-hover)]">
              <Euro className={ICON_STAT} />
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">
                  Dépensé (CRM)
                </p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {client ? `${client.totalSpent}€` : `${appointment.price}€ (ce RDV)`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discussion app client (espace client / compte synchronisé) */}
      {showInkflowClientDiscussion && onOpenInkflowDiscussion && (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden border-l-4 border-l-blue-500">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-blue-500/5 dark:bg-blue-500/10">
            <span className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <MessageCircle className="w-4 h-4 shrink-0 text-blue-700 dark:text-blue-400 stroke-[1.75]" />
              Discussion InkFlow
            </span>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Ce client est passé par{' '}
              <strong className="text-[var(--text-primary)]">l&apos;app client InkFlow</strong> —
              vous pouvez continuer l&apos;échange dans la messagerie intégrée.
            </p>
            {!inkflowMessagingThreadId && (
              <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                Aucun fil encore détecté pour cet e-mail : ouvrez la messagerie pour écrire au
                client ou retrouver la conversation.
              </p>
            )}
            <button
              type="button"
              onClick={onOpenInkflowDiscussion}
              className="flex w-full items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400  active:scale-[0.98] transition-all touch-manipulation"
            >
              <MessageCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
              {inkflowMessagingThreadId ? 'Ouvrir la discussion' : 'Aller à la messagerie'}
            </button>
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
          <span className="font-semibold text-sm text-[var(--text-primary)]">
            Contacter le client
          </span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
            {showInkflowClientDiscussion ? (
              <>
                En complément, joignez le client par{' '}
                <strong className="text-[var(--text-secondary)]">e-mail</strong>,{' '}
                <strong className="text-[var(--text-secondary)]">téléphone</strong> ou{' '}
                <strong className="text-[var(--text-secondary)]">Instagram</strong>. Les demandes
                vitrine hors app passent surtout par ces canaux.
              </>
            ) : (
              <>
                Échangez par <strong className="text-[var(--text-secondary)]">e-mail</strong>,{' '}
                <strong className="text-[var(--text-secondary)]">téléphone</strong> ou{' '}
                <strong className="text-[var(--text-secondary)]">Instagram</strong> — la messagerie
                intégrée Inkflow n’est pas utilisée pour les demandes.
              </>
            )}
          </p>
          <div className={`flex gap-2 ${compact ? 'flex-col' : 'flex-col sm:flex-row'}`}>
            {mailtoHref ? (
              <a
                href={mailtoHref}
                onClick={(e) => {
                  handleMailtoClick(e, mailtoHref);
                }}
                className="flex items-center justify-center gap-2 min-h-[44px] flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-[0.98] transition-all touch-manipulation"
              >
                <Mail className="w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400 stroke-[1.75]" />
                Écrire par e-mail
              </a>
            ) : (
              <button
                type="button"
                onClick={() => toast.error('Adresse e-mail du client invalide ou manquante.')}
                className="flex items-center justify-center gap-2 min-h-[44px] flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-tertiary)] opacity-60 cursor-not-allowed"
              >
                <Mail className="w-4 h-4 shrink-0 stroke-[1.75]" />
                Écrire par e-mail
              </button>
            )}
            {telHref ? (
              <a
                href={telHref}
                className="flex items-center justify-center gap-2 min-h-[44px] flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-[0.98] transition-all touch-manipulation"
              >
                <Phone className="w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400 stroke-[1.75]" />
                Appeler
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-2 min-h-[44px] flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-tertiary)] opacity-50 cursor-not-allowed"
              >
                <Phone className="w-4 h-4 shrink-0 stroke-[1.75]" />
                Pas de numéro
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
