import React, { useMemo, useState } from 'react';
import { Plus, Inbox, Image, LayoutGrid, Calendar, UserPlus, CreditCard, Clock, ChevronRight, Wallet, Users, DollarSign, TrendingUp, ArrowUpRight, Star, ExternalLink, AlertCircle, CalendarCheck, Phone, MessageCircle, Home, Settings, Zap } from 'lucide-react';
import { RevenueChart } from './RevenueChart';
import { AppointmentDayList } from './AppointmentDayList';
import { getVitrineSlug } from '../../lib/vitrineStorage';
import type { Appointment, Client, FlashDesign, ProjectRequest } from '../../types';
import type { DashboardWidget } from './DashboardWidgets';

export type TabId = 'overview' | 'analytics' | 'requests' | 'appointments' | 'flash' | 'clients' | 'finance' | 'messaging' | 'portfolio' | 'settings';

export interface DashboardOverviewTabProps {
  now: Date;
  firstName: string;
  user: { studioName?: string } | null;
  studioSlug?: string | null;
  studioId?: string | null;
  useSupabase?: boolean;
  appointments: Appointment[];
  todayAppointments: Appointment[];
  today: string;
  projectRequests: ProjectRequest[];
  clients: Client[];
  topClients: Client[];
  customWidgets: DashboardWidget[];
  setCustomWidgets: React.Dispatch<React.SetStateAction<DashboardWidget[]>>;
  monthlyRevenue: number;
  totalRevenue: number;
  pendingDeposits: number;
  nextAppointmentIn2h: Appointment | null;
  visibleAlerts: { id: string; type: 'warning' | 'info'; msg: string; cta: string }[];
  setDismissedAlerts: React.Dispatch<React.SetStateAction<Set<string>>>;
  overviewCalendarMonth: Date;
  setOverviewCalendarMonth: React.Dispatch<React.SetStateAction<Date>>;
  nextClientOfDay: Appointment | null;
  setActiveTab: (tab: TabId) => void;
  onAlertNavigate?: (alert: { id: string; type: string }) => void;
  setSelectedAppointment: (apt: Appointment | null) => void;
  onUpdateAppointment?: (apt: Appointment, updates: Partial<Appointment>) => void;
  setShowBookingModal: (show: boolean) => void;
  setSelectedFlash: (f: FlashDesign | null) => void;
  setShowWidgetModal: (show: boolean) => void;
  pendingRequestsCount: number;
  recentDeposits: Appointment[];
}

