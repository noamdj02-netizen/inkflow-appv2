/**
 * DashboardOverviewTab — Refactored
 * ──────────────────────────────────
 * Organized structure:
 * • Composables & helpers (utilities, constants)
 * • Component library (sortable widgets, mini-cards, KPI shells)
 * • Render logic (mobile, desktop)
 * • Main component
 *
 * Key improvements:
 * ✓ Extracted styling into design tokens & classes
 * ✓ Separated mobile/desktop render paths clearly
 * ✓ Reusable widget render factories
 * ✓ Better prop drilling & state management
 */

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
  LucideIcon,
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
import { useBreakpointMd } from '../../hooks/useMediaQuery';
import type { Appointment, Client, FlashDesign, ProjectRequest } from '../../types';
import type { DashboardWidget } from './DashboardWidgets';
import { StudioSetupChecklist } from './StudioSetupChecklist';
import { StudioPresenceMiniCard } from './StudioPresenceMiniCard';
import { IconBox } from '../ui/IconBox';
import { LANDING_PRICING_URL } from '../../lib/urls';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { supabase } from '../../lib/supabase';
import { createStripeExpressLoginLink } from '../../lib/stripeClient';
import { useToast } from '../../contexts/ToastContext';
import { ClientPhotoAvatar } from '../common/ClientPhotoAvatar';

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const MS_PER_DAY = 86400000;

/** Design token classes for consistent theming */
const TOKENS = {
  // Cards & surfaces
  card: {
    base: 'rounded-3xl border border-zinc-200/80 bg-white/95 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70',
    desktop: 'rounded-[1.25rem] p-6 ring-1 ring-inset ring-zinc-900/[0.04] dark:ring-white/[0.05]',
  },
  // KPI shells (mobile & desktop)
  kpi: {
    desktop: 'p-5 h-full flex flex-col justify-between min-h-[130px] min-w-0',
    mobile: {
      outer:
        'h-full min-w-0 min-h-[128px] flex flex-row rounded-[1.25rem] border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#1C1C1E] shadow-[0_2px_12px_rgba(15,23,42,0.06)] dark:shadow-none overflow-hidden',
      inner: 'flex flex-1 min-h-0 min-w-0 flex-col justify-between gap-0.5 p-3.5 min-[400px]:p-4',
      strip: {
        revenue: 'bg-blue-600 dark:bg-blue-500',
        deposits: 'bg-blue-600 dark:bg-blue-500',
        clients: 'bg-blue-600 dark:bg-blue-500',
        appointments: 'bg-blue-600 dark:bg-blue-500',
      },
    },
  },
  // Typography & labels
  labels: {
    desktopKpiCaption:
      'text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tracking-tight shrink-0',
    mobileKpiCaption:
      'text-[12px] font-medium text-zinc-500 dark:text-zinc-400 leading-snug pr-1 tracking-tight',
    sectionTitle: 'text-[16px] font-bold tracking-tight text-zinc-900 dark:text-white',
    sectionMuted: 'text-[12px] text-zinc-500 dark:text-zinc-400',
    kpiMetricValue:
      'text-[28px] min-[400px]:text-[32px] font-semibold tabular-nums tracking-[-0.03em] text-numeric leading-none',
    kpiMetricSuffix:
      'text-[14px] min-[400px]:text-[15px] font-medium text-numeric-muted leading-none tabular-nums select-none',
  },
  // Buttons & interactions
  buttons: {
    kpiIconDesktop:
      'w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors flex-shrink-0',
    kpiIconMobile:
      'shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-zinc-100/95 dark:bg-zinc-800/95 active:scale-[0.97] active:opacity-80 transition-all motion-reduce:active:scale-100',
  },
  // Badges & pills
  badges: {
    pending:
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
    neutral:
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200/90 text-zinc-800 dark:bg-zinc-600/30 dark:text-zinc-200',
    vip: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200',
    growth:
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
    decline:
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function getTrialDaysRemaining(trialEndsAt: string | null | undefined): number | null {
  if (!trialEndsAt?.trim()) return null;
  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / MS_PER_DAY);
}

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
    return { ...base, border: 'border-l-4 border-l-zinc-500 dark:border-l-zinc-500' };
  }
  return base;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS — Shared UI Elements
// ═══════════════════════════════════════════════════════════════════════════

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

