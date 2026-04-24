import React, { Suspense, useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  Filter,
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Camera,
  Share2,
  Loader2,
  Wand2,
  Copy,
  Download,
  ChevronDown,
  Check,
} from 'lucide-react';
import { LazyImageCropModal } from '../ui/lazyImageCropModal';
import { ImageCropModalSuspenseFallback } from '../ui/skeleton';
import { uploadPortfolioImage, dataUrlToBlob } from '../../lib/supabasePortfolio';
import { analyzePortfolioPhoto, isGeminiConfigured } from '../../lib/geminiAI';
import { useToast } from '../../contexts/ToastContext';
import type { Appointment } from '../../types';

interface PortfolioItem {
  id: string;
  url: string;
  category: string;
  artist: string;
  description: string;
  tags: string[];
  beforeUrl?: string;
  likes: number;
  createdAt: string;
  appointmentId?: string;
}

interface PortfolioManagerProps {
  items: PortfolioItem[];
  onAddItem: (item: PortfolioItem) => void;
  onDeleteItem: (id: string) => void;
  onEditItem?: (item: PortfolioItem) => void;
  artists: string[];
  studioId?: string | null;
  studioSlug?: string | null;
  studioName?: string | null;
  appointments?: Appointment[];
  /** Si studioId est null, appelé avant l'upload pour garantir que le studio existe */
  onEnsureStudio?: () => Promise<{ studioId: string; studioSlug: string } | null>;
}

const CATEGORIES = [
  'Realisme',
  'Traditionnel',
  'Neo-traditionnel',
  'Japonais',
  'Minimaliste',
  'Geometrique',
  'Aquarelle',
  'Dotwork',
  'Lettering',
  'Autre',
];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

/** Appareil photo / Android : MIME souvent vide ou `application/octet-stream` malgré une image valide. */
const IMAGE_NAME_EXT_RE = /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i;

