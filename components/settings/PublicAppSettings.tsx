import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Copy,
  ExternalLink,
  ImageOff,
  MapPin,
  Palette,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import type { ArtistAccount, FlashDesign } from '../../types';
import {
  fetchInkflowArtistsForStudio,
  updateInkflowArtistPublicFields,
  type InkflowArtistPublicRow,
} from '../../lib/inkflowArtistsSync';
import {
  ClientAppMirrorPreview,
  type MirrorFlashPreview,
  type MirrorPreviewAccent,
} from '../dashboard/ClientAppMirrorPreview';

const BIO_MAX = 500;
const TAGLINE_MAX = 140;
const STUDIO_DESC_MAX = 2000;
const MAX_FEATURED = 12;

interface PublicAppSettingsProps {
  studioId: string;
  studioSlug: string | null;
  studioName: string;
  artistAccounts: ArtistAccount[];
  flashDesigns: FlashDesign[];
  onUpdateFlash: (id: string, updates: Partial<FlashDesign>) => void;
  onOpenGeoSettings: () => void;
  /** Vitrine : phrase courte (cartes) */
  studioTagline?: string;
  /** Vitrine : bio longue */
  studioDescription?: string;
  onSaveStudioCopy?: (payload: { tagline: string; description: string }) => void | Promise<void>;
  /** Ville / adresse courte pour l’aperçu « Autour de moi » */
  previewCityLabel?: string;
}

type FlashSortKey = 'title' | 'price' | 'created';

