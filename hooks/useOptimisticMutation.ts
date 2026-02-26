import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import type { useToast } from '../contexts/ToastContext';

type SetState<T> = Dispatch<SetStateAction<T[]>>;
type ToastHandle = ReturnType<typeof useToast>;

/**
 * Provides optimistic CRUD operations with automatic rollback on server error.
 *
 * Usage:
 *   const mutation = useOptimisticMutation(setAppointments, toast);
 *   mutation.add(newItem, (item) => saveToSupabase(item));
 *   mutation.update('id', (item) => ({ ...item, status: 'confirmed' }), (updated) => saveToSupabase(updated));
 *   mutation.remove('id', (id) => deleteFromSupabase(id));
 */
export function useOptimisticMutation<T extends { id: string }>(
  setState: SetState<T>,
  toast: ToastHandle
) {
  const inflightRef = useRef(0);

  const add = useCallback(
    (item: T, serverFn: (item: T) => Promise<unknown>) => {
      // Optimistic: add immediately
      setState(prev => [...prev, item]);
      inflightRef.current++;

      serverFn(item)
        .catch((err) => {
          // Rollback: remove the optimistically added item
          setState(prev => prev.filter(i => i.id !== item.id));
          toast.error('Erreur de sauvegarde — modification annulee');
        })
        .finally(() => { inflightRef.current--; });
    },
    [setState, toast]
  );

  const update = useCallback(
    (
      id: string,
      optimisticUpdate: (item: T) => T,
      serverFn: (updated: T) => Promise<unknown>
    ) => {
      let snapshot: T | undefined;
      let updated: T | undefined;

      setState(prev => {
        const next = prev.map(item => {
          if (item.id === id) {
            snapshot = item;
            updated = optimisticUpdate(item);
            return updated;
          }
          return item;
        });
        return next;
      });

      if (!updated) return;

      inflightRef.current++;
      const capturedSnapshot = snapshot!;
      const capturedUpdated = updated;

      serverFn(capturedUpdated)
        .catch((err) => {
          // Rollback: restore the snapshot
          setState(prev => prev.map(item => item.id === id ? capturedSnapshot : item));
          toast.error('Erreur de sauvegarde — modification annulee');
        })
        .finally(() => { inflightRef.current--; });
    },
    [setState, toast]
  );

  const remove = useCallback(
    (id: string, serverFn: (id: string) => Promise<unknown>) => {
      let snapshot: T | undefined;

      setState(prev => {
        snapshot = prev.find(i => i.id === id);
        return prev.filter(i => i.id !== id);
      });

      if (!snapshot) return;

      inflightRef.current++;
      const capturedSnapshot = snapshot;

      serverFn(id)
        .catch((err) => {
          // Rollback: re-add the removed item
          setState(prev => [...prev, capturedSnapshot]);
          toast.error('Erreur de suppression — element restaure');
        })
        .finally(() => { inflightRef.current--; });
    },
    [setState, toast]
  );

  return { add, update, remove, isInflight: () => inflightRef.current > 0 };
}