function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  if (file.type === 'application/octet-stream' && IMAGE_NAME_EXT_RE.test(file.name)) return true;
  return IMAGE_NAME_EXT_RE.test(file.name);
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  items,
  onAddItem,
  onDeleteItem,
  onEditItem,
  artists,
  studioId,
  studioSlug,
  studioName,
  appointments = [],
  onEnsureStudio,
}) => {
  const toast = useToast();
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterArtist, setFilterArtist] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const beforeRef = useRef<HTMLInputElement>(null);

  const [newItem, setNewItem] = useState({
    url: '',
    beforeUrl: '',
    category: '',
    artist: artists[0] || '',
    description: '',
    tags: '',
    appointmentId: '',
  });
  const [dragOver, setDragOver] = useState(false);
  const cropBlobRef = useRef<string | null>(null);
  const [cropSession, setCropSession] = useState<{
    src: string;
    field: 'url' | 'beforeUrl';
  } | null>(null);

  const revokeCropSession = () => {
    if (cropBlobRef.current) {
      URL.revokeObjectURL(cropBlobRef.current);
      cropBlobRef.current = null;
    }
    setCropSession(null);
    setImageLoading(false);
  };

  const startCropFromFile = (file: File, field: 'url' | 'beforeUrl') => {
    if (cropBlobRef.current) URL.revokeObjectURL(cropBlobRef.current);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        cropBlobRef.current = null;
        setCropSession({ src: dataUrl, field });
        setImageLoading(false);
      } else {
        toast.error("Impossible de lire l'image");
        setImageLoading(false);
      }
    };
    reader.onerror = () => {
      toast.error('Erreur de lecture du fichier');
      setImageLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentAppointments = appointments
    .filter((a) => a.status !== 'cancelled' && a.date >= thirtyDaysAgo.toISOString().slice(0, 10))
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    .slice(0, 10);

  const [deleteMode, setDeleteMode] = useState(false);

  const filtered = items.filter((item) => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterArtist !== 'all' && item.artist !== filterArtist) return false;
    return true;
  });

  const confirmAndDelete = (item: PortfolioItem) => {
    if (!window.confirm('Supprimer cette photo du portfolio et de la vitrine ?')) return;
    onDeleteItem(item.id);
    toast.success('Photo supprimée');
    if (selectedItem?.id === item.id) setSelectedItem(null);
  };

  useEffect(() => {
    if (!selectedItem) setShowShareMenu(false);
  }, [selectedItem]);

  useEffect(() => {
    if (showUpload) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showUpload]);

  useEffect(() => {
    if (!showUpload) revokeCropSession();
  }, [showUpload]);

  // Préchargement léger : uniquement les 6 premières images visibles (évite surcharge réseau)
  useEffect(() => {
    const toPreload = filtered.slice(0, 6);
    toPreload.forEach((item) => {
      const img = new window.Image();
      img.src = item.url;
      if (item.beforeUrl) {
        const before = new window.Image();
        before.src = item.beforeUrl;
      }
    });
  }, [filtered]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (imageLoading) return;
    const file = e.dataTransfer.files[0];
    if (file && isLikelyImageFile(file)) {
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error('Image trop lourde (max 5 Mo)');
        return;
      }
      setUploadError(null);
      startCropFromFile(file, 'url');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'url' | 'beforeUrl') => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (!isLikelyImageFile(file)) {
      toast.error('Seules les images sont acceptées (JPEG, PNG, WebP…)');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error('Image trop lourde (max 5 Mo)');
      e.target.value = '';
      return;
    }
    setUploadError(null);
    setImageLoading(true);
    try {
      startCropFromFile(file, field);
    } catch (err) {
      toast.error("Impossible de charger l'image");
      setImageLoading(false);
    }
    e.target.value = '';
  };

  const handleAdd = async () => {
    if (!newItem.url) {
      toast.error('Ajoute une image et valide le recadrage.');
      return;
    }
    if (!newItem.category) {
      toast.error('Choisis un style / catégorie.');
      return;
    }
    setUploading(true);
    setUploadError(null);

    try {
      let finalUrl = newItem.url;
      let finalBeforeUrl = newItem.beforeUrl || undefined;

      let sid = studioId;
      let slug = studioSlug;
      if (!sid && onEnsureStudio) {
        const ensured = await onEnsureStudio();
        if (ensured) {
          sid = ensured.studioId;
          slug = ensured.studioSlug;
        }
      }

      if (sid && newItem.url.startsWith('data:')) {
        try {
          const blob = dataUrlToBlob(newItem.url);
          finalUrl = await uploadPortfolioImage(sid, blob, undefined, slug ?? undefined);
          if (newItem.beforeUrl?.startsWith('data:')) {
            const beforeBlob = dataUrlToBlob(newItem.beforeUrl);
            finalBeforeUrl = await uploadPortfolioImage(
              sid,
              beforeBlob,
              `before_${Date.now()}`,
              slug ?? undefined
            );
          }
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : 'Erreur upload';
          setUploadError(msg);
          toast.error(`Impossible d'enregistrer l'image : ${msg}`);
          return;
        }
      } else if (newItem.url.startsWith('data:') && !sid) {
        setUploadError('Studio non chargé. Réessayez dans quelques secondes.');
        toast.error('Studio non chargé. Réessayez dans quelques secondes.');
        return;
      }

      onAddItem({
        id: `p_${Date.now()}`,
        url: finalUrl,
        beforeUrl: finalBeforeUrl,
        category: newItem.category,
        artist: newItem.artist,
        description: newItem.description,
        tags: newItem.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        likes: 0,
        createdAt: new Date().toISOString(),
        appointmentId: newItem.appointmentId || undefined,
      });
      setNewItem({
        url: '',
        beforeUrl: '',
        category: '',
        artist: artists[0] || '',
        description: '',
        tags: '',
        appointmentId: '',
      });
      setImageLoading(false);
      setShowUpload(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!newItem.url || !newItem.url.startsWith('data:')) return;
    setAiGenerating(true);
    setUploadError(null);
    try {
      const result = await analyzePortfolioPhoto(newItem.url);
      setNewItem((prev) => ({
        ...prev,
        category: result.category,
        description: result.description,
        tags: result.tags,
      }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "L'IA n'a pas pu analyser la photo");
    } finally {
      setAiGenerating(false);
    }
  };

  /** Légende prête pour Instagram (description + hashtags) */
  const getInstagramCaption = (item: PortfolioItem): string => {
    const parts: string[] = [];
    if (item.description) parts.push(item.description);
    if (studioName) parts.push(`\nStudio — ${studioName}`);
    const tags = item.tags?.length ? item.tags : [item.category];
    const hashtags = tags.map((t) => `#${t.replace(/\s/g, '')}`).join(' ');
    if (hashtags) parts.push(`\n${hashtags}`);
    return parts.join('').trim();
  };

  const handleShare = async (item: PortfolioItem) => {
    try {
      if (navigator.share && item.url.startsWith('http')) {
        await navigator.share({
          title: item.description || item.category,
          text: getInstagramCaption(item),
          url: item.url,
        });
        toast.success('Partage lancé — choisissez Instagram dans le menu');
        setShowShareMenu(false);
      } else {
        handleDownload(item);
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      handleDownload(item);
    }
  };

  const handleCopyLink = async (item: PortfolioItem) => {
    if (!item.url.startsWith('http')) {
      toast.warning('Lien disponible après publication sur la vitrine');
      return;
    }
    try {
      await navigator.clipboard.writeText(item.url);
      toast.success('Lien copié dans le presse-papier');
      setShowShareMenu(false);
    } catch {
      toast.error('Impossible de copier le lien');
    }
  };

  const handleCopyCaption = async (item: PortfolioItem) => {
    const caption = getInstagramCaption(item);
    try {
      await navigator.clipboard.writeText(caption);
      toast.success('Légende copiée — collez-la dans Instagram');
      setShowShareMenu(false);
    } catch {
      toast.error('Impossible de copier la légende');
    }
  };

  const handleDownload = (item: PortfolioItem) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = `portfolio-${item.category}-${Date.now()}.jpg`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
    toast.success('Téléchargement lancé');
    setShowShareMenu(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Portfolio & Vitrine
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {items.length} {items.length > 1 ? 'réalisations' : 'réalisation'} — Prenez une photo,
            elle apparaît sur votre vitrine et peut être partagée sur Instagram
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-[0.98] shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter une photo
        </button>
      </div>

      {cropSession ? (
        <Suspense fallback={<ImageCropModalSuspenseFallback />}>
          <LazyImageCropModal
            isOpen
            imageSrc={cropSession.src}
            aspect={1}
            cropShape="rect"
            title="Ajuster le cadrage"
            onClose={revokeCropSession}
            onConfirm={async (dataUrl) => {
              const field = cropSession.field;
              revokeCropSession();
              if (field) setNewItem((prev) => ({ ...prev, [field]: dataUrl }));
            }}
          />
        </Suspense>
      ) : null}

      {/* Filters toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtres</span>
        </div>
        <div className="h-5 w-px bg-slate-200 dark:bg-zinc-700" />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-all"
        >
          <option value="all">Tous les styles</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {artists.length > 1 && (
          <select
            value={filterArtist}
            onChange={(e) => setFilterArtist(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-all"
          >
            <option value="all">Tous les artistes</option>
            {artists.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <button
            type="button"
            onClick={() => setDeleteMode((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-[0.98] touch-manipulation min-h-[40px] ${
              deleteMode
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-700'
            }`}
            aria-pressed={deleteMode}
            title={deleteMode ? 'Désactiver le mode suppression' : 'Supprimer en tapant une photo'}
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            {deleteMode ? 'Mode suppression' : 'Supprimer des photos'}
          </button>
          {(filterCategory !== 'all' || filterArtist !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setFilterCategory('all');
                setFilterArtist('all');
              }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2"
            >
              Réinitialiser filtres
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-slate-300 dark:text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {items.length === 0 ? 'Votre portfolio est vide' : 'Aucun résultat'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            {items.length === 0
              ? 'Commencez par ajouter vos plus belles réalisations pour attirer de nouveaux clients.'
              : 'Aucune photo ne correspond aux filtres sélectionnés.'}
          </p>
          {items.length === 0 && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-[0.98]"
            >
              <Upload className="w-4 h-4" />
              Ajouter votre première photo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item, index) => (
            <div
              key={item.id}
              className={`group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-lg transition-shadow duration-300 ${
                deleteMode
                  ? 'ring-2 ring-red-400 dark:ring-red-600 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900'
                  : ''
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (deleteMode) {
                    confirmAndDelete(item);
                    return;
                  }
                  setSelectedItem(item);
                }}
                className="absolute inset-0 z-0 block w-full h-full cursor-pointer p-0 border-0 bg-transparent"
                aria-label={deleteMode ? 'Supprimer cette photo' : 'Agrandir la photo'}
              >
                <img
                  src={item.url}
                  alt={item.description || 'Portfolio'}
                  loading="eager"
                  decoding="async"
                  fetchPriority={index < 8 ? 'high' : undefined}
                  className="pointer-events-none w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </button>
              {/* Actions toujours visibles (mobile sans hover) */}
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 pointer-events-auto">
                {onEditItem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditItem(item);
                    }}
                    className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center bg-black/50 backdrop-blur-sm text-white rounded-xl hover:bg-black/65 transition-colors shadow-lg active:scale-95 touch-manipulation"
                    aria-label="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmAndDelete(item);
                  }}
                  className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center bg-red-600/90 backdrop-blur-sm text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg active:scale-95 touch-manipulation"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {/* Infos au survol (desktop) */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="inline-block text-xs font-medium bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full mb-2">
                    {item.category}
                  </span>
                  {item.description && (
                    <p className="text-sm truncate opacity-90">{item.description}</p>
                  )}
                  {item.beforeUrl && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-500/80 px-2 py-0.5 rounded-full mt-2">
                      <ImageIcon className="w-3 h-3" /> Avant/Après
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal — opaque (pas de blur iOS), scrollable, safe-area */}
      {showUpload && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/95 flex justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
          onClick={() => {
            setShowUpload(false);
            setImageLoading(false);
          }}
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full my-auto p-6 border border-slate-200/80 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Ajouter au portfolio
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">Partagez votre dernière réalisation</p>
              </div>
              <button
                onClick={() => {
                  setShowUpload(false);
                  setImageLoading(false);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-zinc-800'
                    : 'border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                {imageLoading ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
                    <p className="text-sm text-slate-500">Chargement de l'image...</p>
                  </div>
                ) : newItem.url ? (
                  <div className="relative inline-block">
                    <img
                      src={newItem.url}
                      alt="Aperçu"
                      className="w-40 h-40 object-cover rounded-xl mx-auto shadow-lg"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewItem((p) => ({ ...p, url: '' }));
                      }}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-4 mb-3">
                      <button
                        type="button"
                        onClick={() => cameraRef.current?.click()}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"
                      >
                        <Camera className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          Prendre en photo
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <Upload className="w-8 h-8 text-slate-500 dark:text-zinc-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                          Galerie
                        </span>
                      </button>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Glissez une image ici
                    </p>
                    <p className="text-xs text-slate-500">
                      ou utilisez l'appareil photo / la galerie
                    </p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'url')}
                />
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'url')}
                />
              </div>

              {newItem.url && isGeminiConfigured() && (
                <button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={aiGenerating}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-700 hover:to-purple-700 disabled:opacity-60 transition-all"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Générer description, style et tags avec l'IA
                    </>
                  )}
                </button>
              )}

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                  {uploadError}
                </div>
              )}

              {recentAppointments.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Lier à un RDV (optionnel)
                  </label>
                  <select
                    value={newItem.appointmentId}
                    onChange={(e) => setNewItem((p) => ({ ...p, appointmentId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-sm"
                  >
                    <option value="">Aucun</option>
                    {recentAppointments.map((apt) => (
                      <option key={apt.id} value={apt.id}>
                        {apt.date} — {apt.clientName} — {apt.service || 'Tatouage'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Photo "avant"
                  </label>
                  <p className="text-xs text-slate-500">
                    Optionnel - pour montrer la transformation
                  </p>
                </div>
                <button
                  onClick={() => beforeRef.current?.click()}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    newItem.beforeUrl
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'bg-white dark:bg-zinc-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-600'
                  }`}
                >
                  {newItem.beforeUrl ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                      Photo ajoutée
                    </span>
                  ) : (
                    'Ajouter'
                  )}
                </button>
                <input
                  ref={beforeRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'beforeUrl')}
                />
              </div>

              <select
                value={newItem.category}
                onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
              >
                <option value="">Style / catégorie</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {artists.length > 1 && (
                <select
                  value={newItem.artist}
                  onChange={(e) => setNewItem((p) => ({ ...p, artist: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                >
                  {artists.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="text"
                value={newItem.description}
                onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description de la réalisation"
                className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
              />

              <input
                type="text"
                value={newItem.tags}
                onChange={(e) => setNewItem((p) => ({ ...p, tags: e.target.value }))}
                placeholder="Tags (séparés par des virgules)"
                className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
              />

              <button
                onClick={handleAdd}
                disabled={!newItem.url || !newItem.category || uploading || imageLoading}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Ajouter au portfolio & vitrine
                  </>
                )}
              </button>
              {(!newItem.url || !newItem.category) && !uploading && !imageLoading && (
                <p className="text-xs text-center text-slate-500 dark:text-zinc-400 mt-2">
                  {!newItem.url && !newItem.category
                    ? 'Prends ou choisis une image, valide le cadrage, puis sélectionne un style.'
                    : !newItem.url
                      ? 'Après le recadrage, l’aperçu doit apparaître ci-dessus.'
                      : 'Choisis un style / catégorie pour activer le bouton.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox — opaque, scrollable sur mobile, boutons fixés */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          onClick={() => setSelectedItem(null)}
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {/* Barre supérieure : Fermer + Partager — responsive mobile */}
          <div
            className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-3 gap-3"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShareMenu((v) => !v);
              }}
              className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg active:scale-[0.98] min-h-[44px] touch-manipulation"
            >
              <Share2 className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">Partager (Instagram)</span>
              <span className="sm:hidden">Partager</span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform ${showShareMenu ? 'rotate-180' : ''}`}
              />
            </button>
            <button
              onClick={() => setSelectedItem(null)}
              className="w-12 h-12 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors touch-manipulation"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Menu partage — mobile : bottom sheet, desktop : dropdown */}
          {showShareMenu && (
            <>
              <div
                className="fixed inset-0 z-30 bg-black/50"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShareMenu(false);
                }}
                aria-hidden
              />
              <div
                className="fixed left-0 right-0 bottom-0 z-40 bg-white dark:bg-zinc-900 rounded-t-2xl border-t border-zinc-200 dark:border-zinc-700 shadow-2xl sm:bottom-auto sm:left-auto sm:right-4 sm:top-14 sm:rounded-2xl sm:border sm:border-t sm:w-64 sm:pb-4"
                style={{
                  paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sm:hidden w-12 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full mx-auto mt-3 mb-2" />
                <div className="py-2 px-4 sm:px-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(selectedItem);
                      setShowShareMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 sm:py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors rounded-xl min-h-[48px] touch-manipulation"
                  >
                    <Share2 className="w-5 h-5 shrink-0 text-purple-500" />
                    Partager (menu système / Instagram)
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCaption(selectedItem);
                      setShowShareMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 sm:py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors rounded-xl min-h-[48px] touch-manipulation"
                  >
                    <Copy className="w-5 h-5 shrink-0 text-purple-500" />
                    Copier la légende
                  </button>
                  {selectedItem.url.startsWith('http') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(selectedItem);
                        setShowShareMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 sm:py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors rounded-xl min-h-[48px] touch-manipulation"
                    >
                      <Copy className="w-5 h-5 shrink-0 text-purple-500" />
                      Copier le lien
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(selectedItem);
                      setShowShareMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 sm:py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors rounded-xl min-h-[48px] touch-manipulation"
                  >
                    <Download className="w-5 h-5 shrink-0 text-purple-500" />
                    Télécharger
                  </button>
                </div>
              </div>
            </>
          )}
          <div
            className="max-w-5xl w-full mx-auto p-4 pt-24 sm:pt-20 animate-in fade-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItem.beforeUrl ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <span className="inline-block text-sm font-medium bg-white/10 backdrop-blur-sm text-white px-4 py-1.5 rounded-full mb-4">
                    Avant
                  </span>
                  <img
                    src={selectedItem.beforeUrl}
                    alt="Avant"
                    className="w-full rounded-2xl shadow-2xl"
                  />
                </div>
                <div className="text-center">
                  <span className="inline-block text-sm font-medium bg-blue-500/80 backdrop-blur-sm text-white px-4 py-1.5 rounded-full mb-4">
                    Après
                  </span>
                  <img
                    src={selectedItem.url}
                    alt="Après"
                    className="w-full rounded-2xl shadow-2xl"
                  />
                </div>
              </div>
            ) : (
              <img
                src={selectedItem.url}
                alt={selectedItem.description || 'Portfolio'}
                className="max-h-[80vh] mx-auto rounded-2xl shadow-2xl"
              />
            )}
            <div className="mt-6 text-center">
              <span className="inline-block text-sm font-medium bg-white/10 backdrop-blur-sm text-white px-4 py-1.5 rounded-full">
                {selectedItem.category}
              </span>
              {selectedItem.artist && (
                <span className="inline-block text-sm text-white/60 ml-3">
                  par {selectedItem.artist}
                </span>
              )}
              {selectedItem.description && (
                <p className="mt-3 text-white/80 max-w-lg mx-auto">{selectedItem.description}</p>
              )}
              {selectedItem.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {selectedItem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-white/5 text-white/60 px-2.5 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-8 pb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto px-2">
                {onEditItem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const item = selectedItem;
                      setSelectedItem(null);
                      onEditItem(item);
                    }}
                    className="min-h-[48px] px-5 py-3 rounded-xl border border-white/25 text-white font-semibold hover:bg-white/10 transition-colors touch-manipulation active:scale-[0.98]"
                  >
                    Modifier les infos
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!selectedItem) return;
                    confirmAndDelete(selectedItem);
                  }}
                  className="min-h-[48px] px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg transition-colors touch-manipulation active:scale-[0.98] inline-flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5 shrink-0" />
                  Supprimer du portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
