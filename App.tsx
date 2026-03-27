import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { LANDING_URL } from './lib/urls';
import { SEO } from './components/SEO';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SupabaseSyncProvider } from './contexts/SupabaseSyncContext';
import { Logo } from './components/Logo';
import { LandingEnhanceAI } from './components/landing/LandingEnhanceAI';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieConsent } from './components/CookieConsent';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { AppSplashGate } from './components/auth/AppSplashGate';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { InviteRedirectPage } from './pages/InviteRedirectPage';
import { ReferralPage } from './pages/ReferralPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PublicStudioPagePro = lazy(() => import('./pages/public/PublicStudioPagePro').then(m => ({ default: m.PublicStudioPagePro })));
const PublicBookingPage = lazy(() => import('./pages/public/PublicBookingPage').then(m => ({ default: m.PublicBookingPage })));
const ConsentPage = lazy(() => import('./pages/public/ConsentPage').then(m => ({ default: m.ConsentPage })));
const PublicMessagePage = lazy(() => import('./pages/public/PublicMessagePage').then(m => ({ default: m.PublicMessagePage })));
const ReservationSuccessPage = lazy(() => import('./pages/public/ReservationSuccessPage').then(m => ({ default: m.ReservationSuccessPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));
const AidePage = lazy(() => import('./pages/AidePage').then(m => ({ default: m.AidePage })));
const DemoSandboxPage = lazy(() => import('./pages/DemoSandboxPage').then(m => ({ default: m.DemoSandboxPage })));
const DashboardDemoPage = lazy(() => import('./pages/DashboardDemoPage').then(m => ({ default: m.DashboardDemoPage })));
const FeatureDetailPage = lazy(() => import('./pages/features/FeatureDetailPage').then(m => ({ default: m.FeatureDetailPage })));
const InstagramCallbackPage = lazy(() => import('./pages/InstagramCallbackPage').then(m => ({ default: m.InstagramCallbackPage })));
const AddToHomeScreenPage = lazy(() => import('./pages/AddToHomeScreenPage').then(m => ({ default: m.AddToHomeScreenPage })));

interface Route {
  path: string | RegExp;
  component: React.ComponentType<any>;
  requiresAuth?: boolean;
  needsSupabaseSync?: boolean;
  getProps?: (match: RegExpMatchArray) => Record<string, string>;
}

const FullScreenSpinner: React.FC = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center">
    <Logo size="lg" className="rounded-2xl" />
    <div
      className="w-[200px] h-1 mt-5 mx-auto rounded-full bg-white/15 overflow-hidden"
      role="progressbar"
      aria-label="Chargement"
    >
      <div className="loader-bar-inner h-full w-[40%] rounded-full bg-gradient-to-r from-white to-amber-400/90" />
    </div>
  </div>
);

const Router: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname + window.location.search);
  const { isAuthenticated, authLoading } = useAuth();

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname + window.location.search);
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('inkflow-navigate', handleLocationChange);

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href.startsWith(window.location.origin) && !anchor.target) {
        e.preventDefault();
        const url = new URL(anchor.href);
        const fullUrl = url.pathname + url.search + (url.hash || '');
        window.history.pushState({}, '', fullUrl);
        setCurrentPath(url.pathname + url.search);

        if (url.hash) {
          const id = url.hash.slice(1);
          const scrollToSection = () => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          };
          if (url.pathname === window.location.pathname) {
            scrollToSection();
          } else {
            setTimeout(scrollToSection, 150);
          }
        } else {
          document.querySelector('.app-shell-content')?.scrollTo(0, 0);
          document.querySelector('.landing-scroll')?.scrollTo(0, 0);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('inkflow-navigate', handleLocationChange);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Routes publiques (pas de requiresAuth) : vitrine, réservation, consentement, messages, pages légales
  const routes: Route[] = [
    { path: '/', component: LandingPage },
    { path: '/login', component: LoginPage },
    { path: '/signup', component: SignupPage },
    { path: /^\/installer\/?$/, component: AddToHomeScreenPage },
    { path: /^\/invite\/([a-zA-Z0-9]+)\/?$/, component: InviteRedirectPage, getProps: (m) => ({ code: m[1] }) },
    { path: '/reset-password', component: ResetPasswordPage },
    { path: '/demo', component: DashboardDemoPage },
    { path: '/dashboard-demo', component: DashboardDemoPage },
    { path: /^\/(vue-ensemble|demandes|rendez-vous|galerie-flash|clients|messagerie|portfolio|finance|parametres)\/?$/, component: FeatureDetailPage, getProps: (m) => ({ slug: m[1] }) },
    { path: '/dashboard', component: DashboardPage, requiresAuth: true, needsSupabaseSync: true },
    { path: '/auth/callback', component: AuthCallbackPage },
    { path: '/instagram/callback', component: InstagramCallbackPage },
    { path: '/auth/update-password', component: UpdatePasswordPage },
    // Vitrine publique : accessible sans connexion (slash final optionnel)
    { path: /^\/studio\/([a-z0-9-]+)\/?$/, component: PublicStudioPagePro, getProps: (m) => ({ studioSlug: m[1] }) },
    { path: /^\/book\/([a-z0-9-]+)\/?$/, component: PublicBookingPage, getProps: (m) => ({ studioSlug: m[1] }) },
    { path: /^\/consent\/([a-z0-9_-]+)$/, component: ConsentPage, getProps: (m) => ({ consentId: m[1] }) },
    { path: /^\/messages\/([a-z0-9_.-]+)$/, component: PublicMessagePage, getProps: (m) => ({ threadId: m[1] }) },
    { path: /^\/c\/([a-z0-9_.-]+)$/, component: PublicMessagePage, getProps: (m) => ({ threadId: m[1] }) },
    { path: '/reservation-succes', component: ReservationSuccessPage },
    { path: '/politique-confidentialite', component: PrivacyPolicyPage },
    { path: '/privacy', component: PrivacyPolicyPage },
    { path: '/privacy-policy', component: PrivacyPolicyPage },
    { path: '/conditions-utilisation', component: TermsOfServicePage },
    { path: '/terms', component: TermsOfServicePage },
    { path: '/aide', component: AidePage },
    { path: '/referral', component: ReferralPage, requiresAuth: true },
  ];

  const matchRoute = () => {
    const pathname = currentPath.split('?')[0];
    for (const route of routes) {
      if (typeof route.path === 'string') {
        if (route.path === pathname) return { route, match: null };
      } else {
        const match = pathname.match(route.path);
        if (match) return { route, match };
      }
    }
    return null;
  };

  const matched = matchRoute();

  if (!matched) {
    return <NotFoundPage />;
  }

  const { route, match } = matched;

  if (route.requiresAuth && authLoading) {
    return <FullScreenSpinner />;
  }
  if (route.requiresAuth && !isAuthenticated) {
    window.location.href = '/login';
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Logo size="lg" className="rounded-2xl" />
      </div>
    );
  }

  const Component = route.component;
  const props = match && route.getProps ? route.getProps(match) : {};

  // ErrorBoundary par route : évite un crash complet si une page publique plante
  const pageContent = (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-neutral-50 dark:bg-[var(--bg-primary)] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl" aria-hidden>⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Une erreur s&apos;est produite</h1>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              Cette page n&apos;a pas pu s&apos;afficher. Réessayez ou retournez à l&apos;accueil.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl font-semibold hover:opacity-90"
              >
                Réessayer
              </button>
              <a
                href={LANDING_URL}
                className="px-6 py-3 border-2 border-[var(--border)] rounded-xl font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                target="_blank"
                rel="noopener noreferrer"
              >
                Retour à l&apos;accueil
              </a>
            </div>
          </div>
        </div>
      }
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  const PageWithGuard = route.needsSupabaseSync
    ? <SupabaseSyncProvider>{pageContent}</SupabaseSyncProvider>
    : pageContent;

  return (
    <Suspense fallback={<FullScreenSpinner />}>
      {PageWithGuard}
    </Suspense>
  );
};

