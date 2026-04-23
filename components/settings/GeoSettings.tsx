/**
 * GeoSettings — Configuration géolocalisation du studio
 *
 * Permet au tatoueur de :
 *  - géocoder son adresse via Google Maps API
 *  - utiliser sa position GPS directement
 *  - activer/désactiver la visibilité sur la carte de découverte client
 *  - voir un aperçu de sa vitrine
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Eye, EyeOff, Check, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import {
  geocodeAddressDetailed,
  getStudioGeo,
  updateStudioGeo,
  type StudioGeoData,
} from '../../lib/supabaseGeo';
import { getGoogleMapsBrowserApiKey } from '../../lib/googleMapsBrowserKey';

interface GeoSettingsProps {
  studioId: string;
  /** Première ligne d’adresse vitrine (préremplit le champ si vide) */
  studioAddress?: string;
  studioSlug?: string;
  /** Après sauvegarde géo réussie : synchronise l’adresse affichée (vitrine / page slug / app client) */
  onGeoAddressSynced?: (formattedAddress: string) => void | Promise<void>;
}

export const GeoSettings: React.FC<GeoSettingsProps> = ({
  studioId,
  studioAddress = '',
  studioSlug = '',
  onGeoAddressSynced,
}) => {
  const [geo, setGeo] = useState<StudioGeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Champs locaux
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [city, setCity] = useState('');
  const [visible, setVisible] = useState(true);
  const [addressInput, setAddressInput] = useState(studioAddress);
  const seededVitrineAddress = useRef(false);

  useEffect(() => {
    if (!studioId) return;
    getStudioGeo(studioId).then((data) => {
      if (data) {
        setGeo(data);
        setLat(data.latitude);
        setLng(data.longitude);
        setCity(data.city ?? '');
        setVisible(data.location_visible);
      }
      setLoading(false);
    });
  }, [studioId]);

  /** Préremplissage une fois l’adresse vitrine connue (sans écraser une saisie manuelle) */
  useEffect(() => {
    if (seededVitrineAddress.current) return;
    const a = studioAddress?.trim();
    if (a) {
      setAddressInput((prev) => (prev.trim() === '' ? a : prev));
      seededVitrineAddress.current = true;
    }
  }, [studioAddress]);

  const hasCoords = lat !== null && lng !== null;

  const handleGeocode = async () => {
    const addr = addressInput.trim() || studioAddress?.trim();
    if (!addr) {
      setError('Indiquez une adresse ci-dessus ou renseignez-la sur la page vitrine (onglet Page vitrine).');
      return;
    }
    setGeocoding(true);
    setError(null);
    const result = await geocodeAddressDetailed(addr);
    if (result.ok === false) {
      setError(result.message);
    } else {
      setLat(result.data.lat);
      setLng(result.data.lng);
      setCity(result.data.city);
      setAddressInput(result.data.formattedAddress);
    }
    setGeocoding(false);
  };

  const handleGPS = () => {
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      setError('La position du navigateur nécessite HTTPS (sauf en développement sur localhost).');
      return;
    }
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée par ce navigateur.');
      return;
    }
    setGeocoding(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lt, longitude: lg } = pos.coords;
        setLat(lt);
        setLng(lg);
        const apiKey = getGoogleMapsBrowserApiKey();
        if (apiKey) {
          try {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lt},${lg}&key=${apiKey}&language=fr`,
            );
            const json = await res.json() as {
              status: string;
              results?: Array<{
                address_components: Array<{ types: string[]; long_name: string }>;
                formatted_address: string;
              }>;
            };
            if (json.status === 'OK' && json.results?.[0]) {
              const comp = json.results[0].address_components ?? [];
              const cityComp = comp.find(
                (c) => c.types.includes('locality') || c.types.includes('postal_town'),
              );
              setCity(cityComp?.long_name ?? '');
              setAddressInput(json.results[0].formatted_address ?? '');
            }
          } catch {
            /* ville optionnelle si reverse geocode échoue */
          }
        }
        setGeocoding(false);
      },
      (err) => {
        const code = err?.code;
        let msg = 'Position indisponible.';
        if (code === 1) {
          msg =
            'Accès à la position refusé. Autorisez la localisation pour ce site (icône cadenas ou réglages du navigateur).';
        } else if (code === 2) {
          msg = 'Position indisponible (GPS désactivé ou signal trop faible). Essayez « Géocoder » avec votre adresse.';
        } else if (code === 3) {
          msg = 'Délai dépassé. Réessayez ou saisissez l’adresse puis « Géocoder ».';
        }
        setError(msg);
        setGeocoding(false);
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 25_000 },
    );
  };

  const handleSave = async () => {
    if (!hasCoords) return;
    setSaving(true);
    setError(null);
    const { error: saveError } = await updateStudioGeo(studioId, lat!, lng!, city, visible);
    if (saveError) {
      setError(saveError);
    } else {
      setSaved(true);
      setGeo({ latitude: lat, longitude: lng, city, location_visible: visible });
      setTimeout(() => setSaved(false), 3000);
      const formatted = addressInput.trim();
      if (formatted && onGeoAddressSynced) {
        try {
          await Promise.resolve(onGeoAddressSynced(formatted));
        } catch {
          /* feedback géré par le parent */
        }
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-1.5">
            <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-700 rounded" />
            <div className="h-3 w-56 bg-zinc-100 dark:bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Position sur la carte
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Coordonnées utilisées pour « studios à proximité » dans l&apos;app client
            </p>
          </div>
        </div>

        {/* Badge statut */}
        {hasCoords ? (
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Positionné
          </span>
        ) : (
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Non positionné
          </span>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Adresse input + boutons géocode */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Adresse du studio
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
              placeholder="12 rue de la Paix, 75001 Paris"
              className="w-full min-w-0 flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all"
            />
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleGeocode}
                disabled={geocoding}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60 min-h-[44px]"
              >
                {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                Géocoder
              </button>
              <button
                type="button"
                onClick={handleGPS}
                disabled={geocoding}
                title="Utiliser ma position (navigateur)"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium transition-colors disabled:opacity-60 min-h-[44px]"
              >
                <Navigation className="w-4 h-4" />
                Ma position
              </button>
            </div>
          </div>
        </div>

        {/* Résultat coordonnées */}
        {hasCoords && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/40">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              {city && (
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{city}</p>
              )}
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                {lat?.toFixed(5)}, {lng?.toFixed(5)}
              </p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-800/40">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Toggle visibilité */}
        <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center gap-3">
            {visible
              ? <Eye className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              : <EyeOff className="w-4 h-4 text-zinc-400" />
            }
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Visible sur la carte client
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Les clients à proximité pourront voir votre studio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              visible ? 'bg-blue-600 dark:bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                visible ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Aperçu lien vitrine */}
        {studioSlug && (
          <a
            href={`/studio/${studioSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Voir ma page vitrine · /studio/{studioSlug}
          </a>
        )}

        {/* Bouton sauvegarde */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasCoords || saving}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${
            hasCoords
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde…</>
          ) : saved ? (
            <><Check className="w-4 h-4" /> Position enregistrée !</>
          ) : (
            'Enregistrer la position'
          )}
        </button>

        {/* Info clé API */}
        {!getGoogleMapsBrowserApiKey() && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
            Pour « Géocoder » et l’adresse après « Ma position », ajoutez une clé navigateur (
            <code className="font-mono">VITE_GOOGLE_MAPS_JS_API_KEY</code>) avec l’API{' '}
            <strong className="font-medium text-zinc-500 dark:text-zinc-400">Geocoding</strong> activée sur Google Cloud.
          </p>
        )}
      </div>
    </div>
  );
};
