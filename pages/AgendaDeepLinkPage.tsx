/**
 * /agenda?date=YYYY-MM-DD — redirige vers le planning connecté.
 * Non connecté : enregistre la cible et envoie vers /login (équivalent deep link app.ink-flow.me/agenda?...).
 */
import React, { useEffect } from 'react';
import { useAuth, REDIRECT_AFTER_LOGIN_KEY } from '../contexts/AuthContext';
import { sanitizePostAuthRedirect } from '../lib/urls';
import { SEO } from '../components/SEO';
import { DashboardLoadingSkeleton } from '../components/common/LoadingSkeleton';

export const AgendaDeepLinkPage: React.FC = () => {
  const { isAuthenticated, authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    const sp = new URLSearchParams(window.location.search);
    const date = sp.get('date');
    const dateQ =
      date && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())
        ? `&date=${encodeURIComponent(date.trim())}`
        : '';
    const target = sanitizePostAuthRedirect(`/dashboard?tab=appointments${dateQ}`);

    if (!isAuthenticated) {
      try {
        sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, target);
      } catch {
        /* ignore */
      }
      window.location.replace('/login');
      return;
    }

    window.history.replaceState({}, '', target);
    window.dispatchEvent(new Event('inkflow-navigate'));
  }, [authLoading, isAuthenticated]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[var(--bg-primary)]">
      <SEO title="Agenda | InkFlow" noindex />
      <DashboardLoadingSkeleton />
    </div>
  );
};
