import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Inbox, Image, LayoutGrid, Calendar, UserPlus, CreditCard, Clock, ChevronRight, Wallet, Users, DollarSign, TrendingUp, ArrowUpRight, Star, ExternalLink, AlertCircle, CalendarCheck, Phone, MessageCircle, Home, Settings, Zap, Grip, Move, GripVertical, X, Target, Sparkles, BarChart3, Gift, Heart, Award, Percent, Bell, FileText, MapPin, Share2, Check, Loader2, Camera } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RevenueChart } from './RevenueChart';
import { AppointmentDayList } from './AppointmentDayList';
import { getVitrineSlug } from '../../lib/vitrineStorage';
import { getLayoutFromStorage, setLayoutToStorage, DEFAULT_LAYOUT, type DashboardLayout } from '../../lib/dashboardWidgetOrder';
import type { Appointment, Client, FlashDesign, ProjectRequest } from '../../types';
import type { DashboardWidget } from './DashboardWidgets';

/** Image d’en-tête mobile si aucune image vitrine (fichier dans /public) */
const MOBILE_OVERVIEW_HEADER_BG_FALLBACK = '/images/hero-tattoo-artist.png';

/** Composants sortables au niveau module : évite de recréer un type de composant à chaque rendu
 * (React #310 / hooks + @dnd-kit + Framer Motion en prod). */
interface OverviewSortableWidgetProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  canRemove?: boolean;
  isEditMode: boolean;
  onRemoveWidget: (widgetId: string) => void;
}

function OverviewSortableWidget({
  id,
  children,
  className = '',
  canRemove = true,
  isEditMode,
  onRemoveWidget,
}: OverviewSortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !isEditMode,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 80 : 'auto',
  } as const;
  return (
    <div ref={setNodeRef} style={style} className={`relative group min-w-0 ${className}`}>
      {isEditMode && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-lg bg-sky-600 dark:bg-sky-500 text-white cursor-grab active:cursor-grabbing shadow-lg"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemoveWidget(id)}
              className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      <div className={isEditMode ? 'ring-2 ring-blue-500/50 ring-offset-2 dark:ring-offset-zinc-950 rounded-2xl' : ''}>
        {children}
      </div>
    </div>
  );
}

interface OverviewSortableKpiProps {
  id: string;
  children: React.ReactNode;
  canRemove?: boolean;
  isEditMode: boolean;
  onRemoveWidget: (widgetId: string) => void;
  isMdUp: boolean;
}

function OverviewSortableKpi({
  id,
  children,
  canRemove = true,
  isEditMode,
  onRemoveWidget,
  isMdUp,
}: OverviewSortableKpiProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !isEditMode,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 80 : 'auto',
  } as const;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group h-full min-w-0 ${isMdUp ? 'min-h-[130px]' : 'min-h-[120px]'}`}
    >
      {isEditMode && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-lg bg-sky-600 dark:bg-sky-500 text-white cursor-grab active:cursor-grabbing shadow-lg"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemoveWidget(id)}
              className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      <div
        className={`h-full ${isEditMode ? 'ring-2 ring-blue-500/50 ring-offset-2 dark:ring-offset-zinc-950 rounded-2xl' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}

export type TabId = 'overview' | 'analytics' | 'requests' | 'appointments' | 'flash' | 'clients' | 'finance' | 'messaging' | 'portfolio' | 'settings';

