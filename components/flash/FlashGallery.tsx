import React, { useState } from 'react';
import { Search, Filter, Clock, DollarSign, CheckCircle, X, Plus, Grid3X3, List, Edit, Trash2, Sparkles, Loader2, Copy, Check, Star } from 'lucide-react';
import { FlashDesign, type ArtistAccount } from '../../types';
import { Modal } from '../ui/Modal';
import { ImageUploadField } from '../ui/ImageUploadField';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { getVitrineShareUrl } from '../../lib/urls';

const STYLE_OPTIONS = ['Minimaliste', 'Traditional', 'Géométrique', 'Japonais', 'Réalisme', 'Blackwork', 'Autre'];

interface FlashGalleryProps {
  designs: FlashDesign[];
  onBook: (design: FlashDesign) => void;
  onAddFlash?: (flash: Omit<FlashDesign, 'id' | 'createdAt'>) => void;
  onUpdateFlash?: (id: string, updates: Partial<FlashDesign>) => void;
  onDeleteFlash?: (id: string) => void;
  /** Slug studio pour lien vitrine */
  studioSlug?: string | null;
  /** Tatoueurs du studio (liaison flash → artiste public) */
  artists?: ArtistAccount[];
}

export const FlashGallery: React.FC<FlashGalleryProps> = ({
  designs,
  onBook,
  onAddFlash,
  onUpdateFlash,
  onDeleteFlash,
  studioSlug,
  artists = [],
}) => {
  const toast = useToast();
  const [linkCopied, setLinkCopied] = useState(false);
  const vitrineUrl = studioSlug ? getVitrineShareUrl(studioSlug) : '';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDesign, setSelectedDesign] = useState<FlashDesign | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingFlash, setEditingFlash] = useState<FlashDesign | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [savingFlash, setSavingFlash] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    price: 100,
    depositAmount: 30,
    category: 'Minimaliste',
    size: 'small' as const,
    estimatedDuration: 60,
    placement: ['Bras'],
    tags: [''],
    artistId: '' as string,
    featured: false,
    displayOrder: 0,
    slug: '',
  });

  const categories = ['all', ...Array.from(new Set<string>(designs.map(d => d.category)))];

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = design.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (design.tags ?? []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || design.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBookNow = (design: FlashDesign) => {
    if (design.reserved) {
      toast.warning('Ce flash est déjà réservé');
      return;
    }
    onBook(design);
    setSelectedDesign(null);
  };

  const openAddModal = () => {
    setEditingFlash(null);
    setForm({
      title: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400',
      price: 100,
      depositAmount: 30,
      category: 'Minimaliste',
      size: 'small',
      estimatedDuration: 60,
      placement: ['Bras'],
      tags: [''],
      artistId: artists?.[0]?.id ?? '',
      featured: false,
      displayOrder: 0,
      slug: '',
    });
    setShowFormModal(true);
  };

  const openEditModal = (flash: FlashDesign) => {
    setEditingFlash(flash);
    setForm({
      title: flash.title,
      description: flash.description || '',
      imageUrl: flash.imageUrl,
      price: flash.price,
      depositAmount: flash.depositAmount,
      category: flash.category,
      size: flash.size,
      estimatedDuration: flash.estimatedDuration,
      placement: flash.placement?.length ? flash.placement : ['Bras'],
      tags: flash.tags?.length ? flash.tags : [''],
      artistId: flash.artistId ?? '',
      featured: flash.featured ?? false,
      displayOrder: flash.displayOrder ?? 0,
      slug: flash.slug ?? '',
    });
    setShowFormModal(true);
  };

  const handleSaveFlash = () => {
    if (!form.title.trim() || savingFlash) return;
    const tags = form.tags.filter(t => t.trim());
    const placement = form.placement.filter(p => p.trim());
    const data: Omit<FlashDesign, 'id' | 'createdAt'> = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl || 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400',
      price: form.price,
      depositAmount: form.depositAmount,
      available: !editingFlash?.reserved,
      reserved: editingFlash?.reserved ?? false,
      category: form.category,
      size: form.size,
      placement: placement.length ? placement : ['Bras'],
      estimatedDuration: form.estimatedDuration,
      tags: tags.length ? tags : ['flash'],
      artistId: form.artistId.trim() || null,
      featured: form.featured,
      displayOrder: form.displayOrder,
      slug: form.slug.trim() || null,
    };
    setSavingFlash(true);
    if (editingFlash && onUpdateFlash) {
      onUpdateFlash(editingFlash.id, data);
    } else if (onAddFlash) {
      onAddFlash(data);
    }
    setShowFormModal(false);
    setEditingFlash(null);
    setTimeout(() => setSavingFlash(false), 400);
  };

  const handleDeleteFlash = (id: string) => {
    if (!onDeleteFlash) return;
    setDeleteConfirmId(id);
  };

  const confirmDeleteFlash = () => {
    if (!deleteConfirmId || !onDeleteFlash) return;
    onDeleteFlash(deleteConfirmId);
    setSelectedDesign(null);
    toast.success('Flash supprimé');
    setDeleteConfirmId(null);
  };

  return (
    <div className="min-h-full bg-zinc-50/50 dark:bg-zinc-950">
      <div className="space-y-6 animate-fade-in p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Galerie de flashs
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Parcourez et gérez vos designs disponibles à la réservation
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-4 top-1/2 transform -tranzinc-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="text" placeholder="Rechercher un design..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98]">
                <Filter className="w-5 h-5" /> Filtres
              </button>
              <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                <button onClick={() => setViewMode('grid')} className={`p-3 transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-3 transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          {onAddFlash && (
            <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all active:scale-[0.98] shadow-[0_2px_10px_-3px_rgba(37,99,235,0.3)]">
              <Plus className="w-5 h-5" /> Ajouter un flash
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-5 animate-slide-up">
            <h3 className="font-semibold mb-3 text-zinc-900 dark:text-white">Catégories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button key={category} onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] ${
                    selectedCategory === category 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}>
                  {category === 'all' ? 'Tous' : category}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {filteredDesigns.length} design{filteredDesigns.length > 1 ? 's' : ''} disponible{filteredDesigns.length > 1 ? 's' : ''}
        </div>

        {filteredDesigns.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-blue-600 dark:text-blue-400" size={36} />
            </div>
            <p className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              {designs.length === 0 ? 'Aucun flash pour le moment' : 'Aucun résultat'}
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md mx-auto mb-6">
              {designs.length === 0
                ? 'Ajoutez votre premier design pour que vos clients puissent le réserver en ligne.'
                : 'Essayez de modifier vos filtres ou votre recherche.'}
            </p>
            {designs.length === 0 && onAddFlash && (
              <button onClick={openAddModal} className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all active:scale-[0.98]">
                <Plus className="w-5 h-5" /> Ajouter mon premier flash
              </button>
            )}
            {(designs.length > 0 || !onAddFlash) && (
              <button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }} className="px-5 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98]">
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
          {filteredDesigns.map(design => viewMode === 'grid' ? (
            /* ── Grid card — image pure, info en dessous ── */
            <div key={design.id}
              className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 overflow-hidden cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 active:scale-[0.98]"
              onClick={() => setSelectedDesign(design)}>

              {/* Image — aucun texte superposé */}
              <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img src={design.imageUrl} alt={design.title} loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out" />

                {/* Status badge — top right only */}
                {design.featured && (
                  <div className="absolute top-2.5 right-2.5 bg-amber-500/90 text-black px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-current" /> Vedette
                  </div>
                )}
                {design.reserved && (
                  <div className={`absolute ${design.featured ? 'top-10' : 'top-2.5'} right-2.5 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide`}>
                    Réservé
                  </div>
                )}

                {/* Edit/Delete actions — top left on hover */}
                {(onUpdateFlash || onDeleteFlash) && (
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {onUpdateFlash && (
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(design); }}
                        className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white active:scale-90 transition-all">
                        <Edit className="w-3.5 h-3.5 text-zinc-700" />
                      </button>
                    )}
                    {onDeleteFlash && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteFlash(design.id); }}
                        className="p-1.5 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 active:scale-90 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Info block — totalement hors de l'image */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-white leading-tight line-clamp-1">
                    {design.title}
                  </h3>
                  <span className="font-bold text-sm text-zinc-900 dark:text-white tabular-nums flex-shrink-0">
                    {design.price}€
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 mb-3">
                  <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{design.estimatedDuration}min</span>
                  <span>·</span>
                  <span>{design.category}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleBookNow(design); }} disabled={design.reserved}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${
                    design.reserved
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                      : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100'
                  }`}>
                  {design.reserved ? 'Réservé' : 'Réserver'}
                </button>
              </div>
            </div>
          ) : (
            <div key={design.id} className="flex items-center gap-5 p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_4px_20px_-5px_rgba(6,81,237,0.1)] transition-all cursor-pointer">
              <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-100 dark:bg-zinc-800">
                <img src={design.imageUrl} alt={design.title} loading="lazy" className="w-full h-full object-cover" />
                {design.reserved && (
                  <div className="absolute inset-0 bg-zinc-500/30 flex items-center justify-center">
                    <span className="bg-zinc-600 text-white px-2 py-0.5 rounded text-xs font-bold">Réservé</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{design.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{design.estimatedDuration}min</span>
                  <span className="font-bold text-blue-600">{design.price}€</span>
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-xs text-blue-600 dark:text-blue-400">{design.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(onUpdateFlash || onDeleteFlash) && (
                  <>
                    {onUpdateFlash && <button onClick={() => openEditModal(design)} className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98]"><Edit className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /></button>}
                    {onDeleteFlash && <button onClick={() => handleDeleteFlash(design.id)} className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-all active:scale-[0.98]"><Trash2 className="w-4 h-4" /></button>}
                  </>
                )}
                <button onClick={() => handleBookNow(design)} disabled={design.reserved}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${design.reserved ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  {design.reserved ? 'Réservé' : 'Réserver'}
                </button>
              </div>
            </div>
          ))}
        </div>
        )}

        {selectedDesign && (
          <Modal isOpen={!!selectedDesign} onClose={() => setSelectedDesign(null)} title={selectedDesign.title} size="lg">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200/80 dark:ring-zinc-700">
                <img src={selectedDesign.imageUrl} alt={selectedDesign.title} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4">
                {selectedDesign.reserved ? (
                  <div className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 px-4 py-2 rounded-full font-semibold">
                    <X className="w-4 h-4" /> Réservé
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-4 py-2 rounded-full font-semibold">
                    <CheckCircle className="w-4 h-4" /> Disponible
                  </div>
                )}
                {selectedDesign.description && <p className="text-zinc-500 dark:text-zinc-400">{selectedDesign.description}</p>}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-200 dark:border-zinc-800 dark:border-zinc-800">
                  <div><div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Prix</div><div className="text-2xl font-bold text-blue-600 tabular-nums">{selectedDesign.price}€</div></div>
                  <div><div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Acompte</div><div className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{selectedDesign.depositAmount}€</div></div>
                  <div><div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Durée</div><div className="text-lg font-semibold text-zinc-900 dark:text-white tabular-nums">{selectedDesign.estimatedDuration}min</div></div>
                  <div><div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Taille</div><div className="text-lg font-semibold text-zinc-900 dark:text-white capitalize">{selectedDesign.size}</div></div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Emplacements suggérés</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDesign.placement.map(place => (
                      <span key={place} className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-sm text-blue-700 dark:text-blue-300">{place}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => handleBookNow(selectedDesign)} disabled={selectedDesign.reserved}
                  className={`w-full min-h-[48px] py-4 rounded-xl font-semibold text-lg transition-all active:scale-[0.98] ${
                    selectedDesign.reserved ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}>
                  {selectedDesign.reserved ? 'Ce flash est réservé' : 'Réserver ce flash'}
                </button>
                {vitrineUrl && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(vitrineUrl);
                        setLinkCopied(true);
                        toast.success('Lien copié !');
                        setTimeout(() => setLinkCopied(false), 2000);
                      } catch {
                        toast.error('Impossible de copier');
                      }
                    }}
                    className="w-full min-h-[44px] py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98]"
                  >
                    {linkCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {linkCopied ? 'Lien copié !' : 'Copier le lien vitrine'}
                  </button>
                )}
                {(onUpdateFlash || onDeleteFlash) && (
                  <div className="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800 dark:border-zinc-800">
                    {onUpdateFlash && <button onClick={() => { setSelectedDesign(null); openEditModal(selectedDesign); }} className="flex-1 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"><Edit className="w-4 h-4" /> Modifier</button>}
                    {onDeleteFlash && <button onClick={() => handleDeleteFlash(selectedDesign.id)} className="flex-1 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 font-semibold hover:bg-red-100 dark:hover:bg-red-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"><Trash2 className="w-4 h-4" /> Supprimer</button>}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}

        {showFormModal && (onAddFlash || onUpdateFlash) && (
          <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title={editingFlash ? 'Modifier le flash' : 'Nouveau flash'} size="lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Titre *</label>
                <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-3 min-h-[48px] border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="Ex: Dragon Japonais" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Description</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="Description du design" />
              </div>
              <ImageUploadField
                label="Image du flash"
                value={form.imageUrl}
                onChange={(v) => setForm(f => ({ ...f, imageUrl: v }))}
                previewSize="md"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Prix (€)</label>
                  <input type="number" min="0" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full px-4 py-3 min-h-[48px] border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Acompte (€)</label>
                  <input type="number" min="0" value={form.depositAmount} onChange={(e) => setForm(f => ({ ...f, depositAmount: Number(e.target.value) }))}
                    className="w-full px-4 py-3 min-h-[48px] border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Durée (min)</label>
                  <input type="number" min="1" value={form.estimatedDuration} onChange={(e) => setForm(f => ({ ...f, estimatedDuration: Number(e.target.value) }))}
                    className="w-full px-4 py-3 min-h-[48px] border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Catégorie</label>
                  <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-3 min-h-[48px] border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                    {STYLE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Taille</label>
                <select value={form.size} onChange={(e) => setForm(f => ({ ...f, size: e.target.value as 'small' | 'medium' | 'large' }))}
                  className="w-full px-4 py-3 min-h-[48px] border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                  <option value="small">Petit</option>
                  <option value="medium">Moyen</option>
                  <option value="large">Grand</option>
                </select>
              </div>
              {artists.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Tatoueur (app & vitrine)</label>
                  <select
                    value={form.artistId}
                    onChange={(e) => setForm((f) => ({ ...f, artistId: e.target.value }))}
                    className="w-full px-4 py-3 min-h-[48px] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">— Non assigné —</option>
                    {artists.filter((a) => a.active).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">Mis en avant (app client)</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-zinc-900 dark:text-white whitespace-nowrap">Ordre</label>
                  <input
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
                    className="w-24 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Slug URL (optionnel)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-4 py-3 min-h-[48px] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Généré automatiquement si vide"
                />
                <p className="text-xs text-zinc-500 mt-1">Page publique : /flash/votre-slug</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowFormModal(false)} className="min-h-[44px] px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-xl font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98]">
                  Annuler
                </button>
                <button onClick={handleSaveFlash} disabled={savingFlash || !form.title.trim()} className="min-h-[44px] px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                  {savingFlash ? <><Loader2 className="w-4 h-4 animate-spin" /> En cours…</> : (editingFlash ? 'Mettre à jour' : 'Créer')}
                </button>
              </div>
            </div>
          </Modal>
        )}

        <ConfirmModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={confirmDeleteFlash}
          title="Supprimer ce flash ?"
          message="Cette action est irréversible."
          confirmLabel="Supprimer"
          variant="danger"
        />
      </div>
    </div>
  );
};
