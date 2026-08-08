import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  RotateCcw,
  StickyNote,
} from 'lucide-react';
import type { MessageThread } from '../../types';
import { supabase } from '../../lib/supabase';
import { formatActivityFeedPreview, threadSourceLabel } from '../../lib/activityFeedLabels';
import {
  ACTIVITY_FILTERS,
  buildConsentReminderMessage,
  filterActivityThreads,
  getPaymentCheckoutUrl,
  parseThreadStructured,
  showConsentRelance,
  showCopyPaymentLink,
  showInvoiceAction,
  type ActivityFilterId,
  type ThreadEnrichment,
} from '../../lib/activityCenter';
import { buildMailtoUrl, buildWhatsAppUrl } from '../../lib/clientContactLinks';
import { saveClientNotesToSupabase } from '../../lib/supabaseDashboard';
import { useToast } from '../../contexts/ToastContext';
import { cn } from '@/lib/utils';

interface ActivityCenterTabProps {
  studioId: string;
  studioName?: string;
  messageThreads?: MessageThread[];
  focusThreadId?: string | null;
  onFocusThreadConsumed?: () => void;
  onOpenLinkedProjectRequest?: (projectRequestId: string) => void;
  onOpenLinkedBookingRequest?: (bookingId: string) => void;
}

const badgeClass =
  'inline-flex max-w-full items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium tracking-tight text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300';

const iconActionClass =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98] dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100';

const ctxActionClass =
  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-800 active:scale-[0.98] dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200';

function clientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD} j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function ClientAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = clientInitials(name || 'Client');
  if (avatarUrl?.trim()) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="size-11 shrink-0 rounded-xl border border-zinc-200/80 object-cover dark:border-zinc-800"
      />
    );
  }
  return (
    <div
      className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 font-display text-sm font-semibold tracking-tight text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
      aria-hidden
    >
      {initials}
    </div>
  );
}

