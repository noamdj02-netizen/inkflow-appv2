import React, { useCallback, useEffect, useMemo, useState } from 'react';
import QRCodeLib from 'qrcode';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Filter,
  HeartPulse,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '../../lib/supabase';
import { createCheckoutSession } from '../../lib/stripeClient';
import { CONSENT_FORM_PRESETS } from '../../lib/consentFormPresets';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../ui/Modal';

type CaseSource = 'project_request' | 'booking';
type ValidationState = 'validated' | 'pending' | 'missing';
type StepTone = 'success' | 'warning' | 'danger' | 'neutral';

type ActiveCase = {
  key: string; // pr_<id> | bk_<id>
  source: CaseSource;
  id: string;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  typeLabel: 'Flash' | 'Custom';
  statusRaw: string;
  linkedAppointmentId?: string | null;
};

type CaseEnrichment = {
  appointmentId: string | null;
  depositPaid: boolean | null;
  consentSigned: boolean | null;
  healthFilled: boolean | null;
};

type TimelineStep = {
  id: 'request' | 'validation' | 'deposit' | 'consent' | 'health';
  title: string;
  subtitle?: string;
  status: ValidationState;
  tone: StepTone;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode; busy?: boolean };
};

interface MessagingTabProps {
  studioId: string;
  /** Slug vitrine pour Stripe cancel/success URLs */
  studioSlug?: string | null;
  studioName?: string;
}

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

