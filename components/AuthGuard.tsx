import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { REDIRECT_AFTER_LOGIN_KEY } from '../contexts/AuthContext';

interface AuthGuardProps {
  /** URL à restaurer après login (ex. currentPath) */
  redirectUrl: string;
  /** Appelé pour que le routeur affiche /login sans full reload */
  onRedirectToLogin: () => void;
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ redirectUrl, onRedirectToLogin, children }) => {
  const { isAuthenticated, authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      try {
        sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, redirectUrl);
      } catch {
        // sessionStorage indisponible (privé, etc.)
      }
      window.history.pushState({}, '', '/login');
      onRedirectToLogin();
    }
  }, [authLoading, isAuthenticated, redirectUrl, onRedirectToLogin]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[var(--bg-primary)]" aria-busy="true">
        <div className="w-10 h-10 border-2 border-[var(--text-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
