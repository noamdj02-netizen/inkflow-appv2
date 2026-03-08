import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarPlaceholder } from '../../lib/avatar-placeholders';

/** Mockup iPhone avec forme douce type main + cadre iPhone */
const HandWithPhone: React.FC = () => (
  <div className="relative flex items-center justify-center min-h-[320px] sm:min-h-[360px] lg:min-h-[400px]">
    <div className="absolute inset-0 flex items-end justify-center pointer-events-none" aria-hidden>
      <div
        className="w-[90%] max-w-[320px] h-52 sm:h-60 rounded-t-[45%] rounded-b-[55%] opacity-40"
        style={{
          background: 'radial-gradient(ellipse 75% 65% at 50% 100%, #94a3b8 0%, #cbd5e1 40%, #e2e8f0 70%, transparent 100%)',
          transform: 'translateY(15%) scale(1.05)',
        }}
      />
    </div>
    <div
      className="relative z-10 w-[240px] sm:w-[260px] lg:w-[300px] rounded-[2.75rem] bg-neutral-800 p-2.5 sm:p-3 transition-transform duration-300 hover:scale-[1.02]"
      style={{
        boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset',
        transform: 'rotate(-4deg)',
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-neutral-800 rounded-b-2xl z-20" />
      <div className="relative overflow-hidden rounded-[2.25rem] bg-white aspect-[9/19.5]">
        <img
          src="/images/mockup-profil.webp"
          alt=""
          className="w-full h-full object-cover object-top"
          loading="eager"
          fetchPriority="high"
        />
      </div>
    </div>
  </div>
);

export const EnhanceAIHero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section
      className="relative min-h-0 lg:min-h-[85vh] flex flex-col lg:flex-none lg:flex lg:items-center overflow-hidden bg-[#FAFAFA] pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-24"
      style={{
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0),
          radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)
        `,
        backgroundSize: '32px 32px',
        backgroundPosition: '0 0, 16px 16px',
      }}
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-12 xl:gap-16">
          {/* Gauche : titre, sous-titre, CTAs, social proof */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl lg:max-w-none">
            <h1 className="font-hero-title text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-neutral-900 tracking-tight leading-tight mb-4 sm:mb-5">
              {t('hero.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 mb-6 sm:mb-8 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-8 sm:mb-10 w-full sm:w-auto">
              <a
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-neutral-900 text-white font-semibold text-base shadow-lg hover:bg-neutral-800 transition-all hover:shadow-xl"
              >
                {t('hero.cta1')}
              </a>
              <a
                href="/demo"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold text-base hover:border-slate-400 hover:bg-slate-50 transition-all"
              >
                {t('hero.cta2')}
              </a>
            </div>
            {/* Social proof */}
            <div className="flex flex-col items-center lg:items-start gap-3">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="flex -space-x-3">
                  {[0, 1, 2].map((i) => (
                    <img
                      key={i}
                      src={getAvatarPlaceholder(i)}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white flex-shrink-0 bg-slate-200"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-600">{t('hero.social')}</span>
              </div>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-600 shadow-sm">
                {t('hero.socialBadge')}
              </span>
            </div>
          </div>

          {/* Droite : main + mockup iPhone (desktop) */}
          <div className="hidden lg:flex lg:flex-shrink-0 lg:items-center lg:justify-center">
            <HandWithPhone />
          </div>
        </div>

        {/* Mobile : main + mockup iPhone centré sous le bloc gauche */}
        <div className="lg:hidden mt-8 flex justify-center">
          <HandWithPhone />
        </div>
      </div>
    </section>
  );
};
