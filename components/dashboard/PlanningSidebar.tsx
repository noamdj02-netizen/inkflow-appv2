/**
 * Sidebar droite : mini-calendrier interactif + planning du jour.
 * Style SaaS premium avec indicateurs visuels améliorés.
 */
import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, User } from 'lucide-react';
import type { Appointment } from '../../types';

const WEEKDAYS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const WEEKDAYS_FULL = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

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
    const map = new Map<string, number>();
    appointments.forEach((a) => {
      if (!['cancelled', 'no_show'].includes(a.status)) {
        map.set(a.date, (map.get(a.date) || 0) + 1);
      }
    });
    return map;
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

  const totalAppointmentsThisMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return appointments.filter(a => {
      const d = new Date(a.date);
      return d.getFullYear() === year && d.getMonth() === month && !['cancelled', 'no_show'].includes(a.status);
    }).length;
  }, [appointments, currentMonth]);

  return (
    <aside
      className={`flex flex-col w-[300px] flex-shrink-0 border-l border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto ${className}`}
    >
      <div className="p-5 space-y-5">
        {/* Header du calendrier */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
          {/* Navigation du mois */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                {monthLabel}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500">
                {totalAppointmentsThisMonth} RDV ce mois
              </p>
            </div>
            <button
              type="button"
              onClick={onNextMonth}
              className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Grille du calendrier */}
          <div className="p-3">
            {/* En-têtes des jours */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS_SHORT.map((wd, i) => (
                <div
                  key={wd + i}
                  className={`py-2 text-[10px] font-semibold uppercase tracking-wider text-center ${
                    i === 0 || i === 6 ? 'text-slate-400 dark:text-zinc-600' : 'text-slate-500 dark:text-zinc-500'
                  }`}
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Jours du mois */}
            <div className="grid grid-cols-7 gap-1">
              {weeks.flatMap((row, ri) =>
                row.map((day, ci) => {
                  if (day === null)
                    return <div key={`e-${ri}-${ci}`} className="aspect-square" />;
                  
                  const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const dateStr = toDateStr(d);
                  const isSelected = selectedDate === dateStr;
                  const isTodayCell = dateStr === todayStr;
                  const appointmentCount = datesWithAppointments.get(dateStr) || 0;
                  const hasAppointments = appointmentCount > 0;
                  const isWeekend = ci === 0 || ci === 6;
                  const isPast = dateStr < todayStr;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => onSelectDate(dateStr)}
                      className={`
                        relative aspect-square rounded-xl text-xs font-medium flex flex-col items-center justify-center transition-all
                        ${isSelected
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : isTodayCell
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold ring-2 ring-blue-500/30'
                            : isPast
                              ? 'text-slate-400 dark:text-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                              : isWeekend
                                ? 'text-slate-500 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800'
                                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }
                        ${hasAppointments && !isSelected ? 'font-semibold' : ''}
                      `}
                    >
                      <span className={isTodayCell && !isSelected ? 'relative' : ''}>
                        {day}
                        {isTodayCell && !isSelected && (
                          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                        )}
                      </span>
                      {/* Indicateur de RDV */}
                      {hasAppointments && (
                        <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 ${isSelected ? 'opacity-80' : ''}`}>
                          {appointmentCount <= 3 ? (
                            Array.from({ length: appointmentCount }).map((_, i) => (
                              <span 
                                key={i} 
                                className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} 
                              />
                            ))
                          ) : (
                            <span className={`text-[8px] font-bold ${isSelected ? 'text-white/80' : 'text-blue-600 dark:text-blue-400'}`}>
                              {appointmentCount}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Bouton Aujourd'hui */}
            <button
              type="button"
              onClick={onToday}
              className={`w-full mt-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isToday
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/10'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Aujourd'hui
              </span>
            </button>
          </div>
        </div>

        {/* Planning du jour */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
                  Planning
                </h3>
                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize mt-0.5">
                  {displayDateLabel}
                </p>
              </div>
              {dayAppointments.length > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                  {dayAppointments.length} RDV
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            {dayAppointments.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-slate-400 dark:text-zinc-500" />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-500">
                  Aucun rendez-vous
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-600 mt-1">
                  {isToday ? 'Profitez de votre journée libre !' : 'Journée libre'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {dayAppointments.map((apt, index) => {
                  const statusColors = {
                    confirmed: 'bg-emerald-500',
                    pending: 'bg-amber-500',
                    completed: 'bg-slate-400',
                  };
                  const statusColor = statusColors[apt.status as keyof typeof statusColors] || 'bg-blue-500';

                  return (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => onSelectAppointment?.(apt)}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Timeline indicator */}
                        <div className="flex flex-col items-center pt-0.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${statusColor} ring-4 ring-white dark:ring-zinc-900`} />
                          {index < dayAppointments.length - 1 && (
                            <div className="w-px h-full bg-slate-200 dark:bg-zinc-700 mt-1" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                              {apt.time || '—'}
                            </span>
                            {apt.duration && (
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                {apt.duration}min
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 truncate">
                            {apt.clientName || 'Client'}
                          </p>
                          {apt.service && (
                            <p className="text-xs text-slate-500 dark:text-zinc-500 truncate mt-0.5">
                              {apt.service}
                            </p>
                          )}
                          {apt.price && (
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                              {apt.price}€
                            </p>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                          apt.status === 'confirmed' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : apt.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                          {apt.status === 'confirmed' ? '✓' : apt.status === 'pending' ? '?' : '—'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 p-3 text-center">
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {appointments.filter(a => a.status === 'confirmed').length}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Confirmés</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 p-3 text-center">
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {appointments.filter(a => a.status === 'pending').length}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider">En attente</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
