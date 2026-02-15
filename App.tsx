import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SocialProof } from './components/SocialProof';
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

interface Route {
  path: string | RegExp;
  component: React.ComponentType<any>;
  requiresAuth?: boolean;
  getProps?: (match: RegExpMatchArray) => Record<string, string>;
}

const Router: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const url = new URL(anchor.href);
        window.history.pushState({}, '', url.pathname);
        setCurrentPath(url.pathname);
        window.scrollTo(0, 0);
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
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
    { path: /^\/book\/([a-z0-9-]+)$/, component: PublicBookingPagePro, getProps: (m) => ({ studioSlug: m[1] }) }
  ];

  const matchRoute = () => {
    for (const route of routes) {
      if (typeof route.path === 'string') {
        if (route.path === currentPath) return { route, match: null };
      } else {
        const match = currentPath.match(route.path);
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

  if (route.requiresAuth && !isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  const Component = route.component;
  const props = match && route.getProps ? route.getProps(match) : {};

  return <Component {...props} />;
};

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#fafafa] text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <Navbar scrolled={scrolled} />

      <main className="relative z-10">
        <HeroSection />
        <SocialProof />
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
      <Router />
    </AuthProvider>
  );
};

export default App;
