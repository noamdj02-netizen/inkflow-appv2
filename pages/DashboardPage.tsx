import React, { lazy, Suspense } from 'react';
import { useAuth, REDIRECT_AFTER_LOGIN_KEY } from '../contexts/AuthContext';
import { isInkflowInternalStaffEmail } from '../lib/inkflowInternalStaff';
import { shouldRedirectPortalClientFromProDashboard } from '../lib/postLoginRedirect';
import { pathForClientDashboardTab } from '../lib/clientDashboardRoutes';
import { StudioPrivacyProvider } from '../contexts/StudioPrivacyContext';
import { SEO } from '../components/SEO';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Logo } from '../components/Logo';

const DashboardPro = lazy(() =>
  import('../components/dashboard/DashboardPro').then((m) => ({ default: m.DashboardPro })),
);

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, authLoading } = useAuth();
  const [allowProDashboard, setAllowProDashboard] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      try {
        sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, window.location.pathname + window.location.search);
      } catch {
        /* ignore */
      }
      window.location.href = '/login';
    }
  }, [isAuthenticated, authLoading]);

  /** Compte équipe / fondateur : ne pas monter le dashboard tatoueur (email source de vérité — évite localStorage obsolète). */
  React.useEffect(() => {
    if (authLoading || !user?.email) return;
    if (!isInkflowInternalStaffEmail(user.email) && !user.isInkflowStaff) return;
    window.history.replaceState({}, '', '/admin');
    window.dispatchEvent(new Event('inkflow-navigate'));
  }, [authLoading, user?.email, user?.isInkflowStaff]);

  React.useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return;
    if (isInkflowInternalStaffEmail(user.email) || user.isInkflowStaff) {
      setAllowProDashboard(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      if (await shouldRedirectPortalClientFromProDashboard(user)) {
        if (!cancelled) {
          window.history.replaceState({}, '', pathForClientDashboardTab('home'));
          window.dispatchEvent(new Event('inkflow-navigate'));
        }
        return;
      }
      if (!cancelled) setAllowProDashboard(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Logo size="lg" className="rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Logo size="lg" className="rounded-2xl" />
      </div>
    );
  }

  if (isInkflowInternalStaffEmail(user.email) || user.isInkflowStaff) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-3 px-4">
        <Logo size="lg" className="rounded-2xl" />
        <p className="text-sm text-zinc-500 text-center">Ouverture du tableau fondateur…</p>
      </div>
    );
  }

  if (!allowProDashboard) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Logo size="lg" className="rounded-2xl" />
      </div>
    );
  }

  return (
    <ErrorBoundary errorContext="dashboard">
      <SEO title="Tableau de bord" noindex />
      <StudioPrivacyProvider>
        <Suspense
          fallback={
            <div className="min-h-screen bg-neutral-50 dark:bg-[var(--bg-primary)] flex items-center justify-center">
              <Logo size="lg" className="rounded-2xl opacity-90 animate-pulse" />
            </div>
          }
        >
          <DashboardPro />
        </Suspense>
      </StudioPrivacyProvider>
    </ErrorBoundary>
  );
}
