import React, { useState, useMemo } from 'react';
import { Calendar, Plus, ChevronRight, Search, ExternalLink, Download } from 'lucide-react';
import { Appointment } from '../../types';
import { MiniCalendar } from './MiniCalendar';
import { AppointmentCalendar } from './AppointmentCalendar';
import { downloadICS, getGoogleCalendarAddUrl } from '../../lib/googleCalendar';

type ViewMode = 'list' | 'calendar';
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface AppointmentsViewProps {
  appointments: Appointment[];
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
  onNewAppointment,
  onSelectAppointment,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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
    if (selectedDate) {
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
  }, [appointments, statusFilter, selectedDate, searchQuery]);

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
      {/* Layout: mini calendar left (desktop), content right */}
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            datesWithAppointments={datesWithAppointments}
            currentMonth={miniCalendarMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
          />
        </aside>

        <div className="flex-1 min-w-0 order-1 lg:order-2 space-y-4">
          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl dashboard-widget-card">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary)]">Aujourd'hui</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{stats.todayCount}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl dashboard-widget-card">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Cette semaine</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{stats.weekCount}</span>
            </div>
            {stats.pendingCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80 dark:bg-amber-950/30 dark:border-amber-800/50">
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">En attente</span>
                <span className="text-sm font-bold text-amber-900 dark:text-amber-100">{stats.pendingCount}</span>
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'border-2 border-[var(--border)] text-[var(--text-primary)] hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
              >
                Liste
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  viewMode === 'calendar'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'border-2 border-[var(--border)] text-[var(--text-primary)] hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
              >
                Calendrier
              </button>
            </div>

            <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
              <div className="relative flex-1 min-w-[140px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="search"
                  placeholder="Client, service…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-dash w-full pl-9 pr-4 py-2.5 bg-[var(--bg-card)]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm font-medium bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            <button
              onClick={onNewAppointment}
              className="btn-primary w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" /> Nouveau RDV
            </button>
          </div>

          {/* Optional: clear date filter */}
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
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
              <div className="space-y-3 md:hidden">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl dashboard-widget-card">
                    <Calendar className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3" />
                    <p className="font-semibold text-[var(--text-secondary)]">Aucun rendez-vous</p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">
                      {selectedDate ? `Aucun RDV le ${selectedDate}` : 'Vos RDV apparaîtront ici'}
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
                        <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-lg">
                          {apt.clientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[var(--text-primary)] truncate">{apt.clientName}</div>
                          <div className="text-sm text-[var(--text-secondary)] mt-0.5">{apt.service}</div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 ${
                            apt.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : apt.status === 'pending'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : apt.status === 'completed'
                                  ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          }`}
                        >
                          {STATUS_LABELS[apt.status] ?? apt.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{apt.date} • {apt.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={getGoogleCalendarAddUrl(apt)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Google Agenda"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); downloadICS(apt); }}
                            className="p-1.5 rounded-lg text-violet-500 hover:bg-violet-50 transition-colors"
                            title=".ics"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-indigo-600">{apt.price}€</span>
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
                            {selectedDate
                              ? `Aucun rendez-vous le ${selectedDate}`
                              : 'Aucun rendez-vous'}
                          </td>
                        </tr>
                      ) : (
                        filteredAppointments.map((apt) => (
                          <tr key={apt.id} className="row-clickable border-b border-[var(--border)] last:border-0">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold">
                                  {apt.clientName.charAt(0).toUpperCase()}
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
                            <td className="px-6 py-4 font-bold text-indigo-600">{apt.price}€</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  apt.status === 'confirmed'
                                    ? 'bg-green-100 text-green-700'
                                    : apt.status === 'pending'
                                      ? 'bg-amber-100 text-amber-700'
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
                                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                  title="Télécharger .ics (Apple/Outlook)"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => onSelectAppointment(apt)}
                                className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
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