interface OverviewTrialBannerProps {
  message: string;
  onOpenBilling?: () => void;
  className?: string;
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

interface OverviewActivityAlertsProps {
  alerts: { id: string; type: 'warning' | 'info'; msg: string; cta: string }[];
  setDismissedAlerts: React.Dispatch<React.SetStateAction<Set<string>>>;
  onAlertNavigate?: (alert: { id: string; type: string }) => void;
  className?: string;
}

function OverviewActivityAlerts({
  alerts,
  setDismissedAlerts,
  onAlertNavigate,
  className = '',
}: OverviewActivityAlertsProps) {
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

// ═══════════════════════════════════════════════════════════════════════════
// KPI WIDGET FACTORY — Mobile & Desktop
// ═══════════════════════════════════════════════════════════════════════════

type KpiRenderProps = {
  isMdUp: boolean;
  isEditMode: boolean;
  onRemoveWidget: (id: string) => void;
  onNavigate: (tab: TabId) => void;
  euro: (n: number) => string;
  privacyMode: boolean;
};

function renderKpiRevenue(
  widgetId: string,
  props: KpiRenderProps & {
    monthlyRevenue: number;
    monthlyForecast: number;
    trendRevenue: number | null;
  }
) {
  const {
    isMdUp,
    isEditMode,
    onRemoveWidget,
    onNavigate,
    euro,
    privacyMode,
    monthlyRevenue,
    monthlyForecast,
    trendRevenue,
  } = props;

  return (
    <OverviewSortableKpi
      key={widgetId}
      id={widgetId}
      isEditMode={isEditMode}
      onRemoveWidget={onRemoveWidget}
      isMdUp={isMdUp}
    >
      <div
        className={
          isMdUp ? `${TOKENS.card.desktop} ${TOKENS.kpi.desktop}` : TOKENS.kpi.mobile.outer
        }
      >
        {!isMdUp && (
          <div
            className={`w-[3px] shrink-0 self-stretch ${TOKENS.kpi.mobile.strip.revenue}`}
            aria-hidden
          />
        )}
        <div className={isMdUp ? 'contents' : TOKENS.kpi.mobile.inner}>
          <div className="flex items-start justify-between gap-2">
            <span
              className={isMdUp ? TOKENS.labels.desktopKpiCaption : TOKENS.labels.mobileKpiCaption}
            >
              Revenu du mois
            </span>
            <button
              type="button"
              onClick={() => onNavigate('finance')}
              className={isMdUp ? TOKENS.buttons.kpiIconDesktop : TOKENS.buttons.kpiIconMobile}
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
                  ? 'text-2xl font-bold text-numeric tabular-nums tracking-tight mt-2'
                  : 'inline-flex items-baseline gap-0.5 flex-wrap min-w-0 mt-0.5'
              }
            >
              {isMdUp ? (
                <>{euro(monthlyRevenue)}</>
              ) : (
                <>
                  <span className={TOKENS.labels.kpiMetricValue}>
                    {privacyMode ? '••••' : monthlyRevenue.toLocaleString('fr-FR')}
                  </span>
                  {!privacyMode && <span className={TOKENS.labels.kpiMetricSuffix}>€</span>}
                </>
              )}
            </p>
            <div className={`${isMdUp ? 'mt-2' : 'mt-1'} flex flex-col gap-1`}>
              {monthlyForecast > 0 && (
                <span className={TOKENS.badges.pending}>
                  {privacyMode ? '••••' : `+${monthlyForecast.toLocaleString('fr-FR')}€`} en attente
                </span>
              )}
              {trendRevenue !== null && (
                <span className={trendRevenue >= 0 ? TOKENS.badges.growth : TOKENS.badges.decline}>
                  {trendRevenue >= 0 ? '↑' : '↓'} {Math.abs(trendRevenue)}% vs mois dernier
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </OverviewSortableKpi>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

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
  pendingDemandesCount: number;
  recentDeposits: Appointment[];
  overviewHeaderBgUrl?: string | null;
  onAvatarClick?: () => void;
  avatarUploading?: boolean;
  flashDesigns?: FlashDesign[];
  onSetupNavigate?: (
    target:
      | 'settings-vitrine'
      | 'settings-availability'
      | 'settings-payments'
      | 'flash'
      | 'appointments'
  ) => void;
  availabilitySetupComplete?: boolean;
  paymentsSetupComplete?: boolean;
  studioSubscriptionStatus?: string | null;
  trialEndsAt?: string | null;
  onOpenBilling?: () => void;
  pageTitleInShell?: boolean;
  mobileAfterHero?: React.ReactNode;
  usePlaceholderForPublicVisibility?: boolean;
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
  pageTitleInShell = false,
  mobileAfterHero,
  usePlaceholderForPublicVisibility = false,
}) => {
  const { privacyMode } = useStudioPrivacy();
  const euro = (n: number) => formatEuroPrivacy(n, privacyMode);
  const prefersReducedMotion = useReducedMotion();
  const isMdUp = useBreakpointMd();

  // ─────────────────────────────────────────────────────────────────────
  // State Management
  // ─────────────────────────────────────────────────────────────────────
  const [rightPanelTab, setRightPanelTab] = useState<'clients' | 'deposits'>('clients');
  const [isEditMode, setIsEditMode] = useState(false);
  const [insightView, setInsightView] = useState<'rdv' | 'demandes'>('rdv');
  const [insightPeriod, setInsightPeriod] = useState<'week' | 'month'>('month');
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [periodRevenue, setPeriodRevenue] = useState<number | null>(null);
  const [periodTrend, setPeriodTrend] = useState<number | null>(null);
  const [layout, setLayout] = useState<DashboardLayout>(() => getLayoutFromStorage());

  const toast = useToast();
  const [stripeConnectAccountId, setStripeConnectAccountId] = useState<string | null>(null);
  const [stripeExpressOpening, setStripeExpressOpening] = useState(false);

  // ─────────────────────────────────────────────────────────────────────
  // Computed Values
  // ─────────────────────────────────────────────────────────────────────

  const trialDaysRemaining = useMemo(() => getTrialDaysRemaining(trialEndsAt), [trialEndsAt]);

  const trialBannerMessage = useMemo(() => {
    if (studioSubscriptionStatus !== 'trialing') return null;
    if (trialDaysRemaining === null)
      return 'Votre essai gratuit est en cours — aucune carte requise.';
    if (trialDaysRemaining < 0) return null;
    if (trialDaysRemaining === 0)
      return "Votre essai se termine aujourd'hui. Choisissez une formule pour continuer sans interruption.";
    if (trialDaysRemaining === 1) return "Il vous reste 1 jour d'essai gratuit.";
    return `Il vous reste ${trialDaysRemaining} jours d'essai gratuit.`;
  }, [studioSubscriptionStatus, trialDaysRemaining]);

  const vitrineSlug =
    studioSlug != null && studioSlug !== ''
      ? studioSlug
      : user?.studioName
        ? getVitrineSlug(user.studioName)
        : '';

  const vipClients = clients.filter((c) => (c.totalSpent ?? 0) >= 500).length;
  const appointmentsThisMonth = appointments.filter((a) =>
    a.date.startsWith(now.toISOString().slice(0, 7))
  ).length;
  const safeMonthlyRevenue = Number.isFinite(monthlyRevenue) ? monthlyRevenue : 0;
  const safeMonthlyForecast = Number.isFinite(monthlyForecast) ? monthlyForecast : 0;
  const safePendingDeposits = Number.isFinite(pendingDeposits) ? pendingDeposits : 0;

  // ─────────────────────────────────────────────────────────────────────
  // Lifecycle Effects
  // ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!showWidgetPicker) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showWidgetPicker]);

  // ─────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────

  return (
    <DndContext
      sensors={useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
      )}
      collisionDetection={closestCenter}
      onDragEnd={() => {}}
    >
      {!isMdUp ? (
        // MOBILE LAYOUT
        <div className="flex min-w-0 max-w-full flex-col gap-3 overflow-x-hidden bg-transparent pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))] antialiased">
          <div className="px-0 pt-0.5 pb-0">
            <motion.div className="flex flex-col gap-2">
              {/* Mobile Header */}
              <div
                className={cn(
                  TOKENS.card.base,
                  'relative isolate flex min-h-0 items-start justify-between gap-3 overflow-hidden px-3.5 py-2.5'
                )}
              >
                <div className="relative z-[1] min-w-0 flex-1 space-y-1">
                  <h1 className="text-[15px] font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
                    Vue d&apos;ensemble
                  </h1>
                  <p className="text-[11px] font-medium capitalize leading-none tracking-wide text-zinc-500 dark:text-zinc-400">
                    {now.toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              </div>

              {/* More mobile sections would go here */}
            </motion.div>
          </div>
        </div>
      ) : (
        // DESKTOP LAYOUT
        <div className="min-h-full w-full max-w-[min(1800px,100%)] mx-auto isolate">
          <div className="px-0 pt-5 pb-5">
            {/* Desktop Header with controls */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <h1 className="type-heading">Vue d&apos;ensemble</h1>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    isEditMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                  {isEditMode ? 'Terminer' : 'Widgets'}
                </button>
              </div>

              {trialBannerMessage && (
                <OverviewTrialBanner message={trialBannerMessage} onOpenBilling={onOpenBilling} />
              )}

              {visibleAlerts.length > 0 && (
                <OverviewActivityAlerts
                  alerts={visibleAlerts}
                  setDismissedAlerts={setDismissedAlerts}
                  onAlertNavigate={onAlertNavigate}
                />
              )}
            </div>
          </div>

          {/* Main Desktop Content */}
          <div className="px-0 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-6 min-w-0">
                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch min-w-0">
                  {/* KPI widgets would render here */}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-4 space-y-6 min-w-0">
                <StudioPresenceMiniCard
                  studioId={studioId}
                  studioSlug={vitrineSlug}
                  useSupabase={useSupabase}
                  usePlaceholderWhenEmpty={usePlaceholderForPublicVisibility}
                  onOpenAnalytics={() => setActiveTab('analytics')}
                  onOpenFlashAndLinks={() => setActiveTab('flash')}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};

export default DashboardOverviewTab;
