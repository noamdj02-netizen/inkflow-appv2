import React, { useMemo, useState, useCallback, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Plus,
  Inbox,
  LayoutGrid,
  LayoutDashboard,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  Wallet,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Star,
  AlertCircle,
  CalendarCheck,
  Zap,
  Move,
  GripVertical,
  X,
  Target,
  Sparkles,
  BarChart3,
  Gift,
  Award,
  Bell,
  Check,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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
import {
  getLayoutFromStorage,
  setLayoutToStorage,
  type DashboardLayout,
} from '../../lib/dashboardWidgetOrder';
import { useStudioPrivacy, formatEuroPrivacy } from '../../contexts/StudioPrivacyContext';
import { useBreakpointMd } from '../../hooks/useMediaQuery';
import type { Appointment, Booking, Client, FlashDesign, ProjectRequest } from '../../types';
import type { DashboardWidget } from './DashboardWidgets';
import { StudioSetupChecklist } from './StudioSetupChecklist';
import { FirstBookingGoalCard } from './FirstBookingGoalCard';
import { FirstBookingWizard } from './FirstBookingWizard';
import { DashboardOverviewDesktopLayout } from './overview/DashboardOverviewDesktopLayout';
import { DashboardOverviewClientsPanel } from './overview/DashboardOverviewClientsPanel';
import { markOpenInboxAfterDemo, setDemoInboxPreviewActive } from '@/lib/demoInboxPreview';
import { BADGES, BUTTONS, KPI_SHELLS, TYPOGRAPHY } from './DashboardOverviewDesignSystem';
import { IconBox } from '../ui/IconBox';
import { getVitrineShareUrl, LANDING_PRICING_URL } from '../../lib/urls';
import { getVitrineSlug } from '../../lib/vitrineStorage';
import {
  DASHBOARD_OVERVIEW_HERO_ROTATE_MS,
  DASHBOARD_OVERVIEW_HERO_TIPS,
} from '../../lib/dashboardOverviewHeroTips';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  INK_DONUT_DEMANDES,
  INK_DONUT_RDV,
  inkDonutLegendLabel,
  inkDonutLegendValue,
  inkOledCard,
} from '@/lib/inkDesignTokens';
import { supabase } from '../../lib/supabase';
import { createStripeExpressLoginLink } from '../../lib/stripeClient';
import { useToast } from '../../contexts/ToastContext';
import { ClientPhotoAvatar } from '../common/ClientPhotoAvatar';
import { DashboardBentoUnified } from './bento/DashboardBentoUnified';
import { BentoHeroCard } from './bento/BentoHeroCard';
import { BentoPilotageQuickRow } from './bento/BentoPilotageQuickRow';
import { countActiveTodayAppointmentSlots } from './bento/mapper';

const MS_PER_DAY = 86400000;

function getTrialDaysRemaining(trialEndsAt: string | null | undefined): number | null {
  if (!trialEndsAt?.trim()) return null;
  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / MS_PER_DAY);
}

interface OverviewTrialBannerProps {
  message: string;
  onOpenBilling?: () => void;
  className?: string;
}