function FilterPills({
  active,
  onChange,
  counts,
}: {
  active: ActivityFilterId;
  onChange: (id: ActivityFilterId) => void;
  counts: Partial<Record<ActivityFilterId, number>>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrer l’activité">
      {ACTIVITY_FILTERS.map((f) => {
        const count = counts[f.id];
        const isActive = active === f.id;
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(f.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.98]',
              isActive
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'border border-zinc-200/80 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200'
            )}
          >
            {f.label}
            {f.id !== 'all' && count != null && count > 0 ? (
              <span
                className={cn(
                  'tabular-nums text-[10px]',
                  isActive ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export const ActivityCenterTab: React.FC<ActivityCenterTabProps> = ({
  studioId,
  studioName,
  messageThreads = [],
  focusThreadId,
  onFocusThreadConsumed,
  onOpenLinkedProjectRequest,
  onOpenLinkedBookingRequest,
}) => {
  const toast = useToast();
  const [activeFilter, setActiveFilter] = useState<ActivityFilterId>('all');
  const [enrichmentByThread, setEnrichmentByThread] = useState<Record<string, ThreadEnrichment>>(
    {}
  );
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);
  const [expandedNoteThreadId, setExpandedNoteThreadId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const noteSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timers = noteSaveTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const sortedThreads = useMemo(
    () =>
      [...messageThreads].sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      ),
    [messageThreads]
  );

  useEffect(() => {
    if (!focusThreadId) return;
    const el = document.getElementById(`activity-thread-${focusThreadId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    onFocusThreadConsumed?.();
  }, [focusThreadId, sortedThreads.length, onFocusThreadConsumed]);

  useEffect(() => {
    if (!studioId || sortedThreads.length === 0) {
      setEnrichmentByThread({});
      setEnrichmentLoading(false);
      return;
    }

    let cancelled = false;
    setEnrichmentLoading(true);

    const prIds = sortedThreads
      .filter((t) => t.threadId.startsWith('pr_'))
      .map((t) => t.threadId.replace(/^pr_/, ''));
    const bkIds = sortedThreads
      .filter((t) => t.threadId.startsWith('bk_'))
      .map((t) => t.threadId.replace(/^bk_/, ''));
    const aptIds: string[] = sortedThreads
      .map((t) => t.linkedAppointmentId?.trim() ?? '')
      .filter((id) => id.length > 0);

    void (async () => {
      const next: Record<string, ThreadEnrichment> = {};

      for (const t of sortedThreads) {
        const structured = parseThreadStructured(t.lastMessage);
        next[t.threadId] = {
          phone: '',
          email: t.clientEmail?.trim() || '',
          clientId: null,
          linkedAppointmentId: t.linkedAppointmentId ?? null,
          depositPaid: null,
          consentFormId:
            structured?.kind === 'consent_form_request' ? structured.consentFormId : null,
          consentSigned: null,
          structured,
          invoicePublicUrl: null,
          quickNote: '',
        };
      }

      try {
        const emails: string[] = [];
        for (const t of sortedThreads) {
          const em = (next[t.threadId]?.email || '').trim().toLowerCase();
          if (em) emails.push(em);
        }
        const uniqueEmails = [...new Set(emails)];
        const clientIdByEmail = new Map<string, string>();
        if (uniqueEmails.length > 0) {
          const { data: clients } = await supabase
            .from('inkflow_clients')
            .select('id, email, phone')
            .eq('studio_id', studioId)
            .in('email', uniqueEmails);
          for (const c of clients ?? []) {
            const em = c.email?.trim().toLowerCase();
            if (em) clientIdByEmail.set(em, c.id);
            for (const t of sortedThreads) {
              const en = next[t.threadId];
              if (!en) continue;
              if (em === en.email.toLowerCase()) {
                en.clientId = c.id;
                if (c.phone?.trim()) en.phone = c.phone.trim();
              }
            }
          }
        }

        if (prIds.length > 0) {
          const { data: prRows } = await supabase
            .from('inkflow_project_requests')
            .select('id, client_email')
            .eq('studio_id', studioId)
            .in('id', prIds);
          for (const r of prRows ?? []) {
            const en = next[r.id];
            if (en && r.client_email) {
              en.email = r.client_email;
              const cid = clientIdByEmail.get(r.client_email.trim().toLowerCase());
              if (cid) en.clientId = cid;
            }
          }
        }

        if (bkIds.length > 0) {
          const { data: bkRows } = await supabase
            .from('inkflow_bookings')
            .select('id, client_email, client_phone')
            .eq('studio_id', studioId)
            .in('id', bkIds);
          for (const r of bkRows ?? []) {
            const en = next[r.id];
            if (en) {
              if (r.client_email) en.email = r.client_email;
              if (r.client_phone?.trim()) en.phone = r.client_phone.trim();
              const cid = clientIdByEmail.get((r.client_email || '').trim().toLowerCase());
              if (cid) en.clientId = cid;
            }
          }
        }

        const consentIds = sortedThreads
          .map((t) => next[t.threadId]?.consentFormId)
          .filter((id): id is string => Boolean(id));
        if (consentIds.length > 0) {
          const { data: consents } = await supabase
            .from('inkflow_consent_forms')
            .select('id, signed_at')
            .eq('studio_id', studioId)
            .in('id', consentIds);
          const signedById = new Map(
            (consents ?? []).map((c) => [c.id, Boolean(c.signed_at?.trim())])
          );
          for (const t of sortedThreads) {
            const en = next[t.threadId];
            const cid = en?.consentFormId;
            if (en && cid) en.consentSigned = signedById.get(cid) ?? false;
          }
        }

        const uniqueAptIds = Array.from(new Set(aptIds));
        if (uniqueAptIds.length > 0) {
          const { data: apts } = await supabase
            .from('inkflow_appointments')
            .select('id, client_id, deposit_paid')
            .eq('studio_id', studioId)
            .in('id', uniqueAptIds);
          const aptById = new Map((apts ?? []).map((a) => [a.id, a]));
          for (const t of sortedThreads) {
            const en = next[t.threadId];
            const aid = en?.linkedAppointmentId;
            if (!en || !aid) continue;
            const apt = aptById.get(aid);
            if (apt) {
              en.depositPaid = Boolean(apt.deposit_paid);
              if (apt.client_id && !en.clientId) en.clientId = apt.client_id;
            }
          }

          const { data: invoices } = await supabase
            .from('inkflow_payment_invoices')
            .select('appointment_id, public_url, payment_kind')
            .eq('studio_id', studioId)
            .in('appointment_id', uniqueAptIds)
            .not('public_url', 'is', null)
            .order('created_at', { ascending: false });

          const invoiceByApt = new Map<string, string>();
          for (const inv of invoices ?? []) {
            if (!invoiceByApt.has(inv.appointment_id) && inv.public_url) {
              invoiceByApt.set(inv.appointment_id, inv.public_url);
            }
          }
          for (const t of sortedThreads) {
            const en = next[t.threadId];
            const aid = en?.linkedAppointmentId;
            if (en && aid) en.invoicePublicUrl = invoiceByApt.get(aid) ?? null;
          }
        }

        const clientIds = [
          ...new Set(
            Object.values(next)
              .map((e) => e.clientId)
              .filter((id): id is string => Boolean(id))
          ),
        ];
        if (clientIds.length > 0) {
          const { data: notesRows } = await supabase
            .from('inkflow_client_notes')
            .select('client_id, notes')
            .in('client_id', clientIds);
          const notesByClient = new Map(
            (notesRows ?? []).map((n) => [n.client_id, (n.notes as string) || ''])
          );
          for (const t of sortedThreads) {
            const en = next[t.threadId];
            if (en?.clientId) en.quickNote = notesByClient.get(en.clientId) ?? '';
          }
        }
      } finally {
        if (!cancelled) {
          setEnrichmentByThread(next);
          setNoteDrafts((prev) => {
            const merged = { ...prev };
            for (const [tid, en] of Object.entries(next)) {
              if (merged[tid] === undefined) merged[tid] = en.quickNote;
            }
            return merged;
          });
          setEnrichmentLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studioId, sortedThreads]);

  const filterCounts = useMemo(() => {
    const counts: Partial<Record<ActivityFilterId, number>> = {};
    for (const f of ACTIVITY_FILTERS) {
      if (f.id === 'all') continue;
      counts[f.id] = filterActivityThreads(sortedThreads, f.id, enrichmentByThread).length;
    }
    return counts;
  }, [sortedThreads, enrichmentByThread]);

  const visibleThreads = useMemo(
    () => filterActivityThreads(sortedThreads, activeFilter, enrichmentByThread),
    [sortedThreads, activeFilter, enrichmentByThread]
  );

  const openThreadContext = useCallback(
    (threadId: string) => {
      if (threadId.startsWith('pr_')) {
        onOpenLinkedProjectRequest?.(threadId);
        return;
      }
      if (threadId.startsWith('bk_')) {
        onOpenLinkedBookingRequest?.(threadId);
      }
    },
    [onOpenLinkedProjectRequest, onOpenLinkedBookingRequest]
  );

  const waMessageFor = useCallback(
    (clientName: string, body?: string) => {
      if (body?.trim()) return body;
      const studio = studioName?.trim() || 'le studio';
      return `Bonjour ${clientName.trim() || ''}, c’est ${studio}. `;
    },
    [studioName]
  );

  const copyText = useCallback(
    async (text: string, successMsg: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(successMsg);
      } catch {
        toast.error('Copie impossible sur cet appareil.');
      }
    },
    [toast]
  );

  const handleRelanceConsent = useCallback(
    async (thread: MessageThread, en: ThreadEnrichment) => {
      if (!en.consentFormId) return;
      const structured = en.structured;
      const title = structured?.kind === 'consent_form_request' ? structured.title : undefined;
      const msg = buildConsentReminderMessage({
        clientName: thread.clientName,
        studioName: studioName || 'InkFlow',
        consentFormId: en.consentFormId,
        title,
      });
      const phone = en.phone.trim();
      const wa = phone ? buildWhatsAppUrl(phone, msg) : null;
      if (wa) {
        window.open(wa, '_blank', 'noopener,noreferrer');
        return;
      }
      await copyText(msg, 'Message de relance copié.');
    },
    [studioName, copyText]
  );

  const handleCopyPaymentLink = useCallback(
    async (en: ThreadEnrichment) => {
      const url = getPaymentCheckoutUrl(en.structured);
      if (!url) return;
      await copyText(url, 'Lien de paiement copié.');
    },
    [copyText]
  );

  const scheduleNoteSave = useCallback(
    (threadId: string, clientId: string, text: string) => {
      const prev = noteSaveTimers.current[threadId];
      if (prev) clearTimeout(prev);
      noteSaveTimers.current[threadId] = setTimeout(() => {
        void (async () => {
          setSavingNoteId(threadId);
          try {
            await saveClientNotesToSupabase(clientId, text);
            setEnrichmentByThread((old) => {
              const en = old[threadId];
              if (!en) return old;
              return { ...old, [threadId]: { ...en, quickNote: text } };
            });
          } catch {
            toast.error('Note non enregistrée.');
          } finally {
            setSavingNoteId(null);
          }
        })();
      }, 600);
    },
    [toast]
  );

  const studioLabel = studioName?.trim() || 'InkFlow';

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 dark:bg-black">
      <header className="space-y-4 border-b border-zinc-200/60 pb-6 dark:border-zinc-900">
        <div className="space-y-2">
          <h1 className="type-heading">Suivi clients</h1>
          <p className="max-w-lg text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
            Actions rapides, relances et notes — sans quitter le fil d’activité.
          </p>
        </div>
        {sortedThreads.length > 0 ? (
          <FilterPills active={activeFilter} onChange={setActiveFilter} counts={filterCounts} />
        ) : null}
      </header>

      {enrichmentLoading && sortedThreads.length > 0 ? (
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
          <Loader2 className="size-3 animate-spin" aria-hidden />
          Chargement…
        </p>
      ) : null}

      {sortedThreads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/40 px-8 py-14 text-center dark:border-zinc-900 dark:bg-zinc-950">
          <MessageCircle
            className="mx-auto size-9 text-zinc-300 dark:text-zinc-700"
            strokeWidth={1.25}
            aria-hidden
          />
          <p className="mt-5 font-medium text-zinc-800 dark:text-zinc-200">Aucune activité</p>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-zinc-500 dark:text-zinc-600">
            Les événements s’affichent lorsque vous envoyez un consentement, un lien Stripe ou
            recevez une demande.
          </p>
        </div>
      ) : visibleThreads.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="type-body text-muted-foreground">Aucune activité pour ce filtre.</p>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="mt-3 text-xs font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-300"
          >
            Voir tout
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {visibleThreads.map((thread) => {
            const preview = formatActivityFeedPreview(thread.lastMessage);
            const source = threadSourceLabel(thread.threadId);
            const en =
              enrichmentByThread[thread.threadId] ??
              ({
                phone: '',
                email: thread.clientEmail || '',
                clientId: null,
                linkedAppointmentId: thread.linkedAppointmentId ?? null,
                depositPaid: null,
                consentFormId: null,
                consentSigned: null,
                structured: parseThreadStructured(thread.lastMessage),
                invoicePublicUrl: null,
                quickNote: '',
              } satisfies ThreadEnrichment);

            const email = (en.email || thread.clientEmail || '').trim();
            const phone = en.phone.trim();
            const waUrl = phone ? buildWhatsAppUrl(phone, waMessageFor(thread.clientName)) : null;
            const mailUrl = buildMailtoUrl(email, {
              subject: `${studioLabel} — suivi de votre demande`,
            });
            const canOpenDemand =
              thread.threadId.startsWith('pr_') || thread.threadId.startsWith('bk_');
            const hasQuickContact = Boolean(waUrl || mailUrl);
            const noteOpen = expandedNoteThreadId === thread.threadId;
            const noteValue = noteDrafts[thread.threadId] ?? en.quickNote;
            const canNote = Boolean(en.clientId);
            const relance = showConsentRelance(en.structured, en);
            const copyLink = showCopyPaymentLink(en.structured);
            const invoice = showInvoiceAction(en.structured, en.invoicePublicUrl, en.depositPaid);
            const hasCtxActions = relance || copyLink || invoice;

            return (
              <li
                key={thread.threadId}
                id={`activity-thread-${thread.threadId}`}
                className={cn(
                  'rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4',
                  'dark:border-zinc-800 dark:bg-zinc-950',
                  focusThreadId === thread.threadId &&
                    'border-zinc-300 ring-1 ring-zinc-400/30 dark:border-zinc-700 dark:ring-zinc-600/40'
                )}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <ClientAvatar name={thread.clientName || 'Client'} avatarUrl={thread.avatar} />

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                          {thread.clientName || 'Client'}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
                          {source.emoji} {source.label}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <time
                          className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-600"
                          dateTime={thread.lastMessageAt}
                        >
                          {formatRelativeTime(thread.lastMessageAt)}
                        </time>
                        {canNote ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedNoteThreadId((id) =>
                                id === thread.threadId ? null : thread.threadId
                              )
                            }
                            className={cn(
                              iconActionClass,
                              'size-8',
                              noteOpen && 'text-zinc-900 dark:text-zinc-100'
                            )}
                            aria-label="Note rapide"
                            title="Note rapide"
                          >
                            <StickyNote className="size-3.5" strokeWidth={1.5} />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <p className={badgeClass}>
                      <span className="shrink-0 opacity-80" aria-hidden>
                        {preview.emoji}
                      </span>
                      <span className="truncate">{preview.label}</span>
                    </p>

                    {hasCtxActions ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {relance ? (
                          <button
                            type="button"
                            onClick={() => void handleRelanceConsent(thread, en)}
                            className={ctxActionClass}
                          >
                            <RotateCcw className="size-3" strokeWidth={1.5} />
                            Relancer
                          </button>
                        ) : null}
                        {copyLink ? (
                          <button
                            type="button"
                            onClick={() => void handleCopyPaymentLink(en)}
                            className={ctxActionClass}
                          >
                            <Copy className="size-3" strokeWidth={1.5} />
                            Copier le lien
                          </button>
                        ) : null}
                        {invoice && en.invoicePublicUrl ? (
                          <a
                            href={en.invoicePublicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={ctxActionClass}
                          >
                            <FileText className="size-3" strokeWidth={1.5} />
                            Voir la facture
                          </a>
                        ) : null}
                      </div>
                    ) : null}

                    {canOpenDemand ? (
                      <button
                        type="button"
                        onClick={() => openThreadContext(thread.threadId)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
                      >
                        Ouvrir la demande
                        <ExternalLink className="size-3" aria-hidden />
                      </button>
                    ) : null}
                  </div>

                  {hasQuickContact ? (
                    <div
                      className="flex shrink-0 flex-col items-center gap-1"
                      role="group"
                      aria-label="Contact rapide"
                    >
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={iconActionClass}
                          aria-label={`WhatsApp — ${thread.clientName}`}
                          title="WhatsApp"
                        >
                          <MessageCircle className="size-[18px]" strokeWidth={1.5} />
                        </a>
                      ) : null}
                      {mailUrl ? (
                        <a
                          href={mailUrl}
                          className={iconActionClass}
                          aria-label={`E-mail — ${thread.clientName}`}
                          title="E-mail"
                        >
                          <Mail className="size-[18px]" strokeWidth={1.5} />
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {noteOpen && canNote && en.clientId ? (
                  <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <label className="sr-only" htmlFor={`note-${thread.threadId}`}>
                      Note rapide pour {thread.clientName}
                    </label>
                    <textarea
                      id={`note-${thread.threadId}`}
                      rows={2}
                      value={noteValue}
                      placeholder="Note rapide (ex. rappeler à 18h)…"
                      onChange={(e) => {
                        const v = e.target.value;
                        setNoteDrafts((d) => ({ ...d, [thread.threadId]: v }));
                        scheduleNoteSave(thread.threadId, en.clientId!, v);
                      }}
                      className="w-full resize-none rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-600"
                    />
                    {savingNoteId === thread.threadId ? (
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-400">
                        <Loader2 className="size-2.5 animate-spin" />
                        Enregistrement…
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
