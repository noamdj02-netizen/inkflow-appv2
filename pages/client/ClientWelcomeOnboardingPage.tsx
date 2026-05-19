/**
 * Onboarding découverte espace client — /client/bienvenue
 * Mobile-first : swipe, clavier ←/→, progression, safe areas.
 * Design aligné CLIENT_DASHBOARD_THEME (SaaS clair, accent bleu).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarDays,
  Heart,
  MessageCircle,
  Shield,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Logo } from '../../components/Logo';
import { CLIENT_DASHBOARD_THEME } from '../../lib/clientDashboardTheme';

const D = CLIENT_DASHBOARD_THEME;

const STEPS = 4;

type SlideAccent = 'blue' | 'emerald' | 'violet';

const ACCENT_RING: Record<SlideAccent, string> = {
  blue: 'ring-blue-500/15 bg-blue-50/90 text-blue-700',
  emerald: 'ring-emerald-500/15 bg-emerald-50/90 text-emerald-800',
  violet: 'ring-blue-500/15 bg-violet-50/90 text-blue-800',
};

const SLIDE_CONTENT: {
  title: string;
  subtitle: string;
  accent: SlideAccent;
  bullets?: { icon: LucideIcon; text: string; accent: SlideAccent }[];
  showHeroMock?: boolean;
}[] = [
  {
    title: 'Ton suivi tatouage, sans la galère',
    subtitle:
      'Retrouve tes rendez-vous, tes messages avec le studio et les infos importantes — au même endroit.',
    accent: 'blue',
    showHeroMock: true,
  },
  {
    title: 'Pourquoi créer un compte ?',
    subtitle: 'Pour que le studio te reconnaisse et que tout soit à jour le jour du tatouage.',
    accent: 'blue',
    bullets: [
      {
        icon: Calendar,
        text: 'Tes prochains RDV — dates et créneaux clairs',
        accent: 'blue',
      },
      {
        icon: MessageCircle,
        text: 'La messagerie avec le studio — moins de pertes sur Instagram',
        accent: 'blue',
      },
      {
        icon: CalendarDays,
        text: 'Ton dossier santé — rempli une fois, utilisé quand il faut',
        accent: 'blue',
      },
    ],
  },
  {
    title: 'Tes données, pour ton tatouage',
    subtitle:
      'Le questionnaire santé aide le studio à te recevoir en sécurité. Tu peux le compléter tranquillement.',
    accent: 'emerald',
    bullets: [
      {
        icon: Sparkles,
        text: 'Profil : prénom, nom, téléphone — pour qu’on te contacte au bon moment',
        accent: 'emerald',
      },
      {
        icon: Shield,
        text: 'Santé : infos utiles au tatoueur avant certaines séances',
        accent: 'emerald',
      },
    ],
  },
  {
    title: 'Crée ton compte en un instant',
    subtitle:
      'On t’envoie un lien par e-mail pour te connecter — pas besoin de mot de passe tout de suite.',
    accent: 'violet',
  },
];

function HeroMockCards() {
  return (
    <div className="relative mt-6 mb-1 select-none pointer-events-none" aria-hidden>
      <div className="relative mx-auto max-w-[280px] sm:max-w-[320px]">
        <div
          className="absolute -right-1 -top-2 w-[88%] rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-md rotate-[2deg] z-0"
          style={{ boxShadow: D.shadow }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-zinc-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-24 rounded-full bg-zinc-200" />
              <div className="h-1.5 w-16 rounded-full bg-zinc-100" />
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100" />
        </div>
        <div
          className="relative z-10 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-lg ring-1 ring-zinc-200/50 -rotate-[1deg]"
          style={{ boxShadow: D.shadowLg }}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Prochain RDV
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: D.accentMuted, color: D.accent }}
            >
              Confirmé
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
              style={{ background: D.accentMuted }}
            >
              <Calendar className="h-5 w-5" style={{ color: D.accent }} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900 truncate">Samedi · 14:30</p>
              <p className="text-xs text-zinc-500 truncate">Flash — bras gauche</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ClientWelcomeOnboardingPage: React.FC = () => {
  const [step, setStep] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const goNext = useCallback(() => {
    setStep((s) => Math.min(STEPS - 1, s + 1));
  }, []);

  const goPrev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const dx = endX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -56) goNext();
    else if (dx > 56) goPrev();
  };

  const isLast = step === STEPS - 1;
  const slide = SLIDE_CONTENT[step]!;

  const progressPct = ((step + 1) / STEPS) * 100;

  return (
    <div
      className="min-h-[100dvh] flex flex-col client-dashboard-shell relative overflow-hidden font-sans text-zinc-900 antialiased"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Fond atmosphère — léger, ne gêne pas le contraste texte */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          background: `linear-gradient(165deg, ${D.pageBg} 0%, #eef2ff 42%, ${D.pageBg} 100%)`,
        }}
      />
      <div
        className="pointer-events-none fixed -top-24 left-1/2 h-[min(55vh,420px)] w-[min(140vw,720px)] -translate-x-1/2 rounded-full opacity-[0.35] blur-3xl -z-10"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${D.accentGlow}, transparent 65%)`,
        }}
        aria-hidden
      />

      <SEO
        title="Bienvenue — Espace client Inkflow"
        description="Découvre ton espace client : rendez-vous, messages et suivi tatouage."
        canonical="/client/bienvenue"
        keywords="espace client tatouage, My Inkflow, onboarding"
        ogImageAlt="Bienvenue espace client Inkflow"
        noindex
      />

      <a
        href="#client-welcome-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-[max(12px,env(safe-area-inset-top))] focus:left-3 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-zinc-900 focus:text-white focus:text-sm focus:font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        Aller au contenu
      </a>

      <header className="relative z-20 flex-shrink-0 border-b border-zinc-200/70 bg-white/85 pb-3 pt-[max(12px,env(safe-area-inset-top))] shadow-sm backdrop-blur-md">
        <div className="flex w-full items-center justify-between gap-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-6 sm:pr-6">
          {/* Bloc marque à gauche : retour + logo + titres (alignés start) */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={step === 0 ? undefined : goPrev}
              disabled={step === 0}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-1.5 py-2 text-sm font-medium text-zinc-600 min-h-[44px] min-w-[44px] justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] motion-reduce:transition-none sm:px-2 sm:justify-start ${
                step === 0
                  ? 'invisible pointer-events-none'
                  : 'hover:bg-zinc-100/90 hover:text-zinc-900'
              }`}
              aria-label="Écran précédent"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden font-medium sm:inline">Retour</span>
            </button>
            <div className="flex min-w-0 items-center gap-2.5 text-left">
              <Logo className="shrink-0 rounded-xl shadow-sm ring-1 ring-black/[0.06]" size="sm" />
              <div className="min-w-0 leading-tight">
                <span className="block truncate text-[15px] font-bold tracking-[-0.02em] text-zinc-900 sm:text-base">
                  My Inkflow
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Espace client
                </span>
              </div>
            </div>
          </div>
          <a
            href="/client"
            className="inline-flex shrink-0 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-blue-600 min-h-[44px] transition-colors hover:bg-blue-50/90 hover:text-blue-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            Connexion
          </a>
        </div>
      </header>

      <main
        id="client-welcome-main"
        tabIndex={-1}
        className="relative z-10 flex min-h-0 flex-1 flex-col outline-none"
        aria-live="polite"
        aria-atomic="true"
        aria-labelledby="client-welcome-title"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-5 sm:px-6 sm:py-8">
          <article
            key={step}
            className="animate-in fade-in duration-300 motion-reduce:animate-none rounded-[1.35rem] border border-zinc-200/90 bg-white/95 shadow-xl ring-1 ring-zinc-200/40 backdrop-blur-sm sm:rounded-3xl overflow-hidden"
            style={{ boxShadow: D.shadowLg }}
          >
            {/* Progression */}
            <div className="px-1 pt-1">
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100"
                role="progressbar"
                aria-valuenow={step + 1}
                aria-valuemin={1}
                aria-valuemax={STEPS}
                aria-label={`Étape ${step + 1} sur ${STEPS}`}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  style={{
                    width: `${progressPct}%`,
                    background: `linear-gradient(90deg, ${D.accent}, #6366f1)`,
                  }}
                />
              </div>
            </div>

            <div
              className={`border-l-[3px] px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6 ${
                slide.accent === 'blue'
                  ? 'border-l-blue-500'
                  : slide.accent === 'emerald'
                    ? 'border-l-emerald-500'
                    : 'border-l-violet-500'
              }`}
            >
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Étape {step + 1} / {STEPS}
              </p>
              <h1
                id="client-welcome-title"
                className="text-2xl font-bold leading-[1.2] tracking-[-0.02em] text-zinc-900 sm:text-[1.75rem] sm:leading-[1.15]"
              >
                {slide.title}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base [text-wrap:pretty]">
                {slide.subtitle}
              </p>

              {slide.showHeroMock && <HeroMockCards />}

              {slide.bullets && (
                <ul className="mt-7 space-y-3">
                  {slide.bullets.map((b) => {
                    const Icon = b.icon;
                    const ring = ACCENT_RING[b.accent];
                    return (
                      <li
                        key={b.text}
                        className={`flex gap-3 rounded-2xl border px-3.5 py-3.5 sm:px-4 ring-1 ${ring} border-zinc-100/80`}
                      >
                        <span
                          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/80 shadow-sm"
                          style={{ background: D.contentCardBg }}
                        >
                          <Icon className="h-5 w-5" style={{ color: D.accent }} aria-hidden />
                        </span>
                        <span className="text-sm leading-snug text-zinc-800 pt-0.5">{b.text}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {isLast && (
                <div className="mt-8 space-y-3">
                  <div className="flex items-start gap-3 rounded-2xl border border-blue-200/80 bg-violet-50/60 px-4 py-3 text-sm text-blue-950">
                    <Heart
                      className="h-5 w-5 shrink-0 text-blue-600 mt-0.5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <p className="leading-snug">
                      Pas de mot de passe tout de suite : tu recevras un{' '}
                      <strong>lien sécurisé</strong> par e-mail pour te connecter.
                    </p>
                  </div>
                  <a
                    href="/client?from=onboarding"
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white shadow-md transition-all hover:opacity-[0.96] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
                    style={{
                      background: D.accent,
                      boxShadow: `0 8px 28px ${D.accentShadow}`,
                    }}
                  >
                    Créer mon compte
                    <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
                  </a>
                  <a
                    href="/client"
                    className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50"
                  >
                    J’ai déjà un compte
                  </a>
                  <p className="pt-1 text-center text-[11px] leading-relaxed text-zinc-400">
                    En continuant, tu acceptes nos{' '}
                    <a
                      href="/conditions-utilisation"
                      className="font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
                    >
                      conditions
                    </a>{' '}
                    et notre{' '}
                    <a
                      href="/politique-confidentialite"
                      className="font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
                    >
                      politique de confidentialité
                    </a>
                    .
                  </p>
                </div>
              )}
            </div>
          </article>

          <p className="mt-4 text-center text-[11px] text-zinc-400 sm:hidden">
            Glisse à gauche ou à droite, ou utilise les flèches du clavier.
          </p>
        </div>

        {!isLast && (
          <div className="flex-shrink-0 space-y-5 px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-2 sm:px-6">
            <div
              className="mx-auto flex max-w-lg justify-center gap-2.5"
              role="tablist"
              aria-label="Progression"
            >
              {Array.from({ length: STEPS }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === step}
                  aria-label={`Aller à l’écran ${i + 1}`}
                  onClick={() => setStep(i)}
                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 ${
                    i === step ? 'px-4 py-2' : 'p-2 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span
                    className={`block h-2 rounded-full transition-all ${
                      i === step ? 'w-10 bg-blue-600' : 'w-2 bg-zinc-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={goNext}
              className="mx-auto flex min-h-[52px] w-full max-w-lg items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white shadow-md transition-all hover:opacity-[0.96] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
              style={{
                background: D.accent,
                boxShadow: `0 6px 24px ${D.accentShadow}`,
              }}
            >
              {step === 0 ? 'Découvrir comment ça marche' : 'Continuer'}
              <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
            </button>
          </div>
        )}

        {isLast && (
          <div
            className="mx-auto flex max-w-lg justify-center gap-2.5 px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-2 sm:px-6"
            role="tablist"
            aria-label="Progression"
          >
            {Array.from({ length: STEPS }).map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-10 bg-blue-600' : 'w-2 bg-zinc-300'
                }`}
                aria-hidden
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
