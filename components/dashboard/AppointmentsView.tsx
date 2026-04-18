import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Calendar, Plus, ChevronRight, Search, ExternalLink, Download, Clock, Users, CalendarDays, X, SlidersHorizontal, Check, CheckCheck, CircleDollarSign } from 'lucide-react';
import { Appointment, Client } from '../../types';
import { MiniCalendar } from './MiniCalendar';
import { AppointmentCalendar } from './AppointmentCalendar';
import { downloadICS, getGoogleCalendarAddUrl } from '../../lib/googleCalendar';

type ViewMode = 'list' | 'calendar';
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface AppointmentsViewProps {
  appointments: Appointment[];
  clients?: Client[];
  onNewAppointment: () => void;
  onSelectAppointment: (apt: Appointment) => void;
  onUpdateAppointment?: (apt: Appointment, updates: Partial<Appointment>) => void;
  planningView?: 'week' | 'month';
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
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
  confirmed: 'bg-emerald-400',
  completed: 'bg-zinc-400 dark:bg-zinc-500',
  cancelled: 'bg-red-500',
  in_progress: 'bg-blue-400',
  no_show: 'bg-red-500',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  completed: 'bg-zinc-50 text-zinc-600 border border-zinc-200/60 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
  cancelled: 'bg-red-50 text-red-600 border border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  no_show: 'bg-red-50 text-red-600 border border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
};

