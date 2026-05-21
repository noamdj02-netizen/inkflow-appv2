import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Copy,
  Euro,
  FileSignature,
  FileText,
  HeartPulse,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Send,
  Sparkles,
  Tag,
  WalletCards,
} from 'lucide-react';
import { buildMailtoHref, handleMailtoClick } from '../../lib/mailto';
import { useToast } from '../../contexts/ToastContext';
import type {
  Appointment,
  Client,
  ClientPreferences,
  ProjectRequest,
  WaitlistEntry,
} from '../../types';
import { appointmentRemainingBalanceEuros } from '../../lib/appointmentBalance';
import { instagramMessageUrl, parseInstagramHandle } from '../../lib/instagramUtils';
import { supabase } from '../../lib/supabase';
import { CONSENT_FORM_PRESETS, type ConsentFormPreset } from '../../lib/consentFormPresets';
import { isSyntheticClientPreviewAppointmentId } from '../../lib/clientPreviewFromDemande';
import { ConsentSender } from '../consent/ConsentSender';
import { ClientDossierDocuments } from './ClientDossierDocuments';
import {
  dashboardCardSurface,
  dashboardIconMuted,
  dashboardSectionTitle,
  dashboardStatusBadge,
} from './ui/dashboardChrome';

export interface ClientPreviewData {
  appointment: Appointment;
  client?: Client | null;
  /** Tous les RDV du même client (même id ou e-mail) — pour la carte « Prochains RDV ». */
  clientAppointments?: Appointment[];
  /** Briefs projet (formulaire sans date) rattachés au même client. */
  clientProjectRequests?: ProjectRequest[];
  /** Entrées liste d'attente studio pour ce client. */
  clientWaitlistEntries?: WaitlistEntry[];
  /** Slug public `/book/:slug` (viterme réservation). */
  publicBookingSlug?: string | null;
}

interface ClientPreviewPanelProps {
  data: ClientPreviewData;
  studioId: string;
  artistName: string;
  studioName?: string;
  consentPresets?: ConsentFormPreset[];
  compact?: boolean;
  onClientClick?: () => void;
  showInkflowClientDiscussion?: boolean;
  inkflowMessagingThreadId?: string | null;
  onOpenInkflowDiscussion?: () => void;
  /** Ouvre l’agenda pour planifier / convertir un brief en RDV. */
  onOpenAgenda?: () => void;
  /** Redirige vers la boîte Demandes > Briefs (création / suivi). */
  onPromptNewProject?: () => void;
  /** Recharge la liste des PDF dossier client (après encaissement). */
  documentsRefreshKey?: number;
  /** > 0 après encaissement : scroll vers Documents dans le drawer. */
  documentsScrollTrigger?: number;
}

const STATUS_LABELS: Record<Appointment['status'], string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
  no_show: 'Absent',
};

const STATUS_BADGE_CLASS: Record<Appointment['status'], string> = {
  pending: 'bg-amber-100/90 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
  confirmed: 'bg-blue-100/90 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200',
  in_progress: 'bg-sky-100/90 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200',
  completed: 'bg-zinc-100/90 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-200',
  cancelled: 'bg-red-100/90 text-red-800 dark:bg-red-500/20 dark:text-red-200',
  no_show: 'bg-orange-100/90 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200',
};

const CLIENT_STATUS_LABEL: Record<Client['status'], string> = {
  active: 'Actif',
  inactive: 'Inactif',
  vip: 'VIP',
};

const LOCATION_LABELS: Record<Appointment['location'], string> = {
  arm: 'Bras',
  leg: 'Jambe',
  back: 'Dos',
  chest: 'Torse',
  other: 'Autre',
};

const SIZE_LABELS: Record<Appointment['size'], string> = {
  small: 'Petit',
  medium: 'Moyen',
  large: 'Grand',
  extra_large: 'Très grand',
};

const ICON_FINE = `shrink-0 ${dashboardIconMuted}`;
const SECTION_TITLE = `${dashboardSectionTitle} mb-2`;

const TIMELINE_DOT: Record<Appointment['status'], string> = {
  completed: 'bg-emerald-500 ring-2 ring-emerald-200/80 dark:ring-emerald-500/30',
  cancelled: 'bg-red-500 ring-2 ring-red-200/80 dark:ring-red-500/30',
  no_show: 'bg-orange-500 ring-2 ring-orange-200/80 dark:ring-orange-500/30',
  pending: 'bg-zinc-400 ring-2 ring-zinc-200 dark:ring-zinc-600',
  confirmed: 'bg-blue-500 ring-2 ring-blue-200/80 dark:ring-blue-500/25',
  in_progress: 'bg-sky-500 ring-2 ring-sky-200/80 dark:ring-sky-500/25',
};

const cardSurface = `${dashboardCardSurface} p-0`;

