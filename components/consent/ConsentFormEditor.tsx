import React, { useState } from 'react';
import { FileText, Plus, Save, Trash2, Eye, Loader2 } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';

interface ConsentTemplate {
  id: string;
  title: string;
  content: string;
}

const DEFAULT_TEMPLATE: ConsentTemplate = {
  id: 'default',
  title: 'Consentement standard',
  content: `FORMULAIRE DE CONSENTEMENT - TATOUAGE

Je soussigne(e) [NOM_CLIENT], declare avoir ete informe(e) des points suivants :

1. RISQUES : Le tatouage implique une penetration de l'epiderme par des aiguilles. Comme toute procedure invasive, il comporte des risques d'infection, de reaction allergique et de cicatrisation difficile.

2. HYGIENE : Le studio utilise du materiel sterile a usage unique. Les encres utilisees sont conformes a la reglementation europeenne.

3. CONTRE-INDICATIONS : J'affirme ne pas presenter de contre-indications (grossesse, maladie de peau, traitement anticoagulant, diabete non stabilise).

4. SOINS : Je m'engage a suivre les consignes de soins post-tatouage fournies par l'artiste.

5. CONSENTEMENT : Je consens librement a la realisation du tatouage decrit ci-dessous et accepte les conditions mentionnees.

Description du tatouage : _______________
Emplacement : _______________
Artiste : _______________

Date : _______________
Signature :`,
};

interface ConsentFormEditorProps {
  templates: ConsentTemplate[];
  onSave: (templates: ConsentTemplate[]) => void;
}

export const ConsentFormEditor: React.FC<ConsentFormEditorProps> = ({ templates, onSave }) => {
  const [items, setItems] = useState<ConsentTemplate[]>(templates.length > 0 ? templates : [DEFAULT_TEMPLATE]);
  const [selectedId, setSelectedId] = useState(items[0]?.id || '');
  const [draftTitle, setDraftTitle] = useState(items[0]?.title || '');
  const [draftContent, setDraftContent] = useState(items[0]?.content || '');
  const [preview, setPreview] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selected = items.find(t => t.id === selectedId);

  const selectTemplate = (id: string) => {
    const t = items.find(x => x.id === id);
    if (t) {
      setSelectedId(id);
      setDraftTitle(t.title);
      setDraftContent(t.content);
      setPreview(false);
    }
  };

  const addTemplate = () => {
    if (creating) return;
    setCreating(true);
    const newT: ConsentTemplate = {
      id: `consent_${Date.now()}`,
      title: 'Nouveau formulaire',
      content: DEFAULT_TEMPLATE.content,
    };
    const updated = [...items, newT];
    setItems(updated);
    selectTemplate(newT.id);
    onSave(updated);
    setTimeout(() => setCreating(false), 400);
  };

  const saveTemplate = () => {
    if (saving) return;
    setSaving(true);
    const updated = items.map(t =>
      t.id === selectedId ? { ...t, title: draftTitle.trim(), content: draftContent.trim() } : t
    );
    setItems(updated);
    onSave(updated);
    setTimeout(() => setSaving(false), 400);
  };

  const deleteTemplate = (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    const updated = items.filter(t => t.id !== id);
    setItems(updated);
    if (selectedId === id && updated.length > 0) selectTemplate(updated[0].id);
    onSave(updated);
    setDeleteConfirmId(null);
    setTimeout(() => setDeletingId(null), 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Formulaires de consentement</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Templates de consentement envoyes aux clients avant leur RDV</p>
        </div>
        <button onClick={addTemplate} disabled={creating} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {creating ? 'En cours…' : 'Nouveau'}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-2xl p-12 border border-[var(--border)] text-center">
          <FileText className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4" />
          <p className="font-semibold text-[var(--text-primary)] mb-2">Aucun formulaire</p>
          <button onClick={addTemplate} disabled={creating} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto transition-colors">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {creating ? 'En cours…' : 'Creer un formulaire'}
        </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]"><h3 className="font-semibold text-[var(--text-primary)]">Formulaires</h3></div>
            <div className="divide-y divide-[var(--border)] max-h-[400px] overflow-y-auto">
              {items.map(t => (
                <button key={t.id} onClick={() => selectTemplate(t.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${selectedId === t.id
                    ? 'bg-[var(--bg-hover-strong)] border-l-4 border-blue-500 text-[var(--text-primary)]'
                    : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'}`}>
                  <div className="font-medium truncate">{t.title}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
            {selected && !preview && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">Titre</label>
                  <input type="text" value={draftTitle} onChange={e => setDraftTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-[var(--border-focus)]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">Contenu</label>
                  <textarea rows={16} value={draftContent} onChange={e => setDraftContent(e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-xl resize-none font-mono text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-[var(--border-focus)]" />
                </div>
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirmId(selected.id)} disabled={!!deletingId}
                      className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                      {deletingId === selected.id ? <Loader2 className="w-4 h-4 inline mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 inline mr-2" />}
                      {deletingId === selected.id ? 'Suppression…' : 'Supprimer'}
                    </button>
                    <button onClick={() => setPreview(true)}
                      className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hover)] transition-colors">
                      <Eye className="w-4 h-4 inline mr-2" />Apercu
                    </button>
                  </div>
                  <button onClick={saveTemplate} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}
            {selected && preview && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">Apercu : {draftTitle}</h3>
                  <button onClick={() => setPreview(false)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline transition-colors">Retour a l'edition</button>
                </div>
                <div className="bg-[var(--bg-card-secondary)] rounded-xl p-6 border border-[var(--border)] whitespace-pre-wrap font-mono text-sm text-[var(--text-primary)]">{draftContent}</div>
              </div>
            )}
          </div>
        </div>
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
