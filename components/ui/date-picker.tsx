'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type DatePickerProps = {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  locale?: Locale;
  align?: React.ComponentProps<typeof PopoverContent>['align'];
};

type Locale = typeof fr;

function DatePicker({
  date,
  onDateChange,
  placeholder = 'Choisir une date',
  disabled = false,
  className,
  locale = fr,
  align = 'start',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          data-empty={!date}
          className={cn(
            'w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="size-4" />
          {date ? format(date, 'PPP', { locale }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={date}
          locale={locale}
          onSelect={(nextDate) => {
            onDateChange?.(nextDate);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

type DateRangePickerProps = {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  locale?: Locale;
  align?: React.ComponentProps<typeof PopoverContent>['align'];
  numberOfMonths?: number;
};

function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = 'Choisir une période',
  disabled = false,
  className,
  locale = fr,
  align = 'start',
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const label = React.useMemo(() => {
    if (!dateRange?.from) return placeholder;
    if (!dateRange.to) {
      return format(dateRange.from, 'PPP', { locale });
    }
    return `${format(dateRange.from, 'PPP', { locale })} – ${format(dateRange.to, 'PPP', { locale })}`;
  }, [dateRange, locale, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          data-empty={!dateRange?.from}
          className={cn(
            'w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="size-4" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="range"
          selected={dateRange}
          locale={locale}
          numberOfMonths={numberOfMonths}
          onSelect={(range) => {
            onDateRangeChange?.(range);
            if (range?.from && range?.to) {
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker, DateRangePicker };
