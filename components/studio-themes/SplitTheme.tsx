import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { StudioThemeProps } from '../../types/studio-theme';
import { GoogleReviews } from '../vitrine/GoogleReviews';
import { StudioThemeContactBlock } from './StudioThemeContactBlock';
import { StudioThemeFlashSection } from './StudioThemeFlashSection';

/**
 * SplitTheme — 2 colonnes : gauche sticky (profil), droite scroll (contenu).
 * Police Inter. Mobile : 1 colonne.
 */
export const SplitTheme: React.FC<StudioThemeProps> = ({ studio, flashItems, portfolioItems, googleReviews }) => {
  const bookingUrl = studio.bookingUrl ?? `/book/${studio.slug}`;

  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-neutral-100 font-sans">
      <div className="lg:grid lg:grid-cols-[320px_1fr]">
        {/* Colonne gauche — sticky sur desktop */}
        <aside className="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-neutral-800">
          <div className="p-6 lg:p-8">
            {studio.avatarUrl && (
              <img
                src={studio.avatarUrl}
                alt={studio.name}
                className="w-28 h-28 rounded-2xl object-cover mb-6"
              />
            )}
            <h1 className="text-2xl font-semibold text-white mb-2">{studio.name}</h1>
            {studio.city && !studio.address && (
              <p className="text-neutral-400 text-sm mb-4">{studio.city}</p>
            )}
            {studio.bio && (
              <p className="text-neutral-400 text-sm mb-6">{studio.bio}</p>
            )}
            <a
              href={bookingUrl}
              className="inline-flex items-center gap-2 w-full justify-center px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all mb-4 min-h-[44px]"
            >
              Réserver
              <ExternalLink className="w-4 h-4" />
            </a>
            <StudioThemeContactBlock
              tone="dark"
              address={studio.address}
              phone={studio.phone}
              email={studio.email}
              website={studio.website}
              instagramHandle={studio.instagramHandle}
            />
          </div>
        </aside>

        {/* Colonne droite — scroll */}
        <main id="contenu-vitrine" tabIndex={-1} className="p-6 lg:p-10 overflow-y-auto outline-none">
          <StudioThemeFlashSection items={flashItems} bookingUrl={bookingUrl} variant="split" />

          {/* Portfolio */}
          {portfolioItems.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-6">Portfolio</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {portfolioItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 transition-transform hover:scale-[1.02]"
                  >
                    <div className="aspect-square">
                      <img
                        src={item.imageUrl}
                        alt={item.caption ?? 'Portfolio'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {item.caption && (
                      <p className="p-2 text-xs text-neutral-500 truncate">{item.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {googleReviews && (
            <section className="mt-12">
              <GoogleReviews data={googleReviews} className="border-neutral-800" />
            </section>
          )}
          {studio.googleBusinessUrl && (
            <div className="mt-8 flex justify-center lg:justify-start">
              <a
                href={studio.googleBusinessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-neutral-600 text-neutral-200 text-sm font-medium hover:bg-neutral-900 active:scale-[0.98] transition-all"
              >
                Google Maps
                <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
