import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useTheme } from 'next-themes';
import { endOfWeek, startOfWeek } from 'date-fns';
import {
  Calendar,
  Plus,
  ChevronRight,
  Search,
  ExternalLink,
  Download,
  Clock,
  Users,
  CalendarDays,
  X,
  SlidersHorizontal,
  Check,
  CheckCheck,
  CircleDollarSign,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Appointment, Client } from '../../types';
import { cn } from '@/lib/utils';
import { MiniCalendar } from './MiniCalendar';
import { AppointmentCalendar } from './AppointmentCalendar';
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar';
import { EmptyState } from '../common/EmptyState';
import { downloadICS, getGoogleCalendarAddUrl } from '../../lib/googleCalendar';
import { getClientAvatarForAppointment } from '../../lib/appointmentClientDisplay';
import { ClientPhotoAvatar } from '../common/ClientPhotoAvatar';

type ViewMode = 'list' | 'calendar';
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface AppointmentsViewProps {
  appointments: Appointment[];
  clients?: Client[];
  onNewAppointment: () => void;
  onSelectAppointment: (apt: Appointment) => void;
  onUpdateAppointment?: (apt: Appointment, updates: Partial<Appointment>) => void;
  planningView?: 'week' | 'month';
  /** Rafraîchir les données (ex. pull-to-refresh) */
  onRefresh?: () => void | Promise<void>;
  /** Jour à afficher (lien profond `?date=YYYY-MM-DD`) — appliqué une fois au montage. */
  initialSelectedDate?: string | null;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  in_progress: 'En cours',
  no_show: 'Absent',
};

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-400',
  confirmed: 'bg-blue-400',
  completed: 'bg-zinc-400 dark:bg-zinc-500',
  cancelled: 'bg-red-500',
  in_progress: 'bg-blue-400',
  no_show: 'bg-red-500',
};

const STATUS_STYLES: Record<string, string> = {
  pending:
    'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  confirmed:
    'bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  completed:
    'bg-zinc-50 text-zinc-600 border border-zinc-200/60 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
  cancelled:
    'bg-red-50 text-red-600 border border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  in_progress:
    'bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  no_show:
    'bg-red-50 text-red-600 border border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
};

/** Bordure gauche carte mobile — repère visuel rapide (statut). */
const CARD_LEFT_ACCENT: Record<string, string> = {
  pending: 'border-l-amber-400',
  confirmed: 'border-l-blue-500',
  completed: 'border-l-zinc-300 dark:border-l-zinc-600',
  cancelled: 'border-l-red-400',
  in_progress: 'border-l-sky-500',
  no_show: 'border-l-red-500',
};

function needsDepositAttention(apt: Appointment): boolean {
  if (apt.deposit <= 0) return false;
  if (apt.depositPaid) return false;
  return apt.status !== 'completed' && apt.status !== 'cancelled';
}

/** Lundi → dimanche (aligné sur le reste du pro dashboard FR). */
function getThisWeekYmdBounds(): { start: string; end: string } {
  const now = new Date();
  const ws = startOfWeek(now, { weekStartsOn: 1 });
  const we = endOfWeek(now, { weekStartsOn: 1 });
  return { start: toDateStr(ws), end: toDateStr(we) };
}

const kpiTileButtonClass = (active: boolean) =>
  cn(
    'flex min-h-[52px] min-w-0 border px-3 py-2.5 text-left transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 sm:min-h-[76px] sm:flex-col sm:items-center sm:justify-center sm:px-3 sm:py-2.5 sm:text-center rounded-pro-card',
    active
      ? 'border-blue-600 bg-pro-cta text-white shadow-pro dark:border-blue-500 dark:bg-blue-500'
      : 'border-zinc-200/80 bg-white/95 text-zinc-900 hover:border-blue-200/80 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-100 dark:hover:border-zinc-600'
  );

type KpiStatTileProps = {
  isActive: boolean;
  count: number;
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
  'aria-pressed'?: boolean;
};

