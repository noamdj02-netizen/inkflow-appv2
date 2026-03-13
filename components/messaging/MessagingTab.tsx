import React, { useState, useEffect } from 'react';
import { Instagram, MessageCircle } from 'lucide-react';
import { getInstagramStatus } from '../../lib/instagram';
import { InstagramMessagingView } from './InstagramMessagingView';
import { MessageThreadView } from './MessageThread';
import type { MessageThread } from '../../types';

interface MessagingTabProps {
  studioId: string;
  messageThreads?: MessageThread[];
  initialThreadId?: string | null;
  onInitialThreadOpened?: () => void;
  artistName?: string;
  studioName?: string;
}

/** Onglet Messagerie : Instagram DM si connecté, sinon threads inkflow ou CTA */
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

  if (loading) {
    return (
      <div className="dashboard-widget-card p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-secondary)] text-sm">Chargement...</p>
      </div>
    );
  }

  if (!igConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 animate-fade-in">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl flex items-center justify-center">
          <Instagram className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Connecte ton Instagram</h2>
          <p className="text-[var(--text-secondary)] text-sm max-w-sm">
            Réponds à tes clients directement depuis Inkflow, sans quitter l&apos;app.
          </p>
        </div>
        <a
          href="/dashboard?section=messagerie"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/dashboard?section=messagerie';
          }}
          className="min-h-[48px] inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          Connecter Instagram →
        </a>
        <p className="text-xs text-[var(--text-tertiary)]">
          Paramètres → Messagerie pour configurer la connexion
        </p>
      </div>
    );
  }

  return <InstagramMessagingView studioId={studioId} />;
};
