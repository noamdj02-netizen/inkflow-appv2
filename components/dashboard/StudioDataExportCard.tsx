import React, { useCallback, useState } from 'react';
import { Download, Database, Loader2 } from 'lucide-react';
import type { Appointment, Client } from '../../types';
import { buildAppointmentsCsvRows, buildClientsCsvRows, downloadTextFile } from '../../lib/studioDataExport';
import { useToast } from '../../contexts/ToastContext';
import { getAppointmentsFromSupabase, getClientsFromSupabase } from '../../lib/supabaseDashboard';

interface StudioDataExportCardProps {
  studioId: string;
  studioSlug: string | null;
  /** Affichage indicatif (état chargé dans le dashboard) — l’export recharge depuis le serveur */
  clients: Client[];
  appointments: Appointment[];
}

export const StudioDataExportCard: React.FC<StudioDataExportCardProps> = ({
  studioId,
  studioSlug,
  clients,
  appointments,
}) => {
  const toast = useToast();
  const [busy, setBusy] = useState<'clients' | 'appointments' | null>(null);

  const exportClients = useCallback(async () => {
    setBusy('clients');
    try {
      const rows = await getClientsFromSupabase(studioId);
      if (rows.length === 0) {
        toast.error('Aucun client à exporter');
        return;
      }
      const slug = (studioSlug || 'studio').replace(/[^a-z0-9-_]/gi, '_');
      const d = new Date().toISOString().slice(0, 10);
      downloadTextFile(`inkflow-clients-${slug}-${d}.csv`, buildClientsCsvRows(rows));
      toast.success('Export clients téléchargé');
    } catch (e) {
      console.error(e);
      toast.error('Impossible de charger les clients pour l’export');
    } finally {
      setBusy(null);
    }
  }, [studioId, studioSlug, toast]);

  const exportAppointments = useCallback(async () => {
    setBusy('appointments');
    try {
      const rows = await getAppointmentsFromSupabase(studioId);
      if (rows.length === 0) {
        toast.error('Aucun rendez-vous à exporter');
        return;
      }
      const slug = (studioSlug || 'studio').replace(/[^a-z0-9-_]/gi, '_');
      const d = new Date().toISOString().slice(0, 10);
      downloadTextFile(`inkflow-rdv-${slug}-${d}.csv`, buildAppointmentsCsvRows(rows));
      toast.success('Export rendez-vous téléchargé');
    } catch (e) {
      console.error(e);
      toast.error('Impossible de charger les rendez-vous pour l’export');
    } finally {
      setBusy(null);
    }
  }, [studioId, studioSlug, toast]);

  const isBusy = busy !== null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700">
          <Database className="w-5 h-5 text-zinc-700 dark:text-zinc-300" aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Export de vos données</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Fichiers CSV (UTF-8) pour sauvegarde ou traitement comptable externe. Les fichiers restent sur votre appareil.
            Au clic, les données sont rechargées depuis le serveur avant l’export.
          </p>
        </div>
      </div>
      <div className="p-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={exportClients}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
        >
          {busy === 'clients' ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Download className="w-4 h-4" aria-hidden />
          )}
          Clients ({clients.length})
        </button>
        <button
          type="button"
          onClick={exportAppointments}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
        >
          {busy === 'appointments' ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Download className="w-4 h-4" aria-hidden />
          )}
          Rendez-vous ({appointments.length})
        </button>
      </div>
    </div>
  );
};
