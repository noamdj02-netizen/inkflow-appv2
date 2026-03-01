import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

interface MiniCalendarProps {
  /** Date sélectionnée (YYYY-MM-DD) ou null */
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  /** Ensemble des dates qui ont au moins un RDV (YYYY-MM-DD) */
  datesWithAppointments: Set<string>;
  /** Mois affiché (objet Date) */
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  className?: string;
  /** Variante sombre pour la sidebar calendrier (style calendar.me) */
  variant?: 'default' | 'dark';
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
  const todayStr = toDateStr(new Date());

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

  return (
    <div
      className={`overflow-hidden p-5 ${className} ${
        isDark
          ? 'bg-transparent'
          : 'rounded-2xl dashboard-widget-card'
      }`}
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <div className={`flex items-center justify-between px-1 py-2 border-b mb-4 ${
        isDark ? 'border-zinc-700' : 'border-zinc-200 dark:border-zinc-800'
      }`}>
        <button
          type="button"
          onClick={onPrevMonth}
          className={`p-2 rounded-lg transition-colors ${
            isDark
              ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <span className={`text-[15px] font-semibold capitalize ${
          isDark ? 'text-zinc-100' : 'text-zinc-900 dark:text-[var(--text-primary)]'
        }`}>
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className={`p-2 rounded-lg transition-colors ${
            isDark
              ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>
      <div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className={`py-2 text-[11px] font-semibold uppercase tracking-wide ${
              isDark ? 'text-zinc-500' : 'text-zinc-500 dark:text-zinc-400'
            }`}>
              {wd}
            </div>
          ))}
          {weeks.flatMap((row, ri) =>
            row.map((day, ci) => {
              if (day === null) return <div key={`e-${ri}-${ci}`} className="aspect-square" />;
              const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const dateStr = toDateStr(d);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === todayStr;
              const hasAppointments = datesWithAppointments.has(dateStr);
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => onSelectDate(dateStr)}
                  className={`
                    aspect-square rounded-lg text-[13px] font-medium flex flex-col items-center justify-center transition-all
                    ${isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isToday
                        ? isDark
                          ? 'bg-emerald-500/30 text-emerald-300 font-semibold ring-1 ring-emerald-500/50'
                          : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold ring-1 ring-blue-200 dark:ring-blue-500/30'
                        : isDark
                          ? 'text-zinc-300 hover:bg-zinc-800'
                          : 'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }
                  `}
                >
                  <span>{day}</span>
                  {hasAppointments && !isSelected && (
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />
                  )}
                </button>
              );
            })
          )}
        </div>
        <button
          type="button"
          onClick={onToday}
          className={`w-full mt-4 py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${
            isDark
              ? 'text-emerald-400 border border-emerald-500/50 bg-transparent hover:bg-emerald-500/10'
              : 'text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10'
          }`}
        >
          Aujourd&apos;hui
        </button>
      </div>
    </div>
  );
};
