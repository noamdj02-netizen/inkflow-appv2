import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { DayButtonProps } from 'react-day-picker';

import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toLocalYmd } from '@/lib/agendaDates';
import type { Appointment } from '@/types';

export type PlanningDayMeta = {
  count: number;
  depositsTotal: number;
  pendingDeposits: number;
};

function buildDayMeta(appointments: Appointment[]): Record<string, PlanningDayMeta> {
  const map: Record<string, PlanningDayMeta> = {};

  for (const apt of appointments) {
    if (['cancelled', 'no_show'].includes(apt.status)) continue;

    const key = apt.date;
    const entry = map[key] ?? { count: 0, depositsTotal: 0, pendingDeposits: 0 };
    entry.count += 1;
    const deposit = apt.deposit ?? 0;
    if (deposit > 0) {
      entry.depositsTotal += deposit;
      if (!apt.depositPaid) entry.pendingDeposits += 1;
    }
    map[key] = entry;
  }

  return map;
}

export interface PlanningCalendarPickerProps {
  appointments: Appointment[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
  onToday: () => void;
  monthAppointmentCount?: number;
  className?: string;
}

export function PlanningCalendarPicker({
  appointments,
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
  onToday,
  monthAppointmentCount = 0,
  className,
}: PlanningCalendarPickerProps) {
  const todayStr = toLocalYmd(new Date());
  const displayDate = selectedDate ?? todayStr;
  const isTodaySelected = displayDate === todayStr;

  const dayMeta = useMemo(() => buildDayMeta(appointments), [appointments]);

  const selected = useMemo(() => {
    const [y, m, d] = displayDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [displayDate]);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] dark:border-zinc-800 dark:bg-zinc-900',
        className
      )}
    >
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <p className="text-center text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          {monthAppointmentCount} RDV ce mois
        </p>
      </div>

      <div className="overflow-x-auto p-2 sm:p-3">
        <Calendar
          className="mx-auto w-full max-w-none p-0 [--cell-size:2.5rem] sm:[--cell-size:2.75rem]"
          classNames={{
            root: 'w-full',
            day_button: 'size-auto min-h-(--cell-size) h-auto py-1',
            month:
              'relative first-of-type:before:hidden before:absolute max-md:before:inset-x-2 max-md:before:h-px max-md:before:-top-3 md:before:inset-y-2 md:before:w-px before:bg-border md:before:-left-3',
            months: 'flex flex-col gap-6 xl:flex-col',
            month_caption: 'text-xs font-semibold capitalize sm:text-sm',
            today: '*:after:hidden',
            weekday: 'flex-1 text-[0.65rem] sm:text-[0.7rem]',
            nav: 'gap-0',
          }}
          components={{
            DayButton: (props) => <PlanningDayButton {...props} dayMeta={dayMeta} locale={fr} />,
          }}
          locale={fr}
          mode="single"
          month={currentMonth}
          numberOfMonths={2}
          onMonthChange={onMonthChange}
          onSelect={(date) => {
            if (date) onSelectDate(toLocalYmd(date));
          }}
          pagedNavigation
          selected={selected}
          showOutsideDays={false}
        />
      </div>

      <div className="border-t border-zinc-100 px-3 pb-3 pt-2 dark:border-zinc-800">
        <button
          type="button"
          onClick={onToday}
          className={cn(
            'w-full rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-[0.98]',
            isTodaySelected
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-500/30 dark:text-blue-400 dark:hover:bg-blue-500/10'
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <CalendarIcon className="size-3.5" aria-hidden />
            Aujourd&apos;hui
          </span>
        </button>
      </div>
    </div>
  );
}

function PlanningDayButton({
  dayMeta,
  locale,
  ...props
}: DayButtonProps & { dayMeta: Record<string, PlanningDayMeta>; locale?: typeof fr }) {
  const { day, modifiers, ...buttonProps } = props;
  const key = format(day.date, 'yyyy-MM-dd');
  const meta = dayMeta[key];
  const hasAppointments = meta && meta.count > 0;
  const allDepositsSettled = hasAppointments && meta.pendingDeposits === 0;

  const sublabel = hasAppointments
    ? meta.count === 1 && meta.depositsTotal > 0
      ? `${Math.round(meta.depositsTotal)}€`
      : String(meta.count)
    : null;

  return (
    <CalendarDayButton day={day} modifiers={modifiers} locale={locale} {...buttonProps}>
      <span className="flex flex-col items-center leading-none">
        <span className="text-xs font-medium">{day.date.getDate()}</span>
        {sublabel ? (
          <span
            className={cn(
              'mt-0.5 text-[9px] font-normal leading-none sm:text-[10px]',
              allDepositsSettled
                ? 'text-emerald-500 group-data-[selected-single=true]/day:text-emerald-200'
                : 'text-muted-foreground group-data-[selected-single=true]/day:text-primary-foreground/70'
            )}
          >
            {sublabel}
          </span>
        ) : null}
      </span>
    </CalendarDayButton>
  );
}
