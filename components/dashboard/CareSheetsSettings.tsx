import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, FileText, Sparkles, Clock, Shield, Droplets, Sun, Scissors, Copy, Check, Eye, ChevronRight } from 'lucide-react';
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
  icon?: string;
  color?: string;
  updatedAt: string;
}

interface CareSheetsSettingsProps {
  userEmail?: string;
  studioName?: string;
}

const PRESET_TEMPLATES: Omit<CareTemplate, 'id' | 'updatedAt'>[] = [
  {
    title: 'Soins classiques - Tatouage traditionnel',
    icon: 'classic',
    color: 'blue',
    content: `🎨 SOINS POST-TATOUAGE - GUIDE COMPLET

Félicitations pour votre nouveau tatouage ! Voici les étapes essentielles pour une cicatrisation optimale.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 LES PREMIÈRES HEURES (0-4h)

• Gardez le pansement pendant 2 à 4 heures minimum
• Ne touchez pas le pansement, même si ça démange
• Évitez tout contact avec de l'eau

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚿 PREMIER NETTOYAGE

1. Lavez-vous soigneusement les mains au savon
2. Retirez délicatement le pansement sous l'eau tiède
3. Nettoyez le tatouage avec un savon neutre (pH neutre, sans parfum)
4. Rincez abondamment à l'eau tiède
5. Séchez en tapotant légèrement avec une serviette propre

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💧 HYDRATATION (2 à 3 semaines)

• Appliquez une fine couche de crème cicatrisante
• Crèmes recommandées : Bepanthen, Cicaplast, ou crème spéciale tatouage
• Fréquence : 2 à 3 fois par jour
• Ne JAMAIS appliquer de vaseline ou de produit gras

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ À ÉVITER PENDANT 2 SEMAINES

❌ Exposition au soleil directe
❌ Baignades (piscine, mer, bain)
❌ Sauna et hammam
❌ Sport intense avec transpiration
❌ Vêtements serrés sur le tatouage
❌ Gratter les croûtes (elles tomberont seules !)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SIGNES NORMAUX

• Légère rougeur les premiers jours
• Légers gonflements
• Démangeaisons (bon signe de cicatrisation)
• Petites croûtes ou peau qui pèle

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 CONSULTER UN MÉDECIN SI

• Fièvre ou frissons
• Écoulement de pus
• Rougeur qui s'étend
• Douleur intense après 48h
• Gonflement important

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 CONTACT STUDIO

Pour toute question, n'hésitez pas à nous contacter !
Une retouche gratuite est possible après cicatrisation complète (6-8 semaines).

Prenez soin de votre tatouage, il vous accompagnera toute la vie ! 🖤`
  },
  {
    title: 'Soins film protecteur (Saniderm/Dermalize)',
    icon: 'film',
    color: 'purple',
    content: `🎬 SOINS POST-TATOUAGE - FILM PROTECTEUR
(Saniderm, Dermalize, Second Skin)

Votre tatouage est protégé par un film médical respirant qui facilite la cicatrisation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ DURÉE DU FILM

Premier film : Gardez-le 24 heures
→ Si beaucoup de liquide s'accumule, retirez-le après 24h

Deuxième film (si appliqué) : Gardez-le 3 à 5 jours
→ Vous pouvez vous doucher normalement avec le film

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚿 RETRAIT DU FILM

1. Retirez le film SOUS LA DOUCHE avec de l'eau tiède
2. Décollez lentement en tirant vers le bas (pas vers le haut)
3. Nettoyez délicatement avec un savon neutre
4. Séchez en tapotant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💧 APRÈS LE RETRAIT

• Hydratez 2-3x/jour avec une crème cicatrisante
• Continuez pendant 2 semaines
• Le tatouage peut paraître "terne" : c'est normal !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ATTENTION

❌ Ne retirez pas le film à sec
❌ Ne percez pas les bulles de liquide (c'est normal)
❌ Ne réappliquez pas de film vous-même
❌ Évitez soleil/baignade pendant 2 semaines après retrait

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Le film protecteur permet une cicatrisation plus rapide et réduit les risques d'infection. Faites confiance au processus ! 💜`
  },
  {
    title: 'Soins minimalistes',
    icon: 'minimal',
    color: 'green',
    content: `✨ SOINS POST-TATOUAGE - VERSION SIMPLE

Les règles essentielles en 5 points :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ PANSEMENT
   Gardez-le 2-4h, puis retirez

2️⃣ NETTOYAGE
   2x par jour, savon neutre + eau tiède

3️⃣ HYDRATATION
   Crème cicatrisante 2-3x par jour

4️⃣ PROTECTION
   Pas de soleil ni baignade pendant 2 semaines

5️⃣ PATIENCE
   Ne grattez jamais les croûtes !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 Une question ? Contactez le studio !`
  },
  {
    title: 'Soins tatouage couleur',
    icon: 'color',
    color: 'orange',
    content: `🌈 SOINS POST-TATOUAGE - SPÉCIAL COULEUR

Les tatouages couleur nécessitent des soins particuliers pour préserver leur éclat !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 SPÉCIFICITÉS COULEUR

Les pigments colorés sont plus sensibles que le noir :
• Plus sensibles au soleil
• Cicatrisation parfois plus longue
• Peuvent paraître "délavés" durant la cicatrisation (normal !)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☀️ PROTECTION SOLAIRE (TRÈS IMPORTANT)

• Évitez TOTALEMENT le soleil pendant 4 semaines
• Après cicatrisation : crème SPF50+ obligatoire
• Le soleil fait pâlir les couleurs définitivement

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💧 ROUTINE DE SOINS

Matin :
1. Nettoyer à l'eau tiède + savon neutre
2. Sécher en tapotant
3. Appliquer une fine couche de crème

Soir :
1. Même routine qu'au matin
2. Laisser respirer la nuit (pas de pansement)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ PRÉCAUTIONS SUPPLÉMENTAIRES

❌ Pas de baignade pendant 3-4 semaines
❌ Évitez les vêtements qui frottent
❌ Pas d'autobronzant sur la zone
❌ Pas de gommage pendant 1 mois

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Une retouche couleur gratuite est possible si besoin après 6-8 semaines ! 🎨`
  }
];

