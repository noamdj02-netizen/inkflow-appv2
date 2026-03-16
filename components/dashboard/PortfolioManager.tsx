import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Filter, Image as ImageIcon, Plus, Pencil, Trash2, Sparkles } from 'lucide-react';

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
}

interface PortfolioManagerProps {
  items: PortfolioItem[];
  onAddItem: (item: PortfolioItem) => void;
  onDeleteItem: (id: string) => void;
  onEditItem?: (item: PortfolioItem) => void;
  artists: string[];
}

const CATEGORIES = ['Realisme', 'Traditionnel', 'Neo-traditionnel', 'Japonais', 'Minimaliste', 'Geometrique', 'Aquarelle', 'Dotwork', 'Lettering', 'Autre'];

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({ items, onAddItem, onDeleteItem, onEditItem, artists }) => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterArtist, setFilterArtist] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const beforeRef = useRef<HTMLInputElement>(null);

  const [newItem, setNewItem] = useState({
    url: '',
    beforeUrl: '',
    category: '',
    artist: artists[0] || '',
    description: '',
    tags: '',
  });
  const [dragOver, setDragOver] = useState(false);

  const filtered = items.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterArtist !== 'all' && item.artist !== filterArtist) return false;
    return true;
  });

  useEffect(() => {
    filtered.forEach((item) => {
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
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setNewItem(prev => ({ ...prev, url: ev.target?.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'url' | 'beforeUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setNewItem(prev => ({ ...prev, [field]: ev.target?.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = () => {
    if (!newItem.url || !newItem.category) return;
    onAddItem({
      id: `p_${Date.now()}`,
      url: newItem.url,
      beforeUrl: newItem.beforeUrl || undefined,
      category: newItem.category,
      artist: newItem.artist,
      description: newItem.description,
      tags: newItem.tags.split(',').map(t => t.trim()).filter(Boolean),
      likes: 0,
      createdAt: new Date().toISOString(),
    });
    setNewItem({ url: '', beforeUrl: '', category: '', artist: artists[0] || '', description: '', tags: '' });
    setShowUpload(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Portfolio</h2>
          <p className="text-sm text-slate-500 mt-1">
            {items.length} {items.length > 1 ? 'réalisations' : 'réalisation'} dans votre galerie
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

      {/* Filters toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtres</span>
        </div>
        <div className="h-5 w-px bg-slate-200 dark:bg-zinc-700" />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-all"
        >
          <option value="all">Tous les styles</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {artists.length > 1 && (
          <select
            value={filterArtist}
            onChange={e => setFilterArtist(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-all"
          >
            <option value="all">Tous les artistes</option>
            {artists.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        {(filterCategory !== 'all' || filterArtist !== 'all') && (
          <button
            onClick={() => { setFilterCategory('all'); setFilterArtist('all'); }}
            className="ml-auto text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2"
          >
            Réinitialiser
          </button>
        )}
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
              className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 cursor-pointer border border-slate-200/80 dark:border-zinc-700 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-lg transition-shadow duration-300"
              onClick={() => setSelectedItem(item)}
            >
              <img
                src={item.url}
                alt={item.description || 'Portfolio'}
                loading="eager"
                decoding="async"
                fetchPriority={index < 8 ? 'high' : undefined}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="inline-block text-xs font-medium bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full mb-2">
                    {item.category}
                  </span>
                  {item.description && (
                    <p className="text-sm truncate opacity-90">{item.description}</p>
                  )}
                  {item.beforeUrl && (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/80 px-2 py-0.5 rounded-full mt-2">
                      <ImageIcon className="w-3 h-3" /> Avant/Après
                    </span>
                  )}
                </div>
                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {onEditItem && (
                    <button
                      onClick={e => { e.stopPropagation(); onEditItem(item); }}
                      className="p-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 rounded-xl hover:bg-white dark:hover:bg-zinc-700 transition-colors shadow-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteItem(item.id); }}
                    className="p-2 bg-red-500/90 backdrop-blur-sm text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200/80 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ajouter au portfolio</h3>
                <p className="text-sm text-slate-500 mt-0.5">Partagez votre dernière réalisation</p>
              </div>
              <button
                onClick={() => setShowUpload(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-zinc-800'
                    : 'border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                {newItem.url ? (
                  <div className="relative inline-block">
                    <img src={newItem.url} alt="Aperçu" className="w-40 h-40 object-cover rounded-xl mx-auto shadow-lg" />
                    <button
                      onClick={e => { e.stopPropagation(); setNewItem(p => ({ ...p, url: '' })); }}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Glissez une image ici</p>
                    <p className="text-xs text-slate-500">ou cliquez pour parcourir</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'url')} />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Photo "avant"</label>
                  <p className="text-xs text-slate-500">Optionnel - pour montrer la transformation</p>
                </div>
                <button
                  onClick={() => beforeRef.current?.click()}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    newItem.beforeUrl
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-white dark:bg-zinc-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-600'
                  }`}
                >
                  {newItem.beforeUrl ? '✓ Photo ajoutée' : 'Ajouter'}
                </button>
                <input ref={beforeRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'beforeUrl')} />
              </div>

              <select
                value={newItem.category}
                onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
              >
                <option value="">Style / catégorie</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {artists.length > 1 && (
                <select
                  value={newItem.artist}
                  onChange={e => setNewItem(p => ({ ...p, artist: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                >
                  {artists.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              )}

              <input
                type="text"
                value={newItem.description}
                onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                placeholder="Description de la réalisation"
                className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
              />

              <input
                type="text"
                value={newItem.tags}
                onChange={e => setNewItem(p => ({ ...p, tags: e.target.value }))}
                placeholder="Tags (séparés par des virgules)"
                className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
              />

              <button
                onClick={handleAdd}
                disabled={!newItem.url || !newItem.category}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                Ajouter au portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="max-w-5xl w-full animate-in fade-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            {selectedItem.beforeUrl ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <span className="inline-block text-sm font-medium bg-white/10 backdrop-blur-sm text-white px-4 py-1.5 rounded-full mb-4">
                    Avant
                  </span>
                  <img src={selectedItem.beforeUrl} alt="Avant" className="w-full rounded-2xl shadow-2xl" />
                </div>
                <div className="text-center">
                  <span className="inline-block text-sm font-medium bg-emerald-500/80 backdrop-blur-sm text-white px-4 py-1.5 rounded-full mb-4">
                    Après
                  </span>
                  <img src={selectedItem.url} alt="Après" className="w-full rounded-2xl shadow-2xl" />
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
                  {selectedItem.tags.map(tag => (
                    <span key={tag} className="text-xs bg-white/5 text-white/60 px-2.5 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
