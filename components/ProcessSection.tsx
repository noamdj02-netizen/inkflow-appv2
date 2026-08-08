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
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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

const previewLabel = 'text-[9px] font-medium text-muted-foreground';

const StepPreview: React.FC<{ type: string; t: (k: string) => string }> = ({ type, t }) => {
  if (type === 'signup') {
    return (
      <PreviewFrame title={t('process.preview.signupTitle')}>
        <div className="flex h-full flex-col gap-2.5 p-3.5 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
              IF
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-tight text-foreground">
                {t('process.preview.createStudio')}
              </p>
              <p className="text-[9px] text-muted-foreground">{t('process.preview.trialHint')}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <p className={previewLabel}>{t('process.preview.studioName')}</p>
              <Input
                readOnly
                tabIndex={-1}
                value="Studio Noam"
                className="pointer-events-none h-9 rounded-xl text-[10px] font-medium"
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className={previewLabel}>{t('process.preview.proEmail')}</p>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-emerald-600"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <Input
                  readOnly
                  tabIndex={-1}
                  value="email@studio.fr"
                  className="pointer-events-none h-9 rounded-xl pl-8 text-[10px] font-medium"
                />
              </div>
            </div>
          </div>

          <Button
            type="button"
            tabIndex={-1}
            className="pointer-events-none mt-auto h-9 w-full rounded-xl text-[10px] font-semibold shadow-[0_10px_24px_-12px_rgba(9,9,11,0.55)]"
          >
            {t('process.preview.startTrial')}
          </Button>
        </div>
      </PreviewFrame>
    );
  }

  if (type === 'config') {
    const rows = [
      {
        icon: Calendar,
        label: t('process.preview.availability'),
        value: t('process.preview.availabilityValue'),
        done: true,
      },
      {
        icon: CreditCard,
        label: t('process.preview.payments'),
        value: t('process.preview.paymentsValue'),
        done: true,
      },
      {
        icon: Sparkles,
        label: t('process.preview.services'),
        value: t('process.preview.servicesValue'),
        done: true,
      },
    ];
    return (
      <PreviewFrame title={t('process.settings')}>
        <div className="flex h-full flex-col gap-3 p-3 sm:p-3.5">
          <div>
            <p className="text-[10px] font-semibold text-foreground">
              {t('process.preview.quickSetup')}
            </p>
            <p className="mt-0.5 text-[9px] text-muted-foreground">
              {t('process.preview.readyForBookings')}
            </p>
          </div>
          <ul className="flex flex-col gap-1.5">
            {rows.map(({ icon: RowIcon, label, value, done }) => (
              <li
                key={label}
                className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card px-2.5 py-2"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <RowIcon className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-medium text-muted-foreground">{label}</p>
                  <p className="truncate text-[10px] font-semibold text-foreground">{value}</p>
                </div>
                {done ? (
                  <Badge
                    variant="secondary"
                    className="size-5 shrink-0 rounded-full border-0 bg-emerald-500/12 p-0 text-emerald-600"
                  >
                    <Check className="size-3" strokeWidth={2.5} />
                  </Badge>
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
      <PreviewFrame title={t('process.preview.shareTitle')}>
        <div className="flex h-full flex-col gap-3 p-3.5 sm:p-4">
          <Alert className="border-emerald-200/70 bg-emerald-50/90 px-2.5 py-2">
            <Copy className="text-emerald-700" strokeWidth={1.75} />
            <AlertTitle className="text-[10px] font-semibold text-emerald-900">
              {t('process.linkCopied')}
            </AlertTitle>
          </Alert>

          <Card size="sm" className="gap-0 py-0 shadow-sm ring-border/80">
            <CardHeader className="gap-1 px-2.5 py-2">
              <CardDescription className="text-[9px]">
                {t('process.preview.bookingLink')}
              </CardDescription>
              <div className="flex items-center gap-2 rounded-lg bg-muted px-2 py-1.5 ring-1 ring-border/80">
                <Link2 className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] font-semibold text-foreground">
                  /studio/monstudio
                </span>
                <Badge variant="default" className="h-auto shrink-0 px-1.5 py-0.5 text-[8px]">
                  {t('process.preview.copy')}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] font-medium text-muted-foreground">
              {t('process.preview.shareOn')}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Instagram', short: 'IG' },
                { label: 'WhatsApp', short: 'WA' },
                { label: 'SMS', short: 'SMS' },
              ].map(({ label, short }) => (
                <Badge
                  key={label}
                  variant="outline"
                  title={label}
                  className="flex h-8 w-full justify-center rounded-lg text-[9px] font-semibold"
                >
                  {short}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </PreviewFrame>
    );
  }

  if (type === 'receive') {
    const requests = [
      {
        name: 'Camille R.',
        detail: t('process.preview.request1Detail'),
        amount: '60 €',
        active: true,
      },
      {
        name: 'Lucas M.',
        detail: t('process.preview.request2Detail'),
        amount: '80 €',
        active: false,
      },
    ];
    return (
      <PreviewFrame title={t('process.preview.inboxTitle')} dark>
        <div className="flex h-full flex-col gap-2.5 bg-zinc-950 p-3 sm:p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-white">{t('process.preview.inbox')}</p>
            <Badge className="h-auto border-0 bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-semibold text-amber-400">
              {t('process.preview.newCount')}
            </Badge>
          </div>

          <ul className="flex flex-1 flex-col gap-1.5 overflow-hidden">
            {requests.map(({ name, detail, amount, active }) => (
              <li
                key={name}
                className={cn(
                  'rounded-xl border px-2.5 py-2',
                  active
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-white/8 bg-white/[0.04]'
                )}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold',
                      active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                    )}
                  >
                    {name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold text-white">{name}</p>
                    <p className="truncate text-[9px] text-zinc-400">{detail}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-[9px] font-semibold tabular-nums',
                      active ? 'text-emerald-400' : 'text-zinc-500'
                    )}
                  >
                    {amount}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <Card
            size="sm"
            className="gap-0 border-white/10 bg-zinc-900/90 py-0 text-card-foreground ring-0"
          >
            <CardContent className="flex items-start gap-2 px-2.5 py-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                <Bell className="size-3.5 text-amber-400" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-[10px] text-white">{t('process.newRdv')}</CardTitle>
                <CardDescription className="mt-0.5 text-[9px] text-zinc-400">
                  {t('process.preview.depositReceived')}
                </CardDescription>
              </div>
            </CardContent>
          </Card>
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
                  className={cn(
                    LANDING_SURFACE,
                    LANDING_SURFACE_INNER,
                    'flex h-full flex-col overflow-hidden border-l-4 transition-shadow duration-300',
                    STEP_ACCENTS[index],
                    '[@media(hover:hover)]:hover:shadow-[0_28px_56px_-22px_rgba(9,9,11,0.16)]'
                  )}
                >
                  <div
                    className="relative aspect-[4/3] overflow-hidden border-b border-border/60 bg-muted"
                    data-gsap-scrub
                    data-gsap-scrub-y="20"
                    data-gsap-scrub-scale="0.02"
                  >
                    <StepPreview type={step.preview} t={t} />
                    <Badge
                      variant="outline"
                      className="absolute top-3 right-3 z-10 border-border/80 bg-background/95 text-[10px] font-semibold text-muted-foreground shadow-sm backdrop-blur-sm"
                    >
                      {t(step.durationKey)}
                    </Badge>
                  </div>

                  <div className="flex flex-1 flex-col gap-2.5 p-5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-4" strokeWidth={1.75} />
                      </div>
                      <CardTitle className="text-base font-bold tracking-tight sm:text-[1.05rem]">
                        {t(step.titleKey)}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      {t(step.descKey)}
                    </CardDescription>
                  </div>
                </div>
              </LandingMotionItem>
            );
          })}
        </LandingMotionStagger>

        <LandingMotionReveal className="mt-12 text-center sm:mt-14">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              asChild
              size="lg"
              className="min-h-12 rounded-xl px-8 text-sm font-semibold shadow-[0_16px_32px_-12px_rgba(9,9,11,0.35)]"
            >
              <a href="/signup">{t('process.cta1')}</a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-12 rounded-xl px-8 text-sm font-semibold"
            >
              <a href="/dashboard-demo">{t('process.cta2')}</a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t('process.trial')}</p>
        </LandingMotionReveal>
      </div>
    </section>
  );
};
