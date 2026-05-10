/**
 * Onboarding — Fiche Google Maps / localisation studio (avis + carte vitrine).
 */
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Loader2, Search, Navigation } from 'lucide-react';
import { Logo } from '../Logo';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import {
  looksLikeShortMapsShareLink,
  normalizeMapsPasteInput,
  parsePlaceIdFromPaste,
} from '../../lib/parseGooglePlaceId';
import {
  resolveMapsPasteViaEdge,
  searchGooglePlaces,
  formatGooglePlacesInvokeError,
  syncStudioGoogleReviewsCache,
} from '../../lib/googlePlaces';
import type { GooglePlaceSearchResultDTO } from '../../types/googlePlaces';

const heroImg = '/images/fallon-michael-EQucs66pts0-unsplash.jpg';

export interface OnboardingEstablishmentStepProps {
  studioId: string;
  /** Nom du studio saisi à l’étape précédente (recherche Google). */
  studioNameHint: string;
  onComplete: () => void;
}

export const OnboardingEstablishmentStep: React.FC<OnboardingEstablishmentStepProps> = ({
  studioId,
  studioNameHint,
  onComplete,
}) => {
  const toast = useToast();
  const [paste, setPaste] = useState('');
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<GooglePlaceSearchResultDTO[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const persistPlaceId = useCallback(
    async (placeId: string | null) => {
      const now = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('inkflow_studios') as any)
        .update({
          google_place_id: placeId,
          updated_at: now,
        })
        .eq('id', studioId);
      if (error) throw new Error(error.message);
    },
    [studioId]
  );

  const syncReviewsAfterSave = useCallback(
    async (placeId: string) => {
      try {
        await syncStudioGoogleReviewsCache(studioId, placeId);
      } catch (e) {
        console.warn('[OnboardingEstablishment] syncStudioGoogleReviewsCache', e);
        toast.info(
          'Fiche enregistrée. Les avis Google peuvent prendre une minute à s’afficher sur la vitrine (cache serveur).'
        );
      }
    },
    [studioId, toast]
  );

  const saveFromPaste = useCallback(async () => {
    const idRaw = paste.trim();
    if (!idRaw) {
      toast.error('Collez le lien ou le code de votre fiche Google');
      return;
    }
    const cleaned = normalizeMapsPasteInput(idRaw);
    setSaving(true);
    try {
      let parsed = parsePlaceIdFromPaste(idRaw) ?? parsePlaceIdFromPaste(cleaned);
      if (!parsed) {
        parsed = await resolveMapsPasteViaEdge(cleaned);
      }
      if (!parsed && cleaned !== idRaw) {
        parsed = await resolveMapsPasteViaEdge(idRaw);
      }
      if (!parsed && cleaned.length >= 3) {
        try {
          const list = await searchGooglePlaces(cleaned.slice(0, 200));
          if (list.length > 0) parsed = list[0].placeId;
        } catch {
          /* ignore */
        }
      }
      if (!parsed) {
        toast.error(
          looksLikeShortMapsShareLink(idRaw)
            ? 'Ouvre ce lien dans le navigateur, puis copie l’URL complète dans la barre d’adresse.'
            : 'Impossible d’extraire l’identifiant. Colle l’URL de ta fiche Google Maps ou un code ChIJ…'
        );
        return;
      }
      await persistPlaceId(parsed);
      await syncReviewsAfterSave(parsed);
      toast.success('Fiche Google enregistrée');
      onComplete();
    } catch (e) {
      toast.error(
        e instanceof Error ? formatGooglePlacesInvokeError(e.message) : 'Enregistrement impossible'
      );
    } finally {
      setSaving(false);
    }
  }, [paste, persistPlaceId, syncReviewsAfterSave, toast, onComplete]);

  const searchByName = async () => {
    const q = studioNameHint.trim() || 'studio tatouage';
    setSearching(true);
    setHits([]);
    setSelectedPlaceId(null);
    try {
      const list = await searchGooglePlaces(q.slice(0, 200));
      setHits(list.slice(0, 6));
      if (list.length === 0)
        toast.error('Aucun résultat — essaie un autre nom ou colle l’URL Maps.');
    } catch (e) {
      toast.error(
        e instanceof Error ? formatGooglePlacesInvokeError(e.message) : 'Recherche indisponible'
      );
    } finally {
      setSearching(false);
    }
  };

  const saveSelected = async () => {
    if (!selectedPlaceId) {
      toast.error('Choisis une fiche dans la liste');
      return;
    }
    setSaving(true);
    try {
      await persistPlaceId(selectedPlaceId);
      await syncReviewsAfterSave(selectedPlaceId);
      toast.success('Fiche Google enregistrée');
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  const requestGeolocationHint = () => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non disponible sur cet appareil');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeoLoading(false);
        toast.success(
          'Position reçue — lance une recherche avec le nom du studio, ou colle le lien « Partager » de ta fiche Google Maps.'
        );
      },
      () => {
        setGeoLoading(false);
        toast.error(
          'Accès à la position refusé — tu peux coller l’URL de ta fiche ou chercher par nom.'
        );
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 }
    );
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col lg:flex-row min-h-0 h-[100dvh] max-h-[100dvh] overflow-hidden bg-white dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-labelledby="est-title"
    >
      <div className="flex-1 flex flex-col min-h-0 max-h-full overflow-y-auto overscroll-y-contain touch-pan-y touch-scroll-ios">
        <div className="lg:hidden flex-shrink-0 h-28 sm:h-36 relative overflow-hidden safe-top">
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-transparent" />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-5 sm:py-8 safe-bottom min-h-0">
          <motion.div
            className="w-full max-w-md mx-auto py-4 sm:py-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 mb-5 sm:mb-6">
              <Logo className="dark:invert" />
              <span className="text-xl font-bold text-zinc-900 dark:text-white">InkFlow</span>
            </div>

            <h1
              id="est-title"
              className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1.5"
            >
              Localisation & fiche Google
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-5 sm:mb-6">
              Relie ta fiche Google Maps pour afficher la carte et les avis sur ta vitrine publique.
              Tu pourras la modifier plus tard dans Paramètres → Établissement.
            </p>

            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                  <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Recherche rapide
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  On cherche avec le nom de ton studio :{' '}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {studioNameHint || '—'}
                  </span>
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => void searchByName()}
                    disabled={searching}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 active:scale-[0.98] transition-all"
                  >
                    {searching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Chercher sur Google
                  </button>
                  <button
                    type="button"
                    onClick={requestGeolocationHint}
                    disabled={geoLoading}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all text-sm font-medium"
                  >
                    {geoLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                    Autoriser la position
                  </button>
                </div>
                {hits.length > 0 && (
                  <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {hits.map((h) => (
                      <li key={h.placeId}>
                        <button
                          type="button"
                          onClick={() => setSelectedPlaceId(h.placeId)}
                          className={`w-full text-left rounded-xl border px-3 py-2.5 text-sm transition-all active:scale-[0.99] ${
                            selectedPlaceId === h.placeId
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                              : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                          }`}
                        >
                          <span className="font-medium text-zinc-900 dark:text-white">
                            {h.name}
                          </span>
                          <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {h.formattedAddress}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {hits.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void saveSelected()}
                    disabled={saving || !selectedPlaceId}
                    className="mt-3 w-full min-h-[44px] rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null} Utiliser
                    cette fiche
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Coller un lien ou un Place ID
                </div>
                <textarea
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  placeholder="URL Google Maps ou code commençant par ChIJ…"
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => void saveFromPaste()}
                  disabled={saving}
                  className="mt-3 w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 font-semibold text-sm text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null} Enregistrer
                  ce lien
                </button>
              </div>

              <button
                type="button"
                onClick={onComplete}
                className="w-full min-h-[48px] py-3 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                Continuer sans fiche Google — je le ferai plus tard
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="hidden lg:flex lg:w-[520px] xl:w-[600px] min-h-screen flex-shrink-0 relative overflow-hidden"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 w-full min-h-full object-cover object-bottom"
          loading="eager"
        />
        <div className="absolute bottom-0 left-0 right-0 z-10 px-10 pb-10 pt-16 pointer-events-none">
          <h2 className="text-white text-2xl font-bold leading-snug mb-1 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            Visible sur la carte.
          </h2>
          <p className="text-white text-base [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">
            Les clients te trouvent plus vite.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