/** Bordure gauche carte mobile — repère visuel rapide (statut). */
const CARD_LEFT_ACCENT: Record<string, string> = {
  pending: 'border-l-amber-400',
  confirmed: 'border-l-emerald-500',
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

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  clients = [],
  onNewAppointment,
  onSelectAppointment,
  onUpdateAppointment,
  planningView = 'week',
}) => {
  const clientByEmail = useMemo(() => {
    const m = new Map<string, Client>();
    clients.forEach((c) => { if (c.email) m.set(c.email.toLowerCase(), c); });
    return m;
  }, [clients]);
  const getAvatar = (apt: Appointment) =>
    (apt.clientId && clients.find((c) => c.id === apt.clientId)?.avatar) ||
    clientByEmail.get(apt.clientEmail?.toLowerCase() || '')?.avatar;

  const { resolvedTheme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>(planningView === 'month' ? 'calendar' : 'list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateRangeChip, setDateRangeChip] = useState<'today' | 'week' | null>(planningView === 'week' ? 'week' : null);
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(() => new Date());
  const [showCalendarMobile, setShowCalendarMobile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (planningView === 'month') { setViewMode('calendar'); setDateRangeChip(null); }
    else { setViewMode('list'); setDateRangeChip('week'); }
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
      const s = new Date(); s.setDate(s.getDate() - s.getDay());
      const e = new Date(s); e.setDate(e.getDate() + 6);
      list = list.filter((a) => a.date >= toDateStr(s) && a.date <= toDateStr(e));
    } else if (selectedDate) {
      list = list.filter((a) => a.date === selectedDate);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((a) => a.clientName.toLowerCase().includes(q) || a.service.toLowerCase().includes(q) || (a.clientEmail?.toLowerCase().includes(q)));
    }
    return list.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [appointments, statusFilter, selectedDate, dateRangeChip, searchQuery]);

  const stats = useMemo(() => {
    const today = toDateStr(new Date());
    const s = new Date(); s.setDate(s.getDate() - s.getDay());
    const e = new Date(s); e.setDate(e.getDate() + 6);
    const sTs = s.getTime(), eTs = e.getTime();
    let todayCount = 0, weekCount = 0;
    appointments.forEach((a) => {
      const t = new Date(`${a.date}T00:00:00`).getTime();
      if (a.date === today) todayCount++;
      if (t >= sTs && t <= eTs && !['cancelled', 'no_show'].includes(a.status)) weekCount++;
    });
    return { todayCount, weekCount, pendingCount: appointments.filter((a) => a.status === 'pending').length };
  }, [appointments]);

  const handlePrevMonth = () => setMiniCalendarMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d; });
  const handleNextMonth = () => setMiniCalendarMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d; });

  const activeLabel = dateRangeChip === 'today' ? "Aujourd'hui" : dateRangeChip === 'week' ? 'Cette semaine' : selectedDate ? formatDateLabel(selectedDate) : null;

  /** Mobile : le bottom nav dit « Agenda » — le h1 porte le contexte (semaine vs mois), pas un 2e « Rendez-vous ». */
  const appointmentsMobileHeadline = planningView === 'month' ? 'Vue mois' : 'Liste & semaine';

  /** Mobile : 1 colonne (lignes pleine largeur) · sm+ : 3 tuiles côte à côte */
  const kpiGridClass = 'grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3';

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6 md:gap-8 font-sans">

      {/* ── En-tête page (aligné Demandes / Clients : eyebrow mobile + titre contextuel) ── */}
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500 sm:hidden mb-0.5">
              Agenda
            </p>
            <h1 className="font-display font-bold leading-tight tracking-tight text-zinc-900 dark:text-white text-xl min-[380px]:text-[1.35rem] sm:text-2xl md:text-3xl">
              <span className="sm:hidden">{appointmentsMobileHeadline}</span>
              <span className="hidden sm:inline">Rendez-vous</span>
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2 sm:line-clamp-none sm:text-sm sm:leading-normal md:text-base">
              <span className="sm:hidden">Filtre la période ci-dessous, puis Liste ou Planning.</span>
              <span className="hidden sm:inline">
                Filtre par période et statut, puis passe en liste ou en planning pour voir la journée semaine par semaine.
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onNewAppointment}
            className="inline-flex w-full min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:focus-visible:ring-offset-black sm:w-auto sm:min-h-[40px] sm:py-2.5"
          >
            <Plus className="h-4 w-4" aria-hidden />
            <span>Nouveau RDV</span>
          </button>
        </div>

        {/* KPI — chiffre dominant + libellé (scan rapide), 3 tuiles fixes, filtres au clic */}
        <div
          className="rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-white/90 to-zinc-50/90 p-2.5 shadow-sm dark:border-zinc-800 dark:from-zinc-900/60 dark:to-zinc-950/80 dark:shadow-none sm:p-4"
          role="region"
          aria-label="Indicateurs sur la période"
        >
          <div className="mb-2 sm:mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:text-[11px]">
              Aperçu
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-zinc-400 dark:text-zinc-500 sm:mt-1 sm:text-[11px]" id="kpi-hint">
              <span className="sm:hidden">Tape une ligne pour filtrer la liste.</span>
              <span className="hidden sm:inline">Touche un indicateur pour filtrer la liste ci-dessous.</span>
            </p>
          </div>
          <div className={kpiGridClass} aria-describedby="kpi-hint">
          <button
            type="button"
            aria-pressed={dateRangeChip === 'today'}
            onClick={() => { setDateRangeChip('today'); setSelectedDate(null); setMiniCalendarMonth(new Date()); }}
            className={`flex min-h-[52px] min-w-0 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 sm:min-h-[76px] sm:flex-col sm:items-center sm:justify-center sm:px-3 sm:py-2.5 sm:text-center ${
              dateRangeChip === 'today'
                ? 'border-sky-500/50 bg-sky-50 shadow-inner dark:border-sky-500/40 dark:bg-sky-500/10'
                : 'border-zinc-200/80 bg-white/95 hover:border-zinc-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800/90 dark:hover:border-zinc-600'
            }`}
          >
            <span className="flex w-full flex-row items-center justify-between gap-3 sm:hidden">
              <span className="flex min-w-0 items-center gap-2.5">
                <CalendarDays className={`h-5 w-5 shrink-0 ${dateRangeChip === 'today' ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-400 dark:text-zinc-500'}`} aria-hidden />
                <span className={`truncate text-xs font-semibold ${dateRangeChip === 'today' ? 'text-sky-800 dark:text-sky-200' : 'text-zinc-600 dark:text-zinc-300'}`}>
                  Aujourd&apos;hui
                </span>
              </span>
              <span className={`shrink-0 font-display text-2xl font-bold tabular-nums leading-none ${dateRangeChip === 'today' ? 'text-sky-700 dark:text-sky-300' : 'text-zinc-900 dark:text-white'}`}>
                {stats.todayCount}
              </span>
            </span>
            <span className="hidden w-full flex-col items-center justify-center gap-1 sm:flex">
              <CalendarDays className={`h-4 w-4 shrink-0 ${dateRangeChip === 'today' ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-400 dark:text-zinc-500'}`} aria-hidden />
              <span className={`font-display text-xl font-bold tabular-nums leading-none sm:text-2xl ${dateRangeChip === 'today' ? 'text-sky-700 dark:text-sky-300' : 'text-zinc-900 dark:text-white'}`}>
                {stats.todayCount}
              </span>
              <span className={`text-[10px] font-semibold leading-tight sm:text-[11px] ${dateRangeChip === 'today' ? 'text-sky-800 dark:text-sky-200' : 'text-zinc-500 dark:text-zinc-400'}`}>
                Aujourd&apos;hui
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-pressed={dateRangeChip === 'week'}
            onClick={() => { setDateRangeChip('week'); setSelectedDate(null); }}
            className={`flex min-h-[52px] min-w-0 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 sm:min-h-[76px] sm:flex-col sm:items-center sm:justify-center sm:px-3 sm:py-2.5 sm:text-center ${
              dateRangeChip === 'week'
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                : 'border-zinc-200/80 bg-white/95 hover:border-zinc-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800/90 dark:hover:border-zinc-600'
            }`}
          >
            <span className="flex w-full flex-row items-center justify-between gap-3 sm:hidden">
              <span className="flex min-w-0 items-center gap-2.5">
                <Clock className={`h-5 w-5 shrink-0 ${dateRangeChip === 'week' ? 'text-white dark:text-zinc-900' : 'text-zinc-400 dark:text-zinc-500'}`} aria-hidden />
                <span className={`truncate text-xs font-semibold ${dateRangeChip === 'week' ? 'text-zinc-200 dark:text-zinc-700' : 'text-zinc-600 dark:text-zinc-300'}`}>
                  Cette semaine
                </span>
              </span>
              <span className={`shrink-0 font-display text-2xl font-bold tabular-nums leading-none ${dateRangeChip === 'week' ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-white'}`}>
                {stats.weekCount}
              </span>
            </span>
            <span className="hidden w-full flex-col items-center justify-center gap-1 sm:flex">
              <Clock className={`h-4 w-4 shrink-0 ${dateRangeChip === 'week' ? 'text-white opacity-90 dark:text-zinc-900' : 'text-zinc-400 dark:text-zinc-500'}`} aria-hidden />
              <span className={`font-display text-xl font-bold tabular-nums leading-none sm:text-2xl ${dateRangeChip === 'week' ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-white'}`}>
                {stats.weekCount}
              </span>
              <span className={`text-[10px] font-semibold leading-tight sm:text-[11px] ${dateRangeChip === 'week' ? 'text-zinc-200 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                Cette semaine
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-pressed={statusFilter === 'pending'}
            onClick={() => { setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending'); setDateRangeChip(null); setSelectedDate(null); }}
            className={`flex min-h-[52px] min-w-0 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 sm:min-h-[76px] sm:flex-col sm:items-center sm:justify-center sm:px-3 sm:py-2.5 sm:text-center ${
              statusFilter === 'pending'
                ? 'border-amber-500 bg-amber-500 text-white shadow-sm dark:bg-amber-500'
                : 'border-amber-200/80 bg-amber-50/90 text-amber-900 hover:bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15'
            }`}
          >
            <span className="flex w-full flex-row items-center justify-between gap-3 sm:hidden">
              <span className="flex min-w-0 items-center gap-2.5">
                <Users className={`h-5 w-5 shrink-0 ${statusFilter === 'pending' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} aria-hidden />
                <span className={`truncate text-xs font-semibold ${statusFilter === 'pending' ? 'text-amber-50' : 'text-amber-900 dark:text-amber-200'}`}>
                  En attente
                </span>
              </span>
              <span className={`shrink-0 font-display text-2xl font-bold tabular-nums leading-none ${statusFilter === 'pending' ? 'text-white' : 'text-amber-900 dark:text-amber-100'}`}>
                {stats.pendingCount}
              </span>
            </span>
            <span className="hidden w-full flex-col items-center justify-center gap-1 sm:flex">
              <Users className={`h-4 w-4 shrink-0 ${statusFilter === 'pending' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} aria-hidden />
              <span className={`font-display text-xl font-bold tabular-nums leading-none sm:text-2xl ${statusFilter === 'pending' ? 'text-white' : 'text-amber-900 dark:text-amber-100'}`}>
                {stats.pendingCount}
              </span>
              <span className={`text-[10px] font-semibold leading-tight sm:text-[11px] ${statusFilter === 'pending' ? 'text-amber-50' : 'text-amber-800 dark:text-amber-300'}`}>
                En attente
              </span>
            </span>
          </button>
        </div>
        </div>
      </div>

      <div className="animate-fade-in motion-reduce:animate-none space-y-4 sm:space-y-6 md:space-y-8">

      {/* ── Barre d’outils groupée (vue + recherche + filtre) ── */}
      <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200/70 bg-white/70 p-2 dark:border-zinc-800 dark:bg-zinc-900/50 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:p-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {/* Vue */}
          <div
            className="inline-flex shrink-0 rounded-2xl border border-zinc-200/60 bg-zinc-100/90 p-1 dark:border-zinc-700/60 dark:bg-zinc-800/90"
            role="group"
            aria-label="Changer de vue"
          >
            {(['list', 'calendar'] as ViewMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`min-h-[44px] rounded-[10px] px-4 text-xs font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 sm:min-h-9 sm:px-3 ${
                  viewMode === m
                    ? 'border border-zinc-200/80 bg-white text-zinc-900 shadow-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                {m === 'list' ? 'Liste' : 'Planning'}
              </button>
            ))}
          </div>

          {/* Calendrier toggle mobile */}
          <button
            type="button"
            onClick={() => setShowCalendarMobile((v) => !v)}
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 min-h-11 min-w-11 lg:hidden ${
              showCalendarMobile
                ? 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400'
                : 'border-zinc-200/80 bg-white text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
            }`}
          >
            <Calendar className="h-4 w-4" aria-hidden />
            <span className="hidden min-[400px]:inline">Mini cal.</span>
          </button>

          <div className="hidden min-w-2 flex-1 sm:block" />

          {/* Recherche */}
          {showSearch ? (
            <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[min(100%,14rem)]">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Client, service…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-11 rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
                />
              </div>
              <button
                type="button"
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="min-h-11 min-w-11 shrink-0 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors active:scale-[0.98]"
                aria-label="Fermer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-zinc-500 shadow-sm transition-colors hover:text-blue-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-blue-400"
              aria-label="Rechercher un rendez-vous"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtre statut */}
        <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[12rem] sm:max-w-[min(100%,20rem)]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filtrer par statut"
            className="w-full min-h-11 cursor-pointer appearance-none rounded-xl border border-zinc-200/80 bg-white py-2 pl-3 pr-9 text-xs font-semibold text-zinc-700 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
          <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Résumé filtre actif */}
      {activeLabel && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200/70 bg-zinc-50/90 px-3 py-2 dark:border-zinc-700/80 dark:bg-zinc-900/50 sm:px-4">
          <Calendar className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden />
          <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-500">
            {filteredAppointments.length} RDV ·{' '}
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{activeLabel}</span>
          </span>
          <button
            type="button"
            onClick={() => { setSelectedDate(null); setDateRangeChip(null); setStatusFilter('all'); }}
            className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Réinitialiser les filtres"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── LAYOUT ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-5 min-w-0">

        {/* Sidebar calendrier */}
        <aside className={`lg:w-64 xl:w-72 flex-shrink-0 ${showCalendarMobile ? 'block' : 'hidden lg:block'}`}>
          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Calendrier</p>
              <p className="mt-0.5 text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">
                Touche un jour pour filtrer la liste
              </p>
            </div>
            <MiniCalendar
              className="!rounded-none !border-0 !shadow-none bg-transparent dark:!bg-transparent"
              selectedDate={selectedDate}
              onSelectDate={(d) => { setSelectedDate(d); setDateRangeChip(null); setShowCalendarMobile(false); }}
              datesWithAppointments={datesWithAppointments}
              currentMonth={miniCalendarMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={() => { setSelectedDate(toDateStr(new Date())); setMiniCalendarMonth(new Date()); }}
              variant={viewMode === 'calendar' && resolvedTheme === 'dark' ? 'dark' : 'default'}
            />
          </div>
        </aside>

        {/* Zone principale */}
        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
          {viewMode === 'calendar' ? (
            <AppointmentCalendar
              appointments={filteredAppointments}
              clients={clients}
              onSlotClick={onNewAppointment}
              onAppointmentClick={onSelectAppointment}
              onUpdateAppointment={onUpdateAppointment}
            />
          ) : filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
              </div>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">Aucun rendez-vous</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                {dateRangeChip === 'today' ? "Aucun RDV aujourd'hui" : dateRangeChip === 'week' ? 'Aucun RDV cette semaine' : selectedDate ? `Aucun RDV le ${selectedDate}` : 'Vos RDV apparaîtront ici'}
              </p>
              <button
                type="button"
                onClick={onNewAppointment}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                <Plus className="h-4 w-4" aria-hidden /> Nouveau RDV
              </button>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filteredAppointments.map((apt) => {
                  const leftAccent = CARD_LEFT_ACCENT[apt.status] || 'border-l-zinc-300 dark:border-l-zinc-600';
                  const depositDue = needsDepositAttention(apt);
                  return (
                  <button
                    key={apt.id}
                    type="button"
                    onClick={() => onSelectAppointment(apt)}
                    className={`w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 border-l-4 ${leftAccent} rounded-2xl shadow-[0_1px_6px_-2px_rgba(0,0,0,0.08)] hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600 active:scale-[0.99] transition-all duration-150 overflow-hidden touch-manipulation`}
                  >
                    <div className="flex items-center gap-3 p-4">
                      {/* Avatar */}
                      <div className="relative w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm ring-1 ring-zinc-200/60 dark:ring-zinc-600/60">
                        {getAvatar(apt) ? (
                          <img src={getAvatar(apt)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <span className="text-zinc-700 dark:text-zinc-200 font-bold text-base">{apt.clientName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate leading-snug">{apt.clientName}</span>
                          <span className="font-bold text-sky-600 dark:text-sky-400 text-sm tabular-nums shrink-0">{apt.price}€</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">{apt.date}{apt.time ? ` · ${apt.time}` : ''}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${STATUS_STYLES[apt.status] || STATUS_STYLES.completed}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[apt.status] || 'bg-zinc-400'}`} />
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
                      <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 shrink-0 self-center" aria-hidden />
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
                        onClick={(e) => { e.stopPropagation(); downloadICS(apt); }}
                        className="inline-flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-xs font-medium transition-colors active:scale-[0.98]"
                        title="Télécharger le fichier .ics"
                      >
                        <Download className="w-4 h-4 shrink-0" /> .ics
                      </button>
                    </div>
                  </button>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
                <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{filteredAppointments.length} rendez-vous</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Client</th>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Date / Heure</th>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Service</th>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Prix</th>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 w-24" />
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
                            <div className="relative w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                              {getAvatar(apt) ? (
                                <img src={getAvatar(apt)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <span className="text-zinc-700 dark:text-zinc-200 font-semibold text-sm">{apt.clientName.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-zinc-900 dark:text-white">{apt.clientName}</div>
                              {apt.clientEmail && <div className="text-xs text-zinc-500 dark:text-zinc-500">{apt.clientEmail}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">
                            <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                            {apt.date}{apt.time ? ` · ${apt.time}` : ''}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-zinc-700 dark:text-zinc-300 font-medium">{apt.service}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{apt.price}€</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[apt.status] || STATUS_STYLES.completed}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[apt.status] || 'bg-zinc-400'}`} />
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
                                onClick={(e) => { e.stopPropagation(); onUpdateAppointment(apt, { status: 'confirmed' }); }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                                title="Confirmer"
                              >
                                <Check className="w-3 h-3" /> Confirmer
                              </button>
                            )}
                            {apt.status === 'confirmed' && onUpdateAppointment && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onUpdateAppointment(apt, { status: 'completed' }); }}
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
                              onClick={(e) => { e.stopPropagation(); downloadICS(apt); }}
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
            </>
          )}
        </div>
      </div>

      </div>
    </div>
  );
};
