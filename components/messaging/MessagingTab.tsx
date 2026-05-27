import React, { useCallback, useEffect, useMemo, useState } from 'react';
import QRCodeLib from 'qrcode';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  HeartPulse,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '../../lib/supabase';
import { createCheckoutSession } from '../../lib/stripeClient';
import { ensurePlaceholderAppointmentForProject } from '../../lib/supabaseDashboard';
import { CONSENT_FORM_PRESETS } from '../../lib/consentFormPresets';
import { buildClientAccountHubUrl } from '../../lib/urls';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../ui/Modal';

type CaseSource = 'project_request' | 'booking';
type ValidationState = 'validated' | 'pending' | 'missing';
type StepTone = 'success' | 'warning' | 'danger' | 'neutral';
type BadgeState = 'ok' | 'missing' | 'pending' | 'loading';

type ActiveCase = {
  key: string;
  source: CaseSource;
  id: string;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  clientInstagram?: string | null;
  typeLabel: 'Flash' | 'Custom';
  statusRaw: string;
  summaryLine: string;
  linkedAppointmentId?: string | null;
};

type CaseSignals = {
  appointmentId: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  appointmentStatus: string | null;
  depositAmount: number | null;
  depositPaid: boolean;
  consentSigned: boolean;
  healthFilled: boolean;
  healthCertified: boolean;
  enrichmentReady: boolean;
};

type CaseDetail = {
  description: string;
  placement?: string | null;
  budget?: string | null;
  estimatedSize?: string | null;
  proposedSlot?: string | null;
  artistMessage?: string | null;
  requestedDate?: string | null;
  requestedTime?: string | null;
  referenceImageUrl?: string | null;
};

type TimelineStep = {
  id: 'request' | 'validation' | 'deposit' | 'consent' | 'health';
  title: string;
  subtitle?: string;
  status: ValidationState;
  tone: StepTone;
  icon: React.ReactNode;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode; busy?: boolean };
};

interface MessagingTabProps {
  studioId: string;
  studioSlug?: string | null;
  studioName?: string;
  initialThreadId?: string | null;
  onInitialThreadOpened?: () => void;
  onOpenLinkedProjectRequest?: (projectRequestId: string) => void;
  onOpenLinkedBookingRequest?: (bookingId: string) => void;
}

const PAYMENT_OK = new Set(['completed', 'paid', 'succeeded']);
const VALIDATED_STATUSES = new Set(['confirmed', 'approved', 'accepted']);
const TERMINAL_STATUSES = new Set(['rejected', 'cancelled', 'declined', 'completed', 'expired']);

function formatDateFR(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}

function formatDateTimeFR(date: string, time?: string | null): string {
  if (!date) return '—';
  const t = time?.trim();
  if (!t) return formatDateFR(date);
  try {
    const normalized = t.length === 5 ? `${t}:00` : t;
    const dt = new Date(`${date}T${normalized}`);
    if (Number.isNaN(dt.getTime())) return `${formatDateFR(date)} · ${t}`;
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dt);
  } catch {
    return `${formatDateFR(date)} · ${t}`;
  }
}

function pillTone(tone: StepTone): string {
  switch (tone) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200';
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200';
    case 'danger':
      return 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200';
    default:
      return 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300';
  }
}

function badgeClasses(state: BadgeState): string {
  switch (state) {
    case 'ok':
      return 'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200';
    case 'missing':
      return 'border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200';
    case 'pending':
      return 'border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200';
    default:
      return 'border-zinc-200/80 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400';
  }
}

function statusTone(status: ValidationState): StepTone {
  if (status === 'validated') return 'success';
  if (status === 'pending') return 'warning';
  return 'danger';
}

function statusLabel(status: ValidationState): string {
  if (status === 'validated') return 'Validé';
  if (status === 'pending') return 'En attente';
  return 'Manquant';
}

function safeUpperInitial(name: string): string {
  const s = (name || '').trim();
  if (!s) return 'C';
  return s[0]?.toUpperCase() || 'C';
}

function normalizePhoneForWhatsApp(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return null;
  if (digits.startsWith('0') && digits.length === 10) return `33${digits.slice(1)}`;
  return digits;
}

function isPaymentCompleted(status: string | null | undefined): boolean {
  if (!status) return false;
  return PAYMENT_OK.has(status.trim().toLowerCase());
}

function depositBadgeFromSignals(s: CaseSignals | undefined): BadgeState {
  if (!s?.enrichmentReady) return 'loading';
  return s.depositPaid ? 'ok' : 'missing';
}

function healthBadgeFromSignals(s: CaseSignals | undefined): BadgeState {
  if (!s?.enrichmentReady) return 'loading';
  return s.healthFilled ? 'ok' : 'missing';
}

