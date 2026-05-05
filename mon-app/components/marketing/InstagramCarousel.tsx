'use client';

import type { SVGProps } from 'react';
import { useCallback, useRef, useState } from 'react';

/** Tokens alignés frame Figma « Template - Social - Set 14- 1 » (345:84) — mode clair marketing */
const ink = {
  fg: '#242424',
  muted: '#6b7280',
  blue: '#0047ff',
  blueSoft: 'rgba(0, 71, 255, 0.1)',
  surfaceCard: '#f8f9fa',
  border: '#f3f4f6',
  green: '#22c55e',
  pillBg: '#f3f4f6',
  pillFg: '#6b7280',
  cta: '#242424',
} as const;

interface SlideBase {
  id: string;
}

export type InstagramCarouselSlide =
  | (SlideBase & {
      kind: 'hero';
      titleLine1: string;
      titleLine2Accent: string;
      lead: string[];
    })
  | (SlideBase & {
      kind: 'pain';
      title: string;
      body: string;
      notifications: { label: string; preview: string }[];
    })
  | (SlideBase & {
      kind: 'solution';
      title: string;
      badge: string;
      headline: string;
      headlineMuted: string;
      bullets: { title: string; description: string }[];
    })
  | (SlideBase & {
      kind: 'crm';
      title: string;
      name: string;
      project: string;
      body: string;
    })
  | (SlideBase & {
      kind: 'automation';
      title: string;
      body: string;
    })
  | (SlideBase & {
      kind: 'revenue';
      title: string;
      label: string;
      amount: string;
      delta: string;
    })
  | (SlideBase & {
      kind: 'cta';
      title: string;
      buttonLabel: string;
      footer: string;
    });

const SLIDES: InstagramCarouselSlide[] = [
  {
    id: '1',
    kind: 'hero',
    titleLine1: 'TON RYTHME',
    titleLine2Accent: 'TON AGENDA',
    lead: [
      'Prenez le contrôle de votre temps avec une',
      'interface conçue pour les professionnels',
      'exigeants.',
    ],
  },
  {
    id: '2',
    kind: 'pain',
    title: 'Trop de temps dans tes DM ?',
    body: 'Entre les projets, les arrhes et les relances, ton art passe au second plan.',
    notifications: [
      { label: 'DM', preview: 'Nouveau message — acompte en attente' },
      { label: 'DM', preview: 'Rappel : 3 demandes sans réponse' },
      { label: 'DM', preview: 'Peux-tu confirmer le créneau mardi ?' },
    ],
  },
  {
    id: '3',
    kind: 'solution',
    title: 'INKFLOW : TON STUDIO DIGITAL.',
    badge: 'Centralisation totale',
    headline: 'Demandes, RDV,',
    headlineMuted: 'clients :',
    bullets: [
      {
        title: 'Flux automatisé',
        description: 'Synchronisation instantanée avec tous vos calendriers.',
      },
      {
        title: 'CRM intégré',
        description: 'Historique client accessible en un clic pendant vos RDV.',
      },
    ],
  },
  {
    id: '4',
    kind: 'crm',
    title: 'CRM INTÉGRÉ.',
    name: 'Nathan Simon',
    project: 'Projet : Poignet constellation',
    body: "L'historique complet accessible en un clic.",
  },
  {
    id: '5',
    kind: 'automation',
    title: 'FLUX AUTOMATISÉ.',
    body: 'Zéro doublon. Synchro instantanée.',
  },
  {
    id: '6',
    kind: 'revenue',
    title: 'PILOTE TON BUSINESS.',
    label: 'Revenu du mois',
    amount: '6 198 €',
    delta: '+18 % vs mois dernier',
  },
  {
    id: '7',
    kind: 'cta',
    title: 'PRÊT À PASSER AU NIVEAU SUPÉRIEUR ?',
    buttonLabel: "Démarrer l'expérience →",
    footer: 'Lien en bio',
  },
];

