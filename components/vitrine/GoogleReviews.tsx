import React from 'react';
import { Star } from 'lucide-react';
import type { GoogleReviewsPayload } from '../../types/googlePlaces';

export interface GoogleReviewsProps {
  data: GoogleReviewsPayload;
  /** Sous-titre optionnel (ex. source) */
  subtitle?: string;
  className?: string;
}

/**
 * Bloc avis Google Maps — style InkFlow : sombre, bordures fines, sans fioritures.
 */
export const GoogleReviews: React.FC<GoogleReviewsProps> = ({
  data,
  subtitle = 'Avis Google',
  className = '',
}) => {
  const { rating, userRatingsTotal, reviews } = data;
  const list = reviews.filter((r) => r.text.length > 0);
  /** Note / total parfois absents côté API ; on affiche dès qu’on a une note, un total ou du texte. */
  const showBlock =
    rating != null || userRatingsTotal > 0 || list.length > 0;

  if (!showBlock) {
    return null;
  }

  return (
    <section
      className={`rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 ${className}`}
      aria-label="Avis Google Maps"
    >
      <div className="px-4 py-4 sm:px-5 sm:py-5 border-b border-zinc-800/80">
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 mb-2">{subtitle}</p>
        {(rating != null || userRatingsTotal > 0) && (
          <div className="flex flex-wrap items-baseline gap-3">
            {rating != null && (
              <span className="text-3xl font-semibold tabular-nums tracking-tight text-white">
                {rating.toFixed(1)}
              </span>
            )}
            {rating != null && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i <= Math.round(rating)
                        ? 'text-zinc-200 fill-zinc-200'
                        : 'text-zinc-700 fill-none'
                    }`}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
            )}
            {userRatingsTotal > 0 && (
              <span className="text-sm text-zinc-400 tabular-nums">
                {userRatingsTotal} avis
              </span>
            )}
          </div>
        )}
      </div>

      {list.length > 0 && (
        <ul className="divide-y divide-zinc-800/80">
          {list.map((rev, idx) => (
            <li key={`${rev.authorName}-${idx}`} className="px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-zinc-200 truncate">{rev.authorName}</span>
                {rev.relativeTimeDescription && (
                  <span className="text-[11px] text-zinc-500 shrink-0 tabular-nums">
                    {rev.relativeTimeDescription}
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{rev.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
