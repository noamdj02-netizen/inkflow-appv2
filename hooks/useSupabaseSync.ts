import { useContext } from 'react';
import { SupabaseSyncContext, type SupabaseSyncContextValue } from '../contexts/SupabaseSyncContext';

/** Données dashboard + sync Realtime + isOnline, connectionError, retry (hors-ligne). */
export function useSupabaseSync(): SupabaseSyncContextValue {
  const ctx = useContext(SupabaseSyncContext);
  if (ctx === undefined) {
    throw new Error('useSupabaseSync must be used within SupabaseSyncProvider');
  }
  return ctx;
}
