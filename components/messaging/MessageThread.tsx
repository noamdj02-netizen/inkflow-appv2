import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, User, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Message, MessageThread as ThreadType } from '../../types';

interface MessageThreadProps {
  studioId: string;
  threads: ThreadType[];
  onBack?: () => void;
  artistName: string;
}

export const MessageThreadView: React.FC<MessageThreadProps> = ({ studioId, threads, onBack, artistName }) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedThread = threads.find(t => t.threadId === selectedThreadId);

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
    const msg = {
      id: `msg_${Date.now()}`,
      studio_id: studioId,
      thread_id: selectedThreadId,
      sender_type: 'artist',
      sender_name: artistName,
      content: newMessage.trim(),
      read: false,
    };
    await supabase.from('inkflow_messages').insert(msg);
    setNewMessage('');
    setSending(false);
  };

  if (!selectedThreadId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-neutral-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold">Messagerie</h2>
            <p className="text-neutral-600 text-sm">Vos conversations avec les clients</p>
          </div>
        </div>

        {threads.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-neutral-200 text-center">
            <MessageCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="font-semibold mb-2">Aucune conversation</p>
            <p className="text-neutral-600 text-sm">Les conversations apparaitront ici quand vous accepterez des demandes de projet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden divide-y divide-neutral-200">
            {threads.map(thread => (
              <button key={thread.threadId} onClick={() => setSelectedThreadId(thread.threadId)}
                className="w-full text-left px-6 py-4 hover:bg-neutral-50 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-neutral-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">{thread.clientName}</span>
                    <span className="text-xs text-neutral-500">{new Date(thread.lastMessageAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-sm text-neutral-600 truncate">{thread.lastMessage}</p>
                </div>
                {thread.unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-neutral-900 text-white text-xs font-bold rounded-full">{thread.unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200 flex items-center gap-3">
        <button onClick={() => setSelectedThreadId(null)} className="p-2 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
          <User className="w-4 h-4 text-neutral-600" />
        </div>
        <div>
          <div className="font-semibold">{selectedThread?.clientName}</div>
          <div className="text-xs text-neutral-500">{selectedThread?.clientEmail}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderType === 'artist' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
              msg.senderType === 'artist'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-900'
            }`}>
              <p className="text-sm">{msg.content}</p>
              <span className={`text-xs mt-1 block ${msg.senderType === 'artist' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-neutral-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ecrivez un message..."
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