/** Rappels (acomptes, RDV 24h) — bandeau compact (une rangée, pas de grille 2 lignes) */
function OverviewActivityAlerts({
  alerts,
  setDismissedAlerts,
  onAlertNavigate,
  className = '',
}: {
  alerts: { id: string; type: 'warning' | 'info'; msg: string; cta: string }[];
  setDismissedAlerts: React.Dispatch<React.SetStateAction<Set<string>>>;
  onAlertNavigate?: (alert: { id: string; type: string }) => void;
  className?: string;
}) {
  if (alerts.length === 0) return null;
  return (
    <div
      className={cn('flex flex-col gap-2.5 sm:gap-3', className)}
      role="region"
      aria-label="Rappels et actions rapides"
    >
      {alerts.map((a) => (
        <Alert
          key={a.id}
          variant={a.type === 'warning' ? 'warning' : 'info'}
          role={a.type === 'warning' ? 'alert' : 'status'}
          className="!flex w-full min-w-0 flex-col gap-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
        >
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            {a.type === 'warning' ? (
              <AlertCircle strokeWidth={2} className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <Bell strokeWidth={2} className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <AlertDescription className="m-0 min-w-0 flex-1 p-0 text-sm font-medium leading-snug text-inherit [text-wrap:pretty]">
              {a.msg}
            </AlertDescription>
          </div>
          <div className="flex min-h-9 shrink-0 items-stretch justify-stretch gap-2 sm:min-h-0 sm:items-center sm:justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => onAlertNavigate?.(a)}
              className="h-9 min-h-9 flex-1 sm:flex-none"
            >
              {a.cta}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="shrink-0"
              onClick={() => setDismissedAlerts((prev) => new Set([...prev, a.id]))}
              aria-label="Masquer ce rappel"
            >
              <X className="size-3.5" aria-hidden />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}

function OverviewTrialBanner({ message, onOpenBilling, className }: OverviewTrialBannerProps) {
  return (
    <Card
      className={cn(
        'border-zinc-100 bg-white py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <CardContent className="px-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex min-w-0 items-start gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            <Sparkles
              className="mt-0.5 size-4 shrink-0 text-zinc-500 dark:text-zinc-400"
              aria-hidden
            />
            <span>{message}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="min-h-11">
              <a href={LANDING_PRICING_URL} target="_blank" rel="noopener noreferrer">
                Voir les formules
              </a>
            </Button>
            {onOpenBilling && (
              <Button type="button" variant="outline" onClick={onOpenBilling} className="min-h-11">
                Facturation
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Lignes « Aujourd’hui » — palette CRM neutre (zinc) + accent marque blue */
function getTodayRowTint(status: Appointment['status']) {
  const base = {
    border: '',
    timeBg: 'bg-zinc-100 dark:bg-zinc-800/80',
    hour: 'text-zinc-900 dark:text-zinc-100',
    minute: 'text-zinc-600 dark:text-zinc-400',
  };
  if (status === 'cancelled' || status === 'no_show') {
    return {
      border: '',
      timeBg: 'bg-zinc-100/80 dark:bg-zinc-800/50',
      hour: 'text-zinc-500 dark:text-zinc-500',
      minute: 'text-zinc-500 dark:text-zinc-500',
    };
  }
  if (status === 'pending' || status === 'in_progress') {
    return {
      ...base,
      timeBg: 'bg-zinc-100/90 dark:bg-zinc-900/80',
      hour: 'text-zinc-700 dark:text-zinc-200',
      minute: 'text-zinc-500 dark:text-zinc-400',
    };
  }
  return base;
}

/** Composants sortables au niveau module : évite de recréer un type de composant à chaque rendu
 * (React #310 / hooks + @dnd-kit + Framer Motion en prod). */
interface OverviewSortableWidgetProps {
  key?: React.Key;
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
            className="p-1.5 rounded-lg bg-primary text-primary-foreground cursor-grab active:cursor-grabbing shadow-lg"
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
        className={
          isEditMode
            ? 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background rounded-2xl'
            : ''
        }
      >
        {children}
      </div>
    </div>
  );
}

interface OverviewSortableKpiProps {
  key?: React.Key;
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
      className={`relative group h-full min-w-0 ${isMdUp ? 'min-h-[130px]' : 'min-h-[132px]'}`}
    >
      {isEditMode && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground cursor-grab active:cursor-grabbing shadow-lg"
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
        className={`h-full ${isEditMode ? 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background rounded-2xl' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}

export type TabId =
  | 'overview'
  | 'analytics'
  | 'requests'
  | 'agenda'
  | 'appointments'
  | 'flash'
  | 'clients'
  | 'finance'
  | 'messaging'
  | 'portfolio'
  | 'settings'
  | 'notifications';

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
  /** Compteurs rappels RDV (même logique que les alertes) — affichage compact dans la carte revenu mobile */
  rdvAlertUnpaidCount?: number;
  rdvAlertBientotCount?: number;
  setDismissedAlerts: React.Dispatch<React.SetStateAction<Set<string>>>;
  overviewCalendarMonth: Date;
  setOverviewCalendarMonth: React.Dispatch<React.SetStateAction<Date>>;
  setActiveTab: (tab: TabId) => void;
  onAlertNavigate?: (alert: { id: string; type: string }) => void;
  setSelectedAppointment: (apt: Appointment | null) => void;
  onUpdateAppointment?: (apt: Appointment, updates: Partial<Appointment>) => void;
  setShowBookingModal: (show: boolean) => void;
  setSelectedFlash: (f: FlashDesign | null) => void;
  setShowWidgetModal: (show: boolean) => void;
  /** RDV + vitrine + projets en attente (pastilles / raccourcis) */
  pendingDemandesCount: number;
  recentDeposits: Appointment[];
  /** Image de couverture vitrine (Paramètres → Vitrine) ; sinon image par défaut ci-dessus */
  overviewHeaderBgUrl?: string | null;
  /** Clic sur l’avatar mobile : photo de **profil** compte (fichier caché dans DashboardPro) */
  onAvatarClick?: () => void;
  avatarUploading?: boolean;
  /** Flashs du studio — module « Flash du jour » (aperçu + lien vitrine) */
  flashDesigns?: FlashDesign[];
  /** Checklist onboarding : navigation vers vitrine / flash / agenda */
  onSetupNavigate?: (
    target:
      | 'settings-vitrine'
      | 'settings-availability'
      | 'settings-payments'
      | 'flash'
      | 'appointments'
  ) => void;
  /** false = étape « Disponibilités » dans la checklist ; undefined = chargement ou mode local */
  availabilitySetupComplete?: boolean;
  /** false = étape « Paiements / Stripe » ; undefined = chargement ou mode local */
  paymentsSetupComplete?: boolean;
  /** Statut abonnement studio (Supabase) — bandeau essai si `trialing` */
  studioSubscriptionStatus?: string | null;
  /** Fin d’essai ISO — jours restants affichés dans le bandeau */
  trialEndsAt?: string | null;
  /** Ouvre Paramètres → Facturation (Stripe / plan) */
  onOpenBilling?: () => void;
  /** `true` quand le bandeau héros (DashboardPro) porte le titre de page « Vue d’ensemble » (md+) — le salut desktop passe en `h2` pour l’accessibilité */
  pageTitleInShell?: boolean;
  /** Réservations vitrine — objectif « première résa ». */
  bookings?: Booking[];
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
  setCustomWidgets: _setCustomWidgets,
  monthlyRevenue,
  monthlyForecast,
  totalRevenue,
  pendingDeposits,
  nextAppointmentIn2h: _nextAppointmentIn2h,
  visibleAlerts,
  rdvAlertUnpaidCount = 0,
  rdvAlertBientotCount = 0,
  setDismissedAlerts: _setDismissedAlerts,
  setActiveTab,
  onAlertNavigate,
  setSelectedAppointment,
  onUpdateAppointment: _onUpdateAppointment,
  setShowBookingModal,
  setSelectedFlash,
  setShowWidgetModal: _setShowWidgetModal,
  pendingDemandesCount,
  studioSlug,
  studioId,
  useSupabase = false,
  recentDeposits = [],
  overviewHeaderBgUrl = null,
  onAvatarClick,
  avatarUploading = false,
  flashDesigns = [],
  onSetupNavigate,
  availabilitySetupComplete,
  paymentsSetupComplete,
  studioSubscriptionStatus,
  trialEndsAt,
  onOpenBilling,
  pageTitleInShell: _pageTitleInShell = false,
  bookings = [],
}) => {
  const { privacyMode } = useStudioPrivacy();
  const [firstBookingWizardOpen, setFirstBookingWizardOpen] = useState(false);
  const pilotageWaveGradId = useId();
  const euro = (n: number) => formatEuroPrivacy(n, privacyMode);
  const prefersReducedMotion = useReducedMotion();
  /**
   * Ressort type UIKit (premium-frontend, transform/opacity seulement).
   * L’opacité de l’onglet reste côté DashboardPro — variation locale légère ici.
   */
  const iosSpring = useCallback(
    (delay: number) =>
      prefersReducedMotion
        ? { initial: false, animate: { y: 0, opacity: 1 }, transition: { duration: 0 } }
        : {
            initial: { y: 16, opacity: 0.9 },
            animate: { y: 0, opacity: 1 },
            transition: {
              type: 'spring' as const,
              stiffness: 400,
              damping: 32,
              mass: 0.86,
              delay,
            },
          },
    [prefersReducedMotion]
  );

  const mobileStackVariants = useMemo(
    () => ({
      hidden: {},
      visible: prefersReducedMotion
        ? { transition: { duration: 0 } }
        : { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
    }),
    [prefersReducedMotion]
  );

  const mobileSectionVariants = useMemo(
    () => ({
      hidden: prefersReducedMotion ? { y: 0, opacity: 1 } : { y: 10, opacity: 0.92 },
      visible: prefersReducedMotion
        ? { y: 0, opacity: 1, transition: { duration: 0 } }
        : {
            y: 0,
            opacity: 1,
            transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as const },
          },
    }),
    [prefersReducedMotion]
  );

  /** Conseils rotatifs — même liste / rythme que le bandeau desktop (`DashboardTabHero`) */
  const mobileHeroTips = useMemo(
    () => DASHBOARD_OVERVIEW_HERO_TIPS.filter((line): line is string => Boolean(line?.trim())),
    []
  );
  const [mobileHeroTipIndex, setMobileHeroTipIndex] = useState(0);
  const mobileHeroTipInterval = prefersReducedMotion
    ? Math.max(DASHBOARD_OVERVIEW_HERO_ROTATE_MS, 60_000)
    : Math.min(Math.max(DASHBOARD_OVERVIEW_HERO_ROTATE_MS, 15_000), 30_000);

  useEffect(() => {
    if (mobileHeroTips.length === 0) return;
    const n = mobileHeroTips.length;
    const id = window.setInterval(() => {
      setMobileHeroTipIndex((i) => (i + 1) % n);
    }, mobileHeroTipInterval);
    return () => window.clearInterval(id);
  }, [mobileHeroTips.length, mobileHeroTipInterval]);

  const trialDaysRemaining = useMemo(() => getTrialDaysRemaining(trialEndsAt), [trialEndsAt]);

  const trialBannerMessage = useMemo(() => {
    if (studioSubscriptionStatus !== 'trialing') return null;
    if (trialDaysRemaining === null) {
      return 'Votre essai gratuit est en cours — aucune carte requise.';
    }
    if (trialDaysRemaining < 0) return null;
    if (trialDaysRemaining === 0) {
      return 'Votre essai se termine aujourd’hui. Choisissez une formule pour continuer sans interruption.';
    }
    if (trialDaysRemaining === 1) return 'Il vous reste 1 jour d’essai gratuit.';
    return `Il vous reste ${trialDaysRemaining} jours d’essai gratuit.`;
  }, [studioSubscriptionStatus, trialDaysRemaining]);

  /** Évite les IDs sortables dupliqués (un seul arbre KPI / widgets draggables selon la largeur) */
  const isMdUp = useBreakpointMd();
  const [rightPanelTab, setRightPanelTab] = useState<'clients' | 'deposits'>('clients');
  const [isEditMode, setIsEditMode] = useState(false);
  /** Bloc statistiques type CRM (donut) : RDV vs demandes, période */
  const [insightView, setInsightView] = useState<'rdv' | 'demandes'>('rdv');
  const [insightPeriod, setInsightPeriod] = useState<'week' | 'month'>('month');
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [periodRevenue, setPeriodRevenue] = useState<number | null>(null);
  const [periodTrend, setPeriodTrend] = useState<number | null>(null);
  const [layout, setLayout] = useState<DashboardLayout>(() => getLayoutFromStorage());
  const toast = useToast();
  const [stripeConnectAccountId, setStripeConnectAccountId] = useState<string | null>(null);
  const [stripeExpressOpening, setStripeExpressOpening] = useState(false);

  useEffect(() => {
    if (!studioId || !useSupabase) {
      setStripeConnectAccountId(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('inkflow_studios')
        .select('stripe_connect_account_id')
        .eq('id', studioId)
        .maybeSingle();
      if (cancelled) return;
      const id = data?.stripe_connect_account_id;
      setStripeConnectAccountId(typeof id === 'string' && id.trim() ? id.trim() : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [studioId, useSupabase]);

  const openStripeExpressDashboard = useCallback(async () => {
    if (!studioId || stripeExpressOpening) return;
    setStripeExpressOpening(true);
    const result = await createStripeExpressLoginLink(studioId);
    setStripeExpressOpening(false);
    if ('error' in result) {
      toast.error(result.error);
      onSetupNavigate?.('settings-payments');
      return;
    }
    window.open(result.url, '_blank', 'noopener,noreferrer');
    toast.success('Ouvre l’onglet Stripe — connecte-toi si demandé.');
  }, [studioId, stripeExpressOpening, toast, onSetupNavigate]);

  const upcomingAppointments = appointments
    .filter((a) => a.date > today && ['pending', 'confirmed'].includes(a.status))
    .sort((a, b) => a.date.localeCompare(b.date));
  /** Aperçu hero : jusqu’à 2 RDV (aujourd’hui puis à venir). */
  const heroPreviewRdvs = useMemo(() => {
    const todaySorted = [...todayAppointments].sort((a, b) =>
      (a.time || '').localeCompare(b.time || '')
    );
    const fromToday = todaySorted.slice(0, 2);
    if (fromToday.length >= 2) return fromToday;
    return [...fromToday, ...upcomingAppointments.slice(0, 2 - fromToday.length)];
  }, [todayAppointments, upcomingAppointments]);
  /** Aligné sur `BentoAgendaTodayTile` (hors cancelled / no_show). */
  const activeTodaySlotsCount = useMemo(
    () => countActiveTodayAppointmentSlots(todayAppointments),
    [todayAppointments]
  );
  const vipClients = clients.filter((c) => (c.totalSpent ?? 0) >= 500).length;
  const appointmentsThisMonth = appointments.filter((a) =>
    a.date.startsWith(now.toISOString().slice(0, 7))
  ).length;

  const unpaidCount = appointments.filter((a) => !a.deposit && a.status !== 'cancelled').length;

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

  const crmMonthRangeLabel = useMemo(() => {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }, [now]);

  const crmWeekRangeLabel = useMemo(() => {
    const end = new Date(today + 'T12:00:00');
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
  }, [today]);

  const safeMonthlyRevenue = Number.isFinite(monthlyRevenue) ? monthlyRevenue : 0;
  const safeMonthlyForecast = Number.isFinite(monthlyForecast) ? monthlyForecast : 0;
  const safePendingDeposits = Number.isFinite(pendingDeposits) ? pendingDeposits : 0;

  const insightDonutData = useMemo(() => {
    const inRange = (dateStr: string) => {
      if (insightPeriod === 'month') return dateStr.startsWith(currentMonthStr);
      const endD = new Date(today + 'T12:00:00');
      const startD = new Date(endD);
      startD.setDate(startD.getDate() - 6);
      const startStr = startD.toISOString().slice(0, 10);
      return dateStr >= startStr && dateStr <= today;
    };

    if (insightView === 'rdv') {
      const ap = appointments.filter((a) => inRange(a.date));
      const segments: { name: string; value: number; color: string }[] = [
        { name: 'Confirmés', value: 0, color: INK_DONUT_RDV.confirmed },
        { name: 'En attente', value: 0, color: INK_DONUT_RDV.pending },
        { name: 'En cours', value: 0, color: INK_DONUT_RDV.in_progress },
        { name: 'Terminés', value: 0, color: INK_DONUT_RDV.completed },
        { name: 'Autres', value: 0, color: INK_DONUT_RDV.other },
      ];
      const idx = (s: Appointment['status']) => {
        if (s === 'confirmed') return 0;
        if (s === 'pending') return 1;
        if (s === 'in_progress') return 2;
        if (s === 'completed') return 3;
        return 4;
      };
      for (const a of ap) {
        const i = idx(a.status);
        segments[i].value += 1;
      }
      return segments.filter((s) => s.value > 0);
    }

    const endD0 = new Date(today + 'T12:00:00');
    const startD0 = new Date(endD0);
    startD0.setDate(startD0.getDate() - 6);
    const weekStartStr = startD0.toISOString().slice(0, 10);
    const inRangeCreated = (createdAt: string) => {
      const d = createdAt.slice(0, 10);
      if (insightPeriod === 'month') return d.slice(0, 7) === currentMonthStr;
      return d >= weekStartStr && d <= today;
    };
    const prFiltered = projectRequests.filter((p) => inRangeCreated(p.createdAt));
    const tally: Record<string, number> = { pending: 0, accepted: 0, confirmed: 0, rejected: 0 };
    for (const p of prFiltered) {
      if (p.status in tally) tally[p.status] += 1;
    }
    const dem = [
      { name: 'En attente', value: tally.pending, color: INK_DONUT_DEMANDES.pending },
      { name: 'Acceptées', value: tally.accepted, color: INK_DONUT_DEMANDES.accepted },
      { name: 'Confirmées', value: tally.confirmed, color: INK_DONUT_DEMANDES.confirmed },
      { name: 'Refusées', value: tally.rejected, color: INK_DONUT_DEMANDES.rejected },
    ];
    return dem.filter((s) => s.value > 0);
  }, [insightView, insightPeriod, appointments, projectRequests, currentMonthStr, today]);
  const lastMonthRevenue = useMemo(
    () =>
      appointments
        .filter(
          (a) => a.date.startsWith(lastMonthStr) && (a.depositPaid || a.status === 'completed')
        )
        .reduce((s, a) => s + (a.depositPaid ? a.deposit || 0 : a.price || 0), 0),
    [appointments, lastMonthStr]
  );
  const lastMonthAppointments = useMemo(
    () => appointments.filter((a) => a.date.startsWith(lastMonthStr)).length,
    [appointments, lastMonthStr]
  );
  const trendRevenue =
    lastMonthRevenue > 0
      ? Math.round(((safeMonthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : null;
  /** Baisse affichée en gris/bleu doux (pas rouge) : début de mois, pas encore de CA. */
  const revenueTrendDisplaySoft = useMemo(() => {
    if (trendRevenue === null || trendRevenue >= 0) return false;
    if (safeMonthlyRevenue > 0) return false;
    return now.getDate() <= 15;
  }, [trendRevenue, safeMonthlyRevenue, now]);
  const trendAppointments =
    lastMonthAppointments > 0
      ? Math.round(((appointmentsThisMonth - lastMonthAppointments) / lastMonthAppointments) * 100)
      : null;
  const completedAppointmentsThisMonth = appointments.filter(
    (a) => a.date.startsWith(currentMonthStr) && a.status === 'completed'
  ).length;
  const averageTicketThisMonth =
    appointmentsThisMonth > 0 ? Math.round(safeMonthlyRevenue / appointmentsThisMonth) : 0;

  const handlePeriodChange = useCallback((total: number, trend: number | null) => {
    setPeriodRevenue(total);
    setPeriodTrend(trend);
  }, []);

  const AVAILABLE_WIDGETS = useMemo(
    () => [
      {
        id: 'kpi-revenue',
        name: 'Revenu mensuel',
        icon: DollarSign,
        color: 'blue',
        category: 'kpi',
        description: 'Affiche le revenu du mois en cours',
      },
      {
        id: 'kpi-deposits',
        name: 'Acomptes',
        icon: Wallet,
        color: 'blue',
        category: 'kpi',
        description: 'Total des acomptes reçus',
      },
      {
        id: 'kpi-clients',
        name: 'Clients',
        icon: Users,
        color: 'blue',
        category: 'kpi',
        description: 'Nombre total de clients',
      },
      {
        id: 'kpi-appointments',
        name: 'RDV du mois',
        icon: Calendar,
        color: 'blue',
        category: 'kpi',
        description: 'Nombre de RDV ce mois',
      },
      {
        id: 'revenue-chart',
        name: 'Graphique revenus',
        icon: BarChart3,
        color: 'blue',
        category: 'main',
        description: 'Évolution des revenus sur 6 mois',
      },
      {
        id: 'appointments-list',
        name: 'RDV du jour',
        icon: Calendar,
        color: 'blue',
        category: 'main',
        description: "Liste des rendez-vous aujourd'hui",
      },
      {
        id: 'clients-deposits',
        name: 'Clients / Acomptes',
        icon: Users,
        color: 'blue',
        category: 'sidebar',
        description: 'Liste des clients et acomptes récents',
      },
      {
        id: 'requests-pending',
        name: 'Demandes en attente',
        icon: Inbox,
        color: 'blue',
        category: 'sidebar',
        description: 'Demandes de RDV en attente',
      },
      {
        id: 'quick-stats',
        name: 'Stats rapides',
        icon: TrendingUp,
        color: 'blue',
        category: 'main',
        description: 'Statistiques clés du studio',
      },
      {
        id: 'upcoming-week',
        name: 'Semaine à venir',
        icon: CalendarCheck,
        color: 'blue',
        category: 'main',
        description: 'Aperçu des 7 prochains jours',
      },
      {
        id: 'top-services',
        name: 'Services populaires',
        icon: Award,
        color: 'blue',
        category: 'sidebar',
        description: 'Vos services les plus demandés',
      },
      {
        id: 'goals-progress',
        name: 'Objectifs',
        icon: Target,
        color: 'blue',
        category: 'sidebar',
        description: 'Progression vers vos objectifs',
      },
      {
        id: 'recent-reviews',
        name: 'Avis récents',
        icon: Star,
        color: 'blue',
        category: 'sidebar',
        description: 'Derniers avis clients',
      },
      {
        id: 'flash-promo',
        name: 'Flash promos',
        icon: Zap,
        color: 'blue',
        category: 'sidebar',
        description: 'Vos flash designs en promo',
      },
      {
        id: 'loyalty-program',
        name: 'Programme fidélité',
        icon: Gift,
        color: 'blue',
        category: 'sidebar',
        description: 'Aperçu du programme fidélité',
      },
    ],
    []
  );

  const activeWidgets = useMemo(() => {
    return [...layout.kpiOrder, ...layout.leftColumn, ...layout.rightColumn];
  }, [layout]);

  const availableToAdd = useMemo(() => {
    return AVAILABLE_WIDGETS.filter((w) => !activeWidgets.includes(w.id));
  }, [AVAILABLE_WIDGETS, activeWidgets]);

  const handleAddWidget = useCallback(
    (widgetId: string) => {
      const widget = AVAILABLE_WIDGETS.find((w) => w.id === widgetId);
      if (!widget) return;

      setLayout((prev) => {
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
    },
    [AVAILABLE_WIDGETS]
  );

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setLayout((prev) => {
      const newLayout = {
        kpiOrder: prev.kpiOrder.filter((id) => id !== widgetId),
        leftColumn: prev.leftColumn.filter((id) => id !== widgetId),
        rightColumn: prev.rightColumn.filter((id) => id !== widgetId),
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

    setLayout((prev) => {
      const newLayout = { ...prev };

      if (prev.kpiOrder.includes(activeIdStr) && prev.kpiOrder.includes(overIdStr)) {
        const oldIndex = prev.kpiOrder.indexOf(activeIdStr);
        const newIndex = prev.kpiOrder.indexOf(overIdStr);
        newLayout.kpiOrder = arrayMove(prev.kpiOrder, oldIndex, newIndex);
      } else if (prev.leftColumn.includes(activeIdStr) && prev.leftColumn.includes(overIdStr)) {
        const oldIndex = prev.leftColumn.indexOf(activeIdStr);
        const newIndex = prev.leftColumn.indexOf(overIdStr);
        newLayout.leftColumn = arrayMove(prev.leftColumn, oldIndex, newIndex);
      } else if (prev.rightColumn.includes(activeIdStr) && prev.rightColumn.includes(overIdStr)) {
        const oldIndex = prev.rightColumn.indexOf(activeIdStr);
        const newIndex = prev.rightColumn.indexOf(overIdStr);
        newLayout.rightColumn = arrayMove(prev.rightColumn, oldIndex, newIndex);
      }

      setLayoutToStorage(newLayout);
      return newLayout;
    });
  }, []);

  /** Desktop KPI — cartes .prodify-card (relief portfolio, aligné index.css) */
  const desktopKpiShell = `prodify-card h-full flex flex-col ${KPI_SHELLS.desktop.outer}`;
  const desktopKpiCaption = KPI_SHELLS.desktop.caption;
  const desktopKpiIconBtn = KPI_SHELLS.desktop.icon;
  /** Home mobile — widgets au même "glass shell" (Figma 387:178) */
  const crmCard =
    'ink-oled-card overflow-hidden rounded-[20px] border border-zinc-200 bg-white dark:border-0 dark:bg-black';
  const mobileHomeSurface =
    'ink-oled-card rounded-[20px] border border-zinc-200 bg-white dark:border-0 dark:bg-black';
  const bentoSoftAlertChip =
    'inline-flex min-h-[36px] min-w-0 max-w-full items-center gap-1.5 rounded-full bg-amber-50/90 px-3 py-1.5 text-[11px] font-medium leading-snug text-amber-900/80 ring-1 ring-amber-100/90 transition [transition-property:transform,background-color] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-amber-500/10 dark:text-amber-100/90 dark:ring-amber-500/20';
  const bentoSoftInfoChip =
    'inline-flex min-h-[36px] min-w-0 max-w-full items-center gap-1.5 rounded-full bg-zinc-100/90 px-3 py-1.5 text-[11px] font-medium leading-snug text-zinc-600 ring-1 ring-zinc-200/80 transition [transition-property:transform,background-color] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-zinc-800/70 dark:text-zinc-300 dark:ring-zinc-700/60';
  const crmCardHeader = 'flex items-baseline justify-between px-4 py-3 dark:border-0';
  const crmSectionTitle = 'text-base font-semibold tracking-tight text-zinc-900 dark:text-white';
  const crmListLink =
    'text-[13px] font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200';
  const bentoMicroMeta = 'text-[11px] font-medium text-zinc-400 dark:text-[#737373]';
  const bentoStatTray =
    'rounded-[20px] border-0 bg-zinc-50/80 p-2 dark:bg-black dark:bg-white/[0.03]';
  const bentoStatCell =
    'flex flex-col justify-end rounded-[20px] border-0 bg-white px-2.5 py-3 dark:bg-white/[0.04]';
  const bentoStripeLinkBtn =
    'inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 focus-visible:ring-offset-2 focus-visible:ring-offset-black';

  const mobileKpiOuter = KPI_SHELLS.mobile.outer;
  const mobileKpiInner = KPI_SHELLS.mobile.inner;
  /** Bandeau vertical KPI mobile — marque blue-600 */
  const mobileKpiStrip = {
    revenue: KPI_SHELLS.mobile.strip,
    deposits: KPI_SHELLS.mobile.strip,
    clients: KPI_SHELLS.mobile.strip,
    appointments: KPI_SHELLS.mobile.strip,
  } as const;
  const iosKpiCaption = KPI_SHELLS.mobile.caption;
  /** Chiffres KPI mobile — grands chiffres tabulaires, lisibles (Dynamic Type–friendly) */
  const iosKpiMetricWrap = 'mt-0.5 inline-flex items-baseline gap-0.5 flex-wrap min-w-0';
  const iosKpiMetricValue = KPI_SHELLS.mobile.metric;
  const iosKpiMetricSuffix =
    'text-[14px] min-[400px]:text-[15px] font-medium text-numeric-muted leading-none tabular-nums select-none';
  /** 44×44 pt zone tactile (HIG) */
  const iosKpiIconBtn = BUTTONS.icon;
  /** Icônes Lucide — une seule teinte (aligné `primary` / thème) */
  const overviewIcon = 'text-zinc-600 dark:text-zinc-400';
  /** Métadonnées sous le chiffre — pastille type footnote iOS */
  const iosKpiMetaPill =
    'inline-flex items-center rounded-full bg-zinc-100/95 dark:bg-zinc-800/90 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300';
  /** Prévision / montant en attente — ambre (attention) */
  const iosKpiMetaPillSky =
    'inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-500/20 px-2 py-1 text-[11px] font-medium text-amber-900 dark:text-amber-200';
  /** Acomptes « En attente » — ambre */
  const iosKpiMetaPillViolet =
    'inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-500/20 px-2 py-1 text-[11px] font-medium text-amber-900 dark:text-amber-200';
  /** Compteur VIP — aligné `primary` */
  const iosKpiMetaPillAmber =
    'inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary dark:bg-primary/20 dark:text-primary';
  /** Pastilles KPI desktop (text-[10px] bold) — cohérents avec le thème zinc du dashboard */
  const kpiPillPending = BADGES.pending;
  const kpiPillNeutral = BADGES.neutral;
  const kpiPillVipPill = BADGES.vip;
  const kpiPillGrowthPill = BADGES.growth;
  const kpiPillDeclinePill = BADGES.decline;
  const kpiPillSubtle = TYPOGRAPHY.tiny;
  const iosKpiMetaPillTrendUp =
    'inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2 py-1 text-[11px] font-medium text-emerald-900 dark:text-emerald-200';
  const iosKpiMetaPillTrendDown =
    'inline-flex items-center rounded-full bg-rose-100 dark:bg-rose-500/20 px-2 py-1 text-[11px] font-medium text-rose-900 dark:text-rose-200';

  const renderKpiWidget = (widgetId: string) => {
    switch (widgetId) {
      /* ── Revenue — même thème que les autres cartes ── */
      case 'kpi-revenue':
        return (
          <OverviewSortableKpi
            key={widgetId}
            id={widgetId}
            isEditMode={isEditMode}
            onRemoveWidget={handleRemoveWidget}
            isMdUp={isMdUp}
          >
            <div className={isMdUp ? desktopKpiShell : mobileKpiOuter}>
              {!isMdUp && (
                <div
                  className={`w-[3px] shrink-0 self-stretch ${mobileKpiStrip.revenue}`}
                  aria-hidden
                />
              )}
              <div className={isMdUp ? 'contents' : mobileKpiInner}>
                <div className="flex items-start justify-between gap-2">
                  <span className={isMdUp ? desktopKpiCaption : iosKpiCaption}>Revenu du mois</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('finance')}
                    className={isMdUp ? desktopKpiIconBtn : iosKpiIconBtn}
                    aria-label="Finances"
                  >
                    <ArrowUpRight
                      className={cn(isMdUp ? 'w-3.5 h-3.5' : 'w-4 h-4', overviewIcon)}
                    />
                  </button>
                </div>
                <div className={`min-w-0 flex-1 flex flex-col ${isMdUp ? '' : 'justify-end'}`}>
                  <p
                    className={
                      isMdUp
                        ? 'text-2xl font-bold text-numeric tabular-nums tracking-tight mt-2'
                        : iosKpiMetricWrap
                    }
                  >
                    {isMdUp ? (
                      <>{euro(safeMonthlyRevenue)}</>
                    ) : (
                      <>
                        <span className={iosKpiMetricValue}>
                          {privacyMode ? '••••' : safeMonthlyRevenue.toLocaleString('fr-FR')}
                        </span>
                        {!privacyMode && <span className={iosKpiMetricSuffix}>€</span>}
                      </>
                    )}
                  </p>
                  <div className={`${isMdUp ? 'mt-2' : 'mt-1'} flex flex-col gap-1`}>
                    {safeMonthlyForecast > 0 &&
                      (isMdUp ? (
                        <span className={kpiPillPending}>
                          {privacyMode
                            ? '••••'
                            : `+${safeMonthlyForecast.toLocaleString('fr-FR')}€`}{' '}
                          en attente
                        </span>
                      ) : (
                        <p className={iosKpiMetaPillSky}>
                          {privacyMode
                            ? '•••• prévisionnel'
                            : `+${safeMonthlyForecast.toLocaleString('fr-FR')}€ prévisionnel`}
                        </p>
                      ))}
                    <div className="flex items-end min-h-[20px]">
                      {trendRevenue !== null ? (
                        isMdUp ? (
                          <span
                            className={trendRevenue >= 0 ? kpiPillGrowthPill : kpiPillDeclinePill}
                          >
                            {trendRevenue >= 0 ? '↑' : '↓'} {Math.abs(trendRevenue)}% vs mois
                            dernier
                          </span>
                        ) : (
                          <p
                            className={
                              trendRevenue >= 0 ? iosKpiMetaPillTrendUp : iosKpiMetaPillTrendDown
                            }
                          >
                            {trendRevenue >= 0 ? '↑' : '↓'} {Math.abs(trendRevenue)}% vs mois
                            dernier
                          </p>
                        )
                      ) : isMdUp ? (
                        <span className={kpiPillSubtle}>Ce mois</span>
                      ) : (
                        <p className={iosKpiMetaPill}>Ce mois</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </OverviewSortableKpi>
        );

      /* ── Acomptes ── */
      case 'kpi-deposits':
        return (
          <OverviewSortableKpi
            key={widgetId}
            id={widgetId}
            isEditMode={isEditMode}
            onRemoveWidget={handleRemoveWidget}
            isMdUp={isMdUp}
          >
            <div className={isMdUp ? desktopKpiShell : mobileKpiOuter}>
              {!isMdUp && (
                <div
                  className={`w-[3px] shrink-0 self-stretch ${mobileKpiStrip.deposits}`}
                  aria-hidden
                />
              )}
              <div className={isMdUp ? 'contents' : mobileKpiInner}>
                <div className="flex items-start justify-between gap-2">
                  <span className={isMdUp ? desktopKpiCaption : iosKpiCaption}>Acomptes</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('finance')}
                    className={isMdUp ? desktopKpiIconBtn : iosKpiIconBtn}
                    aria-label="Finances"
                  >
                    <ArrowUpRight
                      className={cn(isMdUp ? 'w-3.5 h-3.5' : 'w-4 h-4', overviewIcon)}
                    />
                  </button>
                </div>
                <div className={`min-w-0 flex-1 flex flex-col ${isMdUp ? '' : 'justify-end'}`}>
                  <p
                    className={
                      isMdUp
                        ? 'text-2xl font-bold text-numeric tabular-nums tracking-tight mt-2'
                        : iosKpiMetricWrap
                    }
                  >
                    {isMdUp ? (
                      <>{euro(safePendingDeposits)}</>
                    ) : (
                      <>
                        <span className={iosKpiMetricValue}>
                          {privacyMode ? '••••' : safePendingDeposits.toLocaleString('fr-FR')}
                        </span>
                        {!privacyMode && <span className={iosKpiMetricSuffix}>€</span>}
                      </>
                    )}
                  </p>
                  {isMdUp ? (
                    <div className="mt-2 min-h-[24px] flex items-end">
                      <span className={kpiPillPending}>En attente</span>
                    </div>
                  ) : (
                    <p className={`mt-1 ${iosKpiMetaPillViolet}`}>En attente</p>
                  )}
                </div>
              </div>
            </div>
          </OverviewSortableKpi>
        );

      /* ── Clients ── */
      case 'kpi-clients':
        return (
          <OverviewSortableKpi
            key={widgetId}
            id={widgetId}
            isEditMode={isEditMode}
            onRemoveWidget={handleRemoveWidget}
            isMdUp={isMdUp}
          >
            <div className={isMdUp ? desktopKpiShell : mobileKpiOuter}>
              {!isMdUp && (
                <div
                  className={`w-[3px] shrink-0 self-stretch ${mobileKpiStrip.clients}`}
                  aria-hidden
                />
              )}
              <div className={isMdUp ? 'contents' : mobileKpiInner}>
                <div className="flex items-start justify-between gap-2">
                  <span className={isMdUp ? desktopKpiCaption : iosKpiCaption}>Clients</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('clients')}
                    className={isMdUp ? desktopKpiIconBtn : iosKpiIconBtn}
                    aria-label="Clients"
                  >
                    <ArrowUpRight
                      className={cn(isMdUp ? 'w-3.5 h-3.5' : 'w-4 h-4', overviewIcon)}
                    />
                  </button>
                </div>
                <div className={`min-w-0 flex-1 flex flex-col ${isMdUp ? '' : 'justify-end'}`}>
                  <p
                    className={
                      isMdUp
                        ? 'text-2xl font-bold text-numeric tabular-nums tracking-tight mt-2'
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
                        <span className={kpiPillVipPill}>
                          <Star className={cn('w-3 h-3 shrink-0', overviewIcon)} aria-hidden />
                          {vipClients} VIP
                        </span>
                      </div>
                    ) : (
                      <p className={`mt-1 ${iosKpiMetaPillAmber}`}>
                        <Star className={cn('w-3.5 h-3.5 shrink-0', overviewIcon)} aria-hidden />
                        {vipClients} VIP
                      </p>
                    )
                  ) : isMdUp ? (
                    <div className="mt-2 min-h-[24px] flex items-end">
                      <span className={kpiPillNeutral}>Total</span>
                    </div>
                  ) : (
                    <p className={`mt-1 ${iosKpiMetaPill}`}>Total</p>
                  )}
                </div>
              </div>
            </div>
          </OverviewSortableKpi>
        );

      /* ── RDV ── */
      case 'kpi-appointments':
        return (
          <OverviewSortableKpi
            key={widgetId}
            id={widgetId}
            isEditMode={isEditMode}
            onRemoveWidget={handleRemoveWidget}
            isMdUp={isMdUp}
          >
            <div className={isMdUp ? desktopKpiShell : mobileKpiOuter}>
              {!isMdUp && (
                <div
                  className={`w-[3px] shrink-0 self-stretch ${mobileKpiStrip.appointments}`}
                  aria-hidden
                />
              )}
              <div className={isMdUp ? 'contents' : mobileKpiInner}>
                <div className="flex items-start justify-between gap-2">
                  <span className={isMdUp ? desktopKpiCaption : iosKpiCaption}>RDV ce mois</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('agenda')}
                    className={isMdUp ? desktopKpiIconBtn : iosKpiIconBtn}
                    aria-label="Agenda"
                  >
                    <ArrowUpRight
                      className={cn(isMdUp ? 'w-3.5 h-3.5' : 'w-4 h-4', overviewIcon)}
                    />
                  </button>
                </div>
                <div className={`min-w-0 flex-1 flex flex-col ${isMdUp ? '' : 'justify-end'}`}>
                  <p
                    className={
                      isMdUp
                        ? 'text-2xl font-bold text-numeric tabular-nums tracking-tight mt-2'
                        : iosKpiMetricWrap
                    }
                  >
                    {isMdUp ? (
                      appointmentsThisMonth
                    ) : (
                      <span className={iosKpiMetricValue}>{appointmentsThisMonth}</span>
                    )}
                  </p>
                  <div
                    className={`${isMdUp ? 'mt-2 min-h-[24px]' : 'mt-1 min-h-[20px]'} flex items-end`}
                  >
                    {trendAppointments !== null ? (
                      isMdUp ? (
                        <span
                          className={
                            trendAppointments >= 0 ? kpiPillGrowthPill : kpiPillDeclinePill
                          }
                        >
                          {trendAppointments >= 0 ? '↑' : '↓'} {Math.abs(trendAppointments)}% vs
                          dernier mois
                        </span>
                      ) : (
                        <p
                          className={
                            trendAppointments >= 0 ? iosKpiMetaPillTrendUp : iosKpiMetaPillTrendDown
                          }
                        >
                          {trendAppointments >= 0 ? '↑' : '↓'} {Math.abs(trendAppointments)}% vs
                          mois dernier
                        </p>
                      )
                    ) : isMdUp ? (
                      <span className={kpiPillSubtle}>Ce mois</span>
                    ) : (
                      <p className={iosKpiMetaPill}>Ce mois</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </OverviewSortableKpi>
        );

      default:
        return null;
    }
  };

  const openVitrineInNewTab = useCallback(() => {
    const slug =
      studioSlug != null && studioSlug.trim() !== ''
        ? studioSlug.trim()
        : getVitrineSlug(user?.studioName ?? '');
    if (!slug) return;
    window.open(getVitrineShareUrl(slug), '_blank', 'noopener,noreferrer');
  }, [studioSlug, user?.studioName]);

  const vitrineShareUrl = useMemo(() => {
    const slug =
      studioSlug != null && studioSlug.trim() !== ''
        ? studioSlug.trim()
        : getVitrineSlug(user?.studioName ?? '');
    return slug ? getVitrineShareUrl(slug) : '';
  }, [studioSlug, user?.studioName]);

  const firstBookingGoalInput = useMemo(
    () => ({
      studioSlug,
      flashDesigns,
      appointments,
      bookings,
      availabilitySetupComplete,
      paymentsSetupComplete,
    }),
    [
      studioSlug,
      flashDesigns,
      appointments,
      bookings,
      availabilitySetupComplete,
      paymentsSetupComplete,
    ]
  );

  const handleActivateInboxDemo = useCallback(() => {
    if (!studioId?.trim()) return;
    setDemoInboxPreviewActive(true);
    markOpenInboxAfterDemo();
    setActiveTab('requests');
  }, [studioId, setActiveTab]);

  const showArtistBento = Boolean(useSupabase && studioId?.trim());
  const artistBentoBlock: React.ReactNode = showArtistBento ? (
    <DashboardBentoUnified
      firstName={firstName}
      studioSubscriptionStatus={studioSubscriptionStatus}
      trialBannerMessage={trialBannerMessage ?? undefined}
      onOpenBilling={onOpenBilling}
      referenceDate={now}
      overviewHeaderBgUrl={overviewHeaderBgUrl}
      crmMonthRangeLabel={crmMonthRangeLabel}
      mobileHeroTips={mobileHeroTips}
      mobileHeroTipIndex={mobileHeroTipIndex}
      userAvatarUrl={user?.avatar ?? null}
      avatarUploading={avatarUploading}
      onAvatarPress={() => {
        if (onAvatarClick) onAvatarClick();
        else setActiveTab('settings');
      }}
      todayIso={today}
      todayAppointments={todayAppointments}
      pendingRequestsCount={pendingDemandesCount}
      recentDeposits={recentDeposits}
      projectRequests={projectRequests}
      monthlyRevenue={monthlyRevenue}
      monthlyForecast={monthlyForecast}
      pendingDeposits={pendingDeposits}
      privacyMode={privacyMode}
      formatEuro={euro}
      onOpenFinance={() => setActiveTab('finance')}
      onOpenVitrine={openVitrineInNewTab}
      onOpenAgenda={() => setActiveTab('agenda')}
      onOpenRequests={() => setActiveTab('requests')}
      onNewAppointment={() => setShowBookingModal(true)}
      onOpenFlashTab={() => setActiveTab('flash')}
    />
  ) : null;

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {/* =====================================================
          MOBILE LAYOUT — monté uniquement si !isMdUp pour éviter les IDs @dnd-kit dupliqués
          (un seul arbre sortable actif dans le DndContext).
          ===================================================== */}
        {!isMdUp && (
          <motion.div className="ink-oled-stack ds-home-mobile-ambience flex min-w-0 max-w-full flex-col gap-5 overflow-x-hidden bg-zinc-50 pb-8 antialiased font-sans [-webkit-font-smoothing:antialiased] dark:bg-black sm:gap-6">
            {/* Accueil mobile — référence type CRM (clair, cartes blanches, donut, onglets pilule) */}
            <div className="px-0 pt-0 pb-0">
              <motion.div className="flex flex-col gap-4 sm:gap-3" {...iosSpring(0)}>
                {showArtistBento && artistBentoBlock ? (
                  <motion.div
                    variants={mobileSectionVariants}
                    className="relative isolate min-w-0 w-full"
                  >
                    <div
                      className="pointer-events-none absolute left-1/2 top-0 h-[180px] w-[min(100%,400px)] -translate-x-1/2 rounded-full bg-white/[0.03] blur-[80px] dark:bg-white/[0.04]"
                      aria-hidden
                    />
                    {artistBentoBlock}
                  </motion.div>
                ) : (
                  <BentoHeroCard
                    firstName={firstName}
                    studioSubscriptionStatus={studioSubscriptionStatus}
                    trialBannerMessage={trialBannerMessage ?? undefined}
                    onOpenBilling={onOpenBilling}
                    referenceDate={now}
                    headerBackgroundUrl={overviewHeaderBgUrl}
                    heroSubtitle={crmMonthRangeLabel}
                    heroTips={mobileHeroTips}
                    heroTipIndex={mobileHeroTipIndex}
                    onOpenVitrine={openVitrineInNewTab}
                    userAvatarUrl={user?.avatar ?? null}
                    avatarUploading={avatarUploading}
                    onAvatarPress={() => {
                      if (onAvatarClick) onAvatarClick();
                      else setActiveTab('settings');
                    }}
                  />
                )}

                <div className="flex min-w-0 flex-col gap-4 px-4">
                  {!showArtistBento ? (
                    <div className="mt-6 rounded-2xl border border-zinc-100 bg-card p-4 dark:border-zinc-800/50 dark:bg-zinc-950">
                      <div className="flex flex-col gap-3">
                        <div className="relative min-h-[128px] w-full overflow-hidden rounded-2xl border border-zinc-100 bg-muted/35 p-3 dark:border-zinc-800/50 dark:bg-muted/20">
                          <svg
                            className={cn(
                              'pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full',
                              overviewIcon
                            )}
                            viewBox="0 0 400 56"
                            preserveAspectRatio="none"
                            aria-hidden
                          >
                            <defs>
                              <linearGradient id={pilotageWaveGradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <path
                              fill={`url(#${pilotageWaveGradId})`}
                              d="M0 36 Q100 14 200 26 T400 24 V56 H0 Z"
                            />
                            <path
                              fill="none"
                              stroke="currentColor"
                              strokeOpacity="0.18"
                              strokeWidth="1"
                              d="M0 34 Q100 16 200 24 T400 22"
                            />
                          </svg>
                          <div className="relative z-[1] flex min-h-[112px] flex-col">
                            <div className="flex flex-wrap items-start justify-between gap-1.5 border-b border-border/80 pb-1.5">
                              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                Pilotage
                              </span>
                              {trendRevenue !== null ? (
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    'h-5 gap-0.5 rounded-full px-1.5 py-0 text-[9px] font-semibold tabular-nums',
                                    trendRevenue >= 0
                                      ? 'border border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                                      : revenueTrendDisplaySoft
                                        ? 'border border-zinc-200/90 bg-zinc-100/95 text-zinc-600 dark:border-zinc-600/60 dark:bg-zinc-800/70 dark:text-zinc-300'
                                        : 'border border-rose-200/70 bg-rose-50 text-rose-900 dark:border-rose-900/55 dark:bg-rose-950/40 dark:text-rose-300'
                                  )}
                                >
                                  {trendRevenue >= 0 ? (
                                    <TrendingUp
                                      className="size-2.5"
                                      data-icon="inline-start"
                                      aria-hidden
                                    />
                                  ) : (
                                    <TrendingDown
                                      className="size-2.5"
                                      data-icon="inline-start"
                                      aria-hidden
                                    />
                                  )}
                                  {trendRevenue >= 0 ? '+' : ''}
                                  {trendRevenue}% mois dernier
                                </Badge>
                              ) : null}
                            </div>
                            <div className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center">
                              <span
                                className={cn(
                                  'font-bold leading-none tracking-tight tabular-nums text-[#2D3436] dark:text-zinc-100',
                                  !privacyMode && safeMonthlyRevenue === 0
                                    ? 'text-[26px]'
                                    : 'text-[30px] sm:text-[32px]'
                                )}
                              >
                                {privacyMode
                                  ? '••••'
                                  : `${safeMonthlyRevenue.toLocaleString('fr-FR')}€`}
                              </span>
                              <p className="text-[9px] font-medium text-muted-foreground">
                                {crmMonthRangeLabel}
                              </p>
                              <Badge
                                variant="outline"
                                className="mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-medium text-primary"
                              >
                                {privacyMode
                                  ? 'Prévision ••••'
                                  : `Prévision +${safeMonthlyForecast.toLocaleString('fr-FR')}€`}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <BentoPilotageQuickRow
                          todayAppointmentsCount={activeTodaySlotsCount}
                          pendingRequestsCount={pendingDemandesCount}
                          onOpenAgenda={() => setActiveTab('agenda')}
                          onOpenRequests={() => setActiveTab('requests')}
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Aperçu prochains RDV (compact) */}
                  {heroPreviewRdvs.length > 0 ? (
                    <div className="rounded-2xl border border-zinc-100 bg-white px-3 py-2.5 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
                      <p className="mb-2 font-display text-[10px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                        Prochains RDV
                      </p>
                      <ul className="space-y-1.5">
                        {heroPreviewRdvs.map((apt) => {
                          const isToday = apt.date === today;
                          return (
                            <li key={apt.id}>
                              <button
                                type="button"
                                onClick={() => setSelectedAppointment(apt)}
                                className="flex w-full min-h-[44px] items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 text-left transition-colors hover:border-zinc-200/90 hover:bg-zinc-50/90 active:scale-[0.99] dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
                              >
                                <span className="w-11 shrink-0 text-center font-display text-[11px] font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
                                  {isToday
                                    ? (apt.time?.slice(0, 5) ?? '—')
                                    : new Date(apt.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'short',
                                      })}
                                </span>
                                <span className="min-w-0 flex-1 truncate font-display text-[13px] font-semibold text-[#2D3436] dark:text-zinc-100">
                                  {apt.clientName}
                                </span>
                                <ChevronRight
                                  className="size-4 shrink-0 text-zinc-300 dark:text-zinc-600"
                                  aria-hidden
                                />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}

                  {pendingDemandesCount > 0 ? (
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => setActiveTab('requests')}
                        className="flex w-full min-h-[52px] items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white p-4 text-left transition-all active:scale-[0.99] dark:border-zinc-900 dark:bg-zinc-950/40"
                        aria-label={`${pendingDemandesCount} actions à traiter`}
                      >
                        <span className="flex min-w-0 items-center gap-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-950">
                            <MessageSquare className="size-4" aria-hidden strokeWidth={2.5} />
                          </span>
                          <span className="truncate font-display tracking-tight">
                            {pendingDemandesCount}{' '}
                            {pendingDemandesCount === 1 ? 'action à traiter' : 'actions à traiter'}
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-zinc-200">
                            Nouveau
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-zinc-400" aria-hidden />
                        </div>
                      </button>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            </div>

            {trialBannerMessage && (
              <div className="px-0">
                <OverviewTrialBanner
                  message={trialBannerMessage}
                  onOpenBilling={onOpenBilling}
                  className="shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
                />
              </div>
            )}

            {visibleAlerts.length > 0 ? (
              <div className="px-0">
                <OverviewActivityAlerts
                  alerts={visibleAlerts}
                  setDismissedAlerts={_setDismissedAlerts}
                  onAlertNavigate={onAlertNavigate}
                />
              </div>
            ) : null}

            {onSetupNavigate ? (
              <div className="flex flex-col gap-3 px-0">
                <FirstBookingGoalCard
                  {...firstBookingGoalInput}
                  studioId={studioId}
                  pendingDemandesCount={pendingDemandesCount}
                  onOpenWizard={() => setFirstBookingWizardOpen(true)}
                  onOpenDemandes={() => setActiveTab('requests')}
                  onActivateDemo={studioId ? handleActivateInboxDemo : undefined}
                  onGoTo={onSetupNavigate}
                />
                <StudioSetupChecklist
                  studioSlug={studioSlug}
                  flashDesigns={flashDesigns}
                  appointments={appointments}
                  availabilitySetupComplete={availabilitySetupComplete}
                  paymentsSetupComplete={paymentsSetupComplete}
                  onGoTo={onSetupNavigate}
                />
              </div>
            ) : null}

            {/* Mode widgets — même logique que desktop (KPI réordonnables) */}
            {isEditMode && (
              <div className="px-0 mt-2 sm:mt-3 mb-1">
                <div className={cn(crmCard, 'flex flex-col gap-2 bg-zinc-50 p-3 dark:bg-zinc-950')}>
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-xl bg-zinc-200/90 dark:bg-zinc-800 shrink-0">
                      <Move className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Personnaliser le tableau
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                        Glissez les blocs « Ce mois ». Les graphiques et colonnes latérales restent
                        visibles sur grand écran.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowWidgetPicker(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-900 dark:hover:bg-white transition-colors active:scale-[0.98]"
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

            <motion.div
              variants={mobileStackVariants}
              initial="hidden"
              animate="visible"
              className="px-4 flex flex-col gap-6"
              {...iosSpring(0.12)}
            >
              <motion.div variants={mobileSectionVariants} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                    Aujourd&apos;hui
                  </h2>
                  <span className="text-xs font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                    {todayAppointments.length}{' '}
                    {todayAppointments.length <= 1 ? 'séance' : 'séances'}
                  </span>
                </div>

                <div className={cn(crmCard, 'overflow-hidden')}>
                  {todayAppointments.length > 0 ? (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-900/60">
                      {todayAppointments.slice(0, 4).map((apt) => {
                        const tint = getTodayRowTint(apt.status);
                        const timeLabel = apt.time?.slice(0, 5) ?? '—';
                        return (
                          <button
                            key={apt.id}
                            type="button"
                            onClick={() => setSelectedAppointment(apt)}
                            className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors active:bg-zinc-50 dark:active:bg-zinc-900/40"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`flex flex-col items-center justify-center size-11 rounded-xl font-mono tabular-nums ${tint.timeBg}`}
                              >
                                <span className={`text-sm font-bold tracking-tight ${tint.hour}`}>
                                  {timeLabel}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                  {apt.clientName}
                                </p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                                  {apt.service || 'Tatouage'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight
                              className="size-4 shrink-0 text-zinc-300 dark:text-zinc-700"
                              aria-hidden
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                        Aucun rendez-vous aujourd&apos;hui.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {upcomingAppointments.length > 0 && (
                <motion.div variants={mobileSectionVariants} className="space-y-2">
                  <div className="px-1">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                      À venir
                    </h2>
                  </div>

                  <div
                    className={cn(
                      crmCard,
                      'divide-y divide-zinc-100 dark:divide-zinc-900/60 overflow-hidden'
                    )}
                  >
                    {upcomingAppointments.slice(0, 5).map((apt) => (
                      <button
                        key={apt.id}
                        type="button"
                        onClick={() => setSelectedAppointment(apt)}
                        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors active:bg-zinc-50 dark:active:bg-zinc-900/40"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 min-w-[45px] tabular-nums">
                            {new Date(apt.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {apt.clientName}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-zinc-400 tabular-nums shrink-0">
                          {Math.round(Number(apt.price) || 0).toLocaleString('fr-FR')}€
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Top clients */}
              <motion.div variants={mobileSectionVariants}>
                <div className={cn('overflow-hidden', crmCard)}>
                  <div className={crmCardHeader}>
                    <span className={crmSectionTitle}>Top clients</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('clients')}
                      className={crmListLink}
                    >
                      Tout
                    </button>
                  </div>
                  {topClients.length > 0 ? (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-900/70">
                      {topClients.slice(0, 4).map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => setActiveTab('clients')}
                          className="w-full flex items-center gap-3.5 px-4 py-3.5 min-h-[56px] active:bg-zinc-50 dark:active:bg-zinc-900/50 transition-colors text-left"
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-200/80 dark:bg-zinc-700">
                            <ClientPhotoAvatar
                              name={client.name}
                              src={client.avatar}
                              className="h-full w-full"
                              textClassName="text-sm font-semibold text-zinc-600 dark:text-zinc-300"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[17px] font-normal text-zinc-900 dark:text-white truncate">
                                {client.name}
                              </span>
                              {(client.totalSpent ?? 0) >= 500 && (
                                <Star className="w-3.5 h-3.5 shrink-0 fill-primary/85 text-primary" />
                              )}
                            </div>
                            <span className="text-sm text-zinc-400 dark:text-zinc-500">
                              {privacyMode ? '••••' : `${client.totalSpent}€`} dépensés
                            </span>
                          </div>
                          <ChevronRight
                            className="size-4 shrink-0 text-zinc-300 dark:text-zinc-600"
                            strokeWidth={1.5}
                            aria-hidden
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-zinc-400 text-center py-6">Aucun client</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Synthèse — shell aligné Top clients (zinc monochrome) */}
              <motion.div variants={mobileSectionVariants}>
                <div className={cn('overflow-hidden', crmCard)}>
                  <div className={crmCardHeader}>
                    <div className="min-w-0">
                      <span className={crmSectionTitle}>Synthèse</span>
                      <p className={cn('mt-0.5', bentoMicroMeta)}>{crmMonthRangeLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('finance')}
                      className={cn(
                        crmListLink,
                        'inline-flex shrink-0 items-center gap-0.5 active:scale-[0.98] transition-all'
                      )}
                    >
                      Finance
                      <ChevronRight className="size-3.5 opacity-50" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className={bentoStatTray}>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ['RDV mois', appointmentsThisMonth],
                          ['Terminés', completedAppointmentsThisMonth],
                          ['Panier moy.', privacyMode ? '••' : `${averageTicketThisMonth}€`],
                        ].map(([label, value]) => (
                          <div key={label} className={bentoStatCell}>
                            <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
                              {label}
                            </p>
                            <p className="mt-1.5 text-xl font-bold tabular-nums leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(trendRevenue !== null ||
                      ((rdvAlertUnpaidCount > 0 || rdvAlertBientotCount > 0) && !privacyMode)) && (
                      <div
                        className="space-y-2.5 border-t border-zinc-100/90 pt-3.5 dark:border-zinc-900/80"
                        role="region"
                        aria-label="Indicateurs du mois"
                      >
                        {trendRevenue !== null && (
                          <p
                            className={cn(
                              'flex flex-wrap items-center gap-x-1.5 gap-y-0.5',
                              bentoMicroMeta
                            )}
                            role="status"
                          >
                            {trendRevenue >= 0 ? (
                              <TrendingUp
                                className="size-3.5 shrink-0 text-emerald-600/80 dark:text-emerald-400/80"
                                strokeWidth={1.75}
                                aria-hidden
                              />
                            ) : (
                              <TrendingDown
                                className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                                strokeWidth={1.75}
                                aria-hidden
                              />
                            )}
                            <span
                              className={cn(
                                'tabular-nums',
                                trendRevenue >= 0
                                  ? 'text-emerald-700/90 dark:text-emerald-300/90'
                                  : revenueTrendDisplaySoft
                                    ? 'text-zinc-500 dark:text-zinc-400'
                                    : 'text-zinc-600 dark:text-zinc-300'
                              )}
                            >
                              {trendRevenue >= 0 ? '+' : ''}
                              {trendRevenue}%
                            </span>
                            <span>vs mois dernier</span>
                          </p>
                        )}
                        {(rdvAlertUnpaidCount > 0 || rdvAlertBientotCount > 0) && !privacyMode && (
                          <div
                            className="flex flex-wrap gap-2"
                            role="status"
                            aria-label="Rappels rendez-vous"
                          >
                            {rdvAlertUnpaidCount > 0 && (
                              <button
                                type="button"
                                onClick={() => onAlertNavigate?.({ id: 'unpaid', type: 'warning' })}
                                className={bentoSoftAlertChip}
                              >
                                <AlertCircle
                                  className="h-3.5 w-3.5 shrink-0 text-amber-700/70 dark:text-amber-200/80"
                                  strokeWidth={1.75}
                                  aria-hidden
                                />
                                <span className="min-w-0 [text-wrap:balance]">
                                  {rdvAlertUnpaidCount} sans acompte
                                </span>
                              </button>
                            )}
                            {rdvAlertBientotCount > 0 && (
                              <button
                                type="button"
                                onClick={() => onAlertNavigate?.({ id: '24h', type: 'info' })}
                                className={bentoSoftInfoChip}
                              >
                                <Clock
                                  className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400"
                                  strokeWidth={1.75}
                                  aria-hidden
                                />
                                <span className="min-w-0 [text-wrap:balance]">
                                  {rdvAlertBientotCount} auj. ou demain
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {stripeConnectAccountId && useSupabase && (
                      <button
                        type="button"
                        onClick={() => void openStripeExpressDashboard()}
                        disabled={stripeExpressOpening}
                        title="Tableau de bord Stripe (Express)"
                        className={cn(bentoStripeLinkBtn, stripeExpressOpening && 'opacity-60')}
                      >
                        {stripeExpressOpening ? (
                          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                        ) : (
                          <LayoutDashboard
                            className="size-4 shrink-0 text-zinc-500"
                            strokeWidth={1.5}
                            aria-hidden
                          />
                        )}
                        Tableau de bord Stripe
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div variants={mobileSectionVariants}>
                <div className={cn(inkOledCard, 'border-0 p-5')}>
                  <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
                    <div className="flex flex-1 gap-1 rounded-full bg-zinc-100/90 p-1 ring-1 ring-inset ring-zinc-900/[0.04] dark:bg-black/35 dark:ring-zinc-800">
                      <button
                        type="button"
                        onClick={() => setInsightView('rdv')}
                        className={cn(
                          'flex min-h-[44px] flex-1 items-center justify-center rounded-full px-2 text-center text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
                          insightView === 'rdv'
                            ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white dark:ring-1 dark:ring-inset dark:ring-zinc-700'
                            : 'text-zinc-500 dark:text-zinc-500'
                        )}
                      >
                        RDV
                      </button>
                      <button
                        type="button"
                        onClick={() => setInsightView('demandes')}
                        className={cn(
                          'flex min-h-[44px] flex-1 items-center justify-center rounded-full px-2 text-center text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
                          insightView === 'demandes'
                            ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white dark:ring-1 dark:ring-inset dark:ring-zinc-700'
                            : 'text-zinc-500 dark:text-zinc-500'
                        )}
                      >
                        Demandes
                      </button>
                    </div>
                    <div className="flex min-h-[44px] items-center gap-2 self-stretch min-[400px]:self-auto">
                      <label
                        htmlFor="overview-mobile-insight-period"
                        className="shrink-0 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                      >
                        Période
                      </label>
                      <div className="relative min-w-0 flex-1 max-w-[11rem]">
                        <select
                          id="overview-mobile-insight-period"
                          value={insightPeriod}
                          onChange={(e) => setInsightPeriod(e.target.value as 'week' | 'month')}
                          className="min-h-[44px] w-full appearance-none rounded-xl border border-zinc-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          aria-label="Période des statistiques"
                        >
                          <option value="week">7 jours</option>
                          <option value="month">Mois en cours</option>
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                          aria-hidden
                        />
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                    {insightPeriod === 'month'
                      ? crmMonthRangeLabel
                      : `Semaine : ${crmWeekRangeLabel}`}
                  </p>
                  {insightDonutData.length > 0 ? (
                    <div className="mt-5 flex flex-col items-stretch gap-5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-6">
                      <div className="mx-auto flex w-full max-w-[220px] items-center justify-center min-[420px]:mx-0 min-[420px]:w-[200px] min-[420px]:shrink-0">
                        <div className="aspect-square h-[200px] w-full max-w-[200px] min-[420px]:h-[180px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                              <Pie
                                data={insightDonutData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius="56%"
                                outerRadius="86%"
                                paddingAngle={2}
                                cornerRadius={3}
                                stroke="none"
                                isAnimationActive={false}
                              >
                                {insightDonutData.map((entry) => (
                                  <Cell key={entry.name} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <ul
                        className="flex min-w-0 flex-1 flex-col justify-center gap-3 py-1"
                        aria-label="Légende"
                      >
                        {insightDonutData.map((row) => (
                          <li key={row.name} className="flex items-center justify-between gap-4">
                            <span className="flex min-w-0 items-center gap-2.5">
                              <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: row.color }}
                                aria-hidden
                              />
                              <span className={inkDonutLegendLabel}>{row.name}</span>
                            </span>
                            <span className={inkDonutLegendValue}>{row.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-4 rounded-xl border border-dashed border-zinc-100 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      Pas encore de données sur cette période.
                    </p>
                  )}
                </div>
              </motion.div>

              {unpaidCount > 0 && rdvAlertUnpaidCount === 0 && !privacyMode && (
                <motion.div variants={mobileSectionVariants} className="flex flex-wrap gap-2 px-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('requests')}
                    className={bentoSoftAlertChip}
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                    {unpaidCount} sans acompte
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* =====================================================
          DESKTOP LAYOUT — monté uniquement si isMdUp (pas de doublon d’IDs avec la vue mobile)
          ===================================================== */}
        {isMdUp && (
          <DashboardOverviewDesktopLayout
            toolbar={
              <div className="flex w-full min-w-0 flex-wrap items-center justify-start gap-1.5 rounded-2xl border border-zinc-200/90 bg-white/90 p-1.5 shadow-sm ring-1 ring-zinc-900/[0.04] dark:border-zinc-800/90 dark:bg-zinc-900/55 dark:ring-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
                    isEditMode
                      ? 'border border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800'
                      : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  {isEditMode ? 'Terminer' : 'Widgets'}
                </button>
              </div>
            }
            trialBanner={
              trialBannerMessage ? (
                <OverviewTrialBanner message={trialBannerMessage} onOpenBilling={onOpenBilling} />
              ) : undefined
            }
            unpaidAlertCount={0}
            onViewUnpaidAppointments={() => setActiveTab('agenda')}
            kpiRow={
              <SortableContext items={layout.kpiOrder} strategy={rectSortingStrategy}>
                {layout.kpiOrder.map((widgetId) => renderKpiWidget(widgetId))}
              </SortableContext>
            }
            onboarding={
              onSetupNavigate ? (
                <div className="flex flex-col gap-3">
                  <FirstBookingGoalCard
                    {...firstBookingGoalInput}
                    studioId={studioId}
                    pendingDemandesCount={pendingDemandesCount}
                    onOpenWizard={() => setFirstBookingWizardOpen(true)}
                    onOpenDemandes={() => setActiveTab('requests')}
                    onActivateDemo={studioId ? handleActivateInboxDemo : undefined}
                    onGoTo={onSetupNavigate}
                  />
                  <StudioSetupChecklist
                    studioSlug={studioSlug}
                    flashDesigns={flashDesigns}
                    appointments={appointments}
                    availabilitySetupComplete={availabilitySetupComplete}
                    paymentsSetupComplete={paymentsSetupComplete}
                    onGoTo={onSetupNavigate}
                  />
                </div>
              ) : undefined
            }
            sidebar={
              <DashboardOverviewClientsPanel
                topClients={topClients}
                recentDeposits={recentDeposits}
                privacyMode={privacyMode}
                tab={rightPanelTab}
                onTabChange={setRightPanelTab}
                onOpenClients={() => setActiveTab('clients')}
                onOpenFinance={() => setActiveTab('finance')}
                onNewClient={() => setActiveTab('clients')}
                onSelectAppointment={setSelectedAppointment}
              />
            }
            extraContent={
              <>
                {isEditMode ? (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 dark:bg-primary/10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:gap-4 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <IconBox icon={Move} variant="primary" size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            Mode personnalisation
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Glissez les widgets ou ajoutez-en de nouveaux
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowWidgetPicker(true)}
                        className="flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 sm:w-auto"
                      >
                        <Plus className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
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
                ) : null}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 [contain:layout]">
                  <div className="space-y-6 lg:col-span-8 min-w-0">
                    <SortableContext
                      items={layout.leftColumn.filter((id) => id !== 'appointments-list')}
                      strategy={verticalListSortingStrategy}
                    >
                      {layout.leftColumn
                        .filter((id) => id !== 'appointments-list')
                        .map((widgetId) => {
                          if (widgetId === 'revenue-chart') {
                            return (
                              <OverviewSortableWidget
                                key={widgetId}
                                id={widgetId}
                                isEditMode={isEditMode}
                                onRemoveWidget={handleRemoveWidget}
                              >
                                <div className="prodify-card rounded-[1.25rem] p-6 ring-1 ring-inset ring-zinc-900/[0.04] dark:ring-white/[0.05]">
                                  <div className="flex items-center justify-between mb-4">
                                    <div>
                                      <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
                                        Évolution du revenu
                                      </p>
                                      <div className="flex items-baseline gap-2 flex-wrap">
                                        <p className="text-2xl font-bold text-numeric tabular-nums">
                                          {euro(periodRevenue ?? totalRevenue)}
                                        </p>
                                        {periodTrend !== null && (
                                          <span
                                            className={`text-sm font-semibold tabular-nums ${periodTrend >= 0 ? 'text-primary' : 'text-destructive'}`}
                                          >
                                            {periodTrend >= 0 ? '+' : ''}
                                            {periodTrend}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => setActiveTab('finance')}
                                      className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                                    >
                                      Détails{' '}
                                      <ArrowUpRight className="w-4 h-4 shrink-0" strokeWidth={2} />
                                    </button>
                                  </div>
                                  <RevenueChart
                                    appointments={appointments}
                                    totalRevenue={totalRevenue}
                                    onPeriodChange={handlePeriodChange}
                                    privacyMode={privacyMode}
                                  />
                                </div>
                              </OverviewSortableWidget>
                            );
                          }
                          if (widgetId === 'appointments-list') {
                            return (
                              <OverviewSortableWidget
                                key={widgetId}
                                id={widgetId}
                                isEditMode={isEditMode}
                                onRemoveWidget={handleRemoveWidget}
                              >
                                <div className="prodify-card overflow-hidden">
                                  <div className="px-6 py-5 flex items-center justify-between">
                                    <div>
                                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
                                        Aujourd'hui
                                      </p>
                                      <p className="text-lg font-semibold text-numeric mt-0.5 tabular-nums">
                                        {todayAppointments.length} rendez-vous
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setSelectedFlash(null);
                                        setShowBookingModal(true);
                                      }}
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
                                              <p className="text-lg font-bold text-numeric tabular-nums">
                                                {apt.time?.split(':')[0] || '--'}
                                              </p>
                                              <p className="text-[10px] font-medium text-zinc-400 uppercase">
                                                :{apt.time?.split(':')[1] || '00'}
                                              </p>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                                {apt.clientName}
                                              </p>
                                              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                                {apt.service || 'Tatouage'}
                                              </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {apt.price && (
                                                <span className="text-sm font-semibold text-numeric tabular-nums">
                                                  {privacyMode ? '••••' : `${apt.price}€`}
                                                </span>
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
                                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-500 mb-3">
                                          Aucun RDV aujourd'hui
                                        </p>
                                        <button
                                          onClick={() => {
                                            setSelectedFlash(null);
                                            setShowBookingModal(true);
                                          }}
                                          className="text-sm font-semibold text-primary hover:underline"
                                        >
                                          + Ajouter un RDV
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {upcomingAppointments.length > 0 && (
                                    <div className="px-6 py-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                                      <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                          À venir
                                        </span>
                                        <button
                                          onClick={() => setActiveTab('agenda')}
                                          className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                        >
                                          Voir tout
                                        </button>
                                      </div>
                                      <div className="space-y-2">
                                        {upcomingAppointments.slice(0, 3).map((apt) => (
                                          <button
                                            key={apt.id}
                                            onClick={() => setSelectedAppointment(apt)}
                                            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors text-left"
                                          >
                                            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 min-w-[3.5rem]">
                                              {new Date(apt.date + 'T00:00').toLocaleDateString(
                                                'fr-FR',
                                                { day: 'numeric', month: 'short' }
                                              )}
                                            </span>
                                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">
                                              {apt.clientName}
                                            </span>
                                            <span
                                              className={`inline-flex min-h-[1.75rem] min-w-[1.75rem] items-center justify-center rounded-lg ${
                                                apt.status === 'confirmed'
                                                  ? 'bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary'
                                                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                              }`}
                                              title={
                                                apt.status === 'confirmed'
                                                  ? 'Confirmé'
                                                  : 'En attente'
                                              }
                                            >
                                              {apt.status === 'confirmed' ? (
                                                <Check
                                                  className="w-3.5 h-3.5"
                                                  strokeWidth={2.5}
                                                  aria-hidden
                                                />
                                              ) : (
                                                <Clock
                                                  className="w-3.5 h-3.5"
                                                  strokeWidth={2}
                                                  aria-hidden
                                                />
                                              )}
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
                            const confirmedApts = appointments.filter(
                              (a) => a.status === 'confirmed'
                            ).length;
                            const pendingApts = appointments.filter(
                              (a) => a.status === 'pending'
                            ).length;
                            const avgPrice =
                              appointments.length > 0
                                ? Math.round(
                                    appointments.reduce((sum, a) => sum + (a.price || 0), 0) /
                                      appointments.length
                                  )
                                : 0;

                            return (
                              <OverviewSortableWidget
                                key={widgetId}
                                id={widgetId}
                                isEditMode={isEditMode}
                                onRemoveWidget={handleRemoveWidget}
                              >
                                <div className="prodify-card p-6">
                                  <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20">
                                        <TrendingUp className={cn('w-5 h-5', overviewIcon)} />
                                      </div>
                                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                        Stats rapides
                                      </p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 rounded-2xl bg-primary/5 dark:bg-primary/10">
                                      <p className="text-2xl font-bold text-primary tabular-nums">
                                        {confirmedApts}
                                      </p>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        Confirmés
                                      </p>
                                    </div>
                                    <div className="text-center p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80">
                                      <p className="text-2xl font-bold text-numeric tabular-nums">
                                        {pendingApts}
                                      </p>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        En attente
                                      </p>
                                    </div>
                                    <div className="text-center p-3 rounded-2xl bg-primary/5 dark:bg-primary/10">
                                      <p className="text-2xl font-bold text-numeric tabular-nums">
                                        {privacyMode ? '••••' : `${avgPrice}€`}
                                      </p>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        Prix moy.
                                      </p>
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
                              const dayApts = appointments.filter((a) => a.date === dateStr);
                              return {
                                date: dateStr,
                                dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
                                dayNum: date.getDate(),
                                count: dayApts.length,
                                revenue: dayApts.reduce((sum, a) => sum + (a.price || 0), 0),
                              };
                            });

                            return (
                              <OverviewSortableWidget
                                key={widgetId}
                                id={widgetId}
                                isEditMode={isEditMode}
                                onRemoveWidget={handleRemoveWidget}
                              >
                                <div className="prodify-card p-6">
                                  <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20">
                                        <CalendarCheck className={cn('w-5 h-5', overviewIcon)} />
                                      </div>
                                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                        7 prochains jours
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => setActiveTab('agenda')}
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
                                            ? 'bg-primary text-primary-foreground'
                                            : day.count > 0
                                              ? 'bg-zinc-100 dark:bg-zinc-800'
                                              : 'bg-zinc-50 dark:bg-zinc-800/50'
                                        }`}
                                      >
                                        <p
                                          className={`text-[10px] uppercase font-semibold ${i === 0 ? 'text-primary-foreground/70' : 'text-zinc-400 dark:text-zinc-500'}`}
                                        >
                                          {day.dayName}
                                        </p>
                                        <p
                                          className={`text-lg font-bold ${i === 0 ? 'text-primary-foreground' : 'text-zinc-900 dark:text-white'}`}
                                        >
                                          {day.dayNum}
                                        </p>
                                        {day.count > 0 && (
                                          <p
                                            className={`text-[10px] font-semibold mt-1 ${i === 0 ? 'text-primary-foreground/80' : 'text-primary'}`}
                                          >
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
                    </SortableContext>
                  </div>

                  <div className="space-y-6 lg:col-span-4 min-w-0">
                    <SortableContext
                      items={layout.rightColumn.filter((id) => id !== 'clients-deposits')}
                      strategy={verticalListSortingStrategy}
                    >
                      {layout.rightColumn
                        .filter((id) => id !== 'clients-deposits')
                        .map((widgetId) => {
                          if (widgetId === 'requests-pending') {
                            return pendingDemandesCount > 0 ? (
                              <OverviewSortableWidget
                                key={widgetId}
                                id={widgetId}
                                isEditMode={isEditMode}
                                onRemoveWidget={handleRemoveWidget}
                              >
                                <button
                                  onClick={() => !isEditMode && setActiveTab('requests')}
                                  className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all text-left group"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="rounded-xl bg-primary/10 p-3 dark:bg-primary/20">
                                      <Inbox className={cn('w-5 h-5', overviewIcon)} />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                        {pendingDemandesCount} demandes
                                      </p>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                        En attente de réponse
                                      </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 transition-colors" />
                                  </div>
                                </button>
                              </OverviewSortableWidget>
                            ) : (
                              <OverviewSortableWidget
                                key={widgetId}
                                id={widgetId}
                                isEditMode={isEditMode}
                                onRemoveWidget={handleRemoveWidget}
                              >
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                                  <div className="flex items-center gap-4">
                                    <div className="rounded-xl bg-primary/10 p-3 dark:bg-primary/20">
                                      <Check className={cn('w-5 h-5', overviewIcon)} />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                        Aucune demande
                                      </p>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                        Tout est à jour !
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </OverviewSortableWidget>
                            );
                          }

                          if (widgetId === 'top-services') {
                            const serviceStats = appointments.reduce(
                              (acc, apt) => {
                                const service = apt.service || 'Tatouage';
                                acc[service] = (acc[service] || 0) + 1;
                                return acc;
                              },
                              {} as Record<string, number>
                            );
                            const topServices = Object.entries<number>(serviceStats)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 3);

                            return (
                              <OverviewSortableWidget
                                key={widgetId}
                                id={widgetId}
                                isEditMode={isEditMode}
                                onRemoveWidget={handleRemoveWidget}
                              >
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="rounded-xl bg-primary/10 p-2.5 dark:bg-primary/20">
                                      <Award className={cn('w-5 h-5', overviewIcon)} />
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                      Services populaires
                                    </p>
                                  </div>
                                  {topServices.length > 0 ? (
                                    <div className="space-y-2">
                                      {topServices.map(([service, count], i) => (
                                        <div key={service} className="flex items-center gap-3">
                                          <span
                                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                              i === 0
                                                ? 'bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary'
                                                : i === 1
                                                  ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                                                  : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                                            }`}
                                          >
                                            {i + 1}
                                          </span>
                                          <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">
                                            {service}
                                          </span>
                                          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                            {count} RDV
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-zinc-400 text-center py-4">
                                      Pas encore de données
                                    </p>
                                  )}
                                </div>
                              </OverviewSortableWidget>
                            );
                          }

                          if (widgetId === 'goals-progress') {
                            const monthlyGoal = 5000;
                            const progress = Math.min(
                              (safeMonthlyRevenue / monthlyGoal) * 100,
                              100
                            );

                            return (
                              <OverviewSortableWidget
                                key={widgetId}
                                id={widgetId}
                                isEditMode={isEditMode}
                                onRemoveWidget={handleRemoveWidget}
                              >
                                <div className="rounded-2xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="flex size-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400">
                                      <Target className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                      Objectif mensuel
                                    </p>
                                  </div>
                                  <div className="mb-3">
                                    <div className="flex items-end justify-between mb-2">
                                      <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                                        {euro(safeMonthlyRevenue)}
                                      </span>
                                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                        /{' '}
                                        {privacyMode
                                          ? '••••'
                                          : `${monthlyGoal.toLocaleString('fr-FR')}€`}
                                      </span>
                                    </div>
                                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-500 dark:bg-blue-500"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {Math.round(progress)}% de l'objectif atteint
                                  </p>
                                </div>
                              </OverviewSortableWidget>
                            );
                          }

                          if (widgetId === 'flash-promo') {
                            return (
                              <OverviewSortableWidget
                                key={widgetId}
                                id={widgetId}
                                isEditMode={isEditMode}
                                onRemoveWidget={handleRemoveWidget}
                              >
                                <button
                                  onClick={() => setActiveTab('flash')}
                                  type="button"
                                  className="w-full rounded-2xl border border-zinc-100 bg-white p-5 text-left transition-all active:scale-[0.98] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400">
                                      <Zap className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                      Flash Designs
                                    </p>
                                  </div>
                                  <p className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">
                                    {customWidgets.length || 0} designs
                                  </p>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Gérez vos flash disponibles →
                                  </p>
                                </button>
                              </OverviewSortableWidget>
                            );
                          }

                          if (widgetId === 'loyalty-program') {
                            const vipCount = clients.filter(
                              (c) => (c.totalSpent ?? 0) >= 500
                            ).length;

                            return (
                              <OverviewSortableWidget
                                key={widgetId}
                                id={widgetId}
                                isEditMode={isEditMode}
                                onRemoveWidget={handleRemoveWidget}
                              >
                                <div className="rounded-2xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400">
                                      <Gift className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                      Programme fidélité
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                                        {vipCount}
                                      </p>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Clients VIP
                                      </p>
                                    </div>
                                    <div className="flex-1 flex justify-end">
                                      <div className="flex -space-x-2">
                                        {topClients.slice(0, 3).map((c) => (
                                          <div
                                            key={c.id}
                                            className="w-10 h-10 rounded-full bg-zinc-100 border-2 border-white dark:bg-zinc-800 dark:border-zinc-900 flex items-center justify-center text-sm font-bold text-zinc-700 dark:text-zinc-200"
                                          >
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
                    </SortableContext>
                  </div>
                </div>
              </>
            }
          />
        )}
      </DndContext>

      {/* Widget Picker — portail body : évite le parent motion.div (transform/opacity) qui casse fixed et donne l’effet « transparent / doublons » */}
      {showWidgetPicker &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[500] bg-black/70 dark:bg-black/80"
              aria-hidden
              onClick={() => setShowWidgetPicker(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="widget-picker-title"
              className="fixed inset-x-3 top-[max(1rem,env(safe-area-inset-top))] max-h-[85dvh] sm:inset-x-4 sm:top-1/2 sm:-translate-y-1/2 sm:max-h-[80vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[min(600px,calc(100vw-2rem))] rounded-3xl z-[510] shadow-lg overflow-hidden flex flex-col bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2
                      id="widget-picker-title"
                      className="text-xl font-bold text-zinc-900 dark:text-white"
                    >
                      Ajouter un widget
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      Personnalisez votre dashboard avec de nouveaux widgets
                    </p>
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
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20">
                      <Check className={cn('h-8 w-8', overviewIcon)} />
                    </div>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                      Tous les widgets sont actifs
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Vous avez déjà ajouté tous les widgets disponibles
                    </p>
                  </div>
                ) : (
                  <>
                    {availableToAdd.filter((w) => w.category === 'kpi').length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                          Indicateurs clés
                        </h3>
                        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                          {availableToAdd
                            .filter((w) => w.category === 'kpi')
                            .map((widget) => {
                              const Icon = widget.icon;
                              return (
                                <button
                                  key={widget.id}
                                  type="button"
                                  onClick={() => handleAddWidget(widget.id)}
                                  className="group flex items-start gap-3 rounded-2xl border border-zinc-200 p-4 text-left transition-all hover:border-primary hover:bg-primary/5 dark:border-zinc-800 dark:hover:bg-primary/10"
                                >
                                  <div className="rounded-xl bg-primary/10 p-2.5 transition-transform group-hover:scale-110 dark:bg-primary/20">
                                    <Icon className={cn('w-5 h-5', overviewIcon)} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                      {widget.name}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                                      {widget.description}
                                    </p>
                                  </div>
                                  <Plus className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-primary transition-colors flex-shrink-0" />
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {availableToAdd.filter((w) => w.category === 'main').length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                          Widgets principaux
                        </h3>
                        <div className="space-y-3">
                          {availableToAdd
                            .filter((w) => w.category === 'main')
                            .map((widget) => {
                              const Icon = widget.icon;
                              return (
                                <button
                                  key={widget.id}
                                  type="button"
                                  onClick={() => handleAddWidget(widget.id)}
                                  className="group flex w-full items-center gap-4 rounded-2xl border border-zinc-200 p-4 text-left transition-all hover:border-primary hover:bg-primary/5 dark:border-zinc-800 dark:hover:bg-primary/10"
                                >
                                  <div className="rounded-xl bg-primary/10 p-3 transition-transform group-hover:scale-110 dark:bg-primary/20">
                                    <Icon className={cn('size-6', overviewIcon)} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                      {widget.name}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                      {widget.description}
                                    </p>
                                  </div>
                                  <Plus className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-primary transition-colors" />
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {availableToAdd.filter((w) => w.category === 'sidebar').length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                          Widgets latéraux
                        </h3>
                        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                          {availableToAdd
                            .filter((w) => w.category === 'sidebar')
                            .map((widget) => {
                              const Icon = widget.icon;
                              return (
                                <button
                                  key={widget.id}
                                  type="button"
                                  onClick={() => handleAddWidget(widget.id)}
                                  className="group flex items-start gap-3 rounded-2xl border border-zinc-200 p-4 text-left transition-all hover:border-primary hover:bg-primary/5 dark:border-zinc-800 dark:hover:bg-primary/10"
                                >
                                  <div className="rounded-xl bg-primary/10 p-2.5 transition-transform group-hover:scale-110 dark:bg-primary/20">
                                    <Icon className={cn('w-5 h-5', overviewIcon)} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                      {widget.name}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                                      {widget.description}
                                    </p>
                                  </div>
                                  <Plus className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-primary transition-colors flex-shrink-0" />
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

      {onSetupNavigate ? (
        <FirstBookingWizard
          isOpen={firstBookingWizardOpen}
          onClose={() => setFirstBookingWizardOpen(false)}
          vitrineUrl={vitrineShareUrl}
          studioId={studioId}
          goalInput={firstBookingGoalInput}
          onGoToVitrineSettings={() => onSetupNavigate('settings-vitrine')}
          onGoToAvailability={() => onSetupNavigate('settings-availability')}
          onGoToFlash={() => onSetupNavigate('flash')}
          onOpenDemandes={() => setActiveTab('requests')}
          onActivateDemo={studioId ? handleActivateInboxDemo : undefined}
        />
      ) : null}
    </>
  );
};
