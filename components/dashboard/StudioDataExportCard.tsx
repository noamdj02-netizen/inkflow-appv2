import React, { useCallback } from 'react';
import { Download, Database } from 'lucide-react';
import type { Appointment, Client } from '../../types';
import { buildAppointmentsCsvRows, buildClientsCsvRows, downloadTextFile } from '../../lib/studioDataExport';
import { useToast } from '../../contexts/ToastContext';

interface StudioDataExportCardProps {
  studioSlug: string | null;
  clients: Client[];
  appointments: Appointment[];
}

export const StudioDataExportCard: React.FC<StudioDataExportCardProps> = ({
  studioSlug,
  clients,
  appointments,
}) => {
  const toast = useToast();

  const exportClients = useCallback(() => {
    if (clients.length === 0) {
      toast.error('Aucun client à exporter');
      return;
    }
    const slug = (studioSlug || 'studio').replace(/[^a-z0-9-_]/gi, '_');
    const d = new Date().toISOString().slice(0, 10);
    downloadTextFile(`inkflow-clients-${slug}-${d}.csv`, buildClientsCsvRows(clients));
    toast.success('Export clients téléchargé');
  }, [clients, studioSlug, toast]);

  const exportAppointments = useCallback(() => {
    if (appointments.length === 0) {
      toast.error('Aucun rendez-vous à exporter');
      return;
    }
    const slug = (studioSlug || 'studio').replace(/[^a-z0-9-_]/gi, '_');
    const d = new Date().toISOString().slice(0, 10);
    downloadTextFile(`inkflow-rdv-${slug}-${d}.csv`, buildAppointmentsCsvRows(appointments));
    toast.success('Export rendez-vous téléchargé');
  }, [appointments, studioSlug, toast]);

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
          </p>
        </div>
      </div>
      <div className="p-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={exportClients}
          disabled={clients.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
        >
          <Download className="w-4 h-4" aria-hidden />
          Clients ({clients.length})
        </button>
        <button
          type="button"
          onClick={exportAppointments}
          disabled={appointments.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
        >
          <Download className="w-4 h-4" aria-hidden />
          Rendez-vous ({appointments.length})
        </button>
      </div>
    </div>
  );
};
