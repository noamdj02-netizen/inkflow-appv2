import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send, CreditCard, ExternalLink, CheckCheck, Loader2, WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import {
  getPublicMessageSenderDisplayName,
  resolvePublicMessageAutoProfile,
} from '../../lib/postLoginRedirect';
import { Logo } from '../../components/Logo';
import { sendMessageNotificationToStudio } from '../../lib/sendNotification';
import { tryParseStructuredMessage } from '../../lib/messageContent';
import { ConsentFormMessageCard } from '../../components/messaging/ConsentFormMessageCard';
import { getCanonicalAppOrigin, getClientAccountHubPath } from '../../lib/urls';
import { useToast } from '../../contexts/ToastContext';
import type { Message } from '../../types';
import { normalizePublicMessageThreadId } from '../../lib/threadIds';

interface PublicMessageStudioHeader {
  id: string;
  name: string;
  studio_name: string;
  slug: string;
  avatar_url: string | null;
  portfolio_cover_url: string | null;
}

interface PublicMessagePageProps {
  threadId: string;
}

const ROBOTS_NOINDEX = 'noindex, nofollow';

const LOAD_RETRY_MAX = 3;
const LOAD_RETRY_BASE_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Erreurs souvent liées au réseau / timing — on retente avant d’afficher une erreur à l’écran. */
function isTransientLoadError(error: PostgrestError): boolean {
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  if (code === 'PGRST301') return true;
  if (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('failed to fetch') ||
    msg.includes('load failed')
  ) {
    return true;
  }
  return false;
}

function mapRpcRowsToMessages(data: unknown): Message[] {
  if (!data || !Array.isArray(data)) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    studioId: row.studio_id as string,
    threadId: row.thread_id as string,
    senderType: row.sender_type as Message['senderType'],
    senderName: row.sender_name as string,
    content: row.content as string,
    read: Boolean(row.read),
    createdAt: (row.created_at as string) ?? '',
  }));
}

function PublicMessageHeaderBar(props: {
  loading: boolean;
  studio: PublicMessageStudioHeader | null;
}): React.ReactElement {
  const { loading, studio } = props;
  const primaryName =
    studio?.studio_name?.trim() || studio?.name?.trim() || '';
  const secondaryName =
    studio?.studio_name?.trim() &&
    studio?.name?.trim() &&
    studio.studio_name.trim() !== studio.name.trim()
      ? studio.name.trim()
      : '';
  const vitrineHref = studio?.slug
    ? `${getCanonicalAppOrigin()}/studio/${encodeURIComponent(studio.slug)}`
    : null;
  const initialLetter = (studio?.name?.trim() || studio?.studio_name?.trim() || '?').slice(0, 1).toUpperCase();

  const handleBack = () => {
    if (typeof window === 'undefined') return;
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    if (vitrineHref) {
      window.location.assign(vitrineHref);
      return;
    }
    window.location.assign(getCanonicalAppOrigin() + '/');
  };

  return (
    <header className="bg-white border-b border-neutral-200 px-3 py-3 sm:px-4 flex items-center gap-2 sm:gap-3 min-h-[65px]">
      <button
        type="button"
        onClick={handleBack}
        className="shrink-0 inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-transparent text-neutral-700 hover:bg-neutral-100 hover:border-neutral-200 active:scale-[0.98] transition-all"
        aria-label="Retour"
      >
        <ArrowLeft className="w-5 h-5" aria-hidden />
      </button>
      {loading ? (
        <div className="h-11 w-11 rounded-xl bg-neutral-200 animate-pulse shrink-0" aria-hidden />
      ) : studio?.avatar_url ? (
        <img
          src={studio.avatar_url}
          alt=""
          width={44}
          height={44}
          loading="lazy"
          decoding="async"
          className="h-11 w-11 rounded-xl object-cover border border-neutral-200 shrink-0 bg-neutral-100"
        />
      ) : studio ? (
        <div
          className="h-11 w-11 rounded-xl border border-neutral-200 bg-neutral-100 flex items-center justify-center text-sm font-semibold text-neutral-600 shrink-0"
          aria-hidden
        >
          {initialLetter}
        </div>
      ) : (
        <Logo />
      )}
      <div className="min-w-0 flex-1">
        {loading ? (
          <>
            <div className="h-4 w-40 rounded bg-neutral-200 animate-pulse mb-2" />
            <div className="h-3 w-28 rounded bg-neutral-100 animate-pulse" />
          </>
        ) : studio ? (
          <>
            <p className="font-semibold text-neutral-900 truncate">{primaryName || 'Studio'}</p>
            {secondaryName ? (
              <p className="text-xs text-neutral-500 truncate">{secondaryName}</p>
            ) : (
              <p className="text-xs text-neutral-500 truncate">Messagerie</p>
            )}
          </>
        ) : (
          <>
            <p className="font-semibold text-neutral-900 truncate">Messagerie</p>
            <p className="text-xs text-neutral-500 truncate">Conversation</p>
          </>
        )}
      </div>
      {!loading && studio?.slug ? (
        <a
          href={getClientAccountHubPath({ studioSlug: studio.slug })}
          className="shrink-0 inline-flex items-center justify-center min-h-[40px] sm:min-h-[44px] px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold text-neutral-700 border border-neutral-200 hover:bg-neutral-50 active:scale-[0.98] transition-all"
        >
          Mon compte
        </a>
      ) : null}
      {!loading && vitrineHref ? (
        <a
          href={vitrineHref}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-neutral-200 text-neutral-800 hover:bg-neutral-50 active:scale-[0.98] transition-all"
          aria-label="Voir la vitrine du studio"
        >
          <ExternalLink className="w-5 h-5" />
        </a>
      ) : null}
    </header>
  );
}

