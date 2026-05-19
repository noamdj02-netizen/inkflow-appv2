import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Instagram,
  MessageCircle,
  Send,
  ArrowLeft,
  Search,
  MoreVertical,
  Smile,
  Check,
  CheckCheck,
  Plus,
  CreditCard,
  ExternalLink,
  Loader2,
  ClipboardCheck,
  FileText,
  MailCheck,
  Mail,
  User,
  Link2,
  Shield,
  Scale,
  Heart,
  Copy,
} from 'lucide-react';
import { getInstagramStatus } from '../../lib/instagram';
import { InstagramMessagingView } from './InstagramMessagingView';
import { supabase } from '../../lib/supabase';
import { sendMessageNotificationToClient } from '../../lib/sendNotification';
import { createCheckoutSession } from '../../lib/stripeClient';
import { ensurePlaceholderAppointmentForProject } from '../../lib/supabaseDashboard';
import { tryParseStructuredMessage } from '../../lib/messageContent';
import { ConsentFormMessageCard } from './ConsentFormMessageCard';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../ui/Modal';
import {
  CONSENT_FORM_PRESETS,
  consentPresetChipClassName,
  consentPresetCompactLabel,
  type ConsentFormPreset,
} from '../../lib/consentFormPresets';
import type { MessageThread, Message } from '../../types';
import { pickLinkedAppointmentForProjectRequest } from '../../lib/linkedAppointmentFromContext';

function ConsentPresetChipIcon({ icon }: { icon?: string }) {
  const c = 'w-3 h-3 shrink-0 opacity-90';
  switch (icon) {
    case 'standard':
      return <Shield className={c} aria-hidden />;
    case 'minor':
      return <Heart className={c} aria-hidden />;
    case 'piercing':
      return <Scale className={c} aria-hidden />;
    case 'simple':
      return <FileText className={c} aria-hidden />;
    default:
      return <FileText className={c} aria-hidden />;
  }
}

interface MessagingTabProps {
  studioId: string;
  /** Slug vitrine pour Stripe cancel/success URLs */
  studioSlug?: string | null;
  messageThreads?: MessageThread[];
  initialThreadId?: string | null;
  onInitialThreadOpened?: () => void;
  artistName?: string;
  studioName?: string;
  /** Ouvre Demandes → Projets et la fiche liée au fil `pr_*` */
  onOpenLinkedProjectRequest?: (projectRequestId: string) => void;
  /** Ouvre Demandes → Vitrine et la fiche liée au fil `bk_*` */
  onOpenLinkedBookingRequest?: (bookingId: string) => void;
}

