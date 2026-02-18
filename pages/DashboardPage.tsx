import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardPro } from '../components/dashboard/DashboardPro';
import { ErrorBoundary } from '../components/ErrorBoundary';

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
        <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          <p className="text-neutral-600 text-sm">Redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <DashboardPro />
    </ErrorBoundary>
  );
}
