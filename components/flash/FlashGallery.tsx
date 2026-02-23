import React, { useState } from 'react';
import { Search, Filter, Clock, DollarSign, CheckCircle, X, Plus, Grid3X3, List, Edit, Trash2, Sparkles } from 'lucide-react';
import { FlashDesign } from '../../types';
import { Modal } from '../ui/Modal';
import { ImageUploadField } from '../ui/ImageUploadField';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';

const STYLE_OPTIONS = ['Minimaliste', 'Traditional', 'Géométrique', 'Japonais', 'Réalisme', 'Blackwork', 'Autre'];

interface FlashGalleryProps {
  designs: FlashDesign[];
  onBook: (design: FlashDesign) => void;
  onAddFlash?: (flash: Omit<FlashDesign, 'id' | 'createdAt'>) => void;
  onUpdateFlash?: (id: string, updates: Partial<FlashDesign>) => void;
  onDeleteFlash?: (id: string) => void;
}

export const FlashGallery: React.FC<FlashGalleryProps> = ({ designs, onBook, onAddFlash, onUpdateFlash, onDeleteFlash }) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDesign, setSelectedDesign] = useState<FlashDesign | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingFlash, setEditingFlash] = useState<FlashDesign | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '', price: 100, depositAmount: 30, category: 'Minimaliste', size: 'small' as const, estimatedDuration: 60, placement: ['Bras'], tags: [''] });

  const categories = ['all', ...Array.from(new Set(designs.map(d => d.category)))];

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = design.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      design.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
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
    setForm({ title: '', description: '', imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400', price: 100, depositAmount: 30, category: 'Minimaliste', size: 'small', estimatedDuration: 60, placement: ['Bras'], tags: [''] });
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
      tags: flash.tags?.length ? flash.tags : ['']
    });
    setShowFormModal(true);
  };

  const handleSaveFlash = () => {
    if (!form.title.trim()) return;
    const tags = form.tags.filter(t => t.trim());
    const placement = form.placement.filter(p => p.trim());
    const data = {
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
      tags: tags.length ? tags : ['flash']
    };
    if (editingFlash && onUpdateFlash) {
      onUpdateFlash(editingFlash.id, data);
    } else if (onAddFlash) {
      onAddFlash(data);
    }
    setShowFormModal(false);
    setEditingFlash(null);
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input type="text" placeholder="Rechercher un design..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dash w-full pl-12 pr-4 py-3" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className="btn-outline">
              <Filter className="w-5 h-5" /> Filtres
            </button>
            <div className="flex rounded-xl border-2 border-[var(--border)] overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-3 transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-indigo-50/50'}`}>
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-3 transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-indigo-50/50'}`}>
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        {onAddFlash && (
          <button onClick={openAddModal} className="btn-primary">
            <Plus className="w-5 h-5" /> Ajouter un flash
          </button>
        )}
      </div>

      {showFilters && (
        <div className="dashboard-widget-card p-4 animate-slide-up">
          <h3 className="font-semibold mb-3 text-[var(--text-primary)]">Catégories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button key={category} onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  selectedCategory === category ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-[var(--border)] hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}>
                {category === 'all' ? 'Tous' : category}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-[var(--text-secondary)]">
        {filteredDesigns.length} design{filteredDesigns.length > 1 ? 's' : ''} disponible{filteredDesigns.length > 1 ? 's' : ''}
      </div>

      {filteredDesigns.length === 0 ? (
        <div className="text-center py-16 dashboard-widget-card">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-indigo-600 dark:text-indigo-400" size={36} />
          </div>
          <p className="text-lg font-bold text-[var(--text-primary)] mb-2">
            {designs.length === 0 ? 'Aucun flash pour le moment' : 'Aucun résultat'}
          </p>
          <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto mb-6">
            {designs.length === 0
              ? 'Ajoutez votre premier design pour que vos clients puissent le réserver en ligne.'
              : 'Essayez de modifier vos filtres ou votre recherche.'}
          </p>
          {designs.length === 0 && onAddFlash && (
            <button onClick={openAddModal} className="btn-primary">
              <Plus className="w-5 h-5" /> Ajouter mon premier flash
            </button>
          )}
          {(designs.length > 0 || !onAddFlash) && (
            <button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }} className="btn-outline">
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-3'}>
        {filteredDesigns.map(design => viewMode === 'grid' ? (
          <div key={design.id} className="group dashboard-widget-card overflow-hidden cursor-pointer rounded-2xl"
            onClick={() => setSelectedDesign(design)}>
            <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-hover)]">
              <img src={design.imageUrl} alt={design.title} loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {design.reserved ? (
                <div className="absolute top-3 right-3 bg-red-500/95 text-white px-3 py-1 rounded-full text-xs font-bold shadow">Réservé</div>
              ) : (
                <div className="absolute top-3 right-3 bg-emerald-500/95 text-white px-3 py-1 rounded-full text-xs font-bold shadow">Disponible</div>
              )}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-[var(--text-primary)]">{design.category}</span>
                <span className="font-bold text-white text-lg drop-shadow">{design.price}€</span>
              </div>
              {(onUpdateFlash || onDeleteFlash) && (
                <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {onUpdateFlash && <button onClick={(e) => { e.stopPropagation(); openEditModal(design); }} className="p-2 bg-white/95 backdrop-blur rounded-xl hover:bg-white shadow"><Edit className="w-4 h-4 text-[var(--text-primary)]" /></button>}
                  {onDeleteFlash && <button onClick={(e) => { e.stopPropagation(); handleDeleteFlash(design.id); }} className="p-2 bg-red-500/95 text-white rounded-xl shadow hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>}
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 text-[var(--text-primary)]">{design.title}</h3>
              <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-3">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{design.estimatedDuration}min</span>
                <span className="font-bold text-indigo-600">{design.price}€</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {design.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-xs text-indigo-600 dark:text-indigo-300">#{tag}</span>
                ))}
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleBookNow(design); }} disabled={design.reserved}
                className={`w-full py-2.5 rounded-xl font-semibold transition-all active:scale-[0.98] ${
                  design.reserved ? 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] cursor-not-allowed' : 'btn-primary'
                }`}>
                {design.reserved ? 'Réservé' : 'Réserver maintenant'}
              </button>
            </div>
          </div>
        ) : (
          <div key={design.id} className="row-clickable flex items-center gap-5 p-5 dashboard-widget-card rounded-2xl">
            <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--bg-hover)]">
              <img src={design.imageUrl} alt={design.title} loading="lazy" className="w-full h-full object-cover" />
              {design.reserved && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">Réservé</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-[var(--text-primary)]">{design.title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)] mt-1">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{design.estimatedDuration}min</span>
                <span className="font-bold text-indigo-600">{design.price}€</span>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-xs">{design.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(onUpdateFlash || onDeleteFlash) && (
                <>
                  {onUpdateFlash && <button onClick={() => openEditModal(design)} className="p-2 rounded-xl hover:bg-[var(--bg-hover)]"><Edit className="w-4 h-4 text-[var(--text-secondary)]" /></button>}
                  {onDeleteFlash && <button onClick={() => handleDeleteFlash(design.id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"><Trash2 className="w-4 h-4" /></button>}
                </>
              )}
              <button onClick={() => handleBookNow(design)} disabled={design.reserved}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${design.reserved ? 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]' : 'btn-primary'}`}>
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
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--bg-hover)] ring-2 ring-[var(--border)]">
              <img src={selectedDesign.imageUrl} alt={selectedDesign.title} loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-4">
              {selectedDesign.reserved ? (
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full font-semibold">
                  <X className="w-4 h-4" /> Réservé
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                  <CheckCircle className="w-4 h-4" /> Disponible
                </div>
              )}
              {selectedDesign.description && <p className="text-[var(--text-secondary)]">{selectedDesign.description}</p>}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-[var(--border)]">
                <div><div className="text-sm text-[var(--text-secondary)] mb-1">Prix</div><div className="text-2xl font-bold text-indigo-600">{selectedDesign.price}€</div></div>
                <div><div className="text-sm text-[var(--text-secondary)] mb-1">Acompte</div><div className="text-2xl font-bold">{selectedDesign.depositAmount}€</div></div>
                <div><div className="text-sm text-[var(--text-secondary)] mb-1">Durée</div><div className="text-lg font-semibold">{selectedDesign.estimatedDuration}min</div></div>
                <div><div className="text-sm text-[var(--text-secondary)] mb-1">Taille</div><div className="text-lg font-semibold capitalize">{selectedDesign.size}</div></div>
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">Emplacements suggérés</div>
                <div className="flex flex-wrap gap-2">
                  {selectedDesign.placement.map(place => (
                    <span key={place} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-sm text-indigo-700 dark:text-indigo-200">{place}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => handleBookNow(selectedDesign)} disabled={selectedDesign.reserved}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                  selectedDesign.reserved ? 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] cursor-not-allowed' : 'btn-primary'
                }`}>
                {selectedDesign.reserved ? 'Ce flash est réservé' : 'Réserver ce flash'}
              </button>
              {(onUpdateFlash || onDeleteFlash) && (
                <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
                  {onUpdateFlash && <button onClick={() => { setSelectedDesign(null); openEditModal(selectedDesign); }} className="btn-outline flex-1"><Edit className="w-4 h-4" /> Modifier</button>}
                  {onDeleteFlash && <button onClick={() => handleDeleteFlash(selectedDesign.id)} className="flex-1 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 font-semibold hover:bg-red-100 dark:hover:bg-red-950/50 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Supprimer</button>}
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
              <label className="block text-sm font-semibold mb-2">Titre *</label>
              <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl" placeholder="Ex: Dragon Japonais" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl min-h-[80px]" placeholder="Description du design" />
            </div>
            <ImageUploadField
              label="Image du flash"
              value={form.imageUrl}
              onChange={(v) => setForm(f => ({ ...f, imageUrl: v }))}
              previewSize="md"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Prix (€)</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Acompte (€)</label>
                <input type="number" min="0" value={form.depositAmount} onChange={(e) => setForm(f => ({ ...f, depositAmount: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Durée (min)</label>
                <input type="number" min="1" value={form.estimatedDuration} onChange={(e) => setForm(f => ({ ...f, estimatedDuration: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Catégorie</label>
                <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl">
                  {STYLE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Taille</label>
              <select value={form.size} onChange={(e) => setForm(f => ({ ...f, size: e.target.value as 'small' | 'medium' | 'large' }))}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl">
                <option value="small">Petit</option>
                <option value="medium">Moyen</option>
                <option value="large">Grand</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowFormModal(false)} className="px-6 py-3 border-2 border-neutral-200 rounded-xl font-semibold hover:border-neutral-900">
                Annuler
              </button>
              <button onClick={handleSaveFlash} className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800">
                {editingFlash ? 'Mettre à jour' : 'Créer'}
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
  );
};