/** Onglet Messagerie : layout premium avec sidebar et zone de chat */
export const MessagingTab: React.FC<MessagingTabProps> = ({
  studioId,
  studioSlug,
  messageThreads = [],
  initialThreadId,
  onInitialThreadOpened,
  artistName = 'Artiste',
  studioName,
  onOpenLinkedProjectRequest,
  onOpenLinkedBookingRequest,
}) => {
  const toast = useToast();
  const [igConnected, setIgConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'inkflow' | 'instagram'>('inkflow');
  const [loading, setLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmountStr, setPaymentAmountStr] = useState('50');
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  /** Modale « contacter le client » avec confirmation de consentement (envoi direct + notif e-mail si connu) */
  const [directContactOpen, setDirectContactOpen] = useState(false);
  const [directContactConsent, setDirectContactConsent] = useState(false);
  const [directContactDraft, setDirectContactDraft] = useState('');
  const [activeConsentPreset, setActiveConsentPreset] = useState<ConsentFormPreset | null>(null);
  const [threadHeaderMenuOpen, setThreadHeaderMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const threadHeaderMenuRef = useRef<HTMLDivElement>(null);

  /** Fil ouvert (ex. depuis Demandes) mais pas encore dans la liste construite depuis les messages */
  const [fallbackThread, setFallbackThread] = useState<MessageThread | null>(null);
  const [fallbackThreadLoading, setFallbackThreadLoading] = useState(false);

  const selectedThread = useMemo((): MessageThread | undefined => {
    if (!selectedThreadId) return undefined;
    return (
      messageThreads.find((t) => t.threadId === selectedThreadId) ?? fallbackThread ?? undefined
    );
  }, [messageThreads, selectedThreadId, fallbackThread]);

  useEffect(() => {
    if (!studioId || !selectedThreadId) {
      setFallbackThread(null);
      setFallbackThreadLoading(false);
      return;
    }
    if (messageThreads.some((t) => t.threadId === selectedThreadId)) {
      setFallbackThread(null);
      setFallbackThreadLoading(false);
      return;
    }

    let cancelled = false;
    setFallbackThreadLoading(true);
    setFallbackThread(null);

    const isoNow = () => new Date().toISOString();

    const buildFallback = (
      partial: Omit<MessageThread, 'threadId' | 'lastMessage' | 'lastMessageAt' | 'unreadCount'> &
        Partial<MessageThread>
    ): MessageThread => ({
      threadId: selectedThreadId,
      lastMessage: '',
      lastMessageAt: isoNow(),
      unreadCount: 0,
      ...partial,
    });

    void (async () => {
      try {
        if (selectedThreadId.startsWith('pr_')) {
          const { data: pr } = await supabase
            .from('inkflow_project_requests')
            .select('id, client_name, client_email')
            .eq('studio_id', studioId)
            .eq('id', selectedThreadId)
            .maybeSingle();
          if (cancelled) return;
          let linkedAppointmentId: string | null = null;
          if (pr?.id) {
            const { data: prApts } = await supabase
              .from('inkflow_appointments')
              .select('id, date, status')
              .eq('studio_id', studioId)
              .eq('project_request_id', pr.id);
            if (!cancelled && prApts?.length) {
              linkedAppointmentId = pickLinkedAppointmentForProjectRequest(
                prApts.map((r) => ({ id: r.id, date: r.date, status: r.status || '' })),
                new Date().toISOString().slice(0, 10)
              );
            }
          }
          if (cancelled) return;
          setFallbackThread(
            buildFallback({
              clientName: pr?.client_name?.trim() || 'Client',
              clientEmail: pr?.client_email?.trim() || '',
              projectRequestId: pr?.id ?? selectedThreadId,
              linkedAppointmentId,
            })
          );
        } else if (selectedThreadId.startsWith('bk_')) {
          const { data: bk } = await supabase
            .from('inkflow_bookings')
            .select('id, client_name, client_email, recap_appointment_id')
            .eq('studio_id', studioId)
            .eq('id', selectedThreadId)
            .maybeSingle();
          if (cancelled) return;
          setFallbackThread(
            buildFallback({
              clientName: bk?.client_name?.trim() || 'Client',
              clientEmail: bk?.client_email?.trim() || '',
              linkedAppointmentId: bk?.recap_appointment_id ?? null,
            })
          );
        } else {
          if (cancelled) return;
          setFallbackThread(
            buildFallback({
              clientName: 'Client',
              clientEmail: '',
            })
          );
        }
      } finally {
        if (!cancelled) setFallbackThreadLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studioId, selectedThreadId, messageThreads]);

  /** Statut questionnaire santé (inkflow_health_forms), visible côté studio */
  const [healthLine, setHealthLine] = useState<'loading' | 'ok' | 'incomplete' | 'none'>('loading');
  const [healthDetail, setHealthDetail] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!studioId || !selectedThreadId || !selectedThread) {
      setHealthLine('none');
      setHealthDetail(undefined);
      return;
    }
    let cancelled = false;
    setHealthLine('loading');
    setHealthDetail(undefined);

    const email = (selectedThread.clientEmail || '').trim();

    void (async () => {
      try {
        if (selectedThreadId.startsWith('bk_')) {
          const { data } = await supabase
            .from('inkflow_health_forms')
            .select('certified_accurate, certified_at, created_at')
            .eq('studio_id', studioId)
            .eq('booking_id', selectedThreadId)
            .maybeSingle();
          if (cancelled) return;
          if (!data) {
            setHealthLine('none');
            return;
          }
          if (data.certified_accurate) {
            const d = data.certified_at || data.created_at;
            setHealthLine('ok');
            setHealthDetail(
              d
                ? `Questionnaire validé le ${new Date(d).toLocaleDateString('fr-FR')}`
                : 'Questionnaire de santé validé'
            );
          } else {
            setHealthLine('incomplete');
            setHealthDetail('Questionnaire reçu, certification manquante');
          }
          return;
        }

        if (selectedThreadId.startsWith('pr_')) {
          const { data: apts } = await supabase
            .from('inkflow_appointments')
            .select('id')
            .eq('studio_id', studioId)
            .eq('project_request_id', selectedThreadId);
          if (cancelled) return;
          const aptIds = (apts ?? []).map((a) => a.id).filter(Boolean);

          let row: {
            certified_accurate: boolean | null;
            certified_at: string | null;
            created_at: string | null;
          } | null = null;

          if (aptIds.length > 0) {
            const { data: rows } = await supabase
              .from('inkflow_health_forms')
              .select('certified_accurate, certified_at, created_at')
              .eq('studio_id', studioId)
              .in('appointment_id', aptIds)
              .order('created_at', { ascending: false })
              .limit(1);
            row = rows?.[0] ?? null;
          }
          if (!row && email) {
            const { data: byEmail } = await supabase
              .from('inkflow_health_forms')
              .select('certified_accurate, certified_at, created_at')
              .eq('studio_id', studioId)
              .eq('client_email', email)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            row = byEmail ?? null;
          }
          if (cancelled) return;
          if (!row) {
            setHealthLine('none');
            return;
          }
          if (row.certified_accurate) {
            const d = row.certified_at || row.created_at;
            setHealthLine('ok');
            setHealthDetail(
              d
                ? `Questionnaire validé le ${new Date(d).toLocaleDateString('fr-FR')}`
                : 'Questionnaire de santé validé'
            );
          } else {
            setHealthLine('incomplete');
            setHealthDetail('Questionnaire reçu, certification manquante');
          }
          return;
        }

        setHealthLine('none');
      } catch {
        if (!cancelled) {
          setHealthLine('none');
          setHealthDetail(undefined);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studioId, selectedThreadId, selectedThread]);

  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return messageThreads;
    const q = searchQuery.toLowerCase();
    return messageThreads.filter(
      (t) => t.clientName.toLowerCase().includes(q) || t.lastMessage?.toLowerCase().includes(q)
    );
  }, [messageThreads, searchQuery]);

  useEffect(() => {
    if (!studioId) {
      setLoading(false);
      return;
    }
    getInstagramStatus(studioId)
      .then((data) => setIgConnected(data.connected))
      .catch(() => setIgConnected(false))
      .finally(() => setLoading(false));
  }, [studioId]);

  useEffect(() => {
    if (initialThreadId && initialThreadId !== selectedThreadId) {
      setSelectedThreadId(initialThreadId);
      onInitialThreadOpened?.();
    }
  }, [initialThreadId, selectedThreadId, onInitialThreadOpened]);

  useEffect(() => {
    if (!selectedThreadId) return;
    loadMessages(selectedThreadId);

    const channel = supabase
      .channel(`messages_${selectedThreadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inkflow_messages',
          filter: `thread_id=eq.${selectedThreadId}`,
        },
        () => loadMessages(selectedThreadId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!threadHeaderMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (threadHeaderMenuRef.current?.contains(e.target as Node)) return;
      setThreadHeaderMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setThreadHeaderMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [threadHeaderMenuOpen]);

  useEffect(() => {
    setThreadHeaderMenuOpen(false);
  }, [selectedThreadId]);

  useEffect(() => {
    setActiveConsentPreset(null);
  }, [selectedThreadId]);

  const loadMessages = async (threadId: string) => {
    const { data } = await supabase
      .from('inkflow_messages')
      .select('id,studio_id,thread_id,sender_type,sender_name,content,read,created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(
        data.map((row) => ({
          id: row.id,
          studioId: row.studio_id,
          threadId: row.thread_id,
          senderType: row.sender_type,
          senderName: row.sender_name,
          content: row.content,
          read: row.read,
          createdAt: row.created_at,
        }))
      );
    }
  };

  const defaultDirectContactText = useMemo(() => {
    const studio = studioName?.trim();
    return studio
      ? `Bonjour, nous vous contactons depuis ${studio} pour faire suite à votre demande sur Inkflow.`
      : `Bonjour, nous vous contactons depuis le studio pour faire suite à votre demande sur Inkflow.`;
  }, [studioName]);

  const sendOutboundArtistMessage = async (
    rawContent: string,
    options?: { toastOnError?: boolean }
  ): Promise<boolean> => {
    const content = rawContent.trim();
    if (!content || !selectedThreadId || sending) return false;
    setSending(true);
    try {
      const msg = {
        id: `msg_${Date.now()}`,
        studio_id: studioId,
        thread_id: selectedThreadId,
        sender_type: 'artist' as const,
        sender_name: artistName,
        content,
        read: false,
      };
      const { error } = await supabase.from('inkflow_messages').insert(msg);
      if (error) throw error;
      if (selectedThread?.clientEmail) {
        sendMessageNotificationToClient({
          clientEmail: selectedThread.clientEmail,
          clientName: selectedThread.clientName || 'Client',
          studioName,
          senderName: artistName,
          messagePreview: content,
          threadId: selectedThreadId,
        });
      }
      setNewMessage('');
      inputRef.current?.focus();
      return true;
    } catch {
      if (options?.toastOnError !== false) {
        toast.error("Le message n'a pas pu être envoyé. Réessaie.");
      }
      return false;
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    await sendOutboundArtistMessage(newMessage, { toastOnError: false });
  };

  const openDirectContactModal = () => {
    setDirectContactConsent(false);
    setDirectContactDraft('');
    setDirectContactOpen(true);
  };

  const handleSendDirectContact = async () => {
    if (!directContactConsent) {
      toast.error('Coche la case pour confirmer le consentement du client.');
      return;
    }
    const body = directContactDraft.trim() || defaultDirectContactText;
    const ok = await sendOutboundArtistMessage(body, { toastOnError: true });
    if (ok) {
      toast.success('Message envoyé au client.');
      setDirectContactOpen(false);
      setDirectContactConsent(false);
      setDirectContactDraft('');
    }
  };

  const copyFromThreadMenu = (text: string, successLabel: string) => {
    void navigator.clipboard.writeText(text).then(
      () => {
        toast.success(successLabel);
        setThreadHeaderMenuOpen(false);
      },
      () => toast.error('Copie impossible')
    );
  };

  const buildConsentMessageBody = (preset: ConsentFormPreset) =>
    `[${preset.title}]\n\n${preset.content}`;

  const insertConsentPresetInComposer = (preset: ConsentFormPreset) => {
    setNewMessage(buildConsentMessageBody(preset));
    setActiveConsentPreset(null);
    toast.success('Modèle inséré dans le champ — relis avant d’envoyer.');
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: false });
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };

  const copyConsentPresetPlain = (preset: ConsentFormPreset) => {
    void navigator.clipboard.writeText(preset.content).then(
      () => toast.success('Texte du formulaire copié'),
      () => toast.error('Copie impossible')
    );
  };

  /** Envoie un formulaire interactif (remplissage + signature dans le fil + enregistrement CRM au signalement). */
  const sendInteractiveConsentForm = async (preset: ConsentFormPreset) => {
    if (!selectedThreadId || !studioId) return;
    const email = (selectedThread?.clientEmail || '').trim();
    if (!email) {
      toast.error(
        'E-mail client introuvable sur ce fil. Utilise un fil lié à une demande ou réservation avec e-mail, ou envoie le texte brut depuis le modèle.'
      );
      return;
    }
    setSending(true);
    try {
      const consentFormId = `cf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const clientName = (selectedThread?.clientName || 'Client').trim() || 'Client';
      const appointmentId =
        (selectedThread?.linkedAppointmentId && selectedThread.linkedAppointmentId.trim()) || null;
      const { error: cErr } = await supabase.from('inkflow_consent_forms').insert({
        id: consentFormId,
        studio_id: studioId,
        client_name: clientName,
        client_email: email,
        template: preset.content,
        appointment_id: appointmentId,
      });
      if (cErr) {
        toast.error(cErr.message || 'Enregistrement du formulaire impossible.');
        return;
      }
      const payload = JSON.stringify({
        kind: 'consent_form_request',
        consentFormId,
        title: preset.title,
      });
      const { error: mErr } = await supabase.from('inkflow_messages').insert({
        id: `msg_${Date.now()}`,
        studio_id: studioId,
        thread_id: selectedThreadId,
        sender_type: 'artist',
        sender_name: artistName,
        content: payload,
        read: false,
      });
      if (mErr) throw mErr;
      sendMessageNotificationToClient({
        clientEmail: email,
        clientName,
        studioName,
        senderName: artistName,
        messagePreview: `Formulaire « ${preset.title} » — à remplir dans la conversation Inkflow`,
        threadId: selectedThreadId,
      });
      toast.success(
        appointmentId
          ? 'Formulaire envoyé (lié au RDV) — le client peut signer dans la conversation.'
          : 'Formulaire envoyé — sans lien RDV précis ; le client peut signer dans la conversation.'
      );
      setActiveConsentPreset(null);
      await loadMessages(selectedThreadId);
    } catch {
      toast.error("L'envoi du formulaire a échoué. Réessaie.");
    } finally {
      setSending(false);
    }
  };

  const handleSendPaymentCard = async () => {
    if (!selectedThreadId?.startsWith('pr_') || !studioId) return;
    const amt = parseFloat(paymentAmountStr.replace(',', '.'));
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error('Indique un montant valide');
      return;
    }
    setPaymentBusy(true);
    try {
      const { data: pr, error: prErr } = await supabase
        .from('inkflow_project_requests')
        .select('id, client_name, client_email, description')
        .eq('id', selectedThreadId)
        .single();
      if (prErr || !pr) {
        toast.error('Demande de projet introuvable');
        return;
      }
      const aptId = await ensurePlaceholderAppointmentForProject(studioId, {
        id: pr.id,
        clientName: pr.client_name,
        clientEmail: pr.client_email,
        description: pr.description,
        depositEuros: amt,
      });
      const serviceName =
        pr.description.length > 50 ? `${pr.description.slice(0, 47)}...` : pr.description;
      const result = await createCheckoutSession({
        studioId,
        studioSlug: studioSlug ?? undefined,
        appointmentId: aptId,
        amount: amt,
        clientName: pr.client_name,
        clientEmail: pr.client_email,
        serviceName: `Projet - ${serviceName}`,
        type: 'deposit',
        projectRequestId: pr.id,
        threadId: selectedThreadId,
      });
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      const payload = JSON.stringify({
        kind: 'payment_card',
        amount: amt,
        currency: 'EUR',
        checkoutUrl: result.url,
        stripeSessionId: result.sessionId,
      });
      const { error: insErr } = await supabase.from('inkflow_messages').insert({
        id: `msg_${Date.now()}`,
        studio_id: studioId,
        thread_id: selectedThreadId,
        sender_type: 'artist',
        sender_name: artistName,
        content: payload,
        read: false,
      });
      if (insErr) throw insErr;
      await loadMessages(selectedThreadId);
      if (selectedThread?.clientEmail) {
        sendMessageNotificationToClient({
          clientEmail: selectedThread.clientEmail,
          clientName: selectedThread.clientName || 'Client',
          studioName,
          senderName: artistName,
          messagePreview: `Lien de paiement (${amt}€)`,
          threadId: selectedThreadId,
        });
      }
      setPaymentModalOpen(false);
      toast.success('Carte de paiement envoyée');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur envoi carte');
    } finally {
      setPaymentBusy(false);
    }
  };

  const formatTime = (date: string) => {
    try {
      const d = new Date(date);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return 'Hier';
      }
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const renderStructuredOrText = (msg: Message, isOutbound: boolean) => {
    const structured = tryParseStructuredMessage(msg.content);
    if (structured?.kind === 'payment_card') {
      return (
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700 border-l-4 border-l-amber-500 bg-white dark:bg-zinc-800/90 p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <CreditCard className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-sm font-semibold">
              Acompte — {structured.amount} {structured.currency ?? 'EUR'}
            </span>
          </div>
          <a
            href={structured.checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 text-sm font-medium active:scale-[0.98] transition-all"
          >
            Payer maintenant
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      );
    }
    if (structured?.kind === 'payment_receipt') {
      return (
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700 border-l-4 border-l-emerald-500 bg-white dark:bg-zinc-800/90 p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">
              Paiement reçu — {structured.amount} {structured.currency ?? 'EUR'}
            </span>
          </div>
          {structured.receiptUrl ? (
            <a
              href={structured.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Voir le reçu
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Ton acompte a bien été enregistré.
            </p>
          )}
        </div>
      );
    }
    if (structured?.kind === 'consent_form_request') {
      return (
        <ConsentFormMessageCard
          consentFormId={structured.consentFormId}
          title={structured.title}
          mode={isOutbound ? 'studio_status' : 'client_sign'}
        />
      );
    }
    return (
      <div
        className={`min-w-0 max-w-full overflow-hidden px-4 py-3 rounded-2xl shadow-sm ${
          isOutbound
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-w-full">
          {msg.content}
        </p>
      </div>
    );
  };

  const quickReplies = [
    "Bonjour, l'acompte est de 30€. Souhaitez-vous réserver ?",
    'Votre RDV est confirmé pour le ',
    'Merci pour votre confiance ! À bientôt.',
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-zinc-500 dark:text-zinc-500 text-sm">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  /** Sans fil ciblé, on garde l’écran d’accroche Instagram uniquement si aucune conversation n’existe */
  if (!igConnected && messageThreads.length === 0 && !initialThreadId && !selectedThreadId) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/25">
            <Instagram className="w-10 h-10 text-white" />
          </div>
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
              Connecte ton Instagram
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              Réponds à tes clients directement depuis Inkflow. Centralise tes DM Instagram et tes
              conversations clients en un seul endroit.
            </p>
          </div>
          <a
            href="/dashboard?section=messagerie"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/dashboard?section=messagerie';
            }}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-purple-500/25"
          >
            <Instagram className="w-5 h-5" />
            Connecter Instagram
          </a>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Paramètres → Messagerie pour configurer la connexion
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden h-[calc(100dvh-140px)] min-h-[500px]">
        {/* Onglets Instagram / Messages — visibles uniquement si Instagram connecté */}
        {igConnected && (
          <div className="flex border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <button
              type="button"
              onClick={() => setActiveTab('inkflow')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'inkflow'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Messages
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('instagram')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'instagram'
                  ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-500'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <Instagram className="w-4 h-4" />
              Instagram DMs
            </button>
          </div>
        )}

        {/* Vue Instagram DMs */}
        {activeTab === 'instagram' && igConnected ? (
          <div className="h-[calc(100%-49px)] overflow-hidden">
            <InstagramMessagingView studioId={studioId} />
          </div>
        ) : (
          <div className="flex h-full">
            {/* Sidebar - Liste des conversations */}
            <aside
              className={`w-full md:w-80 lg:w-96 border-r border-zinc-200/80 dark:border-zinc-800 flex flex-col shrink-0 ${
                selectedThreadId ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Header Sidebar */}
              <div className="px-5 py-4 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center shadow-sm">
                      <MessageCircle className="w-5 h-5 text-white dark:text-zinc-900" />
                    </div>
                    <div>
                      <h2 className="font-bold text-zinc-900 dark:text-white">Messages</h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        {messageThreads.length} conversation{messageThreads.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une conversation..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Liste des conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredThreads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Aucune conversation
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 max-w-[200px]">
                      Les conversations apparaîtront ici quand vous accepterez des demandes.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {filteredThreads.map((thread) => {
                      const isSelected = selectedThreadId === thread.threadId;
                      return (
                        <button
                          key={thread.threadId}
                          onClick={() => setSelectedThreadId(thread.threadId)}
                          className={`w-full flex items-center gap-3 p-4 transition-all text-left group ${
                            isSelected
                              ? 'bg-zinc-100 dark:bg-zinc-800/70 border-l-2 border-zinc-900 dark:border-white'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-l-2 border-transparent'
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className={`relative w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 transition-transform group-hover:scale-105 ${
                              isSelected
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                            }`}
                          >
                            {thread.clientName.charAt(0).toUpperCase()}
                            {thread.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                                {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span
                                className={`font-semibold text-sm truncate ${
                                  thread.unreadCount > 0
                                    ? 'text-zinc-900 dark:text-white'
                                    : 'text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                {thread.clientName}
                              </span>
                              <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                                {formatTime(thread.lastMessageAt)}
                              </span>
                            </div>
                            <p
                              className={`text-sm truncate ${
                                thread.unreadCount > 0
                                  ? 'text-zinc-600 dark:text-zinc-300 font-medium'
                                  : 'text-zinc-500 dark:text-zinc-500'
                              }`}
                            >
                              {thread.lastMessage || 'Aucun message'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Instagram */}
              {igConnected && (
                <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                    <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                      <Instagram className="w-3 h-3 text-white" />
                    </div>
                    <span>Instagram connecté</span>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-auto" />
                  </div>
                </div>
              )}
            </aside>

            {/* Zone de chat */}
            {selectedThreadId && selectedThread ? (
              <main className="flex-1 flex flex-col min-w-0 min-h-0">
                {/* Header Chat */}
                <header className="px-3 sm:px-5 py-2 sm:py-3 border-b border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedThreadId(null)}
                      aria-label="Retour à la liste des conversations"
                      className="md:hidden shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors active:scale-95"
                    >
                      <ArrowLeft className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    </button>

                    <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm sm:text-base text-zinc-700 dark:text-zinc-200 font-bold shadow-sm">
                      {selectedThread.clientName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white truncate leading-tight">
                            {selectedThread.clientName}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-500 truncate leading-snug mt-0.5">
                            {selectedThread.clientEmail || 'Client Inkflow'}
                          </p>
                        </div>
                        <div className="relative shrink-0 -mr-1" ref={threadHeaderMenuRef}>
                          <button
                            type="button"
                            id="thread-header-menu-button"
                            aria-expanded={threadHeaderMenuOpen}
                            aria-haspopup="menu"
                            aria-controls={threadHeaderMenuOpen ? 'thread-header-menu' : undefined}
                            onClick={() => setThreadHeaderMenuOpen((o) => !o)}
                            className="shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors active:scale-[0.98]"
                            aria-label="Plus d’options pour cette conversation"
                          >
                            <MoreVertical
                              className="w-5 h-5 text-zinc-500 dark:text-zinc-400"
                              aria-hidden
                            />
                          </button>
                          {threadHeaderMenuOpen ? (
                            <div
                              id="thread-header-menu"
                              role="menu"
                              aria-labelledby="thread-header-menu-button"
                              className="absolute right-0 top-full mt-1 z-[60] w-[min(100vw-2rem,17rem)] rounded-xl border border-zinc-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1 shadow-lg"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                disabled={!selectedThread.clientEmail?.trim()}
                                onClick={() =>
                                  selectedThread.clientEmail?.trim() &&
                                  copyFromThreadMenu(
                                    selectedThread.clientEmail.trim(),
                                    'E-mail copié'
                                  )
                                }
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40 min-h-[44px] transition-colors"
                              >
                                <Mail className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
                                Copier l&apos;e-mail
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() =>
                                  copyFromThreadMenu(
                                    selectedThread.clientName.trim() || 'Client',
                                    'Nom copié'
                                  )
                                }
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 min-h-[44px] transition-colors"
                              >
                                <User className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
                                Copier le nom
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() =>
                                  copyFromThreadMenu(
                                    `${typeof window !== 'undefined' ? window.location.origin : ''}/messages/${encodeURIComponent(selectedThreadId)}`,
                                    'Lien conversation (côté client) copié'
                                  )
                                }
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 min-h-[44px] transition-colors"
                              >
                                <Link2 className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
                                Copier le lien client
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setThreadHeaderMenuOpen(false);
                                  openDirectContactModal();
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 min-h-[44px] transition-colors"
                              >
                                <MailCheck className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
                                Contacter avec consentement
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setThreadHeaderMenuOpen(false);
                                  inputRef.current?.focus({ preventScroll: false });
                                  setTimeout(() => {
                                    inputRef.current?.scrollIntoView({
                                      behavior: 'smooth',
                                      block: 'end',
                                    });
                                  }, 0);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 min-h-[44px] transition-colors"
                              >
                                <MessageCircle
                                  className="w-4 h-4 shrink-0 opacity-80"
                                  aria-hidden
                                />
                                Écrire un message
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-nowrap items-center gap-1.5 min-w-0 overflow-x-auto [scrollbar-width:thin]">
                        {healthLine === 'loading' && (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
                            <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
                            Santé…
                          </span>
                        )}
                        {healthLine === 'ok' && (
                          <span
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200/90 bg-emerald-50/90 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-200 max-w-[min(100%,14rem)] sm:max-w-[20rem] truncate shrink-0"
                            title={healthDetail}
                          >
                            <ClipboardCheck className="w-3 h-3 shrink-0" aria-hidden />
                            <span className="truncate">
                              {healthDetail ?? 'Questionnaire de santé validé'}
                            </span>
                          </span>
                        )}
                        {healthLine === 'incomplete' && (
                          <span
                            className="inline-flex items-center gap-1 rounded-md border border-amber-200/90 bg-amber-50/90 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-100 max-w-[min(100%,14rem)] sm:max-w-[20rem] truncate shrink-0"
                            title={healthDetail}
                          >
                            <ClipboardCheck className="w-3 h-3 shrink-0 opacity-80" aria-hidden />
                            <span className="truncate">
                              {healthDetail ?? 'Questionnaire incomplet'}
                            </span>
                          </span>
                        )}
                        {healthLine === 'none' && (
                          <span className="inline-flex items-center rounded-md border border-zinc-200/90 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/80 px-1.5 py-0.5 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
                            Pas de questionnaire santé
                          </span>
                        )}
                        {selectedThreadId.startsWith('pr_') && onOpenLinkedProjectRequest && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenLinkedProjectRequest(
                                selectedThread.projectRequestId ?? selectedThreadId
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-[10px] sm:text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all shrink-0 min-h-[32px]"
                          >
                            <FileText className="w-3 h-3 shrink-0" aria-hidden />
                            Voir le projet
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                          </button>
                        )}
                        {selectedThreadId.startsWith('bk_') && onOpenLinkedBookingRequest && (
                          <button
                            type="button"
                            onClick={() => onOpenLinkedBookingRequest(selectedThreadId)}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-[10px] sm:text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all shrink-0 min-h-[32px]"
                          >
                            <FileText className="w-3 h-3 shrink-0" aria-hidden />
                            <span className="hidden min-[380px]:inline">
                              Voir la demande vitrine
                            </span>
                            <span className="min-[380px]:hidden">Demande</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={openDirectContactModal}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200/90 dark:border-emerald-500/35 bg-emerald-50/90 dark:bg-emerald-500/10 px-2 py-1 text-[10px] sm:text-[11px] font-medium text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/90 dark:hover:bg-emerald-500/20 active:scale-[0.98] transition-all shrink-0 min-h-[32px]"
                          title="Envoyer un message au client après confirmation de consentement (e-mail si disponible)"
                          aria-label="Contacter le client avec confirmation de consentement"
                        >
                          <MailCheck className="w-3 h-3 shrink-0 opacity-90" aria-hidden />
                          <span className="hidden min-[380px]:inline">Contacter le client</span>
                          <span className="min-[380px]:hidden">Contacter</span>
                        </button>
                        {CONSENT_FORM_PRESETS.map((preset) => (
                          <button
                            key={preset.title}
                            type="button"
                            onClick={() => setActiveConsentPreset(preset)}
                            title={preset.title}
                            aria-label={`Ouvrir le modèle : ${preset.title}`}
                            className={consentPresetChipClassName(preset.color)}
                          >
                            <ConsentPresetChipIcon icon={preset.icon} />
                            <span className="truncate">{consentPresetCompactLabel(preset)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </header>

                {/* Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-5 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/50">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-zinc-200/80 dark:border-zinc-700">
                        <MessageCircle className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Démarrez la conversation
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">
                        Envoyez un message à {selectedThread.clientName}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOutbound = msg.senderType === 'artist' || msg.senderType === 'system';
                      return (
                        <div
                          key={msg.id}
                          className={`flex min-w-0 w-full ${isOutbound ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`min-w-0 max-w-[85%] sm:max-w-[75%] group ${
                              isOutbound ? 'order-1' : 'order-2'
                            }`}
                          >
                            {renderStructuredOrText(msg, isOutbound)}
                            <div
                              className={`flex items-center gap-1 mt-1 px-1 ${
                                isOutbound ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                {formatTime(msg.createdAt)}
                              </span>
                              {isOutbound && (
                                <span className="text-zinc-400 dark:text-zinc-500">
                                  {msg.read ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                <div className="px-5 py-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Réponses rapides
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((template) => (
                      <button
                        key={template}
                        type="button"
                        onClick={() =>
                          setNewMessage((prev) => (prev ? `${prev} ${template}` : template))
                        }
                        className="text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-[0.98]"
                      >
                        {template.slice(0, 35)}…
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Zone */}
                <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-3">
                    {selectedThreadId?.startsWith('pr_') ? (
                      <button
                        type="button"
                        title="Envoyer une carte de paiement"
                        onClick={() => setPaymentModalOpen(true)}
                        className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hidden sm:flex active:scale-[0.98] transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    ) : (
                      <span className="hidden sm:block w-11 shrink-0" aria-hidden />
                    )}

                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Écrivez votre message..."
                        className="w-full px-4 py-3 pr-12 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-xl text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-zinc-400 dark:text-zinc-500 hidden sm:flex">
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="p-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm shadow-blue-500/25"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </main>
            ) : selectedThreadId ? (
              <main className="flex-1 flex flex-col min-w-0 min-h-0 items-center justify-center bg-zinc-50/50 dark:bg-zinc-950/50 p-6">
                {fallbackThreadLoading ? (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" aria-hidden />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                      Chargement de la conversation…
                    </p>
                  </>
                ) : (
                  <div className="text-center max-w-xs">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
                      Impossible de charger les infos de ce fil.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedThreadId(null)}
                      className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                    >
                      Retour à la liste
                    </button>
                  </div>
                )}
              </main>
            ) : (
              /* Empty State - Desktop */
              <main className="hidden md:flex flex-1 items-center justify-center bg-zinc-50/50 dark:bg-zinc-950/50">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-zinc-200/80 dark:border-zinc-700">
                    <MessageCircle className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                    Sélectionne une conversation
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500 max-w-[280px]">
                    Choisis une conversation dans la liste pour voir les messages et répondre à tes
                    clients.
                  </p>
                </div>
              </main>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={directContactOpen}
        onClose={() => {
          if (!sending) {
            setDirectContactOpen(false);
            setDirectContactConsent(false);
            setDirectContactDraft('');
          }
        }}
        title="Contacter le client"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Envoie un message dans le fil et, si l&apos;e-mail du client est connu, une notification
            par e-mail. Indique un texte personnalisé ou laisse vide pour utiliser le message
            d&apos;accroche proposé.
          </p>
          {!selectedThread?.clientEmail ? (
            <p className="text-xs rounded-xl border border-amber-200/90 dark:border-amber-500/35 bg-amber-50/90 dark:bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-100">
              Aucun e-mail sur ce fil : le message sera visible uniquement dans Inkflow (pas de
              notification mail).
            </p>
          ) : null}
          <div>
            <label
              htmlFor="direct-contact-body"
              className="block text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1.5"
            >
              Message (facultatif)
            </label>
            <textarea
              id="direct-contact-body"
              rows={3}
              value={directContactDraft}
              onChange={(e) => setDirectContactDraft(e.target.value)}
              placeholder={defaultDirectContactText}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 resize-y min-h-[88px]"
            />
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
              Si tu laisses vide, ce texte sera envoyé : « {defaultDirectContactText.slice(0, 72)}
              {defaultDirectContactText.length > 72 ? '…' : ''} »
            </p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/50 p-3">
            <input
              type="checkbox"
              checked={directContactConsent}
              onChange={(e) => setDirectContactConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500/30"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug">
              Je confirme disposer du consentement du client pour le contacter à ce sujet
              (messagerie Inkflow et, le cas échéant, e-mail lié à sa demande ou son rendez-vous).
            </span>
          </label>
          <div className="flex flex-wrap gap-2 justify-end pt-1">
            <button
              type="button"
              disabled={sending}
              onClick={() => {
                setDirectContactOpen(false);
                setDirectContactConsent(false);
                setDirectContactDraft('');
              }}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={handleSendDirectContact}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all inline-flex items-center gap-2"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-zinc-400/30 dark:border-t-zinc-900 rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Envoyer
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeConsentPreset != null}
        onClose={() => {
          if (!sending) setActiveConsentPreset(null);
        }}
        title={activeConsentPreset?.title ?? 'Formulaire de consentement'}
        size="lg"
      >
        {activeConsentPreset ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <strong className="text-zinc-800 dark:text-zinc-200">Recommandé :</strong> envoyer le
              formulaire interactif — le client le remplit et signe dans la conversation ; la
              réponse est ajoutée à sa fiche CRM (si l’e-mail du fil correspond à un client).
              {selectedThread?.clientEmail
                ? ' Une notification e-mail peut l’alerter.'
                : ' Ici, e-mail client absent : utilise « Texte brut » ou un fil avec e-mail.'}
            </p>
            <div className="max-h-[min(50vh,420px)] overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-950/50 p-3">
              <pre className="whitespace-pre-wrap break-words text-[11px] sm:text-xs font-mono text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {activeConsentPreset.content}
              </pre>
            </div>
            <div className="flex flex-wrap gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => copyConsentPresetPlain(activeConsentPreset)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all inline-flex items-center gap-2"
              >
                <Copy className="w-4 h-4" aria-hidden />
                Copier le texte
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => insertConsentPresetInComposer(activeConsentPreset)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                Insérer texte brut
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => void sendInteractiveConsentForm(activeConsentPreset)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all inline-flex items-center gap-2"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-zinc-400/30 dark:border-t-zinc-900 rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" aria-hidden />
                )}
                Envoyer formulaire (conversation)
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={paymentModalOpen}
        onClose={() => {
          if (!paymentBusy) setPaymentModalOpen(false);
        }}
        title="Carte de paiement"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Montant de l&apos;acompte pour ce projet. Un message avec le lien Stripe sera ajouté au
            fil.
          </p>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1.5">
              Montant (€)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={paymentAmountStr}
              onChange={(e) => setPaymentAmountStr(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="50"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              disabled={paymentBusy}
              onClick={() => setPaymentModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={paymentBusy}
              onClick={handleSendPaymentCard}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all inline-flex items-center gap-2"
            >
              {paymentBusy ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-zinc-400/30 dark:border-t-zinc-900 rounded-full animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Envoyer
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
