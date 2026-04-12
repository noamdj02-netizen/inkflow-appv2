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

  const kpiGridClass =
    stats.pendingCount > 0
      ? 'grid grid-cols-3 gap-2 w-full sm:flex sm:flex-wrap sm:w-auto'
      : 'grid grid-cols-2 gap-2 w-full sm:flex sm:flex-wrap sm:w-auto';

  return (
    <div className="space-y-3 sm:space-y-5 md:space-y-6 animate-fade-in font-sans">

      {/* ── HEADER — mobile: titre + CTA sur une ligne ; KPI en grille pleine largeur (évite le « blanc » à droite) ── */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight min-w-0">
            Rendez-vous
          </h1>
          <button
            type="button"
            onClick={onNewAppointment}
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[40px] px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white dark:bg-blue-500 dark:hover:bg-blue-400 text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/25 dark:shadow-blue-500/20 transition-all active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau RDV</span>
            <span className="sm:hidden">+ RDV</span>
          </button>
        </div>

        {/* Stats — grille = même largeur de colonnes, plus de vide à droite sur téléphone */}
        <div className={kpiGridClass}>
          <button
            type="button"
            onClick={() => { setDateRangeChip('today'); setSelectedDate(null); setMiniCalendarMonth(new Date()); }}
            className={`flex min-w-0 w-full items-center justify-center gap-1.5 sm:gap-2 px-1.5 sm:pl-1 sm:pr-3 min-h-[44px] sm:min-h-[40px] rounded-2xl text-[11px] sm:text-xs font-semibold transition-all active:scale-[0.98] border border-transparent ${
              dateRangeChip === 'today'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm'
                : 'bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/90 dark:hover:bg-zinc-700 border-zinc-200/60 dark:border-zinc-700/80'
            }`}
          >
            <span className="hidden sm:block w-1 self-stretch min-h-[2rem] rounded-full bg-sky-500 shrink-0" aria-hidden />
            <CalendarDays className="w-3.5 h-3.5 shrink-0 opacity-90" />
            <span className="tabular-nums text-center leading-tight">
              <span className="block sm:inline">{stats.todayCount} </span>
              <span className="block text-[10px] font-semibold opacity-90 sm:inline sm:text-xs sm:font-semibold sm:opacity-100">
                <span className="sm:hidden">auj.</span>
                <span className="hidden sm:inline">aujourd&apos;hui</span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => { setDateRangeChip('week'); setSelectedDate(null); }}
            className={`flex min-w-0 w-full items-center justify-center gap-1.5 sm:gap-2 px-1.5 sm:pl-1 sm:pr-3 min-h-[44px] sm:min-h-[40px] rounded-2xl text-[11px] sm:text-xs font-semibold transition-all active:scale-[0.98] border border-transparent ${
              dateRangeChip === 'week'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm'
                : 'bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/90 dark:hover:bg-zinc-700 border-zinc-200/60 dark:border-zinc-700/80'
            }`}
          >
            <span className="hidden sm:block w-1 self-stretch min-h-[2rem] rounded-full bg-zinc-500 dark:bg-zinc-400 shrink-0" aria-hidden />
            <Clock className="w-3.5 h-3.5 shrink-0 opacity-90" />
            <span className="tabular-nums text-center leading-tight">
              <span className="block sm:inline">{stats.weekCount} </span>
              <span className="block text-[10px] font-semibold opacity-90 sm:inline sm:text-xs sm:font-semibold sm:opacity-100">
                <span className="sm:hidden">sem.</span>
                <span className="hidden sm:inline">cette semaine</span>
              </span>
            </span>
          </button>
          {stats.pendingCount > 0 && (
            <button
              type="button"
              onClick={() => { setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending'); setDateRangeChip(null); setSelectedDate(null); }}
              className={`flex min-w-0 w-full items-center justify-center gap-1.5 sm:gap-2 px-1.5 sm:pl-1 sm:pr-3 min-h-[44px] sm:min-h-[40px] rounded-2xl text-[11px] sm:text-xs font-semibold transition-all active:scale-[0.98] border ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50/95 dark:bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-200/70 dark:border-amber-500/25'
              }`}
            >
              <span className="hidden sm:block w-1 self-stretch min-h-[2rem] rounded-full bg-amber-500 shrink-0" aria-hidden />
              <Users className="w-3.5 h-3.5 shrink-0 opacity-90" />
              <span className="tabular-nums text-center leading-tight">
                <span className="block sm:inline">{stats.pendingCount} </span>
                <span className="block text-[10px] font-semibold opacity-90 sm:inline sm:text-xs sm:font-semibold sm:opacity-100">
                  <span className="sm:hidden">att.</span>
                  <span className="hidden sm:inline">en attente</span>
                </span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── TOOLBAR — petit mobile : 2 lignes (filtre pleine largeur) ; sm+ : une ligne ── */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto sm:flex-1">
          {/* Vue */}
          <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
            {(['list', 'calendar'] as ViewMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`min-h-[44px] sm:min-h-9 px-4 sm:px-3 rounded-[10px] text-xs font-semibold transition-all active:scale-[0.98] ${
                  viewMode === m
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-600'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {m === 'list' ? 'Liste' : 'Mois'}
              </button>
            ))}
          </div>

          {/* Calendrier toggle mobile */}
          <button
            type="button"
            onClick={() => setShowCalendarMobile((v) => !v)}
            className={`lg:hidden inline-flex items-center justify-center gap-1.5 min-h-11 min-w-11 px-2 rounded-xl text-xs font-semibold border transition-all active:scale-[0.98] shrink-0 ${
              showCalendarMobile
                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-sm'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden min-[400px]:inline">Calendrier</span>
          </button>

          <div className="flex-1 min-w-2" />

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
                  className="w-full min-h-11 pl-9 pr-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
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
              className="min-h-11 min-w-11 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm active:scale-[0.98] shrink-0"
              aria-label="Rechercher"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtre statut */}
        <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[11rem] sm:max-w-[min(100%,20rem)] sm:flex-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="appearance-none w-full min-h-11 pl-3 pr-9 py-2 text-xs font-semibold rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer transition-all shadow-sm"
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

      {/* Label filtre actif */}
      {activeLabel && (
        <div className="flex items-center gap-2 flex-wrap rounded-xl border border-zinc-200/70 dark:border-zinc-700/80 bg-zinc-50/80 dark:bg-zinc-900/40 px-3 py-1.5 sm:py-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-500 tabular-nums">{filteredAppointments.length} RDV ·</span>
          <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">{activeLabel}</span>
          <button
            type="button"
            onClick={() => { setSelectedDate(null); setDateRangeChip(null); setStatusFilter('all'); }}
            className="ml-auto min-h-11 min-w-11 -mr-1 inline-flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors active:scale-[0.98]"
            aria-label="Réinitialiser les filtres"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── LAYOUT ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-5 min-w-0">

        {/* Sidebar calendrier */}
        <aside className={`lg:w-64 xl:w-72 flex-shrink-0 ${showCalendarMobile ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
            <MiniCalendar
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
              <button onClick={onNewAppointment} className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white dark:bg-blue-500 dark:hover:bg-blue-400 text-sm font-semibold transition-all active:scale-[0.97] shadow-sm shadow-blue-600/25">
                <Plus className="w-4 h-4" /> Nouveau RDV
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
                          <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">{apt.price}€</span>
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
  );
};
