/**
 * Aperçu fiche Google : iframe Maps publique (aucune clé Inkflow / aucun appel Places depuis le navigateur)
 * + liste d’avis via `fetchAuthenticatedPlaceDetails` → Edge Function `google-places` (clé serveur uniquement).
 */
import React, { useEffect, useState } from 'react';
import { Star, ExternalLink, Loader2, MapPin } from 'lucide-react';
import { fetchAuthenticatedPlaceDetails } from '../../lib/googlePlaces';

interface PlaceReview {
  rating: number;
  text: string;
  authorName: string;
  authorUri: string;
  relativeTime: string;
}

interface GooglePlaceMapPreviewProps {
  placeId: string;
  className?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`}
        />
      ))}
    </span>
  );
}

export const GooglePlaceMapPreview: React.FC<GooglePlaceMapPreviewProps> = ({ placeId, className }) => {
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId.trim()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErr(null);

    void fetchAuthenticatedPlaceDetails(placeId.trim())
      .then((payload) => {
        if (cancelled || !payload) {
          if (!cancelled && !payload) setErr('Impossible de charger les avis (vérifiez la clé Places serveur).');
          return;
        }
        const mapped = (payload.reviews ?? []).slice(0, 5).map((r) => ({
          rating: r.rating ?? 0,
          text: r.text ?? '',
          authorName: r.authorName ?? 'Anonyme',
          authorUri: '',
          relativeTime: r.relativeTimeDescription ?? '',
        }));
        setReviews(mapped);
      })
      .catch(() => {
        if (!cancelled) setErr('Impossible de charger les avis Google.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  const mapsHref = `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId.trim())}`;
  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(`place_id:${placeId.trim()}`)}&output=embed`;

  return (
    <div className={`rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 ${className ?? ''}`}>
      <div className="relative w-full h-44 bg-zinc-100 dark:bg-zinc-800">
        <iframe
          title="Aperçu Google Maps"
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={embedSrc}
        />

      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Aperçu basé sur votre Place ID. Les avis sont chargés côté serveur.
              {loading && (
                <span className="inline-flex items-center gap-1 ml-1">
                  <Loader2 className="w-3 h-3 animate-spin inline text-zinc-400" />
                </span>
              )}
              {err && <span className="block text-amber-700 dark:text-amber-400 mt-1">{err}</span>}
            </p>
          </div>
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
          >
            Ouvrir dans Maps
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {!loading && reviews.length > 0 && (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
          {reviews.map((r, i) => (
            <div key={i} className="px-4 py-3 bg-white dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">{r.authorName}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StarRating rating={r.rating} />
                  {r.relativeTime && (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{r.relativeTime}</span>
                  )}
                </div>
              </div>
              {r.text && <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3">{r.text}</p>}
            </div>
          ))}
        </div>
      )}

      {!loading && reviews.length === 0 && !err && (
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Aucun avis texte renvoyé pour cette fiche (la note peut quand même s’afficher sur la vitrine).</p>
        </div>
      )}
    </div>
  );
};
