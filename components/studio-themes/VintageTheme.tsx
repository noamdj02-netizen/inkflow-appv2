import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { StudioThemeProps } from '../../types/studio-theme';
import { GoogleReviews } from '../vitrine/GoogleReviews';
import { StudioThemeContactBlock } from './StudioThemeContactBlock';
import { StudioThemeFlashSection } from './StudioThemeFlashSection';

/**
 * VintageTheme — Élégance tatouage old-school / studio parisien.
 * Background crème/parchemin, Playfair Display, cards sans border-radius.
 */
export const VintageTheme: React.FC<StudioThemeProps> = ({ studio, flashItems, portfolioItems, googleReviews }) => {
  const bookingUrl = studio.bookingUrl ?? `/book/${studio.slug}`;

  return (
    <div className="min-h-[100dvh] bg-[#f5f0e8] font-serif relative">
      {/* Overlay texture optionnel — /noise.svg si présent */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 bg-[length:200px_200px] bg-[url('/noise.svg')]"
        aria-hidden
      />

      <main id="contenu-vitrine" tabIndex={-1} className="relative max-w-4xl mx-auto px-4 py-24 outline-none">
        {/* Header */}
        <header className="text-center mb-16">
          {studio.avatarUrl && (
            <img
              src={studio.avatarUrl}
              alt={studio.name}
              className="w-28 h-28 rounded-sm object-cover mx-auto mb-8 border border-stone-300 shadow-sm"
            />
          )}
          <h1 className="font-serif text-4xl sm:text-5xl font-normal tracking-wide text-amber-950 mb-4">
            {studio.name}
          </h1>
          {studio.city && !studio.address && (
            <p className="text-stone-500 text-base mb-4">{studio.city}</p>
          )}
          {studio.bio && (
            <p className="text-stone-600 text-lg max-w-xl mx-auto mb-8">{studio.bio}</p>
          )}
          <a
            href={bookingUrl}
            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-950 text-amber-50 font-medium tracking-wide hover:bg-amber-900 transition-colors min-h-[44px]"
          >
            Réserver
            <ExternalLink className="w-4 h-4" />
          </a>
          <StudioThemeContactBlock
            tone="vintage"
            className="mt-8 max-w-md mx-auto flex flex-col items-stretch text-left"
            address={studio.address}
            phone={studio.phone}
            email={studio.email}
            website={studio.website}
            instagramHandle={studio.instagramHandle}
          />
        </header>

        <hr className="border-stone-300 my-12" />

        <StudioThemeFlashSection items={flashItems} bookingUrl={bookingUrl} variant="vintage" />

        <hr className="border-stone-300 my-12" />

        {/* Portfolio */}
        {portfolioItems.length > 0 && (
          <section>
            <h2 className="font-serif text-3xl font-normal tracking-wide text-amber-950 mb-8">
              Portfolio
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              {portfolioItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-stone-300 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square">
                    <img
                      src={item.imageUrl}
                      alt={item.caption ?? 'Portfolio'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {item.caption && (
                    <p className="p-4 text-sm text-stone-600">{item.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {googleReviews && (
          <>
            <hr className="border-stone-300 my-12" />
            <section className="max-w-xl mx-auto">
              <GoogleReviews data={googleReviews} />
            </section>
          </>
        )}
        {studio.googleBusinessUrl && (
          <>
            <hr className="border-stone-300 my-12" />
            <div className="flex justify-center">
              <a
                href={studio.googleBusinessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] border border-stone-400 bg-white text-amber-950 text-sm font-medium hover:bg-stone-50 active:scale-[0.98] transition-all"
              >
                Google Maps
                <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
