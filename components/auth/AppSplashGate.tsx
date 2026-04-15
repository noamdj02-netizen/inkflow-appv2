/**
 * AppSplashGate — Masque le splash HTML quand l'auth est résolue
 * Sur les pages publiques (login, signup…), masque rapidement pour éviter
 * le chargement infini causé par une session Supabase corrompue en cache.
 */
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const PUBLIC_PATHS = ['/login', '/signup', '/reset-password', '/auth/callback', '/auth/update-password'];

function isPublicPath(path: string): boolean {
  if (path === '/') return true;
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));
}

function hideSplash() {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 400);
  }
}

export const AppSplashGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authLoading } = useAuth();
  const hiddenRef = useRef(false);

  /** Filet de sécurité : masque le splash HTML même si l’auth ou une route reste bloquée */
  useEffect(() => {
    const failSafe = window.setTimeout(() => {
      if (hiddenRef.current) return;
      hiddenRef.current = true;
      hideSplash();
    }, 8000);
    return () => window.clearTimeout(failSafe);
  }, []);

  useEffect(() => {
    if (hiddenRef.current) return;

    const path = window.location.pathname;

    // Pages publiques : masquer après 400ms (évite blocage si session corrompue en cache)
    if (isPublicPath(path)) {
      const t = setTimeout(() => {
        if (hiddenRef.current) return;
        hiddenRef.current = true;
        hideSplash();
      }, 400);
      return () => clearTimeout(t);
    }

    // Pages protégées : attendre auth OU timeout de sécurité 4s
    if (!authLoading) {
      hiddenRef.current = true;
      hideSplash();
      return;
    }
    const fallback = setTimeout(() => {
      if (hiddenRef.current) return;
      hiddenRef.current = true;
      hideSplash();
    }, 4000);
    return () => clearTimeout(fallback);
  }, [authLoading]);

  return <>{children}</>;
};