export interface DashboardOverviewTabProps {
  now: Date;
  firstName: string;
  user: { studioName?: string; avatar?: string } | null;
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
  monthlyForecast: number;
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
  /** Image de couverture vitrine (Paramètres → Vitrine) ; sinon image par défaut ci-dessus */
  overviewHeaderBgUrl?: string | null;
  /** Clic sur l’avatar mobile : photo de **profil** compte (fichier caché dans DashboardPro) */
  onAvatarClick?: () => void;
  avatarUploading?: boolean;
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
  monthlyForecast,
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
  overviewHeaderBgUrl,
  onAvatarClick,
  avatarUploading = false,
}) => {
  const mobileHeaderBgUrl =
    typeof overviewHeaderBgUrl === 'string' && overviewHeaderBgUrl.trim() !== ''
      ? overviewHeaderBgUrl.trim()
      : MOBILE_OVERVIEW_HEADER_BG_FALLBACK;

  /** Évite les IDs sortables dupliqués (un seul arbre KPI / widgets draggables selon la largeur) */
  const [isMdUp, setIsMdUp] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  );
  const [rightPanelTab, setRightPanelTab] = useState<'clients' | 'deposits'>('clients');
  const [mobileTab, setMobileTab] = useState<'home' | 'calendar' | 'requests' | 'clients' | 'settings'>('home');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [periodRevenue, setPeriodRevenue] = useState<number | null>(null);
  const [periodTrend, setPeriodTrend] = useState<number | null>(null);
  const [layout, setLayout] = useState<DashboardLayout>(() => getLayoutFromStorage());

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setIsMdUp(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
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

  useEffect(() => {
    if (!showWidgetPicker) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showWidgetPicker]);

  // Comparaison mois précédent pour les trends KPI
  const lastMonthStr = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, [now]);
  const currentMonthStr = now.toISOString().slice(0, 7);
  const lastMonthRevenue = useMemo(() =>
    appointments.filter(a => a.date.startsWith(lastMonthStr) && (a.depositPaid || a.status === 'completed'))
      .reduce((s, a) => s + (a.depositPaid ? (a.deposit || 0) : (a.price || 0)), 0),
    [appointments, lastMonthStr]);
  const lastMonthAppointments = useMemo(() =>
    appointments.filter(a => a.date.startsWith(lastMonthStr)).length,
    [appointments, lastMonthStr]);
  const trendRevenue = lastMonthRevenue > 0 ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null;
  const trendAppointments = lastMonthAppointments > 0 ? Math.round(((appointmentsThisMonth - lastMonthAppointments) / lastMonthAppointments) * 100) : null;

  const handlePeriodChange = useCallback((total: number, trend: number | null) => {
    setPeriodRevenue(total);
    setPeriodTrend(trend);
  }, []);

  const AVAILABLE_WIDGETS = useMemo(() => [
    { id: 'kpi-revenue', name: 'Revenu mensuel', icon: DollarSign, color: 'emerald', category: 'kpi', description: 'Affiche le revenu du mois en cours' },
    { id: 'kpi-deposits', name: 'Acomptes', icon: Wallet, color: 'violet', category: 'kpi', description: 'Total des acomptes reçus' },
    { id: 'kpi-clients', name: 'Clients', icon: Users, color: 'blue', category: 'kpi', description: 'Nombre total de clients' },
    { id: 'kpi-appointments', name: 'RDV du mois', icon: Calendar, color: 'orange', category: 'kpi', description: 'Nombre de RDV ce mois' },
    { id: 'revenue-chart', name: 'Graphique revenus', icon: BarChart3, color: 'blue', category: 'main', description: 'Évolution des revenus sur 6 mois' },
    { id: 'appointments-list', name: 'RDV du jour', icon: Calendar, color: 'indigo', category: 'main', description: 'Liste des rendez-vous aujourd\'hui' },
    { id: 'next-client', name: 'Prochain client', icon: UserPlus, color: 'blue', category: 'sidebar', description: 'Carte du prochain client' },
    { id: 'clients-deposits', name: 'Clients / Acomptes', icon: Users, color: 'zinc', category: 'sidebar', description: 'Liste des clients et acomptes récents' },
    { id: 'requests-pending', name: 'Demandes en attente', icon: Inbox, color: 'violet', category: 'sidebar', description: 'Demandes de RDV en attente' },
    { id: 'quick-stats', name: 'Stats rapides', icon: TrendingUp, color: 'emerald', category: 'main', description: 'Statistiques clés du studio' },
    { id: 'upcoming-week', name: 'Semaine à venir', icon: CalendarCheck, color: 'sky', category: 'main', description: 'Aperçu des 7 prochains jours' },
    { id: 'top-services', name: 'Services populaires', icon: Award, color: 'amber', category: 'sidebar', description: 'Vos services les plus demandés' },
    { id: 'goals-progress', name: 'Objectifs', icon: Target, color: 'rose', category: 'sidebar', description: 'Progression vers vos objectifs' },
    { id: 'recent-reviews', name: 'Avis récents', icon: Star, color: 'yellow', category: 'sidebar', description: 'Derniers avis clients' },
    { id: 'flash-promo', name: 'Flash promos', icon: Zap, color: 'amber', category: 'sidebar', description: 'Vos flash designs en promo' },
    { id: 'loyalty-program', name: 'Programme fidélité', icon: Gift, color: 'pink', category: 'sidebar', description: 'Aperçu du programme fidélité' },
  ], []);

  const activeWidgets = useMemo(() => {
    return [...layout.kpiOrder, ...layout.leftColumn, ...layout.rightColumn];
  }, [layout]);

  const availableToAdd = useMemo(() => {
    return AVAILABLE_WIDGETS.filter(w => !activeWidgets.includes(w.id));
  }, [AVAILABLE_WIDGETS, activeWidgets]);

  const handleAddWidget = useCallback((widgetId: string) => {
    const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
    if (!widget) return;

    setLayout(prev => {
      const newLayout = { ...prev };
      if (widget.category === 'kpi') {
        newLayout.kpiOrder = [...prev.kpiOrder, widgetId];
      } else if (widget.category === 'main') {
        newLayout.leftColumn = [...prev.leftColumn, widgetId];
      } else {
        newLayout.rightColumn = [...prev.rightColumn, widgetId];
      }
      setLayoutToStorage(newLayout);
      return newLayout;
    });
    setShowWidgetPicker(false);
  }, [AVAILABLE_WIDGETS]);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setLayout(prev => {
      const newLayout = {
        kpiOrder: prev.kpiOrder.filter(id => id !== widgetId),
        leftColumn: prev.leftColumn.filter(id => id !== widgetId),
        rightColumn: prev.rightColumn.filter(id => id !== widgetId),
      };
      setLayoutToStorage(newLayout);
      return newLayout;
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    
    setLayout(prev => {
      const newLayout = { ...prev };
      
      if (prev.kpiOrder.includes(activeIdStr) && prev.kpiOrder.includes(overIdStr)) {
        const oldIndex = prev.kpiOrder.indexOf(activeIdStr);
        const newIndex = prev.kpiOrder.indexOf(overIdStr);
        newLayout.kpiOrder = arrayMove(prev.kpiOrder, oldIndex, newIndex);
      }
      else if (prev.leftColumn.includes(activeIdStr) && prev.leftColumn.includes(overIdStr)) {
        const oldIndex = prev.leftColumn.indexOf(activeIdStr);
        const newIndex = prev.leftColumn.indexOf(overIdStr);
        newLayout.leftColumn = arrayMove(prev.leftColumn, oldIndex, newIndex);
      }
      else if (prev.rightColumn.includes(activeIdStr) && prev.rightColumn.includes(overIdStr)) {
        const oldIndex = prev.rightColumn.indexOf(activeIdStr);
        const newIndex = prev.rightColumn.indexOf(overIdStr);
        newLayout.rightColumn = arrayMove(prev.rightColumn, oldIndex, newIndex);
      }
      
      setLayoutToStorage(newLayout);
      return newLayout;
    });
  }, []);

  const nextClient = todayAppointments[0] || null;

  const greeting = (() => {
    const h = now.getHours();
    return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  })();

  /** Desktop KPI (inchangé) vs mobile — Human Interface : grouped, plat, Footnote / Title styles */
  const desktopKpiShell =
    'bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] dark:shadow-none border border-zinc-100 dark:border-zinc-800 h-full flex flex-col justify-between min-h-[130px] min-w-0';
  const desktopKpiCaption =
    'text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest shrink-0';
  const desktopKpiIconBtn =
    'w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors flex-shrink-0';
  const iosKpiShell =
    'h-full min-w-0 flex flex-col justify-between rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-4 shadow-sm';
  const iosKpiCaption = 'text-[13px] font-normal text-zinc-500 dark:text-zinc-400 leading-snug pr-1';
  /** Chiffres KPI mobile — rendu type Apple : SF hérité, medium, tabulaires, crénage serré */
  const iosKpiMetricWrap =
    'mt-0.5 inline-flex items-baseline gap-0.5 flex-wrap min-w-0';
  const iosKpiMetricValue =
    'text-[32px] font-medium tabular-nums tracking-[-0.03em] text-zinc-900 dark:text-white leading-none';
  const iosKpiMetricSuffix =
    'text-[15px] font-medium text-zinc-400 dark:text-zinc-500 leading-none tabular-nums select-none';
  const iosKpiIconBtn =
    'shrink-0 w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center active:opacity-60 transition-opacity';

  const renderKpiWidget = (widgetId: string) => {
    switch (widgetId) {

      /* ── Revenue — même thème que les autres cartes ── */
      case 'kpi-revenue':
        return (
          <OverviewSortableKpi key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget} isMdUp={isMdUp}>
            <div className={isMdUp ? desktopKpiShell : iosKpiShell}>
              <div className="flex items-start justify-between gap-2">
                <span className={isMdUp ? desktopKpiCaption : iosKpiCaption}>Revenu du mois</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('finance')}
                  className={isMdUp ? desktopKpiIconBtn : iosKpiIconBtn}
                  aria-label="Finances"
                >
                  <ArrowUpRight
                    className={
                      isMdUp ? 'w-3.5 h-3.5 text-sky-600 dark:text-sky-400' : 'w-4 h-4 text-sky-600 dark:text-sky-400'
                    }
                  />
                </button>
              </div>
              <div className={`min-w-0 flex-1 flex flex-col ${isMdUp ? '' : 'justify-end'}`}>
                <p
                  className={
                    isMdUp
                      ? 'text-2xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight mt-2'
                      : iosKpiMetricWrap
                  }
                >
                  {isMdUp ? (
                    <>{monthlyRevenue.toLocaleString('fr-FR')}€</>
                  ) : (
                    <>
                      <span className={iosKpiMetricValue}>{monthlyRevenue.toLocaleString('fr-FR')}</span>
                      <span className={iosKpiMetricSuffix}>€</span>
                    </>
                  )}
                </p>
                <div className={`${isMdUp ? 'mt-2' : 'mt-1'} flex flex-col gap-1`}>
                  {monthlyForecast > 0 && (
                    isMdUp ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 w-fit">
                        +{monthlyForecast.toLocaleString('fr-FR')}€ en attente
                      </span>
                    ) : (
                      <p className="text-[12px] text-sky-600 dark:text-sky-400">
                        +{monthlyForecast.toLocaleString('fr-FR')}€ prévisionnel
                      </p>
                    )
                  )}
                  <div className="flex items-end min-h-[20px]">
                    {trendRevenue !== null ? (
                      isMdUp ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            trendRevenue >= 0
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {trendRevenue >= 0 ? '↑' : '↓'} {Math.abs(trendRevenue)}% vs mois dernier
                        </span>
                      ) : (
                        <p
                          className={`text-[13px] font-normal ${
                            trendRevenue >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {trendRevenue >= 0 ? '↑' : '↓'} {Math.abs(trendRevenue)}% vs mois dernier
                        </p>
                      )
                    ) : isMdUp ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        Ce mois
                      </span>
                    ) : (
                      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Ce mois</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </OverviewSortableKpi>
        );

      /* ── Acomptes ── */
      case 'kpi-deposits':
        return (
          <OverviewSortableKpi key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget} isMdUp={isMdUp}>
            <div className={isMdUp ? desktopKpiShell : iosKpiShell}>
              <div className="flex items-start justify-between gap-2">
                <span className={isMdUp ? desktopKpiCaption : iosKpiCaption}>Acomptes</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('finance')}
                  className={isMdUp ? desktopKpiIconBtn : iosKpiIconBtn}
                  aria-label="Finances"
                >
                  <ArrowUpRight
                    className={
                      isMdUp
                        ? 'w-3.5 h-3.5 text-violet-600 dark:text-violet-400'
                        : 'w-4 h-4 text-violet-600 dark:text-violet-400'
                    }
                  />
                </button>
              </div>
              <div className={`min-w-0 flex-1 flex flex-col ${isMdUp ? '' : 'justify-end'}`}>
                <p
                  className={
                    isMdUp
                      ? 'text-2xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight mt-2'
                      : iosKpiMetricWrap
                  }
                >
                  {isMdUp ? (
                    <>{pendingDeposits.toLocaleString('fr-FR')}€</>
                  ) : (
                    <>
                      <span className={iosKpiMetricValue}>{pendingDeposits.toLocaleString('fr-FR')}</span>
                      <span className={iosKpiMetricSuffix}>€</span>
                    </>
                  )}
                </p>
                {isMdUp ? (
                  <div className="mt-2 min-h-[24px] flex items-end">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300">
                      En attente
                    </span>
                  </div>
                ) : (
                  <p className="text-[13px] text-violet-600 dark:text-violet-400 mt-1">En attente</p>
                )}
              </div>
            </div>
          </OverviewSortableKpi>
        );

      /* ── Clients ── */
      case 'kpi-clients':
        return (
          <OverviewSortableKpi key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget} isMdUp={isMdUp}>
            <div className={isMdUp ? desktopKpiShell : iosKpiShell}>
              <div className="flex items-start justify-between gap-2">
                <span className={isMdUp ? desktopKpiCaption : iosKpiCaption}>Clients</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('clients')}
                  className={isMdUp ? desktopKpiIconBtn : iosKpiIconBtn}
                  aria-label="Clients"
                >
                  <ArrowUpRight
                    className={
                      isMdUp
                        ? 'w-3.5 h-3.5 text-amber-600 dark:text-amber-400'
                        : 'w-4 h-4 text-amber-600 dark:text-amber-400'
                    }
                  />
                </button>
              </div>
              <div className={`min-w-0 flex-1 flex flex-col ${isMdUp ? '' : 'justify-end'}`}>
                <p
                  className={
                    isMdUp
                      ? 'text-2xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight mt-2'
                      : iosKpiMetricWrap
                  }
                >
                  {isMdUp ? (
                    clients.length
                  ) : (
                    <span className={iosKpiMetricValue}>{clients.length}</span>
                  )}
                </p>
                {vipClients > 0 ? (
                  isMdUp ? (
                    <div className="mt-2 min-h-[24px] flex items-end">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300">
                        ⭐ {vipClients} VIP
                      </span>
                    </div>
                  ) : (
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                      {vipClients} VIP
                    </p>
                  )
                ) : isMdUp ? (
                  <div className="mt-2 min-h-[24px] flex items-end">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300">
                      Total
                    </span>
                  </div>
                ) : (
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1">Total</p>
                )}
              </div>
            </div>
          </OverviewSortableKpi>
        );

      /* ── RDV ── */
      case 'kpi-appointments':
        return (
          <OverviewSortableKpi key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget} isMdUp={isMdUp}>
            <div className={isMdUp ? desktopKpiShell : iosKpiShell}>
              <div className="flex items-start justify-between gap-2">
                <span className={isMdUp ? desktopKpiCaption : iosKpiCaption}>RDV ce mois</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('appointments')}
                  className={isMdUp ? desktopKpiIconBtn : iosKpiIconBtn}
                  aria-label="Agenda"
                >
                  <ArrowUpRight
                    className={
                      isMdUp
                        ? 'w-3.5 h-3.5 text-teal-600 dark:text-teal-400'
                        : 'w-4 h-4 text-teal-600 dark:text-teal-400'
                    }
                  />
                </button>
              </div>
              <div className={`min-w-0 flex-1 flex flex-col ${isMdUp ? '' : 'justify-end'}`}>
                <p
                  className={
                    isMdUp
                      ? 'text-2xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight mt-2'
                      : iosKpiMetricWrap
                  }
                >
                  {isMdUp ? (
                    appointmentsThisMonth
                  ) : (
                    <span className={iosKpiMetricValue}>{appointmentsThisMonth}</span>
                  )}
                </p>
                <div className={`${isMdUp ? 'mt-2 min-h-[24px]' : 'mt-1 min-h-[20px]'} flex items-end`}>
                  {trendAppointments !== null ? (
                    isMdUp ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          trendAppointments >= 0
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {trendAppointments >= 0 ? '↑' : '↓'} {Math.abs(trendAppointments)}% vs dernier mois
                      </span>
                    ) : (
                      <p
                        className={`text-[13px] font-normal ${
                          trendAppointments >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {trendAppointments >= 0 ? '↑' : '↓'} {Math.abs(trendAppointments)}% vs mois dernier
                      </p>
                    )
                  ) : isMdUp ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 dark:bg-orange-500/15 text-orange-800 dark:text-orange-300">
                      Ce mois
                    </span>
                  ) : (
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Ce mois</p>
                  )}
                </div>
              </div>
            </div>
          </OverviewSortableKpi>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {/* =====================================================
          MOBILE LAYOUT — monté uniquement si !isMdUp pour éviter les IDs @dnd-kit dupliqués
          (un seul arbre sortable actif dans le DndContext).
          ===================================================== */}
      {!isMdUp && (
      <div className="min-h-screen max-w-full overflow-x-hidden bg-[#F2F2F7] dark:bg-black pb-[calc(7rem+env(safe-area-inset-bottom,0px))] antialiased [-webkit-font-smoothing:antialiased] [font-family:system-ui,-apple-system,'SF_Pro_Text','Segoe_UI',sans-serif]">
        
        {/* iOS Large Title Header */}
        <div className="px-3 min-[400px]:px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2.5 sm:pt-6 sm:pb-3 safe-top">
          <div className="relative rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-md min-h-[128px] sm:min-h-[140px]">
            {/* Image de fond = couverture vitrine (pas l’avatar compte) */}
            <div
              className="absolute inset-0 bg-cover bg-center scale-105"
              style={{ backgroundImage: `url(${mobileHeaderBgUrl})` }}
              aria-hidden
            />
            {/* Voile pour lisibilité du texte */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/65 dark:from-black/55 dark:via-black/45 dark:to-black/75"
              aria-hidden
            />
            <div className="relative z-10 p-3 pt-4 pb-3 min-[400px]:p-4 min-[400px]:pt-5 min-[400px]:pb-4">
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-[12px] min-[400px]:text-[13px] font-medium text-white/80 mb-0.5 capitalize drop-shadow-sm line-clamp-2">
            {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
                  <h1 className="text-[clamp(1.375rem,5.8vw,1.875rem)] sm:text-[28px] font-bold tracking-tight text-white leading-[1.15] font-display [text-shadow:0_2px_12px_rgba(0,0,0,0.35)]">
                    {greeting}{firstName ? `,` : ''}
                    <br />
                    {firstName || ''}
          </h1>
                  {user?.studioName && (
                    <p className="text-sm font-medium text-white/85 mt-1 truncate [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]">
                      {user.studioName}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onAvatarClick) onAvatarClick();
                    else setActiveTab('settings');
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  disabled={avatarUploading}
                  className="relative mt-0.5 w-11 h-11 min-[400px]:w-12 min-[400px]:h-12 rounded-2xl flex-shrink-0 overflow-hidden shadow-lg ring-2 ring-white/40 active:scale-95 transition-transform touch-manipulation disabled:opacity-70"
                  aria-label={onAvatarClick ? 'Changer la photo de profil (compte)' : 'Paramètres'}
                  title={onAvatarClick ? 'Photo de profil — pas la bannière' : undefined}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      {onAvatarClick ? (
                        <Camera className="w-5 h-5 text-white/90" strokeWidth={2} aria-hidden />
                      ) : (
                        <span className="text-lg font-bold text-white">
                          {firstName ? firstName[0].toUpperCase() : '?'}
                        </span>
                      )}
                    </div>
                  )}
                  {avatarUploading && (
                    <span className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" aria-hidden />
                    </span>
                  )}
                </button>
        </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveTab('appointments');
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="mt-2 flex w-fit items-center gap-1.5 rounded-xl bg-white/15 backdrop-blur-sm px-2.5 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/25 active:scale-[0.98] transition-all touch-manipulation"
                aria-label={`${todayAppointments.length} rendez-vous aujourd’hui, ouvrir l’agenda`}
              >
                <Calendar className="w-3.5 h-3.5 opacity-95 shrink-0" strokeWidth={2} aria-hidden />
                <span className="tabular-nums">{todayAppointments.length}</span>
                <span className="font-medium text-white/90">RDV aujourd’hui</span>
              </button>

              {(unpaidCount > 0 || todayOrTomorrowCount > 0) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {unpaidCount > 0 && (
          <button
                      type="button"
                      onClick={() => setActiveTab('requests')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/95 text-amber-950 text-xs font-semibold whitespace-nowrap active:scale-95 transition-transform shadow-sm"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      {unpaidCount} sans acompte
                    </button>
                  )}
                  {todayOrTomorrowCount > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-400/95 text-white text-xs font-semibold whitespace-nowrap shadow-sm">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      {todayOrTomorrowCount} RDV bientôt
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions rapides — grille 4 colonnes, tactile + très petits écrans */}
        <div className="px-3 min-[400px]:px-4 pt-2 pb-1 sm:pt-3">
          <div className="grid grid-cols-4 gap-1.5 min-[400px]:gap-2 min-w-0">
            <button
              type="button"
            onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }}
              className="flex min-w-0 flex-col items-center gap-0.5 min-[400px]:gap-1 py-2 min-[400px]:py-2.5 px-0.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm active:scale-[0.98] active:opacity-90 transition-all touch-manipulation"
          >
              <Plus className="w-[1.125rem] h-[1.125rem] min-[400px]:w-5 min-[400px]:h-5 text-sky-600 dark:text-sky-400 shrink-0" strokeWidth={2} />
              <span className="text-[9px] min-[400px]:text-[10px] font-medium text-zinc-500 dark:text-zinc-400 text-center leading-tight px-0.5">Nouveau RDV</span>
          </button>
          <button
              type="button"
            onClick={() => setActiveTab('flash')}
              className="flex min-w-0 flex-col items-center gap-0.5 min-[400px]:gap-1 py-2 min-[400px]:py-2.5 px-0.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm active:scale-[0.98] active:opacity-90 transition-all touch-manipulation"
          >
              <Zap className="w-[1.125rem] h-[1.125rem] min-[400px]:w-5 min-[400px]:h-5 text-amber-500 dark:text-amber-400 shrink-0" strokeWidth={2} />
              <span className="text-[9px] min-[400px]:text-[10px] font-medium text-zinc-500 dark:text-zinc-400 text-center leading-tight">Flash</span>
          </button>
            {vitrineSlug ? (
            <a
              href={`/studio/${vitrineSlug}`}
              target="_blank"
              rel="noopener noreferrer"
                className="flex min-w-0 flex-col items-center gap-0.5 min-[400px]:gap-1 py-2 min-[400px]:py-2.5 px-0.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm active:scale-[0.98] active:opacity-90 transition-all touch-manipulation"
            >
                <ExternalLink className="w-[1.125rem] h-[1.125rem] min-[400px]:w-5 min-[400px]:h-5 text-violet-500 dark:text-violet-400 shrink-0" strokeWidth={2} />
                <span className="text-[9px] min-[400px]:text-[10px] font-medium text-zinc-500 dark:text-zinc-400 text-center leading-tight">Vitrine</span>
            </a>
            ) : (
              <div className="flex min-w-0 flex-col items-center gap-0.5 min-[400px]:gap-1 py-2 min-[400px]:py-2.5 px-0.5 rounded-2xl bg-white/60 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800 opacity-45 pointer-events-none">
                <ExternalLink className="w-[1.125rem] h-[1.125rem] min-[400px]:w-5 min-[400px]:h-5 text-zinc-400 shrink-0" strokeWidth={2} />
                <span className="text-[9px] min-[400px]:text-[10px] font-medium text-zinc-400 text-center leading-tight">Vitrine</span>
              </div>
          )}
          <button
              type="button"
            onClick={() => setActiveTab('requests')}
              className="relative flex min-w-0 flex-col items-center gap-0.5 min-[400px]:gap-1 py-2 min-[400px]:py-2.5 px-0.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm active:scale-[0.98] active:opacity-90 transition-all touch-manipulation"
          >
            {pendingRequestsCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-[9px] font-bold flex items-center justify-center tabular-nums leading-none">
                  {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                </span>
            )}
              <Inbox className="w-[1.125rem] h-[1.125rem] min-[400px]:w-5 min-[400px]:h-5 text-zinc-600 dark:text-zinc-300 shrink-0" strokeWidth={2} />
              <span className="text-[9px] min-[400px]:text-[10px] font-medium text-zinc-500 dark:text-zinc-400 text-center leading-tight">Demandes</span>
          </button>
          </div>
        </div>

        {/* Mode widgets — même logique que desktop (KPI réordonnables) */}
        {isEditMode && (
          <div className="px-3 min-[400px]:px-4 mt-2 sm:mt-3 mb-1">
            <div className="bg-sky-50/90 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/50 rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-xl bg-sky-100 dark:bg-sky-900/50 shrink-0">
                  <Move className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-sky-950 dark:text-sky-100">Personnaliser le tableau</p>
                  <p className="text-xs text-sky-800/80 dark:text-sky-300/90 mt-0.5">
                    Glissez les blocs « Ce mois ». Les graphiques et colonnes latérales restent visibles sur grand écran.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowWidgetPicker(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 text-white dark:bg-sky-500 text-xs font-semibold hover:bg-sky-700 dark:hover:bg-sky-400 transition-colors active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter un widget
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors active:scale-[0.98]"
                >
                  Terminer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="px-3 min-[400px]:px-4 space-y-3 sm:space-y-4">
          
          {/* Prochain client — une seule zone cliquable, infos fusionnées (moins de blocs) */}
          {nextClient && (
            <button
              type="button"
              onClick={() => setSelectedAppointment(nextClient)}
              className="w-full rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shadow-sm p-2.5 flex items-center gap-2.5 text-left active:scale-[0.99] transition-transform touch-manipulation min-h-[52px]"
              aria-label={`Ouvrir le rendez-vous de ${nextClient.clientName || 'client'} à ${nextClient.time || ''}`}
            >
              <img
                src={nextClient.clientAvatar || '/images/avatar-client-default.png'}
                alt=""
                className="w-9 h-9 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200/80 dark:border-zinc-700"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{nextClient.clientName}</p>
                  <span className="text-xs font-semibold tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0">{nextClient.time || '--:--'}</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5 leading-snug">
                  {[
                    nextClient.service,
                    nextClient.duration ? `${nextClient.duration} min` : null,
                  ]
                    .filter((x): x is string => Boolean(x))
                    .join(' · ') || 'Tatouage'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" strokeWidth={2} aria-hidden />
            </button>
          )}

          {/* Widget "Actions Requises" — affiché uniquement si demandes en attente */}
          {pendingRequestsCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className="w-full rounded-2xl border border-amber-400/30 dark:border-amber-500/25 bg-amber-50/80 dark:bg-amber-500/10 p-3 flex items-center gap-3 text-left active:scale-[0.99] transition-transform touch-manipulation min-h-[52px]"
              aria-label={`Voir les ${pendingRequestsCount} demande${pendingRequestsCount > 1 ? 's' : ''} en attente`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                <Inbox className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 leading-tight">
                  {pendingRequestsCount} demande{pendingRequestsCount > 1 ? 's' : ''} en attente
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                  Action requise · Répondre maintenant
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" strokeWidth={2} aria-hidden />
            </button>
          )}

          {/* KPIs — grille type widgets iOS */}
          <div>
            <div className="px-0.5 pt-1 pb-2 sm:pb-3 flex flex-col gap-2 min-[380px]:flex-row min-[380px]:items-end min-[380px]:justify-between min-[380px]:gap-3">
              <div className="min-w-0">
                <h2 className="text-xl min-[400px]:text-[22px] font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">Ce mois</h2>
                <p className="text-sm min-[400px]:text-[15px] text-zinc-500 dark:text-zinc-400 mt-0.5">Indicateurs clés</p>
                  </div>
              <div className="flex items-center gap-2 shrink-0 min-[380px]:pb-0.5 self-stretch min-[380px]:self-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditMode((v) => !v)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-sm min-[400px]:text-[15px] font-medium transition-colors active:scale-[0.98] touch-manipulation ${
                    isEditMode
                      ? 'bg-sky-600 text-white dark:bg-sky-500'
                      : 'bg-white dark:bg-[#1C1C1E] text-sky-600 dark:text-sky-400 border border-black/[0.06] dark:border-white/[0.08]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 shrink-0" />
                  {isEditMode ? 'OK' : 'Widgets'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className="text-sm min-[400px]:text-[17px] font-normal text-sky-600 dark:text-sky-400 px-2 py-1.5 min-[400px]:px-1 min-[400px]:py-1 rounded-xl active:opacity-70 touch-manipulation"
                >
                  Tout
                </button>
                </div>
              </div>
            {!isMdUp ? (
              <SortableContext items={layout.kpiOrder} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 gap-2 min-[400px]:gap-3 items-stretch min-w-0 [contain:layout]">
                  {layout.kpiOrder.map((widgetId) => renderKpiWidget(widgetId))}
                  </div>
              </SortableContext>
            ) : null}
          </div>

          {/* Aujourd&apos;hui — groupe iOS */}
          <div className="rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shadow-sm">
            <div className="px-4 py-3 flex items-baseline justify-between border-b border-zinc-200/80 dark:border-zinc-800">
              <span className="text-[22px] font-bold text-zinc-900 dark:text-white">Aujourd&apos;hui</span>
              <span className="text-[15px] text-zinc-500 dark:text-zinc-400 tabular-nums">{todayAppointments.length} RDV</span>
            </div>
            {todayAppointments.length > 0 ? (
              <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                {todayAppointments.slice(0, 4).map((apt) => (
                  <button
                    key={apt.id}
                    type="button"
                    onClick={() => setSelectedAppointment(apt)}
                    className="w-full flex items-center gap-3 px-4 py-3 min-h-[52px] active:bg-zinc-100/80 dark:active:bg-zinc-800/60 transition-colors text-left"
                  >
                    <div className="w-11 text-center flex-shrink-0">
                      <p className="text-[17px] font-semibold text-zinc-900 dark:text-white tabular-nums leading-none">{apt.time?.split(':')[0]}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">:{apt.time?.split(':')[1] || '00'}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[17px] font-normal text-zinc-900 dark:text-white truncate">{apt.clientName}</p>
                      <p className="text-[15px] text-zinc-500 dark:text-zinc-400 truncate">{apt.service || 'Tatouage'}</p>
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
            <div className="rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shadow-sm">
              <div className="px-4 py-3 flex items-baseline justify-between border-b border-zinc-200/80 dark:border-zinc-800">
                <span className="text-[22px] font-bold text-zinc-900 dark:text-white">À venir</span>
                <button 
                  type="button"
                  onClick={() => setActiveTab('appointments')}
                  className="text-[17px] font-normal text-sky-600 dark:text-sky-400"
                >
                  Tout
                </button>
              </div>
              <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                {upcomingAppointments.slice(0, 3).map(apt => (
                  <button
                    key={apt.id}
                    type="button"
                    onClick={() => setSelectedAppointment(apt)}
                    className="w-full flex items-center gap-3 px-4 py-3 min-h-[48px] active:bg-zinc-100/80 dark:active:bg-zinc-800/60 transition-colors text-left"
                  >
                    <span className="text-[15px] text-zinc-500 dark:text-zinc-400 min-w-[3.25rem] tabular-nums">
                      {new Date(apt.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[17px] font-normal text-zinc-900 dark:text-white truncate flex-1">{apt.clientName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      apt.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}
                    >
                      {apt.status === 'confirmed' ? '✓' : '?'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Top clients */}
          <div className="rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shadow-sm">
            <div className="px-4 py-3 flex items-baseline justify-between border-b border-zinc-200/80 dark:border-zinc-800">
              <span className="text-[22px] font-bold text-zinc-900 dark:text-white">Top clients</span>
              <button 
                type="button"
                onClick={() => setActiveTab('clients')}
                className="text-[17px] font-normal text-sky-600 dark:text-sky-400"
              >
                Tout
              </button>
            </div>
            {topClients.length > 0 ? (
              <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                {topClients.slice(0, 4).map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setActiveTab('clients')}
                    className="w-full flex items-center gap-3 px-4 py-3 min-h-[52px] active:bg-zinc-100/80 dark:active:bg-zinc-800/60 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-200/80 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {client.avatar ? (
                        <img src={client.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-zinc-600 dark:text-zinc-300 text-sm font-semibold">{client.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[17px] font-normal text-zinc-900 dark:text-white truncate">{client.name}</span>
                        {(client.totalSpent ?? 0) >= 500 && (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400 shrink-0" />
                        )}
                      </div>
                      <span className="text-[15px] text-zinc-500 dark:text-zinc-400">{client.totalSpent}€ dépensés</span>
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
      )}

      {/* =====================================================
          DESKTOP LAYOUT — monté uniquement si isMdUp (pas de doublon d’IDs avec la vue mobile)
          ===================================================== */}
      {isMdUp && (
      <div className="min-h-full bg-zinc-50/30 dark:bg-black isolate">

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

            {/* Right: Action Buttons — pill style */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.98] ${
                  isEditMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                {isEditMode ? 'Terminer' : 'Widgets'}
              </button>

              {/* Séparateur */}
              <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />

              <button
                onClick={() => setActiveTab('flash')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Image className="w-3.5 h-3.5" /> Flash
              </button>
              {vitrineSlug && (
                <a
                  href={`/studio/${vitrineSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Vitrine
                </a>
              )}
              <button
                onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-all active:scale-[0.98] shadow-md"
              >
                <Plus className="w-4 h-4" /> Nouveau RDV
              </button>
            </div>
          </div>
        </div>

        {/* Edit Mode Banner */}
        {isEditMode && (
          <div className="px-5 sm:px-8 lg:px-10 mb-4">
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:gap-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/20 shrink-0">
                    <Move className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Mode personnalisation</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Glissez les widgets ou ajoutez-en de nouveaux</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWidgetPicker(true)}
                  className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 shrink-0 w-full min-[520px]:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un widget
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors shrink-0 w-full sm:w-auto"
              >
                Terminer
              </button>
            </div>
          </div>
        )}

        {/* ===== MAIN GRID ===== */}
        <div className="px-5 sm:px-8 lg:px-10 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start [contain:layout]">
            
            {/* ====== LEFT COLUMN (8/12) ====== */}
            <div className="lg:col-span-8 space-y-6 min-w-0">
              
              {/* KPI Row — Sortable */}
              <SortableContext items={layout.kpiOrder} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 items-stretch min-w-0">
                  {layout.kpiOrder.map(widgetId => renderKpiWidget(widgetId))}
                    </div>
              </SortableContext>

              {/* Left Column Widgets — Sortable */}
              <SortableContext items={layout.leftColumn} strategy={verticalListSortingStrategy}>
                <div className="space-y-6">
                  {layout.leftColumn.map(widgetId => {
                    if (widgetId === 'revenue-chart') {
                      return (
                        <OverviewSortableWidget key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget}>
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Évolution du revenu</p>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                                    {(periodRevenue ?? totalRevenue).toLocaleString('fr-FR')}€
                                  </p>
                                  {periodTrend !== null && (
                                    <span className={`text-sm font-semibold ${periodTrend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                      {periodTrend >= 0 ? '+' : ''}{periodTrend}%
                                    </span>
                                  )}
                                </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('finance')} 
                    className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Détails <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                            <RevenueChart appointments={appointments} totalRevenue={totalRevenue} onPeriodChange={handlePeriodChange} />
              </div>
                        </OverviewSortableWidget>
                      );
                    }
                    if (widgetId === 'appointments-list') {
                      return (
                        <OverviewSortableWidget key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget}>
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
                                  {todayAppointments.map((apt) => (
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
                        </OverviewSortableWidget>
                      );
                    }
                    
                    if (widgetId === 'quick-stats') {
                      const confirmedApts = appointments.filter(a => a.status === 'confirmed').length;
                      const pendingApts = appointments.filter(a => a.status === 'pending').length;
                      const avgPrice = appointments.length > 0 
                        ? Math.round(appointments.reduce((sum, a) => sum + (a.price || 0), 0) / appointments.length)
                        : 0;
                      
                      return (
                        <OverviewSortableWidget key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget}>
                          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center justify-between mb-5">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Stats rapides</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{confirmedApts}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Confirmés</p>
                              </div>
                              <div className="text-center p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10">
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingApts}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">En attente</p>
                              </div>
                              <div className="text-center p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10">
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{avgPrice}€</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Prix moy.</p>
                              </div>
                            </div>
                          </div>
                        </OverviewSortableWidget>
                      );
                    }

                    if (widgetId === 'upcoming-week') {
                      const next7Days = Array.from({ length: 7 }, (_, i) => {
                        const date = new Date(now);
                        date.setDate(date.getDate() + i);
                        const dateStr = date.toISOString().slice(0, 10);
                        const dayApts = appointments.filter(a => a.date === dateStr);
                        return {
                          date: dateStr,
                          dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
                          dayNum: date.getDate(),
                          count: dayApts.length,
                          revenue: dayApts.reduce((sum, a) => sum + (a.price || 0), 0),
                        };
                      });

                      return (
                        <OverviewSortableWidget key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget}>
                          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center justify-between mb-5">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-500/20">
                                  <CalendarCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                                </div>
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white">7 prochains jours</p>
                              </div>
                              <button 
                                onClick={() => setActiveTab('appointments')}
                                className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                              >
                                Voir tout
                              </button>
                            </div>
                            <div className="flex gap-2">
                              {next7Days.map((day, i) => (
                                <div 
                                  key={day.date}
                                  className={`flex-1 text-center p-3 rounded-xl transition-colors ${
                                    i === 0 
                                      ? 'bg-blue-600 text-white' 
                                      : day.count > 0 
                                        ? 'bg-zinc-100 dark:bg-zinc-800' 
                                        : 'bg-zinc-50 dark:bg-zinc-800/50'
                                  }`}
                                >
                                  <p className={`text-[10px] uppercase font-semibold ${i === 0 ? 'text-white/70' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                    {day.dayName}
                                  </p>
                                  <p className={`text-lg font-bold ${i === 0 ? '' : 'text-zinc-900 dark:text-white'}`}>
                                    {day.dayNum}
                                  </p>
                                  {day.count > 0 && (
                                    <p className={`text-[10px] font-semibold mt-1 ${i === 0 ? 'text-white/80' : 'text-blue-600 dark:text-blue-400'}`}>
                                      {day.count} RDV
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </OverviewSortableWidget>
                      );
                    }

                    return null;
                  })}
                </div>
              </SortableContext>
            </div>

            {/* ====== RIGHT COLUMN (4/12) ====== */}
            <SortableContext items={layout.rightColumn} strategy={verticalListSortingStrategy}>
            <div className="lg:col-span-4 space-y-6 min-w-0">
              {layout.rightColumn.map(widgetId => {
                if (widgetId === 'next-client') {
                  return nextClient ? (
                    <OverviewSortableWidget key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget}>
                <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 rounded-3xl p-6 text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden">
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
                                {nextClient.duration && <span className="flex items-center gap-1 text-white/70"><Clock className="w-3 h-3" /> {nextClient.duration}min</span>}
                                {nextClient.price && <span className="font-bold text-white">{nextClient.price}€</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedAppointment(nextClient)} className="flex-1 px-5 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-black/10 active:scale-[0.98]">Voir le RDV</button>
                            <button onClick={() => { setSelectedAppointment(nextClient); setActiveTab('messaging'); }} className="p-3.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 transition-colors" title="Envoyer un message"><MessageCircle className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
                    </OverviewSortableWidget>
              ) : (
                    <OverviewSortableWidget key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget}>
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] text-center">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4"><Calendar className="w-6 h-6 text-zinc-400" /></div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Pas de RDV aujourd'hui</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Profitez de votre journée libre !</p>
                </div>
                    </OverviewSortableWidget>
                  );
                }

                if (widgetId === 'clients-deposits') {
                  return (
                    <OverviewSortableWidget key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget}>
              <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-5 pt-5 pb-0">
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                            <button onClick={() => setRightPanelTab('clients')} className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${rightPanelTab === 'clients' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}>Clients</button>
                            <button onClick={() => setRightPanelTab('deposits')} className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${rightPanelTab === 'deposits' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}>Acomptes</button>
                  </div>
                </div>
                <div className="p-5">
                  {rightPanelTab === 'clients' ? (
                    <>
                              <button onClick={() => setActiveTab('clients')} className="w-full flex items-center gap-3 p-3 mb-3 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"><UserPlus className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /></div>
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Nouveau client</span>
                      </button>
                      {topClients.length > 0 ? (
                        <div className="space-y-1">
                          {topClients.slice(0, 5).map((client) => (
                                    <button key={client.id} onClick={() => setActiveTab('clients')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {client.avatar ? <img src={client.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-zinc-600 dark:text-zinc-300 text-sm font-semibold">{client.name?.charAt(0)}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5"><span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{client.name}</span>{(client.totalSpent ?? 0) >= 500 && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}</div>
                                <span className="text-xs text-zinc-500 dark:text-zinc-500">{client.totalSpent}€</span>
                              </div>
                            </button>
                          ))}
                        </div>
                              ) : <p className="text-sm text-zinc-400 text-center py-6">Aucun client</p>}
                    </>
                  ) : (
                    <>
                      {recentDeposits.length > 0 ? (
                        <div className="space-y-2">
                          {recentDeposits.slice(0, 5).map((apt) => (
                                    <button key={apt.id} onClick={() => setSelectedAppointment(apt)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-left">
                                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0"><CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">{apt.clientName || 'Client'}</span>
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">+{apt.deposit}€</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3"><Wallet className="w-5 h-5 text-zinc-400" /></div>
                          <p className="text-sm text-zinc-400">Aucun acompte récent</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="px-5 pb-5">
                          <button onClick={() => setActiveTab(rightPanelTab === 'clients' ? 'clients' : 'finance')} className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Voir tout →</button>
                        </div>
                      </div>
                    </OverviewSortableWidget>
                  );
                }

                if (widgetId === 'requests-pending') {
                  return pendingRequestsCount > 0 ? (
                    <OverviewSortableWidget key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget}>
                      <button onClick={() => !isEditMode && setActiveTab('requests')} className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all text-left group">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-500/10"><Inbox className="w-5 h-5 text-violet-600 dark:text-violet-400" /></div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{pendingRequestsCount} demandes</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">En attente de réponse</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 transition-colors" />
                        </div>
                      </button>
                    </OverviewSortableWidget>
                  ) : (
                    <OverviewSortableWidget key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget}>
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/10"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Aucune demande</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">Tout est à jour !</p>
                          </div>
                        </div>
                      </div>
                    </OverviewSortableWidget>
                  );
                }

                if (widgetId === 'top-services') {
                  const serviceStats = appointments.reduce((acc, apt) => {
                    const service = apt.service || 'Tatouage';
                    acc[service] = (acc[service] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  const topServices = Object.entries(serviceStats)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 3);

                  return (
                    <OverviewSortableWidget key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget}>
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/20">
                            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Services populaires</p>
                        </div>
                        {topServices.length > 0 ? (
                          <div className="space-y-2">
                            {topServices.map(([service, count], i) => (
                              <div key={service} className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                  i === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                                  i === 1 ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300' :
                                  'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                                }`}>{i + 1}</span>
                                <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">{service}</span>
                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{count} RDV</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-400 text-center py-4">Pas encore de données</p>
                        )}
                      </div>
                    </OverviewSortableWidget>
                  );
                }

                if (widgetId === 'goals-progress') {
                  const monthlyGoal = 5000;
                  const progress = Math.min((monthlyRevenue / monthlyGoal) * 100, 100);

                  return (
                    <OverviewSortableWidget key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget}>
                      <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg shadow-rose-500/20">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2.5 rounded-xl bg-white/20">
                            <Target className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-semibold">Objectif mensuel</p>
                        </div>
                        <div className="mb-3">
                          <div className="flex items-end justify-between mb-2">
                            <span className="text-2xl font-bold">{monthlyRevenue.toLocaleString('fr-FR')}€</span>
                            <span className="text-sm text-white/70">/ {monthlyGoal.toLocaleString('fr-FR')}€</span>
                          </div>
                          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-white/70">{Math.round(progress)}% de l'objectif atteint</p>
                      </div>
                    </OverviewSortableWidget>
                  );
                }

                if (widgetId === 'flash-promo') {
                  return (
                    <OverviewSortableWidget key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget}>
                  <button
                        onClick={() => setActiveTab('flash')}
                        className="w-full bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20 text-left group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2.5 rounded-xl bg-white/20">
                            <Zap className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-semibold">Flash Designs</p>
                        </div>
                        <p className="text-2xl font-bold mb-1">{customWidgets.length || 0} designs</p>
                        <p className="text-xs text-white/70">Gérez vos flash disponibles →</p>
                  </button>
                    </OverviewSortableWidget>
                  );
                }

                if (widgetId === 'loyalty-program') {
                  const vipCount = clients.filter(c => (c.totalSpent ?? 0) >= 500).length;

                  return (
                    <OverviewSortableWidget key={widgetId} id={widgetId} isEditMode={isEditMode} onRemoveWidget={handleRemoveWidget}>
                      <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-pink-500/20">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2.5 rounded-xl bg-white/20">
                            <Gift className="w-5 h-5" />
                </div>
                          <p className="text-sm font-semibold">Programme fidélité</p>
              </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-3xl font-bold">{vipCount}</p>
                            <p className="text-xs text-white/70">Clients VIP</p>
                          </div>
                          <div className="flex-1 flex justify-end">
                            <div className="flex -space-x-2">
                              {topClients.slice(0, 3).map((c, i) => (
                                <div key={c.id} className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-sm font-bold">
                                  {c.name?.charAt(0)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </OverviewSortableWidget>
                  );
                }

                return null;
              })}
            </div>
            </SortableContext>
          </div>
        </div>
      </div>
      )}
    </DndContext>

      {/* Widget Picker — portail body : évite le parent motion.div (transform/opacity) qui casse fixed et donne l’effet « transparent / doublons » */}
      {showWidgetPicker &&
        typeof document !== 'undefined' &&
        createPortal(
        <>
          <div
            className="fixed inset-0 bg-black z-[500]"
            aria-hidden
            onClick={() => setShowWidgetPicker(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="widget-picker-title"
            className="fixed inset-x-3 top-[max(1rem,env(safe-area-inset-top))] max-h-[85dvh] sm:inset-x-4 sm:top-1/2 sm:-translate-y-1/2 sm:max-h-[80vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[min(600px,calc(100vw-2rem))] rounded-3xl z-[510] shadow-2xl overflow-hidden flex flex-col bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800"
          >
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="widget-picker-title" className="text-xl font-bold text-zinc-900 dark:text-white">Ajouter un widget</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Personnalisez votre dashboard avec de nouveaux widgets</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWidgetPicker(false)}
                  className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
                    </div>
                    </div>

            <div className="p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">
              {availableToAdd.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Tous les widgets sont actifs</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Vous avez déjà ajouté tous les widgets disponibles</p>
                </div>
              ) : (
                <>
                  {availableToAdd.filter(w => w.category === 'kpi').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Indicateurs clés</h3>
                      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                        {availableToAdd.filter(w => w.category === 'kpi').map(widget => {
                          const Icon = widget.icon;
                          return (
                            <button
                              key={widget.id}
                              type="button"
                              onClick={() => handleAddWidget(widget.id)}
                              className="flex items-start gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left group"
                            >
                              <div className={`p-2.5 rounded-xl bg-${widget.color}-100 dark:bg-${widget.color}-500/20 group-hover:scale-110 transition-transform`}>
                                <Icon className={`w-5 h-5 text-${widget.color}-600 dark:text-${widget.color}-400`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{widget.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{widget.description}</p>
                              </div>
                              <Plus className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {availableToAdd.filter(w => w.category === 'main').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Widgets principaux</h3>
                      <div className="space-y-3">
                        {availableToAdd.filter(w => w.category === 'main').map(widget => {
                          const Icon = widget.icon;
                          return (
                            <button
                              key={widget.id}
                              type="button"
                              onClick={() => handleAddWidget(widget.id)}
                              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left group"
                            >
                              <div className={`p-3 rounded-xl bg-${widget.color}-100 dark:bg-${widget.color}-500/20 group-hover:scale-110 transition-transform`}>
                                <Icon className={`w-6 h-6 text-${widget.color}-600 dark:text-${widget.color}-400`} />
            </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{widget.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{widget.description}</p>
          </div>
                              <Plus className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors" />
                            </button>
                          );
                        })}
        </div>
      </div>
                  )}

                  {availableToAdd.filter(w => w.category === 'sidebar').length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Widgets latéraux</h3>
                      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                        {availableToAdd.filter(w => w.category === 'sidebar').map(widget => {
                          const Icon = widget.icon;
                          return (
                            <button
                              key={widget.id}
                              type="button"
                              onClick={() => handleAddWidget(widget.id)}
                              className="flex items-start gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left group"
                            >
                              <div className={`p-2.5 rounded-xl bg-${widget.color}-100 dark:bg-${widget.color}-500/20 group-hover:scale-110 transition-transform`}>
                                <Icon className={`w-5 h-5 text-${widget.color}-600 dark:text-${widget.color}-400`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{widget.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{widget.description}</p>
                              </div>
                              <Plus className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>,
        document.body
        )}
    </>
  );
};
