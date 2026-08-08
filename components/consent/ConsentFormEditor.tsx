import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Save,
  Trash2,
  Eye,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Shield,
  Scale,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { CONSENT_FORM_PRESETS } from '../../lib/consentFormPresets';

interface ConsentTemplate {
  id: string;
  title: string;
  content: string;
  icon?: string;
  color?: string;
}

interface ConsentFormEditorProps {
  templates: ConsentTemplate[];
  onSave: (templates: ConsentTemplate[]) => void;
}

export const ConsentFormEditor: React.FC<ConsentFormEditorProps> = ({ templates, onSave }) => {
  const toast = useToast();
  const [items, setItems] = useState<ConsentTemplate[]>(templates.length > 0 ? templates : []);
  const [selectedId, setSelectedId] = useState(items[0]?.id || '');
  const [draftTitle, setDraftTitle] = useState(items[0]?.title || '');
  const [draftContent, setDraftContent] = useState(items[0]?.content || '');
  const [previewMode, setPreviewMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(items.length === 0);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = items.find((t) => t.id === selectedId);

  const selectTemplate = (id: string) => {
    const t = items.find((x) => x.id === id);
    if (t) {
      setSelectedId(id);
      setDraftTitle(t.title);
      setDraftContent(t.content);
      setPreviewMode(false);
    }
  };

  const createFromPreset = (preset: Omit<ConsentTemplate, 'id'>) => {
    setCreating(true);
    const newT: ConsentTemplate = {
      id: `consent_${Date.now()}`,
      ...preset,
    };
    const updated = [...items, newT];
    setItems(updated);
    selectTemplate(newT.id);
    onSave(updated);
    setShowPresets(false);
    toast.success('Formulaire ajouté !');
    setTimeout(() => setCreating(false), 400);
  };

  const addTemplate = () => {
    if (creating) return;
    setCreating(true);
    const newT: ConsentTemplate = {
      id: `consent_${Date.now()}`,
      title: 'Nouveau formulaire',
      content: `FORMULAIRE DE CONSENTEMENT

Je soussigné(e) ________________________________

déclare consentir librement à la réalisation du tatouage 
décrit ci-dessous.

Description : ___________________________________
Emplacement : _________________________________

Date : ____/____/________
Signature : ____________________________________`,
    };
    const updated = [...items, newT];
    setItems(updated);
    selectTemplate(newT.id);
    onSave(updated);
    setTimeout(() => setCreating(false), 400);
  };

  const saveTemplate = () => {
    if (saving) return;
    if (!draftTitle.trim() || !draftContent.trim()) {
      toast.warning('Le titre et le contenu sont requis');
      return;
    }
    setSaving(true);
    const updated = items.map((t) =>
      t.id === selectedId ? { ...t, title: draftTitle.trim(), content: draftContent.trim() } : t
    );
    setItems(updated);
    onSave(updated);
    toast.success('Formulaire sauvegardé');
    setTimeout(() => setSaving(false), 400);
  };

  const deleteTemplate = (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    const updated = items.filter((t) => t.id !== id);
    setItems(updated);
    if (selectedId === id && updated.length > 0) selectTemplate(updated[0].id);
    onSave(updated);
    setDeleteConfirmId(null);
    toast.success('Formulaire supprimé');
    setTimeout(() => setDeletingId(null), 400);
  };

  const copyContent = () => {
    navigator.clipboard.writeText(draftContent);
    setCopied(true);
    toast.success('Contenu copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const getPresetIcon = (icon?: string) => {
    switch (icon) {
      case 'standard':
        return <Shield className="w-5 h-5" />;
      case 'minor':
        return <Heart className="w-5 h-5" />;
      case 'piercing':
        return <Scale className="w-5 h-5" />;
      case 'simple':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getPresetColor = (color?: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      case 'purple':
        return 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
      case 'green':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'orange':
        return 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20';
      default:
        return 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="type-heading-sm">Formulaires de consentement</h2>
          <p className="type-subtitle mt-1">Documents légaux à faire signer avant chaque séance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Templates légaux
          </button>
          <button
            onClick={addTemplate}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Nouveau
          </button>
        </div>
      </div>

      {/* Presets Panel */}
      {showPresets && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-2xl p-5 border border-blue-100 dark:border-blue-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              Formulaires légaux prêts à l'emploi
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CONSENT_FORM_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => createFromPreset(preset)}
                disabled={creating}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:scale-[1.02] hover:shadow-md disabled:opacity-50 ${getPresetColor(preset.color)}`}
              >
                <div className="p-2.5 rounded-lg bg-white/50 dark:bg-white/10">
                  {getPresetIcon(preset.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-white truncate">
                    {preset.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Cliquez pour ajouter
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {items.length === 0 && !showPresets ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 border border-zinc-200 dark:border-zinc-800 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-zinc-400" />
          </div>
          <p className="font-semibold text-zinc-900 dark:text-white mb-2">Aucun formulaire</p>
          <p className="type-subtitle mb-6">Créez ou importez un formulaire de consentement</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowPresets(true)}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Voir les templates
            </button>
            <button
              onClick={addTemplate}
              disabled={creating}
              className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              Créer de zéro
            </button>
          </div>
        </div>
      ) : (
        items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Templates List */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">
                  Mes formulaires ({items.length})
                </h3>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[500px] overflow-y-auto">
                {items.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTemplate(t.id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors ${
                      selectedId === t.id
                        ? 'bg-zinc-50 dark:bg-zinc-800 border-l-2 border-zinc-900 dark:border-white'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <p
                      className={`font-medium truncate ${selectedId === t.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}
                    >
                      {t.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {selected ? (
                <>
                  {/* Toolbar */}
                  <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewMode(false)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          !previewMode
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                            : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => setPreviewMode(true)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                          previewMode
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                            : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Aperçu
                      </button>
                    </div>
                    <button
                      onClick={copyContent}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copied ? 'Copié !' : 'Copier'}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {previewMode ? (
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-6 min-h-[400px]">
                        <div className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 text-sm font-mono leading-relaxed">
                          {draftContent}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Titre du formulaire
                          </label>
                          <input
                            type="text"
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent"
                            placeholder="Ex: Consentement tatouage"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Contenu du formulaire
                          </label>
                          <textarea
                            rows={16}
                            value={draftContent}
                            onChange={(e) => setDraftContent(e.target.value)}
                            className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white resize-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent font-mono text-sm"
                            placeholder="Rédigez votre formulaire de consentement..."
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <button
                      onClick={() => setDeleteConfirmId(selected.id)}
                      disabled={!!deletingId}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {deletingId === selected.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Supprimer
                    </button>
                    <button
                      onClick={saveTemplate}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {saving ? 'Sauvegarde...' : 'Enregistrer'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-zinc-400">
                  Sélectionnez un formulaire
                </div>
              )}
            </div>
          </div>
        )
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && deleteTemplate(deleteConfirmId)}
        title="Supprimer ce formulaire ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        confirmLoading={deletingId === deleteConfirmId}
        closeOnConfirm={false}
        variant="danger"
      />
    </div>
  );
};
