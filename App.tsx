import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useClientManifest } from './hooks/useClientManifest';
import { ThemeProvider } from 'next-themes';
import { LANDING_URL } from './lib/urls';
import { SEO } from './components/SEO';
import { VercelAnalyticsOptIn } from './components/VercelAnalyticsOptIn';
import { PostHogOptIn } from './components/PostHogOptIn';
import { ProductAnalyticsIdentity } from './components/analytics/ProductAnalyticsIdentity';
import { ProductNpsPrompt } from './components/ProductNpsPrompt';
import { AuthProvider, useAuth, REDIRECT_AFTER_LOGIN_KEY } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SupabaseSyncProvider } from './contexts/SupabaseSyncContext';
import {
  AuthRouteLoadingSkeleton,
  LoginRedirectSkeleton,
  PublicPageLoadingSkeleton,
} from './components/common/LoadingSkeleton';
import { OfflineBanner } from './components/common/OfflineBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieConsent } from './components/CookieConsent';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { AppSplashGate } from './components/auth/AppSplashGate';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { InviteRedirectPage } from './pages/InviteRedirectPage';
import { ReferralPage } from './pages/ReferralPage';
import { ReservationSuccessPage } from './pages/public/ReservationSuccessPage';

const LandingEnhanceAI = lazy(() =>
  import('./components/landing/LandingEnhanceAI').then((m) => ({ default: m.LandingEnhanceAI }))
);
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() =>
  import('./pages/SignupPage').then((m) => ({ default: m.SignupPage }))
);
const ClientPortalLoginPage = lazy(() =>
  import('./pages/client/ClientPortalLoginPage').then((m) => ({ default: m.ClientPortalLoginPage }))
);
const ClientWelcomeOnboardingPage = lazy(() =>
  import('./pages/client/ClientWelcomeOnboardingPage').then((m) => ({
    default: m.ClientWelcomeOnboardingPage,
  }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const PublicStudioPagePro = lazy(() =>
  import('./pages/public/PublicStudioPagePro').then((m) => ({ default: m.PublicStudioPagePro }))
);
const PublicBookingPage = lazy(() =>
  import('./pages/public/PublicBookingPage').then((m) => ({ default: m.PublicBookingPage }))
);
const ConsentPage = lazy(() =>
  import('./pages/public/ConsentPage').then((m) => ({ default: m.ConsentPage }))
);
const PublicMessagePage = lazy(() =>
  import('./pages/public/PublicMessagePage').then((m) => ({ default: m.PublicMessagePage }))
);
const PrivacyPolicyPage = lazy(() =>
  import('./pages/legal/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage }))
);
const TermsOfServicePage = lazy(() =>
  import('./pages/legal/TermsOfServicePage').then((m) => ({ default: m.TermsOfServicePage }))
);
const LegalNoticePage = lazy(() =>
  import('./pages/legal/LegalNoticePage').then((m) => ({ default: m.LegalNoticePage }))
);
const AidePage = lazy(() => import('./pages/AidePage').then((m) => ({ default: m.AidePage })));
const ChangelogPage = lazy(() =>
  import('./pages/ChangelogPage').then((m) => ({ default: m.ChangelogPage }))
);
const DashboardDemoPage = lazy(() =>
  import('./pages/DashboardDemoPage').then((m) => ({ default: m.DashboardDemoPage }))
);
const FeatureDetailPage = lazy(() =>
  import('./pages/features/FeatureDetailPage').then((m) => ({ default: m.FeatureDetailPage }))
);
const InstagramCallbackPage = lazy(() =>
  import('./pages/InstagramCallbackPage').then((m) => ({ default: m.InstagramCallbackPage }))
);
const AddToHomeScreenPage = lazy(() =>
  import('./pages/AddToHomeScreenPage').then((m) => ({ default: m.AddToHomeScreenPage }))
);
const DebugExperiencePage = lazy(() =>
  import('./pages/admin/DebugExperiencePage').then((m) => ({ default: m.DebugExperiencePage }))
);
const FounderDashboardPage = lazy(() =>
  import('./pages/admin/FounderDashboardPage').then((m) => ({ default: m.FounderDashboardPage }))
);
const DailyBriefPage = lazy(() =>
  import('./pages/admin/DailyBriefPage').then((m) => ({ default: m.DailyBriefPage }))
);
const AgendaDeepLinkPage = lazy(() =>
  import('./pages/AgendaDeepLinkPage').then((m) => ({ default: m.AgendaDeepLinkPage }))
);
const ClientVitrineEmbedPage = lazy(() =>
  import('./pages/client/ClientStudioEmbedPage').then((m) => ({
    default: m.ClientVitrineEmbedPage,
  }))
);
const ClientFlashToolsEmbedPage = lazy(() =>
  import('./pages/client/ClientStudioEmbedPage').then((m) => ({
    default: m.ClientFlashToolsEmbedPage,
  }))
);
const ClientDashboard = lazy(() =>
  import('./pages/public/ClientDashboard').then((m) => ({ default: m.ClientDashboard }))
);
const ClientHealthOnboardingPage = lazy(() =>
  import('./pages/client/ClientHealthOnboardingPage').then((m) => ({
    default: m.ClientHealthOnboardingPage,
  }))
);
const ClientOnboardingFinalizePage = lazy(() =>
  import('./pages/client/ClientOnboardingFinalizePage').then((m) => ({
    default: m.ClientOnboardingFinalizePage,
  }))
);
const ArtistPage = lazy(() =>
  import('./pages/vitrine/ArtistPage').then((m) => ({ default: m.ArtistPage }))
);
const FlashPage = lazy(() =>
  import('./pages/vitrine/FlashPage').then((m) => ({ default: m.FlashPage }))
);
const DiscoverHomePage = lazy(() =>
  import('./pages/discover/DiscoverHomePage').then((m) => ({ default: m.DiscoverHomePage }))
);
const DiscoverCityPage = lazy(() =>
  import('./pages/discover/DiscoverCityPage').then((m) => ({ default: m.DiscoverCityPage }))
);
const DiscoverCityStylePage = lazy(() =>
  import('./pages/discover/DiscoverCityStylePage').then((m) => ({
    default: m.DiscoverCityStylePage,
  }))
);

interface Route {
  path: string | RegExp;
  /** Props dynamiques (slug, studioSlug, etc.) — toujours des chaînes pour le routeur. */
  component: React.ComponentType<Record<string, string>>;
  requiresAuth?: boolean;
  needsSupabaseSync?: boolean;
  getProps?: (match: RegExpMatchArray) => Record<string, string>;
}

/** Normalise le chemin pour le routage thème (slash final, sans query). */
function normalizePathnameForTheme(pathname: string): string {
  let p = pathname.split('?')[0];
  if (p.length > 1 && p.endsWith('/')) p = p.replace(/\/+$/, '');
  return p;
}

/**
 * Mode clair forcé partout sauf sur `/dashboard` (Dashboard Pro), où le thème
 * reste piloté par le stockage + le bouton jour/nuit.
 * Évite que les `!important` dark (`index.css`) n’écrasent l’app client / vitrine.
 */
const InkflowThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pathname, setPathname] = useState(() =>
    normalizePathnameForTheme(window.location.pathname)
  );
  useEffect(() => {
    const sync = () => setPathname(normalizePathnameForTheme(window.location.pathname));
    window.addEventListener('popstate', sync);
    window.addEventListener('inkflow-navigate', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('inkflow-navigate', sync);
    };
  }, []);
  const isDashboardPro = pathname === '/dashboard' || pathname.startsWith('/admin');
  return (
    /* @ts-expect-error next-themes ThemeProvider children — React 19 compat */
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="light"
      storageKey="inkflow-theme"
      enableSystem={false}
      forcedTheme={isDashboardPro ? undefined : 'light'}
    >
      {children}
    </ThemeProvider>
  );
};

const FullScreenSpinner: React.FC = () => <AuthRouteLoadingSkeleton />;

/** Retour Stripe Connect : si SITE_URL pointe vers / au lieu de /dashboard, on corrige au chargement. */
function initialRouterPath(): string {
  if (typeof window === 'undefined') return '/';
  try {
    const u = new URL(window.location.href);
    const sc = u.searchParams.get('stripe_connect');
    if (
      (u.pathname === '/' || u.pathname === '') &&
      u.searchParams.get('settings') === 'payments' &&
      (sc === 'return' || sc === 'refresh')
    ) {
      const target = `/dashboard${u.search}`;
      window.history.replaceState({}, '', target);
      return target;
    }
  } catch {
    /* ignore */
  }
  return window.location.pathname + window.location.search;
}

const Router: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(initialRouterPath);
  const { isAuthenticated, authLoading } = useAuth();
  useClientManifest(currentPath.startsWith('/client'));

  useEffect(() => {
    const handleLocationChange = () =>
      setCurrentPath(window.location.pathname + window.location.search);
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('inkflow-navigate', handleLocationChange);

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      const rawHref = anchor?.getAttribute('href')?.trim() ?? '';
      if (
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:') ||
        rawHref.startsWith('sms:')
      ) {
        return;
      }
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
          document.querySelector('.book-public-scroll')?.scrollTo(0, 0);
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
    {
      path: /^\/invite\/([a-zA-Z0-9]+)\/?$/,
      component: InviteRedirectPage,
      getProps: (m) => ({ code: m[1] }),
    },
    { path: '/reset-password', component: ResetPasswordPage },
    { path: '/demo', component: DashboardDemoPage },
    { path: '/dashboard-demo', component: DashboardDemoPage },
    {
      path: /^\/(vue-ensemble|demandes|rendez-vous|galerie-flash|clients|messagerie|portfolio|finance|parametres)\/?$/,
      component: FeatureDetailPage,
      getProps: (m) => ({ slug: m[1] }),
    },
    { path: '/dashboard', component: DashboardPage, requiresAuth: true, needsSupabaseSync: true },
    /** Deep link agenda (login → retour sur le jour demandé) */
    { path: '/agenda', component: AgendaDeepLinkPage },
    /** Slash final optionnel — évite 404 si l’URL est /auth/callback/client/ */
    { path: /^\/auth\/callback\/client\/?$/, component: AuthCallbackPage },
    { path: /^\/auth\/callback\/?$/, component: AuthCallbackPage },
    { path: /^\/instagram\/callback\/?$/, component: InstagramCallbackPage },
    { path: /^\/auth\/update-password\/?$/, component: UpdatePasswordPage },
    // Vitrine publique : accessible sans connexion (slash final optionnel)
    {
      path: /^\/studio\/([a-z0-9-]+)\/?$/,
      component: PublicStudioPagePro,
      getProps: (m) => ({ studioSlug: m[1] }),
    },
    {
      path: /^\/book\/([a-z0-9-]+)\/?$/,
      component: PublicBookingPage,
      getProps: (m) => ({ studioSlug: m[1] }),
    },
    {
      path: /^\/consent\/([a-z0-9_-]+)$/,
      component: ConsentPage,
      getProps: (m) => ({ consentId: m[1] }),
    },
    {
      path: /^\/messages\/([a-z0-9_.-]+)$/,
      component: PublicMessagePage,
      getProps: (m) => ({ threadId: m[1] }),
    },
    {
      path: /^\/c\/([a-z0-9_.-]+)$/,
      component: PublicMessagePage,
      getProps: (m) => ({ threadId: m[1] }),
    },
    { path: '/reservation-succes', component: ReservationSuccessPage },
    { path: '/politique-confidentialite', component: PrivacyPolicyPage },
    { path: '/privacy', component: PrivacyPolicyPage },
    { path: '/privacy-policy', component: PrivacyPolicyPage },
    { path: '/conditions-utilisation', component: TermsOfServicePage },
    { path: '/terms', component: TermsOfServicePage },
    { path: '/cgv', component: TermsOfServicePage },
    { path: '/mentions-legales', component: LegalNoticePage },
    { path: '/legal', component: LegalNoticePage },
    { path: '/aide', component: AidePage },
    { path: '/changelog', component: ChangelogPage },
    { path: '/quoi-de-neuf', component: ChangelogPage },
    { path: '/referral', component: ReferralPage, requiresAuth: true },
    { path: '/admin/debug-experience', component: DebugExperiencePage, requiresAuth: true },
    { path: '/admin/daily-brief', component: DailyBriefPage, requiresAuth: true },
    {
      path: /^\/admin\/([^/]+)\/?$/,
      component: FounderDashboardPage,
      requiresAuth: true,
      getProps: (m) => ({ section: m[1] }),
    },
    { path: '/admin', component: FounderDashboardPage, requiresAuth: true },
    // ── Portail client "My Inkflow" ─────────────────────────────────────────
    { path: /^\/onboarding\/finaliser-profil\/?$/, component: ClientOnboardingFinalizePage },
    { path: /^\/client\/bienvenue\/?$/, component: ClientWelcomeOnboardingPage },
    { path: '/client', component: ClientPortalLoginPage },
    { path: /^\/client\/vitrine\/?$/, component: ClientVitrineEmbedPage },
    { path: /^\/client\/studio\/flash\/?$/, component: ClientFlashToolsEmbedPage },
    { path: /^\/client\/compte-sante\/?$/, component: ClientHealthOnboardingPage },
    { path: /^\/client\/dashboard\/?$/, component: ClientDashboard },
    // ── Discover — directory public ─────────────────────────────────────────
    { path: '/discover', component: DiscoverHomePage },
    {
      path: /^\/discover\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/,
      component: DiscoverCityStylePage,
      getProps: (m) => ({ citySlug: m[1], styleSlug: m[2] }),
    },
    {
      path: /^\/discover\/([a-z0-9-]+)\/?$/,
      component: DiscoverCityPage,
      getProps: (m) => ({ citySlug: m[1] }),
    },
    // ── Pages vitrines publiques (artistes & flashs) ────────────────────────
    {
      path: /^\/artist\/([a-z0-9-]+)\/?$/,
      component: ArtistPage,
      getProps: (m) => ({ artistSlug: m[1] }),
    },
    {
      path: /^\/flash\/([a-z0-9-]+)\/?$/,
      component: FlashPage,
      getProps: (m) => ({ flashSlug: m[1] }),
    },
  ];

  const matchRoute = () => {
    let pathname = currentPath.split('?')[0];
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.replace(/\/+$/, '');
    }
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
    try {
      sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, currentPath);
    } catch {
      /* quota / privé */
    }
    window.location.href = '/login';
    return <LoginRedirectSkeleton />;
  }

  const Component = route.component;
  const props = match && route.getProps ? route.getProps(match) : {};

  // ErrorBoundary par route : évite un crash complet si une page publique plante
  const pageContent = (
    <ErrorBoundary
      fallback={({ error }) => (
        <div className="min-h-screen bg-neutral-50 dark:bg-[var(--bg-primary)] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl" aria-hidden>
                ⚠️
              </span>
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              Une erreur s&apos;est produite
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              Cette page n&apos;a pas pu s&apos;afficher. Réessayez ou retournez à l&apos;accueil.
            </p>
            {import.meta.env.DEV && error?.message ? (
              <p className="text-left text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 p-3 rounded-lg mb-6 font-mono break-all">
                {error.message}
              </p>
            ) : null}
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
      )}
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  const PageWithGuard = route.needsSupabaseSync ? (
    <SupabaseSyncProvider>{pageContent}</SupabaseSyncProvider>
  ) : (
    pageContent
  );

  const showGlobalOfflineBanner = currentPath !== '/dashboard' && !currentPath.startsWith('/admin');

  return (
    <>
      {showGlobalOfflineBanner ? <OfflineBanner /> : null}
      <Suspense fallback={<FullScreenSpinner />}>{PageWithGuard}</Suspense>
    </>
  );
};

const NotFoundPage: React.FC = () => (
  <div className="landing-scroll bg-neutral-50 flex items-center justify-center px-4">
    <SEO
      title="Page non trouvée (404)"
      description="Cette adresse ne mène nulle part sur InkFlow."
      noindex
      canonical="/404"
      ogImageAlt="InkFlow"
    />
    <div className="text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-neutral-600 mb-8">
        Soit la page a bougé, soit l&apos;URL est fausse.
      </p>
      <a
        href={LANDING_URL}
        className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
      >
        Retour à l'accueil
      </a>
    </div>
  </div>
);

const LandingPage: React.FC = () => (
  <Suspense fallback={<PublicPageLoadingSkeleton />}>
    <LandingEnhanceAI />
  </Suspense>
);

/** Formate une valeur rejetée (Error, Postgrest, objet anonyme) pour logs / toasts lisibles. */
function formatUnhandledRejectionReason(reason: unknown): string {
  if (reason instanceof Error) return reason.message || 'Erreur';
  if (reason == null) return 'Erreur inconnue';
  if (typeof reason === 'string') return reason || 'Erreur';
  if (typeof reason === 'object') {
    const o = reason as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message.trim()) return o.message;
    // Postgrest / erreurs API typiques
    const code = typeof o.code === 'string' ? o.code : '';
    const details = typeof o.details === 'string' ? o.details : '';
    const hint = typeof o.hint === 'string' ? o.hint : '';
    const msg = typeof o.msg === 'string' ? o.msg : '';
    const parts = [code, msg || details || hint].filter(Boolean);
    if (parts.length) return parts.join(' — ');
    try {
      return JSON.stringify(reason).slice(0, 200);
    } catch {
      return 'Erreur (objet non sérialisable)';
    }
  }
  return String(reason);
}

/** Log et affiche un toast sur les promesses rejetées non gérées (détection de bugs en prod). */
const UnhandledRejectionHandler: React.FC = () => {
  const toast = useToast();
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = formatUnhandledRejectionReason(reason);
      if (import.meta.env.DEV) {
        console.error('[unhandledrejection]', reason);
      }
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
      <InkflowThemeProvider>
        <div className="app-root">
          <AuthProvider>
            <AppSplashGate>
              <ToastProvider>
                <LanguageProvider>
                  <UnhandledRejectionHandler />
                  <ProductAnalyticsIdentity />
                  <Router />
                  <ProductNpsPrompt />
                  <CookieConsent />
                  <PWAUpdatePrompt />
                </LanguageProvider>
              </ToastProvider>
            </AppSplashGate>
          </AuthProvider>
        </div>
      </InkflowThemeProvider>
      <PostHogOptIn />
      <VercelAnalyticsOptIn />
    </ErrorBoundary>
  );
};

export default App;
