import React, { createContext, ReactNode } from 'react';
import { useSupabaseDashboard } from '../hooks/useSupabaseDashboard';

export type SupabaseSyncContextValue = ReturnType<typeof useSupabaseDashboard>;

/** Exporté pour `hooks/useSupabaseSync.ts` — évite hook + provider dans le même fichier (Fast Refresh Vite). */
export const SupabaseSyncContext = createContext<SupabaseSyncContextValue | undefined>(undefined);

export const SupabaseSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useSupabaseDashboard();
  return (
    <SupabaseSyncContext.Provider value={value}>
      {children}
    </SupabaseSyncContext.Provider>
  );
};
