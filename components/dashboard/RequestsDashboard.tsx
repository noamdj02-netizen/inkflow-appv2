import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useInkflowGestures } from '@/lib/motion/inkflowGestures';
import {
  RequestsTabPanel,
  RequestsListRowMotion,
  RequestsMotionButton,
  RequestsInboxStagger,
  RequestsInboxStaggerItem,
} from './requests/RequestsMotion';
import {
  History,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  Mail,
  Clock,
  CreditCard,
  Copy,
  Loader2,
  AlertTriangle,
  MapPin,
  Ruler,
  Sparkles,
  Gift,
  MessageCircle,
  AtSign,
  Inbox,
  ChevronRight,
  ArrowLeft,
  User,
} from 'lucide-react';
import { RequestsBookingsListSkeleton } from '../common/LoadingSkeleton';
import { Appointment, ProjectRequest, Booking, BookingStatus, Client } from '../../types';
import type { ClientFicheDemandeSource } from '../../lib/clientPreviewFromDemande';
import { RequestQuickViewSheet } from './RequestQuickViewSheet';
import { InvoiceButton } from './InvoiceButton';
import { DevisButton } from './DevisButton';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createCheckoutSession } from '../../lib/stripeClient';
import { saveAppointmentToSupabase } from '../../lib/supabaseDashboard';
import {
  findNextAvailableSlotForStudio,
  isSlotAvailableForBooking,
  updateBookingRecapFields,
} from '../../lib/supabaseBookings';
import { sendBookingConfirmation, sendBookingRefusal } from '../../lib/sendNotification';
import {
  DEFAULT_BOOKING_CONFIRM_DEPOSIT_EUR,
  inkflowBookingConfirmationUrl,
  inkflowPublicMessagesUrl,
  inkflowStudioPublicUrl,
} from '../../lib/bookingRecapUrls';
import { getCanonicalAppOrigin, buildClientAccountHubUrl } from '../../lib/urls';
import type { PendingStampReward } from '../../lib/stampLoyalty';
import { parseInstagramHandle, instagramMessageUrl } from '../../lib/instagramUtils';
import { buildMailtoHref, handleMailtoClick } from '../../lib/mailto';
import { ProposeAlternativeDateModal } from './ProposeAlternativeDateModal';
import { AcceptProjectModal } from './AcceptProjectModal';
import { InboxTreatNextBar } from './InboxTreatNextBar';
import { InboxQuickActions } from './InboxQuickActions';
import { pickFirstPendingInboxItem } from '@/lib/inboxQuickAction';
import { sortInboxBySla, inboxSlaUrgencyLabel } from '@/lib/inboxSlaSort';
import {
  consumeOpenInboxAfterDemo,
  createDemoInboxBooking,
  DEMO_INBOX_BOOKING_ID,
  isDemoInboxBooking,
  isDemoInboxPreviewActive,
  setDemoInboxPreviewActive,
} from '@/lib/demoInboxPreview';
import { hapticSuccess } from '../../lib/haptics';
import { trimAvatarUrl } from '../../lib/appointmentClientDisplay';
import { ClientPhotoAvatar } from '../common/ClientPhotoAvatar';
import { cn } from '@/lib/utils';
import {
  dashboardFilterChipActive,
  dashboardFilterChipInactive,
  dashboardFilterChipTrack,
  dashboardFilterPillActive,
  dashboardFilterPillContainer,
  dashboardFilterPillInactive,
  dashboardInboxSectionTitle,
  dashboardListAvatarFrame,
  dashboardListRowHover,
  dashboardPageCardTitle,
  dashboardPrimaryBtn,
  dashboardSecondaryBtn,
} from './ui/dashboardPilotagePage';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import CapsuleTabs from 'antd-mobile/es/components/capsule-tabs';
import PullToRefresh from 'antd-mobile/es/components/pull-to-refresh';
import { DashboardAdmEmpty } from './ui/DashboardAdmEmpty';
import type { RequestsSourceFilter } from '@/lib/dashboardNavUrl';
import {
  bookingStatusBadgeClass,
  dashboardAvatarFrame,
  dashboardAvatarSm,
  dashboardBtnAccent,
  dashboardBtnPrimary,
  dashboardBtnSecondary,
  dashboardIconButton,
  dashboardListRow,
  dashboardStatusBadge,
  projectStatusBadgeClass,
} from './ui/dashboardChrome';

/** Sous-onglet Demandes — « inbox » = file d’attente unifiée (option A). */
export type RequestsSubTabId = 'inbox' | 'rdv' | 'bookings' | 'projects' | 'history';

interface RequestsDashboardProps {
  studioId: string | null;
  /** Slug public du studio (pour les URLs de redirection Stripe après paiement). */
  studioSlug?: string | null;
  /** Onglet à afficher à l'ouverture (ex: 'history' depuis l'alerte "RDV sans acompte") */
  initialTab?: RequestsSubTabId;
  appointments: Appointment[];
  clients?: Client[];
  onUpdateAppointment: (id: string, updates: Partial<Appointment>) => void;
  onAddAppointment?: (appointment: Appointment) => void;
  projectRequests?: ProjectRequest[];
  onUpdateProjectRequest?: (id: string, status: ProjectRequest['status']) => void;
  bookings?: Booking[];
  onUpdateBookingStatus?: (id: string, status: BookingStatus) => Promise<void>;
  bookingsLoading?: boolean;
  /** Récompenses fidélité tampons en attente (email → montant + code), pour alerter le tatoueur */
  stampRewardsByEmail?: Record<string, PendingStampReward>;
  /** Ouvre l’onglet Messagerie sur le fil `pr_<id>`. */
  onOpenProjectDiscussion?: (threadId: string) => void;
  /** Depuis la messagerie : ouvre la fiche projet (feuille) une fois les données chargées */
  openRequestSheetProjectId?: string | null;
  onOpenRequestSheetProjectIdConsumed?: () => void;
  openRequestSheetBookingId?: string | null;
  onOpenRequestSheetBookingIdConsumed?: () => void;
  projectRequestsLoading?: boolean;
  /** Erreur chargement demandes /book (liste partielle) — bannière + Réessayer */
  bookingsLoadError?: string | null;
  onRetryBookings?: () => void;
  /** Erreur chargement briefs projet */
  projectRequestsLoadError?: string | null;
  onRetryProjectRequests?: () => void;
  /** Filtre source dans la file d'attente (agenda / book / brief). */
  initialInboxSource?: RequestsSourceFilter | null;
  onInboxSourceChange?: (source: RequestsSourceFilter | null) => void;
  /** Garde la sous-navigation « Demandes » du shell alignée (sidebar). */
  onSubTabChange?: (tab: 'inbox' | 'history') => void;
  /** Ouvre le drawer « fiche client » (même contenu que depuis l’agenda). */
  onOpenClientFicheFromDemande?: (source: ClientFicheDemandeSource) => void;
  /** Après acceptation projet (Edge) — rafraîchir la liste. */
  onProjectRequestsInvalidate?: () => void;
  /** Compte démo : pas d’appel accept réel. */
  demoMode?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Nouvelle',
  accepted: 'Acceptée',
  confirmed: 'Confirmée',
  deposit_paid: 'Acompte payé',
  rejected: 'Refusée',
  completed: 'Terminée',
};

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  cancelled: 'Annulé',
};

/** Bordure gauche par source — repère visuel (palette zinc / emerald). */
const SOURCE_ACCENT = {
  agenda: 'border-l-emerald-500',
  vitrineFlash: 'border-l-emerald-400',
  vitrineCustom: 'border-l-emerald-500',
  brief: 'border-l-zinc-400 dark:border-l-zinc-500',
} as const;

const REQUESTS_META_CHIP =
  'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-[11px] bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200';

const REQUESTS_STAMP_BANNER =
  'flex items-start gap-1.5 rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-2 py-1.5 text-xs text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-100 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm';

const FICHE_CLIENT_ICON_BTN = `${dashboardIconButton} touch-manipulation`;

function RequestsListErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border-b border-red-200/90 dark:border-red-900/45 bg-red-50/90 dark:bg-red-950/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <span className="text-sm text-red-800 dark:text-red-200 flex items-start gap-2 min-w-0">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
        <span className="min-w-0 break-words">Impossible de charger cette liste. {message}</span>
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 inline-flex items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-100 px-3 py-2 text-sm font-semibold hover:bg-red-200/80 dark:hover:bg-red-900/60 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}

type AgendaRequestCardViewProps = {
  apt: Appointment;
  getAvatar: (email?: string, clientId?: string, name?: string) => string | undefined;
  stampRw?: PendingStampReward;
  onAccept: () => void;
  onRefuse: () => void;
  onDeposit: () => void;
  onOpenDiscussion?: (threadId: string) => void;
  studioId: string | null;
  onOpenClientFiche?: () => void;
};

