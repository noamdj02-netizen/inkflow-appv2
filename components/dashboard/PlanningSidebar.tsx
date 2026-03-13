/**
 * Sidebar droite : mini-calendrier interactif + planning du jour.
 * Jours avec RDV = point bleu. Timeline verticale des événements.
 * Par défaut affiche "Aujourd'hui" si aucun jour sélectionné.
 */
import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Appointment } from '../../types';

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface PlanningSidebarProps {
  appointments: Appointment[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onSelectAppointment?: (apt: Appointment) => void;
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  className?: string;
}

export const PlanningSidebar: React.FC<PlanningSidebarProps> = ({
  appointments,
  selectedDate,
  onSelectDate,
  onSelectAppointment,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  className = '',
}) => {
  const todayStr = toDateStr(new Date());
  const displayDate = selectedDate ?? todayStr;
  const isToday = displayDate === todayStr;

  const datesWithAppointments = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => set.add(a.date));
    return set;
  }, [appointments]);

  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === displayDate && !['cancelled', 'no_show'].includes(a.status))
      .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
  }, [appointments, displayDate]);

  const { weeks, monthLabel } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();
    const totalCells = startPad + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    const weeks: (number | null)[][] = [];
    let day = 1;
    for (let r = 0; r < rows; r++) {
      const row: (number | null)[] = [];
      for (let c = 0; c < 7; c++) {
        const i = r * 7 + c;
        if (i < startPad || day > daysInMonth) row.push(null);
        else row.push(day++);
      }
      weeks.push(row);
    }
    const monthLabel = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return { weeks, monthLabel };
  }, [currentMonth]);

  const displayDateLabel = useMemo(() => {
    if (isToday) return "Aujourd'hui";
    const d = new Date(displayDate + 'T12:00:00');
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [displayDate, isToday]);

  return (
    <aside
      className={`flex flex-col w-[280px] flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-card)] overflow-y-auto ${className}`}
      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
    >
      <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
        {/* Mini-calendrier compact */}
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-card-secondary)] p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <span className="text-[14px] font-semibold text-[var(--text-primary)] capitalize">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={onNextMonth}
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
              >
                {wd}
              </div>
            ))}
            {weeks.flatMap((row, ri) =>
              row.map((day, ci) => {
                if (day === null)
                  return <div key={`e-${ri}-${ci}`} className="aspect-square min-h-[28px]" />;
                const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dateStr = toDateStr(d);
                const isSelected = selectedDate === dateStr;
                const isTodayCell = dateStr === todayStr;
                const hasAppointments = datesWithAppointments.has(dateStr);
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => onSelectDate(dateStr)}
                    className={`
                      aspect-square min-h-[28px] rounded-lg text-[12px] font-medium flex flex-col items-center justify-center transition-all
                      ${isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isTodayCell
                          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold ring-1 ring-blue-200 dark:ring-blue-500/30'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                      }
                    `}
                  >
                    <span>{day}</span>
                    {hasAppointments && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full mt-0.5 bg-blue-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>
          <button
            type="button"
            onClick={onToday}
            className="w-full mt-3 py-2 rounded-lg text-[12px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/50 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          >
            Aujourd&apos;hui
          </button>
        </div>

        {/* Planning du jour — timeline verticale */}
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-card-secondary)] p-4 flex-1 min-h-0">
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-4 capitalize">
            {isToday ? "Planning d'aujourd'hui" : `Planning du ${displayDateLabel}`}
          </h3>

          {dayAppointments.length === 0 ? (
            <p className="text-[13px] text-[var(--text-secondary)] py-6 text-center">
              Aucun rendez-vous
            </p>
          ) : (
            <div className="relative">
              {/* Ligne verticale de la timeline */}
              <div
                className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--border)]"
              />
              <div className="space-y-1">
                {dayAppointments.map((apt) => (
                  <button
                    key={apt.id}
                    type="button"
                    onClick={() => onSelectAppointment?.(apt)}
                    className="relative flex items-start gap-3 pl-0 pr-2 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left group w-full"
                  >
                    {/* Point sur la ligne */}
                    <div className="relative z-10 flex-shrink-0 w-6 h-6 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 group-hover:bg-blue-600 transition-colors ring-4 ring-[var(--bg-card)]" />
                    </div>
                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                        {apt.time || '—'}
                      </p>
                      <p className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
                        {apt.clientName || 'Client'}
                      </p>
                      {apt.service && (
                        <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                          {apt.service}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
