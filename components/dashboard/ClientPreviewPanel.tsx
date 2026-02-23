import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Calendar, Euro, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Appointment, Client, MessageThread, Message } from '../../types';

export interface ClientPreviewData {
  /** Données du rendez-vous (clientName, clientEmail, etc.) */
  appointment: Appointment;
  /** Client CRM optionnel pour stats enrichies */
  client?: Client | null;
  /** Thread de messagerie optionnel */
  thread?: MessageThread | null;
}

interface ClientPreviewPanelProps {
  data: ClientPreviewData;
  studioId: string;
  artistName: string;
  /** Mode compact pour le drawer */
  compact?: boolean;
  /** Callback pour ouvrir la messagerie complète */
  onOpenMessaging?: () => void;
  /** Callback au clic sur la carte profil (ex: ouvrir le drawer) */
  onClientClick?: () => void;
}

export const ClientPreviewPanel: React.FC<ClientPreviewPanelProps> = ({
  data,
  studioId,
  artistName,
  compact = false,
  onOpenMessaging,
  onClientClick,
}) => {
  const { appointment, client, thread } = data;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!thread?.threadId) return;
    loadMessages(thread.threadId);

    const channel = supabase
      .channel(`messages_preview_${thread.threadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'inkflow_messages',
        filter: `thread_id=eq.${thread.threadId}`,
      }, () => loadMessages(thread.threadId))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [thread?.threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (threadId: string) => {
    const { data: rows } = await supabase
      .from('inkflow_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (rows) {
      setMessages(rows.map(r => ({
        id: r.id,
        studioId: r.studio_id,
        threadId: r.thread_id,
        senderType: r.sender_type,
        senderName: r.sender_name,
        content: r.content,
        read: r.read,
        createdAt: r.created_at,
      })));
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !thread?.threadId || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from('inkflow_messages').insert({
        studio_id: studioId,
        thread_id: thread.threadId,
        sender_type: 'artist',
        sender_name: artistName,
        content: newMessage.trim(),
        read: false,
      });
      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Erreur envoi message:', err);
    } finally {
      setSending(false);
    }
  };

  const pseudo = client?.name?.split(' ')[0] || appointment.clientName?.split(' ')[0] || 'Client';
  const avatarLetter = (appointment.clientName || '?').charAt(0).toUpperCase();

  return (
    <div className={`flex flex-col gap-4 ${compact ? 'min-w-0' : ''}`}>
      {/* Carte Profil Client */}
      <div
        role={onClientClick ? 'button' : undefined}
        tabIndex={onClientClick ? 0 : undefined}
        onClick={onClientClick}
        onKeyDown={onClientClick ? (e) => e.key === 'Enter' && onClientClick() : undefined}
        className={`rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm overflow-hidden ${onClientClick ? 'cursor-pointer hover:border-indigo-300 transition-colors' : ''}`}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-300 font-bold text-xl">
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-[var(--text-primary)] truncate">
                {appointment.clientName}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">@{pseudo.replace(/\s/g, '_').toLowerCase()}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-[var(--text-secondary)]">
                {appointment.clientEmail && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {appointment.clientEmail}
                  </span>
                )}
                {appointment.clientPhone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {appointment.clientPhone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-hover)]">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">RDV</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {client?.appointmentsCount ?? 1}+
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-hover)]">
              <Euro className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">Dépensé</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {client ? `${client.totalSpent}€` : `${appointment.price}€`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Messagerie */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-sm text-[var(--text-primary)]">Messagerie</span>
          </div>
          {onOpenMessaging && (
            <button
              onClick={onOpenMessaging}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Voir tout
            </button>
          )}
        </div>
        <div
          className={`flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--bg-primary)]/30 ${
            compact ? 'max-h-[280px]' : 'min-h-[200px] max-h-[320px]'
          }`}
        >
          {thread ? (
            messages.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-8">Aucun message</p>
            ) : (
              <>
                {messages.slice(-8).map(msg => (
                  <div className={`flex ${msg.senderType === 'artist' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                        msg.senderType === 'artist'
                          ? 'bg-indigo-600 text-white rounded-br-md'
                          : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                      <span className={`text-[10px] mt-0.5 block ${msg.senderType === 'artist' ? 'text-white/70' : 'text-[var(--text-tertiary)]'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageCircle className="w-10 h-10 text-[var(--text-tertiary)] mb-2" />
              <p className="text-sm text-[var(--text-tertiary)]">Aucune conversation</p>
              {onOpenMessaging && (
                <button
                  onClick={onOpenMessaging}
                  className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Ouvrir la messagerie
                </button>
              )}
            </div>
          )}
        </div>
        {thread && (
          <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-card)]">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Répondre..."
                className="input-dash flex-1 px-3 py-2.5 text-sm rounded-xl"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
