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
}) => {
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
      className={`rounded-2xl dashboard-widget-card overflow-hidden ${className}`}
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-2 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[15px] font-semibold text-[var(--text-primary)] capitalize">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-2 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="py-2 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
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
                    aspect-square rounded-xl text-[13px] font-medium flex flex-col items-center justify-center transition-all
                    ${isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isToday
                        ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold ring-1 ring-indigo-200 dark:ring-indigo-500/30'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                    }
                  `}
                >
                  <span>{day}</span>
                  {hasAppointments && !isSelected && (
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isToday ? 'bg-indigo-500' : 'bg-indigo-400'}`} />
                  )}
                </button>
              );
            })
          )}
        </div>
        <button
          type="button"
          onClick={onToday}
          className="w-full mt-4 py-2.5 rounded-xl text-[13px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors"
        >
          Aujourd'hui
        </button>
      </div>
    </div>
  );
};
