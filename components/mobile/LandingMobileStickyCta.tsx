import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Barre d’action fixe bas d’écran — landing mobile uniquement (CTA essai + démo).
 * Évite de scroller jusqu’au hero pour convertir sur petits écrans / PWA standalone.
 */
export const LandingMobileStickyCta: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div
      className="landing-mobile-sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/95 backdrop-blur-md md:hidden"
      style={{
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="mx-auto flex max-w-lg gap-2 px-3 pt-2.5">
        <a
          href="/signup"
          className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold !text-white shadow-sm transition-colors hover:bg-zinc-800 active:scale-[0.98]"
        >
          {t('hero.ctaTrial')}
          <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        </a>
        <a
          href="/dashboard-demo"
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold !text-zinc-900 transition-colors hover:bg-zinc-100 active:scale-[0.98]"
        >
          {t('hero.ctaDemoShort')}
        </a>
      </div>
    </div>
  );
};