function IconZap(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={props.className} {...props}>
      <path
        d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={props.className} {...props}>
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm12-4a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm0 8v2M9 7H7m8 0h-2"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

function SlideChrome(props: {
  step: number;
  total: number;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  const { step, total, left, right } = props;
  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white sm:flex-row"
      style={{ color: ink.fg }}
    >
      <div className="flex w-full flex-1 flex-col sm:w-1/2 sm:max-w-[540px]">{left}</div>
      <div
        className="relative hidden min-h-[220px] w-full flex-1 sm:block sm:min-h-0"
        style={{ minWidth: 0 }}
      >
        {right}
      </div>
    </div>
  );
}

function Header({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-between px-10 pt-10">
      <span className="text-2xl font-black tracking-tight" style={{ color: ink.fg }}>
        INKFLOW
      </span>
      <span
        className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest"
        style={{ background: ink.pillBg, color: ink.pillFg }}
      >
        {step}/{total} Step
      </span>
    </div>
  );
}

function FooterBar() {
  return (
    <div className="mt-auto flex items-center justify-between px-10 pb-10 pt-6">
      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#9ca3af' }}>
        <span aria-hidden>🔗</span>
        ink-flow.me
      </div>
      <div className="flex gap-4 text-xs" style={{ color: '#9ca3af' }} aria-hidden>
        <span>♥</span>
        <span>💬</span>
        <span>↗</span>
      </div>
    </div>
  );
}

function VisualPlaceholderHero() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: 'linear-gradient(145deg, #eef2ff 0%, #f9fafb 45%, #e5e7eb 100%)',
      }}
    >
      <div className="relative w-[78%] max-w-[420px] rounded-[2rem] border bg-white p-4 shadow-lg" style={{ borderColor: ink.border }}>
        <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide" style={{ color: ink.muted }}>
          <span>Planning</span>
          <span className="rounded-full px-2 py-0.5" style={{ background: ink.pillBg }}>
            Aujourd’hui
          </span>
        </div>
        <div className="space-y-2">
          {['15:00 — Nathan Simon', '16:30 — Flash bras', '18:00 — Retouche'].map((row) => (
            <div
              key={row}
              className="rounded-xl border px-3 py-2 text-xs font-semibold"
              style={{ borderColor: ink.border, color: ink.fg }}
            >
              {row}
            </div>
          ))}
        </div>
        <div
          className="absolute -bottom-6 -right-4 w-[42%] rounded-[1.25rem] border bg-white p-3 shadow-md"
          style={{ borderColor: ink.border }}
        >
          <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: ink.muted }}>
            Revenu du mois
          </p>
          <p className="text-lg font-black" style={{ color: ink.fg }}>
            6 198 €
          </p>
          <p className="text-[10px] font-bold" style={{ color: ink.green }}>
            ↗ +18 %
          </p>
        </div>
      </div>
    </div>
  );
}

function VisualPain() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #fee2e2 0%, #f9fafb 60%, #fff 100%)' }}
    >
      <div className="text-center text-sm font-medium" style={{ color: ink.muted }}>
        Chaos bien rangé… dans Inkflow.
      </div>
    </div>
  );
}

function VisualAbstract() {
  return (
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f9fafb 50%, #ffffff 100%)' }}
    />
  );
}