export const PublicMessagePage: React.FC<PublicMessagePageProps> = ({ threadId }) => {
  const toast = useToast();
  const canonicalThreadId = useMemo(() => normalizePublicMessageThreadId(threadId), [threadId]);
  const threadIdRef = useRef(canonicalThreadId);
  threadIdRef.current = canonicalThreadId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [clientName, setClientName] = useState('');
  /** Tant que la session n’est pas résolue, on n’affiche pas le fil (évite un flash avant d’avoir le nom d’expéditeur). */
  const [authGateReady, setAuthGateReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [studioHeader, setStudioHeader] = useState<PublicMessageStudioHeader | null>(null);
  const [studioHeaderLoading, setStudioHeaderLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadHeader = async () => {
      setStudioHeaderLoading(true);
      const { data, error } = await supabase.rpc('get_public_message_studio_header', {
        p_thread_id: canonicalThreadId,
      });
      if (cancelled) return;
      if (!error && data?.[0]) {
        const row = data[0];
        setStudioHeader({
          id: row.id,
          name: row.name,
          studio_name: row.studio_name,
          slug: row.slug,
          avatar_url: row.avatar_url,
          portfolio_cover_url: row.portfolio_cover_url,
        });
      } else {
        setStudioHeader(null);
      }
      setStudioHeaderLoading(false);
    };
    void loadHeader();
    return () => {
      cancelled = true;
    };
  }, [canonicalThreadId]);

  useEffect(() => {
    let cancelled = false;
    const applySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      const profile = await resolvePublicMessageAutoProfile(canonicalThreadId, user);
      if (cancelled) return;
      const fromThread =
        profile.skipNameGate && profile.displayName.trim()
          ? profile.displayName.trim()
          : '';
      setClientName(fromThread || getPublicMessageSenderDisplayName(user));
      setAuthGateReady(true);
    };
    void applySession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void applySession();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [canonicalThreadId]);

  useEffect(() => {
    let meta: HTMLMetaElement | null = document.querySelector('meta[name="robots"][data-inkflow-message]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      meta.setAttribute('data-inkflow-message', '1');
      document.head.appendChild(meta);
    }
    meta.content = ROBOTS_NOINDEX;
    return () => {
      if (meta && meta.parentNode) meta.parentNode.removeChild(meta);
    };
  }, []);

  const loadMessages = useCallback(
    async (opts?: { background?: boolean }) => {
      const background = opts?.background ?? false;
      const targetThreadId = canonicalThreadId;

      if (!background) {
        setMessagesError(null);
      }

      const applyRows = (data: unknown) => {
        if (targetThreadId !== threadIdRef.current) return;
        setMessages(mapRpcRowsToMessages(data));
        if (!background) setMessagesLoading(false);
      };

      const failVisible = (err: PostgrestError) => {
        if (targetThreadId !== threadIdRef.current) return;
        console.error('[PublicMessagePage] get_public_thread_messages error:', err);
        setMessagesError('Connexion instable. Réessaie dans un instant.');
        if (!background) setMessagesLoading(false);
      };

      for (let attempt = 0; attempt < LOAD_RETRY_MAX; attempt++) {
        const { data, error } = await supabase.rpc('get_public_thread_messages', {
          p_thread_id: targetThreadId,
        });

        if (targetThreadId !== threadIdRef.current) return;

        if (!error) {
          applyRows(data);
          return;
        }

        const canRetry =
          isTransientLoadError(error) && attempt < LOAD_RETRY_MAX - 1;
        if (canRetry) {
          await sleep(LOAD_RETRY_BASE_MS * (attempt + 1));
          continue;
        }

        if (background) {
          await sleep(500);
          const second = await supabase.rpc('get_public_thread_messages', {
            p_thread_id: targetThreadId,
          });
          if (targetThreadId !== threadIdRef.current) return;
          if (!second.error) {
            applyRows(second.data);
            return;
          }
          return;
        }

        failVisible(error);
        return;
      }
    },
    [canonicalThreadId]
  );

  useEffect(() => {
    setMessages([]);
    setMessagesError(null);
    setMessagesLoading(true);
    void loadMessages({ background: false });

    const channel = supabase
      .channel(`public_messages_${canonicalThreadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inkflow_messages',
          filter: `thread_id=eq.${canonicalThreadId}`,
        },
        () => {
          void loadMessages({ background: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canonicalThreadId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !clientName.trim()) return;
    setSending(true);

    const firstMsg = messages[0];
    let studioId = firstMsg?.studioId || studioHeader?.id || '';
    if (!studioId) {
      const { data: headerRows } = await supabase.rpc('get_public_message_studio_header', {
        p_thread_id: canonicalThreadId,
      });
      studioId = headerRows?.[0]?.id ?? '';
    }
    if (!studioId) {
      toast.error('Studio introuvable pour ce fil. Réessaie dans un instant.');
      setSending(false);
      return;
    }

    const { error: insertError } = await supabase.from('inkflow_messages').insert({
      id: `msg_${Date.now()}`,
      studio_id: studioId,
      thread_id: canonicalThreadId,
      sender_type: 'client',
      sender_name: clientName.trim(),
      content: newMessage.trim(),
      read: false,
    });

    if (insertError) {
      console.error('[PublicMessagePage] message insert error:', insertError);
      toast.error("Impossible d'envoyer le message. Réessaie.");
      setSending(false);
      return;
    }

    if (studioId) {
      sendMessageNotificationToStudio({
        studioId,
        senderName: clientName.trim(),
        messagePreview: newMessage.trim(),
        threadId: canonicalThreadId,
      });
    }

    setNewMessage('');
    setSending(false);
    void loadMessages({ background: true });
  };

  if (!authGateReady) {
    return (
      <div className="landing-scroll bg-neutral-50 flex min-h-[50vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-neutral-600">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-900" aria-hidden />
          <p className="text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-scroll bg-neutral-50 flex flex-col">
      <PublicMessageHeaderBar loading={studioHeaderLoading} studio={studioHeader} />

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-3 max-w-2xl mx-auto w-full select-text">
        {/* Error state */}
        {messagesError && (
          <div className="flex flex-col items-center px-1 py-8 sm:py-10" role="alert" aria-live="polite">
            <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] sm:p-8">
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-800"
                aria-hidden
              >
                <WifiOff className="h-6 w-6 shrink-0" strokeWidth={2} />
              </div>
              <p className="text-sm font-semibold leading-snug text-neutral-900">{messagesError}</p>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                Vérifie ta connexion mobile ou Wi‑Fi, puis réessaie.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMessagesLoading(true);
                  void loadMessages({ background: false });
                }}
                className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-neutral-800 sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                Réessayer
              </button>
            </div>
          </div>
        )}
        {/* Loading state */}
        {messagesLoading && !messagesError && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        )}
        {/* Empty state */}
        {!messagesLoading && !messagesError && messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center select-none">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-2">
              <Send className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-700">Aucun message pour l'instant</p>
            <p className="text-xs text-neutral-400">Envoyez un message au studio pour démarrer la conversation.</p>
          </div>
        )}
        {messages.map((msg) => {
          const structured = tryParseStructuredMessage(msg.content);
          const isClient = msg.senderType === 'client';
          return (
            <div key={msg.id} className={`flex min-w-0 w-full ${isClient ? 'justify-end' : 'justify-start'}`}>
              <div className="min-w-0 max-w-[85%] sm:max-w-[75%]">
                <div className={`text-xs font-medium mb-1 ${isClient ? 'text-neutral-400 text-right' : 'text-neutral-500'}`}>
                  {msg.senderName}
                </div>
                {structured?.kind === 'payment_card' ? (
                  <div className="rounded-2xl border border-neutral-200  bg-white p-4 space-y-3  select-text">
                    <div className="flex items-center gap-2 text-neutral-900">
                      <CreditCard className="w-5 h-5 text-amber-600 shrink-0" />
                      <span className="text-sm font-semibold">
                        Acompte — {structured.amount} {structured.currency ?? 'EUR'}
                      </span>
                    </div>
                    <a
                      href={structured.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-neutral-900 text-white px-4 py-3 text-sm font-medium active:scale-[0.98] transition-all min-h-[44px]"
                    >
                      Payer maintenant
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : structured?.kind === 'payment_receipt' ? (
                  <div className="rounded-2xl border border-neutral-200  bg-white p-4 space-y-2 shadow-sm select-text">
                    <div className="flex items-center gap-2 text-neutral-900">
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
                        className="inline-flex items-center gap-1.5 text-sm text-neutral-900 font-medium underline min-h-[44px]"
                      >
                        Voir le reçu
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <p className="text-xs text-neutral-500">Ton acompte a bien été enregistré.</p>
                    )}
                  </div>
                ) : structured?.kind === 'consent_form_request' ? (
                  <ConsentFormMessageCard
                    consentFormId={structured.consentFormId}
                    title={structured.title}
                    mode="client_sign"
                  />
                ) : (
                  <div
                    className={`min-w-0 max-w-full overflow-hidden px-4 py-3 rounded-2xl select-text ${
                      isClient ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-w-full">
                      {msg.content}
                    </p>
                  </div>
                )}
                <span
                  className={`text-xs mt-1 block ${isClient ? 'text-neutral-400 text-right' : 'text-neutral-500'}`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-neutral-200 p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Écrivez un message..."
            className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-3 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
