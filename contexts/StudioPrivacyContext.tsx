import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';

const STORAGE_KEY = 'inkflow-studio-privacy-mode';

interface StudioPrivacyContextValue {
  /** Mode atelier : masque les montants (€) à l'écran */
  privacyMode: boolean;
  setPrivacyMode: (value: boolean) => void;
  togglePrivacyMode: () => void;
}

const StudioPrivacyContext = createContext<StudioPrivacyContextValue | null>(null);

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export const StudioPrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [privacyMode, setPrivacyModeState] = useState(false);

  useEffect(() => {
    setPrivacyModeState(readStored());
  }, []);

  const setPrivacyMode = useCallback((value: boolean) => {
    setPrivacyModeState(value);
    try {
      if (value) localStorage.setItem(STORAGE_KEY, '1');
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      //
    }
  }, []);

  const togglePrivacyMode = useCallback(() => {
    setPrivacyMode(!privacyMode);
  }, [privacyMode, setPrivacyMode]);

  const value = useMemo(
    () => ({ privacyMode, setPrivacyMode, togglePrivacyMode }),
    [privacyMode, setPrivacyMode, togglePrivacyMode]
  );

  return <StudioPrivacyContext.Provider value={value}>{children}</StudioPrivacyContext.Provider>;
};

export function useStudioPrivacy(): StudioPrivacyContextValue {
  const ctx = useContext(StudioPrivacyContext);
  if (!ctx) {
    return {
      privacyMode: false,
      setPrivacyMode: () => {},
      togglePrivacyMode: () => {},
    };
  }
  return ctx;
}

/** Affiche un montant en EUR ou un masque selon le mode atelier */
export function formatEuroPrivacy(amount: number, privacyMode: boolean): string {
  if (privacyMode) return '••••';
  return `${amount.toLocaleString('fr-FR')}€`;
}
