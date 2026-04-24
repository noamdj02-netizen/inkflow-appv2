/**
 * Calendrier agenda studio — vue semaine / jour.
 * Structure inspirée des dashboards type « Constructor » (Figma community) : barre de période,
 * grille horaire, ligne « maintenant », cartes avec plage horaire et avatar.
 */
import React, { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Pencil, XCircle, CheckCircle } from 'lucide-react';
import { Appointment, Client } from '../../types';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { hapticSuccess } from '../../lib/haptics';
import { formatHm, parseTimeToMinutes } from '../../lib/appointmentTime';
import { getClientAvatarForAppointment } from '../../lib/appointmentClientDisplay';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8h à 20h
const SLOT_PX = 72;
const WEEKDAYS_SHORT = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

type CalendarViewMode = 'week' | 'day';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  /** Pour avatars sur les cartes créneau */
  clients?: Client[];
  onSlotClick: () => void;
  onAppointmentClick?: (apt: Appointment) => void;
  onUpdateAppointment?: (apt: Appointment, updates: Partial<Appointment>) => void;
}

/** Date locale YYYY-MM-DD (évite le décalage UTC de toISOString). */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getEventColor(status: Appointment['status']): string {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/40 text-blue-900 dark:text-blue-100';
    case 'pending':
      return 'bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/40 text-amber-900 dark:text-amber-100';
    case 'in_progress':
      return 'bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/40 text-blue-900 dark:text-blue-100';
    case 'completed':
      return 'bg-zinc-100 dark:bg-zinc-500/20 border-zinc-200 dark:border-zinc-500/40 text-zinc-800 dark:text-zinc-200';
    case 'cancelled':
    case 'no_show':
      return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 line-through opacity-75';
    default:
      return 'bg-zinc-100 dark:bg-zinc-500/20 border-zinc-200 dark:border-zinc-500/40 text-zinc-800 dark:text-zinc-200';
  }
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  clients = [],
  onSlotClick,
  onAppointmentClick,
  onUpdateAppointment,
}) => {
  const getAvatar = (apt: Appointment) => getClientAvatarForAppointment(apt, clients);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() || 7) + 1); // Lundi
    return d;
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(weekStart);
    const count = viewMode === 'day' ? 1 : 7;
    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart, viewMode]);

  const isToday = (d: Date) => toLocalDateStr(d) === toLocalDateStr(new Date());

  /** Ligne « maintenant » — recalcul à chaque rendu pour suivre l’heure. */
  const nowLineOffsetPx = (() => {
    const now = new Date();
    const h = now.getHours();
    const mi = now.getMinutes();
    if (h < 8 || h > 20) return null;
    const minutesFrom8 = (h - 8) * 60 + mi;
    const totalSpan = 13 * 60;
    return (minutesFrom8 / totalSpan) * (HOURS.length * SLOT_PX);
  })();

  const weekRangeLabel = useMemo(() => {
    if (weekDays.length === 0) return '';
    if (weekDays.length === 1) {
      return weekDays[0].toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    const a = weekDays[0];
    const b = weekDays[weekDays.length - 1];
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    if (a.getMonth() !== b.getMonth() || a.getFullYear() !== b.getFullYear()) {
      return `${a.toLocaleDateString('fr-FR', opts)} – ${b.toLocaleDateString('fr-FR', { ...opts, year: 'numeric' })}`;
    }
    return `${a.getDate()} – ${b.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }, [weekDays]);

  const showNowLine =
    nowLineOffsetPx != null &&
    weekDays.some((d) => toLocalDateStr(d) === toLocalDateStr(new Date()));

  const goPrev = () => {
    const d = new Date(weekStart);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const goNext = () => {
    const d = new Date(weekStart);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToday = () => {
    if (viewMode === 'day') {
      const t = new Date();
      t.setHours(0, 0, 0, 0);
      setWeekStart(t);
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() || 7) + 1);
    setWeekStart(d);
  };

  const handleAppointmentClick = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAppointment(apt);
    onAppointmentClick?.(apt);
  };

  const gridCols = `56px repeat(${weekDays.length}, minmax(112px, 1fr))`;

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_4px_28px_-12px_rgba(15,23,42,0.12)] dark:shadow-[0_4px_28px_-12px_rgba(0,0,0,0.45)] overflow-hidden">
      {/* Barre type Figma community calendar : Aujourd’hui | plage | Semaine / Jour */}
      <div className="flex flex-col gap-4 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/50 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={goToday}
            className="inline-flex w-full min-h-[44px] items-center justify-center rounded-xl border border-zinc-200/90 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 sm:w-auto sm:justify-center"
          >
            Aujourd&apos;hui
          </button>

          <div className="flex flex-1 items-center justify-center gap-1 sm:gap-2 min-w-0">
            <button
              type="button"
              onClick={goPrev}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-transparent text-zinc-500 transition-all hover:bg-zinc-200/80 dark:hover:bg-zinc-800 active:scale-95"
              aria-label="Période précédente"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="min-w-0 flex-1 text-center text-sm font-semibold capitalize leading-snug text-zinc-900 dark:text-white sm:text-base px-1">
              {weekRangeLabel}
            </p>
            <button
              type="button"
              onClick={goNext}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-transparent text-zinc-500 transition-all hover:bg-zinc-200/80 dark:hover:bg-zinc-800 active:scale-95"
              aria-label="Période suivante"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="inline-flex w-full justify-center rounded-2xl border border-zinc-200/80 bg-zinc-100/90 p-1 dark:border-zinc-700/80 dark:bg-zinc-900/80 lg:w-auto">
            {(['week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`min-h-[40px] flex-1 rounded-[10px] px-4 text-xs font-semibold transition-all active:scale-[0.98] sm:min-h-[36px] sm:flex-none sm:px-5 sm:text-sm ${
                  viewMode === mode
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                {mode === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grille horaire + ligne maintenant */}
      <div
        className="overflow-x-auto"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 50) {
            if (dx < 0) goNext();
            else goPrev();
          }
          touchStartX.current = null;
        }}
      >
        <div className="min-w-[min(100%,680px)]">
          <div
            className="grid gap-px border-b border-zinc-200/60 bg-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-800/80"
            style={{ gridTemplateColumns: gridCols }}
          >
            <div className="flex items-center justify-end bg-zinc-50 py-3 pr-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-950 dark:text-zinc-500">
              Heure
            </div>
            {weekDays.map((day) => (
              <div
                key={toLocalDateStr(day)}
                className={`px-2 py-3 text-center ${
                  isToday(day) ? 'bg-blue-50 dark:bg-blue-500/15' : 'bg-zinc-50 dark:bg-zinc-950/80'
                }`}
              >
                <div
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    isToday(day)
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {WEEKDAYS_SHORT[day.getDay()]}
                </div>
                <div
                  className={`text-lg font-bold tabular-nums ${
                    isToday(day)
                      ? 'text-blue-800 dark:text-blue-200'
                      : 'text-zinc-900 dark:text-white'
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          <div className="relative">
            {showNowLine && nowLineOffsetPx != null && (
              <div
                className="pointer-events-none absolute left-14 right-0 z-20 flex items-center"
                style={{ top: nowLineOffsetPx }}
                aria-hidden
              >
                <div className="h-0 w-full border-t-2 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.35)]" />
                <span className="absolute -left-0 -top-3 rounded-md bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                  Maintenant
                </span>
              </div>
            )}

            <div
              className="grid gap-px bg-zinc-200/50 dark:bg-zinc-800/80"
              style={{ gridTemplateColumns: gridCols }}
            >
              {HOURS.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="flex items-start justify-end bg-zinc-50/90 py-2 pr-2 text-xs tabular-nums text-zinc-400 dark:bg-zinc-950/90 dark:text-zinc-500">
                    {hour}h
                  </div>
                  {weekDays.map((day) => {
                    const dateStr = toLocalDateStr(day);
                    const slotApts = appointments.filter((a) => {
                      if (a.date !== dateStr) return false;
                      const aptHour = parseInt(a.time.split(':')[0], 10);
                      return aptHour === hour;
                    });
                    return (
                      <div
                        key={`${dateStr}-${hour}`}
                        role="button"
                        tabIndex={0}
                        onClick={onSlotClick}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSlotClick();
                          }
                        }}
                        className={`border-l border-zinc-100/90 bg-white p-1.5 transition-colors hover:bg-zinc-50/80 dark:border-zinc-800/90 dark:bg-zinc-900 dark:hover:bg-zinc-800/50 ${
                          isToday(day)
                            ? 'ring-inset ring-1 ring-blue-500/15 dark:ring-blue-500/20'
                            : ''
                        }`}
                        style={{ minHeight: SLOT_PX }}
                      >
                        {slotApts.map((apt) => {
                          const startM = parseTimeToMinutes(apt.time);
                          const endM = startM + (apt.duration || 60);
                          const avatar = getAvatar(apt);
                          return (
                            <button
                              key={apt.id}
                              type="button"
                              onClick={(e) => handleAppointmentClick(apt, e)}
                              className={`mb-1 w-full min-h-[56px] rounded-xl border p-2.5 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99] ${getEventColor(apt.status)}`}
                            >
                              <div className="mb-1.5 flex flex-wrap gap-1">
                                <span className="inline-flex rounded-md border border-current/25 bg-white/70 px-1.5 py-0.5 text-[10px] font-bold tabular-nums dark:bg-black/25">
                                  {(apt.time || '09:00').slice(0, 5)}
                                </span>
                                <span className="inline-flex rounded-md border border-current/25 bg-white/50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums opacity-90 dark:bg-black/20">
                                  {formatHm(endM)}
                                </span>
                              </div>
                              <div className="truncate text-sm font-semibold leading-tight">
                                {apt.clientName}
                              </div>
                              <div className="mt-0.5 truncate text-[11px] opacity-90">
                                {apt.service}
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-medium opacity-75">
                                  {apt.duration} min
                                </span>
                                <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-black/10 bg-white/80 dark:bg-zinc-800 dark:border-white/10">
                                  {avatar ? (
                                    <img
                                      src={avatar}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                                      {apt.clientName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showCancelConfirm && !!selectedAppointment}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          if (selectedAppointment && onUpdateAppointment) {
            onUpdateAppointment(selectedAppointment, { status: 'cancelled' });
            hapticSuccess();
            setSelectedAppointment(null);
          }
          setShowCancelConfirm(false);
        }}
        title="Annuler ce rendez-vous ?"
        message="Le rendez-vous passera en annulé dans l’agenda."
        confirmLabel="Annuler le rendez-vous"
        cancelLabel="Retour"
        variant="warning"
      />

      {/* Modal détail événement */}
      <Modal
        isOpen={!!selectedAppointment}
        onClose={() => {
          setSelectedAppointment(null);
          setShowCancelConfirm(false);
        }}
        title={selectedAppointment?.clientName ?? ''}
        size="sm"
        headerStart={
          <button
            type="button"
            onClick={() => {
              setSelectedAppointment(null);
              setShowCancelConfirm(false);
            }}
            className="md:hidden -ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Retour"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        }
      >
        {selectedAppointment && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Clock className="w-4 h-4" />
              <span>
                {selectedAppointment.date} • {selectedAppointment.time} —{' '}
                {selectedAppointment.duration} min
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-[var(--text-tertiary)]" />
              <span className="text-[var(--text-primary)]">{selectedAppointment.service}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--text-secondary)]">Prix :</span>
              <span className="font-bold text-blue-600">{selectedAppointment.price}€</span>
            </div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                selectedAppointment.status === 'confirmed'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                  : selectedAppointment.status === 'pending'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                    : selectedAppointment.status === 'completed'
                      ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
              }`}
            >
              {selectedAppointment.status === 'confirmed'
                ? 'Confirmé'
                : selectedAppointment.status === 'pending'
                  ? 'En attente'
                  : selectedAppointment.status === 'completed'
                    ? 'Terminé'
                    : selectedAppointment.status}
            </span>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {onUpdateAppointment &&
                selectedAppointment.status !== 'completed' &&
                selectedAppointment.status !== 'cancelled' && (
                  <div className="flex gap-2 order-2 sm:order-1">
                    {selectedAppointment.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateAppointment(selectedAppointment, { status: 'confirmed' });
                          hapticSuccess();
                          setSelectedAppointment(null);
                        }}
                        className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Confirmer
                      </button>
                    )}
                    {selectedAppointment.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateAppointment(selectedAppointment, { status: 'completed' });
                          hapticSuccess();
                          setSelectedAppointment(null);
                        }}
                        className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Terminé
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Annuler
                    </button>
                  </div>
                )}
              <button
                type="button"
                onClick={() => {
                  onAppointmentClick?.(selectedAppointment);
                  setSelectedAppointment(null);
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border-2 border-[var(--border)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" /> Modifier
              </button>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-semibold text-[var(--text-secondary)] hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
