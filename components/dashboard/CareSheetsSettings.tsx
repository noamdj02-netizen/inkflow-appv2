import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, FileText } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { getStudioId } from '../../lib/supabase';
import { getCareTemplatesFromSupabase, saveCareTemplatesToSupabase } from '../../lib/supabaseDashboard';
import { useToast } from '../../contexts/ToastContext';
import { useAutoSave } from '../../hooks/useAutoSave';

const STORAGE_KEY = 'inkflow-care-templates';

interface CareTemplate {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

interface CareSheetsSettingsProps {
  userEmail?: string;
  studioName?: string;
}

export const CareSheetsSettings: React.FC<CareSheetsSettingsProps> = ({ userEmail, studioName }) => {
  const toast = useToast();
  const [templates, setTemplates] = useState<CareTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const useSupabase = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY && userEmail && studioName);
  const studioId = userEmail && studioName ? getStudioId(userEmail, studioName) : null;

  useEffect(() => {
    if (studioId && useSupabase) {
      getCareTemplatesFromSupabase(studioId).then((fromDb) => {
        const list = (fromDb || []) as CareTemplate[];
        setTemplates(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
      }).catch(() => {});
    } else {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        const list = Array.isArray(parsed) ? parsed : [];
        setTemplates(list);
        if (list.length > 0) setSelectedId(list[0].id);
      } catch {
        setTemplates([]);
      }
    }
  }, [studioId, useSupabase]);

  const selected = templates.find(t => t.id === selectedId);

  useEffect(() => {
    if (selected) {
      setDraftTitle(selected.title);
      setDraftContent(selected.content);
    } else {
      setDraftTitle('');
      setDraftContent('');
    }
  }, [selectedId, selected]);

  // Auto-save templates list whenever it changes (debounced)
  const { saving } = useAutoSave(templates, async (list) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (studioId && useSupabase) {
      await saveCareTemplatesToSupabase(studioId, list);
    }
  }, { debounceMs: 500 });

  const createTemplate = () => {
    const newTemplate: CareTemplate = {
      id: `t${Date.now()}`,
      title: 'Nouveau template',
      content: `Après votre séance :\n\n- Gardez le pansement X heures\n- Lavez doucement à l'eau tiède + savon neutre\n- Appliquez une fine couche de crème\n- Évitez soleil/piscine 2 semaines\n`,
      updatedAt: new Date().toISOString()
    };
    setTemplates(prev => [newTemplate, ...prev]);
    setSelectedId(newTemplate.id);
  };

  const saveTemplate = () => {
    if (!selected || saving) return;
    if (!draftTitle.trim() || !draftContent.trim()) {
      toast.warning('Le titre et le contenu sont requis');
      return;
    }

    setTemplates(prev =>
      prev.map(t =>
        t.id === selected.id
          ? { ...t, title: draftTitle.trim(), content: draftContent.trim(), updatedAt: new Date().toISOString() }
          : t
      )
    );
    toast.success('Template de soins sauvegarde');
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (selectedId === id) {
      const remaining = templates.filter(t => t.id !== id);
      setSelectedId(remaining[0]?.id || null);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Soins post-tattoo</h2>
          <p className="text-neutral-600 text-sm mt-1">Templates de consignes de soin pour vos clients</p>
        </div>
        <button onClick={createTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800">
          <Plus className="w-4 h-4" /> Nouveau template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-neutral-200 text-center">
          <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="font-semibold text-neutral-900 mb-2">Aucun template</p>
          <p className="text-neutral-600 text-sm mb-4">Créez votre premier template de soins post-tattoo.</p>
          <button onClick={createTemplate}
            className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800">
            Créer un template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="font-semibold">Templates</h3>
            </div>
            <div className="divide-y divide-neutral-200 max-h-[400px] overflow-y-auto">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors ${selectedId === t.id ? 'bg-neutral-100 border-l-4 border-neutral-900' : ''}`}
                >
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {new Date(t.updatedAt).toLocaleDateString('fr-FR')}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-neutral-200">
            {selected && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Titre</label>
                  <input type="text" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Contenu</label>
                  <textarea rows={12} value={draftContent} onChange={(e) => setDraftContent(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl resize-none" />
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setDeleteConfirmId(selected.id)}
                    className="px-4 py-2 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50">
                    <Trash2 className="w-4 h-4 inline mr-2" /> Supprimer
                  </button>
                  <button onClick={saveTemplate} disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50">
                    <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && deleteTemplate(deleteConfirmId)}
        title="Supprimer ce template ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};
