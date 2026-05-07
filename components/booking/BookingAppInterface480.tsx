import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toLocalDateString } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const;
const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

export interface BookingAppInterface480Props {
  title: string;
  subtitle: string;
  calendarMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  availableDates: string[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  availableSlots: string[];
  selectedTime: string;
  onSelectTime: (time: string) => void;
  recap: {
    durationLabel: string;
    depositLabel: string;
    totalLabel: string;
  };
  onContinue: () => void;
  continueDisabled?: boolean;
}

export function BookingAppInterface480({
  title,
  subtitle,
  calendarMonth,
  onPrevMonth,
  onNextMonth,
  availableDates,
  selectedDate,
  onSelectDate,
  availableSlots,
  selectedTime,
  onSelectTime,
  recap,
  onContinue,
  continueDisabled = false,
}: BookingAppInterface480Props) {
  const calendarCells = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const last = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const startPad = first.getDay();
    const cells: Array<{
      key: string;
      day: number | null;
      dateStr?: string;
      isAvailable?: boolean;
    }> = [];

    for (let i = 0; i < startPad; i++) {
      cells.push({ key: `pad-${i}`, day: null });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
      const dateStr = toLocalDateString(date);
      cells.push({
        key: dateStr,
        day: d,
        dateStr,
        isAvailable: availableDates.includes(dateStr),
      });
    }
    return cells;
  }, [calendarMonth, availableDates]);

  const monthLabel = `${MONTHS[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`;

  return (
    <div className="w-full">
      <div className="px-4 pt-2">
        <header className="pt-1">
          <h2
            className="text-foreground text-[24px] font-black leading-[33px]"
            style={{ letterSpacing: '-0.48px' }}
          >
            {title}
          </h2>
          <p className="mt-1 text-muted-foreground text-[13px] leading-[17px]">{subtitle}</p>
        </header>

        <div className="mt-6 flex items-center gap-2">
          <span className="h-[26px] w-[27px] rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center text-primary text-[12px] font-black leading-[12px]">
            1
          </span>
          <span className="text-muted-foreground text-[14px] font-medium leading-[21px]">—</span>
          <span className="h-[26px] w-[30px] rounded-full border border-border bg-muted flex items-center justify-center text-muted-foreground text-[12px] font-black leading-[12px]">
            2
          </span>
          <span className="text-muted-foreground text-[14px] font-medium leading-[21px]">—</span>
          <span className="h-[26px] w-[30px] rounded-full border border-border bg-muted flex items-center justify-center text-muted-foreground text-[12px] font-black leading-[12px]">
            3
          </span>
        </div>

        <Card className="mt-6 relative overflow-hidden border border-border bg-card py-0 shadow-none rounded-[22px]">
          <div className="absolute left-0 top-[16px] bottom-[16px] w-[6px] bg-primary rounded-tr-[6px] rounded-br-[6px]" />
          <div className="p-4 pl-7">
            <h3 className="text-foreground text-[14.34px] font-bold leading-[22px]">Date</h3>

            <div className="mt-3">
              <div className="flex items-center justify-between">
                <p className="text-foreground text-[13.74px] font-bold leading-[21px]">
                  {monthLabel}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    aria-label="Mois précédent"
                    onClick={onPrevMonth}
                    variant="outline"
                    size="icon-sm"
                    className="h-7 w-7 rounded-[10px] bg-muted"
                  >
                    <ChevronLeft className="h-4 w-4 text-foreground" strokeWidth={2} />
                  </Button>
                  <Button
                    type="button"
                    aria-label="Mois suivant"
                    onClick={onNextMonth}
                    variant="outline"
                    size="icon-sm"
                    className="h-7 w-7 rounded-[10px] bg-muted"
                  >
                    <ChevronRight className="h-4 w-4 text-foreground" strokeWidth={2} />
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-2">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-medium text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarCells.map((c) => {
                  if (!c.day || !c.dateStr) {
                    return <div key={c.key} className="h-9 w-9" />;
                  }

                  const isSelected = selectedDate === c.dateStr;
                  const isAvailable = c.isAvailable === true;
                  const base =
                    'h-9 w-9 rounded-[14px] border flex items-center justify-center text-center transition-colors';
                  const enabled = isAvailable
                    ? isSelected
                      ? 'bg-primary border-transparent text-primary-foreground'
                      : 'bg-transparent border-border text-foreground/80 hover:bg-muted'
                    : 'bg-transparent border-border text-muted-foreground/30 cursor-not-allowed';

                  return (
                    <button
                      key={c.key}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => onSelectDate(c.dateStr)}
                      className={`${base} ${enabled}`}
                    >
                      <span
                        className={`leading-[18px] ${
                          isSelected ? 'font-black text-[11.3px]' : 'font-bold text-[12px]'
                        }`}
                      >
                        {c.day}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card className="mt-6 relative overflow-hidden border border-border bg-card py-0 shadow-none rounded-[22px]">
          <div className="absolute left-0 top-[16px] bottom-[16px] w-[6px] bg-primary rounded-tr-[6px] rounded-br-[6px]" />
          <div className="p-4 pl-7">
            <h3 className="text-foreground text-[14.81px] font-bold leading-[22px]">Créneaux</h3>

            <div className="mt-3 flex flex-wrap gap-2">
              {availableSlots.map((time) => {
                const active = selectedTime === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => onSelectTime(time)}
                    className={`h-[38px] rounded-full border px-4 text-center transition-colors ${
                      active
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-transparent border-border text-foreground/80 hover:bg-muted'
                    }`}
                  >
                    <span className="font-bold text-[11.4px] leading-[18px]">{time}</span>
                  </button>
                );
              })}
              {!selectedDate && (
                <p className="text-muted-foreground text-[12px] leading-[18px]">
                  Choisis d’abord une date.
                </p>
              )}
              {selectedDate && availableSlots.length === 0 && (
                <p className="text-muted-foreground text-[12px] leading-[18px]">
                  Aucun créneau disponible ce jour.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="mt-6 relative overflow-hidden border border-border bg-card py-0 shadow-none rounded-[22px]">
          <div className="absolute left-0 top-[16px] bottom-[16px] w-[6px] bg-primary rounded-tr-[6px] rounded-br-[6px]" />
          <div className="p-4 pl-7">
            <h3 className="text-foreground text-[14.78px] font-bold leading-[22px]">Récap</h3>

            <div className="mt-3 space-y-[8px] text-[11.8px] leading-[18px]">
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">Durée</span>
                <span className="font-bold text-foreground">{recap.durationLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">Acompte</span>
                <span className="font-bold text-foreground">{recap.depositLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">Total estimé</span>
                <span className="font-bold text-foreground">{recap.totalLabel}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div
        className="mt-8 px-4 pt-4 pb-5"
        style={{
          background:
            'linear-gradient(0deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 50%, rgba(255, 255, 255, 0) 100%)',
        }}
      >
        <Button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled}
          className="h-[51px] w-full rounded-[18px] font-bold text-[14.55px] leading-[22px] shadow-[0px_8px_8px_rgba(0,0,0,0.12)] transition-opacity disabled:bg-primary/60"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}