export const MessagingTab: React.FC<MessagingTabProps> = ({ studioId, studioSlug, studioName }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<ActiveCase[]>([]);
  const [enrichmentByKey, setEnrichmentByKey] = useState<Record<string, CaseEnrichment>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'deposit_missing' | 'health_missing'>(
    'all'
  );
  const [depositBusy, setDepositBusy] = useState(false);

  const [consentQrOpen, setConsentQrOpen] = useState(false);
  const [consentQrBusy, setConsentQrBusy] = useState(false);
  const [consentQrUrl, setConsentQrUrl] = useState<string | null>(null);
  const [consentQrDataUrl, setConsentQrDataUrl] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    if (!studioId) return;
    setLoading(true);
    try {
      const [prRes, bkRes] = await Promise.all([
        supabase
          .from('inkflow_project_requests')
          .select('id, client_name, client_email, status, project_type, created_at')
          .eq('studio_id', studioId)
          .in('status', ['pending', 'accepted', 'confirmed', 'approved'])
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('inkflow_bookings')
          .select(
            'id, client_name, client_email, client_phone, status, created_at, recap_appointment_id'
          )
          .eq('studio_id', studioId)
          .in('status', ['pending', 'accepted', 'confirmed', 'approved'])
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      if (prRes.error) throw prRes.error;
      if (bkRes.error) throw bkRes.error;

      const prs = (prRes.data ?? []).map((r) => {
        const typeLabel: 'Flash' | 'Custom' = (r.project_type || '').toLowerCase().includes('flash')
          ? 'Flash'
          : 'Custom';
        return {
          key: `pr_${r.id}`,
          source: 'project_request' as const,
          id: r.id,
          createdAt: r.created_at || new Date().toISOString(),
          clientName: (r.client_name || 'Client').trim() || 'Client',
          clientEmail: (r.client_email || '').trim(),
          typeLabel,
          statusRaw: (r.status || '').trim(),
        } satisfies ActiveCase;
      });

      const bks = (bkRes.data ?? []).map((r) => {
        return {
          key: `bk_${r.id}`,
          source: 'booking' as const,
          id: r.id,
          createdAt: r.created_at || new Date().toISOString(),
          clientName: (r.client_name || 'Client').trim() || 'Client',
          clientEmail: (r.client_email || '').trim(),
          clientPhone: r.client_phone || null,
          typeLabel: 'Flash',
          statusRaw: (r.status || '').trim(),
          linkedAppointmentId: r.recap_appointment_id || null,
        } satisfies ActiveCase;
      });

      const merged = [...prs, ...bks].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setCases(merged);

      setSelectedKey((prev) => {
        if (prev && merged.some((c) => c.key === prev)) return prev;
        return merged[0]?.key ?? null;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [studioId, toast]);

  const loadEnrichment = useCallback(async () => {
    if (!studioId) return;
    const active = cases;
    if (active.length === 0) {
      setEnrichmentByKey({});
      return;
    }

    const prIds = active.filter((c) => c.source === 'project_request').map((c) => c.id);
    const bkIds = active.filter((c) => c.source === 'booking').map((c) => c.id);
    const recapAptIds = active
      .filter((c) => c.source === 'booking')
      .map((c) => c.linkedAppointmentId)
      .filter((x): x is string => !!x);

    const [healthRes, prAptsRes, recapAptsRes] = await Promise.all([
      supabase
        .from('inkflow_health_forms')
        .select('id, booking_id, project_request_id, certified_accurate')
        .eq('studio_id', studioId)
        .or(
          [
            bkIds.length ? `booking_id.in.(${bkIds.map((x) => `"${x}"`).join(',')})` : null,
            prIds.length ? `project_request_id.in.(${prIds.map((x) => `"${x}"`).join(',')})` : null,
          ]
            .filter(Boolean)
            .join(',')
        ),
      prIds.length
        ? supabase
            .from('inkflow_appointments')
            .select('id, project_request_id, deposit_paid, consent_form_signed')
            .eq('studio_id', studioId)
            .in('project_request_id', prIds)
        : Promise.resolve({ data: [], error: null } as any),
      recapAptIds.length
        ? supabase
            .from('inkflow_appointments')
            .select('id, deposit_paid, consent_form_signed')
            .eq('studio_id', studioId)
            .in('id', recapAptIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (healthRes.error) {
      console.warn('[MessagingTab] health enrichment', healthRes.error);
    }
    if (prAptsRes?.error) {
      console.warn('[MessagingTab] pr appts enrichment', prAptsRes.error);
    }
    if (recapAptsRes?.error) {
      console.warn('[MessagingTab] recap appts enrichment', recapAptsRes.error);
    }

    const healthByBooking = new Map<string, boolean>();
    const healthByProject = new Map<string, boolean>();
    for (const row of healthRes.data ?? []) {
      if (row.booking_id) healthByBooking.set(row.booking_id, row.certified_accurate === true);
      if (row.project_request_id)
        healthByProject.set(row.project_request_id, row.certified_accurate === true);
    }

    const appointmentByProject = new Map<
      string,
      { id: string; deposit_paid: boolean | null; consent_form_signed: boolean | null }
    >();
    for (const a of (prAptsRes?.data ?? []) as any[]) {
      if (a?.project_request_id && a?.id) {
        appointmentByProject.set(a.project_request_id, {
          id: a.id,
          deposit_paid: a.deposit_paid ?? null,
          consent_form_signed: a.consent_form_signed ?? null,
        });
      }
    }

    const appointmentById = new Map<
      string,
      { id: string; deposit_paid: boolean | null; consent_form_signed: boolean | null }
    >();
    for (const a of (recapAptsRes?.data ?? []) as any[]) {
      if (a?.id) {
        appointmentById.set(a.id, {
          id: a.id,
          deposit_paid: a.deposit_paid ?? null,
          consent_form_signed: a.consent_form_signed ?? null,
        });
      }
    }

    const next: Record<string, CaseEnrichment> = {};
    for (const c of active) {
      if (c.source === 'project_request') {
        const apt = appointmentByProject.get(c.id) ?? null;
        next[c.key] = {
          appointmentId: apt?.id ?? null,
          depositPaid: apt ? apt.deposit_paid === true : null,
          consentSigned: apt ? apt.consent_form_signed === true : null,
          healthFilled: healthByProject.has(c.id) ? healthByProject.get(c.id)! : null,
        };
      } else {
        const apt = c.linkedAppointmentId
          ? (appointmentById.get(c.linkedAppointmentId) ?? null)
          : null;
        next[c.key] = {
          appointmentId: apt?.id ?? null,
          depositPaid: apt ? apt.deposit_paid === true : null,
          consentSigned: apt ? apt.consent_form_signed === true : null,
          healthFilled: healthByBooking.has(c.id) ? healthByBooking.get(c.id)! : null,
        };
      }
    }

    setEnrichmentByKey(next);
  }, [cases, studioId]);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  useEffect(() => {
    void loadEnrichment();
  }, [loadEnrichment]);

  const selected = useMemo(
    () => cases.find((c) => c.key === selectedKey) ?? null,
    [cases, selectedKey]
  );
  const selectedEnrichment = useMemo(
    () => (selected ? enrichmentByKey[selected.key] : undefined),
    [enrichmentByKey, selected]
  );

  const filteredCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cases.filter((c) => {
      if (q) {
        const hay = `${c.clientName} ${c.clientEmail}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (activeFilter === 'all') return true;
      const enr = enrichmentByKey[c.key];
      if (!enr) return true;
      if (activeFilter === 'deposit_missing') return enr.depositPaid !== true;
      if (activeFilter === 'health_missing') return enr.healthFilled !== true;
      return true;
    });
  }, [cases, searchQuery, activeFilter, enrichmentByKey]);

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

  const handleCopyDepositLink = useCallback(async () => {
    if (!studioId || !studioSlug || !selected) return;
    const enr = selectedEnrichment;
    const appointmentId = enr?.appointmentId?.trim();
    if (!appointmentId) {
      toast.error('Aucun rendez-vous lié à ce dossier pour générer un lien d’acompte.');
      return;
    }

    setDepositBusy(true);
    try {
      const amount = 50; // fallback simple (le montant exact est géré ailleurs ; ici “nudge”)
      const result = await createCheckoutSession({
        studioId,
        studioSlug: studioSlug ?? undefined,
        appointmentId,
        amount,
        clientName: selected.clientName,
        clientEmail: selected.clientEmail,
        serviceName: `${selected.typeLabel} — acompte`,
        type: 'deposit',
        ...(selected.source === 'project_request' ? { projectRequestId: selected.id } : {}),
      } as any);

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
  }, [studioId, studioSlug, selected, selectedEnrichment, toast, copyToClipboard]);

  const handleGenerateConsentQr = useCallback(async () => {
    if (!studioId || !selected) return;
    const enr = selectedEnrichment;
    const appointmentId = enr?.appointmentId?.trim() || null;
    if (!appointmentId) {
      toast.error('Aucun rendez-vous lié — impossible de générer un QR de signature.');
      return;
    }

    setConsentQrBusy(true);
    setConsentQrDataUrl(null);
    setConsentQrUrl(null);
    setConsentQrOpen(true);
    try {
      const preset = CONSENT_FORM_PRESETS[0];
      const consentFormId = `cf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const { error } = await supabase.from('inkflow_consent_forms').insert({
        id: consentFormId,
        studio_id: studioId,
        client_name: selected.clientName,
        client_email: selected.clientEmail,
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Génération QR impossible');
    } finally {
      setConsentQrBusy(false);
    }
  }, [studioId, selected, selectedEnrichment, toast]);

  const timelineSteps = useMemo((): TimelineStep[] => {
    if (!selected) return [];
    const enr = selectedEnrichment;

    const statusLower = (selected.statusRaw || '').toLowerCase();
    const isValidated = ['confirmed', 'approved', 'accepted'].includes(statusLower);
    const validationStatus: ValidationState = isValidated ? 'validated' : 'pending';

    const depositStatus: ValidationState =
      enr?.depositPaid === true ? 'validated' : enr?.depositPaid === false ? 'missing' : 'pending';
    const consentStatus: ValidationState =
      enr?.consentSigned === true
        ? 'validated'
        : enr?.consentSigned === false
          ? 'missing'
          : 'pending';
    const healthStatus: ValidationState =
      enr?.healthFilled === true
        ? 'validated'
        : enr?.healthFilled === false
          ? 'missing'
          : 'pending';

    return [
      {
        id: 'request',
        title: 'Demande initiale',
        subtitle: `${selected.typeLabel} · ${formatDateFR(selected.createdAt)}`,
        status: 'validated',
        tone: 'success',
      },
      {
        id: 'validation',
        title: 'Validation du projet',
        subtitle: isValidated ? 'Projet validé' : 'En attente de validation',
        status: validationStatus,
        tone: statusTone(validationStatus),
      },
      {
        id: 'deposit',
        title: 'Verrouillage de l’acompte',
        subtitle: depositStatus === 'validated' ? 'Acompte enregistré' : 'Acompte manquant',
        status: depositStatus,
        tone: statusTone(depositStatus),
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
        subtitle: consentStatus === 'validated' ? 'Consentement signé' : 'Signature manquante',
        status: consentStatus,
        tone: statusTone(consentStatus),
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
        subtitle: healthStatus === 'validated' ? 'Formulaire rempli' : 'Manquant',
        status: healthStatus,
        tone: statusTone(healthStatus),
      },
    ];
  }, [
    selected,
    selectedEnrichment,
    handleCopyDepositLink,
    depositBusy,
    handleGenerateConsentQr,
    consentQrBusy,
  ]);

  const contactActions = useMemo(() => {
    if (!selected) return null;
    const email = selected.clientEmail?.trim();
    const emailHref = email ? `mailto:${encodeURIComponent(email)}` : null;
    return { emailHref };
  }, [selected]);

  return (
    <div className="min-w-0">
      <div className="mb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Suivi client</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base mt-1.5 max-w-2xl">
          Pipeline chronologique : acompte, consentement, santé — tout le dossier au même endroit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <aside className="lg:col-span-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-zinc-200/60 dark:border-zinc-800/60 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un client…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setActiveFilter((f) =>
                    f === 'all'
                      ? 'deposit_missing'
                      : f === 'deposit_missing'
                        ? 'health_missing'
                        : 'all'
                  )
                }
                className="shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                title="Changer filtre rapide"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {activeFilter === 'all'
                    ? 'Tous'
                    : activeFilter === 'deposit_missing'
                      ? 'Acompte'
                      : 'Santé'}
                </span>
              </button>
            </div>

            <div className="flex gap-2">
              {(
                [
                  { id: 'all', label: 'Tous' },
                  { id: 'deposit_missing', label: 'Acompte manquant' },
                  { id: 'health_missing', label: 'Santé manquant' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id)}
                  className={cn(
                    'rounded-xl px-3 py-2 text-xs font-semibold border transition-all active:scale-[0.98]',
                    activeFilter === f.id
                      ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow-sm'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900/30 dark:text-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-800'
                  )}
                >
                  {f.label}
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
                Aucun dossier ne correspond à ta recherche.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredCases.map((c) => {
                  const selectedRow = c.key === selectedKey;
                  const enr = enrichmentByKey[c.key];
                  const depositBadge =
                    enr?.depositPaid === true
                      ? 'ok'
                      : enr?.depositPaid === false
                        ? 'missing'
                        : 'pending';
                  const healthBadge =
                    enr?.healthFilled === true
                      ? 'ok'
                      : enr?.healthFilled === false
                        ? 'missing'
                        : 'pending';
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setSelectedKey(c.key)}
                      className={cn(
                        'w-full text-left px-4 sm:px-5 py-4 transition-all active:scale-[0.99]',
                        selectedRow
                          ? 'bg-zinc-50 dark:bg-zinc-900/70'
                          : 'bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/70'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                          {safeUpperInitial(c.clientName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                              {c.clientName}
                            </p>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
                              {formatDateFR(c.createdAt)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {c.typeLabel} · {c.clientEmail || '—'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={cn(
                                'text-[11px] font-semibold rounded-lg border px-2 py-1',
                                depositBadge === 'ok'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
                                  : depositBadge === 'missing'
                                    ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
                                    : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
                              )}
                            >
                              Acompte
                            </span>
                            <span
                              className={cn(
                                'text-[11px] font-semibold rounded-lg border px-2 py-1',
                                healthBadge === 'ok'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
                                  : healthBadge === 'missing'
                                    ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
                                    : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
                              )}
                            >
                              Santé
                            </span>
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

        <main className="lg:col-span-8 space-y-4 lg:space-y-6">
          {!selected ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 text-sm text-zinc-500 dark:text-zinc-400">
              Sélectionne un dossier à gauche pour afficher la frise chronologique.
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-zinc-400" />
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                        {selected.clientName}
                      </h2>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                      {selected.clientEmail || 'E-mail non renseigné'}
                      {selected.clientPhone ? ` · ${selected.clientPhone}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={contactActions?.emailHref ?? undefined}
                      onClick={(e) => {
                        if (!contactActions?.emailHref) {
                          e.preventDefault();
                          toast.error('E-mail client manquant');
                        }
                      }}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                      title="Envoyer un e-mail"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        void copyToClipboard(selected.clientEmail || '', 'E-mail copié')
                      }
                      disabled={!selected.clientEmail}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                      title="Copier l'e-mail"
                    >
                      <Copy className="w-4 h-4" />
                      Copier
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 sm:p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-zinc-400" />
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Frise chronologique
                    </h3>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {selected.typeLabel} · {formatDateFR(selected.createdAt)}
                  </span>
                </div>

                <div className="space-y-3">
                  {timelineSteps.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {s.title}
                          </p>
                          {s.subtitle ? (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                              {s.subtitle}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={cn(
                            'shrink-0 text-xs font-semibold rounded-xl border px-2.5 py-1.5',
                            pillTone(s.tone)
                          )}
                        >
                          {statusLabel(s.status)}
                        </span>
                      </div>

                      {s.action ? (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={s.action.onClick}
                            disabled={s.action.busy}
                            className="rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                          >
                            {s.action.busy ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              s.action.icon
                            )}
                            {s.action.label}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/30 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nudges</p>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Actions rapides (copie de lien) pour relancer sans friction.
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyDepositLink()}
                      disabled={depositBusy}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                    >
                      {depositBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      Copier lien acompte
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleGenerateConsentQr()}
                      disabled={consentQrBusy}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60 active:scale-[0.98] transition-all inline-flex items-center gap-2"
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

              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 sm:p-6">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Acompte
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    {selectedEnrichment?.depositPaid === true
                      ? 'OK'
                      : selectedEnrichment?.depositPaid === false
                        ? 'Manquant'
                        : 'À confirmer'}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 sm:p-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Consentement
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    {selectedEnrichment?.consentSigned === true
                      ? 'Signé'
                      : selectedEnrichment?.consentSigned === false
                        ? 'Manquant'
                        : 'À confirmer'}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 sm:p-6">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Santé</p>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    {selectedEnrichment?.healthFilled === true
                      ? 'Formulaire rempli'
                      : selectedEnrichment?.healthFilled === false
                        ? 'Manquant'
                        : 'À confirmer'}
                  </p>
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
            Fais scanner ce QR code au client pour ouvrir le formulaire de signature.
          </p>

          {consentQrBusy ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Génération…
            </div>
          ) : consentQrDataUrl ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 p-4 flex items-center justify-center">
              {}
              {/* @ts-ignore */}
              <img src={consentQrDataUrl} alt="QR code consentement" className="w-48 h-48" />
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/30 p-4 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Impossible de générer le QR code.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            {consentQrUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => void copyToClipboard(consentQrUrl, 'Lien copié')}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all inline-flex items-center gap-2"
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
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60 active:scale-[0.98] transition-all inline-flex items-center gap-2"
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