function formatDurationMinutes(mins: number): string {
  if (!Number.isFinite(mins) || mins <= 0) return '—';
  if (mins < 60) return `${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

function formatAppointmentWhen(dateStr: string, timeStr: string): string {
  const time = timeStr?.length === 5 ? `${timeStr}:00` : timeStr || '00:00:00';
  const iso = `${dateStr}T${time}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return `${dateStr} · ${timeStr}`;
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatVisitDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function truncateNote(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatConsentOutreachSentAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function calendarDaysFromToday(appointmentDateYmd: string): number | null {
  const m = appointmentDateYmd.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const apt = new Date(y, mo - 1, d);
  return Math.round((apt.getTime() - startToday.getTime()) / 86400000);
}

function formatRelativeCalendarDay(appointmentDateYmd: string): string {
  const n = calendarDaysFromToday(appointmentDateYmd);
  if (n === null) return '';
  if (n === 0) return 'Aujourd’hui';
  if (n === 1) return 'Demain';
  if (n === -1) return 'Hier';
  if (n > 1) return `Dans ${n} jours`;
  if (n < -1) return `Il y a ${Math.abs(n)} jours`;
  return '';
}

function isUpcomingApt(a: Appointment): boolean {
  if (a.status === 'cancelled' || a.status === 'completed' || a.status === 'no_show') return false;
  const delta = calendarDaysFromToday(a.date);
  return delta !== null && delta >= 0;
}

/** Passé ou statut terminal — pour la timeline historique. */
function isHistoryApt(a: Appointment): boolean {
  const delta = calendarDaysFromToday(a.date);
  const datePassed = delta !== null && delta < 0;
  const terminal = a.status === 'completed' || a.status === 'cancelled' || a.status === 'no_show';
  return terminal || datePassed;
}

/** Brief encore ouvert si aucun RDV actif n’est lié à cette demande. */
function isBriefStillOpen(pr: ProjectRequest, clientAppointments: Appointment[]): boolean {
  return !clientAppointments.some(
    (a) => a.projectRequestId === pr.id && a.status !== 'cancelled' && a.status !== 'no_show'
  );
}

function clientTagsIndicateWaitlist(client: Client | null | undefined): boolean {
  if (!client?.tags?.length) return false;
  return client.tags.some((raw) => {
    const t = raw.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    return (
      t.includes('recontacter') ||
      t.includes('sans date') ||
      t.includes('attente') ||
      t.includes('waitlist')
    );
  });
}

function preferencesLines(prefs: ClientPreferences | undefined): string[] {
  if (!prefs) return [];
  const out: string[] = [];
  if (prefs.preferredArtist) out.push(`Artiste préféré : ${prefs.preferredArtist}`);
  if (prefs.preferredDays?.length) out.push(`Jours : ${prefs.preferredDays.join(', ')}`);
  if (prefs.preferredTime) {
    const map = { morning: 'Matin', afternoon: 'Après-midi', evening: 'Soir' };
    out.push(`Créneau : ${map[prefs.preferredTime]}`);
  }
  if (prefs.painTolerance) {
    const map = { low: 'Faible', medium: 'Modérée', high: 'Élevée' };
    out.push(`Douleur : ${map[prefs.painTolerance]}`);
  }
  if (prefs.allergies?.length) out.push(`Allergies : ${prefs.allergies.join(', ')}`);
  return out;
}

/** Image avec lazy + squelette pulsant jusqu’au chargement. */
function LazyClientPhoto({
  src,
  alt,
  onOpen,
  layoutId,
  hideSharedLayout,
}: {
  src: string;
  alt: string;
  onOpen: () => void;
  layoutId: string;
  /** Masque le layoutId pendant l’animation hero (photo élargie). */
  hideSharedLayout: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="aspect-square w-full">
      {hideSharedLayout ? (
        <div
          className="h-full w-full animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/80"
          aria-hidden
        />
      ) : (
        <motion.button
          type="button"
          layoutId={layoutId}
          onClick={onOpen}
          className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-100 text-left dark:bg-zinc-800"
        >
          {!loaded && (
            <div
              className="absolute inset-0 animate-pulse bg-zinc-200/80 dark:bg-zinc-700/80"
              aria-hidden
            />
          )}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </motion.button>
      )}
    </div>
  );
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0, 0, 0.2, 1] as const },
  },
};

