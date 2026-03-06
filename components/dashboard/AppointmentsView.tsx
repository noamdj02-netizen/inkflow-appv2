import React, { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Calendar, Plus, ChevronRight, Search, ExternalLink, Download } from 'lucide-react';
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

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  clients = [],
  onNewAppointment,
  onSelectAppointment,
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
    <div className="space-y-6 animate-fade-in">
      {/* Layout: sidebar sombre (calendrier) + zone principale — style calendar.me */}
      <div className="flex flex-col lg:flex-row gap-6">
        <aside
          className={`lg:w-64 flex-shrink-0 order-2 lg:order-1 rounded-2xl overflow-hidden transition-colors ${
            viewMode === 'calendar'
              ? 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800'
              : ''
          }`}
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

        <div className="flex-1 min-w-0 order-1 lg:order-2 space-y-4">
          {/* Carrousel de filtres (chips) — mobile : ScrollView horizontal fluide */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 scrollbar-hide flex-nowrap md:flex-wrap md:overflow-visible md:mx-0">
            <button
              onClick={() => { setDateRangeChip('today'); setSelectedDate(null); setMiniCalendarMonth(new Date()); }}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                dateRangeChip === 'today'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'dashboard-widget-card hover:border-blue-300'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Aujourd'hui</span>
              <span className="font-bold">{stats.todayCount}</span>
            </button>
            <button
              onClick={() => { setDateRangeChip('week'); setSelectedDate(null); }}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                dateRangeChip === 'week'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'dashboard-widget-card hover:border-blue-300'
              }`}
            >
              <span>Cette semaine</span>
              <span className="font-bold">{stats.weekCount}</span>
            </button>
            {stats.pendingCount > 0 && (
              <button
                onClick={() => setStatusFilter('pending')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  statusFilter === 'pending'
                    ? 'bg-zinc-700 dark:bg-zinc-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-500/10 border border-zinc-200 dark:border-zinc-500/20 text-zinc-700 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                <span>En attente</span>
                <span className="font-bold">{stats.pendingCount}</span>
              </button>
            )}
          </div>

          {/* Barre de recherche + filtre — une seule ligne fine (mobile) */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
            <div className="flex gap-2 md:flex-wrap">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border-2 border-[var(--border)] text-[var(--text-primary)] hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                Liste
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border-2 border-[var(--border)] text-[var(--text-primary)] hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                Calendrier
              </button>
            </div>

            {/* Recherche + filtre sur une ligne (mobile compact) */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                <input
                  type="search"
                  placeholder="Client, service…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-dash w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-card)] rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="flex-shrink-0 px-3 py-2 text-sm font-medium rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            {/* Bouton Nouveau RDV — masqué sur mobile (FAB utilisé) */}
            <button
              onClick={onNewAppointment}
              className="btn-primary w-full sm:w-auto hidden md:inline-flex"
            >
              <Plus className="w-5 h-5" /> Nouveau RDV
            </button>
          </div>

          {/* Optional: clear date filter */}
          {(selectedDate || dateRangeChip) && (
            <button
              onClick={() => { setSelectedDate(null); setDateRangeChip(null); }}
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Voir tous les rendez-vous
            </button>
          )}

          {/* Content */}
          {viewMode === 'calendar' ? (
            <AppointmentCalendar
              appointments={filteredAppointments}
              onSlotClick={onNewAppointment}
              onAppointmentClick={onSelectAppointment}
            />
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-4 md:hidden">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl dashboard-widget-card">
                    <Calendar className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3" />
                    <p className="font-semibold text-[var(--text-secondary)]">Aucun rendez-vous</p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">
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
                      className="row-clickable w-full text-left p-5 rounded-2xl dashboard-widget-card cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {getAvatar(apt) ? (
                            <img src={getAvatar(apt)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{apt.clientName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-bold text-[var(--text-primary)] truncate">{apt.clientName}</div>
                          <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{apt.service}</div>
                        </div>
                        <span
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex-shrink-0 ${
                            apt.status === 'cancelled' || apt.status === 'no_show'
                              ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                              : apt.status === 'pending'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                                : apt.status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                  : apt.status === 'completed'
                                    ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400'
                                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400'
                          }`}
                        >
                          {STATUS_LABELS[apt.status] ?? apt.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                          <span>{apt.date} • {apt.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={getGoogleCalendarAddUrl(apt)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors touch-target"
                            title="Google Agenda"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); downloadICS(apt); }}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors touch-target"
                            title=".ics"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-base text-blue-600 dark:text-blue-400 ml-1">{apt.price}€</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block rounded-2xl overflow-hidden dashboard-widget-card">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--bg-hover)] border-b border-[var(--border)]">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">Client</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">Date / Heure</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">Service</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">Prix</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">Statut</th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">Cal</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {filteredAppointments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                            {dateRangeChip === 'today' ? 'Aucun rendez-vous aujourd\'hui' : dateRangeChip === 'week' ? 'Aucun rendez-vous cette semaine' : selectedDate
                              ? `Aucun rendez-vous le ${selectedDate}`
                              : 'Aucun rendez-vous'}
                          </td>
                        </tr>
                      ) : (
                        filteredAppointments.map((apt) => (
                          <tr key={apt.id} className="row-clickable border-b border-[var(--border)] last:border-0">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {getAvatar(apt) ? (
                                    <img src={getAvatar(apt)} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-blue-600 dark:text-blue-400 font-bold">{apt.clientName.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-[var(--text-primary)]">{apt.clientName}</div>
                                  <div className="text-sm text-[var(--text-secondary)]">{apt.clientEmail}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[var(--text-secondary)]">
                              {apt.date} • {apt.time}
                            </td>
                            <td className="px-6 py-4 text-[var(--text-primary)]">{apt.service}</td>
                            <td className="px-6 py-4 font-bold text-blue-600">{apt.price}€</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  apt.status === 'confirmed'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                    : apt.status === 'pending'
                                      ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400'
                                      : apt.status === 'completed'
                                        ? 'bg-neutral-100 text-neutral-600'
                                        : 'bg-neutral-100 text-neutral-500'
                                }`}
                              >
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
                                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Ajouter à Google Agenda"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={(e) => { e.stopPropagation(); downloadICS(apt); }}
                                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                  title="Télécharger .ics (Apple/Outlook)"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => onSelectAppointment(apt)}
                                className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-blue-600 hover:bg-blue-50 transition-colors"
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