/** Tuile Aperçu (mobile = ligne libellé+chiffre, sm+ = carte centrée). */
function KpiStatTile({
  isActive,
  count,
  label,
  Icon,
  onClick,
  'aria-pressed': ariaPressed,
}: KpiStatTileProps) {
  return (
    <button
      type="button"
      aria-pressed={ariaPressed ?? isActive}
      onClick={onClick}
      className={kpiTileButtonClass(isActive)}
    >
      <span className="flex w-full flex-row items-center justify-between gap-3 sm:hidden">
        <span className="flex min-w-0 items-center gap-2.5">
          <Icon
            className={cn(
              'h-5 w-5 shrink-0',
              isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'
            )}
            aria-hidden
          />
          <span
            className={cn(
              'truncate text-xs font-medium',
              isActive ? 'text-white' : 'text-zinc-600 dark:text-zinc-300'
            )}
          >
            {label}
          </span>
        </span>
        <span
          className={cn(
            'shrink-0 font-display text-2xl font-bold tabular-nums leading-none',
            isActive ? 'text-white' : 'text-zinc-900 dark:text-white'
          )}
        >
          {count}
        </span>
      </span>
      <span className="hidden w-full flex-col items-center justify-center gap-1 sm:flex">
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'
          )}
          aria-hidden
        />
        <span
          className={cn(
            'font-display text-xl font-bold tabular-nums leading-none sm:text-2xl',
            isActive ? 'text-white' : 'text-zinc-900 dark:text-white'
          )}
        >
          {count}
        </span>
        <span
          className={cn(
            'pro-text-small font-medium leading-tight',
            isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'
          )}
        >
          {label}
        </span>
      </span>
    </button>
  );
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  clients = [],
  onNewAppointment,
  onSelectAppointment,
  onUpdateAppointment,
  planningView = 'week',
  onRefresh,
  initialSelectedDate = null,
}) => {
  const { containerRef, pullDistance, refreshing } = usePullToRefresh(onRefresh, {
    getScrollParent: () => containerRef.current?.closest('.app-shell-content') ?? null,
    disabled: !onRefresh,
  });
  const setSectionRef = useCallback(
    (el: HTMLElement | null) => {
      (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
    },
    [containerRef]
  );
  const { resolvedTheme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>(
    planningView === 'month' ? 'calendar' : 'list'
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateRangeChip, setDateRangeChip] = useState<'today' | 'week' | null>(
    planningView === 'week' ? 'week' : null
  );
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(() => new Date());
  const [showCalendarMobile, setShowCalendarMobile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const appliedInitialDateFromUrl = useRef(false);

  useEffect(() => {
    if (appliedInitialDateFromUrl.current || !initialSelectedDate?.trim()) return;
    const d = initialSelectedDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
    appliedInitialDateFromUrl.current = true;
    setSelectedDate(d);
    setDateRangeChip(null);
    setMiniCalendarMonth(new Date(`${d}T12:00:00`));
  }, [initialSelectedDate]);

  useEffect(() => {
    if (planningView === 'month') {
      setViewMode('calendar');
      setDateRangeChip(null);
    } else {
      setViewMode('list');
      setDateRangeChip('week');
    }
  }, [planningView]);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  const datesWithAppointments = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => set.add(a.date));
    return set;
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    let list = appointments;
    if (statusFilter !== 'all') list = list.filter((a) => a.status === statusFilter);
    if (dateRangeChip === 'today') {
      list = list.filter((a) => a.date === toDateStr(new Date()));
    } else if (dateRangeChip === 'week') {
      const { start, end } = getThisWeekYmdBounds();
      list = list.filter((a) => a.date >= start && a.date <= end);
    } else if (selectedDate) {
      list = list.filter((a) => a.date === selectedDate);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.clientName.toLowerCase().includes(q) ||
          a.service.toLowerCase().includes(q) ||
          a.clientEmail?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [appointments, statusFilter, selectedDate, dateRangeChip, searchQuery]);

  /**
   * Même filtres que la liste mais **sans** le filtre jour unique — ainsi la grille mois
   * conserve les autres jours en surbrillance quand un jour est sélectionné pour la liste.
   */
  const appointmentsForCalendarGrid = useMemo(() => {
    let list = appointments;
    if (statusFilter !== 'all') list = list.filter((a) => a.status === statusFilter);
    if (dateRangeChip === 'today') {
      list = list.filter((a) => a.date === toDateStr(new Date()));
    } else if (dateRangeChip === 'week') {
      const { start, end } = getThisWeekYmdBounds();
      list = list.filter((a) => a.date >= start && a.date <= end);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.clientName.toLowerCase().includes(q) ||
          a.service.toLowerCase().includes(q) ||
          a.clientEmail?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [appointments, statusFilter, dateRangeChip, searchQuery]);

  /** Agrégats pour le mois grille (voir `FullScreenCalendar`). */
  const fullscreenCalendarData = useMemo(() => {
    type Bundle = Map<string, Array<(typeof appointments)[number]>>;
    const byDay: Bundle = new Map();
    for (const a of appointmentsForCalendarGrid) {
      if (!byDay.has(a.date)) byDay.set(a.date, []);
      byDay.get(a.date)!.push(a);
    }
    return [...byDay.entries()]
      .map(([ymd, apts]) => {
        const sorted = [...apts].sort((x, y) =>
          `${x.date}T${x.time ?? ''}`.localeCompare(`${y.date}T${y.time ?? ''}`)
        );
        return {
          day: new Date(`${ymd}T12:00:00`),
          events: sorted.map((apt) => ({
            id: apt.id,
            name: apt.clientName,
            time: apt.time ?? '',
            datetime: apt.time ? `${apt.date}T${apt.time}` : `${apt.date}T12:00:00`,
          })),
        };
      })
      .sort((a, b) => a.day.getTime() - b.day.getTime());
  }, [appointmentsForCalendarGrid]);

  const stats = useMemo(() => {
    const today = toDateStr(new Date());
    const { start: wStart, end: wEnd } = getThisWeekYmdBounds();
    let todayCount = 0,
      weekCount = 0;
    appointments.forEach((a) => {
      if (a.date === today) todayCount++;
      if (a.date >= wStart && a.date <= wEnd && !['cancelled', 'no_show'].includes(a.status)) {
        weekCount++;
      }
    });
    return {
      todayCount,
      weekCount,
      pendingCount: appointments.filter((a) => a.status === 'pending').length,
    };
  }, [appointments]);

  const handlePrevMonth = () =>
    setMiniCalendarMonth((m) => {
      const d = new Date(m);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  const handleNextMonth = () =>
    setMiniCalendarMonth((m) => {
      const d = new Date(m);
      d.setMonth(d.getMonth() + 1);
      return d;
    });

  const activeLabel =
    dateRangeChip === 'today'
      ? "Aujourd'hui"
      : dateRangeChip === 'week'
        ? 'Cette semaine'
        : selectedDate
          ? formatDateLabel(selectedDate)
          : null;

  /** Mobile : le bottom nav dit « Agenda » — le h1 porte le contexte (semaine vs mois), pas un 2e « Rendez-vous ». */
  const appointmentsMobileHeadline = planningView === 'month' ? 'Vue mois' : 'Liste & semaine';

  /** Mobile : 3 lignes (cibles larges) · sm+ : 3 tuiles côte à côte */
  const kpiGridClass = 'grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3';

  return (
    <section
      ref={setSectionRef}
      className="flex min-w-0 flex-col gap-4 font-sans sm:gap-6 md:gap-8"
      aria-label="Rendez-vous"
    >
      {onRefresh && (
        <div
          className="md:hidden flex h-5 items-center justify-center text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
          style={{ opacity: Math.min(1, (pullDistance / 64) * 0.9 + (refreshing ? 0.2 : 0)) }}
        >
          {refreshing ? 'Actualisation…' : pullDistance > 12 ? 'Relâchez pour actualiser' : ''}
        </div>
      )}

      {/* Sous-titre (mobile) + CTA : le hero titre vit dans DashboardPro */}
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="pro-text-body min-w-0 font-medium text-zinc-800 dark:text-zinc-100 sm:text-base">
            <span className="sm:hidden">{appointmentsMobileHeadline}</span>
            <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400 sm:font-normal">
              Filtre par période et statut, puis liste ou calendrier.
            </span>
          </p>
          <button
            type="button"
            onClick={onNewAppointment}
            className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-pro-btn bg-pro-cta px-4 text-sm font-medium shadow-pro transition-transform hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 active:scale-[0.98] dark:focus-visible:ring-offset-black sm:h-10 sm:w-auto"
            aria-label="Créer un nouveau rendez-vous"
          >
            <Plus className="h-4 w-4" aria-hidden />
            <span>Nouveau RDV</span>
          </button>
        </div>

        {/* KPI : période (lun–dim) + en attente — une tuile = un filtre */}
        <div
          className="rounded-pro-card border border-zinc-200/80 bg-gradient-to-b from-white/95 to-blue-50/40 p-2 shadow-pro dark:border-zinc-800 dark:from-zinc-900/60 dark:to-zinc-950/80 dark:shadow-none sm:p-4"
          role="region"
          aria-label="Indicateurs sur la période"
        >
          <div className="mb-2 sm:mb-3">
            <p className="pro-text-small font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Aperçu
            </p>
            <p
              className="pro-text-small mt-0.5 max-w-prose text-zinc-500 dark:text-zinc-400 sm:mt-1"
              id="kpi-hint"
            >
              <span className="sm:hidden">Tape une ligne pour filtrer la liste.</span>
              <span className="hidden sm:inline">
                Touche un indicateur pour filtrer la liste ci-dessous.
              </span>
            </p>
          </div>
          <div className={kpiGridClass} aria-describedby="kpi-hint">
            <KpiStatTile
              isActive={dateRangeChip === 'today'}
              count={stats.todayCount}
              label="Aujourd'hui"
              Icon={CalendarDays}
              onClick={() => {
                setDateRangeChip('today');
                setSelectedDate(null);
                setMiniCalendarMonth(new Date());
              }}
            />
            <KpiStatTile
              isActive={dateRangeChip === 'week'}
              count={stats.weekCount}
              label="Cette semaine"
              Icon={Clock}
              onClick={() => {
                setDateRangeChip('week');
                setSelectedDate(null);
              }}
            />
            <KpiStatTile
              isActive={statusFilter === 'pending'}
              count={stats.pendingCount}
              label="En attente"
              Icon={Users}
              onClick={() => {
                setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending');
                setDateRangeChip(null);
                setSelectedDate(null);
              }}
            />
          </div>
        </div>
      </div>

      <div className="animate-fade-in motion-reduce:animate-none space-y-4 sm:space-y-6 md:space-y-8">
        {/* Barre d’outils : colonne = filtres en dessous des contrôles sur mobile ; sm+ = grille 2 col */}
        <div className="grid grid-cols-1 gap-2 rounded-pro-card border border-zinc-200/70 bg-white/80 p-2 shadow-pro dark:border-zinc-800 dark:bg-zinc-900/50 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-3 sm:p-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:min-h-11">
            <div
              className="inline-flex shrink-0 rounded-pro-card border border-zinc-200/60 bg-zinc-100/90 p-1 dark:border-zinc-700/60 dark:bg-zinc-800/90"
              role="group"
              aria-label="Changer de vue"
            >
              {(['list', 'calendar'] as ViewMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMode(m)}
                  aria-pressed={viewMode === m}
                  className={cn(
                    'min-h-11 min-w-[4.5rem] rounded-pro-btn px-3 text-xs font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 sm:min-h-9',
                    viewMode === m
                      ? 'border border-zinc-200/80 bg-white text-zinc-900 shadow-pro dark:border-zinc-600 dark:bg-zinc-700 dark:text-white'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  )}
                >
                  {m === 'list' ? 'Liste' : 'Planning'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowCalendarMobile((v) => !v)}
              className={cn(
                'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-pro-btn border px-2 text-xs font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 lg:hidden',
                showCalendarMobile
                  ? 'border-blue-200 bg-blue-50 text-pro-accent dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400'
                  : 'border-zinc-200/80 bg-white text-zinc-600 shadow-pro dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
              )}
              aria-expanded={showCalendarMobile}
              aria-controls="agenda-mini-calendar-panel"
              aria-label={
                showCalendarMobile ? 'Masquer le mini-calendrier' : 'Afficher le mini-calendrier'
              }
            >
              <Calendar className="h-4 w-4" aria-hidden />
              <span className="hidden min-[400px]:inline">Mini cal.</span>
            </button>

            <div className="hidden min-w-[min(1rem,100%)] flex-1 sm:block" aria-hidden />

            {showSearch ? (
              <div className="flex min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-[14rem] sm:flex-[1] items-center gap-2 sm:min-w-[10rem]">
                <div className="relative min-w-0 flex-1">
                  <label htmlFor="appointments-list-search" className="sr-only">
                    Filtrer la liste des rendez-vous
                  </label>
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-400"
                    aria-hidden
                  />
                  <input
                    id="appointments-list-search"
                    ref={searchRef}
                    type="search"
                    name="q"
                    autoComplete="off"
                    placeholder="Client, service…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pro-text-body w-full min-h-11 rounded-pro-btn border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pro-btn bg-zinc-100 text-zinc-500 transition-colors active:scale-[0.98] hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                  aria-label="Fermer la recherche"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pro-btn border border-zinc-200/80 bg-white text-zinc-500 shadow-pro transition-colors hover:text-pro-accent active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-blue-400"
                aria-label="Rechercher un rendez-vous"
              >
                <Search className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative min-w-0 sm:min-w-[12rem] sm:max-w-[20rem]">
            <label htmlFor="appointments-status-filter" className="sr-only">
              Filtrer par statut
            </label>
            <select
              id="appointments-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="pro-text-small min-h-11 w-full min-w-0 cursor-pointer appearance-none rounded-pro-btn border border-zinc-200/80 bg-white py-2 pl-3 pr-9 font-medium text-zinc-700 shadow-pro transition-all focus:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
            <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          </div>
        </div>

        {/* Résumé filtre actif */}
        {activeLabel && (
          <div className="flex flex-wrap items-center gap-2 rounded-pro-card border border-zinc-200/70 bg-zinc-50/90 px-3 py-2 shadow-pro dark:border-zinc-700/80 dark:bg-zinc-900/50 sm:px-4">
            <Calendar className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden />
            <span className="pro-text-small min-w-0 flex-1 tabular-nums text-zinc-600 dark:text-zinc-400">
              {filteredAppointments.length} RDV ·{' '}
              <span className="font-medium text-pro-accent dark:text-blue-400">{activeLabel}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(null);
                setDateRangeChip(null);
                setStatusFilter('all');
              }}
              className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pro-btn text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label="Réinitialiser les filtres"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Calendrier mois desktop (largeur suffisante) — grilles type shadcn / 21st */}
        <div className="hidden min-w-0 lg:block">
          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <div className="max-h-[min(720px,calc(100vh-14rem))] overflow-y-auto">
              <FullScreenCalendar
                className="text-zinc-900 dark:text-zinc-50"
                data={fullscreenCalendarData}
                selectedDateYmd={selectedDate}
                onSelectDay={(d) => {
                  setSelectedDate(d);
                  setDateRangeChip(null);
                }}
                monthDate={miniCalendarMonth}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onGoToday={() => {
                  setSelectedDate(toDateStr(new Date()));
                  setDateRangeChip(null);
                  setMiniCalendarMonth(new Date());
                }}
                onNewEvent={onNewAppointment}
                onSearchClick={() => setShowSearch(true)}
              />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            Touche une date pour filtrer la liste selon tes filtres actifs (statut, période,
            recherche).
          </p>
        </div>

        {/* ── LAYOUT ─────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-5 min-w-0">
          {/* Mini cal — mobile / tablette (volet rétractable ) */}
          <aside
            id="agenda-mini-calendar-panel"
            className={`flex-shrink-0 lg:hidden ${showCalendarMobile ? 'block' : 'hidden'}`}
          >
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
              <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Calendrier
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                  Touche un jour pour filtrer la liste
                </p>
              </div>
              <MiniCalendar
                className="!rounded-none !border-0 !shadow-none bg-transparent dark:!bg-transparent"
                selectedDate={selectedDate}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  setDateRangeChip(null);
                  setShowCalendarMobile(false);
                }}
                datesWithAppointments={datesWithAppointments}
                currentMonth={miniCalendarMonth}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onToday={() => {
                  setSelectedDate(toDateStr(new Date()));
                  setMiniCalendarMonth(new Date());
                }}
                variant={viewMode === 'calendar' && resolvedTheme === 'dark' ? 'dark' : 'default'}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
            {viewMode === 'calendar' ? (
              <AppointmentCalendar
                appointments={filteredAppointments}
                clients={clients}
                onSlotClick={onNewAppointment}
                onAppointmentClick={onSelectAppointment}
                onUpdateAppointment={onUpdateAppointment}
              />
            ) : filteredAppointments.length === 0 ? (
              <div className="rounded-pro-card border border-zinc-200/80 bg-white shadow-pro dark:border-zinc-800 dark:bg-zinc-900">
                <EmptyState
                  icon={Calendar}
                  title="Aucun rendez-vous"
                  description={
                    dateRangeChip === 'today'
                      ? "Aucun RDV aujourd'hui"
                      : dateRangeChip === 'week'
                        ? 'Aucun RDV cette semaine'
                        : selectedDate
                          ? `Aucun RDV le ${selectedDate}`
                          : 'Vos RDV apparaîtront ici'
                  }
                  primaryAction={{ label: 'Nouveau RDV', onClick: onNewAppointment }}
                  className="py-16"
                />
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <ul className="space-y-3 md:hidden" role="list">
                  {filteredAppointments.map((apt) => {
                    const leftAccent =
                      CARD_LEFT_ACCENT[apt.status] || 'border-l-zinc-300 dark:border-l-zinc-600';
                    const depositDue = needsDepositAttention(apt);
                    return (
                      <li key={apt.id}>
                        <button
                          type="button"
                          onClick={() => onSelectAppointment(apt)}
                          className={cn(
                            'w-full touch-manipulation overflow-hidden rounded-pro-card border border-zinc-200/80 border-l-4 bg-white text-left shadow-pro transition-shadow duration-150 hover:border-zinc-300 hover:shadow-pro active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600',
                            leftAccent
                          )}
                        >
                          <div className="flex items-center gap-3 p-4">
                            {/* Avatar */}
                            <div className="relative w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-700 flex flex-shrink-0 items-center justify-center overflow-hidden shadow-sm ring-1 ring-zinc-200/60 dark:ring-zinc-600/60">
                              <ClientPhotoAvatar
                                name={apt.clientName}
                                src={getClientAvatarForAppointment(apt, clients)}
                                className="absolute inset-0 h-full w-full"
                                textClassName="text-base font-bold text-zinc-700 dark:text-zinc-200"
                              />
                            </div>
                            {/* Infos */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate leading-snug">
                                  {apt.clientName}
                                </span>
                                <span className="font-bold text-blue-700 dark:text-blue-400 text-sm tabular-nums shrink-0">
                                  {apt.price}€
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">
                                  {apt.date}
                                  {apt.time ? ` · ${apt.time}` : ''}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${STATUS_STYLES[apt.status] || STATUS_STYLES.completed}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[apt.status] || 'bg-zinc-400'}`}
                                  />
                                  {STATUS_LABELS[apt.status] ?? apt.status}
                                </span>
                                {depositDue && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25">
                                    <CircleDollarSign className="w-3 h-3 shrink-0" aria-hidden />
                                    Acompte
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight
                              className="w-5 h-5 text-zinc-300 dark:text-zinc-600 shrink-0 self-center"
                              aria-hidden
                            />
                          </div>
                          {/* Export — cibles tactiles ≥ 44px */}
                          <div className="flex items-stretch justify-end gap-1 px-2 pb-2 border-t border-zinc-100/90 dark:border-zinc-800/90">
                            <a
                              href={getGoogleCalendarAddUrl(apt)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-xs font-medium transition-colors active:scale-[0.98]"
                              title="Ouvrir dans Google Agenda"
                            >
                              <ExternalLink className="w-4 h-4 shrink-0" /> Agenda
                            </a>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadICS(apt);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-xs font-medium transition-colors active:scale-[0.98]"
                              title="Télécharger le fichier .ics"
                            >
                              <Download className="w-4 h-4 shrink-0" /> .ics
                            </button>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* Desktop table */}
                <div className="hidden min-w-0 overflow-hidden rounded-pro-card border border-zinc-200/80 bg-white shadow-pro dark:border-zinc-800 dark:bg-zinc-900 md:block">
                  <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800 sm:px-5">
                    <span className="pro-text-small font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                      {filteredAppointments.length} rendez-vous
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[36rem]">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800">
                          <th
                            scope="col"
                            className="px-5 py-3 text-left text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider"
                          >
                            Client
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3 text-left text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider"
                          >
                            Date / Heure
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3 text-left text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider"
                          >
                            Service
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3 text-left text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider"
                          >
                            Prix
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3 text-left text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider"
                          >
                            Statut
                          </th>
                          <th scope="col" className="px-4 py-3 w-24" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.map((apt, i) => (
                          <tr
                            key={apt.id}
                            onClick={() => onSelectAppointment(apt)}
                            className={`group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${i !== filteredAppointments.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''}`}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-200 shadow-sm dark:bg-zinc-700">
                                  <ClientPhotoAvatar
                                    name={apt.clientName}
                                    src={getClientAvatarForAppointment(apt, clients)}
                                    className="absolute inset-0 h-full w-full"
                                    textClassName="text-sm font-semibold text-zinc-700 dark:text-zinc-200"
                                  />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                                    {apt.clientName}
                                  </div>
                                  {apt.clientEmail && (
                                    <div className="text-xs text-zinc-500 dark:text-zinc-500">
                                      {apt.clientEmail}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">
                                <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                                {apt.date}
                                {apt.time ? ` · ${apt.time}` : ''}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                              {apt.service}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                                {apt.price}€
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[apt.status] || STATUS_STYLES.completed}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[apt.status] || 'bg-zinc-400'}`}
                                  />
                                  {STATUS_LABELS[apt.status] ?? apt.status}
                                </span>
                                {needsDepositAttention(apt) && (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25">
                                    <CircleDollarSign className="w-3 h-3" aria-hidden />
                                    Acompte
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Quick status actions */}
                                {apt.status === 'pending' && onUpdateAppointment && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onUpdateAppointment(apt, { status: 'confirmed' });
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                                    title="Confirmer"
                                  >
                                    <Check className="w-3 h-3" /> Confirmer
                                  </button>
                                )}
                                {apt.status === 'confirmed' && onUpdateAppointment && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onUpdateAppointment(apt, { status: 'completed' });
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                                    title="Terminer"
                                  >
                                    <CheckCheck className="w-3 h-3" /> Terminer
                                  </button>
                                )}
                                <a
                                  href={getGoogleCalendarAddUrl(apt)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                  title="Google Agenda"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadICS(apt);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                  title=".ics"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
