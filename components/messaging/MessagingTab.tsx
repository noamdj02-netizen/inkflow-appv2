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
} from 'lucide-react';
import { getInstagramStatus } from '../../lib/instagram';
import { InstagramMessagingView } from './InstagramMessagingView';
import { supabase } from '../../lib/supabase';
import { sendMessageNotificationToClient } from '../../lib/sendNotification';
import { createCheckoutSession } from '../../lib/stripeClient';
import { ensurePlaceholderAppointmentForProject } from '../../lib/supabaseDashboard';
import { tryParseStructuredMessage } from '../../lib/messageContent';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../ui/Modal';
import type { MessageThread, Message } from '../../types';

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
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    const buildFallback = (partial: Omit<MessageThread, 'threadId' | 'lastMessage' | 'lastMessageAt' | 'unreadCount'> & Partial<MessageThread>): MessageThread => ({
      threadId: selectedThreadId,
      lastMessage: '',
      lastMessageAt: isoNow(),
      unreadCount: 0,
      ...partial,
    });

    void (async () => {
      try {
        if (selectedThreadId.startsWith('pr_')) {
          const prId = selectedThreadId.slice(3);
          const { data: pr } = await supabase
            .from('inkflow_project_requests')
            .select('id, client_name, client_email')
            .eq('studio_id', studioId)
            .eq('id', prId)
            .maybeSingle();
          if (cancelled) return;
          setFallbackThread(
            buildFallback({
              clientName: pr?.client_name?.trim() || 'Client',
              clientEmail: pr?.client_email?.trim() || '',
              projectRequestId: pr?.id ?? prId,
            })
          );
        } else if (selectedThreadId.startsWith('bk_')) {
          const { data: bk } = await supabase
            .from('inkflow_bookings')
            .select('id, client_name, client_email')
            .eq('studio_id', studioId)
            .eq('id', selectedThreadId)
            .maybeSingle();
          if (cancelled) return;
          setFallbackThread(
            buildFallback({
              clientName: bk?.client_name?.trim() || 'Client',
              clientEmail: bk?.client_email?.trim() || '',
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
  const [healthLine, setHealthLine] = useState<
    'loading' | 'ok' | 'incomplete' | 'none'
  >('loading');
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
          const prId = selectedThreadId.slice(3);
          const { data: apts } = await supabase
            .from('inkflow_appointments')
            .select('id')
            .eq('studio_id', studioId)
            .eq('project_request_id', prId);
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
      (t) =>
        t.clientName.toLowerCase().includes(q) ||
        t.lastMessage?.toLowerCase().includes(q)
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

  const loadMessages = async (threadId: string) => {
    const { data } = await supabase
      .from('inkflow_messages')
      .select('*')
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThreadId || sending) return;
    setSending(true);
    try {
      const msg = {
        id: `msg_${Date.now()}`,
        studio_id: studioId,
        thread_id: selectedThreadId,
        sender_type: 'artist',
        sender_name: artistName,
        content: newMessage.trim(),
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
          messagePreview: newMessage.trim(),
          threadId: selectedThreadId,
        });
      }
      setNewMessage('');
      inputRef.current?.focus();
    } catch {
      // Silently fail
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
    const prId = selectedThreadId.slice(3);
    setPaymentBusy(true);
    try {
      const { data: pr, error: prErr } = await supabase
        .from('inkflow_project_requests')
        .select('id, client_name, client_email, description')
        .eq('id', prId)
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
            <p className="text-xs text-zinc-500 dark:text-zinc-500">Ton acompte a bien été enregistré.</p>
          )}
        </div>
      );
    }
    return (
      <div
        className={`px-4 py-3 rounded-2xl shadow-sm ${
          isOutbound
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
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
          <p className="text-xs text-slate-400 dark:text-zinc-600">
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
                <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">Aucune conversation</p>
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
            <header className="flex flex-col gap-2 px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedThreadId(null)}
                  aria-label="Retour à la liste des conversations"
                  className="md:hidden shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                </button>

                <div className="w-10 h-10 shrink-0 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 font-bold shadow-sm">
                  {selectedThread.clientName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                    {selectedThread.clientName}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate">
                    {selectedThread.clientEmail || 'Client Inkflow'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {healthLine === 'loading' && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                        Santé…
                      </span>
                    )}
                    {healthLine === 'ok' && (
                      <span
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-2 py-1 text-[11px] font-medium text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-200"
                        title={healthDetail}
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        {healthDetail ?? 'Questionnaire de santé validé'}
                      </span>
                    )}
                    {healthLine === 'incomplete' && (
                      <span
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200/90 bg-amber-50/90 px-2 py-1 text-[11px] font-medium text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-100"
                        title={healthDetail}
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden />
                        {healthDetail ?? 'Questionnaire incomplet'}
                      </span>
                    )}
                    {healthLine === 'none' && (
                      <span className="inline-flex items-center rounded-lg border border-zinc-200/90 dark:border-zinc-700 bg-slate-50/80 dark:bg-zinc-800/80 px-2 py-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        Pas de questionnaire santé enregistré
                      </span>
                    )}
                    {selectedThreadId.startsWith('pr_') && onOpenLinkedProjectRequest && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenLinkedProjectRequest(
                            selectedThread.projectRequestId ?? selectedThreadId.slice(3)
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all min-h-[36px]"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        Voir le projet
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                      </button>
                    )}
                    {selectedThreadId.startsWith('bk_') && onOpenLinkedBookingRequest && (
                      <button
                        type="button"
                        onClick={() => onOpenLinkedBookingRequest(selectedThreadId)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all min-h-[36px]"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        Voir la demande vitrine
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Plus d’options"
                  className="shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-zinc-200/80 dark:border-zinc-700">
                    <MessageCircle className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">Démarrez la conversation</p>
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
                      className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] group ${
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
                    onClick={() => setNewMessage((prev) => (prev ? `${prev} ${template}` : template))}
                    className="text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-[0.98]"
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
                  className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-slate-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
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
                Choisis une conversation dans la liste pour voir les messages et répondre à tes clients.
              </p>
            </div>
          </main>
        )}
      </div>
      )}
    </div>

    <Modal
      isOpen={paymentModalOpen}
      onClose={() => {
        if (!paymentBusy) setPaymentModalOpen(false);
      }}
      title="Carte de paiement"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Montant de l&apos;acompte pour ce projet. Un message avec le lien Stripe sera ajouté au fil.
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
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98] transition-all"
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
