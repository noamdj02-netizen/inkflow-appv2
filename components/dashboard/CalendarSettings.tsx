import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, ExternalLink, Check, X, Link2, Unlink2, CloudOff, Download } from 'lucide-react';
import {
  getCalendarStatus,
  initiateGoogleAuth,
  disconnectGoogle,
  pushAllAppointments,
  pullGoogleEvents,
  type CalendarIntegrationStatus,
  type GoogleCalendarEvent,
} from '../../lib/googleCalendar';

interface CalendarSettingsProps {
  studioId: string;
  onToast?: (msg: string, type: 'success' | 'error') => void;
}

export const CalendarSettings: React.FC<CalendarSettingsProps> = ({ studioId, onToast }) => {
  const [googleStatus, setGoogleStatus] = useState<CalendarIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [importedEvents, setImportedEvents] = useState<GoogleCalendarEvent[]>([]);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await getCalendarStatus(studioId);
      setGoogleStatus(status);
    } catch {
      setGoogleStatus({ connected: false, integration: null });
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Refresh status when landing with success/error param (success is also handled in DashboardPro)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'oauth_failed') {
      onToast?.('Erreur de connexion à Google Agenda', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('connected') === 'google' || params.get('success') === 'google_connected') {
      loadStatus();
    }
  }, [onToast, loadStatus]);

  const handleConnectGoogle = async () => {
    try {
      const authUrl = await initiateGoogleAuth(studioId);
      window.location.href = authUrl;
    } catch {
      onToast?.('Impossible d\'initier la connexion Google', 'error');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Déconnecter Google Agenda ? Les événements déjà synchronisés resteront dans Google.')) return;
    try {
      setDisconnecting(true);
      await disconnectGoogle(studioId);
      setGoogleStatus({ connected: false, integration: null });
      onToast?.('Google Agenda déconnecté', 'success');
    } catch {
      onToast?.('Erreur lors de la déconnexion', 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      const count = await pushAllAppointments(studioId);
      onToast?.(`${count} rendez-vous synchronisé${count > 1 ? 's' : ''} vers Google Agenda`, 'success');
      loadStatus();
    } catch {
      onToast?.('Erreur de synchronisation', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handlePull = async () => {
    try {
      setPulling(true);
      const events = await pullGoogleEvents(studioId);
      setImportedEvents(events);
      onToast?.(`${events.length} événement${events.length > 1 ? 's' : ''} trouvé${events.length > 1 ? 's' : ''} dans Google Agenda`, 'success');
    } catch {
      onToast?.('Erreur lors de l\'import', 'error');
    } finally {
      setPulling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
        <span className="ml-3 text-sm text-[var(--foreground-muted)]">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          Synchronisation des calendriers
        </h3>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          Connectez vos calendriers pour synchroniser vos rendez-vous automatiquement.
        </p>
      </div>

      {/* ── Google Calendar ───── */}
      <div className="rounded-2xl border-2 border-[var(--border)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-200 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path d="M18.316 5.684L24 0H18.316V5.684Z" fill="#1A73E8"/>
                <path d="M5.684 24L0 18.316V24H5.684Z" fill="#EA4335"/>
                <path d="M18.316 24V18.316L24 24H18.316Z" fill="#34A853"/>
                <path d="M0 5.684V0H5.684L0 5.684Z" fill="#C5221F"/>
                <path d="M18.316 5.684V18.316H24V5.684H18.316Z" fill="#174EA6"/>
                <path d="M5.684 5.684H0V18.316H5.684V5.684Z" fill="#E37400"/>
                <path d="M5.684 5.684H18.316V18.316H5.684V5.684Z" fill="#fff"/>
                <path d="M8.5 16.5V8.5H15.5V10H10V12H14.5V13.5H10V16.5H8.5Z" fill="#1A73E8"/>
              </svg>
            </div>
            <div>
              <div className="font-medium text-[var(--foreground)]">Google Agenda</div>
              <div className="text-xs text-[var(--foreground-muted)]">
                Sync bidirectionnelle avec Google Calendar
              </div>
            </div>
          </div>

          {googleStatus?.connected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" /> Connecté
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
              <CloudOff className="w-3.5 h-3.5" /> Non connecté
            </span>
          )}
        </div>

        {!googleStatus?.connected ? (
          <button
            onClick={handleConnectGoogle}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Connecter Google Agenda
          </button>
        ) : (
          <div className="space-y-3">
            {googleStatus.integration?.last_synced_at && (
              <p className="text-xs text-[var(--foreground-muted)]">
                Dernière sync : {new Date(googleStatus.integration.last_synced_at).toLocaleString('fr-FR')}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSyncAll}
                disabled={syncing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-50 text-indigo-700 font-medium text-sm hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Synchronisation...' : 'Pousser vers Google'}
              </button>

              <button
                onClick={handlePull}
                disabled={pulling}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-violet-50 text-violet-700 font-medium text-sm hover:bg-violet-100 transition-colors disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${pulling ? 'animate-bounce' : ''}`} />
                {pulling ? 'Import...' : 'Importer de Google'}
              </button>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border-2 border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Unlink2 className="w-4 h-4" />
              {disconnecting ? 'Déconnexion...' : 'Déconnecter'}
            </button>
          </div>
        )}
      </div>

      {/* ── Apple Calendar (iCal export) ───── */}
      <div className="rounded-2xl border-2 border-[var(--border)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-[var(--foreground)]">Apple Calendrier</div>
              <div className="text-xs text-[var(--foreground-muted)]">
                Export via fichier .ics (compatible Apple, Outlook, etc.)
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
            <Download className="w-3.5 h-3.5" /> Export .ics
          </span>
        </div>

        <p className="text-xs text-[var(--foreground-muted)]">
          Chaque rendez-vous peut être exporté en fichier .ics, compatible avec Apple Calendrier,
          Outlook, et tout calendrier standard. Utilisez le bouton de calendrier sur chaque rendez-vous.
        </p>
      </div>

      {/* ── Imported events preview ───── */}
      {importedEvents.length > 0 && (
        <div className="rounded-2xl border-2 border-[var(--border)] p-6 space-y-3">
          <h4 className="font-medium text-[var(--foreground)] flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-violet-500" />
            Événements Google importés ({importedEvents.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {importedEvents.map((ev) => (
              <div key={ev.googleId} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{ev.title || 'Sans titre'}</div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    {ev.start ? new Date(ev.start).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                  </div>
                </div>
                {ev.location && (
                  <span className="text-xs text-[var(--foreground-muted)]">{ev.location}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Setup instructions ───── */}
      {!googleStatus?.connected && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-6 space-y-3">
          <h4 className="font-medium text-[var(--foreground)] text-sm">Configuration requise</h4>
          <div className="text-xs text-[var(--foreground-muted)] space-y-2">
            <p>Pour activer Google Agenda, l'administrateur doit configurer :</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Créer un projet sur <a href="https://console.cloud.google.com" target="_blank" rel="noopener" className="text-indigo-600 underline">Google Cloud Console</a></li>
              <li>Activer l'API Google Calendar</li>
              <li>Créer des identifiants OAuth 2.0</li>
              <li>Ajouter les secrets (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) dans les Edge Functions Supabase</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarSettings;
