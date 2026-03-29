import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, MapPin, Sparkles } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import type { ArtistAccount, FlashDesign } from '../../types';
import {
  fetchInkflowArtistsForStudio,
  updateInkflowArtistPublicFields,
  type InkflowArtistPublicRow,
} from '../../lib/inkflowArtistsSync';
import { ClientAppMirrorPreview, type MirrorFlashPreview } from '../dashboard/ClientAppMirrorPreview';

interface PublicAppSettingsProps {
  studioId: string;
  studioSlug: string | null;
  studioName: string;
  artistAccounts: ArtistAccount[];
  flashDesigns: FlashDesign[];
  onUpdateFlash: (id: string, updates: Partial<FlashDesign>) => void;
  onOpenGeoSettings: () => void;
}

export const PublicAppSettings: React.FC<PublicAppSettingsProps> = ({
  studioId,
  studioSlug,
  studioName,
  artistAccounts,
  flashDesigns,
  onUpdateFlash,
  onOpenGeoSettings,
}) => {
  const toast = useToast();
  const [rows, setRows] = useState<InkflowArtistPublicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { bio: string; instagram_url: string; available_now: boolean }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

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
        () => {
          load();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [studioId, load]);

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

  const mirrorFlashes: MirrorFlashPreview[] = useMemo(() => {
    const byArtist = new Map(artistAccounts.map((a) => [a.id, a.name]));
    return flashDesigns
      .filter((f) => f.available && !f.reserved)
      .slice(0, 12)
      .map((f) => ({
        id: f.id,
        title: f.title,
        imageUrl: f.imageUrl,
        price: f.price,
        featured: f.featured ?? false,
        artistName: (f.artistId && byArtist.get(f.artistId)) || studioName,
      }));
  }, [flashDesigns, artistAccounts, studioName]);

  const anyAvailableNow = useMemo(() => {
    return Object.values(drafts).some((x) => x.available_now);
  }, [drafts]);

  const activeArtists = artistAccounts.filter((a) => a.active);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-10 items-start">
      <div className="space-y-6 min-w-0">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Mon profil public & app</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Ces réglages synchronisent la fiche tatoueur et l&apos;expérience client (recherche, favoris).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {studioSlug && (
              <a
                href={`${origin}/studio/${studioSlug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98]"
              >
                <ExternalLink className="w-4 h-4" />
                Voir ma page vitrine
              </a>
            )}
            <button
              type="button"
              onClick={onOpenGeoSettings}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98]"
            >
              <MapPin className="w-4 h-4 text-blue-500" />
              Position & carte (studio)
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-zinc-500">Chargement…</p>
          ) : activeArtists.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Ajoutez un tatoueur dans <strong>Compte</strong> ou <strong>Établissement</strong> pour publier une fiche{' '}
              <code className="text-xs">/artist/…</code>.
            </p>
          ) : (
            <div className="space-y-6">
              {activeArtists.map((a) => {
                const row = rows.find((r) => r.id === a.id);
                const slug = row?.slug;
                const d = drafts[a.id] ?? { bio: '', instagram_url: '', available_now: false };
                return (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/30"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{a.name}</h3>
                      {slug && (
                        <a
                          href={`${origin}/artist/${slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Page publique tatoueur
                        </a>
                      )}
                    </div>

                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Disponible maintenant</span>
                      <input
                        type="checkbox"
                        checked={d.available_now}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [a.id]: { ...d, available_now: e.target.checked },
                          }))
                        }
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                      />
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Bio (app & vitrine)</label>
                      <textarea
                        value={d.bio}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [a.id]: { ...d, bio: e.target.value } }))
                        }
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white"
                        placeholder="Quelques mots sur ton style…"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Instagram</label>
                      <input
                        type="url"
                        value={d.instagram_url}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [a.id]: { ...d, instagram_url: e.target.value } }))
                        }
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white"
                        placeholder="https://instagram.com/…"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={savingId === a.id}
                      onClick={() => saveArtist(a.id)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                      {savingId === a.id ? 'Enregistrement…' : 'Enregistrer ce tatoueur'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">Flashs mis en avant</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Cocher les designs affichés en priorité dans le carrousel « vedette » de l&apos;app client.
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {flashDesigns.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucun flash — ajoutez-en dans l&apos;onglet Galerie.</p>
            ) : (
              flashDesigns.map((f) => (
                <label
                  key={f.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{f.title}</span>
                  <input
                    type="checkbox"
                    checked={f.featured ?? false}
                    onChange={(e) => onUpdateFlash(f.id, { featured: e.target.checked })}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-5 h-5 shrink-0"
                  />
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="xl:sticky xl:top-24 flex justify-center">
        <ClientAppMirrorPreview
          studioName={studioName}
          flashes={mirrorFlashes}
          availableNow={anyAvailableNow}
        />
      </div>
    </div>
  );
};
