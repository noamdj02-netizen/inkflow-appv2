import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGrid, StickyNote, Link2, BarChart2, Trash2, Plus, MessageSquare, Calendar, Users, Wallet, Image, Settings, ExternalLink } from 'lucide-react';
import { getWidgetsFromSupabase, saveWidgetsToSupabase } from '../../lib/supabaseDashboard';

const STORAGE_KEY = 'inkflow-dashboard-widgets';

export type WidgetType = 'note' | 'link' | 'stat' | 'shortcut';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  content: string;
  color?: string;
}

/** TabId pour les raccourcis (content du widget shortcut) */
export type ShortcutTabId = 'requests' | 'appointments' | 'clients' | 'messaging' | 'analytics' | 'finance' | 'flash' | 'portfolio' | 'settings' | 'vitrine';

const WIDGET_TOOLS: { type: WidgetType; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  { type: 'note', label: 'Note rapide', icon: <StickyNote className="w-5 h-5" />, description: 'Une note personnalisée', color: 'bg-blue-100 text-blue-600' },
  { type: 'link', label: 'Lien favori', icon: <Link2 className="w-5 h-5" />, description: 'Lien vers un site ou une page', color: 'bg-blue-100 text-blue-600' },
  { type: 'stat', label: 'Statistique', icon: <BarChart2 className="w-5 h-5" />, description: 'Valeur personnalisée (ex: objectif)', color: 'bg-blue-100 text-blue-600' }
];

