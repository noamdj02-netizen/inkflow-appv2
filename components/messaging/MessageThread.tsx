import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, User, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendMessageNotificationToClient } from '../../lib/sendNotification';
import type { Message, MessageThread as ThreadType } from '../../types';

interface MessageThreadProps {
  studioId: string;
  threads: ThreadType[];
  onBack?: () => void;
  artistName: string;
  studioName?: string;
  /** Ouvrir directement ce fil (ex. après "Accepter & Discuter" sur une demande de projet). */
  initialThreadId?: string | null;
  /** Appelé quand le fil initial a été ouvert (pour que le parent réinitialise). */
  onInitialThreadOpened?: () => void;
}

export const MessageThreadView: React.FC<MessageThreadProps> = ({ studioId, threads, onBack, artistName, studioName, initialThreadId, onInitialThreadOpened }) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedThread = threads.find(t => t.threadId === selectedThreadId);

  useEffect(() => {
    if (initialThreadId && initialThreadId !== selectedThreadId) {
      setSelectedThreadId(initialThreadId);
      onInitialThreadOpened?.();
    }
  }, [initialThreadId]);

  useEffect(() => {
    if (!selectedThreadId) return;
    loadMessages(selectedThreadId);

    const channel = supabase
      .channel(`messages_${selectedThreadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'inkflow_messages',
        filter: `thread_id=eq.${selectedThreadId}`,
      }, () => loadMessages(selectedThreadId))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
      setMessages(data.map(row => ({
        id: row.id,
        studioId: row.studio_id,
        threadId: row.thread_id,
        senderType: row.sender_type,
        senderName: row.sender_name,
        content: row.content,
        read: row.read,
        createdAt: row.created_at,
      })));
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
    } catch (err) {
    } finally {
      setSending(false);
    }
  };

  if (!selectedThreadId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Messagerie</h2>
            <p className="text-[var(--text-secondary)] text-sm">Vos conversations avec les clients</p>
          </div>
        </div>

        {threads.length === 0 ? (
          <div className="dashboard-widget-card p-12 text-center">
            <MessageCircle className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4" />
            <p className="font-semibold mb-2 text-[var(--text-primary)]">Aucune conversation</p>
            <p className="text-[var(--text-secondary)] text-sm">Les conversations apparaitront ici quand vous accepterez des demandes de projet.</p>
          </div>
        ) : (
          <div className="card-bento dashboard-widget-card overflow-hidden divide-y divide-[var(--border)]">
            {threads.map(thread => (
              <button
                key={thread.threadId}
                onClick={() => setSelectedThreadId(thread.threadId)}
                className="row-clickable w-full text-left px-6 py-4 min-h-[64px] flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 font-bold text-lg">
                  {thread.clientName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate text-[var(--text-primary)]">{thread.clientName}</span>
                    <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">{new Date(thread.lastMessageAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] truncate mt-0.5">{thread.lastMessage}</p>
                </div>
                {thread.unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">{thread.unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card-bento flex flex-col h-[calc(100dvh-200px)] min-h-[400px] dashboard-widget-card overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--bg-secondary)]/50">
        <button onClick={() => setSelectedThreadId(null)} className="p-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
          {(selectedThread?.clientName || 'Client').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[var(--text-primary)] truncate">{selectedThread?.clientName || 'Client'}</div>
          <div className="text-xs text-[var(--text-secondary)] truncate">{selectedThread?.clientEmail || (selectedThreadId?.startsWith('pr_') ? 'Lien à envoyer au client pour discuter' : '')}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[var(--bg-primary)]/30">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderType === 'artist' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
              msg.senderType === 'artist'
                ? 'bg-blue-600 text-white rounded-br-md shadow-sm'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md'
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <span className={`text-xs mt-1 block ${msg.senderType === 'artist' ? 'text-white/70' : 'text-[var(--text-tertiary)]'}`}>
                {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-card)]">
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            'Bonjour, l\'acompte est de 30€. Souhaitez-vous réserver ?',
            'Votre RDV est confirmé pour le ',
            'Merci pour votre confiance ! À bientôt.',
          ].map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => setNewMessage((prev) => prev ? `${prev} ${template}` : template)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[36px]"
            >
              {template.slice(0, 30)}…
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Écrivez un message..."
            className="input-dash flex-1 px-4 py-3 min-h-[48px]"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="btn-primary min-h-[48px] px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
};
