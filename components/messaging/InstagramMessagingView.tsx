import React, { useState, useEffect, useRef } from 'react';
import { Instagram, Send, ArrowLeft, ExternalLink } from 'lucide-react';
import {
  getInstagramConversations,
  getInstagramMessages,
  sendInstagramMessage,
  type InstagramConversation,
  type InstagramMessage,
} from '../../lib/instagram';

interface InstagramMessagingViewProps {
  studioId: string;
}

function ParticipantAvatar(props: {
  name: string;
  photoUrl?: string | null;
  size: 'list' | 'header';
}) {
  const { name, photoUrl, size } = props;
  const initial = name?.[0]?.toUpperCase() || '?';
  const sizeClass = size === 'list' ? 'w-10 h-10 text-base' : 'w-9 h-9 text-sm';
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 border border-[var(--border)]`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold flex-shrink-0`}
    >
      {initial}
    </div>
  );
}

export const InstagramMessagingView: React.FC<InstagramMessagingViewProps> = ({ studioId }) => {
  const [conversations, setConversations] = useState<InstagramConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<InstagramConversation | null>(null);
  const [messages, setMessages] = useState<InstagramMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!studioId) return;
    setLoading(true);
    getInstagramConversations(studioId)
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [studioId]);

  useEffect(() => {
    if (!studioId || !selectedConv) return;
    getInstagramMessages(studioId, selectedConv.participantId)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [studioId, selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedConv || sending) return;
    const text = input;
    setInput('');
    setMessages((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        text,
        direction: 'outbound',
        timestamp: new Date().toISOString(),
      },
    ]);
    setSending(true);
    try {
      await sendInstagramMessage(studioId, selectedConv.participantId, text);
    } catch {
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp_')));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="card-bento flex flex-col h-[calc(100dvh-120px)] min-h-[400px] dashboard-widget-card overflow-hidden">
      <div className="flex h-full min-h-0">
        {/* Liste conversations */}
        <div
          className={`w-full md:w-80 border-r border-[var(--border)] flex flex-col shrink-0 ${
            selectedConv ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-5 py-4 border-b border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Instagram className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-[var(--text-primary)]">Messages Instagram</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-[var(--text-tertiary)] text-sm">
                Chargement...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-tertiary)] text-sm">
                Aucune conversation. Les messages apparaîtront quand un client t&apos;enverra un DM
                sur Instagram.
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-hover)] border-b border-[var(--border)] transition-colors text-left ${
                    selectedConv?.id === conv.id ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                  }`}
                >
                  <ParticipantAvatar
                    name={conv.participantName || conv.participantId}
                    photoUrl={conv.participantAvatar}
                    size="list"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate text-[var(--text-primary)]">
                        {conv.participantName || conv.participantId}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">
                        {formatTime(conv.lastAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {conv.lastMessage || '—'}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Zone de chat */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]/50">
              <button
                onClick={() => setSelectedConv(null)}
                className="md:hidden p-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <ParticipantAvatar
                name={selectedConv.participantName || selectedConv.participantId}
                photoUrl={selectedConv.participantAvatar}
                size="header"
              />
              <div className="flex-1 min-w-0">
                {selectedConv.participantProfileUrl ? (
                  <a
                    href={selectedConv.participantProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ouvrir le profil Instagram (${selectedConv.participantName || selectedConv.participantId})`}
                    className="inline-flex min-h-[44px] items-center gap-2 font-semibold text-sm text-[var(--text-primary)] hover:text-blue-600 dark:hover:text-blue-400 active:scale-[0.98] transition-all"
                  >
                    <span className="truncate">
                      {selectedConv.participantName || selectedConv.participantId}
                    </span>
                    <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-70" aria-hidden />
                  </a>
                ) : (
                  <p className="font-semibold text-sm truncate text-[var(--text-primary)] min-h-[44px] flex items-center">
                    {selectedConv.participantName || selectedConv.participantId}
                  </p>
                )}
                <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                  <Instagram className="w-3 h-3" aria-hidden /> Instagram Direct
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[var(--bg-primary)]/30">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                      msg.direction === 'outbound'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <span
                      className={`text-xs mt-1 block ${
                        msg.direction === 'outbound'
                          ? 'text-white/70'
                          : 'text-[var(--text-tertiary)]'
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-card)] shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Écrivez un message..."
                  className="input-dash flex-1 px-4 py-3"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="btn-primary px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-[var(--text-tertiary)] flex-col gap-2">
            <Instagram className="w-8 h-8" />
            <p className="text-sm">Sélectionne une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};
