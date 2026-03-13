/**
 * AppSplashGate — Masque le splash HTML quand l'auth est résolue
 * Vérifie le token de session Supabase avant de révéler l'app
 */
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const AppSplashGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authLoading } = useAuth();
  const hiddenRef = useRef(false);

  useEffect(() => {
    if (hiddenRef.current) return;
    if (!authLoading) {
      hiddenRef.current = true;
      const splash = document.getElementById('splash');
      if (splash) {
        splash.classList.add('hidden');
        setTimeout(() => splash.remove(), 400);
      }
    }
  }, [authLoading]);

  return <>{children}</>;
};
