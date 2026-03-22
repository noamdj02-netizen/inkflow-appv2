import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { StudioThemeProps } from '../../types/studio-theme';
import { GoogleReviews } from '../vitrine/GoogleReviews';
import { StudioThemeContactBlock } from './StudioThemeContactBlock';

/**
 * ClassicTheme — Layout Linktree épuré, 1 colonne centrée.
 * Police Inter, palette sombre neutre (#0a0a0b), accents violet.
 */
export const ClassicTheme: React.FC<StudioThemeProps> = ({ studio, flashItems, portfolioItems, googleReviews }) => {
  const bookingUrl = studio.bookingUrl ?? `/book/${studio.slug}`;

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0b] text-neutral-100 font-sans">
      <main className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <header className="flex flex-col items-center text-center mb-12">
          {studio.avatarUrl && (
            <img
              src={studio.avatarUrl}
              alt={studio.name}
              className="w-24 h-24 rounded-full object-cover ring-2 ring-violet-500/50 mb-4"
            />
          )}
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">{studio.name}</h1>
          {studio.city && !studio.address && (
            <p className="text-neutral-500 text-sm mb-2">{studio.city}</p>
          )}
          {studio.bio && (
            <p className="text-neutral-400 text-sm sm:text-base max-w-md mb-6">{studio.bio}</p>
          )}
          <a
            href={bookingUrl}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all hover:scale-[1.02] min-h-[44px]"
          >
            Réserver
            <ExternalLink className="w-4 h-4" />
          </a>
          <StudioThemeContactBlock
            tone="dark"
            className="mt-8 max-w-md mx-auto flex flex-col items-stretch"
            address={studio.address}
            phone={studio.phone}
            email={studio.email}
            website={studio.website}
            instagramHandle={studio.instagramHandle}
          />
        </header>

        {/* Flashs */}
        {flashItems.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">Flashs disponibles</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {flashItems.map((item) => (
                <a
                  key={item.id}
                  href={`${bookingUrl}?flash=${item.id}`}
                  className="group block rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 transition-transform hover:scale-[1.02]"
                >
                  <div className="aspect-square">
                    <img
                      src={item.imageUrl}
                      alt={item.title ?? 'Flash'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm text-white truncate">{item.title}</p>
                    {item.price != null && (
                      <p className="text-xs text-violet-400">{item.price}€</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Portfolio */}
        {portfolioItems.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Portfolio</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
      </main>
    </div>
  );
};
