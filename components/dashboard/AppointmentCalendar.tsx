/**
 * Calendrier style calendar.me — vue semaine/jour/mois, cartes événements colorées.
 * Responsive mobile et PC.
 */
import React, { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Pencil, XCircle, CheckCircle } from 'lucide-react';
import { Appointment } from '../../types';
import { Modal } from '../ui/Modal';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8h à 20h
const WEEKDAYS_SHORT = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

type CalendarViewMode = 'week' | 'day';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onSlotClick: () => void;
  onAppointmentClick?: (apt: Appointment) => void;
  onUpdateAppointment?: (apt: Appointment, updates: Partial<Appointment>) => void;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getEventColor(status: Appointment['status']): string {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/40 text-blue-900 dark:text-blue-100';
    case 'pending':
      return 'bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/40 text-amber-900 dark:text-amber-100';
    case 'in_progress':
      return 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-100';
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
  onSlotClick,
  onAppointmentClick,
  onUpdateAppointment,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() || 7) + 1); // Lundi
    return d;
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
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

  const isToday = (d: Date) => toDateStr(d) === toDateStr(new Date());

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
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() || 7) + 1);
    setWeekStart(d);
  };

  const monthLabel = weekStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const handleAppointmentClick = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAppointment(apt);
    onAppointmentClick?.(apt);
  };

  return (
    <div className="card-bento dashboard-widget-card rounded-2xl overflow-hidden">
      {/* Header: Mois, Today, flèches, toggle vue */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={goPrev}
            className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl hover:bg-[var(--bg-hover)] active:scale-95 transition-all"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <h2 className="text-lg font-bold min-w-[180px] text-center text-[var(--text-primary)] capitalize">
            {monthLabel}
          </h2>
          <button
            onClick={goNext}
            className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl hover:bg-[var(--bg-hover)] active:scale-95 transition-all"
            aria-label="Suivant"
          >
            <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={goToday}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
          >
            Aujourd&apos;hui
          </button>
        </div>
        <div className="inline-flex rounded-xl border border-[var(--border)] p-1 bg-[var(--bg-hover)]">
          {(['week', 'day'] as const).map((mode, idx) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                idx === 0 ? 'rounded-l-lg' : 'rounded-r-lg'
              } ${
                viewMode === mode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/50 dark:hover:bg-zinc-700/50'
              }`}
            >
              {mode === 'week' ? 'Semaine' : 'Jour'}
            </button>
          ))}
        </div>
      </div>

      {/* Grille: en-têtes jours + créneaux horaires */}
      <div
        className="overflow-x-auto"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 50) { dx < 0 ? goNext() : goPrev(); }
          touchStartX.current = null;
        }}
      >
        <div
          className="min-w-[600px] grid gap-px"
          style={{
            gridTemplateColumns: `56px repeat(${weekDays.length}, minmax(120px, 1fr))`,
          }}
        >
          {/* En-tête vide + jours */}
          <div className="flex items-center justify-end pr-2 py-3 text-xs text-[var(--text-tertiary)] uppercase">
            Heure
          </div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`text-center py-3 px-2 rounded-t-lg ${
                isToday(day)
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-bold'
                  : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
              }`}
            >
              <div className="text-[11px] uppercase font-semibold">
                {WEEKDAYS_SHORT[day.getDay()]}
              </div>
              <div className="text-base font-bold">{day.getDate()}</div>
            </div>
          ))}

          {/* Lignes horaires */}
          {HOURS.map((hour) => (
            <React.Fragment key={hour}>
              <div className="flex items-start justify-end pr-2 py-2 text-xs text-[var(--text-tertiary)]">
                {hour}h00
              </div>
              {weekDays.map((day) => {
                const dateStr = toDateStr(day);
                const slotApts = appointments.filter((a) => {
                  if (a.date !== dateStr) return false;
                  const aptHour = parseInt(a.time.split(':')[0], 10);
                  return aptHour === hour;
                });
                return (
                  <div
                    key={`${dateStr}-${hour}`}
                    onClick={onSlotClick}
                    className="min-h-[72px] p-1.5 rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-hover)]/50 cursor-pointer transition-colors"
                  >
                    {slotApts.map((apt) => (
                      <button
                        key={apt.id}
                        type="button"
                        onClick={(e) => handleAppointmentClick(apt, e)}
                        className={`w-full min-h-[56px] text-left p-3 rounded-xl border shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer ${getEventColor(
                          apt.status
                        )}`}
                      >
                        <div className="font-semibold text-sm truncate">{apt.clientName}</div>
                        <div className="text-xs opacity-90 truncate mt-0.5">{apt.service}</div>
                        <div className="text-[11px] opacity-80 mt-1">
                          {apt.time} • {apt.duration} min
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Modal détail événement */}
      <Modal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title={selectedAppointment?.clientName ?? ''}
        size="sm"
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
              {onUpdateAppointment && selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                <div className="flex gap-2 order-2 sm:order-1">
                  {selectedAppointment.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => { onUpdateAppointment(selectedAppointment, { status: 'confirmed' }); setSelectedAppointment(null); }}
                      className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Confirmer
                    </button>
                  )}
                  {selectedAppointment.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => { onUpdateAppointment(selectedAppointment, { status: 'completed' }); setSelectedAppointment(null); }}
                      className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Terminé
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { onUpdateAppointment(selectedAppointment, { status: 'cancelled' }); setSelectedAppointment(null); }}
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