function SlideHero({ slide, step, total }: { slide: Extract<InstagramCarouselSlide, { kind: 'hero' }>; step: number; total: number }) {
  return (
    <SlideChrome
      step={step}
      total={total}
      left={
        <div className="flex min-h-0 flex-1 flex-col">
          <Header step={step} total={total} />
          <div className="mt-8 space-y-6 px-10">
            <h2 className="text-[clamp(2rem,6vw,3.25rem)] font-black leading-[1.05] tracking-tight">
              <span className="block">{slide.titleLine1}</span>
              <span className="block" style={{ color: ink.blue }}>
                {slide.titleLine2Accent}
              </span>
            </h2>
            <div className="max-w-[400px] space-y-0 text-lg leading-7" style={{ color: ink.muted }}>
              {slide.lead.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
          <div className="mt-8 flex-1 px-10">
            <div
              className="rounded-[2rem] p-10"
              style={{ background: ink.surfaceCard }}
            >
              <div className="space-y-4">
                <div
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm"
                  style={{ borderColor: ink.border, background: '#fff', color: '#4b5563' }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: ink.green }} />
                  Centralisation totale
                </div>
                <h3 className="text-3xl font-bold leading-tight sm:text-[38px] sm:leading-[1.1]">
                  <span className="block">Demandes, RDV,</span>
                  <span className="block">clients :</span>
                  <span className="block italic text-gray-400">un seul endroit.</span>
                </h3>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-1">
                <article
                  className="flex gap-4 rounded-2xl border bg-white p-5 shadow-sm"
                  style={{ borderColor: ink.border }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: ink.blueSoft, color: ink.blue }}
                  >
                    <IconZap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold">Flux automatisé</p>
                    <p className="mt-1 text-sm leading-snug" style={{ color: ink.muted }}>
                      Synchronisation instantanée avec tous vos calendriers.
                    </p>
                  </div>
                </article>
                <article
                  className="flex gap-4 rounded-2xl border bg-white p-5 shadow-sm"
                  style={{ borderColor: ink.border }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: ink.blueSoft, color: ink.blue }}
                  >
                    <IconUsers className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold">CRM intégré</p>
                    <p className="mt-1 text-sm leading-snug" style={{ color: ink.muted }}>
                      Historique client accessible en un clic pendant vos RDV.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </div>
          <div className="px-10 pt-8">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-2xl py-6 text-lg font-black text-white shadow-lg transition active:scale-[0.98]"
              style={{ background: ink.cta, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.08)' }}
            >
              Démarrer l’expérience
              <span aria-hidden>→</span>
            </button>
          </div>
          <FooterBar />
        </div>
      }
      right={<VisualPlaceholderHero />}
    />
  );
}

