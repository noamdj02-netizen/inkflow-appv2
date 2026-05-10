import React, { useCallback, useMemo, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, CalendarPlus, ChevronLeft, ChevronRight, ListOrdered } from 'lucide-react';
import { Appointment, Client } from '../../types';
import { cn } from '@/lib/utils';
import { formatTimeRange } from '../../lib/appointmentTime';
import {
  getClientAvatarForAppointment,
  getClientNameInitials,
} from '../../lib/appointmentClientDisplay';
import { agendaWeekEnd, agendaWeekStart, parseLocalYmd, toLocalYmd } from '../../lib/agendaDates';
import { downloadICSAll } from '../../lib/googleCalendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type SummaryRange = 'day' | 'week' | 'month';

const STATUS_FR: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  in_progress: 'En cours',
  no_show: 'Absent',
};

const LOCATION_FR: Record<Appointment['location'], string> = {
  arm: 'Bras',
  leg: 'Jambe',
  back: 'Dos',
  chest: 'Torse',
  other: 'Autre',
};

/** Libellé de groupe (liste) type « JEUDI 23 AVR. ». */
function formatDayGroupLabel(dateStr: string, withFullMonth: boolean) {
  const p = parseLocalYmd(dateStr);
  const s = withFullMonth
    ? format(p, 'EEEE d MMMM', { locale: fr })
    : format(p, 'EEEE d MMM', { locale: fr });
  return s.toLocaleUpperCase('fr');
}

/** Abréviations bandeau (2 lettres, style « LU MA … »). */
const WEEKDAYS_2 = ['LU', 'MA', 'ME', 'JE', 'VE', 'SA', 'DI'] as const;

type SummaryAppointmentCardProps = {
  apt: Appointment;
  clients: readonly Client[];
  onSelect: (apt: Appointment) => void;
};

