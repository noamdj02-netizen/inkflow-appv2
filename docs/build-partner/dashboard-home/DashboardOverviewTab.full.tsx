import React, { useMemo, useState, useCallback, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Inbox,
  Image,
  LayoutGrid,
  LayoutDashboard,
  Calendar,
  UserPlus,
  CreditCard,
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
  ExternalLink,
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
  Camera,
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
import { getVitrineSlug } from '../../lib/vitrineStorage';
import {
  getLayoutFromStorage,
  setLayoutToStorage,
  type DashboardLayout,
} from '../../lib/dashboardWidgetOrder';
import { useStudioPrivacy, formatEuroPrivacy } from '../../contexts/StudioPrivacyContext';
import { useBreakpointMd } from '../../hooks/useMediaQuery';
import type { Appointment, Client, FlashDesign, ProjectRequest } from '../../types';
import type { DashboardWidget } from './DashboardWidgets';
import { StudioSetupChecklist } from './StudioSetupChecklist';
import { BADGES, BUTTONS, KPI_SHELLS, TYPOGRAPHY } from './DashboardOverviewDesignSystem';
import { IconBox } from '../ui/IconBox';
import { LANDING_PRICING_URL } from '../../lib/urls';
import {
  DASHBOARD_OVERVIEW_HERO_ROTATE_MS,
  DASHBOARD_OVERVIEW_HERO_TIPS,
} from '../../lib/dashboardOverviewHeroTips';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { supabase } from '../../lib/supabase';
import { createStripeExpressLoginLink } from '../../lib/stripeClient';
import { useToast } from '../../contexts/ToastContext';
import { ClientPhotoAvatar } from '../common/ClientPhotoAvatar';
import { ArtistBentoOverview } from './ArtistBentoOverview';
import { useDashboardData } from '../../hooks/useDashboardData';

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
        'border-zinc-200/90 bg-gradient-to-br from-zinc-50/95 to-white py-4 shadow-sm dark:border-zinc-600/50 dark:from-zinc-900/60 dark:to-zinc-900/90',
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
    border: 'border-l-4 border-l-zinc-300 dark:border-l-zinc-600',
    timeBg: 'bg-zinc-200/50 dark:bg-zinc-700/45',
    hour: 'text-zinc-900 dark:text-zinc-100',
    minute: 'text-zinc-600 dark:text-zinc-400',
  };
  if (status === 'cancelled' || status === 'no_show') {
    return {
      border: 'border-l-4 border-l-zinc-200 dark:border-l-zinc-700',
      timeBg: 'bg-zinc-100/80 dark:bg-zinc-800/50',
      hour: 'text-zinc-500 dark:text-zinc-500',
      minute: 'text-zinc-500 dark:text-zinc-500',
    };
  }
  if (status === 'pending' || status === 'in_progress') {
    return {
      ...base,
      border: 'border-l-4 border-l-zinc-500 dark:border-l-zinc-500',
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
  /** Contenu mobile placé juste après le héros pour garder le visuel d’accueil en premier. */
  mobileAfterHero?: React.ReactNode;
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
  setDismissedAlerts,
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
  mobileAfterHero,
}) => {
  const { privacyMode } = useStudioPrivacy();
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

  const bentoDash = useDashboardData({
    studioId,
    todayDateKey: today,
    enabled: Boolean(useSupabase && studioId?.trim()),
  });

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

  const vitrineSlug =
    studioSlug != null && studioSlug !== ''
      ? studioSlug
      : user?.studioName
        ? getVitrineSlug(user.studioName)
        : '';
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
      /* Nuances de bleu (type CRM) — « Terminés » en bleu plein, lisible sur fond clair */
      const segments: { name: string; value: number; color: string }[] = [
        { name: 'Confirmés', value: 0, color: '#1e3a8a' },
        { name: 'En attente', value: 0, color: '#1d4ed8' },
        { name: 'En cours', value: 0, color: '#3b82f6' },
        { name: 'Terminés', value: 0, color: '#2563eb' },
        { name: 'Autres', value: 0, color: '#93c5fd' },
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
      { name: 'En attente', value: tally.pending, color: '#1e40af' },
      { name: 'Acceptées', value: tally.accepted, color: '#2563eb' },
      { name: 'Confirmées', value: tally.confirmed, color: '#3b82f6' },
      { name: 'Refusées', value: tally.rejected, color: '#94a3b8' },
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
  const desktopKpiShell = `prodify-card ${KPI_SHELLS.desktop.outer}`;
  const desktopKpiCaption = KPI_SHELLS.desktop.caption;
  const desktopKpiIconBtn = KPI_SHELLS.desktop.icon;
  /** Home mobile — widgets au même "glass shell" (Figma 387:178) */
  const crmCard = 'ds-glass-widget';
  const mobileHomeSurface = 'ds-glass-widget';
  const crmCardHeader = 'px-4 py-3 flex items-baseline justify-between border-b border-border';
  const crmSectionTitle = 'text-[16px] font-semibold tracking-tight text-foreground';
  const crmListLink = 'text-[13px] font-medium text-muted-foreground hover:text-foreground';

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
  const overviewIcon = 'text-primary';
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

  const showArtistBento = Boolean(useSupabase && studioId?.trim());
  let artistBentoBlock: React.ReactNode = null;
  if (showArtistBento) {
    if (bentoDash.loading) {
      artistBentoBlock = (
        <div
          className="flex min-h-[12rem] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/40 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/30"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <span className="text-sm text-muted-foreground">Chargement du pilotage…</span>
        </div>
      );
    } else if (bentoDash.error) {
      artistBentoBlock = (
        <Alert
          variant="destructive"
          className="rounded-2xl border-rose-200 dark:border-rose-900/50"
        >
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertDescription>
            Impossible de charger le bloc pilotage : {bentoDash.error.message}
          </AlertDescription>
        </Alert>
      );
    } else {
      artistBentoBlock = (
        <ArtistBentoOverview
          showGreeting={false}
          artistName={firstName?.trim() || undefined}
          todaySlots={bentoDash.todaySlots}
          stripeDeposits={bentoDash.stripeDeposits}
          bookingRequests={bentoDash.bookingRequests}
          onOpenFinance={() => setActiveTab('finance')}
          onOpenAgenda={() => setActiveTab('agenda')}
          onOpenRequests={() => setActiveTab('requests')}
        />
      );
    }
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {/* =====================================================
          MOBILE LAYOUT — monté uniquement si !isMdUp pour éviter les IDs @dnd-kit dupliqués
          (un seul arbre sortable actif dans le DndContext).
          ===================================================== */}
        {!isMdUp && (
          <div className="ds-home-mobile-ambience flex min-w-0 max-w-full flex-col gap-4 overflow-x-hidden bg-white pb-8 antialiased font-sans [-webkit-font-smoothing:antialiased] dark:bg-transparent sm:gap-6">
            {/* Accueil mobile — référence type CRM (clair, cartes blanches, donut, onglets pilule) */}
            <div className="px-0 pt-0 pb-0">
              <motion.div className="flex flex-col gap-4 sm:gap-3" {...iosSpring(0)}>
                {/* Hero mobile — Card (shadow) → bloc pilotage */}
                <Card
                  size="sm"
                  className={cn(
                    'gap-0 overflow-hidden rounded-[20px] border border-zinc-200/95 bg-card py-0 shadow-pro ring-0 dark:border-zinc-700/90 dark:bg-zinc-900/95 dark:shadow-pro dark:ring-1 dark:ring-white/[0.06]'
                  )}
                >
                  <CardHeader
                    className={cn(
                      'relative gap-0 overflow-hidden border-none px-4 sm:px-5',
                      overviewHeaderBgUrl
                        ? 'flex flex-col rounded-t-[20px] pt-4 pb-4'
                        : 'rounded-t-[20px] pt-4 pb-2'
                    )}
                  >
                    {overviewHeaderBgUrl ? (
                      <img
                        src={overviewHeaderBgUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 z-0 h-full w-full object-cover object-[center_24%] sm:object-[center_26%]"
                      />
                    ) : null}
                    <div
                      className={cn(
                        'relative z-[2] flex flex-col gap-2.5',
                        overviewHeaderBgUrl && 'min-h-0'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 text-left">
                          <p
                            className={cn(
                              'text-[9px] font-bold uppercase tracking-[0.14em]',
                              overviewHeaderBgUrl
                                ? 'text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]'
                                : 'text-primary'
                            )}
                          >
                            {now.toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                          <h1
                            id="dashboard-overview-mobile-title"
                            className={cn(
                              'font-display mt-0.5 text-xl leading-tight tracking-tight sm:text-[22px]',
                              overviewHeaderBgUrl
                                ? 'font-semibold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]'
                                : 'font-bold text-[#2D3436] dark:text-zinc-100'
                            )}
                          >
                            {firstName ? `Bonjour ${firstName}` : 'Accueil'}
                          </h1>
                          <p
                            className={cn(
                              'mt-0.5 font-sans text-[11px] leading-snug',
                              overviewHeaderBgUrl
                                ? 'text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]'
                                : 'text-muted-foreground'
                            )}
                          >
                            {crmMonthRangeLabel}
                          </p>
                        </div>
                        <CardAction className="flex shrink-0 flex-row gap-1">
                          <motion.button
                            type="button"
                            onClick={() => setActiveTab('finance')}
                            whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                            className={cn(
                              'flex size-9 items-center justify-center rounded-xl border text-primary shadow-[0_8px_20px_-10px_rgba(37,99,235,0.25)] ring-1 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                              overviewHeaderBgUrl
                                ? 'border-white/35 bg-white/95 ring-black/10 backdrop-blur-sm dark:bg-zinc-900/90 dark:ring-white/15'
                                : 'border-border bg-card ring-black/[0.03] dark:bg-secondary dark:ring-white/10'
                            )}
                            aria-label="Finance"
                          >
                            <BarChart3
                              className={cn('size-3.5 shrink-0', overviewIcon)}
                              strokeWidth={2}
                              aria-hidden
                            />
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (onAvatarClick) onAvatarClick();
                              else setActiveTab('settings');
                            }}
                            disabled={avatarUploading}
                            whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                            className={cn(
                              'relative size-9 shrink-0 overflow-hidden rounded-xl border shadow-[0_8px_20px_-10px_rgba(37,99,235,0.2)] ring-1 transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]',
                              overviewHeaderBgUrl
                                ? 'border-white/35 bg-white/95 ring-black/10 backdrop-blur-sm dark:bg-zinc-900/90 dark:ring-white/15'
                                : 'border-border bg-card ring-black/[0.03] dark:bg-secondary dark:ring-white/10'
                            )}
                            aria-label={onAvatarClick ? 'Changer la photo de profil' : 'Paramètres'}
                          >
                            {user?.avatar ? (
                              <img src={user.avatar} alt="" className="size-full object-cover" />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-muted">
                                {onAvatarClick ? (
                                  <Camera
                                    className={cn('size-3.5', overviewIcon)}
                                    strokeWidth={2}
                                    aria-hidden
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-primary">
                                    {firstName ? firstName[0].toUpperCase() : '?'}
                                  </span>
                                )}
                              </div>
                            )}
                            {avatarUploading && (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Loader2 className="size-3.5 animate-spin text-white" aria-hidden />
                              </span>
                            )}
                          </motion.button>
                        </CardAction>
                      </div>
                      {mobileHeroTips.length > 0 ? (
                        <div
                          className={cn(
                            'min-w-0 w-full shrink-0',
                            overviewHeaderBgUrl ? 'mt-4 sm:mt-5' : 'mt-1 pt-2'
                          )}
                          role="status"
                          aria-live="polite"
                          aria-atomic="true"
                        >
                          <div
                            className={cn(
                              overviewHeaderBgUrl
                                ? 'rounded-pro-card border border-white/22 bg-black/54 px-4 pb-3 pt-3 shadow-pro backdrop-blur-[14px]'
                                : 'rounded-pro-card bg-zinc-50/90 px-3 py-2 dark:bg-zinc-800/40'
                            )}
                          >
                            <p
                              className={cn(
                                'mb-2 text-[10px] uppercase tracking-[0.12em]',
                                overviewHeaderBgUrl
                                  ? 'font-medium text-white/85'
                                  : 'font-semibold text-zinc-400 dark:text-zinc-500'
                              )}
                            >
                              Conseil du moment
                            </p>
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.p
                                key={mobileHeroTipIndex}
                                className={cn(
                                  'm-0 max-w-none text-pretty pro-text-small',
                                  overviewHeaderBgUrl
                                    ? 'text-white pb-0.5'
                                    : 'text-zinc-600 dark:text-zinc-300'
                                )}
                                initial={prefersReducedMotion ? false : { opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                                transition={{
                                  duration: prefersReducedMotion ? 0.12 : 0.32,
                                  ease: [0.25, 0.1, 0.25, 1],
                                }}
                              >
                                {mobileHeroTips[mobileHeroTipIndex]}
                              </motion.p>
                            </AnimatePresence>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent
                    className={cn(
                      'flex flex-col gap-3 px-4 sm:px-5',
                      overviewHeaderBgUrl
                        ? 'rounded-b-[20px] bg-transparent pt-4 pb-4 shadow-none'
                        : 'py-4'
                    )}
                  >
                    <div className="flex gap-2">
                      <div className="relative min-h-[128px] flex-1 overflow-hidden rounded-pro-card border border-border bg-muted/35 p-3 shadow-pro dark:bg-muted/20">
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
                                      ? 'border border-slate-200/90 bg-slate-100/95 text-slate-600 dark:border-slate-600/60 dark:bg-slate-800/70 dark:text-slate-300'
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
                      <div className="flex w-[92px] shrink-0 flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('agenda')}
                          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border border-border bg-muted/30 px-1 py-2 text-center shadow-[0_10px_24px_-12px_rgba(37,99,235,0.12)] transition-all hover:bg-muted/45 active:scale-[0.99] dark:bg-muted/15 dark:hover:bg-muted/25"
                        >
                          <CalendarCheck className={cn('size-4', overviewIcon)} aria-hidden />
                          <span className="font-display text-lg font-bold tabular-nums text-[#2D3436] dark:text-zinc-100">
                            {todayAppointments.length}
                          </span>
                          <span className="font-display text-[10px] font-medium capitalize text-muted-foreground">
                            Rdv
                          </span>
                          <span className="text-[8px] leading-none text-muted-foreground/90">
                            Aujourd’hui
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('requests')}
                          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border border-border bg-muted/30 px-1 py-2 text-center shadow-[0_10px_24px_-12px_rgba(37,99,235,0.1)] transition-all hover:bg-muted/45 active:scale-[0.99] dark:bg-muted/15 dark:hover:bg-muted/25"
                        >
                          <Inbox className={cn('size-4', overviewIcon)} aria-hidden />
                          <span className="font-display text-lg font-bold tabular-nums text-[#2D3436] dark:text-zinc-100">
                            {pendingDemandesCount}
                          </span>
                          <span className="font-display text-[10px] font-medium capitalize text-muted-foreground">
                            Demandes
                          </span>
                          <span className="text-[8px] leading-none text-muted-foreground/90">
                            En attente
                          </span>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Aperçu prochains RDV (compact) */}
                {heroPreviewRdvs.length > 0 ? (
                  <div className="rounded-2xl border border-zinc-200/85 bg-white/95 px-3 py-2.5 shadow-[0_14px_36px_-18px_rgba(37,99,235,0.14),0_6px_16px_-8px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-900/80">
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

                {/* Actions rapides — primaire plus large, glass léger, accents par icône */}
                <div className="grid grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFlash(null);
                      setShowBookingModal(true);
                    }}
                    className="font-display col-span-3 flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/80 bg-white/95 p-3 shadow-[0_22px_48px_-16px_rgba(37,99,235,0.2),0_10px_28px_-12px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all active:scale-[0.98] dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:shadow-[0_22px_48px_-16px_rgba(0,0,0,0.45)]"
                  >
                    <Plus className={cn('h-6 w-6', overviewIcon)} aria-hidden strokeWidth={2} />
                    <span className="text-[11px] font-semibold capitalize tracking-tight text-[#2D3436] dark:text-zinc-100">
                      Nouveau Rdv
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (vitrineSlug)
                        window.open(`/studio/${vitrineSlug}`, '_blank', 'noopener,noreferrer');
                      else setActiveTab('agenda');
                    }}
                    className="font-display flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-[0_20px_44px_-18px_rgba(37,99,235,0.16),0_8px_20px_-10px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all active:scale-[0.98] dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:shadow-none"
                  >
                    <ExternalLink
                      className={cn('h-5 w-5', overviewIcon)}
                      aria-hidden
                      strokeWidth={2}
                    />
                    <span className="text-[10px] font-semibold capitalize tracking-tight text-[#2D3436] dark:text-zinc-200">
                      Vitrine
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('flash')}
                    className="font-display flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-[0_20px_44px_-18px_rgba(37,99,235,0.16),0_8px_20px_-10px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all active:scale-[0.98] dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:shadow-none"
                  >
                    <Zap className={cn('h-5 w-5', overviewIcon)} aria-hidden strokeWidth={2} />
                    <span className="text-[10px] font-semibold capitalize tracking-tight text-[#2D3436] dark:text-zinc-200">
                      Flash
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('clients')}
                    className="font-display flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-[0_20px_44px_-18px_rgba(37,99,235,0.16),0_8px_20px_-10px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all active:scale-[0.98] dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:shadow-none"
                  >
                    <Users className={cn('h-5 w-5', overviewIcon)} aria-hidden strokeWidth={2} />
                    <span className="text-[10px] font-semibold capitalize tracking-tight text-[#2D3436] dark:text-zinc-200">
                      Clients
                    </span>
                  </button>
                </div>

                {pendingDemandesCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('requests')}
                    className={cn(
                      'flex w-full min-h-[48px] items-center justify-between gap-3 rounded-2xl border-0 px-4 py-3 text-left shadow-[0_16px_40px_-12px_rgba(37,99,235,0.35),0_6px_16px_-6px_rgba(29,78,216,0.22)] transition-all active:scale-[0.99]',
                      'bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 text-white'
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3 text-[13px] font-semibold text-white">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15 shadow-sm backdrop-blur-sm">
                        <MessageSquare
                          className="size-[18px] text-white"
                          aria-hidden
                          strokeWidth={2}
                        />
                      </span>
                      <span className="truncate font-display">
                        {pendingDemandesCount}{' '}
                        {pendingDemandesCount === 1 ? 'demande en attente' : 'demandes en attente'}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-white/90" aria-hidden />
                  </button>
                ) : null}

                {mobileAfterHero ? <div className="min-w-0 -mt-0.5">{mobileAfterHero}</div> : null}

                {showArtistBento && artistBentoBlock ? (
                  <motion.div
                    variants={mobileSectionVariants}
                    className="min-w-0 px-4 pt-3 sm:px-5"
                  >
                    <div className="relative isolate">
                      <div
                        className="pointer-events-none absolute left-1/2 top-0 h-[220px] w-[min(100%,440px)] -translate-x-1/2 rounded-full bg-emerald-500/[0.08] blur-[90px] dark:bg-emerald-900/15"
                        aria-hidden
                      />
                      {artistBentoBlock}
                    </div>
                  </motion.div>
                ) : null}

                {/* Sous-navigation — supprimée (dock d’actions dans le hero + scroll plus fluide). */}

                <motion.div
                  variants={mobileStackVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-4 sm:gap-5"
                >
                  {/* Synthèse mois — tendance, alertes RDV, Stripe (pilotage déjà dans le hero) */}
                  <motion.div variants={mobileSectionVariants}>
                    <div
                      className={cn(
                        mobileHomeSurface,
                        'flex flex-col gap-3 rounded-[32px] border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/55'
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                            Synthèse
                          </p>
                          <p className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-400">
                            {crmMonthRangeLabel}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('finance')}
                          className="-my-1 h-9 shrink-0 gap-1 rounded-xl px-2 text-[12px] font-semibold text-primary hover:bg-primary/10 dark:hover:bg-primary/15"
                        >
                          Finance
                          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ['RDV mois', appointmentsThisMonth],
                          ['Terminés', completedAppointmentsThisMonth],
                          ['Panier moy.', privacyMode ? '••' : `${averageTicketThisMonth}€`],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-2xl border border-zinc-100 bg-zinc-50/90 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/40"
                          >
                            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                              {label}
                            </p>
                            <p className="mt-1 text-base font-bold tabular-nums text-zinc-950 dark:text-white">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2">
                        {trendRevenue !== null && (
                          <div className="flex min-w-0 flex-wrap items-end gap-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'h-auto min-h-8 rounded-2xl px-3 py-1.5 text-[12px] font-semibold tabular-nums',
                                trendRevenue >= 0
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                  : revenueTrendDisplaySoft
                                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                              )}
                            >
                              {trendRevenue >= 0 ? (
                                <TrendingUp data-icon="inline-start" aria-hidden />
                              ) : (
                                <TrendingDown data-icon="inline-start" aria-hidden />
                              )}
                              {trendRevenue >= 0 ? '+' : ''}
                              {trendRevenue}% vs mois dernier
                            </Badge>
                          </div>
                        )}
                        {(rdvAlertUnpaidCount > 0 || rdvAlertBientotCount > 0) && !privacyMode && (
                          <div
                            className="flex flex-wrap gap-1"
                            role="status"
                            aria-label="Rappels rendez-vous"
                          >
                            {rdvAlertUnpaidCount > 0 && (
                              <button
                                type="button"
                                onClick={() => onAlertNavigate?.({ id: 'unpaid', type: 'warning' })}
                                className="inline-flex min-h-[44px] min-w-0 max-w-full items-center gap-1.5 rounded-full bg-primary/10 px-3 py-2 text-left text-[11px] font-medium leading-snug text-zinc-950 ring-1 ring-primary/20 transition [transition-property:transform,background-color] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-0 dark:bg-zinc-800/95 dark:text-zinc-100 dark:ring-1 dark:ring-zinc-600/50"
                              >
                                <AlertCircle
                                  className={cn('h-3.5 w-3.5 shrink-0', overviewIcon)}
                                  strokeWidth={2}
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
                                className="inline-flex min-h-[44px] min-w-0 max-w-full items-center gap-1.5 rounded-full bg-primary/5 px-3 py-2 text-left text-[11px] font-medium leading-snug text-foreground ring-1 ring-primary/20 transition [transition-property:transform,background-color] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-0 dark:bg-zinc-800/95 dark:text-zinc-100 dark:ring-1 dark:ring-zinc-600/50"
                              >
                                <Clock
                                  className={cn('h-3.5 w-3.5 shrink-0', overviewIcon)}
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                <span className="min-w-0 [text-wrap:balance]">
                                  {rdvAlertBientotCount} auj. ou demain
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                        {stripeConnectAccountId && useSupabase && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void openStripeExpressDashboard()}
                            disabled={stripeExpressOpening}
                            title="Tableau de bord Stripe (Express)"
                            className="min-h-[44px] w-full rounded-2xl border-dashed"
                          >
                            {stripeExpressOpening ? (
                              <Loader2
                                data-icon="inline-start"
                                className="animate-spin"
                                aria-hidden
                              />
                            ) : (
                              <LayoutDashboard data-icon="inline-start" aria-hidden />
                            )}
                            Tableau de bord Stripe
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Bloc statistiques : toggle + période + donut */}
                  <motion.div variants={mobileSectionVariants}>
                    <div className={cn(mobileHomeSurface, 'p-4')}>
                      <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
                        <div className="flex flex-1 gap-1 rounded-full bg-zinc-100/90 p-1 ring-1 ring-inset ring-zinc-900/[0.04] dark:bg-black/35 dark:ring-zinc-700/45">
                          <button
                            type="button"
                            onClick={() => setInsightView('rdv')}
                            className={cn(
                              'flex min-h-[44px] flex-1 items-center justify-center rounded-full px-2 text-center text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                              insightView === 'rdv'
                                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white dark:ring-1 dark:ring-inset dark:ring-white/12'
                                : 'text-zinc-500 dark:text-zinc-500'
                            )}
                          >
                            RDV
                          </button>
                          <button
                            type="button"
                            onClick={() => setInsightView('demandes')}
                            className={cn(
                              'flex min-h-[44px] flex-1 items-center justify-center rounded-full px-2 text-center text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                              insightView === 'demandes'
                                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white dark:ring-1 dark:ring-inset dark:ring-white/12'
                                : 'text-zinc-500 dark:text-zinc-500'
                            )}
                          >
                            Demandes
                          </button>
                        </div>
                        <div className="flex min-h-[44px] items-center gap-2 self-stretch min-[400px]:self-auto">
                          <label
                            htmlFor="overview-insight-period"
                            className="shrink-0 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                          >
                            Période
                          </label>
                          <div className="relative min-w-0 flex-1 max-w-[11rem]">
                            <select
                              id="overview-insight-period"
                              value={insightPeriod}
                              onChange={(e) => setInsightPeriod(e.target.value as 'week' | 'month')}
                              className="min-h-[44px] w-full appearance-none rounded-xl border border-zinc-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
                        <div className="mt-4 flex flex-col items-stretch gap-4 min-[420px]:flex-row min-[420px]:items-center">
                          <div className="mx-auto w-full max-w-[200px] min-[420px]:mx-0 min-[420px]:w-[200px] min-[420px]:shrink-0">
                            <div className="h-[200px] w-full min-[420px]:h-[180px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={insightDonutData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius="58%"
                                    outerRadius="88%"
                                    paddingAngle={2}
                                    stroke="none"
                                  >
                                    {insightDonutData.map((entry) => (
                                      <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                          <ul className="flex min-w-0 flex-1 flex-col gap-2" aria-label="Légende">
                            {insightDonutData.map((row) => (
                              <li
                                key={row.name}
                                className="flex items-center justify-between gap-2 text-[13px]"
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: row.color }}
                                    aria-hidden
                                  />
                                  <span className="truncate text-zinc-700 dark:text-zinc-200">
                                    {row.name}
                                  </span>
                                </span>
                                <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-white">
                                  {row.value}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="mt-4 rounded-xl border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                          Pas encore de données sur cette période.
                        </p>
                      )}
                    </div>
                  </motion.div>

                  {/* Pills rappels (acomptes — RDV proches affichés dans l’en-tête Vue d’ensemble) */}
                  {unpaidCount > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('requests')}
                        className="flex min-h-[44px] items-center gap-2 rounded-full bg-zinc-200/90 px-4 py-2 text-xs font-semibold text-zinc-900 shadow-sm transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:bg-zinc-700/50 dark:text-zinc-100 dark:focus-visible:ring-offset-zinc-900"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                        {unpaidCount} sans acompte
                      </button>
                    </div>
                  )}
                </motion.div>
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

            {onSetupNavigate && (
              <div className="px-0 rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
                <StudioSetupChecklist
                  studioSlug={studioSlug}
                  flashDesigns={flashDesigns}
                  appointments={appointments}
                  availabilitySetupComplete={availabilitySetupComplete}
                  paymentsSetupComplete={paymentsSetupComplete}
                  onGoTo={onSetupNavigate}
                />
              </div>
            )}

            {/* Mode widgets — même logique que desktop (KPI réordonnables) */}
            {isEditMode && (
              <div className="px-0 mt-2 sm:mt-3 mb-1">
                <div
                  className={cn(
                    crmCard,
                    'border-zinc-200/80 bg-zinc-50/95 p-3 dark:border-zinc-700/80 dark:bg-zinc-900/50',
                    'flex flex-col gap-2'
                  )}
                >
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

            {/* Main Content — mêmes jetons cartes CRM */}
            <motion.div
              variants={mobileStackVariants}
              initial="hidden"
              animate="visible"
              className="px-0 flex flex-col gap-4"
              {...iosSpring(0.12)}
            >
              {/* Aujourd&apos;hui */}
              <motion.div variants={mobileSectionVariants}>
                <div className={cn('overflow-hidden', crmCard)}>
                  <div className={crmCardHeader}>
                    <span className={crmSectionTitle}>Aujourd&apos;hui</span>
                    <span className="text-[13px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
                      {todayAppointments.length} RDV
                    </span>
                  </div>
                  {todayAppointments.length > 0 ? (
                    <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                      {todayAppointments.slice(0, 4).map((apt) => {
                        const tint = getTodayRowTint(apt.status);
                        const needsDeposit = !apt.depositPaid && apt.deposit > 0;
                        return (
                          <button
                            key={apt.id}
                            type="button"
                            onClick={() => setSelectedAppointment(apt)}
                            className={`w-full flex items-center gap-3 pl-3 pr-4 py-3 min-h-[52px] active:bg-zinc-100/80 dark:active:bg-zinc-800/60 transition-colors text-left ${tint.border} ${needsDeposit ? 'ring-1 ring-inset ring-blue-400/40 dark:ring-blue-500/30' : ''}`}
                          >
                            <div
                              className={`w-[3.25rem] flex flex-col items-center justify-center flex-shrink-0 rounded-xl py-1.5 ${tint.timeBg}`}
                            >
                              <p
                                className={`text-[17px] font-semibold tabular-nums leading-none ${tint.hour}`}
                              >
                                {apt.time?.split(':')[0]}
                              </p>
                              <p className={`text-[11px] mt-0.5 tabular-nums ${tint.minute}`}>
                                :{apt.time?.split(':')[1] || '00'}
                              </p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[17px] font-medium text-zinc-900 dark:text-white truncate">
                                {apt.clientName}
                              </p>
                              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 truncate">
                                {apt.service || 'Tatouage'}
                              </p>
                            </div>
                            <ChevronRight
                              className={cn(
                                'w-5 h-5 shrink-0',
                                needsDeposit ? overviewIcon : 'text-zinc-300 dark:text-zinc-600'
                              )}
                              aria-hidden
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 pb-4">
                      <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                        <Calendar className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm text-zinc-500 dark:text-zinc-500">
                          Aucun RDV aujourd'hui
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Upcoming Appointments */}
              {upcomingAppointments.length > 0 && (
                <motion.div variants={mobileSectionVariants}>
                  <div className={cn('overflow-hidden', crmCard)}>
                    <div className={crmCardHeader}>
                      <span className={crmSectionTitle}>À venir</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('agenda')}
                        className={crmListLink}
                      >
                        Tout
                      </button>
                    </div>
                    <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/80">
                      {upcomingAppointments.slice(0, 3).map((apt) => (
                        <button
                          key={apt.id}
                          type="button"
                          onClick={() => setSelectedAppointment(apt)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 min-h-[56px] text-left',
                            'transition-colors touch-manipulation',
                            'active:bg-zinc-100/80 dark:active:bg-zinc-800/60'
                          )}
                        >
                          <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 min-w-[3.25rem] tabular-nums">
                            {new Date(apt.date + 'T00:00').toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                          <span className="text-[16px] font-medium text-zinc-900 dark:text-white truncate flex-1">
                            {apt.clientName}
                          </span>
                          <span className="inline-flex items-center justify-center size-9 rounded-full bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200/70 dark:bg-zinc-800/80 dark:text-zinc-300 dark:ring-zinc-700/70">
                            <Clock className="h-4 w-4" strokeWidth={2} aria-hidden />
                          </span>
                        </button>
                      ))}
                    </div>
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
                    <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                      {topClients.slice(0, 4).map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => setActiveTab('clients')}
                          className="w-full flex items-center gap-3 px-4 py-3 min-h-[52px] active:bg-zinc-100/80 dark:active:bg-zinc-800/60 transition-colors text-left"
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
                            <span className="text-[15px] text-zinc-500 dark:text-zinc-400">
                              {privacyMode ? '••••' : `${client.totalSpent}€`} dépensés
                            </span>
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
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* =====================================================
          DESKTOP LAYOUT — monté uniquement si isMdUp (pas de doublon d’IDs avec la vue mobile)
          ===================================================== */}
        {isMdUp && (
          <div className="min-h-full w-full max-w-[min(1800px,100%)] mx-auto isolate">
            {/* ===== HEADER — typo display + hiérarchie type showcase ===== */}
            <div className="px-0 pt-5 pb-5 md:pt-6 md:pb-6 2xl:pt-7 2xl:pb-7">
              <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-start lg:gap-6 2xl:gap-7">
                {/* Raccourcis : la salutation / date / stats sont dans le bandeau héros (textes animés + chiffres d’activité). */}
                <div className="flex w-full min-w-0 shrink-0 flex-wrap items-center justify-start gap-1.5 rounded-2xl border border-zinc-200/90 bg-white/90 p-1.5 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-zinc-900/[0.04] backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/55 dark:ring-white/[0.06] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_4px_12px_rgba(0,0,0,0.15)]">
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
                      isEditMode
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    {isEditMode ? 'Terminer' : 'Widgets'}
                  </button>

                  <div
                    className="hidden sm:block w-px h-6 bg-zinc-200/90 dark:bg-zinc-700"
                    aria-hidden
                  />

                  <button
                    onClick={() => setActiveTab('flash')}
                    className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80"
                  >
                    <Image className="w-3.5 h-3.5" /> Flash
                  </button>
                  {vitrineSlug && (
                    <a
                      href={`/studio/${vitrineSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Vitrine
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelectedFlash(null);
                      setShowBookingModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_2px_4px_rgba(0,0,0,0.12)] transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:shadow-sm dark:hover:bg-zinc-100"
                  >
                    <Plus className="w-4 h-4" /> Nouveau RDV
                  </button>
                </div>
              </div>
              {trialBannerMessage && (
                <div className="mt-5">
                  <OverviewTrialBanner message={trialBannerMessage} onOpenBilling={onOpenBilling} />
                </div>
              )}

              {visibleAlerts.length > 0 && (
                <div className="mt-4 md:mt-5">
                  <OverviewActivityAlerts
                    alerts={visibleAlerts}
                    setDismissedAlerts={setDismissedAlerts}
                    onAlertNavigate={onAlertNavigate}
                  />
                </div>
              )}
            </div>

            {onSetupNavigate && (
              <div className="px-0 pb-4">
                <StudioSetupChecklist
                  studioSlug={studioSlug}
                  flashDesigns={flashDesigns}
                  appointments={appointments}
                  availabilitySetupComplete={availabilitySetupComplete}
                  paymentsSetupComplete={paymentsSetupComplete}
                  onGoTo={onSetupNavigate}
                />
              </div>
            )}

            {/* Edit Mode Banner */}
            {isEditMode && (
              <div className="px-0 mb-4">
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
              </div>
            )}

            {/* ===== MAIN GRID ===== */}
            <div className="px-0 pb-8 md:pb-10 2xl:pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 lg:gap-8 2xl:gap-9 items-start [contain:layout]">
                {/* ====== LEFT COLUMN (8/12) ====== */}
                <div className="lg:col-span-8 space-y-5 md:space-y-6 min-w-0">
                  {/* KPI Row — Sortable */}
                  <SortableContext items={layout.kpiOrder} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4 2xl:gap-4 items-stretch min-w-0 [grid-auto-rows:minmax(0,1fr)]">
                      {layout.kpiOrder.map((widgetId) => renderKpiWidget(widgetId))}
                    </div>
                  </SortableContext>

                  {showArtistBento && artistBentoBlock ? (
                    <div className="relative isolate min-w-0 pt-1">
                      <div
                        className="pointer-events-none absolute left-1/2 top-0 h-[280px] w-[min(640px,92%)] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[100px] dark:bg-emerald-900/12"
                        aria-hidden
                      />
                      {artistBentoBlock}
                    </div>
                  ) : null}

                  {/* Left Column Widgets — Sortable */}
                  <SortableContext items={layout.leftColumn} strategy={verticalListSortingStrategy}>
                    <div className="space-y-6">
                      {layout.leftColumn.map((widgetId) => {
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
                                              apt.status === 'confirmed' ? 'Confirmé' : 'En attente'
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
                    </div>
                  </SortableContext>
                </div>

                {/* ====== RIGHT COLUMN (4/12) ====== */}
                <SortableContext items={layout.rightColumn} strategy={verticalListSortingStrategy}>
                  <div className="lg:col-span-4 space-y-5 md:space-y-6 min-w-0">
                    {layout.rightColumn.map((widgetId) => {
                      if (widgetId === 'clients-deposits') {
                        return (
                          <OverviewSortableWidget
                            key={widgetId}
                            id={widgetId}
                            isEditMode={isEditMode}
                            onRemoveWidget={handleRemoveWidget}
                          >
                            <div className="prodify-card overflow-hidden">
                              <div className="px-5 pt-5 pb-0">
                                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                                  <button
                                    onClick={() => setRightPanelTab('clients')}
                                    className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${rightPanelTab === 'clients' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
                                  >
                                    Clients
                                  </button>
                                  <button
                                    onClick={() => setRightPanelTab('deposits')}
                                    className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${rightPanelTab === 'deposits' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
                                  >
                                    Acomptes
                                  </button>
                                </div>
                              </div>
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
                                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                        Nouveau client
                                      </span>
                                    </button>
                                    {topClients.length > 0 ? (
                                      <div className="space-y-1">
                                        {topClients.slice(0, 5).map((client) => (
                                          <button
                                            key={client.id}
                                            onClick={() => setActiveTab('clients')}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                                          >
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600">
                                              <ClientPhotoAvatar
                                                name={client.name}
                                                src={client.avatar}
                                                className="h-full w-full"
                                                textClassName="text-sm font-semibold text-zinc-600 dark:text-zinc-300"
                                              />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                                                  {client.name}
                                                </span>
                                                {(client.totalSpent ?? 0) >= 500 && (
                                                  <Star
                                                    className="w-4 h-4 shrink-0 fill-primary/85 text-primary"
                                                    strokeWidth={2}
                                                  />
                                                )}
                                              </div>
                                              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                                                {privacyMode ? '••••' : `${client.totalSpent}€`}
                                              </span>
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-zinc-400 text-center py-6">
                                        Aucun client
                                      </p>
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
                                            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center flex-shrink-0">
                                              <CreditCard className="w-4 h-4 text-zinc-300" />
                                            </div>
                                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">
                                              {apt.clientName || 'Client'}
                                            </span>
                                            <span className="text-sm font-bold text-numeric tabular-nums">
                                              {privacyMode ? '+••••' : `+${apt.deposit}€`}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-8">
                                        <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                                          <Wallet className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <p className="text-sm text-zinc-400">
                                          Aucun acompte récent
                                        </p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="px-5 pb-5">
                                <button
                                  onClick={() =>
                                    setActiveTab(
                                      rightPanelTab === 'clients' ? 'clients' : 'finance'
                                    )
                                  }
                                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                  Voir tout →
                                </button>
                              </div>
                            </div>
                          </OverviewSortableWidget>
                        );
                      }

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
                        const progress = Math.min((safeMonthlyRevenue / monthlyGoal) * 100, 100);

                        return (
                          <OverviewSortableWidget
                            key={widgetId}
                            id={widgetId}
                            isEditMode={isEditMode}
                            onRemoveWidget={handleRemoveWidget}
                          >
                            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/25">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-white/20">
                                  <Target className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-semibold">Objectif mensuel</p>
                              </div>
                              <div className="mb-3">
                                <div className="flex items-end justify-between mb-2">
                                  <span className="text-2xl font-bold">
                                    {euro(safeMonthlyRevenue)}
                                  </span>
                                  <span className="text-sm text-white/70">
                                    /{' '}
                                    {privacyMode
                                      ? '••••'
                                      : `${monthlyGoal.toLocaleString('fr-FR')}€`}
                                  </span>
                                </div>
                                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-white rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-white/70">
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
                              className="w-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/25 text-left group"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 rounded-xl bg-white/20">
                                  <Zap className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-semibold">Flash Designs</p>
                              </div>
                              <p className="text-2xl font-bold mb-1">
                                {customWidgets.length || 0} designs
                              </p>
                              <p className="text-xs text-white/70">Gérez vos flash disponibles →</p>
                            </button>
                          </OverviewSortableWidget>
                        );
                      }

                      if (widgetId === 'loyalty-program') {
                        const vipCount = clients.filter((c) => (c.totalSpent ?? 0) >= 500).length;

                        return (
                          <OverviewSortableWidget
                            key={widgetId}
                            id={widgetId}
                            isEditMode={isEditMode}
                            onRemoveWidget={handleRemoveWidget}
                          >
                            <div className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl p-5 text-white shadow-lg shadow-blue-700/25">
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
                                    {topClients.slice(0, 3).map((c) => (
                                      <div
                                        key={c.id}
                                        className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-sm font-bold"
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
              className="fixed inset-0 z-[500] bg-black/70 dark:bg-black/80"
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
    </>
  );
};
