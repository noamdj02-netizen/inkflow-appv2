import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Filter, Image as ImageIcon } from 'lucide-react';

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
  artists: string[];
}

const CATEGORIES = ['Realisme', 'Traditionnel', 'Neo-traditionnel', 'Japonais', 'Minimaliste', 'Geometrique', 'Aquarelle', 'Dotwork', 'Lettering', 'Autre'];

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({ items, onAddItem, onDeleteItem, artists }) => {
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

  // Préchargement immédiat des images pour affichage sans délai (0 ms perçu)
  useEffect(() => {
    filtered.forEach((item, i) => {
      const img = new Image();
      img.src = item.url;
      if (item.beforeUrl) {
        const before = new Image();
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Portfolio</h2>
          <p className="text-neutral-600 text-sm">{items.length} photos</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800">
          <Upload className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-white">
            <option value="all">Tous les styles</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {artists.length > 1 && (
          <select value={filterArtist} onChange={e => setFilterArtist(e.target.value)}
            className="px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-white">
            <option value="all">Tous les artistes</option>
            {artists.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-neutral-200 text-center">
          <ImageIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="font-semibold mb-2">Aucune photo</p>
          <p className="text-sm text-neutral-600">Ajoutez vos realisations au portfolio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item, index) => (
            <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 cursor-pointer"
              onClick={() => setSelectedItem(item)}>
              <img
                src={item.url}
                alt={item.description || 'Portfolio'}
                loading="eager"
                decoding="async"
                fetchPriority={index < 8 ? 'high' : undefined}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="text-xs font-semibold mb-1">{item.category}</div>
                  <div className="text-sm truncate">{item.description}</div>
                  {item.beforeUrl && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1 inline-block">Avant/Apres</span>}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); onDeleteItem(item.id); }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Ajouter au portfolio</h3>
              <button onClick={() => setShowUpload(false)} className="p-2 rounded-lg hover:bg-neutral-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-300 hover:border-neutral-500'
                }`}
              >
                {newItem.url ? (
                  <img src={newItem.url} alt="Aperçu" className="w-32 h-32 object-cover rounded-xl mx-auto" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm text-neutral-600">Glissez une image ou cliquez</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'url')} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Photo "avant" (optionnel)</label>
                <button onClick={() => beforeRef.current?.click()} className="text-sm text-neutral-600 underline">
                  {newItem.beforeUrl ? 'Photo selectionnee' : 'Ajouter une photo avant'}
                </button>
                <input ref={beforeRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'beforeUrl')} />
              </div>
              <select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl">
                <option value="">Style / categorie</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {artists.length > 1 && (
                <select value={newItem.artist} onChange={e => setNewItem(p => ({ ...p, artist: e.target.value }))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl">
                  {artists.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              )}
              <input type="text" value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                placeholder="Description" className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
              <input type="text" value={newItem.tags} onChange={e => setNewItem(p => ({ ...p, tags: e.target.value }))}
                placeholder="Tags (separes par des virgules)" className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
              <button onClick={handleAdd} disabled={!newItem.url || !newItem.category}
                className="w-full py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50">
                Ajouter au portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            {selectedItem.beforeUrl ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-white text-sm mb-2 font-semibold">Avant</p>
                  <img src={selectedItem.beforeUrl} alt="Avant" className="w-full rounded-2xl" />
                </div>
                <div className="text-center">
                  <p className="text-white text-sm mb-2 font-semibold">Apres</p>
                  <img src={selectedItem.url} alt="Après" className="w-full rounded-2xl" />
                </div>
              </div>
            ) : (
              <img src={selectedItem.url} alt={selectedItem.description || 'Portfolio'} className="max-h-[80vh] mx-auto rounded-2xl" />
            )}
            <div className="mt-4 text-center text-white">
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{selectedItem.category}</span>
              {selectedItem.description && <p className="mt-2 text-sm">{selectedItem.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
