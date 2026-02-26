import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Logo } from '../components/Logo';
import { Navbar } from '../components/Navbar';
import {
  DollarSign, TrendingUp, Calendar, Clock, Users, CreditCard,
  ChevronLeft, ChevronRight, Sparkles, ArrowRight, Play,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animated Counter — défilement des chiffres sur 2s                  */
/* ------------------------------------------------------------------ */
const AnimatedCounter: React.FC<{ value: number; suffix?: string; duration?: number; className?: string }> = ({
  value,
  suffix = '€',
  duration = 2000,
  className = '',
}) => {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    setDisplay(0);
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2); // easeOutQuad
      setDisplay(Math.round(value * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <span className={className}>
      {display.toLocaleString('fr-FR')}{suffix}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Curseur fantôme — simule une action humaine                        */
/* ------------------------------------------------------------------ */
const PhantomCursor: React.FC<{
  target: { x: number; y: number } | null;
  visible: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}> = ({ target, visible, containerRef }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!target || !containerRef.current || !visible) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = rect.left + (rect.width * target.x);
    const y = rect.top + (rect.height * target.y);

    setPos({ x: x - 16, y: y - 16 });
  }, [target, visible, containerRef]);

  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-[100] transition-all duration-700 ease-out"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="relative">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-800/90 bg-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.12)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neutral-800" />
      </div>
    </div>
  );
};

/* Positions cibles du curseur (x, y en % du conteneur) */
const CURSOR_TARGETS: Record<number, { x: number; y: number }> = {
  0: { x: 0.25, y: 0.35 },
  1: { x: 0.5, y: 0.25 },
  2: { x: 0.3, y: 0.4 },
  3: { x: 0.7, y: 0.75 },
  4: { x: 0.5, y: 0.5 },
};