function StepIcon({ status }: { status: ValidationState }) {
  if (status === 'validated') {
    return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
  }
  if (status === 'pending') {
    return <Circle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />;
  }
  return <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
}

export const MessagingTab: React.FC<MessagingTabProps> = ({
  studioId,
  studioSlug,
  studioName,
  initialThreadId,
  onInitialThreadOpened,
  onOpenLinkedProjectRequest,
  onOpenLinkedBookingRequest,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<ActiveCase[]>([]);
  const [signalsByKey, setSignalsByKey] = useState<Record<string, CaseSignals>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'deposit_missing' | 'health_missing'>(
    'all'
  );
  const [depositBusy, setDepositBusy] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);

  const [consentQrOpen, setConsentQrOpen] = useState(false);
  const [consentQrBusy, setConsentQrBusy] = useState(false);
  const [consentQrUrl, setConsentQrUrl] = useState<string | null>(null);
  const [consentQrDataUrl, setConsentQrDataUrl] = useState<string | null>(null);

  const healthPublicUrl = useMemo(
    () => buildClientAccountHubUrl({ studioSlug: studioSlug ?? undefined }),
    [studioSlug]
  );

  const loadPipeline = useCallback(async () => {
    if (!studioId) return;
    setLoading(true);
    try {
      const [prRes, bkRes] = await Promise.all([
        supabase
          .from('inkflow_project_requests')
          .select(
            'id, client_name, client_email, client_instagram, status, project_type, description, created_at'
          )
          .eq('studio_id', studioId)
          .order('created_at', { ascending: false })
          .limit(250),
        supabase
          .from('inkflow_bookings')
          .select(
            'id, client_name, client_email, client_phone, status, description, requested_date, requested_time, created_at, recap_appointment_id'
          )
          .eq('studio_id', studioId)
          .order('created_at', { ascending: false })
          .limit(250),
      ]);

      if (prRes.error) throw prRes.error;
      if (bkRes.error) throw bkRes.error;

      const prRows = (prRes.data ?? []).filter(
        (r) => !TERMINAL_STATUSES.has((r.status || '').toLowerCase())
      );
      const bkRows = (bkRes.data ?? []).filter(
        (r) => !TERMINAL_STATUSES.has((r.status || '').toLowerCase())
      );

      const mergedCases: ActiveCase[] = [
        ...prRows.map((r) => {
          const typeLabel: 'Flash' | 'Custom' = (r.project_type || '')
            .toLowerCase()
            .includes('flash')
            ? 'Flash'
            : 'Custom';
          const desc = (r.description || '').trim();
          return {
            key: `pr_${r.id}`,
            source: 'project_request' as const,
            id: r.id,
            createdAt: r.created_at || new Date().toISOString(),
            clientName: (r.client_name || 'Client').trim() || 'Client',
            clientEmail: (r.client_email || '').trim(),
            clientInstagram: r.client_instagram || null,
            typeLabel,
            statusRaw: (r.status || '').trim(),
            summaryLine: desc.length > 72 ? `${desc.slice(0, 69)}…` : desc || 'Projet custom',
          };
        }),
        ...bkRows.map((r) => {
          const desc = (r.description || '').trim();
          return {
            key: `bk_${r.id}`,
            source: 'booking' as const,
            id: r.id,
            createdAt: r.created_at || new Date().toISOString(),
            clientName: (r.client_name || 'Client').trim() || 'Client',
            clientEmail: (r.client_email || '').trim(),
            clientPhone: r.client_phone || null,
            typeLabel: 'Flash' as const,
            statusRaw: (r.status || '').trim(),
            summaryLine:
              desc.length > 72
                ? `${desc.slice(0, 69)}…`
                : desc || `Créneau ${formatDateTimeFR(r.requested_date, r.requested_time)}`,
            linkedAppointmentId: r.recap_appointment_id || null,
          };
        }),
      ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

      setCases(mergedCases);

      const prIds = mergedCases.filter((c) => c.source === 'project_request').map((c) => c.id);
      const bkIds = mergedCases.filter((c) => c.source === 'booking').map((c) => c.id);
      const recapAptIds = mergedCases
        .map((c) => c.linkedAppointmentId)
        .filter((x): x is string => !!x);

      const healthFetches = [];
      if (prIds.length) {
        healthFetches.push(
          supabase
            .from('inkflow_health_forms')
            .select('id, project_request_id, booking_id, certified_accurate')
            .eq('studio_id', studioId)
            .in('project_request_id', prIds)
        );
      }
      if (bkIds.length) {
        healthFetches.push(
          supabase
            .from('inkflow_health_forms')
            .select('id, project_request_id, booking_id, certified_accurate')
            .eq('studio_id', studioId)
            .in('booking_id', bkIds)
        );
      }

      const allAptIdsForConsent = new Set<string>(recapAptIds);

      const [healthResults, prAptsRes, recapAptsRes] = await Promise.all([
        Promise.all(healthFetches),
        prIds.length
          ? supabase
              .from('inkflow_appointments')
              .select(
                'id, project_request_id, deposit_paid, deposit, consent_form_signed, date, time, status'
              )
              .eq('studio_id', studioId)
              .in('project_request_id', prIds)
          : Promise.resolve({ data: [], error: null }),
        recapAptIds.length
          ? supabase
              .from('inkflow_appointments')
              .select('id, deposit_paid, deposit, consent_form_signed, date, time, status')
              .eq('studio_id', studioId)
              .in('id', recapAptIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      for (const a of prAptsRes.data ?? []) {
        if (a.id) allAptIdsForConsent.add(a.id);
      }

      const aptIdList = [...allAptIdsForConsent];
      const paymentOrParts: string[] = [];
      if (prIds.length) paymentOrParts.push(`project_request_id.in.(${prIds.join(',')})`);
      if (aptIdList.length) paymentOrParts.push(`appointment_id.in.(${aptIdList.join(',')})`);

      const [paymentsResFinal, consentRes] = await Promise.all([
        paymentOrParts.length
          ? supabase
              .from('inkflow_payments')
              .select('id, type, status, project_request_id, appointment_id, amount')
              .eq('studio_id', studioId)
              .eq('type', 'deposit')
              .or(paymentOrParts.join(','))
          : Promise.resolve({ data: [], error: null }),
        aptIdList.length
          ? supabase
              .from('inkflow_consent_forms')
              .select('id, appointment_id, signed_at')
              .eq('studio_id', studioId)
              .in('appointment_id', aptIdList)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const healthByProject = new Map<string, { filled: boolean; certified: boolean }>();
      for (const batch of healthResults) {
        for (const row of batch.data ?? []) {
          const r = row as {
            project_request_id?: string | null;
            booking_id?: string | null;
            certified_accurate?: boolean | null;
          };
          if (r.project_request_id) {
            healthByProject.set(r.project_request_id, {
              filled: true,
              certified: r.certified_accurate === true,
            });
          }
          if (r.booking_id) {
            healthByProject.set(`bk:${r.booking_id}`, {
              filled: true,
              certified: r.certified_accurate === true,
            });
          }
        }
      }

      const aptByProject = new Map<
        string,
        {
          id: string;
          deposit_paid: boolean | null;
          deposit: number | null;
          consent_form_signed: boolean | null;
          date: string;
          time: string;
          status: string | null;
        }
      >();
      for (const a of prAptsRes.data ?? []) {
        if (a.project_request_id) aptByProject.set(a.project_request_id, a);
      }

      const aptById = new Map<
        string,
        {
          id: string;
          deposit_paid: boolean | null;
          deposit: number | null;
          consent_form_signed: boolean | null;
          date: string;
          time: string;
          status: string | null;
        }
      >();
      for (const a of recapAptsRes.data ?? []) {
        aptById.set(a.id, a);
      }

      const depositPaidByProject = new Set<string>();
      const depositPaidByApt = new Set<string>();
      for (const p of paymentsResFinal.data ?? []) {
        if (!isPaymentCompleted(p.status)) continue;
        if (p.project_request_id) depositPaidByProject.add(p.project_request_id);
        if (p.appointment_id) depositPaidByApt.add(p.appointment_id);
      }

      const consentSignedByApt = new Set<string>();
      for (const c of consentRes.data ?? []) {
        if (c.appointment_id && c.signed_at) consentSignedByApt.add(c.appointment_id);
      }

      const nextSignals: Record<string, CaseSignals> = {};
      for (const c of mergedCases) {
        if (c.source === 'project_request') {
          const apt = aptByProject.get(c.id) ?? null;
          const aptId = apt?.id ?? null;
          const depositPaid =
            apt?.deposit_paid === true ||
            (aptId ? depositPaidByApt.has(aptId) : false) ||
            depositPaidByProject.has(c.id);
          const consentSigned =
            apt?.consent_form_signed === true || (aptId ? consentSignedByApt.has(aptId) : false);
          const health = healthByProject.get(c.id);
          nextSignals[c.key] = {
            appointmentId: aptId,
            appointmentDate: apt?.date ?? null,
            appointmentTime: apt?.time ?? null,
            appointmentStatus: apt?.status ?? null,
            depositAmount: apt?.deposit ?? null,
            depositPaid,
            consentSigned,
            healthFilled: !!health?.filled,
            healthCertified: health?.certified === true,
            enrichmentReady: true,
          };
        } else {
          const apt = c.linkedAppointmentId ? (aptById.get(c.linkedAppointmentId) ?? null) : null;
          const aptId = apt?.id ?? null;
          const health = healthByProject.get(`bk:${c.id}`);
          const depositPaid =
            apt?.deposit_paid === true || (aptId ? depositPaidByApt.has(aptId) : false);
          const consentSigned =
            apt?.consent_form_signed === true || (aptId ? consentSignedByApt.has(aptId) : false);
          nextSignals[c.key] = {
            appointmentId: aptId,
            appointmentDate: apt?.date ?? null,
            appointmentTime: apt?.time ?? null,
            appointmentStatus: apt?.status ?? null,
            depositAmount: apt?.deposit ?? null,
            depositPaid,
            consentSigned,
            healthFilled: !!health?.filled,
            healthCertified: health?.certified === true,
            enrichmentReady: true,
          };
        }
      }

      setSignalsByKey(nextSignals);

      setSelectedKey((prev) => {
        if (prev && mergedCases.some((c) => c.key === prev)) return prev;
        return mergedCases[0]?.key ?? null;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [studioId, toast]);

  useEffect(() => {
    void loadPipeline();
  }, [loadPipeline]);

  useEffect(() => {
    if (!initialThreadId?.trim()) return;
    const key =
      initialThreadId.startsWith('pr_') || initialThreadId.startsWith('bk_')
        ? initialThreadId
        : null;
    if (!key) return;
    setSelectedKey(key);
    setMobileShowDetail(true);
    onInitialThreadOpened?.();
  }, [initialThreadId, onInitialThreadOpened]);

  const selected = useMemo(
    () => cases.find((c) => c.key === selectedKey) ?? null,
    [cases, selectedKey]
  );
  const selectedSignals = useMemo(
    () => (selected ? signalsByKey[selected.key] : undefined),
    [signalsByKey, selected]
  );

  const loadCaseDetail = useCallback(async () => {
    if (!studioId || !selected) {
      setCaseDetail(null);
      return;
    }
    setDetailLoading(true);
    try {
      if (selected.source === 'project_request') {
        const { data, error } = await supabase
          .from('inkflow_project_requests')
          .select(
            'description, placement, budget, estimated_size, proposed_slot, artist_message, reference_image_url'
          )
          .eq('studio_id', studioId)
          .eq('id', selected.id)
          .maybeSingle();
        if (error) throw error;
        setCaseDetail({
          description: (data?.description || selected.summaryLine).trim(),
          placement: data?.placement,
          budget: data?.budget,
          estimatedSize: data?.estimated_size,
          proposedSlot: data?.proposed_slot,
          artistMessage: data?.artist_message,
          referenceImageUrl: data?.reference_image_url,
        });
      } else {
        const { data, error } = await supabase
          .from('inkflow_bookings')
          .select('description, requested_date, requested_time')
          .eq('studio_id', studioId)
          .eq('id', selected.id)
          .maybeSingle();
        if (error) throw error;
        setCaseDetail({
          description: (data?.description || selected.summaryLine).trim(),
          requestedDate: data?.requested_date,
          requestedTime: data?.requested_time,
        });
      }
    } catch {
      setCaseDetail({
        description: selected.summaryLine,
      });
    } finally {
      setDetailLoading(false);
    }
  }, [studioId, selected]);

  useEffect(() => {
    void loadCaseDetail();
  }, [loadCaseDetail]);

  const filterCounts = useMemo(() => {
    let depositMissing = 0;
    let healthMissing = 0;
    for (const c of cases) {
      const s = signalsByKey[c.key];
      if (!s?.enrichmentReady) continue;
      if (!s.depositPaid) depositMissing += 1;
      if (!s.healthFilled) healthMissing += 1;
    }
    return { all: cases.length, deposit_missing: depositMissing, health_missing: healthMissing };
  }, [cases, signalsByKey]);

  const filteredCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cases.filter((c) => {
      if (q) {
        const hay = `${c.clientName} ${c.clientEmail} ${c.summaryLine}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const s = signalsByKey[c.key];
      if (!s?.enrichmentReady) return activeFilter === 'all';
      if (activeFilter === 'deposit_missing') return !s.depositPaid;
      if (activeFilter === 'health_missing') return !s.healthFilled;
      return true;
    });
  }, [cases, searchQuery, activeFilter, signalsByKey]);

  const copyToClipboard = useCallback(
    async (text: string, success: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(success);
      } catch {
        toast.error('Copie impossible');
      }
    },
    [toast]
  );

  const resolveAppointmentId = useCallback(async (): Promise<string | null> => {
    if (!studioId || !selected) return null;
    const existing = selectedSignals?.appointmentId?.trim();
    if (existing) return existing;

    if (selected.source !== 'project_request') return null;

    setDepositBusy(true);
    try {
      const { data: pr, error } = await supabase
        .from('inkflow_project_requests')
        .select('id, client_name, client_email, description')
        .eq('studio_id', studioId)
        .eq('id', selected.id)
        .maybeSingle();
      if (error || !pr) return null;
      const aptId = await ensurePlaceholderAppointmentForProject(studioId, {
        id: pr.id,
        clientName: pr.client_name,
        clientEmail: pr.client_email,
        description: pr.description,
        depositEuros: selectedSignals?.depositAmount ?? 50,
      });
      await loadPipeline();
      return aptId;
    } catch {
      return null;
    } finally {
      setDepositBusy(false);
    }
  }, [studioId, selected, selectedSignals, loadPipeline]);

  const handleCopyDepositLink = useCallback(async () => {
    if (!studioId || !studioSlug || !selected) {
      toast.error('Slug studio requis pour le lien Stripe.');
      return;
    }

    setDepositBusy(true);
    try {
      const appointmentId = await resolveAppointmentId();
      if (!appointmentId) {
        toast.error('Impossible de préparer le rendez-vous lié pour l’acompte.');
        return;
      }

      const amount =
        selectedSignals?.depositAmount && selectedSignals.depositAmount > 0
          ? selectedSignals.depositAmount
          : 50;

      const result = await createCheckoutSession({
        studioId,
        studioSlug,
        appointmentId,
        amount,
        clientName: selected.clientName,
        clientEmail: selected.clientEmail,
        serviceName: `${selected.typeLabel} — acompte`,
        type: 'deposit',
        ...(selected.source === 'project_request' ? { projectRequestId: selected.id } : {}),
      });

      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      await copyToClipboard(result.url, 'Lien d’acompte copié');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur Stripe');
    } finally {
      setDepositBusy(false);
    }
  }, [
    studioId,
    studioSlug,
    selected,
    selectedSignals,
    resolveAppointmentId,
    copyToClipboard,
    toast,
  ]);

  const handleGenerateConsentQr = useCallback(async () => {
    if (!studioId || !selected) return;

    setConsentQrBusy(true);
    setConsentQrDataUrl(null);
    setConsentQrUrl(null);
    setConsentQrOpen(true);

    try {
      const appointmentId = await resolveAppointmentId();
      if (!appointmentId) {
        toast.error('Crée d’abord un rendez-vous lié (acompte) pour générer le consentement.');
        setConsentQrOpen(false);
        return;
      }

      const preset = CONSENT_FORM_PRESETS[0];
      const consentFormId = `cf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const { error } = await supabase.from('inkflow_consent_forms').insert({
        id: consentFormId,
        studio_id: studioId,
        client_name: selected.clientName,
        client_email: selected.clientEmail || 'client@inkflow.local',
        template: preset?.content || 'Consentement',
        appointment_id: appointmentId,
      });
      if (error) {
        toast.error(error.message || 'Création du consentement impossible');
        return;
      }
      const signUrl = `${window.location.origin}/consent/${consentFormId}`;
      const qr = await QRCodeLib.toDataURL(signUrl, { margin: 1, scale: 8 });
      setConsentQrUrl(signUrl);
      setConsentQrDataUrl(qr);
      toast.success('QR code généré');
      await loadPipeline();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Génération QR impossible');
    } finally {
      setConsentQrBusy(false);
    }
  }, [studioId, selected, resolveAppointmentId, toast, loadPipeline]);

  const timelineSteps = useMemo((): TimelineStep[] => {
    if (!selected) return [];
    const sig = selectedSignals;

    const statusLower = (selected.statusRaw || '').toLowerCase();
    const isValidated = VALIDATED_STATUSES.has(statusLower);
    const validationStatus: ValidationState = isValidated ? 'validated' : 'pending';

    const depositStatus: ValidationState = sig?.depositPaid
      ? 'validated'
      : sig?.appointmentId
        ? 'missing'
        : 'pending';
    const consentStatus: ValidationState = sig?.consentSigned ? 'validated' : 'missing';
    const healthStatus: ValidationState = sig?.healthFilled ? 'validated' : 'missing';

    return [
      {
        id: 'request',
        title: 'Demande initiale',
        subtitle: `${selected.typeLabel} · ${formatDateFR(selected.createdAt)}`,
        status: 'validated',
        tone: 'success',
        icon: <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      },
      {
        id: 'validation',
        title: 'Validation du projet',
        subtitle: isValidated
          ? `Statut : ${selected.statusRaw || 'validé'}`
          : 'En attente de validation tatoueur',
        status: validationStatus,
        tone: statusTone(validationStatus),
        icon: <CheckCircle2 className="w-5 h-5" />,
      },
      {
        id: 'deposit',
        title: 'Verrouillage de l’acompte',
        subtitle: sig?.depositPaid
          ? `Acompte réglé${sig.depositAmount ? ` · ${sig.depositAmount} €` : ''}`
          : sig?.depositAmount
            ? `Acompte attendu · ${sig.depositAmount} €`
            : 'Acompte non enregistré',
        status: depositStatus,
        tone: statusTone(depositStatus),
        icon: <CreditCard className="w-5 h-5" />,
        action:
          depositStatus !== 'validated'
            ? {
                label: 'Relancer pour l’acompte (copier le lien)',
                onClick: () => void handleCopyDepositLink(),
                icon: <CreditCard className="w-4 h-4" aria-hidden />,
                busy: depositBusy,
              }
            : undefined,
      },
      {
        id: 'consent',
        title: 'Décharge de consentement',
        subtitle: sig?.consentSigned ? 'Consentement signé' : 'Signature manquante',
        status: consentStatus,
        tone: statusTone(consentStatus),
        icon: <ShieldCheck className="w-5 h-5" />,
        action:
          consentStatus !== 'validated'
            ? {
                label: 'Générer le QR Code de signature',
                onClick: () => void handleGenerateConsentQr(),
                icon: <ShieldCheck className="w-4 h-4" aria-hidden />,
                busy: consentQrBusy,
              }
            : undefined,
      },
      {
        id: 'health',
        title: 'Questionnaire de santé',
        subtitle: sig?.healthFilled
          ? sig.healthCertified
            ? 'Formulaire rempli et certifié'
            : 'Formulaire rempli (certification en attente)'
          : 'Manquant',
        status: healthStatus,
        tone: statusTone(healthStatus),
        icon: <HeartPulse className="w-5 h-5" />,
      },
    ];
  }, [
    selected,
    selectedSignals,
    handleCopyDepositLink,
    depositBusy,
    handleGenerateConsentQr,
    consentQrBusy,
  ]);

  const whatsappHref = useMemo(() => {
    if (!selected?.clientPhone) return null;
    const e164 = normalizePhoneForWhatsApp(selected.clientPhone);
    if (!e164) return null;
    const text = encodeURIComponent(
      `Bonjour ${selected.clientName}, c’est ${studioName || 'le studio'}. `
    );
    return `https://wa.me/${e164}?text=${text}`;
  }, [selected, studioName]);

  const handleSelectCase = (key: string) => {
    setSelectedKey(key);
    setMobileShowDetail(true);
  };

  return (
    <div className="min-w-0">
      <div className="mb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Suivi client</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base mt-1.5 max-w-2xl">
          Dossiers actifs, étapes acompte / consentement / santé — fiche complète au clic.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <aside
          className={cn(
            'lg:col-span-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden',
            mobileShowDetail ? 'hidden lg:block' : 'block'
          )}
        >
          <div className="p-4 sm:p-5 border-b border-zinc-200/60 dark:border-zinc-800/60 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un client…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'all' as const, label: 'Tous' },
                  { id: 'deposit_missing' as const, label: 'Acompte manquant' },
                  { id: 'health_missing' as const, label: 'Santé manquant' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id)}
                  className={cn(
                    'rounded-xl px-3 py-2 text-xs font-semibold border transition-all active:scale-[0.98] inline-flex items-center gap-1.5',
                    activeFilter === f.id
                      ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow-sm'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900/30 dark:text-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-800'
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      'tabular-nums rounded-md px-1.5 py-0.5 text-[10px]',
                      activeFilter === f.id
                        ? 'bg-white/15 dark:bg-zinc-900/10'
                        : 'bg-zinc-200/80 dark:bg-zinc-800'
                    )}
                  >
                    {filterCounts[f.id]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement…
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
                Aucun dossier ne correspond.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredCases.map((c) => {
                  const sig = signalsByKey[c.key];
                  const depositBadge = depositBadgeFromSignals(sig);
                  const healthBadge = healthBadgeFromSignals(sig);
                  const selectedRow = c.key === selectedKey;

                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => handleSelectCase(c.key)}
                      className={cn(
                        'w-full text-left px-4 sm:px-5 py-3.5 transition-all active:scale-[0.99] border-l-4',
                        selectedRow
                          ? 'border-l-emerald-500 bg-zinc-50 dark:bg-zinc-900/70'
                          : 'border-l-transparent bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/70'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center text-xs font-semibold text-zinc-800 dark:text-zinc-100 shrink-0">
                          {safeUpperInitial(c.clientName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {c.clientName}
                            </p>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 shrink-0 tabular-nums">
                              {formatDateFR(c.createdAt)}
                            </span>
                          </div>
                          <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {c.typeLabel} · {c.summaryLine}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {depositBadge !== 'ok' ? (
                              <span
                                className={cn(
                                  'text-[10px] font-semibold rounded-md border px-1.5 py-0.5',
                                  badgeClasses(depositBadge)
                                )}
                              >
                                {depositBadge === 'loading' ? '…' : 'Acompte manquant'}
                              </span>
                            ) : null}
                            {healthBadge !== 'ok' ? (
                              <span
                                className={cn(
                                  'text-[10px] font-semibold rounded-md border px-1.5 py-0.5',
                                  badgeClasses(healthBadge)
                                )}
                              >
                                {healthBadge === 'loading' ? '…' : 'Santé manquant'}
                              </span>
                            ) : null}
                            {depositBadge === 'ok' && healthBadge === 'ok' ? (
                              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                Dossier à jour
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <main
          className={cn(
            'lg:col-span-8 space-y-4 lg:space-y-5',
            !mobileShowDetail && selected ? 'hidden lg:block' : 'block'
          )}
        >
          {!selected ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 text-sm text-zinc-500 dark:text-zinc-400">
              Sélectionne un dossier à gauche pour ouvrir la fiche client.
            </div>
          ) : (
            <>
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileShowDetail(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la liste
                </button>
              </div>

              <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 sm:p-6 md:p-8 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                        {selected.clientName}
                      </h2>
                      <span className="text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-zinc-600 dark:text-zinc-300">
                        {selected.typeLabel}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-semibold rounded-lg border px-2 py-1 capitalize',
                          VALIDATED_STATUSES.has(selected.statusRaw.toLowerCase())
                            ? pillTone('success')
                            : pillTone('warning')
                        )}
                      >
                        {selected.statusRaw || 'en cours'}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                      {selected.clientEmail || 'E-mail non renseigné'}
                      {selected.clientPhone ? ` · ${selected.clientPhone}` : ''}
                      {selected.clientInstagram
                        ? ` · @${selected.clientInstagram.replace(/^@/, '')}`
                        : ''}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Dossier créé le {formatDateFR(selected.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {whatsappHref ? (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all inline-flex items-center gap-2 min-h-[44px]"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </a>
                    ) : null}
                    <a
                      href={selected.clientEmail ? `mailto:${selected.clientEmail}` : undefined}
                      onClick={(e) => {
                        if (!selected.clientEmail) {
                          e.preventDefault();
                          toast.error('E-mail client manquant');
                        }
                      }}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all inline-flex items-center gap-2 min-h-[44px]"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                    {selected.clientPhone ? (
                      <a
                        href={`tel:${selected.clientPhone}`}
                        className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all inline-flex items-center gap-2 min-h-[44px]"
                      >
                        <Phone className="w-4 h-4" />
                        Appeler
                      </a>
                    ) : null}
                  </div>
                </div>

                {detailLoading ? (
                  <div className="text-sm text-zinc-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement de la fiche…
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Projet
                      </p>
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-2 leading-relaxed">
                        {caseDetail?.description || selected.summaryLine}
                      </p>
                      {caseDetail?.placement ? (
                        <p className="text-xs text-zinc-500 mt-2">
                          Emplacement : {caseDetail.placement}
                        </p>
                      ) : null}
                      {caseDetail?.budget ? (
                        <p className="text-xs text-zinc-500 mt-1">Budget : {caseDetail.budget}</p>
                      ) : null}
                      {caseDetail?.estimatedSize ? (
                        <p className="text-xs text-zinc-500 mt-1">
                          Taille : {caseDetail.estimatedSize}
                        </p>
                      ) : null}
                      {caseDetail?.requestedDate ? (
                        <p className="text-xs text-zinc-500 mt-2">
                          Créneau demandé :{' '}
                          {formatDateTimeFR(caseDetail.requestedDate, caseDetail.requestedTime)}
                        </p>
                      ) : null}
                      {caseDetail?.proposedSlot ? (
                        <p className="text-xs text-zinc-500 mt-1">
                          Créneau proposé : {caseDetail.proposedSlot}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        État du dossier
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            {
                              label: 'Acompte',
                              ok: selectedSignals?.depositPaid,
                              icon: CreditCard,
                            },
                            {
                              label: 'Consent.',
                              ok: selectedSignals?.consentSigned,
                              icon: ShieldCheck,
                            },
                            {
                              label: 'Santé',
                              ok: selectedSignals?.healthFilled,
                              icon: HeartPulse,
                            },
                          ] as const
                        ).map((item) => (
                          <div
                            key={item.label}
                            className={cn(
                              'rounded-xl border p-2.5 text-center',
                              item.ok
                                ? 'border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                                : 'border-rose-200/80 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/20'
                            )}
                          >
                            <item.icon
                              className={cn(
                                'w-4 h-4 mx-auto',
                                item.ok ? 'text-emerald-600' : 'text-rose-600'
                              )}
                            />
                            <p className="text-[10px] font-semibold mt-1 text-zinc-700 dark:text-zinc-200">
                              {item.label}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              {item.ok ? 'OK' : 'Manquant'}
                            </p>
                          </div>
                        ))}
                      </div>
                      {selectedSignals?.appointmentDate ? (
                        <p className="text-xs text-zinc-500">
                          RDV lié :{' '}
                          {formatDateTimeFR(
                            selectedSignals.appointmentDate,
                            selectedSignals.appointmentTime
                          )}
                          {selectedSignals.appointmentStatus
                            ? ` · ${selectedSignals.appointmentStatus}`
                            : ''}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Aucun rendez-vous lié — un placeholder sera créé pour l’acompte si besoin.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {selected.source === 'project_request' && onOpenLinkedProjectRequest ? (
                    <button
                      type="button"
                      onClick={() => onOpenLinkedProjectRequest(selected.id)}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                    >
                      Ouvrir dans Demandes → Projets
                    </button>
                  ) : null}
                  {selected.source === 'booking' && onOpenLinkedBookingRequest ? (
                    <button
                      type="button"
                      onClick={() => onOpenLinkedBookingRequest(selected.id)}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                    >
                      Ouvrir dans Demandes → Vitrine
                    </button>
                  ) : null}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 sm:p-6 md:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <CalendarDays className="w-5 h-5 text-zinc-400" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Frise chronologique
                  </h3>
                </div>

                <div className="relative pl-1">
                  <div
                    className="absolute left-[11px] top-3 bottom-3 w-px bg-zinc-200 dark:bg-zinc-800"
                    aria-hidden
                  />
                  <div className="space-y-4">
                    {timelineSteps.map((step) => (
                      <div key={step.id} className="relative flex gap-4">
                        <div className="relative z-[1] mt-0.5">
                          <StepIcon status={step.status} />
                        </div>
                        <div className="flex-1 min-w-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {step.title}
                              </p>
                              {step.subtitle ? (
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                  {step.subtitle}
                                </p>
                              ) : null}
                            </div>
                            <span
                              className={cn(
                                'shrink-0 text-xs font-semibold rounded-xl border px-2.5 py-1.5',
                                pillTone(step.tone)
                              )}
                            >
                              {statusLabel(step.status)}
                            </span>
                          </div>
                          {step.action ? (
                            <button
                              type="button"
                              onClick={step.action.onClick}
                              disabled={step.action.busy}
                              className="mt-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 active:scale-[0.98] transition-all inline-flex items-center gap-2 min-h-[44px]"
                            >
                              {step.action.busy ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                step.action.icon
                              )}
                              {step.action.label}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/30 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Relances</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Copie les liens à envoyer au client (e-mail, WhatsApp, SMS).
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyDepositLink()}
                      disabled={depositBusy || selectedSignals?.depositPaid}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60 active:scale-[0.98] transition-all inline-flex items-center gap-2 min-h-[44px]"
                    >
                      {depositBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      Lien acompte Stripe
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void copyToClipboard(healthPublicUrl, 'Lien questionnaire santé copié')
                      }
                      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all inline-flex items-center gap-2 min-h-[44px]"
                    >
                      <HeartPulse className="w-4 h-4" />
                      Lien questionnaire santé
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleGenerateConsentQr()}
                      disabled={consentQrBusy || selectedSignals?.consentSigned}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60 active:scale-[0.98] transition-all inline-flex items-center gap-2 min-h-[44px]"
                    >
                      {consentQrBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      QR consentement
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <Modal
        isOpen={consentQrOpen}
        onClose={() => {
          if (!consentQrBusy) setConsentQrOpen(false);
        }}
        title="QR Code — signature consentement"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Fais scanner ce QR code au client pour signer la décharge.
          </p>

          {consentQrBusy ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Génération…
            </div>
          ) : consentQrDataUrl ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex justify-center bg-white dark:bg-zinc-950/20">
              <img src={consentQrDataUrl} alt="QR code consentement" className="w-48 h-48" />
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              QR indisponible
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            {consentQrUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => void copyToClipboard(consentQrUrl, 'Lien copié')}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copier le lien
                </button>
                <a
                  href={consentQrUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir
                </a>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => setConsentQrOpen(false)}
              disabled={consentQrBusy}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-semibold active:scale-[0.98] transition-all inline-flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Fermer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
