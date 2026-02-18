import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { SupabaseSyncProvider } from './contexts/SupabaseSyncContext';
import { initTheme } from './hooks/useTheme';

initTheme();
import { Logo } from './components/Logo';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SocialProof } from './components/SocialProof';
import { FeaturesKey } from './components/FeaturesKey';
import { FeaturesBento } from './components/FeaturesBento';
import { PricingSection } from './components/PricingSection';
import { ProcessSection } from './components/ProcessSection';
import { FAQ } from './components/FAQ';
import { CTAFinal } from './components/CTAFinal';
import { Footer } from './components/Footer';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { PublicStudioPagePro } from './pages/public/PublicStudioPagePro';
import { PublicBookingPagePro } from './pages/public/PublicBookingPagePro';
import { ConsentPage } from './pages/public/ConsentPage';
import { PublicMessagePage } from './pages/public/PublicMessagePage';

interface Route {
  path: string | RegExp;
  component: React.ComponentType<any>;
  requiresAuth?: boolean;
  getProps?: (match: RegExpMatchArray) => Record<string, string>;
}

const FullScreenSpinner: React.FC = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
    <Logo size="lg" className="rounded-2xl" />
    <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
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

  const routes: Route[] = [
    { path: '/', component: LandingPage },
    { path: '/login', component: LoginPage },
    { path: '/signup', component: SignupPage },
    { path: '/dashboard', component: DashboardPage, requiresAuth: true },
    { path: '/auth/callback', component: AuthCallbackPage },
    { path: '/auth/update-password', component: UpdatePasswordPage },
    { path: /^\/studio\/([a-z0-9-]+)$/, component: PublicStudioPagePro, getProps: (m) => ({ studioSlug: m[1] }) },
    { path: /^\/book\/([a-z0-9-]+)$/, component: PublicBookingPagePro, getProps: (m) => ({ studioSlug: m[1] }) },
    { path: /^\/consent\/([a-z0-9_-]+)$/, component: ConsentPage, getProps: (m) => ({ consentId: m[1] }) },
    { path: /^\/messages\/([a-z0-9_-]+)$/, component: PublicMessagePage, getProps: (m) => ({ threadId: m[1] }) }
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
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" className="rounded-2xl" />
          <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          <p className="text-neutral-600 text-sm">Redirection...</p>
        </div>
      </div>
    );
  }

  const Component = route.component;
  const props = match && route.getProps ? route.getProps(match) : {};

  return <Component {...props} />;
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
        <SocialProof />
        <FeaturesKey />
        <FeaturesBento />
        <PricingSection />
        <ProcessSection />
        <FAQ />
        <CTAFinal />
      </main>

      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <SupabaseSyncProvider>
          <Router />
        </SupabaseSyncProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
