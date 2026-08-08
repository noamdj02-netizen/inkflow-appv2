import React, { lazy, Suspense } from 'react';
import { PublicDemoAuthProvider } from '@/contexts/AuthContext';
import { StudioPrivacyProvider } from '@/contexts/StudioPrivacyContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardLoadingSkeleton } from '@/components/common/LoadingSkeleton';

const DashboardPro = lazy(() =>
  import('@/components/dashboard/DashboardPro').then((m) => ({ default: m.DashboardPro }))
);

/** Dashboard Pro réel en sandbox publique — navigation libre, sans auto-play. */
export const DashboardInteractiveSandbox: React.FC = () => {
  return (
    <ErrorBoundary errorContext="dashboard-demo">
      <PublicDemoAuthProvider>
        <StudioPrivacyProvider>
          <div className="flex flex-col h-[100dvh] overflow-hidden bg-background">
            <Suspense
              fallback={
                <div className="h-full bg-neutral-50 dark:bg-[var(--bg-primary)]">
                  <DashboardLoadingSkeleton />
                </div>
              }
            >
              <DashboardPro />
            </Suspense>
          </div>
        </StudioPrivacyProvider>
      </PublicDemoAuthProvider>
    </ErrorBoundary>
  );
};

export default DashboardInteractiveSandbox;