export const DashboardOverviewTab: React.FC<DashboardOverviewTabProps> = ({
  now,
  firstName,
  user,
  appointments,
  todayAppointments,
  today,
  projectRequests,
  clients,
  topClients,
  customWidgets,
  setCustomWidgets,
  monthlyRevenue,
  totalRevenue,
  pendingDeposits,
  nextAppointmentIn2h,
  visibleAlerts,
  setActiveTab,
  onAlertNavigate,
  setSelectedAppointment,
  onUpdateAppointment,
  setShowBookingModal,
  setSelectedFlash,
  setShowWidgetModal,
  pendingRequestsCount,
  studioSlug,
  studioId,
  useSupabase = false,
  recentDeposits = [],
}) => {
  const vitrineSlug = (studioSlug != null && studioSlug !== '') ? studioSlug : (user?.studioName ? getVitrineSlug(user.studioName) : '');
  const upcomingAppointments = appointments.filter(a => a.date > today && ['pending', 'confirmed'].includes(a.status)).sort((a, b) => a.date.localeCompare(b.date));
  const vipClients = clients.filter(c => (c.totalSpent ?? 0) >= 500).length;
  const appointmentsThisMonth = appointments.filter(a => a.date.startsWith(now.toISOString().slice(0, 7))).length;
  
  const unpaidCount = appointments.filter(a => !a.deposit && a.status !== 'cancelled').length;
  const todayOrTomorrowCount = appointments.filter(a => {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    return (a.date === today || a.date === tomorrowStr) && ['pending', 'confirmed'].includes(a.status);
  }).length;

  const [rightPanelTab, setRightPanelTab] = useState<'clients' | 'deposits'>('clients');
  const [mobileTab, setMobileTab] = useState<'home' | 'calendar' | 'requests' | 'clients' | 'settings'>('home');

  const nextClient = todayAppointments[0] || null;

  const greeting = (() => {
    const h = now.getHours();
    return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  })();

  return (
    <>
      {/* =====================================================
          MOBILE LAYOUT (< md) — iOS Native Style
          ===================================================== */}
      <div className="md:hidden min-h-screen bg-[#F2F2F7] dark:bg-black pb-28">
        
        {/* iOS Large Title Header */}
        <div className="px-4 pt-6 pb-2 safe-top">
          <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-500 mb-1">
            {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-[34px] font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          
          {/* Alert Pills — repositionnées sous le titre */}
          {(unpaidCount > 0 || todayOrTomorrowCount > 0) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {unpaidCount > 0 && (
                <button
                  onClick={() => setActiveTab('requests')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold whitespace-nowrap active:scale-95 transition-transform"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {unpaidCount} sans acompte
                </button>
              )}
              {todayOrTomorrowCount > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-semibold whitespace-nowrap">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  {todayOrTomorrowCount} RDV bientôt
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Action Pills (Horizontal Scroll) */}
        <div className="flex overflow-x-auto gap-2.5 px-4 py-4 no-scrollbar snap-x">
          <button
            onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold whitespace-nowrap snap-start active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" /> Nouveau RDV
          </button>
          <button
            onClick={() => setActiveTab('flash')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-semibold whitespace-nowrap snap-start active:scale-95 transition-transform"
          >
            <Zap className="w-4 h-4" /> Flash
          </button>
          {vitrineSlug && (
            <a
              href={`/studio/${vitrineSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-semibold whitespace-nowrap snap-start active:scale-95 transition-transform"
            >
              <ExternalLink className="w-4 h-4" /> Vitrine
            </a>
          )}
          <button
            onClick={() => setActiveTab('requests')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-semibold whitespace-nowrap snap-start active:scale-95 transition-transform"
          >
            <Inbox className="w-4 h-4" /> Demandes
            {pendingRequestsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{pendingRequestsCount}</span>
            )}
          </button>
        </div>

        {/* Main Content */}
        <div className="px-4 space-y-4">
          
          {/* Next Client Widget — iOS Widget Style */}
          {nextClient && (
            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-[28px] p-5 text-white shadow-lg shadow-blue-500/30 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-x-1/4 -translate-y-1/4" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Prochain client</span>
                  <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-bold">{nextClient.time || '--:--'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <img 
                    src={nextClient.clientAvatar || '/images/avatar-client-default.png'} 
                    alt={nextClient.clientName || 'Client'} 
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold truncate">{nextClient.clientName}</p>
                    <p className="text-sm text-white/80">{nextClient.service || 'Tatouage'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/70">
                      {nextClient.duration && <span><Clock className="w-3 h-3 inline mr-1" />{nextClient.duration}min</span>}
                      {nextClient.price && <span className="font-bold text-white">{nextClient.price}€</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAppointment(nextClient)}
                  className="w-full mt-4 py-3 rounded-2xl bg-white text-blue-600 text-sm font-bold active:scale-[0.98] transition-transform"
                >
                  Voir le RDV
                </button>
              </div>
            </div>
          )}

          {/* KPIs — iOS Card Style (2x2 Grid) */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-500">Revenu</span>
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{monthlyRevenue.toLocaleString('fr-FR')}€</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-500/20">
                    <Wallet className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-500">Acomptes</span>
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{pendingDeposits.toLocaleString('fr-FR')}€</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-500">Clients</span>
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{clients.length}</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-500/20">
                    <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-500">RDV ce mois</span>
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{appointmentsThisMonth}</p>
              </div>
            </div>
          </div>

          {/* Today's Appointments — iOS List Style */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Aujourd'hui</span>
              <span className="text-[13px] font-bold text-zinc-900 dark:text-white">{todayAppointments.length} RDV</span>
            </div>
            {todayAppointments.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {todayAppointments.slice(0, 4).map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => setSelectedAppointment(apt)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800 transition-colors text-left"
                  >
                    <div className="w-11 text-center flex-shrink-0">
                      <p className="text-base font-bold text-zinc-900 dark:text-white tabular-nums">{apt.time?.split(':')[0]}</p>
                      <p className="text-[10px] font-medium text-zinc-400">:{apt.time?.split(':')[1] || '00'}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-zinc-900 dark:text-white truncate">{apt.clientName}</p>
                      <p className="text-[13px] text-zinc-500 truncate">{apt.service || 'Tatouage'}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 pb-4">
                <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <Calendar className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-500">Aucun RDV aujourd'hui</p>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">À venir</span>
                <button 
                  onClick={() => setActiveTab('appointments')}
                  className="text-[13px] font-semibold text-blue-600 dark:text-blue-400"
                >
                  Voir tout
                </button>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {upcomingAppointments.slice(0, 3).map(apt => (
                  <button
                    key={apt.id}
                    onClick={() => setSelectedAppointment(apt)}
                    className="w-full flex items-center gap-3 px-4 py-3 active:bg-zinc-50 dark:active:bg-zinc-800 transition-colors text-left"
                  >
                    <span className="text-[13px] font-semibold text-zinc-400 dark:text-zinc-500 min-w-[3.5rem]">
                      {new Date(apt.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[15px] font-medium text-zinc-900 dark:text-white truncate flex-1">{apt.clientName}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      apt.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                    }`}>
                      {apt.status === 'confirmed' ? '✓' : '?'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Top Clients — iOS List Style */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Top clients</span>
              <button 
                onClick={() => setActiveTab('clients')}
                className="text-[13px] font-semibold text-blue-600 dark:text-blue-400"
              >
                Voir tout
              </button>
            </div>
            {topClients.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {topClients.slice(0, 4).map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setActiveTab('clients')}
                    className="w-full flex items-center gap-3 px-4 py-3 active:bg-zinc-50 dark:active:bg-zinc-800 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {client.avatar ? (
                        <img src={client.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-zinc-600 dark:text-zinc-300 text-sm font-semibold">{client.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15px] font-semibold text-zinc-900 dark:text-white truncate">{client.name}</span>
                        {(client.totalSpent ?? 0) >= 500 && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                      </div>
                      <span className="text-[13px] text-zinc-500">{client.totalSpent}€ dépensés</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 pb-4">
                <p className="text-sm text-zinc-400 text-center py-6">Aucun client</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* =====================================================
          DESKTOP LAYOUT (>= md) — Original Design
          ===================================================== */}
      <div className="hidden md:block min-h-full bg-zinc-50/30 dark:bg-black">

        {/* ===== HEADER — Compact avec alertes en pills ===== */}
        <div className="px-5 sm:px-8 lg:px-10 pt-8 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Left: Greeting + Pills */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-1">
                {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {greeting}{firstName ? `, ${firstName}` : ''}
                </h1>
                {/* Compact Alert Pills */}
                {unpaidCount > 0 && (
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {unpaidCount} sans acompte
                  </button>
                )}
                {todayOrTomorrowCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-medium">
                    <CalendarCheck className="w-3 h-3" />
                    {todayOrTomorrowCount} RDV bientôt
                  </span>
                )}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-[0.98] shadow-lg shadow-zinc-900/10"
              >
                <Plus className="w-4 h-4" /> Nouveau RDV
              </button>
              <button
                onClick={() => setActiveTab('flash')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <Image className="w-4 h-4" /> Flash
              </button>
              {vitrineSlug && (
                <a
                  href={`/studio/${vitrineSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" /> Vitrine
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ===== MAIN GRID ===== */}
        <div className="px-5 sm:px-8 lg:px-10 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* ====== LEFT COLUMN (8/12) ====== */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* KPI Row — Compact */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Revenu</span>
                  </div>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{monthlyRevenue.toLocaleString('fr-FR')}€</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10">
                      <Wallet className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Acomptes</span>
                  </div>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{pendingDeposits.toLocaleString('fr-FR')}€</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Clients</span>
                  </div>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{clients.length}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10">
                      <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">RDV</span>
                  </div>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{appointmentsThisMonth}</p>
                </div>
              </div>

              {/* Revenue Chart — Clean, no grid lines */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Évolution du revenu</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{totalRevenue.toLocaleString('fr-FR')}€</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('finance')} 
                    className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Détails <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <RevenueChart appointments={appointments} totalRevenue={totalRevenue} />
              </div>

              {/* Appointments List — More breathing room */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Aujourd'hui</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white mt-0.5">
                      {todayAppointments.length} rendez-vous
                    </p>
                  </div>
                  <button
                    onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }}
                    className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="px-6 pb-6">
                  {todayAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {todayAppointments.map((apt, idx) => (
                        <button
                          key={apt.id}
                          onClick={() => setSelectedAppointment(apt)}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left group"
                        >
                          <div className="flex-shrink-0 w-12 text-center">
                            <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">{apt.time?.split(':')[0] || '--'}</p>
                            <p className="text-[10px] font-medium text-zinc-400 uppercase">:{apt.time?.split(':')[1] || '00'}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{apt.clientName}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{apt.service || 'Tatouage'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {apt.price && (
                              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 tabular-nums">{apt.price}€</span>
                            )}
                            <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-500 mb-3">Aucun RDV aujourd'hui</p>
                      <button
                        onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }}
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        + Ajouter un RDV
                      </button>
                    </div>
                  )}
                </div>

                {/* Upcoming */}
                {upcomingAppointments.length > 0 && (
                  <div className="px-6 py-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">À venir</span>
                      <button onClick={() => setActiveTab('appointments')} className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                        Voir tout
                      </button>
                    </div>
                    <div className="space-y-2">
                      {upcomingAppointments.slice(0, 3).map(apt => (
                        <button
                          key={apt.id}
                          onClick={() => setSelectedAppointment(apt)}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors text-left"
                        >
                          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 min-w-[3.5rem]">
                            {new Date(apt.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">{apt.clientName}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                            apt.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                          }`}>
                            {apt.status === 'confirmed' ? '✓' : '?'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ====== RIGHT COLUMN (4/12) ====== */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* NEXT CLIENT — Hero Card (Most Important!) */}
              {nextClient ? (
                <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 rounded-3xl p-6 text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden">
                  {/* Decorative elements */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -translate-x-1/3 translate-y-1/3" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70">Prochain client</span>
                      <span className="px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-semibold">{nextClient.time || '--:--'}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <img 
                        src={nextClient.clientAvatar || '/gallery/photo-handsome-unshaven-guy-looks-with-pleasant-expression-directly-camera.jpg'} 
                        alt={nextClient.clientName || 'Client'} 
                        className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border-2 border-white/30 shadow-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xl font-bold truncate mb-1">{nextClient.clientName}</p>
                        <p className="text-sm text-white/70">{nextClient.service || 'Tatouage'}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          {nextClient.duration && (
                            <span className="flex items-center gap-1 text-white/70">
                              <Clock className="w-3 h-3" /> {nextClient.duration}min
                            </span>
                          )}
                          {nextClient.price && (
                            <span className="font-bold text-white">{nextClient.price}€</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedAppointment(nextClient)}
                        className="flex-1 px-5 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-black/10 active:scale-[0.98]"
                      >
                        Voir le RDV
                      </button>
                      <button
                        onClick={() => { setSelectedAppointment(nextClient); setActiveTab('messaging'); }}
                        className="p-3.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 transition-colors"
                        title="Envoyer un message"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] text-center">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-6 h-6 text-zinc-400" />
                  </div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Pas de RDV aujourd'hui</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Profitez de votre journée libre !</p>
                </div>
              )}

              {/* Combined Widget: Clients / Deposits (Tabs) */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
                {/* Tab Header */}
                <div className="px-5 pt-5 pb-0">
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    <button
                      onClick={() => setRightPanelTab('clients')}
                      className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        rightPanelTab === 'clients'
                          ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      Clients
                    </button>
                    <button
                      onClick={() => setRightPanelTab('deposits')}
                      className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        rightPanelTab === 'deposits'
                          ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      Acomptes
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-5">
                  {rightPanelTab === 'clients' ? (
                    <>
                      <button
                        onClick={() => setActiveTab('clients')}
                        className="w-full flex items-center gap-3 p-3 mb-3 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Nouveau client</span>
                      </button>
                      {topClients.length > 0 ? (
                        <div className="space-y-1">
                          {topClients.slice(0, 5).map((client) => (
                            <button
                              key={client.id}
                              onClick={() => setActiveTab('clients')}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                            >
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {client.avatar ? (
                                  <img src={client.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-zinc-600 dark:text-zinc-300 text-sm font-semibold">{client.name?.charAt(0)}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{client.name}</span>
                                  {(client.totalSpent ?? 0) >= 500 && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                </div>
                                <span className="text-xs text-zinc-500 dark:text-zinc-500">{client.totalSpent}€</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-400 text-center py-6">Aucun client</p>
                      )}
                    </>
                  ) : (
                    <>
                      {recentDeposits.length > 0 ? (
                        <div className="space-y-2">
                          {recentDeposits.slice(0, 5).map((apt) => (
                            <button
                              key={apt.id}
                              onClick={() => setSelectedAppointment(apt)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-left"
                            >
                              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">{apt.clientName || 'Client'}</span>
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">+{apt.deposit}€</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                            <Wallet className="w-5 h-5 text-zinc-400" />
                          </div>
                          <p className="text-sm text-zinc-400">Aucun acompte récent</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* View All Link */}
                <div className="px-5 pb-5">
                  <button
                    onClick={() => setActiveTab(rightPanelTab === 'clients' ? 'clients' : 'finance')}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Voir tout →
                  </button>
                </div>
              </div>

              {/* Pending Requests — Compact */}
              {pendingRequestsCount > 0 && (
                <button
                  onClick={() => setActiveTab('requests')}
                  className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-500/10">
                      <Inbox className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{pendingRequestsCount} demandes</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">En attente de réponse</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 transition-colors" />
                  </div>
                </button>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
};
