import React, { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, StickyNote, Link2, BarChart2, Trash2, Plus } from 'lucide-react';
import { getWidgetsFromSupabase, saveWidgetsToSupabase } from '../../lib/supabaseDashboard';

const STORAGE_KEY = 'inkflow-dashboard-widgets';

export type WidgetType = 'note' | 'link' | 'stat';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  content: string;
  color?: string;
}

const WIDGET_TYPES: { type: WidgetType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'note', label: 'Note rapide', icon: <StickyNote className="w-5 h-5" />, description: 'Une note personnalisée' },
  { type: 'link', label: 'Lien favori', icon: <Link2 className="w-5 h-5" />, description: 'Lien vers un site ou une page' },
  { type: 'stat', label: 'Statistique', icon: <BarChart2 className="w-5 h-5" />, description: 'Valeur personnalisée (ex: objectif)' }
];

interface DashboardWidgetsProps {
  widgets: DashboardWidget[];
  onWidgetsChange: (widgets: DashboardWidget[]) => void;
  onAddWidget?: () => void;
}

const WIDGET_ICONS: Record<WidgetType, React.ReactNode> = {
  note: <StickyNote className="w-4 h-4" />,
  link: <Link2 className="w-4 h-4" />,
  stat: <BarChart2 className="w-4 h-4" />
};

const WIDGET_COLORS: Record<WidgetType, string> = {
  note: 'bg-amber-100 text-amber-600',
  link: 'bg-blue-100 text-blue-600',
  stat: 'bg-indigo-100 text-indigo-600'
};

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ widgets, onWidgetsChange, onAddWidget }) => {
  const removeWidget = (id: string) => {
    onWidgetsChange(widgets.filter(w => w.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Carte "Ajouter un widget" style Prodify */}
      {onAddWidget && (
        <button
          onClick={onAddWidget}
          className="dashboard-widget-card p-5 flex flex-col items-center justify-center min-h-[120px] border-2 border-dashed border-[var(--border)] hover:border-indigo-400 hover:bg-indigo-500/10 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center mb-3 transition-colors">
            <Plus className="w-6 h-6 text-indigo-600" />
          </div>
          <span className="font-semibold text-[var(--text-primary)]">Ajouter un widget</span>
          <span className="text-xs text-[var(--text-secondary)] mt-1">Note, lien ou statistique</span>
        </button>
      )}
      {widgets.map(widget => (
        <div
          key={widget.id}
          className="group relative dashboard-widget-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${WIDGET_COLORS[widget.type]}`}>
                {WIDGET_ICONS[widget.type]}
              </div>
              <span className="font-semibold text-[var(--text-primary)] truncate">{widget.title || (widget.type === 'note' ? 'Note' : widget.type === 'link' ? 'Lien' : 'Stat')}</span>
            </div>
            <button
              onClick={() => removeWidget(widget.id)}
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {widget.type === 'note' && (
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap line-clamp-3">{widget.content || 'Aucun contenu'}</p>
          )}
          {widget.type === 'link' && (
            <a href={widget.content} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline truncate block">
              {widget.content || 'URL non définie'}
            </a>
          )}
          {widget.type === 'stat' && (
            <div className="text-2xl font-bold" style={{ color: widget.color || '#171717' }}>
              {widget.content || '—'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (widget: DashboardWidget) => void;
}

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#171717');

  const reset = () => {
    setSelectedType(null);
    setTitle('');
    setContent('');
    setColor('#171717');
  };

  const handleAdd = () => {
    if (!selectedType) return;
    onAdd({
      id: `w${Date.now()}`,
      type: selectedType,
      title: title.trim() || (selectedType === 'note' ? 'Note' : selectedType === 'link' ? 'Lien' : 'Statistique'),
      content: content.trim(),
      color: selectedType === 'stat' ? color : undefined
    });
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { reset(); onClose(); }} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-[var(--border)] animate-slide-up" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Ajouter un widget
          </h2>

          {!selectedType ? (
            <div className="space-y-2">
              {WIDGET_TYPES.map(({ type, label, icon, description }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className="row-clickable w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[var(--border)] hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-left"
                >
                  <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">{icon}</div>
                  <div>
                    <div className="font-semibold text-neutral-900">{label}</div>
                    <div className="text-sm text-neutral-500">{description}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={selectedType === 'note' ? 'Ex: À faire cette semaine' : selectedType === 'link' ? 'Ex: Mon Instagram' : 'Ex: Objectif mensuel'}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl"
                />
              </div>
              {selectedType === 'stat' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Valeur</label>
                    <input
                      type="text"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Ex: 5000€"
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Couleur</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-12 h-10 rounded-lg border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl font-mono text-sm"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    {selectedType === 'note' ? 'Contenu' : 'URL'}
                  </label>
                  {selectedType === 'note' ? (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Votre note..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl resize-none"
                    />
                  ) : (
                    <input
                      type="url"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl"
                    />
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSelectedType(null)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 font-medium hover:bg-neutral-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleAdd}
                  className="flex-1 btn-primary"
                >
                  Ajouter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function useDashboardWidgets(studioId: string | null, useSupabase: boolean) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!studioId || !useSupabase) {
      setLoaded(true);
      return;
    }
    getWidgetsFromSupabase(studioId).then((fromDb) => {
      if (fromDb.length > 0) {
        setWidgets(fromDb);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fromDb));
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [studioId, useSupabase]);

  const setWidgetsAndSave = useCallback((next: DashboardWidget[] | ((prev: DashboardWidget[]) => DashboardWidget[])) => {
    setWidgets(prev => {
      const nextVal = typeof next === 'function' ? next(prev) : next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextVal));
      if (studioId && useSupabase) saveWidgetsToSupabase(studioId, nextVal).catch(console.error);
      return nextVal;
    });
  }, [studioId, useSupabase]);

  return [widgets, setWidgetsAndSave] as const;
}