export const PublicAppSettings: React.FC<PublicAppSettingsProps> = ({
  studioId,
  studioSlug,
  studioName,
  artistAccounts,
  flashDesigns,
  onUpdateFlash,
  onOpenGeoSettings,
  studioTagline = '',
  studioDescription = '',
  onSaveStudioCopy,
  previewCityLabel,
}) => {
  const toast = useToast();
  const [rows, setRows] = useState<InkflowArtistPublicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<
    Record<string, { bio: string; instagram_url: string; available_now: boolean }>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [studioTaglineDraft, setStudioTaglineDraft] = useState(studioTagline);
  const [studioDescriptionDraft, setStudioDescriptionDraft] = useState(studioDescription);
  const [savingStudioCopy, setSavingStudioCopy] = useState(false);

  const [flashQuery, setFlashQuery] = useState('');
  const [hideUnavailable, setHideUnavailable] = useState(true);
  const [flashSort, setFlashSort] = useState<FlashSortKey>('created');
  const [previewAccent, setPreviewAccent] = useState<MirrorPreviewAccent>('blue');

  useEffect(() => {
    setStudioTaglineDraft(studioTagline);
    setStudioDescriptionDraft(studioDescription);
  }, [studioTagline, studioDescription]);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchInkflowArtistsForStudio(studioId);
    setRows(data);
    const d: Record<string, { bio: string; instagram_url: string; available_now: boolean }> = {};
    for (const r of data) {
      d[r.id] = {
        bio: r.bio ?? '',
        instagram_url: r.instagram_url ?? '',
        available_now: r.available_now,
      };
    }
    setDrafts(d);
    setLoading(false);
  }, [studioId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!studioId) return;
    const ch = supabase
      .channel(`public_app_artists_${studioId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inkflow_artists', filter: `studio_id=eq.${studioId}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [studioId, load]);

  const saveStudioBio = async () => {
    if (!onSaveStudioCopy) {
      toast.error('Connexion requise pour enregistrer');
      return;
    }
    setSavingStudioCopy(true);
    try {
      await onSaveStudioCopy({
        tagline: studioTaglineDraft.trim(),
        description: studioDescriptionDraft.trim(),
      });
    } catch {
      toast.error('Erreur lors de l’enregistrement');
    } finally {
      setSavingStudioCopy(false);
    }
  };

  const saveArtist = async (artistId: string) => {
    const d = drafts[artistId];
    if (!d) return;
    setSavingId(artistId);
    try {
      await updateInkflowArtistPublicFields(artistId, {
        bio: d.bio.trim() || null,
        instagram_url: d.instagram_url.trim() || null,
        available_now: d.available_now,
      });
      toast.success('Profil public mis à jour');
      await load();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingId(null);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const studioPublicUrl = studioSlug ? `${origin}/studio/${studioSlug}` : '';

  const copyText = async (msg: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error('Copie impossible');
    }
  };

  const artistNameById = useMemo(() => new Map(artistAccounts.map((a) => [a.id, a.name])), [artistAccounts]);

  const mirrorFlashes: MirrorFlashPreview[] = useMemo(() => {
    const byArtist = new Map(artistAccounts.map((a) => [a.id, a.name]));
    const available = flashDesigns.filter((f) => f.available && !f.reserved);
    const featuredList = available
      .filter((f) => f.featured)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const rest = available
      .filter((f) => !f.featured)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const ordered = [...featuredList, ...rest].slice(0, 12);
    return ordered.map((f) => ({
      id: f.id,
      title: f.title,
      imageUrl: f.imageUrl,
      price: f.price,
      featured: f.featured ?? false,
      displayOrder: f.displayOrder,
      artistName: (f.artistId && byArtist.get(f.artistId)) || studioName,
    }));
  }, [flashDesigns, artistAccounts, studioName]);

  const anyAvailableNow = useMemo(
    () => Object.values(drafts).some((x) => x.available_now),
    [drafts]
  );

  const activeArtists = artistAccounts.filter((a) => a.active);

  const filteredFlashes = useMemo(() => {
    let list = [...flashDesigns];
    if (hideUnavailable) list = list.filter((f) => f.available && !f.reserved);
    const q = flashQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((f) => {
        const inTitle = f.title.toLowerCase().includes(q);
        const inCat = f.category?.toLowerCase().includes(q);
        const inTags = f.tags.some((t) => t.toLowerCase().includes(q));
        return inTitle || inCat || inTags;
      });
    }
    list.sort((a, b) => {
      if (flashSort === 'title') return a.title.localeCompare(b.title, 'fr');
      if (flashSort === 'price') return a.price - b.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [flashDesigns, hideUnavailable, flashQuery, flashSort]);

  const featuredCount = flashDesigns.filter((f) => f.featured).length;
  const availableForFeature = flashDesigns.filter((f) => f.available && !f.reserved);

  const handleToggleFeatured = (f: FlashDesign, checked: boolean) => {
    if (checked && featuredCount >= MAX_FEATURED && !f.featured) {
      toast.error(`Maximum ${MAX_FEATURED} flashs en vedette. Retirez-en une avant d’en ajouter.`);
      return;
    }
    if (checked) {
      const maxOrder = Math.max(-1, ...flashDesigns.filter((x) => x.featured).map((x) => x.displayOrder ?? 0));
      onUpdateFlash(f.id, { featured: true, displayOrder: maxOrder + 1 });
    } else {
      onUpdateFlash(f.id, { featured: false, displayOrder: 0 });
    }
  };

  const handleFeatureTopAvailable = () => {
    const pool = [...flashDesigns].filter((f) => f.available && !f.reserved);
    pool.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const pick = pool.slice(0, Math.min(MAX_FEATURED, pool.length));
    const pickIds = new Set(pick.map((p) => p.id));
    flashDesigns.forEach((f) => {
      if (pickIds.has(f.id)) {
        const idx = pick.findIndex((p) => p.id === f.id);
        onUpdateFlash(f.id, { featured: true, displayOrder: idx });
      } else if (f.featured) {
        onUpdateFlash(f.id, { featured: false, displayOrder: 0 });
      }
    });
    toast.success(`${pick.length} flash(s) mis en vedette`);
  };

  const handleClearAllFeatured = () => {
    flashDesigns.forEach((f) => {
      if (f.featured) onUpdateFlash(f.id, { featured: false, displayOrder: 0 });
    });
    toast.success('Vedettes retirées');
  };

  const bioTrim = studioDescriptionDraft.trim();
  const mirrorBioSnippet = bioTrim.length > 220 ? `${bioTrim.slice(0, 220)}…` : bioTrim;

  const cityForPreview =
    previewCityLabel?.trim() ||
    (studioSlug ? studioName.split(/\s+/).slice(0, 2).join(' ') : 'Paris');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-10 items-start">
      <div className="space-y-6 min-w-0">
        {/* Bio studio (vitrine) */}
        {onSaveStudioCopy && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 border-l-4 border-l-emerald-500/90">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Texte public du studio</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Phrase d’accroche et bio « À propos » — identiques à la page vitrine et utilisées dans l’app.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline mb-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Phrase d’accroche</label>
                  <span className="text-xs text-zinc-400">
                    {studioTaglineDraft.length}/{TAGLINE_MAX}
                  </span>
                </div>
                <input
                  type="text"
                  value={studioTaglineDraft}
                  maxLength={TAGLINE_MAX}
                  onChange={(e) => setStudioTaglineDraft(e.target.value)}
                  placeholder="Ex. Neo-trad & fineline — réservation en ligne"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                />
              </div>
              <div>
                <div className="flex justify-between items-baseline mb-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Bio / À propos</label>
                  <span className="text-xs text-zinc-400">
                    {studioDescriptionDraft.length}/{STUDIO_DESC_MAX}
                  </span>
                </div>
                <textarea
                  value={studioDescriptionDraft}
                  maxLength={STUDIO_DESC_MAX}
                  onChange={(e) => setStudioDescriptionDraft(e.target.value)}
                  rows={5}
                  placeholder="Ambiance, styles, politique d’acompte…"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                />
              </div>
              <button
                type="button"
                disabled={savingStudioCopy}
                onClick={() => void saveStudioBio()}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {savingStudioCopy ? 'Enregistrement…' : 'Enregistrer le texte vitrine'}
              </button>
            </div>
          </div>
        )}

        {/* Profil public */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Mon profil public & app</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Fiches tatoueurs, badge « Dispo », liens publics — synchronisés avec la recherche client.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {studioPublicUrl && (
                <button
                  type="button"
                  onClick={() => copyText('Lien copié', studioPublicUrl)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
                >
                  <Copy className="w-3.5 h-3.5" /> Copier le lien vitrine
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {studioSlug && (
              <a
                href={studioPublicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 active:scale-[0.98]"
              >
                <ExternalLink className="w-4 h-4" />
                Voir ma page vitrine
              </a>
            )}
            <button
              type="button"
              onClick={onOpenGeoSettings}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
            >
              <MapPin className="w-4 h-4 text-blue-500" />
              Position & carte (studio)
            </button>
          </div>

          {studioPublicUrl && (
            <p className="text-xs text-zinc-500 mb-6 font-mono break-all rounded-xl bg-zinc-50 dark:bg-zinc-950/50 px-3 py-2 border border-zinc-100 dark:border-zinc-800">
              {studioPublicUrl}
            </p>
          )}

          <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/20 px-4 py-3 mb-6">
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              Astuce : le badge vert « Dispo » apparaît dans l’app quand au moins un tatoueur coche « Disponible
              maintenant » ci-dessous.
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-zinc-500">Chargement…</p>
          ) : activeArtists.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Ajoutez un tatoueur dans <strong>Compte</strong> ou <strong>Établissement</strong> pour publier une
              fiche <code className="text-xs">/artist/…</code> et compléter bio & Instagram ici.
            </p>
          ) : (
            <div className="space-y-6">
              {activeArtists.map((a) => {
                const row = rows.find((r) => r.id === a.id);
                const slug = row?.slug;
                const d = drafts[a.id] ?? { bio: '', instagram_url: '', available_now: false };
                const artistUrl = slug ? `${origin}/artist/${slug}` : '';
                return (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/30"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 shrink-0">
                          {a.avatar ? (
                            <img src={a.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-300">
                              {a.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{a.name}</h3>
                          {a.specialties?.length ? (
                            <p className="text-xs text-zinc-500 truncate">{a.specialties.slice(0, 4).join(' · ')}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {artistUrl && (
                          <>
                            <a
                              href={artistUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Page
                            </a>
                            <button
                              type="button"
                              onClick={() => copyText('Lien tatoueur copié', artistUrl)}
                              className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copier
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <label className="flex items-center justify-between gap-3 cursor-pointer rounded-xl border border-zinc-200/80 dark:border-zinc-700 px-3 py-2.5 bg-white/60 dark:bg-zinc-900/40">
                      <div>
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Disponible maintenant</span>
                        <p className="text-xs text-zinc-500 mt-0.5">Badge « Dispo » dans l’app</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={d.available_now}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [a.id]: { ...d, available_now: e.target.checked },
                          }))
                        }
                        className="rounded border-zinc-300 text-blue-600 w-5 h-5 shrink-0"
                      />
                    </label>

                    <div>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Bio (app)</label>
                        <span className="text-xs text-zinc-400">
                          {d.bio.length}/{BIO_MAX}
                        </span>
                      </div>
                      <textarea
                        value={d.bio}
                        maxLength={BIO_MAX}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [a.id]: { ...d, bio: e.target.value } }))
                        }
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                        placeholder="Style, univers, types de projets…"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Instagram
                      </label>
                      <input
                        type="url"
                        value={d.instagram_url}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [a.id]: { ...d, instagram_url: e.target.value } }))
                        }
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                        placeholder="https://instagram.com/…"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={savingId === a.id}
                      onClick={() => saveArtist(a.id)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98]"
                    >
                      {savingId === a.id ? 'Enregistrement…' : 'Enregistrer ce tatoueur'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Flashs vedette */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Flashs mis en avant</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Jusqu’à {MAX_FEATURED} designs dans le carrousel « En vedette ». Filtrez, cochez ou utilisez les
                actions rapides.
              </p>
            </div>
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300 shrink-0">
              {featuredCount} / {MAX_FEATURED} vedettes · {flashDesigns.length} flashs
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={handleFeatureTopAvailable}
              disabled={availableForFeature.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 active:scale-[0.98]"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              Mettre les plus récents en vedette
            </button>
            <button
              type="button"
              onClick={handleClearAllFeatured}
              disabled={featuredCount === 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98]"
            >
              Tout retirer des vedettes
            </button>
          </div>

          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="search"
                value={flashQuery}
                onChange={(e) => setFlashQuery(e.target.value)}
                placeholder="Rechercher titre, catégorie, tag…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <label className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideUnavailable}
                  onChange={(e) => setHideUnavailable(e.target.checked)}
                  className="rounded border-zinc-300 text-blue-600 w-4 h-4"
                />
                Masquer indisponibles / réservés
              </label>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <label className="text-zinc-600 dark:text-zinc-400">
                Trier :{' '}
                <select
                  value={flashSort}
                  onChange={(e) => setFlashSort(e.target.value as FlashSortKey)}
                  className="ml-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-sm"
                >
                  <option value="created">Récent</option>
                  <option value="title">A–Z</option>
                  <option value="price">Prix</option>
                </select>
              </label>
            </div>
          </div>

          <div className="space-y-2 max-h-[min(400px,55vh)] overflow-y-auto pr-1">
            {flashDesigns.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucun flash — ajoutez-en dans l’onglet Galerie.</p>
            ) : filteredFlashes.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucun résultat — élargissez la recherche.</p>
            ) : (
              filteredFlashes.map((f) => (
                <label
                  key={f.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
                    {f.imageUrl ? (
                      <img src={f.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="w-6 h-6 text-zinc-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-zinc-900 dark:text-white block truncate">{f.title}</span>
                    <span className="text-xs text-zinc-500">
                      {(f.artistId && artistNameById.get(f.artistId)) || studioName} · {f.price}€
                      {!f.available || f.reserved ? (
                        <span className="text-amber-600 dark:text-amber-400"> · Indisponible</span>
                      ) : null}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={f.featured ?? false}
                    onChange={(e) => handleToggleFeatured(f, e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 w-5 h-5 shrink-0"
                  />
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="xl:sticky xl:top-24 space-y-4 flex flex-col items-center">
        <div className="w-full max-w-[320px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Couleur d’accent (aperçu)</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            Change uniquement la teinte du mockup téléphone, pas l’app réelle des clients.
          </p>
          <div className="flex gap-2">
            {(['blue', 'emerald', 'violet'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPreviewAccent(key)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all active:scale-[0.98] ${
                  previewAccent === key
                    ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-white ring-offset-zinc-50 dark:ring-offset-zinc-900'
                    : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  background:
                    key === 'blue' ? '#1e3a5f' : key === 'emerald' ? '#064e3b' : '#4c1d95',
                  color: '#fff',
                }}
              >
                {key === 'blue' ? 'Bleu' : key === 'emerald' ? 'Vert' : 'Violet'}
              </button>
            ))}
          </div>
        </div>

        <ClientAppMirrorPreview
          studioName={studioName}
          flashes={mirrorFlashes}
          availableNow={anyAvailableNow}
          cityLabel={cityForPreview}
          studioTagline={studioTaglineDraft}
          studioBioPreview={mirrorBioSnippet || undefined}
          accent={previewAccent}
        />
      </div>
    </div>
  );
};