const AgendaSummaryAppointmentCard: React.FC<SummaryAppointmentCardProps> = ({
  apt,
  clients,
  onSelect,
}) => {
  const cancelled = apt.status === 'cancelled';
  const avatarUrl = getClientAvatarForAppointment(apt, clients);
  const initials = getClientNameInitials(apt.clientName);
  const typeLabel = apt.tattooType === 'flash' ? 'Flash' : 'Projet';
  const needsDeposit = apt.status === 'confirmed' && !apt.depositPaid;

  return (
    <li>
      <Card
        data-slot="agenda-apt-row"
        size="sm"
        className={cn(
          'ring-1 ring-foreground/5 transition-[transform,box-shadow] duration-200 hover:shadow-md',
          cancelled && 'opacity-60'
        )}
      >
        <CardContent className="p-0">
          <button
            type="button"
            onClick={() => onSelect(apt)}
            className="flex w-full min-h-[4rem] touch-manipulation items-stretch gap-3 px-3.5 py-3.5 text-left text-sm font-sans text-foreground transition active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Avatar className="size-12">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 py-0.5">
              <p className="truncate text-sm font-semibold leading-snug tracking-tight sm:text-base">
                {apt.clientName}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="default"
                  className="max-w-[6.5rem] truncate font-medium leading-none"
                >
                  {typeLabel}
                </Badge>
                {apt.service && (
                  <Badge
                    variant="secondary"
                    className="max-w-[7.5rem] truncate font-medium leading-none"
                  >
                    {apt.service}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="max-w-[4.5rem] truncate border-amber-200/80 bg-amber-50/90 font-medium leading-none text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100"
                >
                  {LOCATION_FR[apt.location] ?? apt.location}
                </Badge>
              </div>
              <p className="mt-1.5 line-clamp-1 text-xs font-medium leading-tight text-muted-foreground">
                {cancelled ? (
                  <span className="text-destructive">{STATUS_FR[apt.status] ?? apt.status}</span>
                ) : needsDeposit ? (
                  <span className="text-amber-700 dark:text-amber-300">Acompte dû</span>
                ) : (
                  (STATUS_FR[apt.status] ?? apt.status)
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end justify-center self-stretch text-right">
              <p className="text-xs font-medium tabular-nums text-foreground/90 sm:text-sm">
                {formatTimeRange(apt)}
              </p>
            </div>
          </button>
        </CardContent>
      </Card>
    </li>
  );
};

type DayStripProps = {
  weekDays: { d: Date; ymd: string; dayNum: string; wk2: string; isToday: boolean }[];
  selectedYmd: string;
  onSelectYmd: (s: string) => void;
};

function AgendaDayStrip({ weekDays, selectedYmd, onSelectYmd }: DayStripProps) {
  return (
    <div
      className="scrollbar-hide flex snap-x snap-mandatory justify-between gap-1 overflow-x-auto pb-0 pt-0.5 [scrollbar-gutter:stable] sm:gap-1.5 sm:pb-1 sm:pt-1 md:gap-2"
      style={{ WebkitOverflowScrolling: 'touch' }}
      role="listbox"
      aria-label="Sélection du jour"
    >
      {weekDays.map((cell) => {
        const selected = cell.ymd === selectedYmd;
        return (
          <button
            key={cell.ymd}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={`${cell.wk2} ${cell.dayNum}${cell.isToday ? ', aujourd’hui' : ''}`}
            onClick={() => onSelectYmd(cell.ymd)}
            className={cn(
              'flex h-[3rem] w-[3rem] shrink-0 snap-center flex-col items-center justify-center rounded-full border-2 text-center font-sans transition-[transform,box-shadow,background-color] active:scale-[0.97] min-[400px]:h-[3.25rem] min-[400px]:w-[3.25rem] sm:h-14 sm:w-14 focus-visible:ring-2 focus-visible:ring-ring/50',
              selected
                ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'border-border bg-card text-foreground shadow-sm',
              cell.isToday &&
                !selected &&
                'ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
            )}
          >
            <span
              className={cn(
                'text-[9px] font-bold uppercase leading-none tracking-tight',
                selected ? 'text-primary-foreground/90' : 'text-muted-foreground'
              )}
            >
              {cell.wk2}
            </span>
            <span
              className={cn(
                'mt-0.5 text-base font-bold tabular-nums leading-none',
                selected ? 'text-primary-foreground' : 'text-foreground'
              )}
            >
              {cell.dayNum}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type MonthGridProps = {
  anchor: Date;
  todayYmd: string;
  countByYmd: Map<string, number>;
  /** Jour en surbrillance (filtre actif) */
  focusYmd: string | null;
  onPickDay: (y: string) => void;
  showAll: boolean;
};

function AgendaMonthGrid({
  anchor,
  todayYmd,
  countByYmd,
  focusYmd,
  onPickDay,
  showAll,
}: MonthGridProps) {
  const cells = useMemo(() => {
    const sm = startOfMonth(anchor);
    const firstOffset = (sm.getDay() + 6) % 7;
    const gridStart = addDays(sm, -firstOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = addDays(gridStart, i);
      const inM = isSameMonth(d, sm);
      const ds = toLocalYmd(d);
      return { d, inM, ymd: ds, n: countByYmd.get(ds) ?? 0 };
    });
  }, [anchor, countByYmd]);

  return (
    <div
      className="rounded-2xl border border-border bg-card p-2 text-card-foreground shadow-sm ring-1 ring-foreground/5"
      role="grid"
      aria-label="Calendrier du mois"
    >
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-muted-foreground">
        {WEEKDAYS_2.map((d) => (
          <div key={d} className="py-0.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell) => {
          const isToday = cell.ymd === todayYmd;
          const isFocus = !showAll && focusYmd === cell.ymd;
          return (
            <button
              key={cell.ymd}
              type="button"
              disabled={!cell.inM}
              onClick={() => cell.inM && onPickDay(cell.ymd)}
              className={cn(
                'relative flex min-h-[40px] flex-col items-center justify-center rounded-xl text-[12px] font-semibold tabular-nums transition-colors',
                !cell.inM && 'pointer-events-none text-zinc-300 dark:text-zinc-600',
                cell.inM &&
                  'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80',
                cell.inM &&
                  isFocus &&
                  'bg-primary text-primary-foreground ring-1 ring-primary hover:bg-primary',
                cell.inM && showAll && isToday && !isFocus && 'ring-1 ring-primary/50'
              )}
            >
              <span>{format(cell.d, 'd')}</span>
              {cell.inM && cell.n > 0 && (
                <span
                  className={cn(
                    'mt-0.5 h-1.5 w-1.5 rounded-full',
                    isFocus ? 'bg-primary-foreground' : 'bg-primary'
                  )}
                  aria-label={`${cell.n} rendez-vous`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface AgendaSummaryTabProps {
  appointments: Appointment[];
  today: string;
  clients?: Client[];
  onSelectAppointment: (apt: Appointment) => void;
  onOpenFullPlanning: () => void;
  onNewAppointment: () => void;
}

/**
 * Vue synthèse des RDV (jour / semaine / mois) — accès rapide sans fouiller le planning complet.
 */
export function AgendaSummaryTab({
  appointments,
  today,
  clients: clientsProp = [],
  onSelectAppointment,
  onOpenFullPlanning,
  onNewAppointment,
}: AgendaSummaryTabProps) {
  const toast = useToast();
  const clients = clientsProp;
  const [range, setRange] = useState<SummaryRange>('week');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  /** Emphase sur le bandeau (vue semaine) */
  const [weekStripYmd, setWeekStripYmd] = useState<string | null>(null);
  /** null = afficher tout le mois, sinon filtre un jour */
  const [monthScope, setMonthScope] = useState<'all' | 'day'>('all');
  const [monthFilterYmd, setMonthFilterYmd] = useState<string | null>(null);

  const stripWeekDays = useMemo(() => {
    const ws = agendaWeekStart(anchor);
    return eachDayOfInterval({ start: ws, end: agendaWeekEnd(anchor) }).map((d) => {
      const idx = (d.getDay() + 6) % 7;
      return {
        d,
        ymd: toLocalYmd(d),
        dayNum: format(d, 'd'),
        wk2: WEEKDAYS_2[idx] ?? '—',
        isToday: toLocalYmd(d) === today,
      };
    });
  }, [anchor, today]);

  const selectedYmdForStrip = useMemo(() => {
    if (range === 'day') return toLocalYmd(anchor);
    if (range === 'week') {
      const ws = toLocalYmd(agendaWeekStart(anchor));
      const we = toLocalYmd(agendaWeekEnd(anchor));
      if (weekStripYmd && weekStripYmd >= ws && weekStripYmd <= we) return weekStripYmd;
      if (today >= ws && today <= we) return today;
      return ws;
    }
    return toLocalYmd(anchor);
  }, [range, anchor, weekStripYmd, today]);

  const { startStr, endStr, periodLabel, dayHeaders } = useMemo(() => {
    if (range === 'day') {
      const s = toLocalYmd(anchor);
      return {
        startStr: s,
        endStr: s,
        periodLabel: format(anchor, 'EEEE d MMMM yyyy', { locale: fr }),
        dayHeaders: [s],
      };
    }
    if (range === 'week') {
      const ws = agendaWeekStart(anchor);
      const we = agendaWeekEnd(anchor);
      const s = toLocalYmd(ws);
      const e = toLocalYmd(we);
      return {
        startStr: s,
        endStr: e,
        periodLabel: `${format(ws, 'd MMM', { locale: fr })} – ${format(we, 'd MMMM yyyy', { locale: fr })}`,
        dayHeaders: eachDayOfInterval({ start: ws, end: we }).map(toLocalYmd),
      };
    }
    const sm = startOfMonth(anchor);
    const em = endOfMonth(anchor);
    const s = toLocalYmd(sm);
    const e = toLocalYmd(em);
    return {
      startStr: s,
      endStr: e,
      periodLabel: format(sm, 'MMMM yyyy', { locale: fr }),
      dayHeaders: eachDayOfInterval({ start: sm, end: em }).map(toLocalYmd),
    };
  }, [range, anchor]);

  const inPeriod = useMemo(() => {
    return appointments
      .filter((a) => a.date >= startStr && a.date <= endStr)
      .sort((a, b) => {
        const c0 = a.date.localeCompare(b.date);
        if (c0 !== 0) return c0;
        return a.time.localeCompare(b.time);
      });
  }, [appointments, startStr, endStr]);

  const listToRender = useMemo(() => {
    if (range === 'month' && monthScope === 'day' && monthFilterYmd) {
      return inPeriod.filter((a) => a.date === monthFilterYmd);
    }
    return inPeriod;
  }, [range, monthScope, monthFilterYmd, inPeriod]);

  const byDay = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    for (const a of listToRender) {
      const list = m.get(a.date) ?? [];
      list.push(a);
      m.set(a.date, list);
    }
    return m;
  }, [listToRender]);

  const countInMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of inPeriod) {
      m.set(a.date, (m.get(a.date) ?? 0) + 1);
    }
    return m;
  }, [inPeriod]);

  const activeCount = inPeriod.filter((a) => a.status !== 'cancelled').length;
  const cancelledInPeriod = inPeriod.filter((a) => a.status === 'cancelled').length;

  const goPrev = () => {
    if (range === 'day') setAnchor((d) => startOfDay(subDays(d, 1)));
    else if (range === 'week') {
      setAnchor((d) => startOfDay(subWeeks(d, 1)));
      setWeekStripYmd(null);
    } else setAnchor((d) => startOfDay(subMonths(d, 1)));
  };

  const goNext = () => {
    if (range === 'day') setAnchor((d) => startOfDay(addDays(d, 1)));
    else if (range === 'week') {
      setAnchor((d) => startOfDay(addWeeks(d, 1)));
      setWeekStripYmd(null);
    } else setAnchor((d) => startOfDay(addMonths(d, 1)));
  };

  const goToday = () => {
    const t = startOfDay(new Date());
    setAnchor(t);
    setWeekStripYmd(toLocalYmd(t));
    if (range === 'month') {
      setMonthScope('all');
      setMonthFilterYmd(null);
    }
  };

  const handleAddToMyCalendar = useCallback(() => {
    const toExport = inPeriod
      .filter((a) => ['pending', 'confirmed', 'in_progress'].includes(a.status))
      .map((a) => ({
        id: a.id,
        clientName: a.clientName,
        service: a.service || 'Tattoo',
        date: a.date,
        time: a.time || '10:00',
        duration: a.duration || 60,
        location: a.location,
        notes: a.notes,
      }));
    if (toExport.length === 0) {
      toast.error('Aucun rendez-vous à exporter pour cette période');
      return;
    }
    downloadICSAll(toExport);
    toast.success(
      toExport.length === 1
        ? '1 rendez-vous exporté (.ics)'
        : `${toExport.length} rendez-vous exportés (.ics)`
    );
  }, [inPeriod, toast]);

  const handleRangeChange = (r: SummaryRange) => {
    setRange(r);
    if (r === 'month') {
      setMonthScope('all');
      setMonthFilterYmd(null);
    } else {
      setWeekStripYmd(null);
    }
  };

  const handleStripSelect = (s: string) => {
    if (range === 'day') {
      setAnchor(startOfDay(parseLocalYmd(s)));
      return;
    }
    if (range === 'week') setWeekStripYmd(s);
  };

  const handleMonthCell = (d: string) => {
    setMonthFilterYmd(d);
    setMonthScope('day');
  };

  const showDayStrip = range === 'day' || range === 'week';

  const renderGroupedList = () => {
    if (listToRender.length === 0) {
      return (
        <Empty className="border-dashed border-border bg-muted/30 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Calendar strokeWidth={1.5} aria-hidden />
            </EmptyMedia>
            <EmptyTitle className="text-base">Aucun rendez-vous sur cette période</EmptyTitle>
            <EmptyDescription>
              Passez en semaine ou en mois, ou ouvrez le planning complet pour ajouter un créneau.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row flex-wrap justify-center gap-2 sm:gap-3">
            <Button type="button" className="min-w-[7rem] font-semibold" onClick={onNewAppointment}>
              Nouveau RDV
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-w-[7rem] font-semibold"
              onClick={onOpenFullPlanning}
            >
              Planning complet
            </Button>
          </EmptyContent>
        </Empty>
      );
    }

    if (range === 'week') {
      return (
        <ul className="space-y-5">
          {dayHeaders.map((dateStr) => {
            const list = byDay.get(dateStr);
            if (!list || list.length === 0) return null;
            const isTodayH = dateStr === today;
            return (
              <li key={dateStr}>
                <p className="mb-2.5 flex flex-wrap items-baseline gap-2 text-[11px] font-bold tracking-wide text-muted-foreground">
                  <span className={cn(isTodayH ? 'text-primary' : 'text-foreground/80')}>
                    {formatDayGroupLabel(dateStr, false)}
                  </span>
                  {isTodayH && (
                    <Badge
                      variant="secondary"
                      className="h-5 border-primary/20 bg-primary/10 px-1.5 text-[9px] font-bold tracking-wide text-primary"
                    >
                      AUJ.
                    </Badge>
                  )}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {list.map((apt) => (
                    <AgendaSummaryAppointmentCard
                      key={apt.id}
                      apt={apt}
                      clients={clients}
                      onSelect={onSelectAppointment}
                    />
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      );
    }

    if (range === 'month' && monthScope === 'all') {
      return (
        <ul className="flex flex-col gap-4">
          {dayHeaders.map((dateStr) => {
            const list = byDay.get(dateStr);
            if (!list || list.length === 0) return null;
            const isTodayH = dateStr === today;
            return (
              <li key={dateStr}>
                <p className="mb-2 flex flex-wrap items-baseline gap-2 text-[11px] font-bold tracking-wide text-muted-foreground">
                  <span className={cn(isTodayH ? 'text-primary' : 'text-foreground/80')}>
                    {formatDayGroupLabel(dateStr, true)}
                  </span>
                  {isTodayH && (
                    <Badge
                      variant="secondary"
                      className="h-5 border-primary/20 bg-primary/10 px-1.5 text-[9px] font-bold text-primary"
                    >
                      AUJ.
                    </Badge>
                  )}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {list.map((apt) => (
                    <AgendaSummaryAppointmentCard
                      key={apt.id}
                      apt={apt}
                      clients={clients}
                      onSelect={onSelectAppointment}
                    />
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      );
    }

    return (
      <ul className="flex flex-col gap-2.5">
        {listToRender.map((apt) => (
          <AgendaSummaryAppointmentCard
            key={apt.id}
            apt={apt}
            clients={clients}
            onSelect={onSelectAppointment}
          />
        ))}
      </ul>
    );
  };

  return (
    <div className="min-w-0 max-w-3xl mx-auto pb-4 font-sans text-sm antialiased text-foreground sm:pb-6">
      <div
        className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4"
        role="region"
        aria-label="Période et vue"
      >
        <ToggleGroup
          type="single"
          value={range}
          onValueChange={(v) => v && handleRangeChange(v as SummaryRange)}
          className="grid w-full min-w-0 max-w-none grid-cols-3 gap-0.5 rounded-full border border-border bg-muted/90 p-0.5 md:max-w-md"
          variant="default"
          size="default"
        >
          <ToggleGroupItem
            value="day"
            className="min-h-9 w-full min-w-0 rounded-full border-0 text-xs font-semibold text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm md:min-h-11 md:text-[13px]"
          >
            Jour
          </ToggleGroupItem>
          <ToggleGroupItem
            value="week"
            className="min-h-9 w-full min-w-0 rounded-full border-0 text-xs font-semibold text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm md:min-h-11 md:text-[13px]"
          >
            Semaine
          </ToggleGroupItem>
          <ToggleGroupItem
            value="month"
            className="min-h-9 w-full min-w-0 rounded-full border-0 text-xs font-semibold text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm md:min-h-11 md:text-[13px]"
          >
            Mois
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex w-full min-w-0 items-center gap-2 md:justify-end md:gap-3">
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={goPrev}
              className="size-9 shrink-0 touch-manipulation md:size-10"
              aria-label="Période précédente"
            >
              <ChevronLeft data-icon="inline-start" strokeWidth={2} aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={goNext}
              className="size-9 shrink-0 touch-manipulation md:size-10"
              aria-label="Période suivante"
            >
              <ChevronRight data-icon="inline-start" strokeWidth={2} aria-hidden />
            </Button>
          </div>

          <p className="min-w-0 flex-1 truncate text-center text-[11px] font-semibold leading-tight text-foreground md:hidden">
            {periodLabel}
          </p>

          <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddToMyCalendar}
              aria-label="Exporter la période au format agenda (.ics)"
              title="Ajouter à mon agenda"
              className="size-9 touch-manipulation md:hidden"
            >
              <CalendarPlus className="size-4 shrink-0" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddToMyCalendar}
              className="hidden h-9 max-w-full shrink gap-1.5 px-2.5 text-xs font-semibold md:inline-flex md:px-3"
            >
              <CalendarPlus className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">Ajouter à mon agenda</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToday}
              className="h-9 shrink-0 px-3 text-[11px] font-semibold tabular-nums md:text-xs"
            >
              Aujourd’hui
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-2 hidden text-balance text-center text-sm font-semibold text-foreground md:mt-3 md:block md:text-left md:text-base md:leading-tight">
        {periodLabel}
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 md:mt-2.5 md:justify-start">
        <Badge
          variant="secondary"
          className="h-auto max-w-full gap-1 border border-border/80 px-2 py-1 text-[11px] font-normal leading-snug text-muted-foreground md:gap-1.5 md:px-2.5 md:py-1.5 md:text-xs"
        >
          <ListOrdered className="size-3 shrink-0 text-muted-foreground md:size-4" aria-hidden />
          <span className="min-w-0">
            {activeCount} RDV <span className="text-muted-foreground/95">sur la période</span>
            {cancelledInPeriod > 0 && (
              <span className="text-muted-foreground/90"> · {cancelledInPeriod} annulé(s)</span>
            )}
          </span>
        </Badge>
      </div>

      <div className="mt-3 flex flex-col gap-3 md:mt-5 md:gap-4">
        {showDayStrip && (
          <div className="rounded-xl border border-border/80 bg-card/80 px-1 py-1.5 shadow-sm ring-1 ring-foreground/5 md:rounded-2xl md:px-1.5 md:py-2.5">
            <AgendaDayStrip
              weekDays={stripWeekDays}
              selectedYmd={selectedYmdForStrip}
              onSelectYmd={handleStripSelect}
            />
          </div>
        )}

        {range === 'month' && (
          <div className="flex flex-col gap-2">
            {monthScope === 'day' && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 rounded-full text-xs font-semibold"
                  onClick={() => {
                    setMonthScope('all');
                    setMonthFilterYmd(null);
                  }}
                >
                  Tout le mois
                </Button>
              </div>
            )}
            <AgendaMonthGrid
              anchor={anchor}
              todayYmd={today}
              countByYmd={countInMonth}
              focusYmd={monthFilterYmd}
              onPickDay={handleMonthCell}
              showAll={monthScope === 'all'}
            />
          </div>
        )}

        <div className="flex flex-col gap-3">{renderGroupedList()}</div>

        {inPeriod.length > 0 && (
          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onOpenFullPlanning}
              aria-label="Ouvrir le planning complet : vues semaine et mois, recherche, calendrier"
              className="flex h-auto min-h-12 w-full flex-col items-stretch justify-center gap-1 rounded-2xl border-blue-200/90 bg-background px-4 py-3 text-left text-sm font-semibold !whitespace-normal text-balance leading-snug text-blue-800 shadow-sm transition-colors hover:bg-blue-50 dark:border-blue-500/40 dark:bg-transparent dark:text-blue-200 dark:hover:bg-blue-500/10"
            >
              <span className="text-pretty">Ouvrir le planning complet</span>
              <span className="text-xs font-medium leading-relaxed text-muted-foreground sm:text-sm">
                Semaine, mois, recherche, calendrier
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
