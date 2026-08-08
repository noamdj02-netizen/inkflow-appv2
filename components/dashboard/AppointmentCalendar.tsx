/**
 * Agenda studio — vue timeline (maquette flat M3 / InkFlow).
 * Strip semaine + grille horaire jour, cartes RDV, ligne « maintenant ».
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, startOfDay } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CircleDollarSign,
  User,
  Pencil,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import { Appointment } from '../../types';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { hapticSuccess } from '../../lib/haptics';
import { addAgendaNavStep, agendaWeekStart, toLocalYmd } from '../../lib/agendaDates';
import { parseTimeToMinutes } from '../../lib/appointmentTime';
import { APPOINTMENT_STATUS_LABELS } from '@/lib/inkAppointmentStatus';
import { cn } from '@/lib/utils';

const TIMELINE_START_HOUR = 8;
const TIMELINE_END_HOUR = 20;
const HOUR_PX = 80;
const HOURS = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
  (_, i) => i + TIMELINE_START_HOUR
);

type CalendarViewMode = 'week' | 'day';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onSlotClick: () => void;
  onAppointmentClick?: (apt: Appointment) => void;
  onUpdateAppointment?: (apt: Appointment, updates: Partial<Appointment>) => void;
}

function formatDurationLabel(minutes: number): string {
  const m = Math.max(1, minutes);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h > 0 && r > 0) return `${h}h${String(r).padStart(2, '0')}`;
  if (h > 0) return `${h}h00`;
  return `${r} min`;
}

function needsDepositAttention(apt: Appointment): boolean {
  if (apt.deposit <= 0) return false;
  if (apt.depositPaid) return false;
  return apt.status !== 'completed' && apt.status !== 'cancelled';
}

function statusLabel(apt: Appointment): string {
  if (needsDepositAttention(apt)) return "En attente d'acompte";
  return APPOINTMENT_STATUS_LABELS[apt.status] ?? apt.status;
}

function weekdayShort(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
}

function monthYearLabel(d: Date): string {
  const raw = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  onSlotClick,
  onAppointmentClick,
  onUpdateAppointment,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const weekDays = useMemo(() => {
    const base = agendaWeekStart(selectedDay);
    return Array.from({ length: 7 }, (_, i) => addDays(base, i));
  }, [selectedDay]);

  const selectedYmd = toLocalYmd(selectedDay);
  const todayYmd = toLocalYmd(new Date());

  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === selectedYmd)
      .sort((a, b) => `${a.time}`.localeCompare(`${b.time}`));
  }, [appointments, selectedYmd]);

  const nowLineTop = useMemo(() => {
    if (selectedYmd !== todayYmd) return null;
    const now = new Date(nowTick);
    const startM = TIMELINE_START_HOUR * 60;
    const endM = (TIMELINE_END_HOUR + 1) * 60;
    const nowM = now.getHours() * 60 + now.getMinutes();
    if (nowM < startM || nowM > endM) return null;
    return ((nowM - startM) / 60) * HOUR_PX;
  }, [nowTick, selectedYmd, todayYmd]);

  const goPrev = () => {
    setSelectedDay((d) => addAgendaNavStep(d, viewMode === 'day' ? 'day' : 'week', -1));
  };

  const goNext = () => {
    setSelectedDay((d) => addAgendaNavStep(d, viewMode === 'day' ? 'day' : 'week', 1));
  };

  const handleAppointmentClick = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAppointment(apt);
    onAppointmentClick?.(apt);
  };

  const timelineHeight = HOURS.length * HOUR_PX;

  return (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
      {/* Contrôles — mois + toggle Jour/Semaine */}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <h2 className="type-heading-sm sm:text-2xl">{monthYearLabel(selectedDay)}</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrev}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Période précédente"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Période suivante"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <div
          className="inline-flex w-fit rounded-lg border border-zinc-300/80 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-900"
          role="group"
          aria-label="Granularité de l'agenda"
        >
          {(['day', 'week'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              className={cn(
                'min-h-[40px] rounded-md px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider transition-all active:scale-[0.98]',
                viewMode === mode
                  ? 'border border-zinc-300/80 bg-white text-zinc-900 shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              {mode === 'day' ? 'Jour' : 'Semaine'}
            </button>
          ))}
        </div>
      </section>

      {/* Strip semaine */}
      {viewMode === 'week' && (
        <section
          className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 scrollbar-hide"
          aria-label="Jours de la semaine"
        >
          {weekDays.map((day) => {
            const ymd = toLocalYmd(day);
            const isSelected = ymd === selectedYmd;
            const isToday = ymd === todayYmd;
            const hasEvents = appointments.some((a) => a.date === ymd);
            return (
              <button
                key={ymd}
                type="button"
                onClick={() => setSelectedDay(startOfDay(day))}
                className={cn(
                  'flex min-h-[80px] min-w-[64px] snap-start flex-col items-center justify-center rounded-xl border transition-colors active:scale-[0.98]',
                  isSelected
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/80',
                  !isSelected && !hasEvents && 'opacity-60'
                )}
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
              >
                <span
                  className={cn('text-xs uppercase', isSelected ? 'font-semibold' : 'font-normal')}
                >
                  {weekdayShort(day)}
                </span>
                <span className={cn('mt-1 type-stat', isSelected ? 'font-bold' : 'font-semibold')}>
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </section>
      )}

      {/* Timeline jour */}
      <section
        className="relative mt-2 flex flex-col"
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
        <div className="relative" style={{ minHeight: timelineHeight }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="relative flex min-h-[80px] w-full border-t border-zinc-300/40 dark:border-zinc-700/50"
            >
              <div className="w-16 shrink-0 pr-3 pt-2 text-right font-mono text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {String(hour).padStart(2, '0')}:00
              </div>
              <button
                type="button"
                onClick={onSlotClick}
                className="relative min-h-[80px] flex-1 border-l border-zinc-200/50 transition-colors hover:bg-zinc-50/80 dark:border-zinc-800/80 dark:hover:bg-zinc-900/40"
                aria-label={`Créer un rendez-vous à ${hour}h`}
              />
            </div>
          ))}

          {/* Cartes RDV positionnées */}
          <div className="pointer-events-none absolute inset-0 left-16">
            {dayAppointments.map((apt) => {
              const startM = parseTimeToMinutes(apt.time || '09:00');
              const duration = apt.duration > 0 ? apt.duration : 60;
              const endM = startM + duration;
              const timelineStartM = TIMELINE_START_HOUR * 60;
              const timelineEndM = (TIMELINE_END_HOUR + 1) * 60;
              if (endM <= timelineStartM || startM >= timelineEndM) return null;

              const clampStart = Math.max(startM, timelineStartM);
              const clampEnd = Math.min(endM, timelineEndM);
              const top = ((clampStart - timelineStartM) / 60) * HOUR_PX + 8;
              const height = Math.max(((clampEnd - clampStart) / 60) * HOUR_PX - 16, 72);
              const inactive = apt.status === 'cancelled' || apt.status === 'no_show';

              return (
                <button
                  key={apt.id}
                  type="button"
                  style={{ top, height }}
                  onClick={(e) => handleAppointmentClick(apt, e)}
                  className={cn(
                    'pointer-events-auto absolute right-2 left-2 flex flex-col justify-between rounded-lg border border-zinc-300/80 bg-zinc-100 p-4 text-left transition-colors hover:border-zinc-900 active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-900/90 dark:hover:border-zinc-400',
                    inactive && 'opacity-60'
                  )}
                >
                  <div className="min-w-0">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {apt.service}
                      </h3>
                      <span className="shrink-0 rounded bg-zinc-200/90 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {statusLabel(apt)}
                      </span>
                    </div>
                    <p className="truncate type-body text-muted-foreground">{apt.clientName}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" aria-hidden />
                      {formatDurationLabel(duration)}
                    </span>
                    {apt.price > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <CircleDollarSign className="h-4 w-4" aria-hidden />
                        {apt.price}€
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Ligne maintenant */}
          {nowLineTop != null && (
            <div
              className="pointer-events-none absolute right-0 left-14 z-10 flex items-center"
              style={{ top: nowLineTop }}
              aria-hidden
            >
              <div className="absolute -left-1 h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              <div className="h-0.5 w-full bg-zinc-900 dark:bg-zinc-100" />
            </div>
          )}
        </div>
      </section>

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
        message="Le rendez-vous passera en annulé dans l'agenda."
        confirmLabel="Annuler le rendez-vous"
        cancelLabel="Retour"
        variant="warning"
      />

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
              <Clock className="h-4 w-4" aria-hidden />
              <span>
                {selectedAppointment.date} · {selectedAppointment.time} —{' '}
                {formatDurationLabel(selectedAppointment.duration)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden />
              <span className="text-[var(--text-primary)]">{selectedAppointment.service}</span>
            </div>
            {selectedAppointment.price > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <CircleDollarSign className="h-4 w-4 text-zinc-400" aria-hidden />
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedAppointment.price}€
                </span>
              </div>
            )}
            <span className="inline-block rounded bg-zinc-100 px-3 py-1 font-mono text-xs font-medium uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {statusLabel(selectedAppointment)}
            </span>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              {onUpdateAppointment &&
                selectedAppointment.status !== 'completed' &&
                selectedAppointment.status !== 'cancelled' && (
                  <div className="order-2 flex gap-2 sm:order-1">
                    {selectedAppointment.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateAppointment(selectedAppointment, { status: 'confirmed' });
                          hapticSuccess();
                          setSelectedAppointment(null);
                        }}
                        className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
                      >
                        <CheckCircle className="h-4 w-4" aria-hidden />
                        Confirmer
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
                        className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
                      >
                        <CheckCircle className="h-4 w-4" aria-hidden />
                        Terminé
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <XCircle className="h-4 w-4" aria-hidden />
                      Annuler
                    </button>
                  </div>
                )}
              <button
                type="button"
                onClick={() => {
                  onAppointmentClick?.(selectedAppointment);
                  setSelectedAppointment(null);
                }}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Modifier
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
