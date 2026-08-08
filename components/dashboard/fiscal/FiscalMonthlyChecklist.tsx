import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckSquare, Loader2, Square } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import {
  fetchFiscalChecklistForMonth,
  setFiscalChecklistItem,
} from '../../../lib/supabaseFinanceInventory';
import { FISCAL_MONTHLY_CHECKLIST_ITEMS, currentMonthKey } from './fiscalChecklistItems';

interface FiscalMonthlyChecklistProps {
  studioId: string | null;
  useSupabase: boolean;
  /** Nombre de cases non cochées pour Pilotage (« Prochaines actions »). */
  onPendingCountChange?: (pendingCount: number | null) => void;
}

export const FiscalMonthlyChecklist: React.FC<FiscalMonthlyChecklistProps> = ({
  studioId,
  useSupabase,
  onPendingCountChange,
}) => {
  const toast = useToast();
  const monthKey = useMemo(() => currentMonthKey(), []);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!studioId || !useSupabase) {
      setLoaded(true);
      return;
    }
    try {
      const rows = await fetchFiscalChecklistForMonth(studioId, monthKey);
      setCheckedKeys(new Set(rows.filter((r) => r.checked).map((r) => r.item_key)));
    } catch {
      toast.error('Checklist fiscal : chargement impossible');
    } finally {
      setLoaded(true);
    }
  }, [studioId, useSupabase, monthKey, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!onPendingCountChange) return;
    if (!studioId || !useSupabase) {
      onPendingCountChange(null);
      return;
    }
    if (!loaded) return;
    const pending = FISCAL_MONTHLY_CHECKLIST_ITEMS.filter(
      (item) => !checkedKeys.has(item.key)
    ).length;
    onPendingCountChange(pending);
  }, [onPendingCountChange, studioId, useSupabase, loaded, checkedKeys]);

  const toggle = useCallback(
    async (key: string) => {
      if (!studioId || !useSupabase) {
        toast.error('Synchronise Supabase pour enregistrer la checklist');
        return;
      }
      const next = !checkedKeys.has(key);
      setBusy(key);
      try {
        await setFiscalChecklistItem(studioId, monthKey, key, next);
        setCheckedKeys((prev) => {
          const n = new Set(prev);
          if (next) n.add(key);
          else n.delete(key);
          return n;
        });
      } catch {
        toast.error('Enregistrement impossible');
      } finally {
        setBusy(null);
      }
    },
    [studioId, useSupabase, checkedKeys, monthKey, toast]
  );

  return (
    <div
      id="pilotage-checklist-mois"
      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 border-l-4 border-l-teal-500 scroll-mt-24"
    >
      <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
        Checklist fiscale & admin — ce mois-ci
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        URSSAF, plafond, relevé, assurance… (liste distincte des « bonnes pratiques atelier » plus
        bas). Période {monthKey} — données stockées pour ton studio. Ce n’est pas une preuve auprès
        de l’administration.
      </p>
      {!useSupabase || !studioId ? (
        <p className="text-sm text-zinc-500">Connecte Supabase pour une checklist sauvegardée.</p>
      ) : !loaded ? (
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      ) : (
        <ul className="space-y-2">
          {FISCAL_MONTHLY_CHECKLIST_ITEMS.map((item) => {
            const ok = checkedKeys.has(item.key);
            const pending = busy === item.key;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => void toggle(item.key)}
                  disabled={pending}
                  className="flex w-full items-start gap-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/30 px-3 py-3 min-h-[44px] text-left hover:bg-zinc-100/70 dark:hover:bg-zinc-900/50 active:scale-[0.99] transition-all disabled:opacity-60"
                >
                  {pending ? (
                    <Loader2 className="w-5 h-5 animate-spin shrink-0 text-teal-600" />
                  ) : ok ? (
                    <CheckSquare className="w-5 h-5 shrink-0 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <Square className="w-5 h-5 shrink-0 text-zinc-400" />
                  )}
                  <span
                    className={`text-sm ${ok ? 'text-zinc-500 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
