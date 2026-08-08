import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { openCookieSettings } from '@/lib/cookieConsentStorage';
import { SUPPORT_EMAIL, supportMailto } from '@/lib/supportContact';
import { APP_COOKIES_PATH, APP_LEGAL_PATH, APP_PRIVACY_PATH, APP_TERMS_PATH } from '@/lib/urls';
import { cn } from '@/lib/utils';
import { SocialCloud } from '@/components/ui/footer-section-4-utils/social-cloud';

const FOOTER_CARD_BG = '/images/footer-inkflow-laptop.png';

type FooterLink = { label: string; href: string; external?: boolean };

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

function FooterLinkItem({ link }: { link: FooterLink }) {
  return (
    <a
      href={link.href}
      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="transition-colors hover:text-zinc-900"
    >
      {link.label}
    </a>
  );
}

export function FooterSection4({ className }: { className?: string }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');

  const contactMailtoHref = (() => {
    const trimmed = email.trim();
    if (!trimmed) return supportMailto('Demande accès InkFlow');
    const params = new URLSearchParams({
      subject: 'Demande accès InkFlow',
      body: `Bonjour,\n\nMon email : ${trimmed}\n`,
    });
    return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
  })();

  const footerColumns: FooterColumn[] = [
    {
      title: 'Produit',
      links: [
        { label: 'Plans & tarifs', href: '/#pricing' },
        { label: 'Démo', href: '/#demo' },
        { label: 'Fonctionnalités', href: '/#fonctionnalites' },
        { label: 'Connexion', href: '/login' },
        { label: 'Essai gratuit', href: '/signup' },
      ],
    },
    {
      title: 'Explorer',
      links: [
        { label: "Vue d'ensemble", href: '/vue-ensemble' },
        { label: 'Demandes', href: '/demandes' },
        { label: 'Rendez-vous', href: '/rendez-vous' },
        { label: 'Galerie flash', href: '/galerie-flash' },
        { label: 'Portfolio', href: '/portfolio' },
      ],
    },
    {
      title: 'Légal',
      links: [
        { label: 'Confidentialité', href: APP_PRIVACY_PATH },
        { label: "Conditions d'utilisation", href: APP_TERMS_PATH },
        { label: 'Mentions légales', href: APP_LEGAL_PATH },
        { label: 'Politique cookies', href: APP_COOKIES_PATH },
        { label: 'Aide', href: '/aide' },
      ],
    },
    {
      title: 'Réseaux',
      links: [
        { label: 'Instagram', href: 'https://www.instagram.com/inkflowme', external: true },
        { label: 'Contact', href: supportMailto('Contact InkFlow') },
        { label: 'Nouveautés', href: '/quoi-de-neuf' },
        { label: 'Installer l’app', href: '/installer' },
      ],
    },
  ];

  return (
    <footer className={cn('bg-[#f6f5f2] py-12 px-4 sm:px-6', className)}>
      <motion.div
        className="container mx-auto max-w-7xl"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
      >
        <div className="flex flex-col gap-4 md:flex-row md:min-h-[600px]">
          {/* Carte visuelle InkFlow (MacBook + dock) */}
          <motion.div
            className="relative flex w-full min-h-[300px] flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900 p-8 md:w-1/3 md:min-h-[600px] md:p-10"
            variants={itemVariants}
          >
            <img
              src={FOOTER_CARD_BG}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_75%] md:object-[65%_80%]"
              loading="lazy"
              decoding="async"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950/75 via-zinc-950/35 to-zinc-950/85"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-blue-950/25 mix-blend-multiply"
              aria-hidden
            />

            <div className="relative z-10">
              <a href="/" className="inline-flex items-center gap-2.5 text-white">
                <Logo size="sm" />
                <span className="font-hero-title text-xl font-bold tracking-tight">InkFlow</span>
              </a>
            </div>

            <div className="relative z-10 space-y-6">
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                {t('footer.cta')}
              </h2>
              <SocialCloud className="gap-3" />
              <p className="text-xs text-white/60">
                © {new Date().getFullYear()} InkFlow — Rouen, France. Tous droits réservés.
              </p>
            </div>
          </motion.div>

          {/* Carte liens + newsletter */}
          <motion.div
            className="flex w-full min-h-[500px] flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-8 md:w-2/3 md:min-h-[600px] md:p-12"
            variants={itemVariants}
          >
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-10">
              {footerColumns.map((section) => (
                <div key={section.title} className="flex flex-col space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                    {section.title}
                  </h3>
                  <ul className="flex flex-col space-y-2.5 text-sm font-medium text-zinc-600">
                    {section.links.map((link) => (
                      <li key={link.href + link.label}>
                        <FooterLinkItem link={link} />
                      </li>
                    ))}
                    {section.title === 'Légal' ? (
                      <li>
                        <button
                          type="button"
                          onClick={() => openCookieSettings()}
                          className="text-left font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                        >
                          Gérer les cookies
                        </button>
                      </li>
                    ) : null}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-10 space-y-4 md:mt-0">
              <h3 className="text-lg font-bold text-zinc-900">{t('footer.contact')}</h3>
              <p className="text-sm text-zinc-600">
                Une question ? Écris-nous à{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
              <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.emailPlaceholder')}
                  className="flex-1 rounded-xl border border-zinc-200 bg-transparent px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
                <a
                  href={contactMailtoHref}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
                >
                  {t('footer.signup')}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </footer>
  );
}

export default FooterSection4;
