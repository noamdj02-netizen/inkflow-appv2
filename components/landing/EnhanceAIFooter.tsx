import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SUPPORT_EMAIL, supportMailto } from '../../lib/supportContact';
import { LANDING_PRIVACY_URL, LANDING_TERMS_URL, LANDING_LEGAL_URL } from '../../lib/urls';
import { LandingMotionItem, LandingMotionReveal, LandingMotionStagger } from './landingMotion';

const exploreLinksConfig = [
  { href: '/vue-ensemble', label: "Vue d'ensemble" },
  { href: '/demandes', label: 'Demandes' },
  { href: '/rendez-vous', label: 'Rendez-vous' },
];

const productLinksConfig = [{ href: '/#pricing', label: 'Plans & Tarifs' }];

const galleryLinksConfig = [
  { href: '/galerie-flash', label: 'Flash' },
  { href: '/portfolio', label: 'Portfolio' },
];

export const EnhanceAIFooter: React.FC = () => {
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

  return (
    <footer className="relative overflow-hidden bg-blue-900 text-white">
      <div
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center"
        style={{
          fontSize: 'clamp(6rem, 20vw, 18rem)',
          fontWeight: 800,
          color: 'rgba(255,255,255,0.04)',
          letterSpacing: '-0.02em',
        }}
        aria-hidden
      >
        INKFLOW
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <LandingMotionStagger stagger={0.1}>
          <LandingMotionItem hover3D={false}>
            <h2 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {t('footer.cta')}
            </h2>
          </LandingMotionItem>

          <LandingMotionItem
            index={1}
            hover3D={false}
            className="mb-16 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('footer.emailPlaceholder')}
              className="flex-1 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-white placeholder:text-blue-200/70 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <a
              href="/signup"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-white px-8 py-4 font-semibold text-blue-900 transition-colors hover:bg-blue-50"
            >
              {t('footer.signup')}
            </a>
          </LandingMotionItem>

          <LandingMotionItem index={2} hover3D={false} className="mb-16 text-sm text-blue-100/90">
            {t('footer.contact')} :{' '}
            <a
              href={contactMailtoHref}
              className="font-medium text-white underline-offset-2 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </LandingMotionItem>
        </LandingMotionStagger>

        <LandingMotionStagger
          className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8"
          stagger={0.08}
        >
          <LandingMotionItem index={0} hover3D={false}>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-blue-200/90">
              Explore
            </h3>
            <ul className="space-y-2">
              {exploreLinksConfig.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-blue-100 transition-colors hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </LandingMotionItem>
          <LandingMotionItem index={1} hover3D={false}>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-blue-200/90">
              Product
            </h3>
            <ul className="space-y-2">
              {productLinksConfig.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-blue-100 transition-colors hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </LandingMotionItem>
          <LandingMotionItem index={2} hover3D={false}>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-blue-200/90">
              Gallery
            </h3>
            <ul className="space-y-2">
              {galleryLinksConfig.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-blue-100 transition-colors hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </LandingMotionItem>
        </LandingMotionStagger>

        <LandingMotionReveal className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-blue-100 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-start">
            <a href={LANDING_PRIVACY_URL} className="transition-colors hover:text-white">
              Politique de confidentialité
            </a>
            <span className="hidden text-blue-300/80 sm:inline">|</span>
            <a href={LANDING_TERMS_URL} className="transition-colors hover:text-white">
              Conditions d&apos;utilisation
            </a>
            <span className="hidden text-blue-300/80 sm:inline">|</span>
            <a href={LANDING_LEGAL_URL} className="transition-colors hover:text-white">
              Mentions légales
            </a>
          </div>
          <p className="font-medium text-blue-100/90">©2026 InkFlow. Tous droits réservés.</p>
        </LandingMotionReveal>
      </div>
    </footer>
  );
};
