import React, { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Calendar, Plus, ChevronRight, Search, ExternalLink, Download, CalendarDays, Clock, Users } from 'lucide-react';
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
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  in_progress: 'En cours',
  no_show: 'Absent',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  completed: 'bg-slate-50 text-slate-600 border border-slate-200/60 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
  cancelled: 'bg-red-50 text-red-600 border border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  no_show: 'bg-red-50 text-red-600 border border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
};

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  clients = [],
  onNewAppointment,
  onSelectAppointment,
  onUpdateAppointment,
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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateRangeChip, setDateRangeChip] = useState<'today' | 'week' | null>(null);
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(() => new Date());

  const datesWithAppointments = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => set.add(a.date));
    return set;
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    let list = appointments;
    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (dateRangeChip === 'today') {
      list = list.filter((a) => a.date === toDateStr(new Date()));
    } else if (dateRangeChip === 'week') {
      const today = toDateStr(new Date());
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      const weekStart = toDateStr(startOfWeek);
      const weekEnd = toDateStr(endOfWeek);
      list = list.filter((a) => a.date >= weekStart && a.date <= weekEnd);
    } else if (selectedDate) {
      list = list.filter((a) => a.date === selectedDate);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.clientName.toLowerCase().includes(q) ||
          a.service.toLowerCase().includes(q) ||
          (a.clientEmail && a.clientEmail.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => {
      const da = `${a.date}T${a.time}`;
      const db = `${b.date}T${b.time}`;
      return da.localeCompare(db);
    });
  }, [appointments, statusFilter, selectedDate, dateRangeChip, searchQuery]);

  const stats = useMemo(() => {
    const today = toDateStr(new Date());
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const todayStart = new Date(`${today}T00:00:00`).getTime();
    const weekEnd = endOfWeek.getTime();

    let todayCount = 0;
    let weekCount = 0;
    appointments.forEach((a) => {
      const t = new Date(`${a.date}T00:00:00`).getTime();
      if (a.date === today) todayCount++;
      if (t >= todayStart && t <= weekEnd && !['cancelled', 'no_show'].includes(a.status)) weekCount++;
    });
    const pendingCount = appointments.filter((a) => a.status === 'pending').length;
    return { todayCount, weekCount, pendingCount };
  }, [appointments]);

  const handlePrevMonth = () => {
    setMiniCalendarMonth((m) => {
      const d = new Date(m);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };
  const handleNextMonth = () => {
    setMiniCalendarMonth((m) => {
      const d = new Date(m);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };
  const handleToday = () => {
    setSelectedDate(toDateStr(new Date()));
    setMiniCalendarMonth(new Date());
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Rendez-vous
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Gérez vos rendez-vous et votre planning
          </p>
        </div>
        <button
          onClick={onNewAppointment}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nouveau RDV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Aujourd'hui</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.todayCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Cette semaine</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.weekCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">En attente</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Layout: sidebar (calendrier) + zone principale */}
      <div className="flex flex-col lg:flex-row gap-6">
        <aside
          data-joyride="demo-rdv-calendrier"
          className="lg:w-72 flex-shrink-0 order-2 lg:order-1 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden"
        >
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={(d) => { setSelectedDate(d); setDateRangeChip(null); }}
            datesWithAppointments={datesWithAppointments}
            currentMonth={miniCalendarMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            variant={viewMode === 'calendar' && resolvedTheme === 'dark' ? 'dark' : 'default'}
          />
        </aside>

        <div className="flex-1 min-w-0 order-1 lg:order-2 space-y-5" data-joyride="demo-rdv-liste">
          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 scrollbar-hide flex-nowrap md:flex-wrap md:overflow-visible md:mx-0">
            <button
              onClick={() => { setDateRangeChip('today'); setSelectedDate(null); setMiniCalendarMonth(new Date()); }}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                dateRangeChip === 'today'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-sm'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Aujourd'hui</span>
              <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${dateRangeChip === 'today' ? 'bg-white/20' : 'bg-slate-100 dark:bg-zinc-800'}`}>{stats.todayCount}</span>
            </button>
            <button
              onClick={() => { setDateRangeChip('week'); setSelectedDate(null); }}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                dateRangeChip === 'week'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-sm'
              }`}
            >
              <span>Cette semaine</span>
              <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${dateRangeChip === 'week' ? 'bg-white/20' : 'bg-slate-100 dark:bg-zinc-800'}`}>{stats.weekCount}</span>
            </button>
            {stats.pendingCount > 0 && (
              <button
                onClick={() => setStatusFilter('pending')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-amber-300 dark:hover:border-amber-500/40 hover:shadow-sm'
                }`}
              >
                <span>En attente</span>
                <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${statusFilter === 'pending' ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'}`}>{stats.pendingCount}</span>
              </button>
            )}
          </div>

          {/* Toolbar: View Toggle + Search + Filter */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* View Mode Pills */}
              <div className="inline-flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'calendar'
                      ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Calendrier
                </button>
              </div>

              {/* Search + Filter */}
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    type="search"
                    placeholder="Rechercher un client, service…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Clear filter button */}
          {(selectedDate || dateRangeChip) && (
            <button
              onClick={() => { setSelectedDate(null); setDateRangeChip(null); }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <span>×</span> Voir tous les rendez-vous
            </button>
          )}

          {/* Content */}
          {viewMode === 'calendar' ? (
            <AppointmentCalendar
              appointments={filteredAppointments}
              onSlotClick={onNewAppointment}
              onAppointmentClick={onSelectAppointment}
              onUpdateAppointment={onUpdateAppointment}
            />
          ) : (
            <>
              {/* Section Title */}
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
                  {filteredAppointments.length} rendez-vous
                </h2>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-zinc-300">Aucun rendez-vous</p>
                    <p className="text-sm text-slate-500 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
                      {dateRangeChip === 'today' ? 'Aucun RDV aujourd\'hui' : dateRangeChip === 'week' ? 'Aucun RDV cette semaine' : selectedDate ? `Aucun RDV le ${selectedDate}` : 'Vos RDV apparaîtront ici'}
                    </p>
                  </div>
                ) : (
                  filteredAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectAppointment(apt)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectAppointment(apt); } }}
                      className="w-full text-left p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/30 cursor-pointer transition-all duration-200 active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                          {getAvatar(apt) ? (
                            <img src={getAvatar(apt)} alt="" className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-lg">{apt.clientName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-semibold text-slate-900 dark:text-white truncate">{apt.clientName}</div>
                          <div className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5 truncate">{apt.service}</div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0 ${STATUS_STYLES[apt.status] || STATUS_STYLES.completed}`}>
                          {STATUS_LABELS[apt.status] ?? apt.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400">
                          <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                          <span>{apt.date} • {apt.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={getGoogleCalendarAddUrl(apt)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            title="Google Agenda"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); downloadICS(apt); }}
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            title=".ics"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-base text-blue-600 dark:text-blue-400 ml-2">{apt.price}€</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-zinc-800">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Date / Heure</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Prix</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Statut</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Export</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                              <Calendar className="w-7 h-7 text-slate-400 dark:text-zinc-500" />
                            </div>
                            <p className="font-medium text-slate-600 dark:text-zinc-400">
                              {dateRangeChip === 'today' ? 'Aucun rendez-vous aujourd\'hui' : dateRangeChip === 'week' ? 'Aucun rendez-vous cette semaine' : selectedDate
                                ? `Aucun rendez-vous le ${selectedDate}`
                                : 'Aucun rendez-vous'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredAppointments.map((apt, index) => (
                          <tr 
                            key={apt.id} 
                            onClick={() => onSelectAppointment(apt)}
                            className={`group cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${
                              index !== filteredAppointments.length - 1 ? 'border-b border-slate-100 dark:border-zinc-800' : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                                  {getAvatar(apt) ? (
                                    <img src={getAvatar(apt)} alt="" className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover" />
                                  ) : (
                                    <span className="text-white font-semibold">{apt.clientName.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white">{apt.clientName}</div>
                                  <div className="text-sm text-slate-500 dark:text-zinc-500">{apt.clientEmail}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                                <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                                <span>{apt.date} • {apt.time}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-700 dark:text-zinc-300 font-medium">{apt.service}</td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-blue-600 dark:text-blue-400">{apt.price}€</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold ${STATUS_STYLES[apt.status] || STATUS_STYLES.completed}`}>
                                {STATUS_LABELS[apt.status] ?? apt.status}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1">
                                <a
                                  href={getGoogleCalendarAddUrl(apt)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                  title="Ajouter à Google Agenda"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={(e) => { e.stopPropagation(); downloadICS(apt); }}
                                  className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                  title="Télécharger .ics (Apple/Outlook)"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); onSelectAppointment(apt); }}
                                className="p-2 rounded-lg text-slate-400 group-hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                aria-label="Voir le détail"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