function SlidePain({ slide, step, total }: { slide: Extract<InstagramCarouselSlide, { kind: 'pain' }>; step: number; total: number }) {
  return (
    <SlideChrome
      step={step}
      total={total}
      left={
        <div className="flex min-h-0 flex-1 flex-col">
          <Header step={step} total={total} />
          <div className="mt-10 space-y-6 px-10">
            <h2 className="text-3xl font-black leading-tight sm:text-4xl">{slide.title}</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              {slide.notifications.map((n, i) => (
                <div
                  key={n.preview}
                  className="relative flex-1 rounded-2xl border bg-white p-4 shadow-sm sm:min-w-[200px] sm:max-w-[220px]"
                  style={{ borderColor: ink.border, transform: `rotate(${i === 0 ? -2 : i === 1 ? 1 : -1}deg)` }}
                >
                  <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ background: '#ef4444' }}>
                    {slide.notifications.length - i}
                  </div>
                  <p className="text-xs font-black" style={{ color: ink.blue }}>
                    {n.label}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-snug" style={{ color: ink.fg }}>
                    {n.preview}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-lg leading-relaxed" style={{ color: ink.muted }}>
              {slide.body}
            </p>
          </div>
          <FooterBar />
        </div>
      }
      right={<VisualPain />}
    />
  );
}

function SlideSolution({ slide, step, total }: { slide: Extract<InstagramCarouselSlide, { kind: 'solution' }>; step: number; total: number }) {
  return (
    <SlideChrome
      step={step}
      total={total}
      left={
        <div className="flex min-h-0 flex-1 flex-col">
          <Header step={step} total={total} />
          <div className="mt-10 space-y-6 px-10">
            <h2 className="text-2xl font-black leading-tight sm:text-3xl">{slide.title}</h2>
            <div className="rounded-[2rem] p-10" style={{ background: ink.surfaceCard }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm" style={{ borderColor: ink.border, background: '#fff', color: '#4b5563' }}>
                <span className="h-2 w-2 rounded-full" style={{ background: ink.green }} />
                {slide.badge}
              </div>
              <h3 className="text-3xl font-bold leading-tight sm:text-[34px]">
                <span className="block">{slide.headline}</span>
                <span className="block text-gray-900">{slide.headlineMuted}</span>
                <span className="mt-1 block italic text-gray-400">un seul endroit.</span>
              </h3>
              <ul className="mt-8 grid gap-4 sm:grid-cols-1">
                {slide.bullets.map((b, idx) => {
                  const Icon = idx === 0 ? IconZap : IconUsers;
                  return (
                    <li
                      key={b.title}
                      className="flex gap-4 rounded-2xl border bg-white p-5 shadow-sm"
                      style={{ borderColor: ink.border }}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: ink.blueSoft, color: ink.blue }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold">{b.title}</p>
                        <p className="mt-1 text-sm leading-snug" style={{ color: ink.muted }}>
                          {b.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <FooterBar />
        </div>
      }
      right={<VisualAbstract />}
    />
  );
}

function SlideCrm({ slide, step, total }: { slide: Extract<InstagramCarouselSlide, { kind: 'crm' }>; step: number; total: number }) {
  return (
    <SlideChrome
      step={step}
      total={total}
      left={
        <div className="flex min-h-0 flex-1 flex-col">
          <Header step={step} total={total} />
          <div className="mt-10 px-10">
            <h2 className="text-3xl font-black">{slide.title}</h2>
            <div
              className="mt-6 rounded-[2rem] border bg-white p-10 shadow-sm"
              style={{ borderColor: ink.border }}
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full" style={{ background: ink.blueSoft, border: `2px solid ${ink.border}` }} />
                <div>
                  <p className="text-lg font-bold">{slide.name}</p>
                  <p className="text-sm font-medium" style={{ color: ink.blue }}>
                    {slide.project}
                  </p>
                </div>
              </div>
              <p className="mt-6 text-base leading-relaxed" style={{ color: ink.muted }}>
                {slide.body}
              </p>
            </div>
          </div>
          <FooterBar />
        </div>
      }
      right={<VisualAbstract />}
    />
  );
}

function SlideAutomation({ slide, step, total }: { slide: Extract<InstagramCarouselSlide, { kind: 'automation' }>; step: number; total: number }) {
  return (
    <SlideChrome
      step={step}
      total={total}
      left={
        <div className="flex min-h-0 flex-1 flex-col">
          <Header step={step} total={total} />
          <div className="mt-10 px-10">
            <h2 className="text-3xl font-black">{slide.title}</h2>
            <div className="mt-10 flex items-center justify-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-xl font-black"
                style={{ borderColor: ink.blue, color: ink.blue, background: '#fff' }}
              >
                G
              </div>
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-md"
                style={{ background: ink.blue }}
              >
                <IconZap className="h-7 w-7" />
              </div>
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-lg font-black"
                style={{ borderColor: ink.blue, color: ink.blue, background: '#fff' }}
              >
                IF
              </div>
            </div>
            <p className="mt-10 text-center text-lg" style={{ color: ink.muted }}>
              {slide.body}
            </p>
          </div>
          <FooterBar />
        </div>
      }
      right={<VisualAbstract />}
    />
  );
}

function SlideRevenue({ slide, step, total }: { slide: Extract<InstagramCarouselSlide, { kind: 'revenue' }>; step: number; total: number }) {
  return (
    <SlideChrome
      step={step}
      total={total}
      left={
        <div className="flex min-h-0 flex-1 flex-col">
          <Header step={step} total={total} />
          <div className="mt-10 px-10">
            <h2 className="text-3xl font-black">{slide.title}</h2>
            <div
              className="mt-6 rounded-[2rem] border bg-white p-10 shadow-sm"
              style={{ borderColor: ink.border }}
            >
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: ink.muted }}>
                {slide.label}
              </p>
              <p className="mt-3 text-5xl font-black tracking-tight">{slide.amount}</p>
              <p className="mt-4 flex items-center gap-2 text-lg font-bold" style={{ color: ink.green }}>
                <span aria-hidden>↗</span>
                {slide.delta}
              </p>
            </div>
          </div>
          <FooterBar />
        </div>
      }
      right={<VisualAbstract />}
    />
  );
}

function SlideCta({ slide, step, total }: { slide: Extract<InstagramCarouselSlide, { kind: 'cta' }>; step: number; total: number }) {
  return (
    <SlideChrome
      step={step}
      total={total}
      left={
        <div className="flex min-h-0 flex-1 flex-col">
          <Header step={step} total={total} />
          <div className="flex flex-1 flex-col justify-center px-10">
            <h2 className="text-center text-2xl font-black leading-tight sm:text-3xl">{slide.title}</h2>
            <button
              type="button"
              className="mx-auto mt-10 w-full max-w-sm rounded-xl py-5 text-base font-black text-white shadow-lg transition active:scale-[0.98] sm:py-6 sm:text-lg"
              style={{ background: ink.cta }}
            >
              {slide.buttonLabel}
            </button>
            <p className="mt-6 text-center text-sm" style={{ color: ink.muted }}>
              {slide.footer}
            </p>
          </div>
          <FooterBar />
        </div>
      }
      right={<VisualPlaceholderHero />}
    />
  );
}

function renderSlide(slide: InstagramCarouselSlide, step: number, total: number) {
  switch (slide.kind) {
    case 'hero':
      return <SlideHero slide={slide} step={step} total={total} />;
    case 'pain':
      return <SlidePain slide={slide} step={step} total={total} />;
    case 'solution':
      return <SlideSolution slide={slide} step={step} total={total} />;
    case 'crm':
      return <SlideCrm slide={slide} step={step} total={total} />;
    case 'automation':
      return <SlideAutomation slide={slide} step={step} total={total} />;
    case 'revenue':
      return <SlideRevenue slide={slide} step={step} total={total} />;
    case 'cta':
      return <SlideCta slide={slide} step={step} total={total} />;
    default:
      return null;
  }
}

export function InstagramCarousel() {
  const total = SLIDES.length;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }, []);

  return (
    <section className="w-full" aria-label="Carrousel Instagram Inkflow">
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <p className="text-sm font-medium text-muted-foreground">
          Aperçu web — ratio 4∶5 par slide (export capture depuis navigateur).
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-40"
            disabled={active === 0}
            onClick={() => scrollToIndex(Math.max(0, active - 1))}
          >
            Précédent
          </button>
          <button
            type="button"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-40"
            disabled={active === total - 1}
            onClick={() => scrollToIndex(Math.min(total - 1, active + 1))}
          >
            Suivant
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
        style={{ scrollbarWidth: 'thin' }}
        onScroll={(e) => {
          const t = e.currentTarget;
          const first = t.children[0] as HTMLElement | undefined;
          if (!first) return;
          const slideWidth = first.offsetWidth + 16;
          const idx = Math.round(t.scrollLeft / slideWidth);
          setActive(Math.max(0, Math.min(total - 1, idx)));
        }}
      >
        {SLIDES.map((slide, i) => (
          <article
            key={slide.id}
            className="snap-center shrink-0"
            style={{ width: 'min(100vw - 2rem, 420px)' }}
          >
            <div
              className="overflow-hidden rounded-2xl border shadow-sm"
              style={{ aspectRatio: '1080 / 1350', borderColor: ink.border }}
            >
              {renderSlide(slide, i + 1, total)}
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Slide ${i + 1}`}
            className="h-2.5 w-2.5 rounded-full transition"
            style={{ background: i === active ? ink.blue : ink.border }}
            onClick={() => scrollToIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}

export { SLIDES as instagramCarouselSlides };
