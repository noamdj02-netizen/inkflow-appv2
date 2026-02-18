import React, { useState, useMemo } from 'react';
import { Calendar, Plus, ChevronRight, Search } from 'lucide-react';
import { Appointment } from '../../types';
import { MiniCalendar } from './MiniCalendar';
import { AppointmentCalendar } from './AppointmentCalendar';

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
    <div className="space-y-6">
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
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">Aujourd'hui</span>
              <span className="text-sm font-bold text-neutral-900">{stats.todayCount}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-sm font-medium text-neutral-700">Cette semaine</span>
              <span className="text-sm font-bold text-neutral-900">{stats.weekCount}</span>
            </div>
            {stats.pendingCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200/80">
                <span className="text-sm font-medium text-amber-800">En attente</span>
                <span className="text-sm font-bold text-amber-900">{stats.pendingCount}</span>
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                Liste
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                Calendrier
              </button>
            </div>

            <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
              <div className="relative flex-1 min-w-[140px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="search"
                  placeholder="Client, service…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
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
              className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" /> Nouveau RDV
            </button>
          </div>

          {/* Optional: clear date filter */}
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
            >
              Voir tous les rendez-vous
            </button>
          )}

          {/* Content */}
          {viewMode === 'calendar' ? (
            <AppointmentCalendar
              appointments={filteredAppointments}
              onSlotClick={onNewAppointment}
            />
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                    <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="font-semibold text-neutral-600">Aucun rendez-vous</p>
                    <p className="text-sm text-neutral-400 mt-1">
                      {selectedDate ? `Aucun RDV le ${selectedDate}` : 'Vos RDV apparaîtront ici'}
                    </p>
                  </div>
                ) : (
                  filteredAppointments.map((apt) => (
                    <button
                      key={apt.id}
                      onClick={() => onSelectAppointment(apt)}
                      className="w-full text-left p-4 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-neutral-900 truncate">{apt.clientName}</div>
                          <div className="text-sm text-neutral-500 mt-0.5">{apt.service}</div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 ${
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
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {apt.date} • {apt.time}
                          </span>
                        </div>
                        <span className="font-bold text-base">{apt.price}€</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block rounded-2xl border border-neutral-200 overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Client</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Date / Heure</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Service</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Prix</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Statut</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredAppointments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                            {selectedDate
                              ? `Aucun rendez-vous le ${selectedDate}`
                              : 'Aucun rendez-vous'}
                          </td>
                        </tr>
                      ) : (
                        filteredAppointments.map((apt) => (
                          <tr key={apt.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-neutral-900">{apt.clientName}</div>
                              <div className="text-sm text-neutral-600">{apt.clientEmail}</div>
                            </td>
                            <td className="px-6 py-4 text-neutral-700">
                              {apt.date} • {apt.time}
                            </td>
                            <td className="px-6 py-4 text-neutral-700">{apt.service}</td>
                            <td className="px-6 py-4 font-semibold text-neutral-900">{apt.price}€</td>
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
                            <td className="px-6 py-4">
                              <button
                                onClick={() => onSelectAppointment(apt)}
                                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
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
