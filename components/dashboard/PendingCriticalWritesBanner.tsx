import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  clearPendingCriticalWrite,
  dismissPendingCriticalWrite,
  listPendingCriticalWritesForScope,
  type PendingCriticalWriteRecord,
} from '../../lib/pendingCriticalWritesStorage';
import { saveAppointmentToSupabase, saveClientToSupabase } from '../../lib/supabaseDashboard';
import type { Appointment, Client } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export interface PendingCriticalWritesBannerProps {
  studioId: string | null;
  userEmail: string | null | undefined;
  /** Après succès : recharger les listes (ex. `retry` du sync). */
  onAfterRetrySuccess: () => void;
}

/**
 * Pilule flottante (style notification iOS) — écritures critiques en attente de synchro.
 */
export function PendingCriticalWritesBanner({
  studioId,
  userEmail,
  onAfterRetrySuccess,
}: PendingCriticalWritesBannerProps) {
  const toast = useToast();
  const [items, setItems] = useState<PendingCriticalWriteRecord[]>([]);
  const [busyQueueId, setBusyQueueId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!studioId || !userEmail?.trim()) {
      setItems([]);
      return;
    }
    setItems(listPendingCriticalWritesForScope(studioId, userEmail));
  }, [studioId, userEmail]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRetry = async (rec: PendingCriticalWriteRecord) => {
    if (!studioId || busyQueueId) return;
    setBusyQueueId(rec.queueId);
    try {
      if (rec.kind === 'appointment') {
        await saveAppointmentToSupabase(studioId, rec.payload as Appointment);
      } else {
        await saveClientToSupabase(studioId, rec.payload as Client);
      }
      clearPendingCriticalWrite(rec.kind, rec.entityId);
      toast.success('Données synchronisées avec InkFlow.');
      refresh();
      onAfterRetrySuccess();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Impossible de synchroniser — vérifie la connexion.'
      );
    } finally {
      setBusyQueueId(null);
    }
  };

  const handleDismiss = (rec: PendingCriticalWriteRecord) => {
    dismissPendingCriticalWrite(rec.queueId);
    refresh();
    toast.info(
      'Entrée retirée. Si la sauvegarde n’avait pas abouti côté serveur, cette fiche peut être absente du cloud.'
    );
  };

  if (!studioId || !userEmail?.trim() || items.length === 0) return null;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed left-1/2 top-[max(10px,env(safe-area-inset-top,0px))] z-[10001] w-[min(calc(100vw-1.25rem),28rem)] -translate-x-1/2 px-1"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
    >
      <motion.div
        className="overflow-hidden rounded-[1.35rem] border border-white/30 bg-white/72 shadow-lg shadow-black/10 backdrop-blur-xl dark:border-white/12 dark:bg-zinc-900/78 dark:shadow-black/40"
        animate={{
          boxShadow: [
            '0 8px 32px -8px rgba(245, 158, 11, 0.35)',
            '0 8px 40px -4px rgba(245, 158, 11, 0.5)',
            '0 8px 32px -8px rgba(245, 158, 11, 0.35)',
          ],
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-start gap-2.5 px-4 py-3 sm:px-4 sm:py-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
            <AlertTriangle className="size-4" strokeWidth={1.5} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-snug text-zinc-900 dark:text-white">
              Synchro interrompue
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {items.length === 1
                ? 'Une création n’a peut‑être pas été enregistrée sur le serveur.'
                : `${items.length} créations en attente — renvoie sans risque de doublon.`}
            </p>
            <ul className="mt-2 max-h-28 space-y-1.5 overflow-y-auto overscroll-contain">
              {items.map((rec) => {
                const label =
                  rec.kind === 'appointment'
                    ? `Rendez-vous ${rec.entityId.slice(0, 10)}…`
                    : `Client ${rec.entityId.slice(0, 10)}…`;
                const busy = busyQueueId === rec.queueId;
                return (
                  <li
                    key={rec.queueId}
                    className="flex flex-wrap items-center gap-1.5 rounded-xl bg-black/[0.04] px-2 py-1.5 dark:bg-white/[0.06]"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {label}
                    </span>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        className="h-8 gap-1 rounded-xl px-2.5 text-xs active:scale-95 motion-reduce:active:scale-100"
                        disabled={Boolean(busyQueueId)}
                        onClick={() => void handleRetry(rec)}
                      >
                        {busy ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                          <RotateCcw className="size-3.5" strokeWidth={1.5} aria-hidden />
                        )}
                        Renvoyer
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl px-2 active:scale-95 motion-reduce:active:scale-100"
                        disabled={busy}
                        onClick={() => handleDismiss(rec)}
                        aria-label="Ignorer cette entrée"
                      >
                        <X className="size-3.5" strokeWidth={1.5} aria-hidden />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
