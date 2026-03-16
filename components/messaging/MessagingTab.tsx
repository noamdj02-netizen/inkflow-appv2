import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Instagram,
  MessageCircle,
  Send,
  ArrowLeft,
  Search,
  MoreVertical,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { getInstagramStatus } from '../../lib/instagram';
import { supabase } from '../../lib/supabase';
import { sendMessageNotificationToClient } from '../../lib/sendNotification';
import type { MessageThread, Message } from '../../types';

interface MessagingTabProps {
  studioId: string;
  messageThreads?: MessageThread[];
  initialThreadId?: string | null;
  onInitialThreadOpened?: () => void;
  artistName?: string;
  studioName?: string;
}

/** Onglet Messagerie : layout premium avec sidebar et zone de chat */
export const MessagingTab: React.FC<MessagingTabProps> = ({
  studioId,
  messageThreads = [],
  initialThreadId,
  onInitialThreadOpened,
  artistName = 'Artiste',
  studioName,
}) => {
  const [igConnected, setIgConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedThread = useMemo(
    () => messageThreads.find((t) => t.threadId === selectedThreadId),
    [messageThreads, selectedThreadId]
  );

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

  const quickReplies = [
    "Bonjour, l'acompte est de 30€. Souhaitez-vous réserver ?",
    'Votre RDV est confirmé pour le ',
    'Merci pour votre confiance ! À bientôt.',
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-slate-500 dark:text-zinc-500 text-sm">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  if (!igConnected && messageThreads.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/25">
            <Instagram className="w-10 h-10 text-white" />
          </div>
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Connecte ton Instagram
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
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
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden h-[calc(100dvh-140px)] min-h-[500px]">
      <div className="flex h-full">
        {/* Sidebar - Liste des conversations */}
        <aside
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200/80 dark:border-zinc-800 flex flex-col shrink-0 ${
            selectedThreadId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header Sidebar */}
          <div className="px-5 py-4 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Messages</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">
                    {messageThreads.length} conversation{messageThreads.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une conversation..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                </div>
                <p className="font-medium text-slate-700 dark:text-zinc-300 mb-1">Aucune conversation</p>
                <p className="text-sm text-slate-500 dark:text-zinc-500 max-w-[200px]">
                  Les conversations apparaîtront ici quand vous accepterez des demandes.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {filteredThreads.map((thread) => {
                  const isSelected = selectedThreadId === thread.threadId;
                  return (
                    <button
                      key={thread.threadId}
                      onClick={() => setSelectedThreadId(thread.threadId)}
                      className={`w-full flex items-center gap-3 p-4 transition-all text-left group ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-500/10 border-l-2 border-blue-500'
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50 border-l-2 border-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`relative w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 transition-transform group-hover:scale-105 ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-700 dark:to-zinc-800 text-slate-600 dark:text-zinc-300'
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
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            {thread.clientName}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-zinc-500 flex-shrink-0">
                            {formatTime(thread.lastMessageAt)}
                          </span>
                        </div>
                        <p
                          className={`text-sm truncate ${
                            thread.unreadCount > 0
                              ? 'text-slate-600 dark:text-zinc-300 font-medium'
                              : 'text-slate-500 dark:text-zinc-500'
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
            <div className="p-4 border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-500">
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
          <main className="flex-1 flex flex-col min-w-0">
            {/* Header Chat */}
            <header className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <button
                onClick={() => setSelectedThreadId(null)}
                className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
              </button>

              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                {selectedThread.clientName.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                  {selectedThread.clientName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-500 truncate flex items-center gap-1">
                  {selectedThread.clientEmail || 'Client Inkflow'}
                </p>
              </div>

              <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                <MoreVertical className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
              </button>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 dark:bg-zinc-950/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-200/80 dark:border-zinc-700">
                    <MessageCircle className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                  </div>
                  <p className="font-medium text-slate-700 dark:text-zinc-300 mb-1">Démarrez la conversation</p>
                  <p className="text-sm text-slate-500 dark:text-zinc-500">
                    Envoyez un message à {selectedThread.clientName}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOutbound = msg.senderType === 'artist';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] group ${
                          isOutbound ? 'order-1' : 'order-2'
                        }`}
                      >
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-sm ${
                            isOutbound
                              ? 'bg-blue-500 text-white rounded-br-md'
                              : 'bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 text-slate-900 dark:text-white rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <div
                          className={`flex items-center gap-1 mt-1 px-1 ${
                            isOutbound ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span className="text-xs text-slate-400 dark:text-zinc-500">
                            {formatTime(msg.createdAt)}
                          </span>
                          {isOutbound && (
                            <span className="text-slate-400 dark:text-zinc-500">
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
            <div className="px-5 py-3 border-t border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Réponses rapides
              </p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => setNewMessage((prev) => (prev ? `${prev} ${template}` : template))}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-[0.98]"
                  >
                    {template.slice(0, 35)}…
                  </button>
                ))}
              </div>
            </div>

            {/* Input Zone */}
            <div className="p-4 border-t border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <button className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400 hidden sm:flex">
                  <Paperclip className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Écrivez votre message..."
                    className="w-full px-4 py-3 pr-12 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-slate-400 dark:text-zinc-500 hidden sm:flex">
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
        ) : (
          /* Empty State - Desktop */
          <main className="hidden md:flex flex-1 items-center justify-center bg-slate-50/50 dark:bg-zinc-950/50">
            <div className="text-center">
              <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200/80 dark:border-zinc-700">
                <MessageCircle className="w-10 h-10 text-slate-400 dark:text-zinc-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Sélectionne une conversation
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-500 max-w-[280px]">
                Choisis une conversation dans la liste pour voir les messages et répondre à tes clients.
              </p>
            </div>
          </main>
        )}
      </div>
    </div>
  );
};
