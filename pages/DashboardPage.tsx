import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StudioPrivacyProvider } from '../contexts/StudioPrivacyContext';
import { DashboardPro } from '../components/dashboard/DashboardPro';
import { SEO } from '../components/SEO';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Logo } from '../components/Logo';

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, authLoading } = useAuth();

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
        <DashboardPro />
      </StudioPrivacyProvider>
    </ErrorBoundary>
  );
}
