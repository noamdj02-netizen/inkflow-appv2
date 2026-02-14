import React, { useState } from 'react';
import { Search, Filter, Clock, DollarSign, CheckCircle, X, Plus, Grid3X3, List, Edit, Trash2 } from 'lucide-react';
import { FlashDesign } from '../../types';
import { Modal } from '../ui/Modal';

const STYLE_OPTIONS = ['Minimaliste', 'Traditional', 'Géométrique', 'Japonais', 'Réalisme', 'Blackwork', 'Autre'];

interface FlashGalleryProps {
  designs: FlashDesign[];
  onBook: (design: FlashDesign) => void;
  onAddFlash?: (flash: Omit<FlashDesign, 'id' | 'createdAt'>) => void;
  onUpdateFlash?: (id: string, updates: Partial<FlashDesign>) => void;
  onDeleteFlash?: (id: string) => void;
}

export const FlashGallery: React.FC<FlashGalleryProps> = ({ designs, onBook, onAddFlash, onUpdateFlash, onDeleteFlash }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDesign, setSelectedDesign] = useState<FlashDesign | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingFlash, setEditingFlash] = useState<FlashDesign | null>(null);
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
      alert('Ce flash est déjà réservé');
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
    if (onDeleteFlash && confirm('Supprimer ce flash ?')) {
      onDeleteFlash(id);
      setSelectedDesign(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input type="text" placeholder="Rechercher un design..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 border-2 border-neutral-200 rounded-xl font-semibold hover:border-neutral-900 transition-colors flex items-center gap-2">
              <Filter className="w-5 h-5" /> Filtres
            </button>
            <div className="flex rounded-xl border border-neutral-200 overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-3 ${viewMode === 'grid' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}>
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-3 ${viewMode === 'list' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}>
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        {onAddFlash && (
          <button onClick={openAddModal} className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800">
            <Plus className="w-5 h-5" /> Ajouter un flash
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
          <h3 className="font-semibold mb-3">Catégories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button key={category} onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:border-neutral-900'
                }`}>
                {category === 'all' ? 'Tous' : category}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-neutral-600">
        {filteredDesigns.length} design{filteredDesigns.length > 1 ? 's' : ''} disponible{filteredDesigns.length > 1 ? 's' : ''}
      </div>

      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredDesigns.map(design => viewMode === 'grid' ? (
          <div key={design.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-200 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => setSelectedDesign(design)}>
            <div className="relative aspect-square overflow-hidden bg-neutral-100">
              <img src={design.imageUrl} alt={design.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              {design.reserved ? (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">Réservé</div>
              ) : (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">Disponible</div>
              )}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">{design.category}</div>
              {(onUpdateFlash || onDeleteFlash) && (
                <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onUpdateFlash && <button onClick={(e) => { e.stopPropagation(); openEditModal(design); }} className="p-2 bg-white/90 rounded-lg"><Edit className="w-4 h-4" /></button>}
                  {onDeleteFlash && <button onClick={(e) => { e.stopPropagation(); handleDeleteFlash(design.id); }} className="p-2 bg-red-500/90 text-white rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{design.title}</h3>
              <div className="flex items-center gap-4 text-sm text-neutral-600 mb-3">
                <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{design.estimatedDuration}min</div>
                <div className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{design.price}€</div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {design.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-600">#{tag}</span>
                ))}
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleBookNow(design); }} disabled={design.reserved}
                className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                  design.reserved ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-neutral-900 text-white hover:bg-neutral-800'
                }`}>
                {design.reserved ? 'Réservé' : 'Réserver maintenant'}
              </button>
            </div>
          </div>
        ) : (
          <div key={design.id} className="flex items-center gap-6 p-4 bg-white rounded-2xl border border-neutral-200 hover:border-neutral-300">
            <img src={design.imageUrl} alt={design.title} className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg">{design.title}</h3>
              <div className="flex items-center gap-4 text-sm text-neutral-600 mt-1">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{design.estimatedDuration}min</span>
                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{design.price}€</span>
                <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs">{design.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(onUpdateFlash || onDeleteFlash) && (
                <>
                  {onUpdateFlash && <button onClick={() => openEditModal(design)} className="p-2 rounded-lg hover:bg-neutral-100"><Edit className="w-4 h-4" /></button>}
                  {onDeleteFlash && <button onClick={() => handleDeleteFlash(design.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>}
                </>
              )}
              <button onClick={() => handleBookNow(design)} disabled={design.reserved}
                className={`px-4 py-2 rounded-lg font-semibold text-sm ${design.reserved ? 'bg-neutral-200 text-neutral-400' : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}>
                {design.reserved ? 'Réservé' : 'Réserver'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDesigns.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">Aucun design trouvé</h3>
          <p className="text-neutral-600">Essayez de modifier vos critères de recherche</p>
        </div>
      )}

      {selectedDesign && (
        <Modal isOpen={!!selectedDesign} onClose={() => setSelectedDesign(null)} title={selectedDesign.title} size="lg">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100">
              <img src={selectedDesign.imageUrl} alt={selectedDesign.title} className="w-full h-full object-cover" />
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
              {selectedDesign.description && <p className="text-neutral-700">{selectedDesign.description}</p>}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-neutral-200">
                <div><div className="text-sm text-neutral-600 mb-1">Prix</div><div className="text-2xl font-bold">{selectedDesign.price}€</div></div>
                <div><div className="text-sm text-neutral-600 mb-1">Acompte</div><div className="text-2xl font-bold">{selectedDesign.depositAmount}€</div></div>
                <div><div className="text-sm text-neutral-600 mb-1">Durée</div><div className="text-lg font-semibold">{selectedDesign.estimatedDuration}min</div></div>
                <div><div className="text-sm text-neutral-600 mb-1">Taille</div><div className="text-lg font-semibold capitalize">{selectedDesign.size}</div></div>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900 mb-2">Emplacements suggérés</div>
                <div className="flex flex-wrap gap-2">
                  {selectedDesign.placement.map(place => (
                    <span key={place} className="px-3 py-1 bg-neutral-100 rounded-lg text-sm">{place}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => handleBookNow(selectedDesign)} disabled={selectedDesign.reserved}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors ${
                  selectedDesign.reserved ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-neutral-900 text-white hover:bg-neutral-800'
                }`}>
                {selectedDesign.reserved ? 'Ce flash est réservé' : 'Réserver ce flash'}
              </button>
              {(onUpdateFlash || onDeleteFlash) && (
                <div className="flex gap-2 pt-4 border-t border-neutral-200">
                  {onUpdateFlash && <button onClick={() => { setSelectedDesign(null); openEditModal(selectedDesign); }} className="flex-1 py-2 rounded-xl border-2 border-neutral-200 font-semibold hover:border-neutral-900 flex items-center justify-center gap-2"><Edit className="w-4 h-4" /> Modifier</button>}
                  {onDeleteFlash && <button onClick={() => handleDeleteFlash(selectedDesign.id)} className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Supprimer</button>}
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
            <div>
              <label className="block text-sm font-semibold mb-2">URL image</label>
              <input type="text" value={form.imageUrl} onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl" placeholder="https://..." />
            </div>
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
    </div>
  );
};
