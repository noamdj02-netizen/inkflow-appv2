import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { mondayOffsetFromMonthFirst, toLocalYmd } from '../../lib/agendaDates';

/** Colonnes lundi → dimanche (grille alignée sur la semaine FR / ISO). */
const WEEKDAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface MiniCalendarProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  datesWithAppointments: Set<string>;
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  className?: string;
  variant?: 'default' | 'dark';
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedDate,
  onSelectDate,
  datesWithAppointments,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  className = '',
  variant = 'default',
}) => {
  const isDark = variant === 'dark';
  const todayStr = toLocalYmd(new Date());
  const isTodaySelected = selectedDate === todayStr || selectedDate === null;

  const { weeks, monthLabel } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = mondayOffsetFromMonthFirst(first);
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

  const appointmentsThisMonth = useMemo(() => {
    let count = 0;
    datesWithAppointments.forEach((dateStr) => {
      const d = new Date(dateStr);
      if (
        d.getFullYear() === currentMonth.getFullYear() &&
        d.getMonth() === currentMonth.getMonth()
      ) {
        count++;
      }
    });
    return count;
  }, [datesWithAppointments, currentMonth]);

  return (
    <div
      className={`${className} ${
        isDark
          ? 'bg-transparent'
          : 'bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]'
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 flex items-center justify-between ${
          isDark ? 'border-b border-zinc-700' : 'border-b border-zinc-100 dark:border-zinc-800'
        }`}
      >
        <button
          type="button"
          onClick={onPrevMonth}
          className={`p-2 rounded-xl transition-colors ${
            isDark
              ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <span
            className={`text-sm font-semibold capitalize ${
              isDark ? 'text-zinc-100' : 'text-zinc-900 dark:text-white'
            }`}
          >
            {monthLabel}
          </span>
          {appointmentsThisMonth > 0 && (
            <p
              className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500 dark:text-zinc-500'}`}
            >
              {appointmentsThisMonth} jours avec RDV
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          className={`p-2 rounded-xl transition-colors ${
            isDark
              ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS_SHORT.map((wd, i) => (
            <div
              key={wd + i}
              className={`py-2 text-[10px] font-semibold uppercase tracking-wider text-center ${
                i === 5 || i === 6
                  ? isDark
                    ? 'text-zinc-600'
                    : 'text-zinc-400 dark:text-zinc-600'
                  : isDark
                    ? 'text-zinc-500'
                    : 'text-zinc-500 dark:text-zinc-500'
              }`}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {weeks.flatMap((row, ri) =>
            row.map((day, ci) => {
              if (day === null) return <div key={`e-${ri}-${ci}`} className="aspect-square" />;

              const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const dateStr = toLocalYmd(d);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === todayStr;
              const hasAppointments = datesWithAppointments.has(dateStr);
              const isWeekend = ci === 5 || ci === 6;
              const isPast = dateStr < todayStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => onSelectDate(dateStr)}
                  className={`
                    relative aspect-square rounded-xl text-xs font-medium flex items-center justify-center transition-all
                    ${
                      isSelected
                        ? 'bg-white font-semibold text-black shadow-none'
                        : isToday
                          ? isDark
                            ? 'bg-zinc-900 font-bold text-white ring-1 ring-zinc-700'
                            : 'bg-zinc-100 font-bold text-zinc-900 ring-1 ring-zinc-300 dark:bg-zinc-900 dark:text-white dark:ring-zinc-700'
                          : isPast
                            ? isDark
                              ? 'text-zinc-600 hover:bg-zinc-800/50'
                              : 'text-zinc-400 dark:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                            : isWeekend
                              ? isDark
                                ? 'text-zinc-500 hover:bg-zinc-800'
                                : 'text-zinc-500 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                              : isDark
                                ? 'text-zinc-300 hover:bg-zinc-800'
                                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }
                    ${hasAppointments && !isSelected ? 'font-semibold' : ''}
                  `}
                >
                  <span>{day}</span>
                  {/* Appointment indicator */}
                  {hasAppointments && !isSelected && (
                    <span
                      className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                        isDark ? 'bg-zinc-400' : 'bg-zinc-500'
                      }`}
                    />
                  )}
                  {/* Today indicator */}
                  {isToday && !isSelected && (
                    <span
                      className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full ${
                        isDark ? 'bg-white' : 'bg-zinc-900'
                      }`}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Today button */}
        <button
          type="button"
          onClick={onToday}
          className={`w-full mt-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            isTodaySelected
              ? 'border border-zinc-700 bg-zinc-900 text-white dark:border-zinc-700 dark:bg-zinc-900'
              : isDark
                ? 'border border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Aujourd'hui
        </button>
      </div>
    </div>
  );
};
