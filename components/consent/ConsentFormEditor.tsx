import React, { useState } from 'react';
import { FileText, Plus, Save, Trash2, Eye } from 'lucide-react';
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
    const newT: ConsentTemplate = {
      id: `consent_${Date.now()}`,
      title: 'Nouveau formulaire',
      content: DEFAULT_TEMPLATE.content,
    };
    const updated = [...items, newT];
    setItems(updated);
    selectTemplate(newT.id);
    onSave(updated);
  };

  const saveTemplate = () => {
    const updated = items.map(t =>
      t.id === selectedId ? { ...t, title: draftTitle.trim(), content: draftContent.trim() } : t
    );
    setItems(updated);
    onSave(updated);
  };

  const deleteTemplate = (id: string) => {
    const updated = items.filter(t => t.id !== id);
    setItems(updated);
    if (selectedId === id && updated.length > 0) selectTemplate(updated[0].id);
    onSave(updated);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Formulaires de consentement</h2>
          <p className="text-neutral-600 text-sm mt-1">Templates de consentement envoyes aux clients avant leur RDV</p>
        </div>
        <button onClick={addTemplate} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800">
          <Plus className="w-4 h-4" /> Nouveau
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-neutral-200 text-center">
          <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="font-semibold mb-2">Aucun formulaire</p>
          <button onClick={addTemplate} className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold">Creer un formulaire</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200"><h3 className="font-semibold">Formulaires</h3></div>
            <div className="divide-y divide-neutral-200 max-h-[400px] overflow-y-auto">
              {items.map(t => (
                <button key={t.id} onClick={() => selectTemplate(t.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-neutral-50 ${selectedId === t.id ? 'bg-neutral-100 border-l-4 border-neutral-900' : ''}`}>
                  <div className="font-medium truncate">{t.title}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-neutral-200">
            {selected && !preview && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Titre</label>
                  <input type="text" value={draftTitle} onChange={e => setDraftTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Contenu</label>
                  <textarea rows={16} value={draftContent} onChange={e => setDraftContent(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl resize-none font-mono text-sm" />
                </div>
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirmId(selected.id)}
                      className="px-4 py-2 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50">
                      <Trash2 className="w-4 h-4 inline mr-2" />Supprimer
                    </button>
                    <button onClick={() => setPreview(true)}
                      className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50">
                      <Eye className="w-4 h-4 inline mr-2" />Apercu
                    </button>
                  </div>
                  <button onClick={saveTemplate} className="flex items-center gap-2 px-6 py-2 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800">
                    <Save className="w-4 h-4" /> Enregistrer
                  </button>
                </div>
              </div>
            )}
            {selected && preview && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Apercu : {draftTitle}</h3>
                  <button onClick={() => setPreview(false)} className="text-sm text-neutral-600 hover:text-neutral-900 underline">Retour a l'edition</button>
                </div>
                <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200 whitespace-pre-wrap font-mono text-sm">{draftContent}</div>
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
        variant="danger"
      />
    </div>
  );
};
