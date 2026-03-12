/**
 * Vue messagerie factice pour le bac à sable (/demo).
 * Simulation "Répondre avec l'IA" : typing animé + réponses factices par thread.
 * Mode externe : aiReplies, aiStreaming, aiTyping, onAiReply gérés par le parent.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Instagram, ArrowLeft } from 'lucide-react';
import type { MessageThread } from '../../types';
import { getDemoAIReplies } from '../../lib/demoSandboxData';

interface DemoMessagingViewProps {
  threads: MessageThread[];
  /** Mode externe : réponses IA par thread (parent gère le streaming). */
  aiReplies?: Record<string, string>;
  aiStreaming?: Record<string, string>;
  aiTyping?: Record<string, boolean>;
  onAiReply?: (threadId: string) => void;
}

const TYPING_INTERVAL_MS = 15;
const AI_DELAY_MS = 1200;

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

const AI_REPLIES = getDemoAIReplies();

export const DemoMessagingView: React.FC<DemoMessagingViewProps> = ({
  threads,
  aiReplies: aiRepliesProp,
  aiStreaming = {},
  aiTyping = {},
  onAiReply,
}) => {
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [internalTyping, setInternalTyping] = useState(false);
  const [internalReplyFull, setInternalReplyFull] = useState('');
  const [internalReplyRevealed, setInternalReplyRevealed] = useState(0);
  const inputValueRef = useRef('');
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isExternal = onAiReply != null && aiRepliesProp != null;
  const aiReplies = aiRepliesProp ?? AI_REPLIES;
  const typing = isExternal && selectedThread ? (aiTyping[selectedThread.threadId] ?? false) : internalTyping;
  const replyFull = isExternal && selectedThread ? (aiReplies[selectedThread.threadId] ?? '') : internalReplyFull;
  const replyRevealedText = isExternal && selectedThread ? (aiStreaming[selectedThread.threadId] ?? '') : internalReplyFull.slice(0, internalReplyRevealed);
  const isComplete = isExternal ? (selectedThread && (aiStreaming[selectedThread.threadId] ?? '').length >= (aiReplies[selectedThread.threadId] ?? '').length) : internalReplyRevealed >= internalReplyFull.length;

  useEffect(() => {
    if (!isExternal) {
      setInternalReplyFull('');
      setInternalReplyRevealed(0);
      setInternalTyping(false);
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    }
  }, [selectedThread?.threadId, isExternal]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  const handleReplyWithAI = () => {
    if (!selectedThread) return;
    if (isExternal) {
      onAiReply?.(selectedThread.threadId);
      return;
    }
    const fullReply = aiReplies[selectedThread.threadId];
    if (!fullReply) return;

    setInternalTyping(true);
    setInternalReplyRevealed(0);
    setInternalReplyFull(fullReply);

    setTimeout(() => {
      setInternalTyping(false);
      let len = 0;
      typingIntervalRef.current = setInterval(() => {
        len += 1;
        setInternalReplyRevealed(len);
        if (len >= fullReply.length && typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      }, TYPING_INTERVAL_MS);
    }, AI_DELAY_MS);
  };

  return (
    <div
      className="card-bento flex flex-col h-[calc(100dvh-8rem)] min-h-[320px] sm:min-h-[400px] max-h-[calc(100dvh-5rem)] dashboard-widget-card overflow-hidden demo-messaging-container"
      data-joyride="messaging"
    >
      <div className="flex h-full min-h-0">
        {/* Liste des conversations — sidebar 280px desktop */}
        <div
          className={`w-full md:w-[280px] border-r border-[var(--border)] flex flex-col shrink-0 ${
            selectedThread ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-5 py-4 border-b border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Instagram className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-[var(--text-primary)]">Messages Instagram</h2>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Demandes qualifiées par l&apos;IA
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.map((thread) => (
              <button
                key={thread.threadId}
                type="button"
                onClick={() => setSelectedThread(thread)}
                className={`w-full flex items-center gap-3 p-4 min-h-[64px] hover:bg-[var(--bg-hover)] border-b border-[var(--border)] transition-colors text-left touch-manipulation ${
                  selectedThread?.threadId === thread.threadId ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                }`}
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                  {thread.avatar ? (
                    <img src={thread.avatar} alt="" className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover" />
                  ) : (
                    <span>{thread.clientName?.[0]?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate text-[var(--text-primary)]">
                      {thread.clientName}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">
                      {formatTime(thread.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{thread.lastMessage}</p>
                </div>
                {thread.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {thread.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedThread ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header conversation : avatar, nom, badge Instagram, En ligne */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]/50">
              <button
                type="button"
                onClick={() => setSelectedThread(null)}
                className="md:hidden p-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Retour à la liste"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                {selectedThread.avatar ? (
                  <img src={selectedThread.avatar} alt="" className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover" />
                ) : (
                  <span>{selectedThread.clientName?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-[var(--text-primary)]">
                  {selectedThread.clientName}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5">
                  <Instagram className="w-3 h-3" /> Instagram
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
                    En ligne
                  </span>
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[var(--bg-primary)]/30">
              <div className="flex justify-start">
                <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]">
                  <p className="leading-relaxed text-sm">{selectedThread.lastMessage}</p>
                  <span className="text-xs mt-1 block text-[var(--text-tertiary)]">
                    {formatTime(selectedThread.lastMessageAt)}
                  </span>
                </div>
              </div>

              {typing && (
                <div className="flex justify-end">
                  <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-md bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-[var(--text-primary)]">
                    <span className="text-sm">IA en train de rédiger</span>
                    <span className="inline-flex gap-0.5 ml-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}

              {replyRevealedText && (
                <div className="flex justify-end">
                  <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-md bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-[var(--text-primary)]">
                    <p className="leading-relaxed text-sm whitespace-pre-wrap">
                      {replyRevealedText}
                    </p>
                    {isComplete && (
                      <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-2 block">
                        Rédigé par IA ✦
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Champ saisie + Répondre avec l'IA — responsive: stack sur très petit écran */}
            <div className="p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)] shrink-0 pb-[env(safe-area-inset-bottom)] sm:pb-4">
              <div className="flex flex-row gap-2 min-w-0">
                <input
                  type="text"
                  placeholder="Écrire un message..."
                  className="flex-1 min-w-0 px-4 py-3 sm:py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-base sm:text-sm placeholder:text-[var(--text-tertiary)] min-h-[44px]"
                  aria-label="Message"
                  onChange={(e) => { inputValueRef.current = e.target.value; }}
                />
                <button
                  type="button"
                  onClick={handleReplyWithAI}
                  disabled={typing}
                  className="px-3 sm:px-4 py-3 sm:py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity min-h-[48px] min-w-[44px] touch-manipulation shrink-0 whitespace-nowrap"
                >
                  Répondre avec l&apos;IA
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-[var(--text-tertiary)] flex-col gap-2">
            <Instagram className="w-8 h-8" />
            <p className="text-sm">Sélectionnez une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};