const SHORTCUT_OPTIONS: { id: ShortcutTabId; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'requests', label: 'Demandes', icon: <MessageSquare className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
  { id: 'appointments', label: 'Rendez-vous', icon: <Calendar className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
  { id: 'clients', label: 'Clients', icon: <Users className="w-5 h-5" />, color: 'bg-zinc-100 text-zinc-600' },
  { id: 'messaging', label: 'Messagerie', icon: <MessageSquare className="w-5 h-5" />, color: 'bg-zinc-100 text-zinc-600' },
  { id: 'analytics', label: 'Statistiques', icon: <BarChart2 className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
  { id: 'finance', label: 'Finance', icon: <Wallet className="w-5 h-5" />, color: 'bg-zinc-100 text-zinc-600' },
  { id: 'flash', label: 'Galerie Flash', icon: <Image className="w-5 h-5" />, color: 'bg-zinc-100 text-zinc-600' },
  { id: 'portfolio', label: 'Portfolio', icon: <Image className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
  { id: 'vitrine', label: 'Ma vitrine', icon: <ExternalLink className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
  { id: 'settings', label: 'Paramètres', icon: <Settings className="w-5 h-5" />, color: 'bg-zinc-100 text-zinc-600' }
];

interface DashboardWidgetsProps {
  widgets: DashboardWidget[];
  onWidgetsChange: (widgets: DashboardWidget[]) => void;
  onAddWidget?: () => void;
}

const WIDGET_ICONS: Record<WidgetType, React.ReactNode> = {
  note: <StickyNote className="w-4 h-4" />,
  link: <Link2 className="w-4 h-4" />,
  stat: <BarChart2 className="w-4 h-4" />,
  shortcut: <LayoutGrid className="w-4 h-4" />
};

const WIDGET_COLORS: Record<WidgetType, string> = {
  note: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  link: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  stat: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  shortcut: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
};

function getShortcutLabel(tabId: ShortcutTabId): string {
  return SHORTCUT_OPTIONS.find(o => o.id === tabId)?.label ?? tabId;
}

function getLinkPreview(url: string): { domain: string; isInstagram: boolean } {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = u.hostname.replace('www.', '');
    return { domain: host, isInstagram: host.includes('instagram.com') };
  } catch {
    return { domain: 'Lien', isInstagram: false };
  }
}

/** Carte d'un widget personnalisé pour intégration dans la grille sortable */
export const WidgetCard: React.FC<{
  widget: DashboardWidget;
  onRemove: () => void;
  onShortcutClick?: (tabId: string) => void;
  vitrineUrl?: string;
}> = ({ widget, onRemove, onShortcutClick, vitrineUrl }) => {
  const linkPreview = widget.type === 'link' && widget.content ? getLinkPreview(widget.content) : null;
  const isShortcut = widget.type === 'shortcut';
  const shortcutLabel = isShortcut ? getShortcutLabel(widget.content as ShortcutTabId) : widget.title;

  const handleShortcutClick = () => {
    if (widget.content === 'vitrine' && vitrineUrl) {
      window.open(vitrineUrl, '_blank');
    } else if (onShortcutClick) {
      onShortcutClick(widget.content);
    }
  };

  return (
    <div className="group relative dashboard-widget-card p-5 min-h-[140px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${WIDGET_COLORS[widget.type]}`}>
            {WIDGET_ICONS[widget.type]}
          </div>
          <span className="font-semibold text-[var(--text-primary)] truncate">
            {widget.type === 'note' ? (widget.title || 'Note') : widget.type === 'link' ? (widget.title || linkPreview?.domain || 'Lien') : widget.type === 'stat' ? (widget.title || 'Stat') : shortcutLabel}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {widget.type === 'note' && (
        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap line-clamp-3 flex-1">{widget.content || 'Aucun contenu'}</p>
      )}
      {widget.type === 'link' && (
        <a
          href={widget.content}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-[var(--bg-card-secondary)] border border-blue-200/50 dark:border-[var(--border)] hover:border-blue-300 dark:hover:border-[var(--border)] transition-colors"
        >
          <div className="w-10 h-10 rounded-[10px] bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-medium text-[var(--text-primary)] block truncate">{widget.title || linkPreview?.domain || 'Lien'}</span>
            <span className="text-xs text-[#6B7280] dark:text-[var(--text-tertiary)] truncate block">{widget.content || 'URL non définie'}</span>
          </div>
        </a>
      )}
      {widget.type === 'stat' && (
        <div className="overview-widget-value flex-1 flex items-end" style={{ color: widget.color || '#1A1A2E' }}>
          {widget.content || '—'}
        </div>
      )}
      {widget.type === 'shortcut' && (
        <button
          onClick={handleShortcutClick}
          className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-[var(--bg-card-secondary)] border border-blue-200/50 dark:border-[var(--border)] hover:border-blue-300 dark:hover:border-[var(--border)] hover:bg-blue-50 dark:hover:bg-[var(--bg-card-dark)] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-[10px] bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            {SHORTCUT_OPTIONS.find(o => o.id === widget.content)?.icon ?? <LayoutGrid className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-medium text-[var(--text-primary)] block truncate">{shortcutLabel}</span>
            <span className="text-xs text-[#6B7280] dark:text-[var(--text-tertiary)] truncate block">
              {widget.content === 'vitrine' ? 'Ouvrir ma page publique' : 'Accéder à cette section'}
            </span>
          </div>
        </button>
      )}
    </div>
  );
};

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ widgets, onWidgetsChange, onAddWidget }) => {
  const removeWidget = (id: string) => {
    onWidgetsChange(widgets.filter(w => w.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {onAddWidget && (
        <button
          onClick={onAddWidget}
          className="dashboard-widget-card p-5 flex flex-col items-center justify-center min-h-[120px] border-2 border-dashed border-[var(--border)] hover:border-blue-400 hover:bg-blue-500/10 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-blue-200 dark:bg-blue-500/20 dark:group-hover:bg-blue-500/30 flex items-center justify-center mb-3 transition-colors">
            <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-semibold text-[var(--text-primary)]">Ajouter un widget</span>
          <span className="text-xs text-[var(--text-secondary)] mt-1">Note, lien ou statistique</span>
        </button>
      )}
      {widgets.map(widget => (
        <WidgetCard key={widget.id} widget={widget} onRemove={() => removeWidget(widget.id)} />
      ))}
    </div>
  );
};

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (widget: DashboardWidget) => void;
  /** Slug du studio pour le lien vitrine (ex: mon-studio) */
  studioSlug?: string;
}

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({ isOpen, onClose, onAdd, studioSlug }) => {
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#171717');
  const [isAdding, setIsAdding] = useState(false);

  const reset = () => {
    setSelectedType(null);
    setTitle('');
    setContent('');
    setColor('#171717');
  };

  const vitrineUrl = studioSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/studio/${studioSlug}` : '';

  const handleAddShortcut = (id: ShortcutTabId) => {
    onAdd({
      id: `w${Date.now()}`,
      type: 'shortcut',
      title: getShortcutLabel(id),
      content: id
    });
    reset();
    onClose();
  };

  const handleAddVitrineLink = () => {
    if (!vitrineUrl) return;
    onAdd({
      id: `w${Date.now()}`,
      type: 'link',
      title: 'Ma vitrine',
      content: vitrineUrl
    });
    reset();
    onClose();
  };

  const handleAdd = () => {
    if (!selectedType || isAdding) return;
    setIsAdding(true);
    onAdd({
      id: `w${Date.now()}`,
      type: selectedType,
      title: title.trim() || (selectedType === 'note' ? 'Note' : selectedType === 'link' ? 'Lien' : 'Statistique'),
      content: content.trim(),
      color: selectedType === 'stat' ? color : undefined
    });
    reset();
    onClose();
    setTimeout(() => setIsAdding(false), 300);
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[480] overflow-y-auto">
      <div className="fixed inset-0 bg-black" onClick={() => { reset(); onClose(); }} aria-hidden />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative rounded-2xl w-full max-w-lg p-6 border animate-slide-up bg-white dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-[var(--text-primary)]">
            <LayoutGrid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Ajouter un widget
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-5">Personnalisez votre tableau de bord</p>

          {!selectedType ? (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Section Outils */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 px-1">Outils</p>
                <div className="space-y-2">
                  {WIDGET_TOOLS.map(({ type, label, icon, description, color: c }) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className="row-clickable w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[var(--border)] hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-500/10 transition-all text-left"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c}`}>{icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[var(--text-primary)]">{label}</div>
                        <div className="text-sm text-[var(--text-secondary)] truncate">{description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Raccourcis */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 px-1">Raccourcis du dashboard</p>
                <div className="grid grid-cols-2 gap-2">
                  {SHORTCUT_OPTIONS.map(({ id, label, icon, color: c }) => (
                    <button
                      key={id}
                      onClick={() => id === 'vitrine' && vitrineUrl ? handleAddVitrineLink() : handleAddShortcut(id)}
                      className="row-clickable flex items-center gap-3 p-3 rounded-xl border-2 border-[var(--border)] hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-500/10 transition-all text-left"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c}`}>{icon}</div>
                      <span className="font-medium text-[var(--text-primary)] text-sm truncate">{label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-2 px-1">Cliquez pour ajouter un raccourci vers cette section</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={selectedType === 'note' ? 'Ex: À faire cette semaine' : selectedType === 'link' ? 'Ex: Mon Instagram' : 'Ex: Objectif mensuel'}
                  className="input-dash w-full px-4 py-2.5 rounded-xl"
                />
              </div>
              {selectedType === 'stat' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Valeur</label>
                    <input
                      type="text"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Ex: 5000€"
                      className="input-dash w-full px-4 py-2.5 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Couleur</label>
                    <div className="flex gap-2">
                      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 rounded-lg border cursor-pointer" />
                      <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 px-3 py-2 border border-[var(--border)] rounded-xl font-mono text-sm bg-[var(--bg-primary)]" />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">{selectedType === 'note' ? 'Contenu' : 'URL'}</label>
                  {selectedType === 'note' ? (
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Votre note..." rows={3} className="input-dash w-full px-4 py-2.5 rounded-xl resize-none" />
                  ) : (
                    <input type="url" value={content} onChange={(e) => setContent(e.target.value)} placeholder="https://..." className="input-dash w-full px-4 py-2.5 rounded-xl" />
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setSelectedType(null)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--bg-hover)]">
                  Retour
                </button>
                <button onClick={handleAdd} disabled={isAdding} className="flex-1 btn-primary disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isAdding ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Ajout…</>) : 'Ajouter'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
};

export function useDashboardWidgets(studioId: string | null, useSupabase: boolean, options?: { onError?: (err: Error) => void }) {
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
      if (studioId && useSupabase) saveWidgetsToSupabase(studioId, nextVal).catch((err) => {
        options?.onError?.(err);
      });
      return nextVal;
    });
  }, [studioId, useSupabase, options?.onError]);

  return [widgets, setWidgetsAndSave] as const;
}
