import React from 'react';
import {
  UserPlus,
  Settings,
  Rocket,
  CheckCircle2,
  Mail,
  Copy,
  Bell,
  Check,
  Link2,
  Calendar,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LANDING_SURFACE, LANDING_SURFACE_INNER } from './landing/landingUi';
import {
  LandingMotionItem,
  LandingMotionReveal,
  LandingMotionStagger,
} from './landing/landingMotion';

/** Chrome fenêtre app — previews cohérentes type produit. */
function PreviewFrame({
  title,
  children,
  dark = false,
}: {
  title: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className={`absolute inset-0 flex flex-col ${dark ? 'bg-zinc-950' : 'bg-[#fafafa]'}`}>
      <div
        className={`flex shrink-0 items-center gap-2 border-b px-3 py-2 ${
          dark ? 'border-white/10 bg-zinc-900/95' : 'border-zinc-200/80 bg-white/95'
        }`}
      >
        <div className="flex gap-1" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-zinc-300" />
          <span className="h-2 w-2 rounded-full bg-zinc-200" />
          <span className="h-2 w-2 rounded-full bg-zinc-200" />
        </div>
        <span
          className={`min-w-0 flex-1 truncate text-center text-[10px] font-medium tracking-tight ${
            dark ? 'text-zinc-400' : 'text-zinc-500'
          }`}
        >
          {title}
        </span>
        <span className="w-8" aria-hidden />
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

const fieldLabel = 'text-[9px] font-medium text-zinc-500';
const fieldBox =
  'flex h-9 items-center rounded-xl border border-zinc-200 bg-white px-2.5 text-[10px] text-zinc-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]';

const StepPreview: React.FC<{ type: string; t: (k: string) => string }> = ({ type, t }) => {
  if (type === 'signup') {
    return (
      <PreviewFrame title="Inscription · InkFlow">
        <div className="flex h-full flex-col p-3.5 sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 text-[10px] font-bold text-white">
              IF
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-tight text-zinc-950">
                Créer mon studio
              </p>
              <p className="text-[9px] text-zinc-500">Essai 30 jours · sans carte</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div>
              <p className={fieldLabel}>Nom du studio</p>
              <div className={`${fieldBox} mt-1 font-medium`}>Studio Noam</div>
            </div>
            <div>
              <p className={fieldLabel}>E-mail pro</p>
              <div className={`${fieldBox} mt-1 gap-2`}>
                <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={1.75} />
                <span className="truncate font-medium">email@studio.fr</span>
              </div>
            </div>
          </div>

          <div className="mt-auto flex h-9 items-center justify-center rounded-xl bg-zinc-950 text-[10px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(9,9,11,0.55)]">
            Commencer l&apos;essai
          </div>
        </div>
      </PreviewFrame>
    );
  }

  if (type === 'config') {
    const rows = [
      { icon: Calendar, label: 'Disponibilités', value: 'Lun-Ven 10h-19h', done: true },
      { icon: CreditCard, label: 'Paiements', value: 'Stripe connecté', done: true },
      { icon: Sparkles, label: 'Services', value: '3 actifs', done: true },
    ];
    return (
      <PreviewFrame title={t('process.settings')}>
        <div className="flex h-full flex-col p-3 sm:p-3.5">
          <p className="text-[10px] font-semibold text-zinc-900">Configuration rapide</p>
          <p className="mt-0.5 text-[9px] text-zinc-500">Tout est prêt pour recevoir des RDV</p>
          <ul className="mt-3 space-y-1.5">
            {rows.map(({ icon: RowIcon, label, value, done }) => (
              <li
                key={label}
                className="flex items-center gap-2.5 rounded-xl border border-zinc-200/80 bg-white px-2.5 py-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                  <RowIcon className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-medium text-zinc-500">{label}</p>
                  <p className="truncate text-[10px] font-semibold text-zinc-900">{value}</p>
                </div>
                {done ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12">
                    <Check className="h-3 w-3 text-emerald-600" strokeWidth={2.5} />
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </PreviewFrame>
    );
  }

  if (type === 'share') {
    return (
      <PreviewFrame title="Vitrine · Partage">
        <div className="flex h-full flex-col p-3.5 sm:p-4">
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/90 px-2.5 py-2">
            <div className="flex items-center gap-2">
              <Copy className="h-3.5 w-3.5 shrink-0 text-emerald-700" strokeWidth={1.75} />
              <p className="text-[10px] font-semibold text-emerald-900">
                {t('process.linkCopied')}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm">
            <p className="text-[9px] font-medium text-zinc-500">Lien de réservation</p>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-zinc-50 px-2 py-1.5 ring-1 ring-zinc-200/80">
              <Link2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={1.75} />
              <span className="min-w-0 flex-1 truncate font-mono text-[10px] font-semibold text-zinc-800">
                ink-flow.me/monstudio
              </span>
              <span className="shrink-0 rounded-md bg-zinc-950 px-1.5 py-0.5 text-[8px] font-semibold text-white">
                Copier
              </span>
            </div>
          </div>

          <p className="mt-3 text-[9px] font-medium text-zinc-500">Partager sur</p>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {[
              { label: 'Instagram', short: 'IG' },
              { label: 'WhatsApp', short: 'WA' },
              { label: 'SMS', short: 'SMS' },
            ].map(({ label, short }) => (
              <span
                key={label}
                title={label}
                className="flex h-8 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-[9px] font-semibold text-zinc-700"
              >
                {short}
              </span>
            ))}
          </div>
        </div>
      </PreviewFrame>
    );
  }

  if (type === 'receive') {
    const requests = [
      {
        name: 'Camille R.',
        detail: 'Flash botanique · Demain 15h30',
        amount: '60 €',
        active: true,
      },
      {
        name: 'Lucas M.',
        detail: 'Manchette · En attente',
        amount: '80 €',
        active: false,
      },
    ];
    return (
      <PreviewFrame title="Demandes · Inbox" dark>
        <div className="flex h-full flex-col bg-zinc-950 p-3 sm:p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-white">Boîte de réception</p>
            <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-semibold text-amber-400">
              1 nouvelle
            </span>
          </div>

          <ul className="mt-2.5 flex-1 space-y-1.5 overflow-hidden">
            {requests.map(({ name, detail, amount, active }) => (
              <li
                key={name}
                className={`rounded-xl border px-2.5 py-2 ${
                  active
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-white/8 bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold ${
                      active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold text-white">{name}</p>
                    <p className="truncate text-[9px] text-zinc-400">{detail}</p>
                  </div>
                  <span
                    className={`shrink-0 text-[9px] font-semibold tabular-nums ${
                      active ? 'text-emerald-400' : 'text-zinc-500'
                    }`}
                  >
                    {amount}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-2 rounded-xl border border-white/10 bg-zinc-900/90 p-2.5">
            <div className="flex items-start gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                <Bell className="h-3.5 w-3.5 text-amber-400" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-white">{t('process.newRdv')}</p>
                <p className="mt-0.5 text-[9px] text-zinc-400">Acompte Stripe reçu · Camille R.</p>
              </div>
            </div>
          </div>
        </div>
      </PreviewFrame>
    );
  }

  return null;
};

const STEP_ACCENTS = [
  'border-l-emerald-500',
  'border-l-emerald-400',
  'border-l-zinc-400',
  'border-l-zinc-900',
] as const;

export const ProcessSection: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: UserPlus,
      titleKey: 'process.step1.title',
      descKey: 'process.step1.desc',
      durationKey: 'process.step1.duration',
      preview: 'signup' as const,
    },
    {
      icon: Settings,
      titleKey: 'process.step2.title',
      descKey: 'process.step2.desc',
      durationKey: 'process.step2.duration',
      preview: 'config' as const,
    },
    {
      icon: Rocket,
      titleKey: 'process.step3.title',
      descKey: 'process.step3.desc',
      durationKey: 'process.step3.duration',
      preview: 'share' as const,
    },
    {
      icon: CheckCircle2,
      titleKey: 'process.step4.title',
      descKey: 'process.step4.desc',
      durationKey: 'process.step4.duration',
      preview: 'receive' as const,
    },
  ];

  return (
    <section
      id="process"
      data-gsap-section="process"
      className="relative overflow-hidden border-t border-zinc-200/60 bg-[#f6f5f2] px-4 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-28"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/50 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1400px]">
        <LandingMotionReveal as="header" className="mb-10 text-center sm:mb-14">
          <h2 className="font-hero-title mb-4 px-2 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl md:text-[2.65rem] md:leading-[1.08]">
            {t('process.title')}
          </h2>
          <p className="mx-auto max-w-2xl px-2 text-base leading-relaxed text-zinc-600 sm:text-lg">
            {t('process.subtitle')}
          </p>
        </LandingMotionReveal>

        <LandingMotionReveal
          className="relative mx-auto mb-8 hidden max-w-3xl lg:block"
          aria-hidden
        >
          <div className="absolute left-[12.5%] right-[12.5%] top-4 h-px bg-zinc-200" />
          <div className="relative flex items-center justify-between">
            {steps.map((_, index) => (
              <div
                key={index}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 text-xs font-bold tabular-nums text-white shadow-[0_10px_24px_-12px_rgba(9,9,11,0.45)] ring-4 ring-[#f6f5f2]"
              >
                {index + 1}
              </div>
            ))}
          </div>
        </LandingMotionReveal>

        <LandingMotionStagger
          className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
          data-lenis-prevent
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <LandingMotionItem
                key={step.titleKey}
                as="article"
                index={index}
                className="group relative w-[min(88vw,340px)] shrink-0 snap-center sm:w-auto sm:shrink"
              >
                <div
                  className={`${LANDING_SURFACE} ${LANDING_SURFACE_INNER} flex h-full flex-col overflow-hidden border-l-4 ${STEP_ACCENTS[index]} transition-shadow duration-300 [@media(hover:hover)]:hover:shadow-[0_28px_56px_-22px_rgba(9,9,11,0.16)]`}
                >
                  <div
                    className="relative aspect-[4/3] overflow-hidden border-b border-zinc-200/60 bg-zinc-100"
                    data-gsap-scrub
                    data-gsap-scrub-y="20"
                    data-gsap-scrub-scale="0.02"
                  >
                    <StepPreview type={step.preview} t={t} />
                    <span className="absolute right-3 top-3 z-10 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-semibold text-zinc-600 shadow-sm ring-1 ring-zinc-200/80 backdrop-blur-sm">
                      {t(step.durationKey)}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2.5 flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 transition-colors duration-300 group-hover:bg-zinc-950 group-hover:text-white">
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <h3 className="text-base font-bold tracking-tight text-zinc-950 sm:text-[1.05rem]">
                        {t(step.titleKey)}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-600">{t(step.descKey)}</p>
                  </div>
                </div>
              </LandingMotionItem>
            );
          })}
        </LandingMotionStagger>

        <LandingMotionReveal className="mt-12 text-center sm:mt-14">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <a
              href="/signup"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-zinc-950 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_16px_32px_-12px_rgba(9,9,11,0.35)] transition-all hover:bg-zinc-800 active:scale-[0.98]"
            >
              {t('process.cta1')}
            </a>
            <a
              href="/dashboard-demo"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-zinc-200 bg-white px-8 py-3.5 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-50 active:scale-[0.98]"
            >
              {t('process.cta2')}
            </a>
          </div>
          <p className="mt-4 text-sm text-zinc-500">{t('process.trial')}</p>
        </LandingMotionReveal>
      </div>
    </section>
  );
};
