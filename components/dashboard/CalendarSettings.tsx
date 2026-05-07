import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar,
  RefreshCw,
  ExternalLink,
  Check,
  Link2,
  Unlink2,
  CloudOff,
  Download,
} from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  getCalendarStatus,
  initiateGoogleAuth,
  disconnectGoogle,
  pushAllAppointments,
  pullGoogleEvents,
  downloadICSAll,
  getGoogleCalendarAddUrl,
  type CalendarIntegrationStatus,
  type GoogleCalendarEvent,
} from '../../lib/googleCalendar';
import type { Appointment, Client } from '../../types';
import { CalendarIcsImport } from './CalendarIcsImport';

interface CalendarSettingsProps {
  studioId: string;
  appointments?: Appointment[];
  clients?: Client[];
  addClient?: (client: Omit<Client, 'id'>) => string;
  addAppointment?: (appointment: Appointment) => void;
  useSupabase?: boolean;
  onToast?: (msg: string, type: 'success' | 'error') => void;
}

export const CalendarSettings: React.FC<CalendarSettingsProps> = ({
  studioId,
  appointments = [],
  clients = [],
  addClient,
  addAppointment,
  useSupabase = true,
  onToast,
}) => {
  const [googleStatus, setGoogleStatus] = useState<CalendarIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [importedEvents, setImportedEvents] = useState<GoogleCalendarEvent[]>([]);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;

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
      onToastRef.current?.('Erreur de connexion à Google Agenda', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('connected') === 'google' || params.get('success') === 'google_connected') {
      loadStatus();
    }
  }, [loadStatus]);

  const handleConnectGoogle = async () => {
    try {
      const authUrl = await initiateGoogleAuth(studioId);
      window.location.href = authUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Impossible d'initier la connexion Google";
      onToast?.(
        msg.includes('non configuré')
          ? 'Google Calendar non configuré. Vérifiez les secrets Supabase (GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI).'
          : msg,
        'error'
      );
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      await disconnectGoogle(studioId);
      setGoogleStatus({ connected: false, integration: null });
      onToast?.('Google Agenda déconnecté', 'success');
    } catch {
      onToast?.('Erreur lors de la déconnexion', 'error');
    } finally {
      setDisconnecting(false);
      setShowDisconnectConfirm(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      const count = await pushAllAppointments(studioId);
      onToast?.(
        `${count} rendez-vous synchronisé${count > 1 ? 's' : ''} vers Google Agenda`,
        'success'
      );
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
      onToast?.(
        `${events.length} événement${events.length > 1 ? 's' : ''} trouvé${events.length > 1 ? 's' : ''} dans Google Agenda`,
        'success'
      );
    } catch {
      onToast?.("Erreur lors de l'import", 'error');
    } finally {
      setPulling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-500 dark:text-blue-400" />
        <span className="ml-3 text-sm text-[var(--text-secondary)]">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          Synchronisation des calendriers
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Connectez vos calendriers pour synchroniser vos rendez-vous automatiquement.
        </p>
      </div>

      {/* ── Google Calendar ───── */}
      <div className="rounded-2xl border-2 border-[var(--border)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-card)] shadow-sm border border-[var(--border)] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path d="M18.316 5.684L24 0H18.316V5.684Z" fill="#1A73E8" />
                <path d="M5.684 24L0 18.316V24H5.684Z" fill="#EA4335" />
                <path d="M18.316 24V18.316L24 24H18.316Z" fill="#34A853" />
                <path d="M0 5.684V0H5.684L0 5.684Z" fill="#C5221F" />
                <path d="M18.316 5.684V18.316H24V5.684H18.316Z" fill="#174EA6" />
                <path d="M5.684 5.684H0V18.316H5.684V5.684Z" fill="#E37400" />
                <path d="M5.684 5.684H18.316V18.316H5.684V5.684Z" fill="#fff" />
                <path d="M8.5 16.5V8.5H15.5V10H10V12H14.5V13.5H10V16.5H8.5Z" fill="#1A73E8" />
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" /> Connecté
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-card-secondary)] text-[var(--text-secondary)] text-xs font-medium">
              <CloudOff className="w-3.5 h-3.5" /> Non connecté
            </span>
          )}
        </div>

        {!googleStatus?.connected ? (
          <button
            onClick={handleConnectGoogle}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Connecter Google Agenda
          </button>
        ) : (
          <div className="space-y-3">
            {googleStatus.integration?.last_synced_at && (
              <p className="text-xs text-[var(--foreground-muted)]">
                Dernière sync :{' '}
                {new Date(googleStatus.integration.last_synced_at).toLocaleString('fr-FR')}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSyncAll}
                disabled={syncing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Synchronisation...' : 'Pousser vers Google'}
              </button>

              <button
                onClick={handlePull}
                disabled={pulling}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--bg-card-secondary)] text-[var(--text-primary)] font-medium text-sm hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${pulling ? 'animate-bounce' : ''}`} />
                {pulling ? 'Import...' : 'Importer de Google'}
              </button>
            </div>

            <button
              onClick={() => setShowDisconnectConfirm(true)}
              disabled={disconnecting}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border-2 border-[var(--border)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
            >
              <Unlink2 className="w-4 h-4" />
              {disconnecting ? 'Déconnexion...' : 'Déconnecter'}
            </button>
          </div>
        )}
      </div>

      {/* ── Import .ics (Apple / Google export) ───── */}
      {addClient && addAppointment && (
        <CalendarIcsImport
          studioId={studioId}
          clients={clients}
          appointments={appointments}
          addClient={addClient}
          addAppointment={addAppointment}
          useSupabase={useSupabase}
        />
      )}

      {/* ── Apple Calendar / Export .ics ───── */}
      <div className="rounded-2xl border-2 border-[var(--border)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-500 to-zinc-600 flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-[var(--text-primary)]">
                Exporter vers Apple / Outlook
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Export .ics — compatible Apple Calendrier, Outlook, Google (sans connexion)
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
            <Download className="w-3.5 h-3.5" /> Export .ics
          </span>
        </div>

        <p className="text-xs text-[var(--foreground-muted)]">
          Téléchargez un fichier .ics pour ouvrir vos rendez-vous Inkflow dans Apple Calendrier,
          Outlook ou tout calendrier standard.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              const toExport = appointments
                .filter((a) => ['pending', 'confirmed', 'in_progress'].includes(a.status))
                .map((a) => ({
                  id: a.id,
                  clientName: a.clientName,
                  service: a.service || 'Tattoo',
                  date: a.date,
                  time: a.time || '10:00',
                  duration: a.duration || 60,
                  location: a.location,
                  notes: a.notes,
                }));
              if (toExport.length === 0) {
                onToast?.('Aucun rendez-vous à exporter', 'error');
                return;
              }
              downloadICSAll(toExport);
              onToast?.(
                `${toExport.length} rendez-vous exporté${toExport.length > 1 ? 's' : ''}`,
                'success'
              );
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-50 text-blue-700 font-medium text-sm hover:bg-blue-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter tous les RDV (.ics)
          </button>
          <a
            href={
              appointments.length > 0
                ? getGoogleCalendarAddUrl({
                    clientName: appointments[0].clientName,
                    service: appointments[0].service || 'Tattoo',
                    date: appointments[0].date,
                    time: appointments[0].time || '10:00',
                    duration: appointments[0].duration || 60,
                    location: appointments[0].location,
                  })
                : 'https://calendar.google.com'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-[var(--border)] text-[var(--foreground)] font-medium text-sm hover:bg-[var(--bg-hover)] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {appointments.length > 0
              ? 'Ajouter un RDV à Google (sans OAuth)'
              : 'Ouvrir Google Calendar'}
          </a>
        </div>
      </div>

      {/* ── Imported events preview ───── */}
      {importedEvents.length > 0 && (
        <div className="rounded-2xl border-2 border-[var(--border)] p-6 space-y-3">
          <h4 className="font-medium text-[var(--foreground)] flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            Événements Google importés ({importedEvents.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {importedEvents.map((ev) => (
              <div
                key={ev.googleId}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]"
              >
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">
                    {ev.title || 'Sans titre'}
                  </div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    {ev.start
                      ? new Date(ev.start).toLocaleString('fr-FR', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : ''}
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

      <ConfirmModal
        isOpen={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        onConfirm={handleDisconnect}
        title="Déconnecter Google Agenda"
        message="Les événements déjà synchronisés resteront dans Google. Vous pourrez vous reconnecter à tout moment."
        confirmLabel="Déconnecter"
        cancelLabel="Annuler"
        variant="warning"
      />
    </div>
  );
};

export default CalendarSettings;