/* ------------------------------------------------------------------ */
/*  Focusable Card — opacity + scale + glow selon focus                */
/* ------------------------------------------------------------------ */
const Focusable: React.FC<{
  focused: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ focused, children, className = '' }) => (
  <div
    className={`transition-all duration-500 ease-out ${focused ? 'opacity-100 scale-[1.02] ring-2 ring-amber-400/50 shadow-[0_4px_24px_rgba(0,0,0,0.06)]' : 'opacity-60 scale-100'} ${className}`}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Scènes avec contenu dynamique et focus                             */
/* ------------------------------------------------------------------ */
const SCENE_DURATION_MS = 4500;
const TRANSITION_MS = 400;

interface SceneConfig {
  id: string;
  title: string;
  subtitle: string;
  voiceover: string;
  isOutro?: boolean;
  focusIndex: number;
  renderContent: (focusIndex: number, sceneIndex: number) => React.ReactNode;
}

const createScenes = (): SceneConfig[] => [
  {
    id: 'dashboard',
    title: 'Vue d\'ensemble',
    subtitle: 'Votre journée en un coup d\'œil',
    voiceover: 'Votre studio, piloté depuis un seul écran.',
    focusIndex: 0,
    renderContent: (focusIndex) => (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Focusable focused={focusIndex === 0} className="col-span-2 lg:col-span-3">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/80 shadow-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 text-emerald-700 text-sm font-semibold rounded-full mb-4 block border border-emerald-500/25">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              En cours • 14:00
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1">Lucas M.</h3>
            <p className="text-sm sm:text-base text-neutral-600 mb-6">Bras Japonais - Carpe Koï</p>
            <div className="flex gap-4">
              <div className="flex-1 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100">
                <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide">Acompte</span>
                <span className="text-base font-bold text-emerald-600">Payé (50€)</span>
              </div>
              <div className="flex-1 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100">
                <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide">Reste</span>
                <span className="text-base font-bold text-neutral-900">350€</span>
              </div>
            </div>
          </div>
        </Focusable>
        <Focusable focused={focusIndex === 1}>
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-amber-500/30 shadow-sm">
            <DollarSign className="w-6 h-6 text-amber-500/80 mb-3" />
            <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">Revenue (Aujourd&apos;hui)</div>
            <div className="text-2xl sm:text-3xl font-bold mt-1 text-amber-600">450€</div>
            <div className="text-emerald-600 text-sm flex items-center gap-2 mt-3">
              <TrendingUp className="w-4 h-4" /> +120€ vs hier
            </div>
          </div>
        </Focusable>
        <Focusable focused={focusIndex === 2}>
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/80 shadow-sm">
            <Calendar className="w-6 h-6 text-amber-500/80 mb-3" />
            <div className="text-xs font-bold text-amber-600 mb-3 uppercase tracking-wide">Agenda</div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-neutral-50 rounded-xl px-3 py-2.5 border border-neutral-100">
                <Clock className="w-4 h-4 text-amber-500/80" />
                <span className="text-sm font-semibold text-neutral-900">11:00 Lucas M.</span>
              </div>
              <div className="flex gap-2">
                {[12, 13, 14, 15, 16].map((d, i) => (
                  <div key={d} className={`flex-1 min-w-[36px] h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${i === 1 ? 'bg-amber-500/20 text-amber-700 border border-amber-500/30' : 'bg-neutral-50 text-neutral-500 border border-neutral-100'}`}>{d}</div>
                ))}
              </div>
            </div>
          </div>
        </Focusable>
      </div>
    ),
  },
  {
    id: 'revenue',
    title: 'Revenus',
    subtitle: 'Suivez vos revenus en temps réel',
    voiceover: 'Suivez vos revenus en temps réel.',
    focusIndex: 0,
    renderContent: (focusIndex, sceneIndex) => (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Focusable focused={focusIndex === 0} className="col-span-2 lg:col-span-3">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-amber-500/25 shadow-sm">
            <DollarSign className="w-8 h-8 text-amber-500/70 mb-4" />
            <div className="text-sm text-neutral-500 font-semibold uppercase tracking-wide">Ce mois</div>
            <div className="text-4xl sm:text-5xl font-bold mt-2 text-amber-600">
              <AnimatedCounter key={sceneIndex} value={2340} duration={2000} />
            </div>
            <div className="text-emerald-600 text-base flex items-center gap-2 mt-4">
              <TrendingUp className="w-5 h-5" /> +18% vs mois dernier
            </div>
          </div>
        </Focusable>
        <Focusable focused={focusIndex === 1}>
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Aujourd&apos;hui</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              <AnimatedCounter key={`today-${sceneIndex}`} value={450} duration={1800} />
            </div>
          </div>
        </Focusable>
        <Focusable focused={focusIndex === 2}>
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Cette semaine</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              <AnimatedCounter key={`week-${sceneIndex}`} value={1120} duration={2000} />
            </div>
          </div>
        </Focusable>
      </div>
    ),
  },
  {
    id: 'clients',
    title: 'CRM Clients',
    subtitle: 'Historique complet des clients',
    voiceover: 'Ne perdez plus jamais le fil d\'un projet.',
    focusIndex: 0,
    renderContent: (focusIndex) => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Focusable focused={focusIndex === 0}>
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm flex items-center gap-4">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-neutral-100" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-neutral-900">Lucas M.</div>
              <div className="text-sm text-neutral-600">3 tatouages • Prochain RDV 14:00</div>
            </div>
            <span className="text-sm font-semibold text-emerald-700 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/25">Payé</span>
          </div>
        </Focusable>
        <Focusable focused={focusIndex === 1}>
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm flex items-center gap-4">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop" alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-neutral-100" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-neutral-900">Marie L.</div>
              <div className="text-sm text-neutral-600">1 tatouage • Prochain RDV 16:30</div>
            </div>
            <span className="text-sm font-semibold text-amber-700 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/25">En attente</span>
          </div>
        </Focusable>
        <div className="col-span-2 bg-neutral-50 rounded-2xl p-4 border border-neutral-100 flex items-center gap-3 opacity-80">
          <Users className="w-6 h-6 text-amber-500/80" />
          <span className="text-sm font-semibold text-neutral-600">12 clients ce mois</span>
        </div>
      </div>
    ),
  },
  {
    id: 'paiements',
    title: 'Paiements Stripe',
    subtitle: 'Acomptes automatiques',
    voiceover: 'Sécurisez vos rendez-vous avec les acomptes Stripe.',
    focusIndex: 2,
    renderContent: (focusIndex) => (
      <div className="space-y-4">
        <Focusable focused={focusIndex === 0}>
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold text-neutral-900">Carpe Koï - Lucas M.</span>
              <span className="text-base font-bold text-emerald-600">50€</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <CreditCard className="w-4 h-4" /> Acompte Stripe • Il y a 2h
            </div>
          </div>
        </Focusable>
        <Focusable focused={focusIndex === 1}>
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold text-neutral-900">Mandala - Sophie D.</span>
              <span className="text-base font-bold text-neutral-900">180€</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <CreditCard className="w-4 h-4" /> Complet • Hier
            </div>
          </div>
        </Focusable>
        <Focusable focused={focusIndex === 2}>
          <div className="animate-demo-slide-bounce bg-emerald-500/15 rounded-2xl p-4 border border-emerald-500/30 flex items-center gap-3 ring-2 ring-emerald-500/20 shadow-sm">
            <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-emerald-700">Nouveau paiement d&apos;acompte reçu : 50€</span>
          </div>
        </Focusable>
      </div>
    ),
  },
  {
    id: 'galerie',
    title: 'Galerie Flash',
    subtitle: 'Vos clients réservent en 2 clics',
    voiceover: 'Mettez vos flashs en valeur.',
    focusIndex: 1,
    renderContent: (focusIndex) => (
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: 'Iris floral', price: '180 €', src: '/gallery/iris-floral.png', i: 0 },
          { name: 'Léopard', price: '150 €', src: '/gallery/leopard.png', i: 1 },
          { name: 'Carpe Koï', price: '220 €', src: '/gallery/carpe-koi.png', i: 2 },
        ].map((f) => (
          <Focusable key={f.name} focused={focusIndex === f.i}>
            <div className="rounded-2xl overflow-hidden border border-neutral-200/80 bg-white shadow-sm transition-all duration-300 hover:scale-[1.02]">
              <div className="h-32 sm:h-40 bg-neutral-100 overflow-hidden">
                <img src={f.src} alt={f.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold text-neutral-900 truncate">{f.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold text-amber-600">{f.price}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/25">Dispo</span>
                </div>
              </div>
            </div>
          </Focusable>
        ))}
      </div>
    ),
  },
  {
    id: 'outro',
    title: 'Outro',
    subtitle: '',
    voiceover: 'Testez la démo interactive sur ink-flow.me',
    isOutro: true,
    focusIndex: 0,
    renderContent: () => (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
        <h2 className="animate-demo-fade-up text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-8 tracking-tight">
          Gagnez 5 heures par semaine
        </h2>
        <a
          href="/signup"
          className="group relative overflow-hidden inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-2xl font-semibold text-base hover:bg-neutral-800 transition-colors duration-300 shadow-lg"
        >
          <span className="absolute inset-0 animate-demo-shine overflow-hidden rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />
          <span className="relative z-10">Commencer gratuitement</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform relative z-10" />
        </a>
        <p className="text-sm text-neutral-500 mt-6 font-mono animate-demo-fade-up" style={{ animationDelay: '0.2s' }}>ink-flow.me</p>
      </div>
    ),
  },
];

