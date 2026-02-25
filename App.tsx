import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { SupabaseSyncProvider } from './contexts/SupabaseSyncContext';
import { Logo } from './components/Logo';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { LandingBelowFold } from './components/landing/LandingBelowFold';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';

const LandingBelowFoldLazy = lazy(() => import('./components/landing/LandingBelowFold').then(m => ({ default: m.LandingBelowFold })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PublicStudioPagePro = lazy(() => import('./pages/public/PublicStudioPagePro').then(m => ({ default: m.PublicStudioPagePro })));
const PublicBookingPagePro = lazy(() => import('./pages/public/PublicBookingPagePro').then(m => ({ default: m.PublicBookingPagePro })));
const ConsentPage = lazy(() => import('./pages/public/ConsentPage').then(m => ({ default: m.ConsentPage })));
const PublicMessagePage = lazy(() => import('./pages/public/PublicMessagePage').then(m => ({ default: m.PublicMessagePage })));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));
const DemoPage = lazy(() => import('./pages/DemoPage').then(m => ({ default: m.DemoPage })));

interface Route {
  path: string | RegExp;
  component: React.ComponentType<any>;
  requiresAuth?: boolean;
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
      if (anchor && anchor.href.startsWith(window.location.origin)) {
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
    { path: '/demo', component: DemoPage },
    { path: '/dashboard', component: DashboardPage, requiresAuth: true },
    { path: '/auth/callback', component: AuthCallbackPage },
    { path: '/auth/update-password', component: UpdatePasswordPage },
    // Vitrine publique : accessible sans connexion (slash final optionnel)
    { path: /^\/studio\/([a-z0-9-]+)\/?$/, component: PublicStudioPagePro, getProps: (m) => ({ studioSlug: m[1] }) },
    { path: /^\/book\/([a-z0-9-]+)\/?$/, component: PublicBookingPagePro, getProps: (m) => ({ studioSlug: m[1] }) },
    { path: /^\/consent\/([a-z0-9_-]+)$/, component: ConsentPage, getProps: (m) => ({ consentId: m[1] }) },
    { path: /^\/messages\/([a-z0-9_-]+)$/, component: PublicMessagePage, getProps: (m) => ({ threadId: m[1] }) },
    { path: '/politique-confidentialite', component: PrivacyPolicyPage },
    { path: '/privacy', component: PrivacyPolicyPage },
    { path: '/conditions-utilisation', component: TermsOfServicePage },
    { path: '/terms', component: TermsOfServicePage },
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Logo size="lg" className="rounded-2xl" />
      </div>
    );
  }

  const Component = route.component;
  const props = match && route.getProps ? route.getProps(match) : {};

  // ErrorBoundary par route : évite un crash complet si une page publique plante
  const PageWithGuard = (
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
                href="/"
                className="px-6 py-3 border-2 border-[var(--border)] rounded-xl font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
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

  return (
    <Suspense fallback={<FullScreenSpinner />}>
      {PageWithGuard}
    </Suspense>
  );
};

const NotFoundPage: React.FC = () => (
  <div className="landing-scroll bg-neutral-50 flex items-center justify-center px-4">
    <div className="text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-neutral-600 mb-8">Page non trouvée</p>
      <a href="/" className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-neutral-800 transition-colors">
        Retour à l'accueil
      </a>
    </div>
  </div>
);

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      setScrolled(el.scrollTop > 50);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={scrollRef} className="landing-scroll !bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <Navbar scrolled={scrolled} />

      <main className="relative z-10">
        <HeroSection />
        <Suspense fallback={<div className="min-h-[200px]" aria-hidden />}>
          <LandingBelowFoldLazy />
        </Suspense>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="app-root">
        <AuthProvider>
          <ToastProvider>
            <SupabaseSyncProvider>
              <Router />
            </SupabaseSyncProvider>
          </ToastProvider>
        </AuthProvider>
      </div>
    </ErrorBoundary>
  );
};

export default App;
