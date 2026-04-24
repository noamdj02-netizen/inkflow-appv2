import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
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
  Phone,
  MessageCircle,
  Home,
  Settings,
  Zap,
  Grip,
  Move,
  GripVertical,
  X,
  Target,
  Sparkles,
  BarChart3,
  Gift,
  Heart,
  Award,
  Percent,
  Bell,
  FileText,
  MapPin,
  Share2,
  Check,
  Loader2,
  Camera,
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
import { AppointmentDayList } from './AppointmentDayList';
import { getVitrineSlug } from '../../lib/vitrineStorage';
import {
  getLayoutFromStorage,
  setLayoutToStorage,
  DEFAULT_LAYOUT,
  type DashboardLayout,
} from '../../lib/dashboardWidgetOrder';
import { useStudioPrivacy, formatEuroPrivacy } from '../../contexts/StudioPrivacyContext';
import type { Appointment, Client, FlashDesign, ProjectRequest } from '../../types';
import type { DashboardWidget } from './DashboardWidgets';
import { IconInkCap } from '../icons/InkCraftIcons';
import { StudioSetupChecklist } from './StudioSetupChecklist';
import { IconBox } from '../ui/IconBox';
import { LANDING_PRICING_URL } from '../../lib/urls';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { supabase } from '../../lib/supabase';
import { createStripeExpressLoginLink } from '../../lib/stripeClient';
import { useToast } from '../../contexts/ToastContext';

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
            className="p-1.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white cursor-grab active:cursor-grabbing shadow-lg"
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
            ? 'ring-2 ring-blue-500/50 ring-offset-2 dark:ring-offset-zinc-950 rounded-2xl'
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
            className="p-1.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white cursor-grab active:cursor-grabbing shadow-lg"
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
  nextClientOfDay: Appointment | null;
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
  rdvAlertUnpaidCount = 0,
  rdvAlertBientotCount = 0,
  setDismissedAlerts,
  setActiveTab,
  onAlertNavigate,
  setSelectedAppointment,
  onUpdateAppointment,
  setShowBookingModal,
  setSelectedFlash,
  setShowWidgetModal,
  pendingDemandesCount,
  studioSlug,
  studioId,
  useSupabase = false,
  recentDeposits = [],
  onAvatarClick,
  avatarUploading = false,
  flashDesigns = [],
  onSetupNavigate,
  availabilitySetupComplete,
  paymentsSetupComplete,
  studioSubscriptionStatus,
  trialEndsAt,
  onOpenBilling,
  pageTitleInShell = false,
}) => {
  const { privacyMode } = useStudioPrivacy();
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

  const quickGridVariants = useMemo(
    () => ({
      hidden: {},
      visible: prefersReducedMotion
        ? { transition: { duration: 0 } }
        : { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
    }),
    [prefersReducedMotion]
  );

  const quickTileVariants = useMemo(
    () => ({
      hidden: prefersReducedMotion ? { y: 0, opacity: 1 } : { y: 12, opacity: 0.88 },
      visible: prefersReducedMotion
        ? { y: 0, opacity: 1, transition: { duration: 0 } }
        : {
            y: 0,
            opacity: 1,
            transition: { type: 'spring' as const, stiffness: 500, damping: 34, mass: 0.7 },
          },
    }),
    [prefersReducedMotion]
  );

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
  const [isMdUp, setIsMdUp] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  );
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

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setIsMdUp(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  const vitrineSlug =
    studioSlug != null && studioSlug !== ''
      ? studioSlug
      : user?.studioName
        ? getVitrineSlug(user.studioName)
        : '';
  const upcomingAppointments = appointments
    .filter((a) => a.date > today && ['pending', 'confirmed'].includes(a.status))
    .sort((a, b) => a.date.localeCompare(b.date));
  const vipClients = clients.filter((c) => (c.totalSpent ?? 0) >= 500).length;
  const appointmentsThisMonth = appointments.filter((a) =>
    a.date.startsWith(now.toISOString().slice(0, 7))
  ).length;

  const unpaidCount = appointments.filter((a) => !a.deposit && a.status !== 'cancelled').length;
  const todayOrTomorrowCount = appointments.filter((a) => {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    return (
      (a.date === today || a.date === tomorrowStr) && ['pending', 'confirmed'].includes(a.status)
    );
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
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : null;
  const trendAppointments =
    lastMonthAppointments > 0
      ? Math.round(((appointmentsThisMonth - lastMonthAppointments) / lastMonthAppointments) * 100)
      : null;

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
        id: 'next-client',
        name: 'Prochain client',
        icon: UserPlus,
        color: 'blue',
        category: 'sidebar',
        description: 'Carte du prochain client',
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

  const nextClient = todayAppointments[0] || null;

  const greeting = (() => {
    const h = now.getHours();
    return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  })();

  /** Desktop KPI — cartes .prodify-card (relief portfolio, aligné index.css) */
  const desktopKpiShell =
    'prodify-card p-5 h-full flex flex-col justify-between min-h-[130px] min-w-0 ring-1 ring-inset ring-zinc-900/[0.04] dark:ring-white/[0.05]';
  const desktopKpiCaption =
    'text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tracking-tight shrink-0';
  const desktopKpiIconBtn =
    'w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors flex-shrink-0';
  /** Cartes KPI mobile : fond « secondary grouped » + bandeau sémantique (équivalent tint iOS) */
  /** Cartes & listes — mêmes jetons que revenu / stats (vue mobile CRM) */
  const crmCard =
    'rounded-2xl border border-zinc-200/90 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-900';
  const crmCardHeader =
    'px-4 py-3 flex items-baseline justify-between border-b border-zinc-200/80 dark:border-zinc-800';
  const crmSectionTitle = 'text-[16px] font-bold tracking-tight text-zinc-900 dark:text-white';
  const crmListLink = 'text-[13px] font-medium text-zinc-800 dark:text-zinc-200';
  const crmMuted = 'text-[12px] text-zinc-500 dark:text-zinc-400';

  const mobileKpiOuter =
    'h-full min-w-0 min-h-[128px] flex flex-row rounded-[1.25rem] border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#1C1C1E] shadow-[0_2px_12px_rgba(15,23,42,0.06)] dark:shadow-none overflow-hidden';
  const mobileKpiInner =
    'flex flex-1 min-h-0 min-w-0 flex-col justify-between gap-0.5 p-3.5 min-[400px]:p-4';
  /** Bandeau vertical KPI mobile — marque blue-600 */
  const mobileKpiStrip = {
    revenue: 'bg-blue-600 dark:bg-blue-500',
    deposits: 'bg-blue-600 dark:bg-blue-500',
    clients: 'bg-blue-600 dark:bg-blue-500',
    appointments: 'bg-blue-600 dark:bg-blue-500',
  } as const;
  const iosKpiCaption =
    'text-[12px] font-medium text-zinc-500 dark:text-zinc-400 leading-snug pr-1 tracking-tight';
  /** Chiffres KPI mobile — grands chiffres tabulaires, lisibles (Dynamic Type–friendly) */
  const iosKpiMetricWrap = 'mt-0.5 inline-flex items-baseline gap-0.5 flex-wrap min-w-0';
  const iosKpiMetricValue =
    'text-[28px] min-[400px]:text-[32px] font-semibold tabular-nums tracking-[-0.03em] text-zinc-900 dark:text-white leading-none';
  const iosKpiMetricSuffix =
    'text-[14px] min-[400px]:text-[15px] font-medium text-zinc-400 dark:text-zinc-500 leading-none tabular-nums select-none';
  /** 44×44 pt zone tactile (HIG) */
  const iosKpiIconBtn =
    'shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-zinc-100/95 dark:bg-zinc-800/95 active:scale-[0.97] active:opacity-80 transition-all motion-reduce:active:scale-100';
  /** Métadonnées sous le chiffre — pastille type footnote iOS */
  const iosKpiMetaPill =
    'inline-flex items-center rounded-full bg-zinc-100/95 dark:bg-zinc-800/90 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300';
  const iosKpiMetaPillSky =
    'inline-flex items-center rounded-full bg-zinc-200/90 dark:bg-zinc-600/30 px-2 py-1 text-[11px] font-medium text-zinc-800 dark:text-zinc-200';
  const iosKpiMetaPillViolet =
    'inline-flex items-center rounded-full bg-zinc-200/90 dark:bg-zinc-600/30 px-2 py-1 text-[11px] font-medium text-zinc-800 dark:text-zinc-200';
  const iosKpiMetaPillAmber =
    'inline-flex items-center gap-1.5 rounded-full bg-zinc-200/90 dark:bg-zinc-600/30 px-2 py-1 text-[11px] font-medium text-zinc-800 dark:text-zinc-200';

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
                      className={
                        isMdUp
                          ? 'w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400'
                          : 'w-4 h-4 text-zinc-600 dark:text-zinc-400'
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
                      <>{euro(monthlyRevenue)}</>
                    ) : (
                      <>
                        <span className={iosKpiMetricValue}>
                          {privacyMode ? '••••' : monthlyRevenue.toLocaleString('fr-FR')}
                        </span>
                        {!privacyMode && <span className={iosKpiMetricSuffix}>€</span>}
                      </>
                    )}
                  </p>
                  <div className={`${isMdUp ? 'mt-2' : 'mt-1'} flex flex-col gap-1`}>
                    {monthlyForecast > 0 &&
                      (isMdUp ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200/90 dark:bg-zinc-600/30 text-zinc-800 dark:text-zinc-200 w-fit">
                          {privacyMode ? '••••' : `+${monthlyForecast.toLocaleString('fr-FR')}€`} en
                          attente
                        </span>
                      ) : (
                        <p className={iosKpiMetaPillSky}>
                          {privacyMode
                            ? '•••• prévisionnel'
                            : `+${monthlyForecast.toLocaleString('fr-FR')}€ prévisionnel`}
                        </p>
                      ))}
                    <div className="flex items-end min-h-[20px]">
                      {trendRevenue !== null ? (
                        isMdUp ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200/90 dark:bg-zinc-600/30 text-zinc-800 dark:text-zinc-200">
                            {trendRevenue >= 0 ? '↑' : '↓'} {Math.abs(trendRevenue)}% vs mois
                            dernier
                          </span>
                        ) : (
                          <p className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium bg-zinc-200/90 text-zinc-800 dark:bg-zinc-600/30 dark:text-zinc-200">
                            {trendRevenue >= 0 ? '↑' : '↓'} {Math.abs(trendRevenue)}% vs mois
                            dernier
                          </p>
                        )
                      ) : isMdUp ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                          Ce mois
                        </span>
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
                      className={
                        isMdUp
                          ? 'w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400'
                          : 'w-4 h-4 text-zinc-600 dark:text-zinc-400'
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
                      <>{euro(pendingDeposits)}</>
                    ) : (
                      <>
                        <span className={iosKpiMetricValue}>
                          {privacyMode ? '••••' : pendingDeposits.toLocaleString('fr-FR')}
                        </span>
                        {!privacyMode && <span className={iosKpiMetricSuffix}>€</span>}
                      </>
                    )}
                  </p>
                  {isMdUp ? (
                    <div className="mt-2 min-h-[24px] flex items-end">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200/90 dark:bg-zinc-600/30 text-zinc-800 dark:text-zinc-200">
                        En attente
                      </span>
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
                      className={
                        isMdUp
                          ? 'w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400'
                          : 'w-4 h-4 text-zinc-600 dark:text-zinc-400'
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200/90 dark:bg-zinc-600/30 text-zinc-800 dark:text-zinc-200">
                          <Star
                            className="w-3 h-3 text-zinc-500 dark:text-zinc-400 shrink-0"
                            aria-hidden
                          />
                          {vipClients} VIP
                        </span>
                      </div>
                    ) : (
                      <p className={`mt-1 ${iosKpiMetaPillAmber}`}>
                        <Star
                          className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0"
                          aria-hidden
                        />
                        {vipClients} VIP
                      </p>
                    )
                  ) : isMdUp ? (
                    <div className="mt-2 min-h-[24px] flex items-end">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200/90 dark:bg-zinc-600/30 text-zinc-800 dark:text-zinc-200">
                        Total
                      </span>
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
                      className={
                        isMdUp
                          ? 'w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400'
                          : 'w-4 h-4 text-zinc-600 dark:text-zinc-400'
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
                  <div
                    className={`${isMdUp ? 'mt-2 min-h-[24px]' : 'mt-1 min-h-[20px]'} flex items-end`}
                  >
                    {trendAppointments !== null ? (
                      isMdUp ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200/90 dark:bg-zinc-600/30 text-zinc-800 dark:text-zinc-200">
                          {trendAppointments >= 0 ? '↑' : '↓'} {Math.abs(trendAppointments)}% vs
                          dernier mois
                        </span>
                      ) : (
                        <p className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium bg-zinc-200/90 text-zinc-800 dark:bg-zinc-600/30 dark:text-zinc-200">
                          {trendAppointments >= 0 ? '↑' : '↓'} {Math.abs(trendAppointments)}% vs
                          mois dernier
                        </p>
                      )
                    ) : isMdUp ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200/90 dark:bg-zinc-600/30 text-zinc-800 dark:text-zinc-200">
                        Ce mois
                      </span>
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

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {/* =====================================================
          MOBILE LAYOUT — monté uniquement si !isMdUp pour éviter les IDs @dnd-kit dupliqués
          (un seul arbre sortable actif dans le DndContext).
          ===================================================== */}
        {!isMdUp && (
          <div className="flex min-w-0 max-w-full flex-col gap-4 overflow-x-hidden bg-transparent pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))] antialiased font-sans [-webkit-font-smoothing:antialiased] sm:gap-5">
            {/* Accueil mobile — référence type CRM (clair, cartes blanches, donut, onglets pilule) */}
            <div className="px-0 pt-1 pb-1 safe-top">
              <motion.div className="flex flex-col gap-4" {...iosSpring(0)}>
                {/* Rangée titre + notifications + profil */}
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/90 bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm dark:bg-blue-500 dark:text-white">
                      <LayoutDashboard className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h1 className="truncate text-[17px] font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
                        Vue d&apos;ensemble
                      </h1>
                      <p className="truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                        {now.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                      {todayOrTomorrowCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('agenda')}
                          className="mt-2 inline-flex w-full max-w-full items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-left text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200/80 transition-colors active:scale-[0.99] dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/25 sm:mt-1.5 sm:w-auto"
                        >
                          <CalendarCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {todayOrTomorrowCount} RDV bientôt
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 self-start">
                    <button
                      type="button"
                      onClick={() => setActiveTab('notifications')}
                      className="relative flex h-11 w-11 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100 active:scale-[0.97] dark:text-zinc-300 dark:hover:bg-zinc-800"
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
                      {pendingDemandesCount + visibleAlerts.length > 0 && (
                        <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-0.5 text-[10px] font-bold tabular-nums leading-none text-white shadow-sm ring-2 ring-white dark:bg-red-500 dark:ring-zinc-900">
                          {pendingDemandesCount + visibleAlerts.length > 9
                            ? '9+'
                            : pendingDemandesCount + visibleAlerts.length}
                        </span>
                      )}
                    </button>
                    <motion.button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onAvatarClick) onAvatarClick();
                        else setActiveTab('settings');
                      }}
                      disabled={avatarUploading}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
                      className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-600 dark:bg-zinc-800"
                      aria-label={onAvatarClick ? 'Changer la photo de profil' : 'Paramètres'}
                    >
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                          {onAvatarClick ? (
                            <Camera
                              className="h-4 w-4 text-zinc-600 dark:text-zinc-300"
                              strokeWidth={2}
                              aria-hidden
                            />
                          ) : (
                            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                              {firstName ? firstName[0].toUpperCase() : '?'}
                            </span>
                          )}
                        </div>
                      )}
                      {avatarUploading && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden />
                        </span>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Sous-navigation pilule (réf. Home / My Tier / Activities) */}
                <div
                  className="flex gap-1 rounded-full bg-zinc-200/70 p-1 dark:bg-zinc-800/90"
                  role="tablist"
                  aria-label="Raccourcis accueil"
                >
                  <span
                    role="tab"
                    aria-selected
                    className="flex flex-1 items-center justify-center rounded-full bg-white py-2.5 text-center text-[13px] font-semibold text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-white"
                  >
                    Accueil
                  </span>
                  <button
                    type="button"
                    role="tab"
                    onClick={() => setActiveTab('requests')}
                    className="flex flex-1 items-center justify-center rounded-full py-2.5 text-center text-[13px] font-medium text-zinc-600 transition-colors active:scale-[0.98] dark:text-zinc-400"
                  >
                    Demandes
                  </button>
                  <button
                    type="button"
                    role="tab"
                    onClick={() => setActiveTab('agenda')}
                    className="flex flex-1 items-center justify-center rounded-full py-2.5 text-center text-[13px] font-medium text-zinc-600 transition-colors active:scale-[0.98] dark:text-zinc-400"
                  >
                    Agenda
                  </button>
                </div>

                {/* Carte métrique principale (revenu du mois + tendance) */}
                <div className={cn(crmCard, 'p-4')}>
                  <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">
                    Revenu du mois
                  </p>
                  <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                    {crmMonthRangeLabel}
                  </p>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
                    <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
                      <p className="text-[32px] font-bold leading-none tabular-nums tracking-tight text-zinc-900 dark:text-white">
                        {privacyMode ? '••••' : `${monthlyRevenue.toLocaleString('fr-FR')} €`}
                      </p>
                      {trendRevenue !== null && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-zinc-200/90 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-zinc-800 dark:bg-zinc-600/30 dark:text-zinc-200">
                          {trendRevenue >= 0 ? (
                            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                          )}
                          {trendRevenue >= 0 ? '+' : ''}
                          {trendRevenue}% vs mois dernier
                        </span>
                      )}
                    </div>
                    {(rdvAlertUnpaidCount > 0 || rdvAlertBientotCount > 0) && !privacyMode && (
                      <div
                        className="flex max-w-[48%] shrink-0 flex-col items-end gap-0.5 text-right"
                        role="status"
                        aria-label="Rappels rendez-vous"
                      >
                        {rdvAlertUnpaidCount > 0 && (
                          <button
                            type="button"
                            onClick={() => onAlertNavigate?.({ id: 'unpaid', type: 'warning' })}
                            className="text-[10px] font-semibold leading-snug text-blue-600 underline decoration-blue-600/30 underline-offset-2 transition-colors hover:text-blue-700 dark:text-blue-400 dark:decoration-blue-400/40 dark:hover:text-blue-300"
                          >
                            {rdvAlertUnpaidCount} sans acompte
                          </button>
                        )}
                        {rdvAlertBientotCount > 0 && (
                          <button
                            type="button"
                            onClick={() => onAlertNavigate?.({ id: '24h', type: 'info' })}
                            className="text-[10px] font-semibold leading-snug text-blue-600 underline decoration-blue-600/30 underline-offset-2 transition-colors hover:text-blue-700 dark:text-blue-400 dark:decoration-blue-400/40 dark:hover:text-blue-300"
                          >
                            {rdvAlertBientotCount} auj. ou demain
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex min-h-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                    <button
                      type="button"
                      onClick={() => setActiveTab('finance')}
                      className="group flex min-h-[48px] min-w-0 flex-1 items-center gap-3 rounded-2xl border border-blue-100/90 bg-white px-3.5 py-2.5 text-left shadow-sm ring-1 ring-blue-500/[0.06] transition-[transform,box-shadow,background-color,border-color] hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-md active:scale-[0.99] dark:border-blue-500/20 dark:bg-zinc-900/40 dark:ring-white/[0.04] dark:hover:border-blue-500/35 dark:hover:bg-blue-500/10"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm dark:bg-blue-500">
                        <Wallet className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold leading-snug text-zinc-900 dark:text-white">
                          Acomptes &amp; encaissements
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium text-blue-600 dark:text-blue-400">
                          Finance
                        </span>
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-blue-500 dark:text-zinc-500"
                        strokeWidth={2}
                        aria-hidden
                      />
                    </button>
                    {stripeConnectAccountId && useSupabase && (
                      <button
                        type="button"
                        onClick={() => void openStripeExpressDashboard()}
                        disabled={stripeExpressOpening}
                        title="Tableau de bord Stripe (Express)"
                        className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 self-stretch rounded-2xl border border-blue-200/90 bg-white px-4 py-2.5 text-[12px] font-semibold text-blue-600 shadow-sm transition-[transform,background-color] hover:bg-blue-50 active:scale-[0.99] disabled:opacity-60 dark:border-blue-500/30 dark:bg-zinc-900/40 dark:text-blue-400 dark:hover:bg-blue-500/10 sm:min-w-[5.5rem]"
                      >
                        {stripeExpressOpening ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
                        )}
                        <span className="max-[380px]:sr-only">Stripe</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions rapides — sous le revenu du mois */}
                <motion.div className="w-full" {...iosSpring(0.04)}>
                  <div className="rounded-[22px] bg-white/75 p-2 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_4px_14px_-6px_rgba(15,23,42,0.07)] ring-1 ring-zinc-200/75 dark:bg-zinc-900/45 dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)] dark:ring-zinc-800/90">
                    <motion.div
                      className="grid min-w-0 grid-cols-2 gap-2 min-[400px]:grid-cols-4 min-[400px]:gap-2.5"
                      variants={quickGridVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.button
                        type="button"
                        onClick={() => {
                          setSelectedFlash(null);
                          setShowBookingModal(true);
                        }}
                        variants={quickTileVariants}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        className="flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-zinc-200/90 bg-white/95 px-1 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-900/85 dark:shadow-none min-[400px]:min-h-[52px] motion-reduce:active:scale-100 active:scale-[0.98] active:opacity-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F2F2F7] dark:focus-visible:ring-offset-black [@media(hover:hover)]:hover:border-zinc-300/90 dark:[@media(hover:hover)]:hover:border-zinc-600"
                      >
                        <Plus
                          className="h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-300"
                          strokeWidth={2}
                          aria-hidden
                        />
                        <span className="px-0.5 text-center text-[11px] font-medium leading-tight text-zinc-600 dark:text-zinc-400 min-[400px]:text-[10px]">
                          Nouveau RDV
                        </span>
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => setActiveTab('flash')}
                        variants={quickTileVariants}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        className="flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-zinc-200/90 bg-white/95 px-1 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-900/85 dark:shadow-none min-[400px]:min-h-[52px] motion-reduce:active:scale-100 active:scale-[0.98] active:opacity-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F2F2F7] dark:focus-visible:ring-offset-black [@media(hover:hover)]:hover:border-zinc-300/90 dark:[@media(hover:hover)]:hover:border-zinc-600"
                      >
                        <Zap
                          className="h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-300"
                          strokeWidth={2}
                          aria-hidden
                        />
                        <span className="text-center text-[11px] font-medium leading-tight text-zinc-600 dark:text-zinc-400 min-[400px]:text-[10px]">
                          Flash
                        </span>
                      </motion.button>
                      {vitrineSlug ? (
                        <motion.a
                          href={`/studio/${vitrineSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          variants={quickTileVariants}
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          className="flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-zinc-200/90 bg-white/95 px-1 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-900/85 dark:shadow-none min-[400px]:min-h-[52px] motion-reduce:active:scale-100 active:scale-[0.98] active:opacity-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F2F2F7] dark:focus-visible:ring-offset-black [@media(hover:hover)]:hover:border-zinc-300/90 dark:[@media(hover:hover)]:hover:border-zinc-600"
                        >
                          <ExternalLink
                            className="h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-300"
                            strokeWidth={2}
                            aria-hidden
                          />
                          <span className="text-center text-[11px] font-medium leading-tight text-zinc-600 dark:text-zinc-400 min-[400px]:text-[10px]">
                            Vitrine
                          </span>
                        </motion.a>
                      ) : (
                        <motion.div
                          variants={quickTileVariants}
                          className="flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-1 py-2.5 opacity-60 pointer-events-none dark:border-zinc-700 dark:bg-zinc-900/40 min-[400px]:min-h-[52px]"
                        >
                          <ExternalLink
                            className="h-5 w-5 shrink-0 text-zinc-400"
                            strokeWidth={2}
                            aria-hidden
                          />
                          <span className="text-center text-[11px] font-medium leading-tight text-zinc-400 min-[400px]:text-[10px]">
                            Vitrine
                          </span>
                        </motion.div>
                      )}
                      <motion.button
                        type="button"
                        onClick={() => setActiveTab('requests')}
                        variants={quickTileVariants}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        aria-label={
                          pendingDemandesCount > 0
                            ? `Demandes, ${pendingDemandesCount} en attente`
                            : 'Demandes'
                        }
                        className="relative flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-zinc-200/90 bg-white/95 px-1 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-900/85 dark:shadow-none min-[400px]:min-h-[52px] motion-reduce:active:scale-100 active:scale-[0.98] active:opacity-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F2F2F7] dark:focus-visible:ring-offset-black [@media(hover:hover)]:hover:border-zinc-300/90 dark:[@media(hover:hover)]:hover:border-zinc-600"
                      >
                        {pendingDemandesCount > 0 && (
                          <span
                            aria-hidden
                            className="absolute right-1 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-0.5 text-[10px] font-bold tabular-nums leading-none text-white shadow-sm ring-2 ring-white dark:bg-red-500 dark:ring-zinc-900"
                          >
                            {pendingDemandesCount > 9 ? '9+' : pendingDemandesCount}
                          </span>
                        )}
                        <Inbox
                          className="h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-300"
                          strokeWidth={2}
                          aria-hidden
                        />
                        <span className="text-center text-[11px] font-medium leading-tight text-zinc-600 dark:text-zinc-400 min-[400px]:text-[10px]">
                          Demandes
                        </span>
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Bloc statistiques : toggle + période + donut */}
                <div className={cn(crmCard, 'p-4')}>
                  <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
                    <div className="flex flex-1 gap-1 rounded-full bg-zinc-100 p-0.5 dark:bg-zinc-800/80">
                      <button
                        type="button"
                        onClick={() => setInsightView('rdv')}
                        className={cn(
                          'flex-1 rounded-full py-2 text-center text-[12px] font-semibold transition-colors',
                          insightView === 'rdv'
                            ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-white'
                            : 'text-zinc-500 dark:text-zinc-400'
                        )}
                      >
                        RDV
                      </button>
                      <button
                        type="button"
                        onClick={() => setInsightView('demandes')}
                        className={cn(
                          'flex-1 rounded-full py-2 text-center text-[12px] font-semibold transition-colors',
                          insightView === 'demandes'
                            ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-white'
                            : 'text-zinc-500 dark:text-zinc-400'
                        )}
                      >
                        Demandes
                      </button>
                    </div>
                    <div className="flex items-center gap-1 self-end min-[400px]:self-auto">
                      <span className="text-[12px] text-zinc-500 dark:text-zinc-400">Période</span>
                      <div className="relative">
                        <select
                          value={insightPeriod}
                          onChange={(e) => setInsightPeriod(e.target.value as 'week' | 'month')}
                          className="h-9 appearance-none rounded-lg border border-zinc-200 bg-white py-0 pl-2.5 pr-8 text-[13px] font-medium text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          aria-label="Période des statistiques"
                        >
                          <option value="week">7 jours</option>
                          <option value="month">Mois en cours</option>
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
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

                {/* Pills rappels (acomptes — RDV proches affichés dans l’en-tête Vue d’ensemble) */}
                {unpaidCount > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('requests')}
                      className="flex items-center gap-1.5 rounded-full bg-zinc-200/90 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm transition-transform active:scale-[0.98] dark:bg-zinc-700/50 dark:text-zinc-100"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      {unpaidCount} sans acompte
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('agenda')}
                  className={cn(
                    'flex w-full min-h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-100/80 py-2.5 text-[13px] font-semibold text-zinc-900 shadow-[0_2px_12px_rgba(15,23,42,0.05)] active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-100'
                  )}
                  aria-label={`${todayAppointments.length} rendez-vous aujourd’hui, ouvrir l’agenda`}
                >
                  <Calendar className="h-4 w-4" strokeWidth={2} aria-hidden />
                  <span className="tabular-nums">{todayAppointments.length}</span>
                  <span>RDV aujourd’hui</span>
                </button>
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

            {flashDesigns[0] && (
              <div className="px-0">
                <div
                  className={cn(
                    'flex min-[400px]:gap-4 min-[400px]:p-4',
                    'items-start gap-3 p-3.5',
                    crmCard
                  )}
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-inset ring-black/[0.06] dark:bg-zinc-800 dark:ring-white/[0.08] min-[400px]:h-[72px] min-[400px]:w-[72px]">
                    <img
                      src={flashDesigns[0].imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800/90">
                      <IconInkCap
                        className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400"
                        aria-hidden
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 dark:text-zinc-400">
                        Flash du jour
                      </span>
                    </div>
                    <p className="truncate text-sm font-semibold leading-snug text-zinc-900 dark:text-white">
                      {flashDesigns[0].title}
                    </p>
                    <div className="mt-3 flex min-h-[44px] flex-col gap-2 min-[400px]:min-h-0 min-[400px]:flex-row min-[400px]:flex-wrap">
                      <button
                        type="button"
                        onClick={() => setActiveTab('flash')}
                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-zinc-900 px-3.5 text-xs font-semibold text-white transition-transform touch-manipulation active:scale-[0.98] dark:bg-white dark:text-zinc-900 min-[400px]:min-h-0 min-[400px]:w-auto min-[400px]:py-1.5"
                      >
                        Galerie Flash
                      </button>
                      {vitrineSlug ? (
                        <a
                          href={`/studio/${vitrineSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 transition-transform touch-manipulation active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200 min-[400px]:min-h-0 min-[400px]:w-auto min-[400px]:py-1.5"
                        >
                          Vitrine publique
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content — mêmes jetons cartes CRM */}
            <motion.div className="px-0 flex flex-col gap-4" {...iosSpring(0.12)}>
              {/* Prochain client — une seule zone cliquable, infos fusionnées (moins de blocs) */}
              {nextClient && (
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(nextClient)}
                  className={cn(
                    crmCard,
                    'w-full p-2.5 flex items-center gap-2.5 text-left active:scale-[0.99] transition-transform touch-manipulation min-h-[52px]'
                  )}
                  aria-label={`Ouvrir le rendez-vous de ${nextClient.clientName || 'client'} à ${nextClient.time || ''}`}
                >
                  <img
                    src={nextClient.clientAvatar || '/images/avatar-client-default.png'}
                    alt=""
                    className="w-9 h-9 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200/80 dark:border-zinc-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {nextClient.clientName}
                      </p>
                      <span className="text-xs font-semibold tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0">
                        {nextClient.time || '--:--'}
                      </span>
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
                  <ChevronRight
                    className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
              )}

              {/* Widget "Actions Requises" — affiché uniquement si demandes en attente */}
              {pendingDemandesCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  className={cn(
                    crmCard,
                    'w-full border-l-4 border-l-zinc-500 pl-3.5 p-3 flex items-center gap-3 text-left active:scale-[0.99] transition-transform touch-manipulation min-h-[52px] dark:border-l-zinc-500'
                  )}
                  aria-label={`Voir les ${pendingDemandesCount} demande${pendingDemandesCount > 1 ? 's' : ''} en attente`}
                >
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center shrink-0">
                    <Inbox
                      className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                      {pendingDemandesCount} demande{pendingDemandesCount > 1 ? 's' : ''} en attente
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Action requise · Répondre maintenant
                    </p>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
              )}

              {/* KPIs — encart « Ce mois » (même peau que revenu / stats) */}
              <div className={cn(crmCard, 'p-4')}>
                <div className="flex flex-col gap-2 min-[380px]:flex-row min-[380px]:items-end min-[380px]:justify-between min-[380px]:gap-3 sm:pb-0">
                  <div className="min-w-0">
                    <h2 className="text-[13px] font-semibold text-zinc-900 dark:text-white">
                      Ce mois
                    </h2>
                    <p className={cn(crmMuted, 'mt-0.5')}>Indicateurs clés</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-stretch min-[380px]:self-auto justify-end min-[380px]:pb-0.5">
                    <button
                      type="button"
                      onClick={() => setIsEditMode((v) => !v)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-sm min-[400px]:text-[15px] font-medium transition-colors active:scale-[0.98] touch-manipulation ${
                        isEditMode
                          ? 'bg-blue-600 text-white dark:bg-blue-500'
                          : 'border border-zinc-200/90 bg-zinc-50/80 text-blue-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-blue-400'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4 shrink-0" />
                      {isEditMode ? 'OK' : 'Widgets'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('analytics')}
                      className={cn(
                        'rounded-xl px-2 py-1.5 text-sm font-medium min-[400px]:px-1 min-[400px]:py-1',
                        'active:opacity-70 touch-manipulation',
                        crmListLink
                      )}
                    >
                      Tout
                    </button>
                  </div>
                </div>
                {!isMdUp ? (
                  <SortableContext items={layout.kpiOrder} strategy={rectSortingStrategy}>
                    <div className="mt-3 grid grid-cols-2 gap-3 min-[400px]:gap-3.5 items-stretch min-w-0 [contain:layout] [grid-auto-rows:minmax(0,1fr)]">
                      {layout.kpiOrder.map((widgetId) => renderKpiWidget(widgetId))}
                    </div>
                  </SortableContext>
                ) : null}
              </div>

              {/* Aujourd&apos;hui */}
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
                            className={`w-5 h-5 flex-shrink-0 ${needsDeposit ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-300 dark:text-zinc-600'}`}
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

              {/* Upcoming Appointments */}
              {upcomingAppointments.length > 0 && (
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
                  <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                    {upcomingAppointments.slice(0, 3).map((apt) => (
                      <button
                        key={apt.id}
                        type="button"
                        onClick={() => setSelectedAppointment(apt)}
                        className="w-full flex items-center gap-3 px-4 py-3 min-h-[52px] active:bg-zinc-100/80 dark:active:bg-zinc-800/60 transition-colors text-left"
                      >
                        <span className="text-[15px] text-zinc-500 dark:text-zinc-400 min-w-[3.25rem] tabular-nums">
                          {new Date(apt.date + 'T00:00').toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="text-[17px] font-normal text-zinc-900 dark:text-white truncate flex-1">
                          {apt.clientName}
                        </span>
                        <span
                          className={`inline-flex items-center justify-center min-w-[2rem] min-h-[2rem] rounded-lg ${
                            apt.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                          title={apt.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                        >
                          {apt.status === 'confirmed' ? (
                            <Check className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
                          ) : (
                            <Clock className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Top clients */}
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
                        <div className="w-10 h-10 rounded-xl bg-zinc-200/80 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {client.avatar ? (
                            <img
                              src={client.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-zinc-600 dark:text-zinc-300 text-sm font-semibold">
                              {client.name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[17px] font-normal text-zinc-900 dark:text-white truncate">
                              {client.name}
                            </span>
                            {(client.totalSpent ?? 0) >= 500 && (
                              <Star className="w-3.5 h-3.5 text-blue-600 fill-blue-600/90 dark:text-blue-400 dark:fill-blue-400/80 shrink-0" />
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
          </div>
        )}

        {/* =====================================================
          DESKTOP LAYOUT — monté uniquement si isMdUp (pas de doublon d’IDs avec la vue mobile)
          ===================================================== */}
        {isMdUp && (
          <div className="min-h-full w-full max-w-[min(1800px,100%)] mx-auto isolate">
            {/* ===== HEADER — typo display + hiérarchie type showcase ===== */}
            <div className="px-0 pt-5 pb-5 md:pt-6 md:pb-6 2xl:pt-7 2xl:pb-7">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 md:gap-5 2xl:gap-6">
                {/* Left: Greeting + Pills */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 mb-2 tracking-wide first-letter:uppercase">
                    {now.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {pageTitleInShell ? (
                      <h2 className="font-display text-[1.75rem] sm:text-[2rem] lg:text-[2.125rem] 2xl:text-[2.25rem] font-bold tracking-[-0.04em] text-zinc-900 dark:text-white">
                        {greeting}
                        {firstName ? `, ${firstName}` : ''}
                      </h2>
                    ) : (
                      <h1 className="font-display text-[1.75rem] sm:text-[2rem] lg:text-[2.125rem] 2xl:text-[2.25rem] font-bold tracking-[-0.04em] text-zinc-900 dark:text-white">
                        {greeting}
                        {firstName ? `, ${firstName}` : ''}
                      </h1>
                    )}
                    {/* Compact Alert Pills */}
                    {unpaidCount > 0 && (
                      <button
                        onClick={() => setActiveTab('requests')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
                        {unpaidCount} sans acompte
                      </button>
                    )}
                    {todayOrTomorrowCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-medium">
                        <CalendarCheck className="w-4 h-4 shrink-0" strokeWidth={2} />
                        {todayOrTomorrowCount} RDV bientôt
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
                    {user?.studioName && (
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {user.studioName}
                      </span>
                    )}
                    {user?.studioName && (
                      <span className="text-zinc-400 dark:text-zinc-500" aria-hidden>
                        {' '}
                        ·{' '}
                      </span>
                    )}
                    <span>
                      {todayAppointments.length} RDV aujourd’hui
                      {pendingDemandesCount > 0
                        ? ` · ${pendingDemandesCount} demande${pendingDemandesCount > 1 ? 's' : ''} en attente`
                        : ''}
                    </span>
                  </p>
                </div>

                {/* Right: actions — groupe visuel façon barre d’outils soft */}
                <div className="flex items-center gap-1.5 flex-wrap rounded-2xl border border-zinc-200/90 bg-white/90 p-1.5 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-zinc-900/[0.04] backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/55 dark:ring-white/[0.06] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_4px_12px_rgba(0,0,0,0.15)]">
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
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:gap-4 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <IconBox icon={Move} variant="blue" size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          Mode personnalisation
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Glissez les widgets ou ajoutez-en de nouveaux
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowWidgetPicker(true)}
                      className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 shrink-0 w-full min-[520px]:w-auto"
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
                                      <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                                        {euro(periodRevenue ?? totalRevenue)}
                                      </p>
                                      {periodTrend !== null && (
                                        <span
                                          className={`text-sm font-semibold ${periodTrend >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`}
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
                                    <p className="text-lg font-semibold text-zinc-900 dark:text-white mt-0.5">
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
                                            <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
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
                                              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 tabular-nums">
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
                                            className={`inline-flex items-center justify-center min-w-[1.75rem] min-h-[1.75rem] rounded-lg ${
                                              apt.status === 'confirmed'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
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
                                    <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                      Stats rapides
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="text-center p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10">
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                      {confirmedApts}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                      Confirmés
                                    </p>
                                  </div>
                                  <div className="text-center p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80">
                                    <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
                                      {pendingApts}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                      En attente
                                    </p>
                                  </div>
                                  <div className="text-center p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10">
                                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
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
                                    <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                                      <CalendarCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                                          ? 'bg-blue-600 text-white'
                                          : day.count > 0
                                            ? 'bg-zinc-100 dark:bg-zinc-800'
                                            : 'bg-zinc-50 dark:bg-zinc-800/50'
                                      }`}
                                    >
                                      <p
                                        className={`text-[10px] uppercase font-semibold ${i === 0 ? 'text-white/70' : 'text-zinc-400 dark:text-zinc-500'}`}
                                      >
                                        {day.dayName}
                                      </p>
                                      <p
                                        className={`text-lg font-bold ${i === 0 ? '' : 'text-zinc-900 dark:text-white'}`}
                                      >
                                        {day.dayNum}
                                      </p>
                                      {day.count > 0 && (
                                        <p
                                          className={`text-[10px] font-semibold mt-1 ${i === 0 ? 'text-white/80' : 'text-blue-600 dark:text-blue-400'}`}
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
                      if (widgetId === 'next-client') {
                        return nextClient ? (
                          <OverviewSortableWidget
                            key={widgetId}
                            id={widgetId}
                            isEditMode={isEditMode}
                            onRemoveWidget={handleRemoveWidget}
                          >
                            <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 rounded-3xl p-6 text-white shadow-[0_20px_50px_-12px_rgba(30,64,175,0.45)] dark:shadow-[0_24px_60px_-16px_rgba(0,0,0,0.65)] relative overflow-hidden">
                              <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4" />
                                <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full blur-2xl -translate-x-1/3 translate-y-1/3" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                              </div>
                              <div className="relative z-10">
                                <div className="flex items-center justify-between mb-5">
                                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
                                    Prochain client
                                  </span>
                                  <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/15 text-[10px] font-semibold tabular-nums">
                                    {nextClient.time || '--:--'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                  <img
                                    src={
                                      nextClient.clientAvatar ||
                                      '/gallery/photo-handsome-unshaven-guy-looks-with-pleasant-expression-directly-camera.jpg'
                                    }
                                    alt={nextClient.clientName || 'Client'}
                                    className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border-2 border-white/30 shadow-lg"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xl font-bold truncate mb-1">
                                      {nextClient.clientName}
                                    </p>
                                    <p className="text-sm text-white/70">
                                      {nextClient.service || 'Tatouage'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                      {nextClient.duration && (
                                        <span className="flex items-center gap-1 text-white/70">
                                          <Clock className="w-4 h-4 shrink-0" strokeWidth={2} />{' '}
                                          {nextClient.duration}min
                                        </span>
                                      )}
                                      {nextClient.price && (
                                        <span className="font-bold text-white">
                                          {privacyMode ? '••••' : `${nextClient.price}€`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => setSelectedAppointment(nextClient)}
                                    className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-white text-blue-600 text-sm font-bold hover:bg-zinc-50 transition-all shadow-md shadow-blue-900/20 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
                                  >
                                    Voir le RDV
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedAppointment(nextClient);
                                      setActiveTab('messaging');
                                    }}
                                    className="p-3.5 rounded-xl bg-white/12 backdrop-blur-sm border border-white/25 text-white hover:bg-white/20 transition-colors min-h-[48px] min-w-[48px] inline-flex items-center justify-center"
                                    title="Envoyer un message"
                                    type="button"
                                  >
                                    <MessageCircle className="w-5 h-5" aria-hidden />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </OverviewSortableWidget>
                        ) : (
                          <OverviewSortableWidget
                            key={widgetId}
                            id={widgetId}
                            isEditMode={isEditMode}
                            onRemoveWidget={handleRemoveWidget}
                          >
                            <div className="prodify-card p-6 text-center">
                              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-6 h-6 text-zinc-400" />
                              </div>
                              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                                Aucun RDV aujourd’hui
                              </p>
                              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
                                Idéal pour préparer des flashs, du matériel ou la vitrine — ou
                                bloquer un créneau tout de suite.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFlash(null);
                                  setShowBookingModal(true);
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm transition-all active:scale-[0.98] "
                              >
                                <Plus className="w-4 h-4 shrink-0" aria-hidden />
                                Planifier un RDV
                              </button>
                            </div>
                          </OverviewSortableWidget>
                        );
                      }

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
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                              {client.avatar ? (
                                                <img
                                                  src={client.avatar}
                                                  alt=""
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <span className="text-zinc-600 dark:text-zinc-300 text-sm font-semibold">
                                                  {client.name?.charAt(0)}
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                                                  {client.name}
                                                </span>
                                                {(client.totalSpent ?? 0) >= 500 && (
                                                  <Star
                                                    className="w-4 h-4 shrink-0 text-blue-600 fill-blue-600/90"
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
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
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
                                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/10">
                                  <Inbox className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/10">
                                  <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                                  <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
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
                        const progress = Math.min((monthlyRevenue / monthlyGoal) * 100, 100);

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
                                  <span className="text-2xl font-bold">{euro(monthlyRevenue)}</span>
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
                                    {topClients.slice(0, 3).map((c, i) => (
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
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-blue-600 dark:text-blue-400" />
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
                                  className="flex items-start gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left group"
                                >
                                  <div
                                    className={`p-2.5 rounded-xl bg-${widget.color}-100 dark:bg-${widget.color}-500/20 group-hover:scale-110 transition-transform`}
                                  >
                                    <Icon
                                      className={`w-5 h-5 text-${widget.color}-600 dark:text-${widget.color}-400`}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                      {widget.name}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                                      {widget.description}
                                    </p>
                                  </div>
                                  <Plus className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
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
                                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left group"
                                >
                                  <div
                                    className={`p-3 rounded-xl bg-${widget.color}-100 dark:bg-${widget.color}-500/20 group-hover:scale-110 transition-transform`}
                                  >
                                    <Icon
                                      className={`w-6 h-6 text-${widget.color}-600 dark:text-${widget.color}-400`}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                      {widget.name}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                      {widget.description}
                                    </p>
                                  </div>
                                  <Plus className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors" />
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
                                  className="flex items-start gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left group"
                                >
                                  <div
                                    className={`p-2.5 rounded-xl bg-${widget.color}-100 dark:bg-${widget.color}-500/20 group-hover:scale-110 transition-transform`}
                                  >
                                    <Icon
                                      className={`w-5 h-5 text-${widget.color}-600 dark:text-${widget.color}-400`}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                      {widget.name}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                                      {widget.description}
                                    </p>
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
