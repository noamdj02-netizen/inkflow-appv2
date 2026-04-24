/**
 * Sidebar droite : mini-calendrier interactif + planning du jour.
 * Style SaaS premium avec indicateurs visuels améliorés.
 * Optimisé pour l'affichage desktop.
 */
import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  MoreHorizontal,
  Phone,
  Mail,
  Banknote,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { Appointment } from '../../types';

const WEEKDAYS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const WEEKDAYS_FULL = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8h - 19h

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
  onNewAppointment?: () => void;
  /** Desktop : masque le panneau pour élargir le tableau de bord */
  onRequestClose?: () => void;
  className?: string;
}

type ViewMode = 'day' | 'week';

export const PlanningSidebar: React.FC<PlanningSidebarProps> = ({
  appointments,
  selectedDate,
  onSelectDate,
  onSelectAppointment,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  onNewAppointment,
  onRequestClose,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [hoveredAppointment, setHoveredAppointment] = useState<string | null>(null);

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
    return appointments.filter((a) => {
      const d = new Date(a.date);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        !['cancelled', 'no_show'].includes(a.status)
      );
    }).length;
  }, [appointments, currentMonth]);

  // Stats du mois
  const monthStats = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthApts = appointments.filter((a) => {
      const d = new Date(a.date);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        !['cancelled', 'no_show'].includes(a.status)
      );
    });

    const revenue = monthApts
      .filter((a) => a.status === 'completed')
      .reduce((sum, a) => sum + (a.price || 0), 0);
    const depositsReceived = monthApts
      .filter((a) => a.depositPaid)
      .reduce((sum, a) => sum + (a.deposit || 0), 0);
    const uniqueClients = new Set(monthApts.map((a) => a.clientId || a.clientEmail || a.clientName))
      .size;
    const confirmed = monthApts.filter((a) => a.status === 'confirmed').length;
    const pending = monthApts.filter((a) => a.status === 'pending').length;

    return {
      revenue,
      depositsReceived,
      uniqueClients,
      confirmed,
      pending,
      total: monthApts.length,
    };
  }, [appointments, currentMonth]);

  // Vue semaine
  const weekDays = useMemo(() => {
    const d = new Date(displayDate + 'T12:00:00');
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = toDateStr(date);
      const dayApts = appointments
        .filter((a) => a.date === dateStr && !['cancelled', 'no_show'].includes(a.status))
        .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

      return {
        date: dateStr,
        dayNum: date.getDate(),
        dayName: WEEKDAYS_FULL[date.getDay()],
        isToday: dateStr === todayStr,
        isSelected: dateStr === displayDate,
        appointments: dayApts,
      };
    });
  }, [displayDate, appointments, todayStr]);

  return (
    <aside
      className={`flex min-h-0 flex-col w-[min(340px,100%)] flex-shrink-0 border-l border-zinc-200/80 dark:border-zinc-800/90 bg-gradient-to-b from-zinc-50/95 to-white dark:from-zinc-950 dark:to-black ${className}`}
    >
      {onRequestClose && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200/90 bg-white/90 px-3 py-2.5 backdrop-blur-sm dark:border-zinc-800/90 dark:bg-zinc-950/90">
          <div className="flex min-w-0 items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
            <span className="truncate text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
              Planning
            </span>
          </div>
          <button
            type="button"
            onClick={onRequestClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-sky-500/50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Fermer le panneau planning"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
      )}
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 [scrollbar-gutter:stable]">
        {/* Header du calendrier */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
          {/* Navigation du mois */}
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <span className="text-sm font-semibold text-zinc-900 dark:text-white capitalize">
                {monthLabel}
              </span>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500">
                {totalAppointmentsThisMonth} RDV ce mois
              </p>
            </div>
            <button
              type="button"
              onClick={onNextMonth}
              className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
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
                    i === 0 || i === 6
                      ? 'text-zinc-400 dark:text-zinc-600'
                      : 'text-zinc-500 dark:text-zinc-500'
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
                  if (day === null) return <div key={`e-${ri}-${ci}`} className="aspect-square" />;

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
                        ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : isTodayCell
                              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold ring-2 ring-blue-500/30'
                              : isPast
                                ? 'text-zinc-400 dark:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                : isWeekend
                                  ? 'text-zinc-500 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }
                        ${hasAppointments && !isSelected ? 'font-semibold' : ''}
                      `}
                    >
                      <span className={isTodayCell && !isSelected ? 'relative' : ''}>
                        {day}
                        {isTodayCell && !isSelected && (
                          <span className="absolute -bottom-0.5 left-1/2 -tranzinc-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                        )}
                      </span>
                      {/* Indicateur de RDV */}
                      {hasAppointments && (
                        <div
                          className={`absolute bottom-1 left-1/2 -tranzinc-x-1/2 flex items-center gap-0.5 ${isSelected ? 'opacity-80' : ''}`}
                        >
                          {appointmentCount <= 3 ? (
                            Array.from({ length: appointmentCount }).map((_, i) => (
                              <span
                                key={i}
                                className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}
                              />
                            ))
                          ) : (
                            <span
                              className={`text-[8px] font-bold ${isSelected ? 'text-white/80' : 'text-blue-600 dark:text-blue-400'}`}
                            >
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

        {/* Toggle Vue Jour / Semaine */}
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button
            onClick={() => setViewMode('day')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'day'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Jour
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'week'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Semaine
          </button>
        </div>

        {/* Vue Jour */}
        {viewMode === 'day' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
                    Planning
                  </h3>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white capitalize mt-0.5">
                    {displayDateLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {dayAppointments.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                      {dayAppointments.length} RDV
                    </span>
                  )}
                  {onNewAppointment && (
                    <button
                      onClick={onNewAppointment}
                      className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      title="Nouveau RDV"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 max-h-[400px] overflow-y-auto">
              {dayAppointments.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-500">
                    Aucun rendez-vous
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
                    {isToday ? 'Profitez de votre journée libre !' : 'Journée libre'}
                  </p>
                  {onNewAppointment && (
                    <button
                      onClick={onNewAppointment}
                      className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter un RDV
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {dayAppointments.map((apt, index) => {
                    const statusColors = {
                      confirmed: 'bg-blue-500',
                      pending: 'bg-amber-500',
                      completed: 'bg-zinc-400',
                    };
                    const statusColor =
                      statusColors[apt.status as keyof typeof statusColors] || 'bg-blue-500';
                    const isHovered = hoveredAppointment === apt.id;

                    return (
                      <div
                        key={apt.id}
                        onMouseEnter={() => setHoveredAppointment(apt.id)}
                        onMouseLeave={() => setHoveredAppointment(null)}
                        onClick={() => onSelectAppointment?.(apt)}
                        className={`relative w-full p-3 rounded-xl cursor-pointer transition-all text-left group ${
                          isHovered
                            ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 shadow-md'
                            : 'bg-zinc-50 dark:bg-zinc-800/50 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        } border`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Timeline indicator */}
                          <div className="flex flex-col items-center pt-0.5">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${statusColor} ring-4 ring-white dark:ring-zinc-900 transition-transform ${isHovered ? 'scale-125' : ''}`}
                            />
                            {index < dayAppointments.length - 1 && (
                              <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-700 mt-1 min-h-[20px]" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                                {apt.time || '—'}
                              </span>
                              {apt.duration && (
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                                  {apt.duration}min
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                              {apt.clientName || 'Client'}
                            </p>
                            {apt.service && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate mt-0.5">
                                {apt.service}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              {apt.price > 0 && (
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {apt.price}€
                                </span>
                              )}
                              {apt.depositPaid && (
                                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Acompte
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status badge + Actions */}
                          <div className="flex flex-col items-end gap-2">
                            <div
                              className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                                apt.status === 'confirmed'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                                  : apt.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}
                            >
                              {apt.status === 'confirmed'
                                ? 'Confirmé'
                                : apt.status === 'pending'
                                  ? 'En attente'
                                  : apt.status === 'completed'
                                    ? 'Terminé'
                                    : apt.status}
                            </div>

                            {/* Actions au hover */}
                            {isHovered && (
                              <div className="flex items-center gap-1 animate-fade-in">
                                {apt.clientPhone && (
                                  <a
                                    href={`tel:${apt.clientPhone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
                                    title="Appeler"
                                  >
                                    <Phone className="w-3 h-3" />
                                  </a>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectAppointment?.(apt);
                                  }}
                                  className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
                                  title="Voir détails"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vue Semaine */}
        {viewMode === 'week' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
                Aperçu Semaine
              </h3>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {weekDays.map((day) => (
                <button
                  key={day.date}
                  onClick={() => {
                    onSelectDate(day.date);
                    setViewMode('day');
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                    day.isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                          day.isToday
                            ? 'bg-blue-600 text-white'
                            : day.isSelected
                              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {day.dayNum}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            day.isToday || day.isSelected
                              ? 'text-blue-700 dark:text-blue-400'
                              : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {day.dayName}
                          {day.isToday && (
                            <span className="ml-2 text-xs text-blue-500">Aujourd'hui</span>
                          )}
                        </p>
                        {day.appointments.length > 0 && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-500">
                            {day.appointments[0].time} -{' '}
                            {day.appointments[0].clientName.split(' ')[0]}
                            {day.appointments.length > 1 && ` +${day.appointments.length - 1}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {day.appointments.length > 0 ? (
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                            day.isToday
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {day.appointments.length}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-600">—</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats du mois - Version améliorée */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
              Stats du mois
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {/* Revenue */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Revenus</span>
              </div>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {monthStats.revenue.toLocaleString('fr-FR')}€
              </span>
            </div>

            {/* Acomptes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                  <Banknote className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Acomptes reçus</span>
              </div>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {monthStats.depositsReceived.toLocaleString('fr-FR')}€
              </span>
            </div>

            {/* Clients */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10">
                  <Users className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Clients uniques</span>
              </div>
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                {monthStats.uniqueClients}
              </span>
            </div>

            {/* Separator */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                  <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
                    {monthStats.total}
                  </p>
                  <p className="text-[9px] text-zinc-500 dark:text-zinc-500 uppercase">Total</p>
                </div>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {monthStats.confirmed}
                  </p>
                  <p className="text-[9px] text-blue-700 dark:text-blue-400 uppercase">Confirmés</p>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {monthStats.pending}
                  </p>
                  <p className="text-[9px] text-amber-700 dark:text-amber-400 uppercase">
                    En attente
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