export const CareSheetsSettings: React.FC<CareSheetsSettingsProps> = ({ userEmail, studioName }) => {
  const toast = useToast();
  const [templates, setTemplates] = useState<CareTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);
  
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
      }).catch(() => { toast.error('Une erreur est survenue'); });
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
      setPreviewMode(false);
    } else {
      setDraftTitle('');
      setDraftContent('');
    }
  }, [selectedId, selected]);

  const { saving } = useAutoSave(templates, async (list) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (studioId && useSupabase) {
      await saveCareTemplatesToSupabase(studioId, list);
    }
  }, { debounceMs: 500 });

  const createFromPreset = (preset: Omit<CareTemplate, 'id' | 'updatedAt'>) => {
    const newTemplate: CareTemplate = {
      id: `t${Date.now()}`,
      ...preset,
      updatedAt: new Date().toISOString()
    };
    setTemplates(prev => [newTemplate, ...prev]);
    setSelectedId(newTemplate.id);
    setShowPresets(false);
    toast.success('Template ajouté !');
  };

  const createTemplate = () => {
    const newTemplate: CareTemplate = {
      id: `t${Date.now()}`,
      title: 'Nouveau template',
      content: `Après votre séance de tatouage :

• Gardez le pansement pendant X heures
• Lavez délicatement avec un savon neutre
• Appliquez une fine couche de crème cicatrisante
• Évitez soleil et baignade pendant 2 semaines
• Ne grattez jamais les croûtes

Pour toute question, contactez le studio !`,
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
    toast.success('Template sauvegardé');
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (selectedId === id) {
      const remaining = templates.filter(t => t.id !== id);
      setSelectedId(remaining[0]?.id || null);
    }
    setDeleteConfirmId(null);
    toast.success('Template supprimé');
  };

  const copyContent = () => {
    navigator.clipboard.writeText(draftContent);
    setCopied(true);
    toast.success('Contenu copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const getPresetIcon = (icon?: string) => {
    switch (icon) {
      case 'classic': return <Droplets className="w-5 h-5" />;
      case 'film': return <Shield className="w-5 h-5" />;
      case 'minimal': return <Scissors className="w-5 h-5" />;
      case 'color': return <Sun className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getPresetColor = (color?: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      case 'purple': return 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
      case 'green': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'orange': return 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20';
      default: return 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Soins post-tattoo</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Templates de consignes à envoyer à vos clients</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Templates prêts
          </button>
          <button 
            onClick={createTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau
          </button>
        </div>
      </div>

      {/* Presets Panel */}
      {showPresets && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-500/5 dark:to-purple-500/5 rounded-2xl p-5 border border-blue-100 dark:border-blue-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">Templates prêts à l'emploi</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESET_TEMPLATES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => createFromPreset(preset)}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:scale-[1.02] hover:shadow-md ${getPresetColor(preset.color)}`}
              >
                <div className="p-2.5 rounded-lg bg-white/50 dark:bg-white/10">
                  {getPresetIcon(preset.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-white truncate">{preset.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Cliquez pour ajouter</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {templates.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 border border-zinc-200 dark:border-zinc-800 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-zinc-400" />
          </div>
          <p className="font-semibold text-zinc-900 dark:text-white mb-2">Aucun template</p>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">Créez ou importez un template de soins post-tattoo</p>
          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={() => setShowPresets(true)}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Voir les templates prêts
            </button>
            <button 
              onClick={createTemplate}
              className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              Créer de zéro
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates List */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Mes templates ({templates.length})</h3>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[500px] overflow-y-auto">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left px-4 py-3.5 transition-colors ${
                    selectedId === t.id 
                      ? 'bg-zinc-50 dark:bg-zinc-800 border-l-2 border-zinc-900 dark:border-white' 
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <p className={`font-medium truncate ${selectedId === t.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {t.title}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(t.updatedAt).toLocaleDateString('fr-FR')}
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
                        !previewMode ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      Éditer
                    </button>
                    <button
                      onClick={() => setPreviewMode(true)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        previewMode ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700'
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
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>

                {/* Content */}
                <div className="p-5">
                  {previewMode ? (
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-6 min-h-[400px]">
                      <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-4">{draftTitle}</h3>
                      <div className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
                        {draftContent}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Titre du template</label>
                        <input 
                          type="text" 
                          value={draftTitle} 
                          onChange={(e) => setDraftTitle(e.target.value)}
                          className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent"
                          placeholder="Ex: Soins classiques"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Contenu</label>
                        <textarea 
                          rows={14} 
                          value={draftContent} 
                          onChange={(e) => setDraftContent(e.target.value)}
                          className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white resize-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent font-mono text-sm"
                          placeholder="Écrivez vos consignes de soins ici..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <button 
                    onClick={() => setDeleteConfirmId(selected.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                  <button 
                    onClick={saveTemplate} 
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Sauvegarde...' : 'Enregistrer'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-zinc-400">
                Sélectionnez un template
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