export const ClientPreviewPanel: React.FC<ClientPreviewPanelProps> = ({
  data,
  studioId,
  artistName,
  studioName = 'Mon studio',
  consentPresets,
  compact = false,
  onClientClick,
  showInkflowClientDiscussion = false,
  inkflowMessagingThreadId = null,
  onOpenInkflowDiscussion,
  onOpenAgenda,
  onPromptNewProject,
  documentsRefreshKey = 0,
  documentsScrollTrigger = 0,
}) => {
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const documentsSectionRef = React.useRef<HTMLElement | null>(null);
  const [documentsHighlight, setDocumentsHighlight] = useState(false);

  useEffect(() => {
    if (documentsScrollTrigger < 1) return;
    const el = documentsSectionRef.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      setDocumentsHighlight(true);
      window.setTimeout(() => setDocumentsHighlight(false), 2200);
    }, 320);
    return () => window.clearTimeout(t);
  }, [documentsScrollTrigger, reduceMotion]);
  const {
    appointment,
    client,
    clientAppointments = [],
    clientProjectRequests = [],
    clientWaitlistEntries = [],
    publicBookingSlug = null,
  } = data;
  const [heroPhoto, setHeroPhoto] = useState<{ url: string; layoutId: string } | null>(null);
  const [consentSenderOpen, setConsentSenderOpen] = useState(false);
  const [consentOutreachSentAt, setConsentOutreachSentAt] = useState<string | null>(null);

  useEffect(() => {
    if (!heroPhoto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHeroPhoto(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [heroPhoto]);

  const mailtoHref = buildMailtoHref(appointment.clientEmail, 'À propos de votre rendez-vous');
  const phoneDisplay = (appointment.clientPhone || client?.phone || '').trim();
  const telHref = phoneDisplay ? `tel:${phoneDisplay.replace(/\s/g, '')}` : '';
  const smsHref = phoneDisplay ? `sms:${phoneDisplay.replace(/\s/g, '')}` : '';
  const instagramHandle = parseInstagramHandle(
    (appointment as Appointment & { clientInstagram?: string | null }).clientInstagram,
    `${appointment.notes ?? ''}\n${client?.notes ?? ''}\n${appointment.service ?? ''}`
  );

  const copyContact = async () => {
    const lines = [
      appointment.clientName,
      appointment.clientEmail ? `Email: ${appointment.clientEmail}` : null,
      phoneDisplay ? `Téléphone: ${phoneDisplay}` : null,
      instagramHandle ? `Instagram: @${instagramHandle}` : null,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast.success('Coordonnées copiées');
    } catch {
      toast.error('Impossible de copier les coordonnées.');
    }
  };

  const avatarLetter = (appointment.clientName || '?').charAt(0).toUpperCase();
  const avatarUrl = client?.avatar;
  const whenLabel = formatAppointmentWhen(appointment.date, appointment.time);
  const remainingBalance = appointmentRemainingBalanceEuros(appointment);
  const hasHealthSnapshot = Boolean(client?.healthProfileSnapshot);

  const upcomingSorted = useMemo(() => {
    const pool = clientAppointments.length > 0 ? clientAppointments : [appointment];
    const upcoming = pool.filter(isUpcomingApt);
    upcoming.sort((a, b) => {
      const dc = a.date.localeCompare(b.date);
      return dc !== 0 ? dc : a.time.localeCompare(b.time);
    });
    return upcoming;
  }, [clientAppointments, appointment]);

  const pastSorted = useMemo(() => {
    const pool = clientAppointments.length > 0 ? clientAppointments : [appointment];
    const past = pool.filter(isHistoryApt);
    past.sort((a, b) => {
      const dc = b.date.localeCompare(a.date);
      return dc !== 0 ? dc : b.time.localeCompare(a.time);
    });
    return past;
  }, [clientAppointments, appointment]);

  const primaryUpcoming = upcomingSorted[0] ?? appointment;
  const consentMissingOnNext =
    !primaryUpcoming.consentFormSigned &&
    primaryUpcoming.status !== 'cancelled' &&
    primaryUpcoming.status !== 'completed';
  const primaryConsentTargetSynthetic = isSyntheticClientPreviewAppointmentId(primaryUpcoming.id);

  const effectiveConsentPresets =
    consentPresets && consentPresets.length > 0 ? consentPresets : CONSENT_FORM_PRESETS;

  const loadConsentOutreach = useCallback(async () => {
    const sid = studioId?.trim();
    const aid = primaryUpcoming?.id;
    if (!sid || !aid || !consentMissingOnNext || primaryConsentTargetSynthetic) {
      setConsentOutreachSentAt(null);
      return;
    }
    const { data: row, error } = await supabase
      .from('inkflow_consent_forms')
      .select('consent_outreach_sent_at')
      .eq('studio_id', sid)
      .eq('appointment_id', aid)
      .is('signed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !row?.consent_outreach_sent_at) {
      setConsentOutreachSentAt(null);
      return;
    }
    setConsentOutreachSentAt(row.consent_outreach_sent_at);
  }, [studioId, primaryUpcoming?.id, consentMissingOnNext, primaryConsentTargetSynthetic]);

  useEffect(() => {
    void loadConsentOutreach();
  }, [loadConsentOutreach]);

  const galleryUrls = useMemo(() => {
    const urls: string[] = [];
    const push = (u: string | undefined) => {
      const t = u?.trim();
      if (t && !urls.includes(t)) urls.push(t);
    };
    for (const img of appointment.images ?? []) push(img);
    if (client?.tattoos?.length) {
      for (const t of client.tattoos) {
        for (const img of t.images ?? []) push(img);
      }
    }
    return urls;
  }, [appointment.images, client?.tattoos]);

  const openBriefs = useMemo(
    () =>
      clientProjectRequests.filter(
        (pr) =>
          (pr.status === 'pending' || pr.status === 'accepted') &&
          isBriefStillOpen(pr, clientAppointments)
      ),
    [clientProjectRequests, clientAppointments]
  );

  const waitlistActive = useMemo(
    () => clientWaitlistEntries.filter((w) => w.status === 'waiting' || w.status === 'notified'),
    [clientWaitlistEntries]
  );

  const showWaitlistSection = waitlistActive.length > 0 || clientTagsIndicateWaitlist(client);

  const copyBookingLink = async () => {
    const slug = publicBookingSlug?.trim();
    if (!slug) {
      toast.error('Configure un slug vitrine pour générer le lien /book.');
      return;
    }
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Lien de réservation copié');
    } catch {
      toast.error('Impossible de copier le lien.');
    }
  };

  const prefsLines = preferencesLines(client?.preferences);
  const tagPreview = client?.tags?.filter(Boolean).slice(0, compact ? 2 : 5) ?? [];
  const relativeDayLabel = formatRelativeCalendarDay(appointment.date);

  const motionProps = reduceMotion
    ? { initial: false as const }
    : {
        initial: 'hidden' as const,
        animate: 'show' as const,
        variants: staggerContainer,
      };

  const sectionVariants = reduceMotion ? undefined : staggerItem;

  const openConsentSender = () => {
    if (!studioId?.trim()) {
      toast.error('Studio non chargé — réessaie dans un instant.');
      return;
    }
    if (primaryConsentTargetSynthetic) {
      toast.info(
        'Ce rendez-vous est encore une demande. Crée un RDV dans l’agenda ou ouvre le centre de suivi pour envoyer le consentement.'
      );
      onOpenInkflowDiscussion?.();
      return;
    }
    setConsentSenderOpen(true);
  };

  return (
    <>
      <motion.div className={`flex flex-col gap-5 ${compact ? 'min-w-0' : ''}`} {...motionProps}>
        {/* —— Identité —— */}
        <motion.header
          variants={sectionVariants}
          className={`${onClientClick ? 'cursor-pointer rounded-2xl active:scale-[0.99]' : ''}`}
          onClick={onClientClick}
          onKeyDown={onClientClick ? (e) => e.key === 'Enter' && onClientClick() : undefined}
          role={onClientClick ? 'button' : undefined}
          tabIndex={onClientClick ? 0 : undefined}
        >
          <p className={SECTION_TITLE}>Identité</p>
          <div className="flex items-start gap-4">
            <div className="flex size-[3.75rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-200 shadow-sm dark:bg-zinc-700">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-full object-cover" loading="lazy" />
              ) : (
                <span className="text-2xl font-black text-zinc-600 dark:text-zinc-200">
                  {avatarLetter}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-3xl font-black leading-tight tracking-tight text-zinc-900 dark:text-white">
                {appointment.clientName}
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {telHref ? (
                  <a
                    href={telHref}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-zinc-100 p-3 text-zinc-700 transition-all active:scale-95 motion-reduce:active:scale-100 dark:bg-zinc-800 dark:text-zinc-200"
                    aria-label="Appeler"
                  >
                    <Phone className="size-5" strokeWidth={1.5} aria-hidden />
                  </a>
                ) : null}
                {smsHref ? (
                  <a
                    href={smsHref}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-zinc-100 p-3 text-zinc-700 transition-all active:scale-95 motion-reduce:active:scale-100 dark:bg-zinc-800 dark:text-zinc-200"
                    aria-label="Envoyer un SMS"
                  >
                    <MessageCircle className="size-5" strokeWidth={1.5} aria-hidden />
                  </a>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {client?.status === 'vip' && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-violet-800 dark:bg-blue-500/20 dark:text-blue-200">
                    {CLIENT_STATUS_LABEL.vip}
                  </span>
                )}
                {appointment.consentFormSigned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
                    <CheckCircle2 className="size-3.5 stroke-[1.5]" aria-hidden />
                    Consentement signé
                  </span>
                )}
                {client && client.status !== 'vip' && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                    {CLIENT_STATUS_LABEL[client.status]}
                  </span>
                )}
              </div>
              <div className="mt-4 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                {appointment.clientEmail ? (
                  <p className="flex min-w-0 items-center gap-2">
                    <Mail className={`size-4 ${ICON_FINE}`} strokeWidth={1.5} aria-hidden />
                    <span className="truncate">{appointment.clientEmail}</span>
                  </p>
                ) : null}
                {phoneDisplay ? (
                  <p className="flex min-w-0 items-center gap-2">
                    <Phone className={`size-4 ${ICON_FINE}`} strokeWidth={1.5} aria-hidden />
                    <span className="truncate">{phoneDisplay}</span>
                  </p>
                ) : null}
                {instagramHandle ? (
                  <p className="flex min-w-0 items-center gap-2">
                    <Instagram className={`size-4 ${ICON_FINE}`} strokeWidth={1.5} aria-hidden />
                    <span className="truncate">@{instagramHandle}</span>
                  </p>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {mailtoHref ? (
                  <a
                    href={mailtoHref}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMailtoClick(e, mailtoHref);
                    }}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 transition-all active:scale-95 motion-reduce:active:scale-100 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <Mail className="size-3.5" strokeWidth={1.5} aria-hidden />
                    E-mail
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyContact();
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 transition-all active:scale-95 motion-reduce:active:scale-100 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <Copy className="size-3.5" strokeWidth={1.5} aria-hidden />
                  Copier
                </button>
                {instagramHandle ? (
                  <a
                    href={instagramMessageUrl(instagramHandle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 transition-all active:scale-95 motion-reduce:active:scale-100 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <Instagram className="size-3.5" strokeWidth={1.5} aria-hidden />
                    Instagram
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </motion.header>

        {/* —— Carte 1 : Prochains rendez-vous —— */}
        <motion.section variants={sectionVariants} className={`${cardSurface} p-6`}>
          <h4 className={SECTION_TITLE}>Prochains rendez-vous</h4>
          <div className="mt-4 space-y-4">
            {upcomingSorted.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Aucun rendez-vous à venir pour ce client.
              </p>
            ) : (
              upcomingSorted.slice(0, compact ? 2 : 4).map((apt) => (
                <div
                  key={apt.id}
                  className={`rounded-xl bg-zinc-50/90 p-4 dark:bg-zinc-800/50 ${apt.id === appointment.id ? 'ring-2 ring-blue-500/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE_CLASS[apt.status]}`}
                    >
                      {STATUS_LABELS[apt.status]}
                    </span>
                    {formatRelativeCalendarDay(apt.date) ? (
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {formatRelativeCalendarDay(apt.date)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm font-semibold capitalize text-zinc-900 dark:text-white">
                    {formatAppointmentWhen(apt.date, apt.time)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {apt.service || '—'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" strokeWidth={1.5} />
                      {formatDurationMinutes(apt.duration)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" strokeWidth={1.5} />
                      {LOCATION_LABELS[apt.location]} · {SIZE_LABELS[apt.size]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100/80 px-2.5 py-1.5 text-xs dark:bg-zinc-800">
              <Euro className={`size-3.5 ${ICON_FINE}`} strokeWidth={1.5} />
              <span className="text-zinc-500">Prix</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {primaryUpcoming.price}€
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100/80 px-2.5 py-1.5 text-xs dark:bg-zinc-800">
              <Banknote className={`size-3.5 ${ICON_FINE}`} strokeWidth={1.5} />
              <span className="text-zinc-500">Acompte</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {primaryUpcoming.deposit}€
                {primaryUpcoming.depositPaid ? (
                  <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">payé</span>
                ) : (
                  <span className="ml-1 font-medium text-amber-600 dark:text-amber-400">
                    à payer
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100/80 px-2.5 py-1.5 text-xs dark:bg-zinc-800">
              <WalletCards className={`size-3.5 ${ICON_FINE}`} strokeWidth={1.5} />
              <span className="text-zinc-500">Solde</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {appointmentRemainingBalanceEuros(primaryUpcoming).toFixed(2)}€
              </span>
            </div>
          </div>
        </motion.section>

        {/* —— Historique : timeline des RDV passés —— */}
        <motion.section variants={sectionVariants} className={`${cardSurface} p-6`}>
          <h4 className={SECTION_TITLE}>Historique des rendez-vous</h4>
          {pastSorted.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Aucun rendez-vous passé ou clôturé sur cette fiche.
            </p>
          ) : (
            <ul className="mt-1">
              {pastSorted.slice(0, compact ? 6 : 12).map((apt, idx, arr) => {
                const isLast = idx === arr.length - 1;
                return (
                  <li key={apt.id} className="relative flex gap-3">
                    <div className="flex w-4 shrink-0 flex-col items-center">
                      <span
                        className={`mt-1.5 size-2.5 shrink-0 rounded-full ${TIMELINE_DOT[apt.status]}`}
                        aria-hidden
                      />
                      {!isLast ? (
                        <span className="mt-1 w-px flex-1 min-h-[12px] bg-zinc-200 dark:bg-zinc-700" />
                      ) : null}
                    </div>
                    <div className={`min-w-0 flex-1 pb-5 ${isLast ? 'pb-0' : ''}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                          {STATUS_LABELS[apt.status]}
                        </p>
                        {formatRelativeCalendarDay(apt.date) ? (
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            {formatRelativeCalendarDay(apt.date)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-white">
                        {formatAppointmentWhen(apt.date, apt.time)}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">
                        {apt.service || '—'}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                        appointment_id · {apt.id}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.section>

        {(openBriefs.length > 0 || onPromptNewProject) && (
          <motion.section variants={sectionVariants} className={`${cardSurface} p-6`}>
            <h4 className={SECTION_TITLE}>Projets actifs</h4>
            {openBriefs.length === 0 ? (
              onPromptNewProject ? (
                <button
                  type="button"
                  onClick={() => onPromptNewProject()}
                  className="mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 py-1.5 text-[11px] font-semibold text-zinc-500 transition-all hover:bg-zinc-100/80 hover:text-zinc-800 active:scale-[0.98] motion-reduce:active:scale-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
                >
                  <Plus className="size-3.5" strokeWidth={2} aria-hidden />
                  Nouveau projet
                </button>
              ) : null
            ) : (
              <div className="mt-1 space-y-3">
                {openBriefs.map((pr) => (
                  <div
                    key={pr.id}
                    className={`rounded-2xl border border-blue-100/90 bg-blue-50/50 py-4 pl-4 pr-4 dark:border-blue-500/20 dark:bg-blue-950/30 ${
                      pr.status === 'pending'
                        ? 'border-l-4 border-l-zinc-200 600'
                        : 'border-l-4 border-l-zinc-200 400'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800 dark:bg-blue-500/15 dark:text-blue-200">
                        {pr.status === 'pending' ? 'Brief en attente' : 'Brief accepté'}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                        project_request_id · {pr.id}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-white">
                      {truncateNote(pr.description, compact ? 140 : 220)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                      {(pr.placement || pr.estimatedSize || pr.size) && (
                        <span>
                          <span className="text-zinc-400">Zone · </span>
                          {[pr.placement, pr.estimatedSize || pr.size].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      {pr.budget ? (
                        <span>
                          <span className="text-zinc-400">Budget · </span>
                          {pr.budget}
                        </span>
                      ) : null}
                    </div>
                    {onOpenAgenda ? (
                      <button
                        type="button"
                        onClick={() => onOpenAgenda()}
                        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white transition-all active:scale-[0.98] motion-reduce:active:scale-100 dark:bg-blue-500"
                      >
                        <CalendarPlus className="size-4" strokeWidth={1.5} aria-hidden />
                        {pr.status === 'pending' ? 'Convertir en RDV' : 'Planifier ce projet'}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            {openBriefs.length > 0 && onPromptNewProject ? (
              <button
                type="button"
                onClick={() => onPromptNewProject()}
                className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-[11px] font-semibold text-zinc-500 transition-all hover:text-zinc-800 active:scale-[0.98] dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <Plus className="size-3.5" strokeWidth={2} aria-hidden />
                Nouveau projet
              </button>
            ) : null}
          </motion.section>
        )}

        {/* —— File d’attente —— */}
        {showWaitlistSection ? (
          <motion.section variants={sectionVariants} className={`${cardSurface} p-6`}>
            <h4 className={SECTION_TITLE}>File d&apos;attente</h4>
            <div className="mt-1 space-y-2">
              {waitlistActive.map((w) => (
                <div
                  key={w.id}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-800/40"
                >
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-200/80 dark:bg-zinc-700">
                      <Clock
                        className="size-5 text-zinc-600 dark:text-zinc-300"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-zinc-200/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-700 dark:bg-zinc-600 dark:text-zinc-100">
                          Sans date
                        </span>
                        <span className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                          {w.desiredService || w.notes || 'Créneau à proposer'}
                        </span>
                      </div>
                      {w.notes && w.desiredService ? (
                        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                          {w.notes}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => void copyBookingLink()}
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-all active:scale-95 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
                      title="Copier le lien de réservation"
                    >
                      <CalendarPlus className="size-4" strokeWidth={1.5} aria-hidden />
                    </button>
                    {onOpenAgenda ? (
                      <button
                        type="button"
                        onClick={() => onOpenAgenda()}
                        className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Agenda
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {waitlistActive.length === 0 && clientTagsIndicateWaitlist(client) ? (
                <div className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-800/40">
                  <Clock className="size-5 shrink-0 text-zinc-500" strokeWidth={1.5} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <span className="rounded-full bg-zinc-200/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-700 dark:bg-zinc-600 dark:text-zinc-100">
                      Sans date
                    </span>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                      Client à recontacter ou sans date fixée (tag CRM).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyBookingLink()}
                    className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-all active:scale-95 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
                    title="Proposer un créneau — copier le lien"
                  >
                    <CalendarPlus className="size-4" strokeWidth={1.5} aria-hidden />
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void copyBookingLink()}
              className="mt-3 w-full rounded-xl border border-dashed border-zinc-200/90 py-2.5 text-center text-[11px] font-semibold text-zinc-600 transition-all hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
            >
              Proposer un créneau — copier le lien /book
            </button>
          </motion.section>
        ) : null}

        {/* —— Portfolio (galerie) —— */}
        <motion.section variants={sectionVariants} className={`${cardSurface} p-6`}>
          <h4 className={SECTION_TITLE}>Portfolio</h4>
          {galleryUrls.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Aucune photo enregistrée sur cette fiche ou les rendez-vous liés.
            </p>
          ) : (
            <div className="mt-1 grid grid-cols-3 gap-3">
              {galleryUrls.map((url, idx) => {
                const lid = `client-gallery-${idx}-${url.slice(-24)}`;
                return (
                  <React.Fragment key={url}>
                    <LazyClientPhoto
                      src={url}
                      alt={`Réalisation ${idx + 1}`}
                      layoutId={lid}
                      hideSharedLayout={heroPhoto?.url === url}
                      onOpen={() => setHeroPhoto({ url, layoutId: lid })}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* —— Santé & Légal —— */}
        <motion.section variants={sectionVariants} className={`${cardSurface} p-6`}>
          <h4 className={SECTION_TITLE}>Santé & Légal</h4>
          {consentMissingOnNext && (
            <div className="mb-4 rounded-2xl border border-orange-200/80 bg-orange-50/50 p-4 dark:border-orange-500/25 dark:bg-orange-950/35">
              <div className="flex gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/20">
                  <AlertTriangle
                    className="size-5 text-orange-700 dark:text-orange-300"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">
                    Consentement manquant
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    Le formulaire de consentement lié à ce rendez-vous n&apos;a pas encore été signé
                    par le client.
                  </p>
                  {!primaryConsentTargetSynthetic && studioId?.trim() ? (
                    consentOutreachSentAt ? (
                      <button
                        type="button"
                        onClick={openConsentSender}
                        className="mt-3 flex w-full min-h-11 flex-col items-start gap-1 rounded-xl border border-blue-200/90 bg-blue-50/80 px-4 py-3 text-left transition-all active:scale-[0.98] dark:border-blue-500/35 dark:bg-blue-950/40"
                      >
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                          <Clock
                            className="size-4 shrink-0 text-blue-600 dark:text-blue-400"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          Envoyé le {formatConsentOutreachSentAt(consentOutreachSentAt)} — En
                          attente de signature
                        </span>
                        <span className="text-xs font-medium text-blue-800/80 dark:text-blue-200/80">
                          Touche pour renvoyer ou changer de canal
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={openConsentSender}
                        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-700 active:scale-[0.98] motion-reduce:active:scale-100 dark:bg-orange-600 dark:hover:bg-orange-500"
                      >
                        <Send className="size-4" strokeWidth={1.5} aria-hidden />
                        Envoyer le consentement
                      </button>
                    )
                  ) : primaryConsentTargetSynthetic && onOpenInkflowDiscussion ? (
                    <button
                      type="button"
                      onClick={() => onOpenInkflowDiscussion()}
                      className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-orange-300/80 bg-white px-4 text-sm font-semibold text-orange-950 transition-all active:scale-[0.98] dark:border-orange-500/40 dark:bg-zinc-900 dark:text-orange-100"
                    >
                      <MessageCircle className="size-4" strokeWidth={1.5} aria-hidden />
                      Ouvrir le suivi client
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2.5">
            <div
              className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-3 ${
                appointment.consentFormSigned
                  ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200'
                  : 'bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200'
              }`}
            >
              {appointment.consentFormSigned ? (
                <CheckCircle2 className="size-4 shrink-0" strokeWidth={1.5} />
              ) : (
                <FileSignature className="size-4 shrink-0" strokeWidth={1.5} />
              )}
              <span className="text-sm font-medium">
                {appointment.consentFormSigned
                  ? 'Consentement signé'
                  : 'Consentement à collecter pour ce RDV'}
              </span>
            </div>
            <div
              className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-3 ${
                hasHealthSnapshot
                  ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
              }`}
            >
              <HeartPulse className="size-4 shrink-0" strokeWidth={1.5} />
              <span className="text-sm font-medium">
                {hasHealthSnapshot
                  ? 'Questionnaire santé enregistré'
                  : 'Questionnaire santé manquant'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <Banknote className="size-3.5" strokeWidth={1.5} />
                Acompte : {appointment.depositPaid ? 'encaissé' : 'à relancer'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Euro className="size-3.5" strokeWidth={1.5} />
                Solde :{' '}
                {remainingBalance < 1 || appointment.balancePaidAt
                  ? 'réglé'
                  : `${remainingBalance.toFixed(2)}€`}
              </span>
            </div>
          </div>
        </motion.section>

        {/* —— Carte 4 : Notes & préférences —— */}
        <motion.section variants={sectionVariants} className={`${cardSurface} p-6`}>
          <h4 className={SECTION_TITLE}>Notes & préférences</h4>
          <div className="mt-4 space-y-4 text-sm">
            {client && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-500 dark:text-zinc-400">
                {formatVisitDate(client.firstVisit) && (
                  <span>
                    1<sup>ère</sup> visite :{' '}
                    <strong className="text-zinc-800 dark:text-white">
                      {formatVisitDate(client.firstVisit)}
                    </strong>
                  </span>
                )}
                {formatVisitDate(client.lastVisit) && (
                  <span>
                    Dernière :{' '}
                    <strong className="text-zinc-800 dark:text-white">
                      {formatVisitDate(client.lastVisit)}
                    </strong>
                  </span>
                )}
              </div>
            )}
            {tagPreview.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tagPreview.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    <Tag className="size-3 text-zinc-500" strokeWidth={1.5} aria-hidden />
                    {t}
                  </span>
                ))}
              </div>
            )}
            {(client?.notes?.trim() || appointment.notes?.trim()) && (
              <div className="rounded-xl bg-zinc-50/90 p-4 text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200">
                <p className={SECTION_TITLE}>Notes studio</p>
                <p className="mt-2 leading-relaxed">
                  {truncateNote(
                    client?.notes?.trim() || appointment.notes || '',
                    compact ? 200 : 400
                  )}
                </p>
              </div>
            )}
            {prefsLines.length > 0 && (
              <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-300">
                {prefsLines.map((line) => (
                  <li key={line} className="flex gap-2">
                    <Sparkles
                      className="mt-0.5 size-3.5 shrink-0 text-zinc-400"
                      strokeWidth={1.5}
                    />
                    {line}
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-zinc-50 px-3 py-3 dark:bg-zinc-800/60">
                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                  RDV total
                </p>
                <p className="mt-1 text-lg font-black text-zinc-900 dark:text-white">
                  {client?.appointmentsCount ?? 1}
                </p>
              </div>
              <div className="rounded-xl bg-zinc-50 px-3 py-3 dark:bg-zinc-800/60">
                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                  Dépensé (CRM)
                </p>
                <p className="mt-1 text-lg font-black text-zinc-900 dark:text-white">
                  {client ? `${client.totalSpent}€` : `${appointment.price}€`}
                </p>
              </div>
            </div>
            {!client?.notes?.trim() && !appointment.notes?.trim() && prefsLines.length === 0 && (
              <p className="text-zinc-500 dark:text-zinc-400">Aucune note supplémentaire.</p>
            )}
          </div>
        </motion.section>

        {/* —— Dossier : devis & reçus PDF —— */}
        {(client?.id || appointment.clientId?.trim()) && (
          <motion.section
            ref={documentsSectionRef}
            variants={sectionVariants}
            className={`${cardSurface} p-6 transition-shadow duration-500 ${
              documentsHighlight
                ? 'ring-2 ring-zinc-300/80 dark:ring-zinc-600/80 shadow-[0_0_24px_rgba(255,255,255,0.06)]'
                : ''
            }`}
          >
            <h4 className={`${SECTION_TITLE} flex items-center gap-2`}>
              <FileText className={`size-4 ${ICON_FINE}`} strokeWidth={1.75} />
              Documents (devis & reçus)
            </h4>
            <div className="mt-4">
              <ClientDossierDocuments
                studioId={studioId}
                clientId={(client?.id || appointment.clientId || '').trim()}
                refreshKey={documentsRefreshKey}
              />
            </div>
          </motion.section>
        )}

        {/* —— Suivi client (historique d’activité, plus de chat intégré) —— */}
        {showInkflowClientDiscussion && onOpenInkflowDiscussion && (
          <motion.section variants={sectionVariants} className={`${cardSurface} p-6`}>
            <h4 className={SECTION_TITLE}>Suivi client</h4>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Ce client peut être contacté via l&apos;app client InkFlow.
            </p>
            <button
              type="button"
              onClick={onOpenInkflowDiscussion}
              className="mt-4 flex w-full min-h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-semibold text-white transition-all active:scale-95 motion-reduce:active:scale-100 dark:bg-blue-500"
            >
              <MessageCircle className="size-4" strokeWidth={1.5} aria-hidden />
              {inkflowMessagingThreadId ? 'Voir l’activité' : 'Centre de suivi'}
            </button>
          </motion.section>
        )}

        {/* Référence RDV courant (contexte) */}
        {(relativeDayLabel || appointment.service) && (
          <motion.p
            variants={sectionVariants}
            className="text-center text-xs text-zinc-400 dark:text-zinc-500"
          >
            <CalendarDays className="mr-1 inline size-3.5 align-text-bottom" strokeWidth={1.5} />
            {relativeDayLabel ? `${relativeDayLabel} · ` : null}
            {whenLabel}
          </motion.p>
        )}
      </motion.div>

      {/* Lightbox hero */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {heroPhoto ? (
              <motion.div
                key="hero-backdrop"
                role="button"
                tabIndex={0}
                aria-label="Fermer"
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setHeroPhoto(null)}
                onKeyDown={(e) => e.key === 'Escape' && setHeroPhoto(null)}
              >
                <motion.img
                  layoutId={heroPhoto.layoutId}
                  src={heroPhoto.url}
                  alt=""
                  className="max-h-[min(92dvh,920px)] max-w-full rounded-xl object-contain shadow-2xl"
                  initial={reduceMotion ? false : { scale: 0.92, opacity: 0.85 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={reduceMotion ? undefined : { scale: 0.92, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body
        )}

      {!primaryConsentTargetSynthetic && consentMissingOnNext ? (
        <ConsentSender
          isOpen={consentSenderOpen}
          onClose={() => setConsentSenderOpen(false)}
          studioId={studioId}
          studioName={studioName}
          artistName={artistName}
          appointment={primaryUpcoming}
          presets={effectiveConsentPresets}
          inkflowMessagingThreadId={inkflowMessagingThreadId}
          onSent={() => void loadConsentOutreach()}
        />
      ) : null}
    </>
  );
};