const NotFoundPage: React.FC = () => (
  <div className="landing-scroll bg-neutral-50 flex items-center justify-center px-4">
    <SEO
      title="Page non trouvée (404)"
      description="La page demandée n'existe pas sur InkFlow."
      noindex
      canonical="/404"
      ogImageAlt="InkFlow"
    />
    <div className="text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-neutral-600 mb-8">Page non trouvée</p>
      <a href={LANDING_URL} className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-neutral-800 transition-colors">
        Retour à l'accueil
      </a>
    </div>
  </div>
);

const LandingPage: React.FC = () => <LandingEnhanceAI />;

/** Log et affiche un toast sur les promesses rejetées non gérées (détection de bugs en prod). */
const UnhandledRejectionHandler: React.FC = () => {
  const toast = useToast();
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = reason instanceof Error ? reason.message : String(reason);
      console.error('[unhandledrejection]', reason);
      try {
        toast.error(`Erreur inattendue : ${msg.slice(0, 80)}${msg.length > 80 ? '…' : ''}`);
      } catch {
        // Éviter une boucle si le toast échoue
      }
      event.preventDefault?.();
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, [toast]);
  return null;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="data-theme" defaultTheme="dark" storageKey="inkflow-theme">
        <div className="app-root">
          <AuthProvider>
            <AppSplashGate>
              <ToastProvider>
                <LanguageProvider>
                  <UnhandledRejectionHandler />
                  <Router />
                  <CookieConsent />
                  <PWAUpdatePrompt />
                </LanguageProvider>
              </ToastProvider>
            </AppSplashGate>
          </AuthProvider>
        </div>
      </ThemeProvider>
      <Analytics />
    </ErrorBoundary>
  );
};

export default App;