const DEMO_SCENES = createScenes();

export const DemoPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [cursorVisible, setCursorVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const simulatorRef = useRef<HTMLDivElement>(null);

  const scene = DEMO_SCENES[currentIndex];
  const isOutro = (scene as { isOutro?: boolean }).isOutro;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => setScrolled(el.scrollTop > 50);
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const advanceScene = useCallback(() => {
    setTransitionPhase('out');
    setCursorVisible(false);

    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % DEMO_SCENES.length);
      setTransitionPhase('in');
      setCursorVisible(true);

      setTimeout(() => setTransitionPhase('idle'), TRANSITION_MS);
    }, TRANSITION_MS);
  }, []);

  useEffect(() => {
    const timer = setInterval(advanceScene, SCENE_DURATION_MS);
    return () => clearInterval(timer);
  }, [advanceScene]);

  const goTo = (dir: 1 | -1) => {
    setTransitionPhase('out');
    setCursorVisible(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i + dir + DEMO_SCENES.length) % DEMO_SCENES.length);
      setTransitionPhase('in');
      setCursorVisible(true);
      setTimeout(() => setTransitionPhase('idle'), TRANSITION_MS);
    }, TRANSITION_MS);
  };

  const contentOpacity = transitionPhase === 'out' ? 0 : 1;
  const contentTranslate = transitionPhase === 'out' ? -16 : transitionPhase === 'in' ? 16 : 0;

  return (
    <div ref={scrollRef} className="landing-scroll bg-neutral-50 text-neutral-900 min-h-screen" data-theme="light">
      <Navbar scrolled={scrolled} />

      <PhantomCursor
        target={isOutro ? null : CURSOR_TARGETS[currentIndex] ?? null}
        visible={cursorVisible && !isOutro}
        containerRef={simulatorRef}
      />

      <main className="pt-24 sm:pt-28 pb-16">
        {/* Hero — style Apple : épuré, spacieux */}
        <section className="px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-amber-500/25">
              <Play className="w-4 h-4" />
              Démo interactive
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight text-neutral-900">
              Découvrez InkFlow en action
            </h1>
            <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto">
              Une visite guidée du dashboard pour gérer vos réservations, paiements Stripe, galerie Flash et CRM.
            </p>
          </div>
        </section>

        {/* Zone simulateur — carte blanche type Apple */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-4xl mx-auto">
            <div
              ref={simulatorRef}
              className="relative rounded-3xl overflow-hidden bg-white border border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)]"
            >
              {/* Header simulateur */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/80">
                <div className="flex items-center gap-3">
                  <Logo size="sm" />
                  <div>
                    <div className="text-sm font-bold text-neutral-900">InkFlow</div>
                    <div className="text-xs text-neutral-500 font-medium">{scene.title}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-700 text-xs font-semibold rounded-full border border-amber-500/25">
                    <Sparkles className="w-3.5 h-3.5" /> Démo
                  </span>
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                  />
                </div>
              </div>

              {/* Contenu animé */}
              <div
                className={`p-6 sm:p-8 lg:p-10 transition-all duration-300 ease-out ${
                  isOutro
                    ? 'bg-gradient-to-b from-neutral-50 to-white'
                    : 'bg-white'
                }`}
              >
                {!isOutro && (
                  <p className="text-sm text-neutral-500 mb-6">{scene.subtitle}</p>
                )}

                <div
                  className="min-h-[320px] transition-all duration-300 ease-out"
                  style={{
                    opacity: contentOpacity,
                    transform: `translateY(${contentTranslate}px)`,
                  }}
                >
                  {scene.renderContent(scene.focusIndex, currentIndex)}
                </div>

                {scene.voiceover && (
                  <p
                    className={`mt-6 text-center text-sm font-medium transition-opacity duration-300 ${isOutro ? 'text-neutral-500' : 'text-neutral-500'}`}
                    style={{ opacity: contentOpacity }}
                  >
                    « {scene.voiceover} »
                  </p>
                )}

                {!isOutro && (
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => goTo(-1)}
                        className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-900"
                        aria-label="Scène précédente"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => goTo(1)}
                        className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-900"
                        aria-label="Scène suivante"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      {DEMO_SCENES.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 min-w-[24px] rounded-full transition-all duration-500 ${
                            i === currentIndex ? 'bg-amber-500' : i < currentIndex ? 'bg-amber-400/60' : 'bg-neutral-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-neutral-900">Prêt à lancer votre studio ?</h2>
            <p className="text-neutral-600 mb-8">14 jours d&apos;essai gratuit.</p>
            <a
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-2xl font-semibold text-base hover:bg-neutral-800 transition-all duration-300 shadow-lg"
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};
