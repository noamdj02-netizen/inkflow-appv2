/**
 * Apercu carte + avis Google Maps (Maps JavaScript API).
 * Affiche la localisation du studio et les 5 premiers avis Places API.
 *
 * Requiert : VITE_GOOGLE_MAPS_JS_API_KEY dans .env.local + Vercel
 * Clé à restreindre par domaine (HTTP referrer) dans Google Cloud Console.
 * APIs a activer : Maps JavaScript API, Places API (New).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Star, ExternalLink, Loader2, MapPin } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Globals ───────────────────────────────────────────────────────────────────

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY as string | undefined;

let scriptPromise: Promise<void> | null = null;

function loadMapsScript(apiKey: string): Promise<void> {
  if (scriptPromise) return scriptPromise;
  if (typeof window !== 'undefined' && (window as Window & { google?: unknown }).google) {
    return Promise.resolve();
  }
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=beta&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Maps JS API failed to load'));
    document.head.appendChild(script);
  });
  return scriptPromise;
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

// ── Component ──────────────────────────────────────────────────────────────────

export const GooglePlaceMapPreview: React.FC<GooglePlaceMapPreviewProps> = ({ placeId, className }) => {
  const mapDivRef   = useRef<HTMLDivElement>(null);
  const [reviews, setReviews]     = useState<PlaceReview[]>([]);
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress]     = useState('');
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState<string | null>(null);

  useEffect(() => {
    if (!MAPS_KEY || !placeId) { setLoading(false); return; }

    let cancelled = false;

    async function init() {
      try {
        await loadMapsScript(MAPS_KEY!);
        if (cancelled || !mapDivRef.current) return;

        const [{ Map }, { AdvancedMarkerElement }, { Place }] = await Promise.all([
          google.maps.importLibrary('maps')   as Promise<google.maps.MapsLibrary>,
          google.maps.importLibrary('marker') as Promise<google.maps.MarkerLibrary>,
          google.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary>,
        ]);

        if (cancelled || !mapDivRef.current) return;

        const place = new Place({ id: placeId });

        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'reviews'],
        });

        if (cancelled) return;

        setPlaceName(place.displayName || '');
        setAddress(place.formattedAddress || '');

        if (place.reviews && place.reviews.length > 0) {
          setReviews(
            place.reviews.slice(0, 5).map((r) => ({
              rating:       r.rating ?? 0,
              text:         r.text ?? '',
              authorName:   r.authorAttribution?.displayName ?? 'Anonyme',
              authorUri:    r.authorAttribution?.uri ?? '',
              relativeTime: (r as { relativePublishTimeDescription?: string }).relativePublishTimeDescription ?? '',
            }))
          );
        }

        if (!mapDivRef.current) return;

        const map = new Map(mapDivRef.current, {
          center:             place.location,
          zoom:               15,
          mapId:              'inkflow-place-preview',
          disableDefaultUI:   true,
          gestureHandling:    'cooperative',
          zoomControl:        true,
        });

        new AdvancedMarkerElement({
          map,
          position: place.location,
          title:    place.displayName || '',
        });

      } catch (e) {
        if (!cancelled) setErr('Impossible de charger la carte Google Maps.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [placeId]);

  // Pas de clé configuree
  if (!MAPS_KEY) return null;

  return (
    <div className={`rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 ${className ?? ''}`}>
      {/* ── Carte ── */}
      <div className="relative w-full h-44 bg-zinc-100 dark:bg-zinc-800">
        <div ref={mapDivRef} className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
            <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
          </div>
        )}
        {err && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
            <p className="text-xs text-zinc-400">{err}</p>
          </div>
        )}
      </div>

      {/* ── Infos etablissement ── */}
      {!loading && !err && placeName && (
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{placeName}</p>
              {address && <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{address}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Avis ── */}
      {!loading && !err && reviews.length > 0 && (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
          {reviews.map((r, i) => (
            <div key={i} className="px-4 py-3 bg-white dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {r.authorUri ? (
                    <a
                      href={r.authorUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:underline flex items-center gap-1 truncate"
                    >
                      {r.authorName}
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">{r.authorName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StarRating rating={r.rating} />
                  {r.relativeTime && (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{r.relativeTime}</span>
                  )}
                </div>
              </div>
              {r.text && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3">{r.text}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !err && reviews.length === 0 && placeName && (
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Aucun avis disponible pour cette fiche.</p>
        </div>
      )}
    </div>
  );
};
