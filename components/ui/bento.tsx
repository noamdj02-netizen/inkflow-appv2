import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

type BentoImage = {
  src: string;
  webpSrc?: string;
  alt: string;
  objectPosition?: string;
  imgClassName?: string;
};

/** Visuels produit InkFlow — captures et mockups déjà utilisés sur la landing. */
const BENTO_IMAGES = {
  booking: {
    src: '/images/pricing-bento-inkflow-mobile.png',
    alt: 'Demandes projet et aperçu rapide — app InkFlow sur mobile',
    objectPosition: 'center',
  },
  payments: {
    src: '/Mobile_Mockup_2.2.jpg',
    alt: 'Acomptes Stripe encaissés dans InkFlow',
    objectPosition: 'center',
  },
  crm: {
    src: '/images/feature-crm.png',
    alt: 'CRM client et projets tatouage InkFlow',
    objectPosition: 'top center',
  },
  traceability: {
    src: '/images/referral-hero-workstation.png',
    alt: 'Poste de travail studio — traçabilité consommables',
    objectPosition: 'center',
  },
  team: {
    src: '/images/feature-dashboard.png',
    webpSrc: '/images/hero-dashboard-mockup.webp',
    alt: 'Pilotage studio et statistiques InkFlow',
    objectPosition: 'top center',
  },
} as const satisfies Record<string, BentoImage>;

function BentoGraphic({
  src,
  webpSrc,
  alt,
  objectPosition = 'center',
  className = '',
  imgClassName = '',
}: BentoImage & { className?: string }) {
  return (
    <picture className={clsx('absolute inset-0 block h-full w-full', className)}>
      {webpSrc ? <source srcSet={webpSrc} type="image/webp" /> : null}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={clsx('h-full w-full object-cover', imgClassName)}
        style={{ objectPosition }}
      />
    </picture>
  );
}

export function BentoCard({
  dark = false,
  className = '',
  eyebrow,
  title,
  description,
  graphic,
  fade = [],
}: {
  dark?: boolean;
  className?: string;
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  graphic?: ReactNode;
  fade?: ('top' | 'bottom')[];
}) {
  return (
    <motion.div
      initial="idle"
      whileHover="active"
      variants={{ idle: {}, active: {} }}
      data-dark={dark ? 'true' : undefined}
      className={clsx(
        className,
        'group relative flex flex-col overflow-hidden rounded-2xl bg-zinc-950 shadow-sm ring-1 ring-zinc-800/80 transform-gpu',
        'data-[dark]:bg-zinc-900 data-[dark]:ring-white/10'
      )}
    >
      <div className="relative h-52 shrink-0 sm:h-60 lg:h-[17rem]">
        {graphic}
        {fade.includes('top') && (
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 to-transparent opacity-60" />
        )}
        {fade.includes('bottom') && (
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent to-50% opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>
      <div className="relative z-20 -mt-16 flex min-h-[9.5rem] flex-col justify-end p-6 backdrop-blur-sm sm:p-8 lg:-mt-20 lg:min-h-[10.5rem]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">{eyebrow}</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">{description}</p>
      </div>
    </motion.div>
  );
}

type BentoCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

const COPY = {
  fr: {
    title: 'Le logiciel résa pour tatoueurs — pas un généraliste salons',
    subtitle:
      'Demandes, créneaux, acomptes Stripe et dossier client au même endroit. Pas une usine logicielle.',
    cards: [
      {
        eyebrow: 'Agenda',
        title: 'Réservations sans allers-retours',
        description:
          'Page book, créneaux, validations et rappels — vos clients réservent en ligne, vous gardez la main sur l’agenda.',
      },
      {
        eyebrow: 'Paiements',
        title: 'Acomptes Stripe encaissés',
        description:
          'Liens de paiement et acomptes automatiques pour filtrer les curieux et limiter les no-shows.',
      },
      {
        eyebrow: 'CRM',
        title: 'Dossier client centralisé',
        description:
          'Historique, projets, notes et consentements — tout le parcours client dans un seul outil.',
      },
      {
        eyebrow: 'Conformité',
        title: 'Traçabilité légale incluse',
        description:
          'Registre des lots et consommables (art. R.513-10-15 CSP) — dès la formule Essentiel.',
      },
      {
        eyebrow: 'Studio',
        title: 'Équipe & pilotage avancé',
        description:
          'Statistiques, fidélité, multi-calendriers puis rôles collaborateurs et API sur les paliers supérieurs.',
      },
    ] satisfies BentoCopy[],
  },
  en: {
    title: 'Booking software built for tattoo artists — not generic salon tools',
    subtitle:
      'Requests, slots, Stripe deposits and client records in one place. Not bloated enterprise software.',
    cards: [
      {
        eyebrow: 'Calendar',
        title: 'Bookings without the back-and-forth',
        description:
          'Public booking page, slots, confirmations and reminders — clients book online, you stay in control.',
      },
      {
        eyebrow: 'Payments',
        title: 'Stripe deposits collected',
        description:
          'Payment links and automatic deposits to filter tire-kickers and reduce no-shows.',
      },
      {
        eyebrow: 'CRM',
        title: 'Centralized client records',
        description:
          'History, projects, notes and consent forms — the full client journey in one tool.',
      },
      {
        eyebrow: 'Compliance',
        title: 'Legal traceability included',
        description:
          'Consumable lot register (French CSP requirements) — from the Essential plan upward.',
      },
      {
        eyebrow: 'Studio',
        title: 'Team & advanced insights',
        description:
          'Analytics, loyalty, multi-calendars, then collaborator roles and API on higher tiers.',
      },
    ] satisfies BentoCopy[],
  },
} as const;

/** Grille bento valeur produit — section Tarifs landing InkFlow. */
export function PricingBentoGrid() {
  const { lang } = useLanguage();
  const copy = COPY[lang === 'en' ? 'en' : 'fr'];
  const [c1, c2, c3, c4, c5] = copy.cards;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
          {copy.title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-neutral-600 sm:mt-4 sm:text-lg md:text-xl">
          {copy.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6 lg:grid-rows-2 lg:gap-4">
        <BentoCard
          eyebrow={c1.eyebrow}
          title={c1.title}
          description={c1.description}
          graphic={<BentoGraphic {...BENTO_IMAGES.booking} />}
          className="lg:col-span-3 lg:rounded-tl-3xl max-lg:rounded-t-3xl"
        />
        <BentoCard
          eyebrow={c2.eyebrow}
          title={c2.title}
          description={c2.description}
          graphic={<BentoGraphic {...BENTO_IMAGES.payments} />}
          className="lg:col-span-3 lg:rounded-tr-3xl"
        />
        <BentoCard
          eyebrow={c3.eyebrow}
          title={c3.title}
          description={c3.description}
          graphic={<BentoGraphic {...BENTO_IMAGES.crm} />}
          className="lg:col-span-2 lg:rounded-bl-3xl"
        />
        <BentoCard
          eyebrow={c4.eyebrow}
          title={c4.title}
          description={c4.description}
          graphic={<BentoGraphic {...BENTO_IMAGES.traceability} />}
          className="lg:col-span-2"
        />
        <BentoCard
          eyebrow={c5.eyebrow}
          title={c5.title}
          description={c5.description}
          graphic={<BentoGraphic {...BENTO_IMAGES.team} />}
          className="max-lg:rounded-b-3xl lg:col-span-2 lg:rounded-br-3xl"
        />
      </div>
    </div>
  );
}

export default PricingBentoGrid;
