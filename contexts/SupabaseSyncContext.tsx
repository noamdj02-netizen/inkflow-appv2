import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseDashboard } from '../hooks/useSupabaseDashboard';

export type SupabaseSyncContextValue = ReturnType<typeof useSupabaseDashboard>;

const SupabaseSyncContext = createContext<SupabaseSyncContextValue | undefined>(undefined);

export const SupabaseSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useSupabaseDashboard();
  return (
    <SupabaseSyncContext.Provider value={value}>
      {children}
    </SupabaseSyncContext.Provider>
  );
};

/** Hook global : données dashboard + sync Realtime + isOnline, connectionError, retry (hors-ligne). */
export const useSupabaseSync = (): SupabaseSyncContextValue => {
  const ctx = useContext(SupabaseSyncContext);
  if (ctx === undefined) {
    throw new Error('useSupabaseSync must be used within SupabaseSyncProvider');
  }
  return ctx;
};
