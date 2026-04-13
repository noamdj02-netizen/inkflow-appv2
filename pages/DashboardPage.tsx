import React, { lazy, Suspense } from 'react';
import { useAuth, REDIRECT_AFTER_LOGIN_KEY } from '../contexts/AuthContext';
import { StudioPrivacyProvider } from '../contexts/StudioPrivacyContext';
import { SEO } from '../components/SEO';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Logo } from '../components/Logo';

const DashboardPro = lazy(() =>
  import('../components/dashboard/DashboardPro').then((m) => ({ default: m.DashboardPro })),
);

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, authLoading } = useAuth();

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
