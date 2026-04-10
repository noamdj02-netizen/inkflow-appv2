import React, { useState, useEffect, useRef } from 'react';
import { Send, CreditCard, ExternalLink, CheckCheck, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { resolvePublicMessageAutoProfile } from '../../lib/postLoginRedirect';
import { Logo } from '../../components/Logo';
import { sendMessageNotificationToStudio } from '../../lib/sendNotification';
import { tryParseStructuredMessage } from '../../lib/messageContent';
import { getCanonicalAppOrigin } from '../../lib/urls';
import { useToast } from '../../contexts/ToastContext';
import type { Message } from '../../types';

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

  return (
    <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 min-h-[65px]">
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [clientName, setClientName] = useState('');
  const [nameSet, setNameSet] = useState(false);
  /** Tant que la session n’est pas résolue, on n’affiche pas le formulaire « nom » (évite un flash pour les clients connectés). */
  const [authGateReady, setAuthGateReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [studioHeader, setStudioHeader] = useState<PublicMessageStudioHeader | null>(null);
  const [studioHeaderLoading, setStudioHeaderLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadHeader = async () => {
      setStudioHeaderLoading(true);
      const { data, error } = await supabase.rpc('get_public_message_studio_header', {
        p_thread_id: threadId,
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
  }, [threadId]);

  useEffect(() => {
    let cancelled = false;
    const applySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      const profile = await resolvePublicMessageAutoProfile(threadId, user);
      if (cancelled) return;
      if (profile.skipNameGate && profile.displayName.trim()) {
        setClientName(profile.displayName.trim());
        setNameSet(true);
      }
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
  }, [threadId]);

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

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel(`public_messages_${threadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'inkflow_messages',
        filter: `thread_id=eq.${threadId}`,
      }, () => loadMessages())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).rpc('get_public_thread_messages', { p_thread_id: threadId });
    if (data && Array.isArray(data)) {
      setMessages(data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        studioId: row.studio_id as string,
        threadId: row.thread_id as string,
        senderType: row.sender_type as string,
        senderName: row.sender_name as string,
        content: row.content as string,
        read: row.read as boolean,
        createdAt: row.created_at as string,
      })));
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !clientName.trim()) return;
    setSending(true);

    const firstMsg = messages[0];
    let studioId = firstMsg?.studioId || studioHeader?.id || '';
    if (!studioId) {
      const { data: headerRows } = await supabase.rpc('get_public_message_studio_header', {
        p_thread_id: threadId,
      });
      studioId = headerRows?.[0]?.id ?? '';
    }
    if (!studioId) {
      toast.error('Studio introuvable pour ce fil. Réessaie dans un instant.');
      setSending(false);
      return;
    }

    await supabase.from('inkflow_messages').insert({
      id: `msg_${Date.now()}`,
      studio_id: studioId,
      thread_id: threadId,
      sender_type: 'client',
      sender_name: clientName.trim(),
      content: newMessage.trim(),
      read: false,
    });

    if (studioId) {
      sendMessageNotificationToStudio({
        studioId,
        senderName: clientName.trim(),
        messagePreview: newMessage.trim(),
        threadId,
      });
    }

    setNewMessage('');
    setSending(false);
    loadMessages();
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

  if (!nameSet) {
    return (
      <div className="landing-scroll bg-neutral-50 flex flex-col min-h-screen">
        <PublicMessageHeaderBar loading={studioHeaderLoading} studio={studioHeader} />
        <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-lg border border-neutral-200 text-center">
          <Logo />
          <h2 className="text-xl font-bold mt-4 mb-2">Messagerie</h2>
          <p className="text-neutral-600 text-sm mb-6">Entrez votre nom pour commencer la conversation.</p>
          <input
            type="text"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="Votre nom"
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl mb-4"
            onKeyDown={e => e.key === 'Enter' && clientName.trim() && setNameSet(true)}
          />
          <button
            onClick={() => clientName.trim() && setNameSet(true)}
            disabled={!clientName.trim()}
            className="w-full py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-scroll bg-neutral-50 flex flex-col">
      <PublicMessageHeaderBar loading={studioHeaderLoading} studio={studioHeader} />

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl mx-auto w-full">
        {messages.map((msg) => {
          const structured = tryParseStructuredMessage(msg.content);
          const isClient = msg.senderType === 'client';
          return (
            <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] sm:max-w-[75%]">
                <div className={`text-xs font-medium mb-1 ${isClient ? 'text-neutral-400 text-right' : 'text-neutral-500'}`}>
                  {msg.senderName}
                </div>
                {structured?.kind === 'payment_card' ? (
                  <div className="rounded-2xl border border-neutral-200 border-l-4 border-l-amber-500 bg-white p-4 space-y-3 shadow-sm">
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
                  <div className="rounded-2xl border border-neutral-200 border-l-4 border-l-emerald-600 bg-white p-4 space-y-2 shadow-sm">
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
                ) : (
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      isClient ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
