import React, { useState, useEffect, useRef } from 'react';
import { Send, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Logo } from '../../components/Logo';
import { sendMessageNotificationToStudio } from '../../lib/sendNotification';
import type { Message } from '../../types';

interface PublicMessagePageProps {
  threadId: string;
}

const ROBOTS_NOINDEX = 'noindex, nofollow';

export const PublicMessagePage: React.FC<PublicMessagePageProps> = ({ threadId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [clientName, setClientName] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const studioId = firstMsg?.studioId || '';

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

  if (!nameSet) {
    return (
      <div className="landing-scroll bg-neutral-50 flex items-center justify-center px-4">
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
    );
  }

  return (
    <div className="landing-scroll bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
        <Logo />
        <span className="font-semibold">Messagerie</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl mx-auto w-full">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderType === 'client' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
              msg.senderType === 'client' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200'
            }`}>
              <div className={`text-xs font-medium mb-1 ${msg.senderType === 'client' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {msg.senderName}
              </div>
              <p className="text-sm">{msg.content}</p>
              <span className={`text-xs mt-1 block ${msg.senderType === 'client' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
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