function formatAgendaSlotLabel(date: string, time: string): { dateLine: string; timeLine: string } {
  try {
    const d = new Date(`${date}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      const dateLine = d.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return { dateLine, timeLine: time };
    }
  } catch {
    //
  }
  return { dateLine: date, timeLine: time };
}

const AgendaRequestCardView: React.FC<AgendaRequestCardViewProps> = ({
  apt,
  getAvatar,
  stampRw,
  onAccept,
  onRefuse,
  onDeposit,
  onOpenDiscussion,
  studioId,
  onOpenClientFiche,
}) => {
  const { cardTap, transition } = useInkflowGestures();
  const { dateLine, timeLine } = formatAgendaSlotLabel(apt.date, apt.time);
  const slaLabel = apt.createdAt ? inboxSlaUrgencyLabel(apt.createdAt) : null;

  const secondaryActions = [
    ...(studioId
      ? [
          {
            key: 'deposit',
            label: 'Acompte',
            onClick: onDeposit,
            icon: <CreditCard className="w-4 h-4 shrink-0 stroke-[1.75]" />,
          },
        ]
      : []),
    ...(apt.projectRequestId && onOpenDiscussion
      ? [
          {
            key: 'discussion',
            label: 'Discussion',
            onClick: () => onOpenDiscussion(`pr_${apt.projectRequestId}`),
            variant: 'primary' as const,
            icon: <MessageCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />,
          },
        ]
      : []),
    ...(onOpenClientFiche
      ? [
          {
            key: 'client',
            label: 'Fiche client',
            onClick: onOpenClientFiche,
            icon: <User className="w-4 h-4 shrink-0 stroke-[1.75]" />,
          },
        ]
      : []),
    {
      key: 'refuse',
      label: 'Refuser',
      onClick: onRefuse,
      variant: 'danger' as const,
      icon: <XCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />,
    },
  ];

  return (
    <motion.div
      className="overflow-hidden rounded-xl bg-card p-4 text-sm text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 sm:p-5"
      whileTap={cardTap}
      transition={transition}
    >
      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
        <div
          className={cn(
            dashboardAvatarFrame,
            dashboardAvatarSm,
            'mt-0.5 shrink-0 ring-1 ring-zinc-200/90 dark:ring-zinc-700/80'
          )}
        >
          <ClientPhotoAvatar
            name={apt.clientName}
            src={getAvatar(apt.clientEmail, apt.clientId, apt.clientName)}
            className="h-full w-full"
            textClassName="text-base font-semibold text-zinc-700 dark:text-zinc-200"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0 flex-1">
              <h3 className="type-heading-sm truncate">{apt.clientName}</h3>
              <p className="mt-0.5 flex min-w-0 items-center gap-1.5 type-caption text-muted-foreground">
                <Mail className="size-3.5 shrink-0 stroke-[1.75] text-zinc-400 dark:text-zinc-500" />
                <span className="truncate">{apt.clientEmail}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <span className={cn(dashboardStatusBadge.pending)}>En attente</span>
              {slaLabel ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
                    slaLabel.includes('48')
                      ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
                      : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300'
                  )}
                >
                  <Clock className="size-3 shrink-0" aria-hidden />
                  {slaLabel}
                </span>
              ) : null}
            </div>
          </div>

          {stampRw && (
            <div className={REQUESTS_STAMP_BANNER}>
              <Gift className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="leading-snug">
                Avantage fidélité <strong>{stampRw.amountEuros}€</strong>
                <span className="text-emerald-800/80 dark:text-emerald-200/80"> · code </span>
                <code className="rounded-md bg-white/70 px-1.5 py-0.5 font-mono text-xs dark:bg-emerald-950/40">
                  {stampRw.promoCode}
                </code>
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <div className="rounded-xl bg-zinc-50/90 px-3 py-2.5 ring-1 ring-inset ring-zinc-200/80 dark:bg-zinc-800/40 dark:ring-zinc-700/70">
              <p className="dashboardSectionTitle">Créneau</p>
              <div className="mt-1.5 flex items-center gap-2 type-body font-semibold tabular-nums">
                <Calendar className="size-4 shrink-0 stroke-[1.75] text-zinc-500 dark:text-zinc-400" />
                <span className="capitalize">{dateLine}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 type-caption text-muted-foreground tabular-nums">
                <Clock className="size-3.5 shrink-0 stroke-[1.75]" />
                <span>{timeLine}</span>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-50/90 px-3 py-2.5 ring-1 ring-inset ring-zinc-200/80 dark:bg-zinc-800/40 dark:ring-zinc-700/70">
              <p className="dashboardSectionTitle">Demande</p>
              <p className="mt-1.5 type-body font-medium leading-snug line-clamp-2">
                {apt.service}
              </p>
              <p className="mt-1.5 text-lg font-semibold tabular-nums tracking-tight text-emerald-700 dark:text-emerald-400">
                {apt.price}€
              </p>
            </div>
          </div>

          <div className="border-t border-zinc-200/80 pt-3 dark:border-zinc-800/90">
            <p className="dashboardSectionTitle mb-2.5 hidden lg:block">Actions rapides</p>
            <InboxQuickActions
              layout="toolbar"
              groupLabel="Actions rapides"
              primary={{
                key: 'accept',
                label: 'Accepter',
                onClick: onAccept,
                variant: 'primary',
                icon: <CheckCircle className="size-4 shrink-0 stroke-[1.75]" />,
              }}
              secondary={secondaryActions}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const RequestsDashboard: React.FC<RequestsDashboardProps> = ({
  studioId,
  studioSlug,
  initialTab,
  appointments,
  clients = [],
  onUpdateAppointment,
  onAddAppointment,
  projectRequests = [],
  onUpdateProjectRequest,
  bookings = [],
  onUpdateBookingStatus,
  bookingsLoading = false,
  stampRewardsByEmail = {},
  onOpenProjectDiscussion,
  openRequestSheetProjectId,
  onOpenRequestSheetProjectIdConsumed,
  openRequestSheetBookingId,
  onOpenRequestSheetBookingIdConsumed,
  projectRequestsLoading = false,
  bookingsLoadError = null,
  onRetryBookings,
  projectRequestsLoadError = null,
  onRetryProjectRequests,
  initialInboxSource = null,
  onInboxSourceChange,
  onSubTabChange,
  onOpenClientFicheFromDemande,
  onProjectRequestsInvalidate,
  demoMode = false,
}) => {
  const toast = useToast();
  const isMobile = useIsMobile();
  const handlePullRefresh = useCallback(async () => {
    const tasks: Promise<void>[] = [];
    if (onRetryBookings) tasks.push(Promise.resolve(onRetryBookings()));
    if (onRetryProjectRequests) tasks.push(Promise.resolve(onRetryProjectRequests()));
    await Promise.all(tasks);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }, [onRetryBookings, onRetryProjectRequests]);
  const clientPortalUrlForEmails = useMemo(() => {
    const s = studioSlug?.trim();
    if (!s) return undefined;
    return buildClientAccountHubUrl({ studioSlug: s });
  }, [studioSlug]);

  const clientByEmail = useMemo(() => {
    const m = new Map<string, Client>();
    clients.forEach((c) => {
      if (c.email) m.set(c.email.toLowerCase(), c);
    });
    return m;
  }, [clients]);
  const clientByName = useMemo(() => {
    const m = new Map<string, Client>();
    clients.forEach((c) => {
      if (c.name) m.set(c.name.toLowerCase().trim(), c);
    });
    return m;
  }, [clients]);
  const stampRewardForEmail = useCallback(
    (email: string | undefined) => {
      const key = (email || '').toLowerCase().trim();
      if (!key) return undefined;
      return stampRewardsByEmail[key];
    },
    [stampRewardsByEmail]
  );
  const getAvatar = (email?: string, clientId?: string, name?: string) => {
    if (clientId) {
      const c = clients.find((x) => x.id === clientId);
      const u = trimAvatarUrl(c?.avatar);
      if (u) return u;
    }
    if (email) {
      const c = clientByEmail.get(email.toLowerCase());
      const u = trimAvatarUrl(c?.avatar);
      if (u) return u;
    }
    if (name) {
      const c = clientByName.get(name.toLowerCase().trim());
      const u = trimAvatarUrl(c?.avatar);
      if (u) return u;
    }
    return undefined;
  };
  const { user } = useAuth();
  type InboxSourceScope = 'all' | RequestsSourceFilter;
  const [activeTab, setActiveTab] = useState<'inbox' | 'history'>(() => {
    const t = initialTab ?? 'inbox';
    return t === 'history' ? 'history' : 'inbox';
  });
  const [inboxSourceFilter, setInboxSourceFilter] = useState<InboxSourceScope>(() => {
    if (initialInboxSource) return initialInboxSource;
    if (initialTab === 'rdv') return 'agenda';
    if (initialTab === 'bookings') return 'book';
    if (initialTab === 'projects') return 'brief';
    return 'all';
  });
  const [bookingSubTab, setBookingSubTab] = useState<'all' | 'flash' | 'custom'>('all');
  const [inboxQueueScope, setInboxQueueScope] = useState<'action' | 'all'>('action');
  const [inboxKind, setInboxKind] = useState<'all' | 'flash' | 'manual'>('all');
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false);
  const [demoPreviewTick, setDemoPreviewTick] = useState(0);

  const applyInboxSource = useCallback(
    (source: InboxSourceScope) => {
      setInboxSourceFilter(source);
      onInboxSourceChange?.(source === 'all' ? null : source);
    },
    [onInboxSourceChange]
  );

  const selectTab = useCallback(
    (tab: RequestsSubTabId) => {
      if (tab === 'history') {
        setActiveTab('history');
        applyInboxSource('all');
        onSubTabChange?.('history');
        return;
      }
      if (tab === 'rdv' || tab === 'bookings' || tab === 'projects') {
        const source: RequestsSourceFilter =
          tab === 'rdv' ? 'agenda' : tab === 'bookings' ? 'book' : 'brief';
        setActiveTab('inbox');
        applyInboxSource(source);
        onSubTabChange?.('inbox');
        return;
      }
      setActiveTab('inbox');
      applyInboxSource('all');
      onSubTabChange?.('inbox');
    },
    [applyInboxSource, onSubTabChange]
  );

  // Synchroniser l’onglet quand la sidebar / l’URL change
  useEffect(() => {
    if (!initialTab) return;
    selectTab(initialTab);
  }, [initialTab, selectTab]);

  useEffect(() => {
    if (initialInboxSource) {
      setActiveTab('inbox');
      applyInboxSource(initialInboxSource);
    }
  }, [initialInboxSource, applyInboxSource]);

  useEffect(() => {
    if (consumeOpenInboxAfterDemo()) {
      selectTab('inbox');
      setInboxQueueScope('action');
      setDemoPreviewTick((t) => t + 1);
    }
  }, [selectTab]);

  // Modale « Générer lien acompte » Stripe (RDV existant)
  const [depositModalAppointment, setDepositModalAppointment] = useState<Appointment | null>(null);
  // Modale acompte depuis une demande vitrine (booking) → crée un RDV puis génère le lien
  const [depositModalBooking, setDepositModalBooking] = useState<Booking | null>(null);
  // Modale acompte depuis une demande de projet → crée un RDV puis génère le lien
  const [depositModalProject, setDepositModalProject] = useState<ProjectRequest | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositUrl, setDepositUrl] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Sheet Quick View (aperçu rapide au clic sur une demande)
  type SheetItem = (ProjectRequest & { _type: 'project' }) | (Booking & { _type: 'booking' });
  const [sheetItem, setSheetItem] = useState<SheetItem | null>(null);
  const [acceptProjectTarget, setAcceptProjectTarget] = useState<ProjectRequest | null>(null);

  useEffect(() => {
    if (!openRequestSheetProjectId || projectRequestsLoading) return;
    const pr = projectRequests.find((p) => p.id === openRequestSheetProjectId);
    if (pr) {
      setSheetItem({ ...pr, _type: 'project' });
      selectTab('projects');
    } else {
      toast.info('Demande de projet introuvable ou déjà traitée.');
    }
    onOpenRequestSheetProjectIdConsumed?.();
  }, [
    openRequestSheetProjectId,
    projectRequestsLoading,
    projectRequests,
    onOpenRequestSheetProjectIdConsumed,
    toast,
    selectTab,
  ]);

  useEffect(() => {
    if (!openRequestSheetBookingId || bookingsLoading) return;
    const bk = bookings.find((b) => b.id === openRequestSheetBookingId);
    if (bk) {
      setSheetItem({ ...bk, _type: 'booking' });
      selectTab('bookings');
    } else {
      toast.info('Demande vitrine introuvable.');
    }
    onOpenRequestSheetBookingIdConsumed?.();
  }, [
    openRequestSheetBookingId,
    bookingsLoading,
    bookings,
    onOpenRequestSheetBookingIdConsumed,
    toast,
    selectTab,
  ]);
  const [proposeDateItem, setProposeDateItem] = useState<SheetItem | null>(null);

  type RejectPending =
    | { kind: 'appointment'; apt: Appointment }
    | { kind: 'booking'; bk: Booking }
    | { kind: 'project'; pr: ProjectRequest };
  const [rejectPending, setRejectPending] = useState<RejectPending | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  const inferRequestType = (desc: string, _placement?: string): 'flash' | 'custom' => {
    const d = (desc || '').toLowerCase();
    if (d.includes('flash') || d.includes('pré-dessiné') || d.includes('prédessiné'))
      return 'flash';
    return 'custom';
  };

  const formatSizeForBadge = (s: string | undefined): string => {
    if (!s) return '';
    const lower = (s || '').toLowerCase();
    if (lower === 'small' || lower === 'petit') return '5-10 cm';
    if (lower === 'medium' || lower === 'moyen') return '10-15 cm';
    if (lower === 'large' || lower === 'grand') return '15-25 cm';
    return s;
  };

  const formatPlacementForBadge = (p: string | undefined): string => {
    if (!p) return '';
    const map: Record<string, string> = {
      arm: 'Bras',
      leg: 'Jambe',
      back: 'Dos',
      chest: 'Poitrine',
      shoulder: 'Épaule',
      wrist: 'Poignet',
      ankle: 'Cheville',
      'avant-bras': 'Avant-bras',
      'avant bras': 'Avant-bras',
    };
    return map[p.toLowerCase().trim()] || p;
  };

  const byCreatedAtDesc = <T extends { createdAt: string }>(a: T, b: T) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

  const pendingAppointments = useMemo(
    () => sortInboxBySla(appointments.filter((a) => a.status === 'pending')),
    [appointments]
  );
  const historyAppointments = appointments
    .filter((a) => !['pending'].includes(a.status))
    .sort((a, b) => (a.createdAt && b.createdAt ? byCreatedAtDesc(a, b) : 0));
  const pendingProjects = useMemo(
    () => sortInboxBySla(projectRequests.filter((p) => p.status === 'pending')),
    [projectRequests]
  );

  const pendingBookings = useMemo(() => {
    const base = sortInboxBySla(bookings.filter((b) => b.status === 'pending'));
    if (!studioId || !isDemoInboxPreviewActive()) return base;
    if (base.some((b) => b.id === DEMO_INBOX_BOOKING_ID)) return base;
    return [createDemoInboxBooking(studioId), ...base];
  }, [bookings, studioId, demoPreviewTick]);
  const bookingsChronological = [...bookings].sort(byCreatedAtDesc);
  const flashBookings = bookingsChronological.filter(
    (b) => inferRequestType(b.description) === 'flash'
  );
  const customBookings = bookingsChronological.filter(
    (b) => inferRequestType(b.description) === 'custom'
  );
  const filteredBookings =
    bookingSubTab === 'flash'
      ? flashBookings
      : bookingSubTab === 'custom'
        ? customBookings
        : bookingsChronological;
  const pendingFlashBookings = flashBookings.filter((b) => b.status === 'pending');
  const pendingCustomBookings = customBookings.filter((b) => b.status === 'pending');

  const { inboxAgendaList, inboxBookList, inboxProjectList } = useMemo(() => {
    const empty = {
      inboxAgendaList: [] as Appointment[],
      inboxBookList: [] as Booking[],
      inboxProjectList: [] as ProjectRequest[],
    };
    if (activeTab !== 'inbox') return empty;
    const inf = (d: string) => inferRequestType(d);
    if (inboxKind === 'flash') {
      const book =
        inboxQueueScope === 'action'
          ? pendingBookings.filter((b) => inf(b.description) === 'flash')
          : flashBookings;
      return { ...empty, inboxBookList: book };
    }
    if (inboxKind === 'manual') {
      return {
        inboxAgendaList: pendingAppointments,
        inboxBookList:
          inboxQueueScope === 'action'
            ? pendingBookings.filter((b) => inf(b.description) === 'custom')
            : customBookings,
        inboxProjectList:
          inboxQueueScope === 'action'
            ? pendingProjects
            : projectRequests.filter((p) => p.status !== 'rejected'),
      };
    }
    return {
      inboxAgendaList: pendingAppointments,
      inboxBookList: inboxQueueScope === 'action' ? pendingBookings : bookingsChronological,
      inboxProjectList:
        inboxQueueScope === 'action'
          ? pendingProjects
          : projectRequests.filter((p) => p.status !== 'rejected'),
    };
  }, [
    activeTab,
    inboxKind,
    inboxQueueScope,
    pendingAppointments,
    pendingBookings,
    pendingProjects,
    bookingsChronological,
    flashBookings,
    customBookings,
    projectRequests,
  ]);

  const inboxNothingToShow =
    activeTab === 'inbox' &&
    (inboxSourceFilter === 'all' || inboxSourceFilter === 'agenda'
      ? inboxAgendaList.length === 0
      : true) &&
    (inboxSourceFilter === 'all' || inboxSourceFilter === 'book'
      ? inboxBookList.length === 0
      : true) &&
    (inboxSourceFilter === 'all' || inboxSourceFilter === 'brief'
      ? inboxProjectList.length === 0
      : true);

  const showInboxAgenda = inboxSourceFilter === 'all' || inboxSourceFilter === 'agenda';
  const showInboxBook = inboxSourceFilter === 'all' || inboxSourceFilter === 'book';
  const showInboxBrief =
    (inboxSourceFilter === 'all' || inboxSourceFilter === 'brief') && inboxKind !== 'flash';

  const INBOX_SOURCE_LABELS: Record<RequestsSourceFilter, string> = {
    agenda: 'Créneaux agenda',
    book: 'Page book',
    brief: 'Brief sans date',
  };

  const inboxSectionTitle =
    inboxSourceFilter !== 'all' ? INBOX_SOURCE_LABELS[inboxSourceFilter] : 'File d’attente';

  const isInboxSourceActive = (source: RequestsSourceFilter | 'history') => {
    if (source === 'history') return activeTab === 'history';
    return activeTab === 'inbox' && inboxSourceFilter === source;
  };

  const inboxStatusLine = useMemo(() => {
    if (inboxQueueScope === 'action') {
      const n = pendingAppointments.length + pendingBookings.length + pendingProjects.length;
      if (n === 0) return 'Rien en attente — tout est à jour.';
      if (n === 1) return '1 élément à traiter (agenda, book ou brief).';
      return `${n} éléments à traiter (agenda, book ou brief).`;
    }
    return 'Vue large : demandes book et briefs (y compris déjà répondues côté vitrine, hors historique agenda).';
  }, [inboxQueueScope, pendingAppointments.length, pendingBookings.length, pendingProjects.length]);

  const inboxPendingTotal =
    pendingAppointments.length + pendingBookings.length + pendingProjects.length;

  const firstInboxTarget = useMemo(
    () =>
      activeTab === 'inbox' && inboxQueueScope === 'action'
        ? pickFirstPendingInboxItem(pendingBookings, pendingAppointments, pendingProjects)
        : null,
    [activeTab, inboxQueueScope, pendingBookings, pendingAppointments, pendingProjects]
  );

  const handleConfirm = async (apt: Appointment) => {
    if (!studioId) {
      toast.error('Studio inconnu — reconnecte-toi.');
      return;
    }
    onUpdateAppointment(apt.id, { status: 'confirmed' });
    const recapUrl = inkflowStudioPublicUrl(studioSlug) ?? `${getCanonicalAppOrigin()}/discover`;
    const sent = await sendBookingConfirmation({
      studioId,
      clientEmail: apt.clientEmail,
      clientName: apt.clientName,
      studioName: user?.studioName || 'Le studio',
      requestedDate: apt.date,
      requestedTime: apt.time || null,
      description: apt.service,
      recapUrl,
      ...(clientPortalUrlForEmails ? { clientPortalUrl: clientPortalUrlForEmails } : {}),
    });
    if (sent.ok) {
      toast.success(
        sent.smsSent
          ? 'RDV confirmé — email et SMS (lien) envoyés au client'
          : 'RDV confirmé — un email de confirmation a été envoyé au client'
      );
      hapticSuccess();
      void import('../../lib/analytics/capture').then(({ captureEvent, AnalyticsEvents }) => {
        captureEvent(AnalyticsEvents.CLIENT_RDV_CONFIRMED_BY_STUDIO, {
          source: 'appointment',
          appointment_id: apt.id,
          funnel: 'tattooer_activation',
        });
      });
    } else {
      toast.error(
        sent.error ||
          "L'email de confirmation n'a pas pu être envoyé (vérifiez Resend / les secrets Supabase)."
      );
    }
  };

  const handleReject = (apt: Appointment) => {
    if (!studioId) {
      toast.error('Studio inconnu.');
      return;
    }
    onUpdateAppointment(apt.id, { status: 'cancelled' });
    sendBookingRefusal({
      studioId,
      clientEmail: apt.clientEmail,
      clientName: apt.clientName,
      studioName: user?.studioName || 'Le studio',
      description: `${apt.service} — ${apt.date} à ${apt.time}`,
    });
    toast.info('Rendez-vous refusé — un email a été envoyé au client');
  };

  const handleRejectProject = async (pr: ProjectRequest) => {
    if (!studioId) {
      toast.error('Studio inconnu.');
      return;
    }
    try {
      await onUpdateProjectRequest?.(pr.id, 'rejected');
      sendBookingRefusal({
        studioId,
        clientEmail: pr.clientEmail,
        clientName: pr.clientName,
        studioName: user?.studioName || 'Le studio',
        description: pr.description,
      });
      toast.info('Demande refusée — un email a été envoyé au client');
    } catch {
      toast.error('Erreur lors de la mise a jour');
    }
  };

  const handleConfirmBooking = async (bk: Booking) => {
    if (isDemoInboxBooking(bk.id)) {
      setDemoInboxPreviewActive(false);
      setDemoPreviewTick((t) => t + 1);
      toast.success('Exemple retiré — partage ton lien vitrine pour recevoir une vraie demande.');
      return;
    }
    const threadUrl = inkflowPublicMessagesUrl(bk.id);

    const notifyConfirmed = (sent: { ok: boolean; smsSent?: boolean; error?: string }) => {
      if (sent.ok) {
        toast.success(
          sent.smsSent
            ? 'RDV confirmé — email et SMS (lien) envoyés au client'
            : 'RDV confirmé — un email de confirmation a été envoyé au client'
        );
        hapticSuccess();
        void import('../../lib/analytics/capture').then(({ captureEvent, AnalyticsEvents }) => {
          captureEvent(AnalyticsEvents.CLIENT_RDV_CONFIRMED_BY_STUDIO, {
            source: 'public_booking',
            booking_id: bk.id,
            funnel: 'tattooer_activation',
          });
        });
      } else {
        toast.error(sent.error || "L'email de confirmation n'a pas pu être envoyé.");
      }
    };

    try {
      if (demoMode || !studioId || !onAddAppointment) {
        await onUpdateBookingStatus?.(bk.id, 'confirmed');
        if (studioId) {
          const sent = await sendBookingConfirmation({
            studioId,
            clientEmail: bk.clientEmail,
            clientName: bk.clientName,
            studioName: user?.studioName || 'Le studio',
            requestedDate: bk.requestedDate,
            requestedTime: bk.requestedTime ?? null,
            description: bk.description,
            recapUrl: threadUrl,
            conversationLink: threadUrl,
            clientPhone: bk.clientPhone,
            smsConfirmationOptIn: bk.smsConfirmationOptIn,
            ...(clientPortalUrlForEmails ? { clientPortalUrl: clientPortalUrlForEmails } : {}),
          });
          notifyConfirmed(sent);
        }
        return;
      }

      const available = await isSlotAvailableForBooking(
        studioId,
        bk.requestedDate,
        bk.requestedTime ?? null,
        bk.id
      );
      if (!available) {
        toast.error(SLOT_UNAVAILABLE_MSG);
        return;
      }

      const recapToken = crypto.randomUUID();
      const now = new Date().toISOString();
      const aptId = `apt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const serviceName =
        bk.description.length > 50 ? `${bk.description.slice(0, 47)}...` : bk.description;
      const amount = DEFAULT_BOOKING_CONFIRM_DEPOSIT_EUR;
      const newApt: Appointment = {
        id: aptId,
        clientId: '',
        clientName: bk.clientName,
        clientEmail: bk.clientEmail,
        clientPhone: bk.clientPhone?.trim() || '',
        date: bk.requestedDate,
        time:
          bk.requestedTime === 'morning'
            ? '10:00'
            : bk.requestedTime === 'afternoon'
              ? '14:00'
              : bk.requestedTime === 'evening'
                ? '18:00'
                : '10:00',
        service: `RDV vitrine - ${serviceName}`,
        duration: 60,
        price: 0,
        deposit: amount,
        depositPaid: false,
        status: 'pending',
        tattooType: 'custom',
        location: 'arm',
        size: 'medium',
        consentFormSigned: false,
        createdAt: now,
        updatedAt: now,
      };

      await saveAppointmentToSupabase(studioId, newApt);
      onAddAppointment(newApt);
      await onUpdateBookingStatus?.(bk.id, 'confirmed');
      await updateBookingRecapFields(bk.id, {
        clientRecapToken: recapToken,
        recapAppointmentId: aptId,
      });

      const confirmationUrl = inkflowBookingConfirmationUrl(recapToken);
      const sent = await sendBookingConfirmation({
        studioId,
        clientEmail: bk.clientEmail,
        clientName: bk.clientName,
        studioName: user?.studioName || 'Le studio',
        requestedDate: bk.requestedDate,
        requestedTime: bk.requestedTime ?? null,
        description: bk.description,
        clientConfirmationUrl: confirmationUrl,
        recapUrl: threadUrl,
        conversationLink: threadUrl,
        clientPhone: bk.clientPhone,
        smsConfirmationOptIn: bk.smsConfirmationOptIn,
        ...(clientPortalUrlForEmails ? { clientPortalUrl: clientPortalUrlForEmails } : {}),
      });
      notifyConfirmed(sent);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const handleRejectBooking = async (bk: Booking) => {
    if (isDemoInboxBooking(bk.id)) {
      setDemoInboxPreviewActive(false);
      setDemoPreviewTick((t) => t + 1);
      toast.info('Exemple retiré.');
      return;
    }
    try {
      await onUpdateBookingStatus?.(bk.id, 'rejected');
      if (!studioId) {
        toast.error('Studio inconnu.');
        return;
      }
      sendBookingRefusal({
        studioId,
        clientEmail: bk.clientEmail,
        clientName: bk.clientName,
        studioName: user?.studioName || 'Le studio',
        description: bk.description,
      });
      toast.info('Demande refusée — un email a été envoyé au client');
    } catch {
      toast.error('Erreur lors de la mise a jour');
    }
  };

  const handleInboxPrimary = () => {
    if (!firstInboxTarget) return;
    if (firstInboxTarget.source === 'booking') {
      void handleConfirmBooking(firstInboxTarget.item);
      return;
    }
    if (firstInboxTarget.source === 'agenda') {
      void handleConfirm(firstInboxTarget.item);
      return;
    }
    setAcceptProjectTarget(firstInboxTarget.item);
  };

  const openDepositModal = (apt: Appointment) => {
    setDepositModalBooking(null);
    setDepositModalProject(null);
    setDepositModalAppointment(apt);
    setDepositAmount(String(apt.deposit > 0 ? apt.deposit : 50));
    setDepositUrl(null);
    setDepositError(null);
  };

  const openDepositModalForBooking = (bk: Booking) => {
    if (isDemoInboxBooking(bk.id)) {
      toast.info('C’est un exemple — l’acompte Stripe s’applique aux vraies demandes.');
      return;
    }
    setDepositModalAppointment(null);
    setDepositModalBooking(bk);
    setDepositModalProject(null);
    setDepositAmount('50');
    setDepositUrl(null);
    setDepositError(null);
  };

  const openDepositModalForProject = (pr: ProjectRequest) => {
    setDepositModalAppointment(null);
    setDepositModalBooking(null);
    setDepositModalProject(pr);
    setDepositAmount('50');
    setDepositUrl(null);
    setDepositError(null);
  };

  const closeDepositModal = () => {
    setDepositModalAppointment(null);
    setDepositModalBooking(null);
    setDepositModalProject(null);
    setDepositAmount('');
    setDepositUrl(null);
    setDepositError(null);
  };

  const SLOT_UNAVAILABLE_MSG = "Ce créneau vient d'être réservé entre-temps";

  const isSlotErrorVisible =
    (depositError?.includes('créneau') && depositError?.includes('réservé')) ?? false;

  const handleGenerateDepositLink = async () => {
    if (!studioId) return;
    if (isSlotErrorVisible) return;
    const amount = parseFloat(depositAmount.replace(',', '.'));
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Indiquez un montant valide (ex: 50)');
      return;
    }

    // Cas 1 : depuis un RDV existant
    if (depositModalAppointment) {
      setDepositLoading(true);
      setDepositUrl(null);
      setDepositError(null);
      try {
        const result = await createCheckoutSession({
          studioId,
          studioSlug: studioSlug ?? undefined,
          appointmentId: depositModalAppointment.id,
          amount,
          clientName: depositModalAppointment.clientName,
          clientEmail: depositModalAppointment.clientEmail,
          serviceName: depositModalAppointment.service,
          type: 'deposit',
        });
        if ('url' in result) {
          setDepositUrl(result.url);
          const recapUrl =
            inkflowStudioPublicUrl(studioSlug) ?? `${getCanonicalAppOrigin()}/discover`;
          const sent = await sendBookingConfirmation({
            studioId,
            clientEmail: depositModalAppointment.clientEmail,
            clientName: depositModalAppointment.clientName,
            studioName: user?.studioName || 'Le studio',
            requestedDate: depositModalAppointment.date,
            requestedTime: depositModalAppointment.time || null,
            description: depositModalAppointment.service,
            paymentLink: result.url,
            recapUrl,
            ...(clientPortalUrlForEmails ? { clientPortalUrl: clientPortalUrlForEmails } : {}),
          });
          if (sent.ok) {
            toast.success(
              sent.smsSent
                ? 'Lien généré — email et SMS (lien) envoyés au client.'
                : 'Lien généré et email envoyé au client avec le lien de paiement.'
            );
          } else {
            toast.error(sent.error || "Lien créé mais l'email n'a pas été envoyé.");
          }
        } else {
          setDepositError(result.error || 'stripe_config');
        }
      } catch (e) {
        setDepositError(e instanceof Error ? e.message : 'Erreur lors de la génération du lien');
      } finally {
        setDepositLoading(false);
      }
    }

    // Cas 2 : depuis une demande vitrine (booking) → créer RDV, générer lien, envoyer email auto, confirmer
    if (depositModalBooking && onAddAppointment) {
      try {
        const available = await isSlotAvailableForBooking(
          studioId,
          depositModalBooking.requestedDate,
          depositModalBooking.requestedTime ?? null,
          depositModalBooking.id
        );
        if (!available) {
          setDepositError(SLOT_UNAVAILABLE_MSG);
          toast.error(SLOT_UNAVAILABLE_MSG);
          return;
        }
      } catch {
        setDepositError(SLOT_UNAVAILABLE_MSG);
        toast.error(SLOT_UNAVAILABLE_MSG);
        return;
      }
      setDepositLoading(true);
      setDepositUrl(null);
      const now = new Date().toISOString();
      const aptId = `apt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const serviceName =
        depositModalBooking.description.length > 50
          ? `${depositModalBooking.description.slice(0, 47)}...`
          : depositModalBooking.description;
      const newApt: Appointment = {
        id: aptId,
        clientId: '',
        clientName: depositModalBooking.clientName,
        clientEmail: depositModalBooking.clientEmail,
        clientPhone: depositModalBooking.clientPhone?.trim() || '',
        date: depositModalBooking.requestedDate,
        time:
          depositModalBooking.requestedTime === 'morning'
            ? '10:00'
            : depositModalBooking.requestedTime === 'afternoon'
              ? '14:00'
              : depositModalBooking.requestedTime === 'evening'
                ? '18:00'
                : '10:00',
        service: `RDV vitrine - ${serviceName}`,
        duration: 60,
        price: 0,
        deposit: amount,
        depositPaid: false,
        status: 'pending',
        tattooType: 'custom',
        location: 'arm',
        size: 'medium',
        consentFormSigned: false,
        createdAt: now,
        updatedAt: now,
      };
      setDepositError(null);
      try {
        await saveAppointmentToSupabase(studioId, newApt);
        onAddAppointment(newApt);
        const result = await createCheckoutSession({
          studioId,
          studioSlug: studioSlug ?? undefined,
          appointmentId: aptId,
          amount,
          clientName: depositModalBooking.clientName,
          clientEmail: depositModalBooking.clientEmail,
          serviceName: newApt.service,
          type: 'deposit',
        });
        if ('url' in result) {
          const threadUrl = inkflowPublicMessagesUrl(depositModalBooking.id);
          const sent = await sendBookingConfirmation({
            studioId,
            clientEmail: depositModalBooking.clientEmail,
            clientName: depositModalBooking.clientName,
            studioName: user?.studioName || 'Le studio',
            requestedDate: depositModalBooking.requestedDate,
            requestedTime: depositModalBooking.requestedTime ?? null,
            description: depositModalBooking.description,
            paymentLink: result.url,
            recapUrl: threadUrl,
            conversationLink: threadUrl,
            clientPhone: depositModalBooking.clientPhone,
            smsConfirmationOptIn: depositModalBooking.smsConfirmationOptIn,
            ...(clientPortalUrlForEmails ? { clientPortalUrl: clientPortalUrlForEmails } : {}),
          });
          await onUpdateBookingStatus?.(depositModalBooking.id, 'confirmed');
          if (sent.ok) {
            toast.success(
              sent.smsSent
                ? 'RDV confirmé — email et SMS (lien) envoyés avec le paiement.'
                : 'RDV confirmé et email envoyé avec le lien de paiement !'
            );
            closeDepositModal();
          } else {
            toast.error(sent.error || "RDV enregistré mais l'email n'a pas été envoyé.");
            closeDepositModal();
          }
        } else {
          setDepositError(result.error || 'stripe_config');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur lors de la création du RDV ou du lien';
        setDepositError(msg);
        if (msg.includes('créneau') && msg.includes('réservé')) {
          toast.error(msg);
        }
      } finally {
        setDepositLoading(false);
      }
    }

    // Cas 3 : depuis une demande de projet → créer un RDV placeholder (créneau libre auto) puis générer le lien
    if (depositModalProject && onAddAppointment) {
      setDepositLoading(true);
      setDepositUrl(null);
      let slotDate: string;
      let slotTime: string;
      try {
        const slot = await findNextAvailableSlotForStudio(studioId);
        slotDate = slot.date;
        slotTime = slot.time;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Créneau indisponible';
        setDepositError(msg);
        toast.error(msg);
        setDepositLoading(false);
        return;
      }
      const now = new Date().toISOString();
      const aptId = `apt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const serviceName =
        depositModalProject.description.length > 50
          ? `${depositModalProject.description.slice(0, 47)}...`
          : depositModalProject.description;
      const newApt: Appointment = {
        id: aptId,
        clientId: '',
        clientName: depositModalProject.clientName,
        clientEmail: depositModalProject.clientEmail,
        clientPhone: '',
        date: slotDate,
        time: slotTime,
        service: `Projet - ${serviceName}`,
        duration: 60,
        price: 0,
        deposit: amount,
        depositPaid: false,
        status: 'pending',
        tattooType: 'custom',
        location: 'arm',
        size: 'medium',
        consentFormSigned: false,
        createdAt: now,
        updatedAt: now,
        projectRequestId: depositModalProject.id,
      };
      setDepositError(null);
      try {
        await saveAppointmentToSupabase(studioId, newApt);
        onAddAppointment(newApt);
        const result = await createCheckoutSession({
          studioId,
          studioSlug: studioSlug ?? undefined,
          appointmentId: aptId,
          amount,
          clientName: depositModalProject.clientName,
          clientEmail: depositModalProject.clientEmail,
          serviceName: newApt.service,
          type: 'deposit',
          projectRequestId: depositModalProject.id,
          threadId: `pr_${depositModalProject.id}`,
        });
        if ('url' in result) {
          setDepositUrl(result.url);
          const threadUrl = inkflowPublicMessagesUrl(`pr_${depositModalProject.id}`);
          const sent = await sendBookingConfirmation({
            studioId,
            clientEmail: depositModalProject.clientEmail,
            clientName: depositModalProject.clientName,
            studioName: user?.studioName || 'Le studio',
            requestedDate: newApt.date,
            requestedTime: newApt.time,
            description: newApt.service,
            paymentLink: result.url,
            recapUrl: threadUrl,
            conversationLink: threadUrl,
            ...(clientPortalUrlForEmails ? { clientPortalUrl: clientPortalUrlForEmails } : {}),
          });
          if (sent.ok) {
            toast.success(
              sent.smsSent
                ? 'RDV créé — email et SMS (lien) envoyés avec le lien de paiement.'
                : 'RDV créé, lien généré et email envoyé au client avec le lien de paiement.'
            );
          } else {
            toast.error(sent.error || "RDV créé mais l'email n'a pas été envoyé.");
          }
        } else {
          setDepositError(result.error || 'stripe_config');
        }
      } catch (e) {
        setDepositError(
          e instanceof Error ? e.message : 'Erreur lors de la création du RDV ou du lien'
        );
      } finally {
        setDepositLoading(false);
      }
    }
  };

  const handleCopyDepositLink = async () => {
    if (!depositUrl) return;
    try {
      await navigator.clipboard.writeText(depositUrl);
      toast.success('Lien copié dans le presse-papier');
    } catch {
      toast.error('Impossible de copier le lien');
    }
  };

  /** Statut court (compteur) par onglet. */
  const tabStatusLine: Record<'inbox' | 'history', string> = {
    inbox: inboxStatusLine,
    history: 'Anciennes demandes déjà traitées (refus, acomptes, archivées).',
  };

  const countBadge = (source: RequestsSourceFilter, n: number) =>
    n > 0 ? (
      <span
        className={`min-w-[22px] h-[22px] px-1.5 inline-flex items-center justify-center text-[11px] font-bold rounded-full tabular-nums ${
          isInboxSourceActive(source)
            ? 'bg-zinc-900/10 text-zinc-900 dark:bg-white/15 dark:text-zinc-100'
            : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300'
        }`}
      >
        {n}
      </span>
    ) : null;

  return (
    <div className="w-full min-w-0">
      <Card>
        <CardHeader className="space-y-4 border-b border-border pb-4">
          {(activeTab === 'history' || (activeTab === 'inbox' && inboxSourceFilter !== 'all')) && (
            <button
              type="button"
              onClick={() => selectTab('inbox')}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:text-zinc-900 active:scale-[0.98] dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
              File d’attente
            </button>
          )}
          <div className="min-w-0">
            <CardTitle id={`requests-tab-${activeTab}`} className={dashboardPageCardTitle}>
              {activeTab === 'history' ? 'Historique' : inboxSectionTitle}
            </CardTitle>
            <CardDescription className="mt-1.5 max-w-2xl">
              {activeTab === 'inbox' ? inboxStatusLine : tabStatusLine[activeTab]}
            </CardDescription>
          </div>

          {activeTab === 'inbox' && (
            <div
              className="flex flex-col gap-2.5"
              role="region"
              aria-label="Filtres de la file d'attente"
            >
              {isMobile ? (
                <CapsuleTabs
                  activeKey={inboxQueueScope}
                  onChange={(key) => setInboxQueueScope(key as 'action' | 'all')}
                >
                  <CapsuleTabs.Tab title="À traiter" key="action" />
                  <CapsuleTabs.Tab title="Tout" key="all" />
                </CapsuleTabs>
              ) : (
                <div
                  className={cn('grid grid-cols-2 gap-1', dashboardFilterPillContainer)}
                  role="tablist"
                  aria-label="Périmètre"
                >
                  <RequestsMotionButton
                    type="button"
                    role="tab"
                    aria-selected={inboxQueueScope === 'action'}
                    onClick={() => setInboxQueueScope('action')}
                    className={`flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/90 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      inboxQueueScope === 'action'
                        ? dashboardFilterPillActive
                        : dashboardFilterPillInactive
                    }`}
                  >
                    À traiter
                  </RequestsMotionButton>
                  <RequestsMotionButton
                    type="button"
                    role="tab"
                    aria-selected={inboxQueueScope === 'all'}
                    onClick={() => setInboxQueueScope('all')}
                    className={`flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/90 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      inboxQueueScope === 'all'
                        ? dashboardFilterPillActive
                        : dashboardFilterPillInactive
                    }`}
                  >
                    Tout
                  </RequestsMotionButton>
                </div>
              )}
              {isMobile ? (
                <CapsuleTabs
                  activeKey={inboxKind}
                  onChange={(key) => setInboxKind(key as typeof inboxKind)}
                >
                  <CapsuleTabs.Tab title="Tous types" key="all" />
                  <CapsuleTabs.Tab title="Flash" key="flash" />
                  <CapsuleTabs.Tab title="Agenda & projets" key="manual" />
                </CapsuleTabs>
              ) : (
                <div
                  className={dashboardFilterChipTrack}
                  role="tablist"
                  aria-label="Type de demande"
                >
                  {(
                    [
                      { id: 'all' as const, label: 'Tous types' },
                      { id: 'flash' as const, label: 'Flash' },
                      { id: 'manual' as const, label: 'Agenda & projets' },
                    ] as const
                  ).map(({ id, label }) => (
                    <RequestsMotionButton
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={inboxKind === id}
                      onClick={() => setInboxKind(id)}
                      className={`shrink-0 min-h-[44px] px-3.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                        inboxKind === id ? dashboardFilterChipActive : dashboardFilterChipInactive
                      }`}
                    >
                      {label}
                    </RequestsMotionButton>
                  ))}
                </div>
              )}
              {inboxSourceFilter !== 'all' && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-zinc-50/80 px-3 py-2 dark:bg-zinc-900/40">
                  <Badge variant="outline" className="gap-1.5 font-semibold">
                    <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    Source : {INBOX_SOURCE_LABELS[inboxSourceFilter]}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => applyInboxSource('all')}
                    className="text-xs font-semibold text-zinc-600 underline-offset-2 transition-colors hover:text-zinc-900 hover:underline active:scale-[0.98] dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Tout afficher
                  </button>
                </div>
              )}
              <RequestsMotionButton
                type="button"
                onClick={() => setSourcesModalOpen(true)}
                className={`flex w-full min-h-[48px] items-center justify-between gap-3 ${dashboardSecondaryBtn} px-4 text-left`}
              >
                <span className="inline-flex min-w-0 items-center gap-2 type-body font-semibold">
                  <Inbox className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0">
                    {inboxSourceFilter !== 'all'
                      ? INBOX_SOURCE_LABELS[inboxSourceFilter]
                      : 'Sources du studio'}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </RequestsMotionButton>
              {firstInboxTarget ? (
                <InboxTreatNextBar
                  totalPending={inboxPendingTotal}
                  target={firstInboxTarget}
                  onPrimary={handleInboxPrimary}
                />
              ) : null}
            </div>
          )}

          {activeTab !== 'inbox' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSourcesModalOpen(true)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 type-caption font-semibold text-foreground transition-all active:scale-[0.98]"
              >
                Sources
                <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
              </button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <PullToRefresh onRefresh={handlePullRefresh} disabled={!isMobile}>
            <RequestsTabPanel
              tabKey={activeTab}
              id="requests-panel"
              role="tabpanel"
              aria-labelledby={`requests-tab-${activeTab}`}
              className="divide-y divide-border border-0 bg-transparent shadow-none"
            >
              {activeTab === 'inbox' && (
                <>
                  {bookingsLoadError && onRetryBookings && !bookingsLoading ? (
                    <RequestsListErrorBanner
                      message={bookingsLoadError}
                      onRetry={onRetryBookings}
                    />
                  ) : null}
                  {projectRequestsLoadError && onRetryProjectRequests && !projectRequestsLoading ? (
                    <RequestsListErrorBanner
                      message={projectRequestsLoadError}
                      onRetry={onRetryProjectRequests}
                    />
                  ) : null}
                  {inboxNothingToShow && !bookingsLoading && !projectRequestsLoading ? (
                    <DashboardAdmEmpty
                      icon={
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                          <Inbox className="h-8 w-8 text-zinc-400 dark:text-zinc-500" aria-hidden />
                        </div>
                      }
                      title="Rien à afficher avec ces filtres"
                      description='Essayez "Tout" ou "Tous types", ou ouvrez une source (bouton « Sources du studio »).'
                    />
                  ) : (
                    <RequestsInboxStagger className="space-y-6 px-4 py-4 sm:px-6">
                      {showInboxAgenda && inboxAgendaList.length > 0 && (
                        <section
                          className="space-y-2"
                          aria-label={`Créneaux agenda, ${inboxAgendaList.length} élément(s)`}
                        >
                          <h3 className={cn(dashboardInboxSectionTitle, 'px-0.5')}>
                            Créneaux agenda
                            <span className="ml-1.5 text-zinc-400 tabular-nums">
                              ({inboxAgendaList.length})
                            </span>
                          </h3>
                          <div className="flex flex-col gap-3">
                            {inboxAgendaList.map((apt) => (
                              <AgendaRequestCardView
                                key={apt.id}
                                apt={apt}
                                getAvatar={getAvatar}
                                stampRw={stampRewardForEmail(apt.clientEmail)}
                                onAccept={() => handleConfirm(apt)}
                                onRefuse={() => setRejectPending({ kind: 'appointment', apt })}
                                onDeposit={() => openDepositModal(apt)}
                                onOpenDiscussion={onOpenProjectDiscussion}
                                studioId={studioId}
                                onOpenClientFiche={
                                  onOpenClientFicheFromDemande
                                    ? () =>
                                        onOpenClientFicheFromDemande({
                                          kind: 'appointment',
                                          appointment: apt,
                                        })
                                    : undefined
                                }
                              />
                            ))}
                          </div>
                        </section>
                      )}

                      {showInboxBook && inboxBookList.length > 0 && (
                        <section
                          className="space-y-2"
                          aria-label={`Page book, ${inboxBookList.length} élément(s)`}
                        >
                          <h3 className={cn(dashboardInboxSectionTitle, 'px-0.5')}>
                            Page book
                            <span className="ml-1.5 text-zinc-400 tabular-nums">
                              ({inboxBookList.length})
                            </span>
                          </h3>
                          {bookingsLoading ? (
                            <RequestsBookingsListSkeleton />
                          ) : (
                            <div className="divide-y divide-border">
                              {inboxBookList.map((bk) => {
                                const thumbUrl =
                                  (bk.referenceImages && bk.referenceImages[0]) || null;
                                const crmAvatar = getAvatar(
                                  bk.clientEmail,
                                  undefined,
                                  bk.clientName
                                );
                                const displayThumb =
                                  trimAvatarUrl(bk.clientAvatarUrl) || crmAvatar || thumbUrl;
                                const reqType = inferRequestType(bk.description);
                                const placement = bk.placement;
                                const size = bk.size;
                                const stampRwBk = stampRewardForEmail(bk.clientEmail);
                                const igHandle = parseInstagramHandle(undefined, bk.description);
                                const bookingMailtoHref = buildMailtoHref(
                                  bk.clientEmail,
                                  'Votre demande de tatouage'
                                );
                                const vitrineAccent =
                                  reqType === 'flash'
                                    ? SOURCE_ACCENT.vitrineFlash
                                    : SOURCE_ACCENT.vitrineCustom;
                                return (
                                  <RequestsListRowMotion
                                    key={bk.id}
                                    className={cn(
                                      dashboardListRow,
                                      dashboardListRowHover,
                                      'border-l-[3px]',
                                      vitrineAccent
                                    )}
                                  >
                                    <div className="flex flex-1 min-w-0 gap-2 items-start">
                                      <button
                                        type="button"
                                        onClick={() => setSheetItem({ ...bk, _type: 'booking' })}
                                        className="flex flex-1 min-w-0 text-left w-full lg:flex-initial lg:min-w-0 lg:max-w-[min(100%,42rem)] xl:max-w-[min(100%,48rem)]"
                                      >
                                        <div className="flex gap-3 sm:gap-4 items-start md:items-center min-w-0 w-full">
                                          <div
                                            className={cn(
                                              dashboardListAvatarFrame,
                                              'size-11 sm:size-12 md:size-14 overflow-hidden'
                                            )}
                                          >
                                            {displayThumb ? (
                                              <img
                                                src={displayThumb}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                className="size-full object-cover"
                                              />
                                            ) : (
                                              <span className="flex size-full items-center justify-center text-muted-foreground">
                                                <FileText className="size-5 sm:size-6" />
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-foreground break-words">
                                              {bk.clientName}
                                            </div>
                                            <div className="mt-0.5 flex min-w-0 items-start gap-2 text-xs text-muted-foreground sm:text-sm">
                                              <Mail className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                              <span className="min-w-0 truncate sm:whitespace-normal sm:break-words">
                                                {bk.clientEmail}
                                              </span>
                                            </div>
                                            {stampRwBk && (
                                              <div
                                                className={cn(
                                                  'mt-2 sm:mt-2.5',
                                                  REQUESTS_STAMP_BANNER
                                                )}
                                              >
                                                <Gift className="mt-0.5 size-3.5 shrink-0 text-emerald-600 sm:size-4 dark:text-emerald-400" />
                                                <span className="leading-snug">
                                                  <span className="hidden sm:inline">
                                                    Avantage fidélité :{' '}
                                                  </span>
                                                  <span className="sm:hidden">Fidélité </span>
                                                  <strong>{stampRwBk.amountEuros}€</strong>
                                                  <span className="hidden sm:inline text-emerald-800/80 dark:text-emerald-200/80">
                                                    {' '}
                                                    — code{' '}
                                                  </span>
                                                  <span className="sm:hidden text-emerald-800/80 dark:text-emerald-200/80">
                                                    {' '}
                                                    ·{' '}
                                                  </span>
                                                  <code className="rounded-md bg-white/70 px-1 py-0.5 font-mono text-[10px] dark:bg-emerald-950/40 sm:px-1.5 sm:text-xs">
                                                    {stampRwBk.promoCode}
                                                  </code>
                                                </span>
                                              </div>
                                            )}
                                            <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-2.5">
                                              <Badge
                                                variant="outline"
                                                className={cn(
                                                  'gap-1 font-semibold',
                                                  reqType === 'flash' &&
                                                    'border-emerald-200 text-emerald-900 dark:border-emerald-500/40 dark:text-emerald-300'
                                                )}
                                              >
                                                {reqType === 'flash' ? (
                                                  <Sparkles className="size-3" />
                                                ) : (
                                                  <FileText className="size-3" />
                                                )}
                                                {reqType === 'flash' ? 'Flash' : 'Sur-mesure'}
                                              </Badge>
                                              {placement && (
                                                <span
                                                  className={cn(
                                                    'hidden sm:inline-flex',
                                                    REQUESTS_META_CHIP
                                                  )}
                                                >
                                                  <MapPin className="size-3" />{' '}
                                                  {formatPlacementForBadge(placement)}
                                                </span>
                                              )}
                                              {size && (
                                                <span
                                                  className={cn(
                                                    'hidden sm:inline-flex',
                                                    REQUESTS_META_CHIP
                                                  )}
                                                >
                                                  <Ruler className="size-3" />{' '}
                                                  {formatSizeForBadge(size)}
                                                </span>
                                              )}
                                            </div>
                                            <p className="type-body mt-2 sm:mt-2.5 line-clamp-1 sm:line-clamp-2">
                                              {bk.description}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                                              <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 sm:px-2 py-0.5 rounded">
                                                {new Date(bk.requestedDate).toLocaleDateString(
                                                  'fr-FR',
                                                  {
                                                    dateStyle: 'medium',
                                                  }
                                                )}
                                              </span>
                                              {bk.requestedTime && (
                                                <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 sm:px-2 py-0.5 rounded">
                                                  {bk.requestedTime === 'morning'
                                                    ? 'Matin'
                                                    : bk.requestedTime === 'afternoon'
                                                      ? 'Après-midi'
                                                      : bk.requestedTime === 'evening'
                                                        ? 'Soirée'
                                                        : bk.requestedTime}
                                                </span>
                                              )}
                                            </div>
                                            <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-1.5">
                                              {isDemoInboxBooking(bk.id) ? (
                                                <Badge variant="outline" className="font-semibold">
                                                  Exemple
                                                </Badge>
                                              ) : null}
                                              <span
                                                className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${
                                                  bk.status === 'pending'
                                                    ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                                    : bk.status === 'confirmed' ||
                                                        bk.status === 'accepted'
                                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                                }`}
                                              >
                                                {BOOKING_STATUS_LABELS[bk.status] || bk.status}
                                              </span>
                                              {bk.status === 'pending' &&
                                              inboxSlaUrgencyLabel(bk.createdAt) ? (
                                                <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 dark:bg-red-500/20 dark:text-red-300 sm:text-[11px]">
                                                  <Clock className="size-3 shrink-0" aria-hidden />
                                                  {inboxSlaUrgencyLabel(bk.createdAt)}
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                      </button>
                                      {onOpenClientFicheFromDemande && (
                                        <button
                                          type="button"
                                          title="Fiche client complète"
                                          aria-label="Fiche client complète"
                                          onClick={() =>
                                            onOpenClientFicheFromDemande({
                                              kind: 'booking',
                                              booking: bk,
                                            })
                                          }
                                          className={FICHE_CLIENT_ICON_BTN}
                                        >
                                          <User className="w-5 h-5 shrink-0" aria-hidden />
                                        </button>
                                      )}
                                    </div>
                                    {bk.status === 'pending' && (
                                      <div
                                        className="flex-shrink-0 w-full lg:w-[min(100%,20.5rem)] xl:w-[22rem] pt-2.5 sm:pt-3 mt-0.5 border-t border-zinc-100 dark:border-zinc-800 lg:pt-0 lg:mt-0 lg:border-t-0 lg:ml-auto"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="rounded-xl sm:rounded-2xl border border-zinc-200/90 dark:border-zinc-700/90 bg-zinc-50/90 dark:bg-zinc-900/45 p-2.5 sm:p-3.5 shadow-sm">
                                          <InboxQuickActions
                                            groupLabel="Actions pour cette demande vitrine"
                                            primary={{
                                              key: 'confirm',
                                              label: 'Confirmer',
                                              title:
                                                'Envoie un email de confirmation au client sans exiger d’acompte.',
                                              onClick: () => void handleConfirmBooking(bk),
                                              variant: 'primary',
                                              icon: (
                                                <CheckCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
                                              ),
                                            }}
                                            secondary={[
                                              ...(studioId && onAddAppointment
                                                ? [
                                                    {
                                                      key: 'deposit',
                                                      label: 'Acompte (Stripe)',
                                                      onClick: () => openDepositModalForBooking(bk),
                                                      icon: (
                                                        <CreditCard className="w-4 h-4 shrink-0 stroke-[1.75]" />
                                                      ),
                                                    },
                                                  ]
                                                : []),
                                              {
                                                key: 'refuse',
                                                label: 'Refuser',
                                                onClick: () =>
                                                  setRejectPending({ kind: 'booking', bk }),
                                                variant: 'danger' as const,
                                                icon: <XCircle className="w-4 h-4 shrink-0" />,
                                              },
                                              ...(onOpenProjectDiscussion
                                                ? [
                                                    {
                                                      key: 'msg',
                                                      label: 'Messagerie',
                                                      onClick: () => onOpenProjectDiscussion(bk.id),
                                                      variant: 'primary' as const,
                                                      icon: (
                                                        <MessageCircle className="w-4 h-4 shrink-0" />
                                                      ),
                                                    },
                                                  ]
                                                : []),
                                              ...(igHandle
                                                ? [
                                                    {
                                                      key: 'ig',
                                                      label: 'IG',
                                                      onClick: () => {
                                                        window.open(
                                                          instagramMessageUrl(igHandle),
                                                          '_blank',
                                                          'noopener,noreferrer'
                                                        );
                                                      },
                                                      icon: <AtSign className="w-4 h-4 shrink-0" />,
                                                    },
                                                  ]
                                                : []),
                                              {
                                                key: 'email',
                                                label: 'Email',
                                                onClick: () => {
                                                  if (!bookingMailtoHref) {
                                                    toast.error(
                                                      'Adresse e-mail du client invalide ou manquante.'
                                                    );
                                                    return;
                                                  }
                                                  window.location.href = bookingMailtoHref;
                                                },
                                                hidden: !bookingMailtoHref,
                                                icon: <Mail className="w-4 h-4 shrink-0" />,
                                              },
                                            ]}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </RequestsListRowMotion>
                                );
                              })}
                            </div>
                          )}
                        </section>
                      )}

                      {showInboxBrief && inboxProjectList.length > 0 && (
                        <section
                          className="space-y-2"
                          aria-label={`Brief sans date, ${inboxProjectList.length} élément(s)`}
                        >
                          <h3 className={cn(dashboardInboxSectionTitle, 'px-0.5')}>
                            Brief sans date
                            <span className="ml-1.5 text-zinc-400 tabular-nums">
                              ({inboxProjectList.length})
                            </span>
                          </h3>
                          {projectRequestsLoading ? (
                            <div className="type-body text-muted-foreground py-8 text-center">
                              <Loader2 className="w-6 h-6 animate-spin inline text-zinc-400" />
                            </div>
                          ) : (
                            <div className="divide-y divide-border">
                              {inboxProjectList.map((pr) => {
                                const thumbUrl =
                                  (pr.referenceImages && pr.referenceImages[0]) || null;
                                const reqType = inferRequestType(pr.description, pr.placement);
                                const igProject = parseInstagramHandle(
                                  pr.clientInstagram,
                                  pr.description
                                );
                                return (
                                  <RequestsListRowMotion key={pr.id} className={dashboardListRow}>
                                    <div className="flex flex-1 min-w-0 gap-2 items-start md:items-center w-full md:w-auto">
                                      <button
                                        type="button"
                                        onClick={() => setSheetItem({ ...pr, _type: 'project' })}
                                        className="flex flex-1 min-w-0 text-left w-full md:flex-initial md:w-auto"
                                      >
                                        <div className="flex gap-4 items-start md:items-center">
                                          <div className={cn(dashboardAvatarFrame, 'size-16')}>
                                            {thumbUrl ? (
                                              <img
                                                src={thumbUrl}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <span className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                                                <FileText className="w-8 h-8" />
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="type-heading-sm">{pr.clientName}</div>
                                            <div className="type-body text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                                              <span className="flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                                {pr.clientEmail}
                                              </span>
                                              {igProject && (
                                                <span className="type-caption">@{igProject}</span>
                                              )}
                                            </div>
                                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                                              <Badge
                                                variant="outline"
                                                className={cn(
                                                  'gap-1 font-semibold',
                                                  reqType === 'flash' &&
                                                    'border-emerald-200 text-emerald-900 dark:border-emerald-500/40 dark:text-emerald-300'
                                                )}
                                              >
                                                {reqType === 'flash' ? (
                                                  <Sparkles className="size-3" />
                                                ) : (
                                                  <FileText className="size-3" />
                                                )}
                                                {reqType === 'flash' ? 'Flash' : 'Sur-mesure'}
                                              </Badge>
                                              {pr.placement && (
                                                <span className={REQUESTS_META_CHIP}>
                                                  <MapPin className="size-3" />{' '}
                                                  {formatPlacementForBadge(pr.placement)}
                                                </span>
                                              )}
                                              {pr.size && (
                                                <span className={REQUESTS_META_CHIP}>
                                                  <Ruler className="size-3" />{' '}
                                                  {formatSizeForBadge(pr.size)}
                                                </span>
                                              )}
                                            </div>
                                            <p className="type-body mt-2.5 line-clamp-2">
                                              {pr.description}
                                            </p>
                                            <div className="type-caption mt-2">
                                              {new Date(pr.createdAt).toLocaleString('fr-FR', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                              })}
                                            </div>
                                            {pr.status === 'pending' && (
                                              <Badge
                                                variant="outline"
                                                className="mt-3 gap-1.5 font-semibold"
                                              >
                                                <span
                                                  className="size-1.5 shrink-0 rounded-full bg-emerald-500"
                                                  aria-hidden
                                                />
                                                Nouvelle
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </button>
                                      {onOpenClientFicheFromDemande && (
                                        <button
                                          type="button"
                                          title="Fiche client complète"
                                          aria-label="Fiche client complète"
                                          onClick={() =>
                                            onOpenClientFicheFromDemande({
                                              kind: 'project',
                                              project: pr,
                                            })
                                          }
                                          className={FICHE_CLIENT_ICON_BTN}
                                        >
                                          <User className="w-5 h-5 shrink-0" aria-hidden />
                                        </button>
                                      )}
                                    </div>
                                    <div
                                      className="flex flex-col gap-3 flex-shrink-0 w-full md:w-auto md:max-w-sm md:ml-4"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="space-y-2">
                                        <p className="dashboardSectionTitle px-0.5">Actions</p>
                                        {pr.status === 'pending' ? (
                                          <InboxQuickActions
                                            groupLabel="Actions brief"
                                            primary={
                                              studioId
                                                ? {
                                                    key: 'accept',
                                                    label: 'Accepter le projet',
                                                    onClick: () => setAcceptProjectTarget(pr),
                                                    variant: 'primary',
                                                    icon: (
                                                      <CheckCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
                                                    ),
                                                  }
                                                : {
                                                    key: 'msg',
                                                    label: 'Messagerie',
                                                    onClick: () =>
                                                      onOpenProjectDiscussion?.(`pr_${pr.id}`),
                                                    variant: 'primary',
                                                    icon: (
                                                      <MessageCircle className="w-4 h-4 shrink-0" />
                                                    ),
                                                  }
                                            }
                                            secondary={[
                                              {
                                                key: 'msg',
                                                label: 'Messagerie',
                                                onClick: () =>
                                                  onOpenProjectDiscussion?.(`pr_${pr.id}`),
                                                icon: (
                                                  <MessageCircle className="w-4 h-4 shrink-0" />
                                                ),
                                              },
                                              ...(studioId && onAddAppointment
                                                ? [
                                                    {
                                                      key: 'deposit',
                                                      label: 'Acompte (Stripe)',
                                                      onClick: () => openDepositModalForProject(pr),
                                                      icon: (
                                                        <CreditCard className="w-4 h-4 shrink-0" />
                                                      ),
                                                    },
                                                  ]
                                                : []),
                                              {
                                                key: 'refuse',
                                                label: 'Refuser',
                                                onClick: () =>
                                                  setRejectPending({ kind: 'project', pr }),
                                                variant: 'danger' as const,
                                                icon: <XCircle className="w-4 h-4 shrink-0" />,
                                              },
                                            ]}
                                          />
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => onOpenProjectDiscussion?.(`pr_${pr.id}`)}
                                            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition-all active:scale-[0.98] dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100"
                                          >
                                            <MessageCircle className="w-4 h-4 shrink-0" />{' '}
                                            Messagerie
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </RequestsListRowMotion>
                                );
                              })}
                            </div>
                          )}
                        </section>
                      )}
                    </RequestsInboxStagger>
                  )}
                </>
              )}

              {activeTab === 'history' &&
                (historyAppointments.length === 0 ? (
                  <DashboardAdmEmpty
                    icon={
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                        <History className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
                      </div>
                    }
                    title="Aucun historique"
                    description="Les RDV agenda déjà traités (hors « en attente ») apparaissent ici."
                  />
                ) : (
                  <div className="divide-y divide-border">
                    {historyAppointments.map((apt) => {
                      const stampRw = stampRewardForEmail(apt.clientEmail);
                      const statusLabel =
                        apt.status === 'confirmed'
                          ? 'Confirmé'
                          : apt.status === 'cancelled'
                            ? 'Annulé'
                            : STATUS_LABELS[apt.status] || apt.status;
                      return (
                        <div key={apt.id} className={cn(dashboardListRow, 'gap-4')}>
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4 min-w-0">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-200/90 ring-1 ring-zinc-300/80 dark:bg-zinc-800 dark:ring-zinc-600/80">
                              <ClientPhotoAvatar
                                name={apt.clientName}
                                src={getAvatar(apt.clientEmail, apt.clientId, apt.clientName)}
                                className="h-full w-full"
                                textClassName="text-lg font-bold text-zinc-700 dark:text-zinc-200"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="type-heading-sm">{apt.clientName}</div>
                              <div className="type-body text-muted-foreground mt-0.5 flex items-center gap-1.5 min-w-0">
                                <Mail className="w-3.5 h-3.5 shrink-0 stroke-[1.75] text-zinc-400 dark:text-zinc-500" />
                                <span className="truncate">{apt.clientEmail}</span>
                              </div>
                              {stampRw && (
                                <div className={cn('mt-3', REQUESTS_STAMP_BANNER)}>
                                  <Gift className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                  <span>
                                    Ce client possède un avantage de{' '}
                                    <strong>{stampRw.amountEuros}€</strong> à valoir sur ce projet —
                                    code{' '}
                                    <code className="rounded-md bg-white/70 px-1.5 py-0.5 font-mono text-xs dark:bg-emerald-950/40">
                                      {stampRw.promoCode}
                                    </code>
                                  </span>
                                </div>
                              )}
                              <div className="mt-3 flex flex-wrap items-center gap-2 type-body text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1 tabular-nums text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
                                  <Calendar className="size-3.5 shrink-0 stroke-[1.75]" />
                                  {apt.date} • {apt.time}
                                </span>
                                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                  {apt.service}
                                </span>
                                <span className="font-semibold tabular-nums text-foreground">
                                  {apt.price}€
                                </span>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className={REQUESTS_META_CHIP}>
                                  <Calendar className="size-3 shrink-0 stroke-[1.75]" aria-hidden />
                                  Agenda
                                </span>
                                <span
                                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                    apt.status === 'confirmed'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                      : apt.status === 'cancelled'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                  }`}
                                >
                                  {statusLabel}
                                </span>
                                {apt.status === 'confirmed' && apt.depositPaid && (
                                  <Badge variant="outline" className="gap-1.5 font-semibold">
                                    <span
                                      className="size-1.5 shrink-0 rounded-full bg-emerald-500"
                                      aria-hidden
                                    />
                                    Acompte payé
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {onOpenClientFicheFromDemande && (
                              <button
                                type="button"
                                title="Fiche client complète"
                                aria-label="Fiche client complète"
                                onClick={() =>
                                  onOpenClientFicheFromDemande({
                                    kind: 'appointment',
                                    appointment: apt,
                                  })
                                }
                                className={`shrink-0 self-start sm:mt-0.5 ${FICHE_CLIENT_ICON_BTN}`}
                              >
                                <User className="w-5 h-5 shrink-0" aria-hidden />
                              </button>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 sm:items-end sm:ml-14">
                            <div className="flex flex-wrap gap-2 w-full sm:justify-end">
                              {apt.status === 'confirmed' && !apt.depositPaid && studioId && (
                                <button
                                  type="button"
                                  onClick={() => openDepositModal(apt)}
                                  className="flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all text-sm"
                                >
                                  <CreditCard className="w-4 h-4 shrink-0 stroke-[1.75]" /> Acompte
                                </button>
                              )}
                              {user && (
                                <DevisButton appointment={apt} artist={user} studioId={studioId} />
                              )}
                              {apt.status === 'confirmed' && user && (
                                <InvoiceButton
                                  appointment={apt}
                                  artist={user}
                                  studioId={studioId}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
            </RequestsTabPanel>
          </PullToRefresh>
        </CardContent>
      </Card>

      <Modal
        isOpen={sourcesModalOpen}
        onClose={() => setSourcesModalOpen(false)}
        title="Sources des demandes"
        size="sm"
      >
        <div className="flex flex-col gap-2 p-1 max-h-[min(70dvh,520px)] overflow-y-auto">
          <p className="type-subtitle mb-1">
            Ouvrez une liste filtrée par point d’entrée (même contenu qu’avant, sans quitter
            l’esprit « file d’attente »).
          </p>
          <button
            type="button"
            onClick={() => {
              selectTab('inbox');
              setSourcesModalOpen(false);
            }}
            className={`w-full min-h-[48px] flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left type-body font-semibold transition-all ${
              activeTab === 'inbox' && inboxSourceFilter === 'all'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 border border-transparent hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'
            }`}
          >
            <span className="inline-flex items-center gap-2 min-w-0">
              <Inbox className="w-4 h-4 shrink-0" aria-hidden />
              <span className="min-w-0">File d’attente (vue unifiée)</span>
            </span>
            {activeTab === 'inbox' && inboxSourceFilter === 'all' && (
              <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                actif
              </span>
            )}
          </button>
          {(
            [
              {
                id: 'rdv' as const,
                label: 'Créneaux agenda',
                sub: 'RDV en attente dans l’agenda',
                icon: Calendar,
                count: pendingAppointments.length,
              },
              {
                id: 'bookings' as const,
                label: 'Page book',
                sub: 'Réservations /book',
                icon: Clock,
                count: pendingBookings.length,
              },
              {
                id: 'projects' as const,
                label: 'Brief sans date',
                sub: 'Formulaire projet sans date',
                icon: FileText,
                count: pendingProjects.length,
              },
              {
                id: 'history' as const,
                label: 'Historique',
                sub: 'Demandes agenda déjà traitées',
                icon: History,
                count: 0,
              },
            ] as const
          ).map(({ id, label, sub, icon: Icon, count }) => {
            const sourceFilter: RequestsSourceFilter | 'history' =
              id === 'rdv'
                ? 'agenda'
                : id === 'bookings'
                  ? 'book'
                  : id === 'projects'
                    ? 'brief'
                    : 'history';
            const isActive = isInboxSourceActive(sourceFilter);
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  selectTab(id);
                  setSourcesModalOpen(false);
                }}
                className={`w-full min-h-[48px] flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left type-body font-semibold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                    : 'text-zinc-600 dark:text-zinc-400 border border-transparent hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'
                }`}
              >
                <span className="inline-flex min-w-0 items-start gap-2">
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                  <span className="min-w-0 flex flex-col">
                    <span className="truncate">{label}</span>
                    <span className="type-caption font-normal">{sub}</span>
                  </span>
                </span>
                {id !== 'history' && count > 0
                  ? countBadge(
                      id === 'rdv' ? 'agenda' : id === 'bookings' ? 'book' : 'brief',
                      count
                    )
                  : null}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Sheet Quick View — aperçu rapide au clic sur une demande */}
      <RequestQuickViewSheet
        isOpen={!!sheetItem}
        onClose={() => setSheetItem(null)}
        item={sheetItem}
        thumbnailUrl={
          sheetItem && '_type' in sheetItem
            ? sheetItem._type === 'project'
              ? (sheetItem as ProjectRequest).referenceImages?.[0]
              : (sheetItem as Booking).referenceImages?.[0] ||
                (sheetItem as Booking).clientAvatarUrl
            : null
        }
        requestType={
          sheetItem && 'description' in sheetItem
            ? inferRequestType(sheetItem.description, (sheetItem as ProjectRequest).placement)
            : 'custom'
        }
        placement={
          sheetItem && '_type' in sheetItem
            ? sheetItem._type === 'project'
              ? (sheetItem as ProjectRequest).placement
              : (sheetItem as Booking).placement
            : null
        }
        size={
          sheetItem && '_type' in sheetItem
            ? sheetItem._type === 'project'
              ? (sheetItem as ProjectRequest).size
              : (sheetItem as Booking).size
            : null
        }
        studioId={studioId}
        instagramHandle={
          sheetItem && '_type' in sheetItem
            ? parseInstagramHandle(
                sheetItem._type === 'project'
                  ? (sheetItem as ProjectRequest).clientInstagram
                  : undefined,
                sheetItem.description
              )
            : undefined
        }
        onAcceptAndDeposit={
          studioId && onAddAppointment
            ? (item) => {
                if (item._type === 'project') openDepositModalForProject(item as ProjectRequest);
                else openDepositModalForBooking(item as Booking);
              }
            : undefined
        }
        onReject={(item) => {
          setSheetItem(null);
          if (item._type === 'project')
            setRejectPending({ kind: 'project', pr: item as ProjectRequest });
          else setRejectPending({ kind: 'booking', bk: item as Booking });
        }}
        onProposeDate={(item) => {
          setProposeDateItem(item);
          setSheetItem(null);
        }}
        onConfirmVitrineBooking={async (item) => {
          if (item._type === 'booking') await handleConfirmBooking(item);
        }}
        onOpenFullClientFiche={
          sheetItem && onOpenClientFicheFromDemande
            ? () => {
                if (sheetItem._type === 'project') {
                  onOpenClientFicheFromDemande({ kind: 'project', project: sheetItem });
                } else {
                  onOpenClientFicheFromDemande({ kind: 'booking', booking: sheetItem });
                }
              }
            : undefined
        }
        onOpenProjectDiscussion={onOpenProjectDiscussion}
        onAcceptProject={
          studioId
            ? (project) => {
                setAcceptProjectTarget(project);
                setSheetItem(null);
              }
            : undefined
        }
      />

      <AcceptProjectModal
        isOpen={!!acceptProjectTarget}
        onClose={() => setAcceptProjectTarget(null)}
        projectRequest={acceptProjectTarget}
        studioId={studioId}
        appointments={appointments}
        demoMode={demoMode}
        onSuccess={() => onProjectRequestsInvalidate?.()}
      />

      <ProposeAlternativeDateModal
        isOpen={!!proposeDateItem && !!studioId}
        onClose={() => setProposeDateItem(null)}
        item={proposeDateItem}
        studioId={studioId}
        appointments={appointments}
        studioName={user?.studioName || 'Le studio'}
        replyToEmail={user?.email}
        instagramHandle={
          proposeDateItem && '_type' in proposeDateItem
            ? parseInstagramHandle(
                proposeDateItem._type === 'project' ? proposeDateItem.clientInstagram : undefined,
                proposeDateItem.description
              )
            : null
        }
        onOpenInkflowDiscussion={onOpenProjectDiscussion}
      />

      {/* Modale : montant acompte → génération lien Stripe → copier */}
      <Modal
        isOpen={!!depositModalAppointment || !!depositModalBooking || !!depositModalProject}
        onClose={closeDepositModal}
        title={
          depositModalBooking
            ? 'Demander un acompte (depuis la demande)'
            : depositModalProject
              ? "Envoyer un lien d'acompte (projet)"
              : "Générer un lien d'acompte"
        }
        size="sm"
      >
        {(depositModalAppointment || depositModalBooking || depositModalProject) && (
          <div className="space-y-5">
            {!depositUrl ? (
              <>
                <p className="text-sm text-[var(--text-secondary)]">
                  {depositModalBooking
                    ? 'Un RDV sera créé et un email contenant le lien de paiement Stripe sera automatiquement envoyé au client pour confirmer sa réservation.'
                    : depositModalProject
                      ? 'InkFlow place un premier RDV sur le prochain créneau libre de ton agenda (le client n’a pas encore choisi de date). Tu pourras le déplacer après l’acompte. Un email avec le lien Stripe sera envoyé au client.'
                      : "Montant de l'acompte à demander au client. Le lien de paiement Stripe sera généré."}
                </p>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Montant (€)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="deposit-amount-euros"
                    autoComplete="off"
                    value={depositAmount}
                    onChange={(e) => {
                      setDepositAmount(e.target.value);
                      setDepositError(null);
                    }}
                    placeholder="50"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] focus:border-transparent focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
                  />
                </div>
                {depositError && (
                  <div
                    className={`rounded-xl border p-4 min-w-0 ${
                      isSlotErrorVisible
                        ? 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800'
                        : 'border-zinc-200 bg-zinc-100 dark:bg-zinc-500/10 dark:border-zinc-700'
                    }`}
                  >
                    <div className="flex gap-2 items-start min-w-0">
                      <AlertTriangle
                        className={`w-5 h-5 shrink-0 mt-0.5 ${isSlotErrorVisible ? 'text-red-600 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-400'}`}
                      />
                      <div className="text-sm min-w-0 break-words">
                        {depositError === 'stripe_config' ? (
                          <>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                              Lien de paiement indisponible
                            </p>
                            <p className="text-zinc-700 dark:text-zinc-400 mb-1.5 text-xs">
                              Vérifiez dans Supabase :
                            </p>
                            <ul className="list-disc list-inside text-zinc-700 dark:text-zinc-400 space-y-0.5 text-xs">
                              <li className="break-words">
                                Edge Function{' '}
                                <code className="bg-zinc-100 dark:bg-zinc-500/20 px-1 rounded text-[11px]">
                                  create-checkout-session
                                </code>{' '}
                                déployée
                              </li>
                              <li className="break-words">
                                Secret{' '}
                                <code className="bg-zinc-100 dark:bg-zinc-500/20 px-1 rounded text-[11px]">
                                  STRIPE_SECRET_KEY
                                </code>{' '}
                                (Dashboard → Edge Functions → Secrets)
                              </li>
                              <li className="break-words">
                                Variable{' '}
                                <code className="bg-zinc-100 dark:bg-zinc-500/20 px-1 rounded text-[11px]">
                                  SITE_URL
                                </code>{' '}
                                (ex. https://votredomaine.com)
                              </li>
                            </ul>
                          </>
                        ) : (
                          <p
                            className={`break-words ${isSlotErrorVisible ? 'text-red-800 dark:text-red-200 font-medium' : 'text-zinc-700 dark:text-zinc-400'}`}
                          >
                            {depositError}
                          </p>
                        )}
                        <a
                          href="/aide#paiement"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-400"
                        >
                          En savoir plus
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                <div className="modal-actions-column flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeDepositModal}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl border-2 border-[var(--border)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] touch-manipulation"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateDepositLink}
                    disabled={depositLoading || isSlotErrorVisible}
                    className="flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 sm:w-auto sm:py-2.5"
                  >
                    {depositLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Génération du lien…
                      </>
                    ) : depositModalBooking ? (
                      <>
                        <Mail className="w-4 h-4 shrink-0" />{' '}
                        <span className="truncate">Accepter et Envoyer l&apos;email</span>
                      </>
                    ) : depositModalProject ? (
                      <>
                        <CreditCard className="w-4 h-4 shrink-0" />{' '}
                        <span className="truncate">Créer le RDV et générer le lien</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 shrink-0" />{' '}
                        <span className="truncate">Générer le lien de paiement</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--text-secondary)]">
                  Envoyez ce lien au client. Dès qu&apos;il paie avec sa carte ou Apple Pay, la
                  demande passera en &quot;Acompte payé&quot; et apparaîtra dans ton agenda.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                  <input
                    type="text"
                    readOnly
                    value={depositUrl}
                    className="w-full min-w-0 px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-hover)] text-[var(--text-secondary)] text-sm truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyDepositLink}
                    className="flex shrink-0 touch-manipulation items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                  >
                    <Copy className="w-4 h-4" /> Copier le lien
                  </button>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeDepositModal}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-[var(--bg-hover)] font-semibold text-[var(--text-primary)]  touch-manipulation"
                  >
                    Fermer
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!rejectPending}
        onClose={() => {
          if (!rejectLoading) setRejectPending(null);
        }}
        onConfirm={() => {
          const pending = rejectPending;
          if (!pending) return;
          if (pending.kind === 'appointment') {
            handleReject(pending.apt);
            hapticSuccess();
            setRejectPending(null);
            return;
          }
          void (async () => {
            setRejectLoading(true);
            try {
              if (pending.kind === 'booking') await handleRejectBooking(pending.bk);
              else await handleRejectProject(pending.pr);
              hapticSuccess();
              setRejectPending(null);
            } finally {
              setRejectLoading(false);
            }
          })();
        }}
        title={
          rejectPending?.kind === 'appointment'
            ? 'Refuser ce rendez-vous ?'
            : rejectPending?.kind === 'booking'
              ? 'Refuser cette demande vitrine ?'
              : rejectPending?.kind === 'project'
                ? 'Refuser ce projet ?'
                : 'Confirmer'
        }
        message={
          rejectPending?.kind === 'appointment'
            ? 'Le client recevra un email de refus et le créneau sera libéré.'
            : rejectPending?.kind === 'booking'
              ? 'La demande depuis votre page book sera refusée. Un email sera envoyé au client.'
              : rejectPending?.kind === 'project'
                ? 'Le brief sera marqué comme refusé. Un email sera envoyé au client.'
                : ''
        }
        confirmLabel="Refuser"
        variant="danger"
        confirmLoading={rejectLoading}
        closeOnConfirm={false}
      />
    </div>
  );
};
