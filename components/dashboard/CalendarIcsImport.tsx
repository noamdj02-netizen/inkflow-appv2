import React, { useCallback, useMemo, useState } from 'react';
import {
  Upload,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Apple,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import type { Appointment, Client } from '../../types';
import {
  parseIcsContent,
  filterEventsByImportWindow,
  clientLabelFromSummary,
  findClientByName,
  looksLikeDuplicate,
  buildAppointmentFromIcal,
  type ParsedIcalEvent,
} from '../../lib/icalImport';

export interface CalendarIcsImportProps {
  studioId: string | null;
  clients: Client[];
  appointments: Appointment[];
  addClient: (c: Omit<Client, 'id'>) => string;
  addAppointment: (a: Appointment) => void;
  useSupabase: boolean;
}

interface PreviewRow {
  ev: ParsedIcalEvent;
  clientLabel: string;
  matchedClient: Client | undefined;
  duplicate: boolean;
}

function buildPreviewRows(
  events: ParsedIcalEvent[],
  clients: Client[],
  appointments: Appointment[]
): PreviewRow[] {
  return events.map((ev) => {
    const clientLabel = clientLabelFromSummary(ev.summary);
    const matched = findClientByName(clients, clientLabel);
    const date = `${ev.start.getFullYear()}-${String(ev.start.getMonth() + 1).padStart(2, '0')}-${String(ev.start.getDate()).padStart(2, '0')}`;
    const time = `${String(ev.start.getHours()).padStart(2, '0')}:${String(ev.start.getMinutes()).padStart(2, '0')}`;
    const dup = looksLikeDuplicate(
      appointments.map((a) => ({
        date: a.date,
        time: a.time,
        clientName: a.clientName,
        service: a.service,
      })),
      date,
      time,
      ev.summary
    );
    return { ev, clientLabel, matchedClient: matched, duplicate: dup };
  });
}

export const CalendarIcsImport: React.FC<CalendarIcsImportProps> = ({
  studioId,
  clients,
  appointments,
  addClient,
  addAppointment,
  useSupabase,
}) => {
  const toast = useToast();
  const [rawParsed, setRawParsed] = useState<ParsedIcalEvent[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [includePast, setIncludePast] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const importable = useMemo(
    () => filterEventsByImportWindow(rawParsed, includePast),
    [rawParsed, includePast]
  );

  const excludedCount = useMemo(
    () => rawParsed.filter((e) => e.excluded).length,
    [rawParsed]
  );

  const previewRows = useMemo(
    () => buildPreviewRows(importable, clients, appointments),
    [importable, clients, appointments]
  );

  const importableRowCount = previewRows.filter((r) => !r.duplicate).length;

  const processFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.ics')) {
      toast.error('Choisissez un fichier .ics (iCalendar).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const parsed = parseIcsContent(text);
      setRawParsed(parsed);
      setFileName(file.name);
      if (parsed.length === 0) {
        toast.error('Aucun événement lisible dans ce fichier.');
      } else {
        toast.success(`${parsed.length} événement(s) détecté(s) dans le fichier.`);
      }
    };
    reader.onerror = () => toast.error('Lecture du fichier impossible.');
    reader.readAsText(file, 'UTF-8');
  }, [toast]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const runImport = async () => {
    if (!studioId || !useSupabase) {
      toast.error('Connectez un studio Supabase pour importer.');
      return;
    }
    const rows = previewRows.filter((r) => !r.duplicate);
    if (rows.length === 0) {
      toast.error('Rien à importer (doublons ou liste vide).');
      setConfirmOpen(false);
      return;
    }
    setImporting(true);
    let ok = 0;
    try {
      const createdClients = new Map<string, { id: string; email: string; name: string }>();
      for (let i = 0; i < rows.length; i++) {
        const { ev, clientLabel, matchedClient } = rows[i];
        let clientId = matchedClient?.id;
        let clientEmail = matchedClient?.email || '';
        let displayName = matchedClient?.name || clientLabel;

        if (!clientId) {
          const cacheKey = clientLabel.toLowerCase();
          const cached = createdClients.get(cacheKey);
          if (cached) {
            clientId = cached.id;
            clientEmail = cached.email;
            displayName = cached.name;
          } else {
            const today = new Date().toISOString().split('T')[0];
            const email = `import.${Date.now()}.${i}@cal-import.local`;
            const newId = addClient({
              name: clientLabel.slice(0, 200),
              email,
              phone: '',
              totalSpent: 0,
              appointmentsCount: 0,
              firstVisit: today,
              status: 'active',
              tags: ['Import calendrier'],
              tattoos: [],
            });
            const entry = { id: newId, email, name: clientLabel.slice(0, 200) };
            createdClients.set(cacheKey, entry);
            clientId = entry.id;
            clientEmail = entry.email;
            displayName = entry.name;
          }
        }

        const apt = buildAppointmentFromIcal(ev, clientId, displayName, clientEmail, `${i}_${Math.random().toString(36).slice(2, 9)}`);
        addAppointment(apt);
        ok += 1;
      }
      toast.success(`${ok} rendez-vous importé${ok > 1 ? 's' : ''} dans Inkflow.`);
      setRawParsed([]);
      setFileName(null);
      setConfirmOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Erreur pendant l'import.");
    } finally {
      setImporting(false);
    }
  };

  if (!useSupabase) {
    return (
      <p className="text-sm text-[var(--text-secondary)] rounded-xl border border-dashed border-[var(--border)] p-4">
        Configurez Supabase pour importer des fichiers .ics vers vos rendez-vous.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--border)] p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <CalendarDays className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="font-semibold text-[var(--text-primary)]">Importer mon calendrier (.ics)</h4>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Apple Calendrier, Google (export), Outlook — glissez un fichier <code className="text-[11px] bg-[var(--bg-card)] px-1 rounded">.ics</code> exporté depuis votre app.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setGuideOpen(!guideOpen)}
        className="w-full flex items-center justify-between gap-2 py-2.5 px-3 rounded-xl bg-[var(--bg-card-secondary)] border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors active:scale-[0.99]"
      >
        <span className="flex items-center gap-2">
          <Apple className="w-4 h-4 opacity-80" />
          Comment exporter mon calendrier Apple / Google ?
        </span>
        {guideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {guideOpen && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3 text-sm text-[var(--text-secondary)]">
          <p className="font-medium text-[var(--text-primary)]">Sur Mac (Calendrier)</p>
          <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
            <li>Ouvrez l&apos;app Calendrier.</li>
            <li>
              <strong className="text-[var(--text-primary)]">Fichier</strong> →{' '}
              <strong className="text-[var(--text-primary)]">Exporter</strong> → <strong className="text-[var(--text-primary)]">Exporter…</strong>
            </li>
            <li>Enregistrez le fichier <code className="text-[11px]">.ics</code>, puis glissez-le ci-dessous.</li>
          </ol>
          <p className="font-medium text-[var(--text-primary)] pt-2">Google Agenda</p>
          <ul className="list-disc list-inside space-y-1 text-xs leading-relaxed">
            <li>Paramètres du calendrier → <strong>Exporter</strong> (format .ics) ou imprimer / exporter une plage.</li>
            <li>Vous pouvez aussi utiliser la connexion Google OAuth ci-dessus pour une sync continue.</li>
          </ul>
          <p className="font-medium text-[var(--text-primary)] pt-2">iPhone</p>
          <p className="text-xs leading-relaxed">
            Export direct limité : synchronisez avec un Mac et exportez un .ics, ou partagez un calendrier vers un compte Google puis exportez depuis le web.
          </p>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          dragOver ? 'border-violet-500 bg-violet-500/5' : 'border-[var(--border)] bg-[var(--bg-card-secondary)]'
        }`}
      >
        <input
          type="file"
          accept=".ics,text/calendar"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) processFile(f);
            e.target.value = '';
          }}
        />
        <Upload className="w-8 h-8 mx-auto text-violet-500 mb-2" />
        <p className="text-sm font-medium text-[var(--text-primary)]">Glissez un fichier .ics ici</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">ou cliquez pour parcourir</p>
        {fileName && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 font-medium">
            Fichier : {fileName}
          </p>
        )}
      </div>

      {rawParsed.length > 0 && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={includePast}
              onChange={(e) => setIncludePast(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            Inclure les rendez-vous passés (déjà enregistrés dans le fichier)
          </label>

          {excludedCount > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {excludedCount} événement(s) ignoré(s) (annulés, journée entière, récurrents…).
            </p>
          )}

          <div className="rounded-xl border border-[var(--border)] overflow-hidden max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-[var(--bg-card-secondary)] text-[var(--text-secondary)] sticky top-0">
                <tr>
                  <th className="text-left p-2 font-semibold">Date</th>
                  <th className="text-left p-2 font-semibold">Titre → client</th>
                  <th className="text-left p-2 font-semibold">Durée</th>
                  <th className="text-left p-2 font-semibold">CRM</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr key={`${row.ev.uid}-${idx}`} className="border-t border-[var(--border)]">
                    <td className="p-2 text-[var(--text-primary)] whitespace-nowrap">
                      {row.ev.start.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-2 text-[var(--text-primary)] max-w-[200px] truncate" title={row.ev.summary}>
                      {row.clientLabel}
                    </td>
                    <td className="p-2 text-[var(--text-secondary)]">{row.ev.durationMinutes} min</td>
                    <td className="p-2">
                      {row.duplicate ? (
                        <span className="text-amber-600 dark:text-amber-400">Doublon ?</span>
                      ) : row.matchedClient ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Lié
                        </span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400">Nouveau client</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            disabled={!studioId || importableRowCount === 0 || importing}
            onClick={() => setConfirmOpen(true)}
            className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all active:scale-[0.98]"
          >
            {`Préparer l'import (${importableRowCount} RDV${
              previewRows.some((r) => r.duplicate)
                ? ` — ${previewRows.filter((r) => r.duplicate).length} doublon(s) exclus`
                : ''
            })`}
          </button>
        </div>
      )}

      <Modal
        isOpen={confirmOpen}
        onClose={() => !importing && setConfirmOpen(false)}
        title="Confirmer l’import"
        size="md"
      >
        <div className="space-y-4">

          <p className="text-sm text-[var(--text-secondary)]">
            Nous allons créer <strong className="text-[var(--text-primary)]">{previewRows.filter((r) => !r.duplicate).length}</strong>{' '}
            rendez-vous confirmés à partir des événements importés. Les titres deviennent le nom du client et la description
            les notes du projet.
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Les lignes marquées « Doublon » sont ignorées (même créneau déjà présent dans Inkflow).
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              disabled={importing}
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={importing}
              onClick={() => void runImport()}
              className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold inline-flex items-center gap-2"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Importer
            </button>
          </div>
        </div>
      </Modal>

      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
        <strong className="text-[var(--text-primary)]">Lecture seule (sync URL) :</strong> bientôt — un calque « calendrier
        personnel » depuis une URL iCloud pourrait s’afficher en surimpression sans importer.
      </p>
    </div>
  );
};
