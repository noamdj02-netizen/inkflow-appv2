'use client';

import React, { useState, useEffect } from 'react';
import { Instagram, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { getInstagramStatus, getInstagramAuthUrl, disconnectInstagram } from '../../lib/instagram';

interface InstagramConnectProps {
  studioId: string;
}

export const InstagramConnect: React.FC<InstagramConnectProps> = ({ studioId }) => {
  const [connected, setConnected] = useState(false);
  const [igUsername, setIgUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studioId) return;
    getInstagramStatus(studioId)
      .then((data) => {
        if (data.connected) {
          setConnected(true);
          setIgUsername(data.username ?? null);
        }
      })
      .catch(() => {});
  }, [studioId]);

  const handleConnect = async () => {
    if (!studioId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const authUrl = await getInstagramAuthUrl(studioId);
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!studioId || loading) return;
    setLoading(true);
    setError(null);
    try {
      await disconnectInstagram(studioId);
      setConnected(false);
      setIgUsername(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de déconnexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] p-6 bg-[var(--bg-card)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center">
          <Instagram className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">Instagram Direct</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Réponds à tes clients directement depuis Inkflow
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 rounded-lg px-4 py-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">
              Connecté en tant que @{igUsername ?? 'instagram'}
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline disabled:opacity-50"
          >
            Déconnecter Instagram
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs">
              Ton compte Instagram doit être en mode <strong>Professionnel</strong>{' '}
              et lié à une Page Facebook.
            </p>
          </div>
          <details className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <summary className="px-4 py-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer list-none">
              Comment lier Instagram à ma Page ?
            </summary>
            <div className="px-4 pb-4 pt-1 text-xs text-[var(--text-secondary)] space-y-3 border-t border-[var(--border)]">
              <p><strong>Méthode 1 – Depuis Instagram</strong> (app) :</p>
              <ol className="list-decimal list-inside space-y-1 ml-1">
                <li>Va sur ton <strong>profil</strong> Instagram</li>
                <li><strong>Modifier le profil</strong> (ou « Edit profile »)</li>
                <li>Section <strong>« Infos professionnelles publiques »</strong> → touche <strong>« Page »</strong></li>
                <li>Se connecter à Facebook puis choisir ta Page (ou en créer une) → <strong>Connecter</strong></li>
              </ol>
              <p><strong>Méthode 2</strong> : Profil → ☰ → Paramètres → Compte → <strong>Partenaires autorisés</strong> → Page Facebook.</p>
              <p><strong>Depuis Facebook</strong> : ouvre ta <strong>Page</strong> → Paramètres de la Page → <strong>Instagram</strong> → Connecter un compte Instagram.</p>
              <p className="pt-1 text-amber-600 dark:text-amber-400">Compte obligatoirement en <strong>Professionnel</strong> (Créateur ou Entreprise). Une fois lié, reviens ici et réessaie.</p>
            </div>
          </details>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl px-4 py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Instagram className="w-4 h-4" />
            {loading ? 'Connexion...' : 'Connecter mon Instagram'}
          </button>
          <a
            href="https://help.instagram.com/502981923235522"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] justify-center"
          >
            Comment passer en compte professionnel ?
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};
