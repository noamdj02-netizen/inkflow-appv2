import React, { useState, useEffect, useRef } from 'react';
import { Store, ChevronRight, ExternalLink, Plus, Trash2, Save, Check } from 'lucide-react';
import { VitrineLinkButton } from '../dashboard/VitrineLinkButton';
import { ThemeSelector } from './ThemeSelector';
import { ImageUploadField } from '../ui/ImageUploadField';
import { useToast } from '../../contexts/ToastContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import type { VitrineData, VitrineService, VitrineArtist, VitrineTestimonial, VitrinePortfolioItem, VitrineFlashDesign, VitrineFaq, VitrineWhyChooseUs } from '../../types/vitrine';
import { getVitrineData, getVitrineSlug, getVitrineDataAsync, saveVitrineDataAsync } from '../../lib/vitrineStorage';

const ICON_OPTIONS = [
  { value: 'sparkles', label: 'Étincelles' },
  { value: 'award', label: 'Trophée' },
  { value: 'star', label: 'Étoile' },
  { value: 'camera', label: 'Appareil photo' },
  { value: 'shield', label: 'Bouclier' },
  { value: 'heart', label: 'Cœur' },
  { value: 'users', label: 'Utilisateurs' }
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi',
  friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche'
};

interface VitrineSettingsProps {
  studioName: string;
  userEmail?: string;
  /** Slug réel du studio (depuis la BDD) — prioritaire pour isoler les données vitrine par tatoueur. */
  studioSlug?: string | null;
  /** ID du studio pour le sélecteur de thème. */
  studioId?: string | null;
}

export const VitrineSettings: React.FC<VitrineSettingsProps> = ({ studioName, userEmail, studioSlug: studioSlugFromDb, studioId }) => {
  const toast = useToast();
  const slug = (studioSlugFromDb != null && studioSlugFromDb !== '') ? studioSlugFromDb : getVitrineSlug(studioName);
  const [data, setData] = useState<VitrineData>(() => getVitrineData(slug));
  const [activeSection, setActiveSection] = useState<string>('identity');
  const [manualSaving, setManualSaving] = useState(false);
  const initialLoadRef = useRef(true);
  const dirtyRef = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    initialLoadRef.current = true;
    dirtyRef.current = false;
    if (userEmail && studioName) {
      getVitrineDataAsync(slug, userEmail, studioName).then((fromDb) => {
        if (!dirtyRef.current) setData(fromDb);
        initialLoadRef.current = false;
      });
    } else {
      setData(getVitrineData(slug));
      initialLoadRef.current = false;
    }
  }, [slug, userEmail, studioName]);

  // Silent auto-save: dedicated wrapper with its own try/catch. No toasts, no UI on error.
  const silentAutoSave = async (d: VitrineData) => {
    const key = `inkflow-vitrine-${slug}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify({ ...d, slug }));
    }
    if (userEmail && studioName) {
      try {
        await saveVitrineDataAsync(slug, d, userEmail, studioName);
      } catch (err) {
      }
    }
  };

  const { saving, saved, saveNow } = useAutoSave(data, silentAutoSave, { debounceMs: 800 });

  const update = <K extends keyof VitrineData>(key: K, value: VitrineData[K]) => {
    dirtyRef.current = true;
    setData(prev => ({ ...prev, [key]: value }));
  };

  // Explicit manual save: use dataRef so we always save the latest state (avoids stale closure when user changes photo then clicks Save quickly).
  const handleManualSave = async () => {
    setManualSaving(true);
    const latestData = dataRef.current;
    const key = `inkflow-vitrine-${slug}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify({ ...latestData, slug }));
    }
    try {
      if (userEmail && studioName) {
        await saveVitrineDataAsync(slug, latestData, userEmail, studioName);
        toast.success('Sauvegardé !');
      } else {
        toast.success('Sauvegardé !');
      }
    } catch (err) {
      toast.warning('Sauvegardé localement. Synchronisation serveur échouée.');
    } finally {
      setManualSaving(false);
    }
  };

  const sections = [
    { id: 'identity', label: 'Identité & Présentation', icon: Store },
    { id: 'contact', label: 'Contact & Réseaux' },
    { id: 'stats', label: 'Statistiques' },
    { id: 'services', label: 'Services' },
    { id: 'artists', label: 'Artistes' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'flash', label: 'Flash' },
    { id: 'testimonials', label: 'Avis clients' },
    { id: 'faq', label: 'FAQ' },
    { id: 'why', label: 'Pourquoi nous' },
    { id: 'hours', label: 'Horaires' }
  ];

  const publicUrl = typeof window !== 'undefined' && slug
    ? `${window.location.origin}/studio/${slug}`
    : '';
  const slugConflict = (studioSlugFromDb != null && studioSlugFromDb !== '') &&
    getVitrineSlug(studioName) !== studioSlugFromDb;

  return (
    <div className="space-y-6 max-w-4xl w-full overflow-hidden">
      <VitrineLinkButton studioName={studioName} userEmail={userEmail} studioSlug={studioSlugFromDb} />
      {studioId && (
        <ThemeSelector studioId={studioId} userEmail={userEmail} publicVitrineUrl={publicUrl || undefined} />
      )}
      {publicUrl && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-secondary)] p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Votre lien public</p>
          <p className="text-sm text-[var(--text-secondary)] break-all font-mono">{publicUrl}</p>
          {slugConflict && (
            <p className="text-xs text-zinc-700 dark:text-zinc-400 mt-2">
              Ce nom était déjà pris, votre lien unique est ci-dessus.
            </p>
          )}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg sm:text-xl font-bold">Personnaliser votre page vitrine</h2>
        <button onClick={handleManualSave} disabled={saving || manualSaving} className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
          {manualSaving || saving ? 'Enregistrement...' : saved ? <><Check className="w-5 h-5" /> Enregistré</> : <><Save className="w-5 h-5" /> Enregistrer</>}
        </button>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)] pb-4 overflow-x-auto flex-nowrap sm:flex-wrap -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {sections.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${activeSection === id ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
            {Icon && <Icon className="w-4 h-4" />}
            {label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl p-6 md:p-8 border border-[var(--border)]">
        {activeSection === 'identity' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Identité du studio</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nom du studio</label>
                <input type="text" value={data.name} onChange={(e) => update('name', e.target.value)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Slogan / Tagline</label>
                <input type="text" value={data.tagline} onChange={(e) => update('tagline', e.target.value)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="L'art du tatouage depuis 2015" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea value={data.description} onChange={(e) => update('description', e.target.value)} rows={4} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
            </div>
            <div className="space-y-6">
              <ImageUploadField
                label="Logo / Avatar"
                value={data.avatar}
                onChange={(v) => update('avatar', v)}
                shape="round"
                previewSize="md"
              />
              <ImageUploadField
                label="Image de couverture"
                value={data.coverImage}
                onChange={(v) => update('coverImage', v)}
                shape="cover"
                previewSize="lg"
              />
            </div>
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Coordonnées</h3>
            <div>
              <label className="block text-sm font-semibold mb-2">Adresse</label>
              <input type="text" value={data.address} onChange={(e) => update('address', e.target.value)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Téléphone</label>
                <input type="tel" value={data.phone} onChange={(e) => update('phone', e.target.value)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input type="email" value={data.email} onChange={(e) => update('email', e.target.value)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Instagram</label>
                <input type="text" value={data.instagram} onChange={(e) => update('instagram', e.target.value)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="@votrestudio" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Facebook</label>
                <input type="text" value={data.facebook} onChange={(e) => update('facebook', e.target.value)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Site web</label>
                <input type="text" value={data.website} onChange={(e) => update('website', e.target.value)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="www.exemple.fr" />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'stats' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Statistiques (affichées sur la vitrine)</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={data.showStatsBanner !== false} onChange={(e) => update('showStatsBanner', e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium">Afficher la bannière statistiques</span>
              </label>
            </div>
            <p className="text-sm text-[var(--text-tertiary)]">Décochez pour masquer entièrement la section (Tatouages réalisés, Satisfaction, etc.) sur votre page vitrine.</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Note (ex: 4.9)</label>
                <input type="number" step="0.1" value={data.rating} onChange={(e) => update('rating', parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Nombre d'avis</label>
                <input type="number" value={data.reviewCount} onChange={(e) => update('reviewCount', parseInt(e.target.value) || 0)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Années d'expérience</label>
                <input type="number" value={data.yearsExperience} onChange={(e) => update('yearsExperience', parseInt(e.target.value) || 0)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Tatouages réalisés</label>
                <input type="number" value={data.totalTattoos} onChange={(e) => update('totalTattoos', parseInt(e.target.value) || 0)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Taux satisfaction %</label>
                <input type="number" value={data.satisfactionRate} onChange={(e) => update('satisfactionRate', parseInt(e.target.value) || 0)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Clients fidèles %</label>
                <input type="number" value={data.repeatClients} onChange={(e) => update('repeatClients', parseInt(e.target.value) || 0)} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'services' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Section « Nos services » sur la vitrine</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  Décochez pour masquer la section sur votre page publique. Vous pouvez toujours modifier le contenu ci-dessous.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={data.showServicesSection !== false}
                  onChange={(e) => update('showServicesSection', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">Afficher la section</span>
              </label>
            </div>
            <h3 className="font-bold text-lg">Contenu des offres</h3>
            {data.services.map((service, idx) => (
              <div key={idx} className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Service {idx + 1}</span>
                  <button onClick={() => update('services', data.services.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input value={service.name} onChange={(e) => {
                    const s = [...data.services]; s[idx] = { ...s[idx], name: e.target.value }; update('services', s);
                  }} placeholder="Nom" className="px-4 py-2 border rounded-lg" />
                  <input value={service.price} onChange={(e) => {
                    const s = [...data.services]; s[idx] = { ...s[idx], price: e.target.value }; update('services', s);
                  }} placeholder="Prix (ex: À partir de 150€)" className="px-4 py-2 border rounded-lg" />
                </div>
                <input value={service.duration} onChange={(e) => {
                  const s = [...data.services]; s[idx] = { ...s[idx], duration: e.target.value }; update('services', s);
                }} placeholder="Durée (ex: 2-4h)" className="w-full px-4 py-2 border rounded-lg" />
                <textarea value={service.description} onChange={(e) => {
                  const s = [...data.services]; s[idx] = { ...s[idx], description: e.target.value }; update('services', s);
                }} placeholder="Description" rows={2} className="w-full px-4 py-2 border rounded-lg resize-none" />
                <select value={service.icon} onChange={(e) => {
                  const s = [...data.services]; s[idx] = { ...s[idx], icon: e.target.value as VitrineService['icon'] }; update('services', s);
                }} className="px-4 py-2 border rounded-lg">
                  {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input value={service.features.join(', ')} onChange={(e) => {
                  const s = [...data.services]; s[idx] = { ...s[idx], features: e.target.value.split(',').map(f => f.trim()).filter(Boolean) }; update('services', s);
                }} placeholder="Avantages (séparés par des virgules)" className="w-full px-4 py-2 border rounded-lg" />
              </div>
            ))}
            <button onClick={() => update('services', [...data.services, { name: '', price: '', duration: '', description: '', icon: 'sparkles', features: [] }])}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]">
              <Plus className="w-4 h-4" /> Ajouter un service
            </button>
          </div>
        )}

        {activeSection === 'artists' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Artistes</h3>
            {data.artists.map((artist, idx) => (
              <div key={idx} className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Artiste {idx + 1}</span>
                  <button onClick={() => update('artists', data.artists.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input value={artist.name} onChange={(e) => {
                    const a = [...data.artists]; a[idx] = { ...a[idx], name: e.target.value }; update('artists', a);
                  }} placeholder="Nom" className="px-4 py-2 border rounded-lg" />
                  <input value={artist.role} onChange={(e) => {
                    const a = [...data.artists]; a[idx] = { ...a[idx], role: e.target.value }; update('artists', a);
                  }} placeholder="Rôle" className="px-4 py-2 border rounded-lg" />
                </div>
                <ImageUploadField
                  label="Photo de l'artiste"
                  value={artist.avatar}
                  onChange={(v) => {
                    const a = [...data.artists]; a[idx] = { ...a[idx], avatar: v }; update('artists', a);
                  }}
                  shape="round"
                  previewSize="sm"
                />
                <input value={artist.experience} onChange={(e) => {
                  const a = [...data.artists]; a[idx] = { ...a[idx], experience: e.target.value }; update('artists', a);
                }} placeholder="Expérience (ex: 12 ans)" className="w-full px-4 py-2 border rounded-lg" />
                <textarea value={artist.bio} onChange={(e) => {
                  const a = [...data.artists]; a[idx] = { ...a[idx], bio: e.target.value }; update('artists', a);
                }} placeholder="Biographie" rows={2} className="w-full px-4 py-2 border rounded-lg resize-none" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input value={artist.instagram} onChange={(e) => {
                    const a = [...data.artists]; a[idx] = { ...a[idx], instagram: e.target.value }; update('artists', a);
                  }} placeholder="Instagram" className="px-4 py-2 border rounded-lg" />
                  <input type="number" value={artist.portfolio} onChange={(e) => {
                    const a = [...data.artists]; a[idx] = { ...a[idx], portfolio: parseInt(e.target.value) || 0 }; update('artists', a);
                  }} placeholder="Portfolio (nombre)" className="px-4 py-2 border rounded-lg" />
                </div>
                <input value={artist.specialties.join(', ')} onChange={(e) => {
                  const a = [...data.artists]; a[idx] = { ...a[idx], specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }; update('artists', a);
                }} placeholder="Spécialités (séparées par des virgules)" className="w-full px-4 py-2 border rounded-lg" />
              </div>
            ))}
            <button onClick={() => update('artists', [...data.artists, { name: '', role: '', specialties: [], experience: '', avatar: '', bio: '', instagram: '', portfolio: 0 }])}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]">
              <Plus className="w-4 h-4" /> Ajouter un artiste
            </button>
          </div>
        )}

        {activeSection === 'portfolio' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Portfolio</h3>
            {data.portfolio.map((item, idx) => (
              <div key={idx} className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4">
                <ImageUploadField
                  label="Photo portfolio"
                  value={item.url}
                  onChange={(v) => {
                    const p = [...data.portfolio]; p[idx] = { ...p[idx], url: v }; update('portfolio', p);
                  }}
                  previewSize="md"
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input value={item.category} onChange={(e) => {
                    const p = [...data.portfolio]; p[idx] = { ...p[idx], category: e.target.value }; update('portfolio', p);
                  }} placeholder="Catégorie" className="px-4 py-2 border rounded-lg" />
                  <input value={item.artist} onChange={(e) => {
                    const p = [...data.portfolio]; p[idx] = { ...p[idx], artist: e.target.value }; update('portfolio', p);
                  }} placeholder="Artiste" className="px-4 py-2 border rounded-lg" />
                  <input value={item.description} onChange={(e) => {
                    const p = [...data.portfolio]; p[idx] = { ...p[idx], description: e.target.value }; update('portfolio', p);
                  }} placeholder="Description" className="px-4 py-2 border rounded-lg" />
                  <input type="number" value={item.likes} onChange={(e) => {
                    const p = [...data.portfolio]; p[idx] = { ...p[idx], likes: parseInt(e.target.value) || 0 }; update('portfolio', p);
                  }} placeholder="Likes" className="px-4 py-2 border rounded-lg" />
                </div>
                <div className="flex justify-end">
                  <button onClick={() => update('portfolio', data.portfolio.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-2">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => update('portfolio', [...data.portfolio, { url: '', category: '', artist: '', likes: 0, description: '' }])}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]">
              <Plus className="w-4 h-4" /> Ajouter une photo
            </button>
          </div>
        )}

        {activeSection === 'flash' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Flash disponibles</h3>
            {data.flashDesigns.map((flash, idx) => (
              <div key={flash.id} className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{flash.title || `Flash ${idx + 1}`}</span>
                  <button onClick={() => update('flashDesigns', data.flashDesigns.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input value={flash.title} onChange={(e) => {
                    const f = [...data.flashDesigns]; f[idx] = { ...f[idx], title: e.target.value }; update('flashDesigns', f);
                  }} placeholder="Titre" className="px-4 py-2 border rounded-lg" />
                </div>
                <ImageUploadField
                  label="Image du flash"
                  value={flash.imageUrl}
                  onChange={(v) => {
                    const f = [...data.flashDesigns]; f[idx] = { ...f[idx], imageUrl: v }; update('flashDesigns', f);
                  }}
                  previewSize="md"
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input type="number" value={flash.price} onChange={(e) => {
                    const f = [...data.flashDesigns]; f[idx] = { ...f[idx], price: parseInt(e.target.value) || 0 }; update('flashDesigns', f);
                  }} placeholder="Prix (€)" className="px-4 py-2 border rounded-lg" />
                  <input type="number" value={flash.duration} onChange={(e) => {
                    const f = [...data.flashDesigns]; f[idx] = { ...f[idx], duration: parseInt(e.target.value) || 0 }; update('flashDesigns', f);
                  }} placeholder="Durée (min)" className="px-4 py-2 border rounded-lg" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input value={flash.style} onChange={(e) => {
                    const f = [...data.flashDesigns]; f[idx] = { ...f[idx], style: e.target.value }; update('flashDesigns', f);
                  }} placeholder="Style" className="px-4 py-2 border rounded-lg" />
                  <input value={flash.size} onChange={(e) => {
                    const f = [...data.flashDesigns]; f[idx] = { ...f[idx], size: e.target.value }; update('flashDesigns', f);
                  }} placeholder="Taille" className="px-4 py-2 border rounded-lg" />
                </div>
                <textarea value={flash.description} onChange={(e) => {
                  const f = [...data.flashDesigns]; f[idx] = { ...f[idx], description: e.target.value }; update('flashDesigns', f);
                }} placeholder="Description" rows={2} className="w-full px-4 py-2 border rounded-lg resize-none" />
                <input value={flash.placement.join(', ')} onChange={(e) => {
                  const f = [...data.flashDesigns]; f[idx] = { ...f[idx], placement: e.target.value.split(',').map(p => p.trim()).filter(Boolean) }; update('flashDesigns', f);
                }} placeholder="Emplacements (séparés par des virgules)" className="w-full px-4 py-2 border rounded-lg" />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={flash.available} onChange={(e) => {
                    const f = [...data.flashDesigns]; f[idx] = { ...f[idx], available: e.target.checked }; update('flashDesigns', f);
                  }} />
                  <span className="text-sm font-medium">Disponible</span>
                </label>
              </div>
            ))}
            <button onClick={() => update('flashDesigns', [...data.flashDesigns, { id: `f${Date.now()}`, title: '', imageUrl: '', price: 0, duration: 60, placement: [], size: '', available: true, description: '', style: '' }])}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]">
              <Plus className="w-4 h-4" /> Ajouter un flash
            </button>
          </div>
        )}

        {activeSection === 'testimonials' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Avis clients</h3>
            <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] space-y-3">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">Lien fiche Google (avis / Maps)</label>
              <input
                type="url"
                inputMode="url"
                autoComplete="url"
                value={data.googleBusinessUrl ?? ''}
                onChange={(e) => update('googleBusinessUrl', e.target.value)}
                placeholder="https://g.page/… ou lien Maps"
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Collez l’URL de votre fiche Google (Maps / avis). Sinon, la vitrine propose un lien « Google Maps » vers une recherche basée sur l’adresse du studio.
              </p>
            </div>
            {data.testimonials.map((t, idx) => (
              <div key={idx} className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{t.name || `Avis ${idx + 1}`}</span>
                  <button onClick={() => update('testimonials', data.testimonials.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input value={t.name} onChange={(e) => {
                    const x = [...data.testimonials]; x[idx] = { ...x[idx], name: e.target.value }; update('testimonials', x);
                  }} placeholder="Nom" className="px-4 py-2 border rounded-lg" />
                  <input type="number" min={1} max={5} value={t.rating} onChange={(e) => {
                    const x = [...data.testimonials]; x[idx] = { ...x[idx], rating: parseInt(e.target.value) || 5 }; update('testimonials', x);
                  }} placeholder="Note (1-5)" className="px-4 py-2 border rounded-lg" />
                </div>
                <input value={t.date} onChange={(e) => {
                  const x = [...data.testimonials]; x[idx] = { ...x[idx], date: e.target.value }; update('testimonials', x);
                }} placeholder="Date (ex: Il y a 2 jours)" className="w-full px-4 py-2 border rounded-lg" />
                <textarea value={t.text} onChange={(e) => {
                  const x = [...data.testimonials]; x[idx] = { ...x[idx], text: e.target.value }; update('testimonials', x);
                }} placeholder="Témoignage" rows={3} className="w-full px-4 py-2 border rounded-lg resize-none" />
                <ImageUploadField
                  label="Photo du client"
                  value={t.avatar}
                  onChange={(v) => {
                    const x = [...data.testimonials]; x[idx] = { ...x[idx], avatar: v }; update('testimonials', x);
                  }}
                  shape="round"
                  previewSize="sm"
                />
                <div>
                  <label className="block text-sm font-semibold mb-2">Tatouage réalisé</label>
                  <input value={t.tattoo} onChange={(e) => {
                    const x = [...data.testimonials]; x[idx] = { ...x[idx], tattoo: e.target.value }; update('testimonials', x);
                  }} placeholder="Ex: Fleurs sur avant-bras" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={t.verified} onChange={(e) => {
                    const x = [...data.testimonials]; x[idx] = { ...x[idx], verified: e.target.checked }; update('testimonials', x);
                  }} />
                  <span className="text-sm font-medium">Avis vérifié</span>
                </label>
              </div>
            ))}
            <button onClick={() => update('testimonials', [...data.testimonials, { name: '', rating: 5, date: '', text: '', avatar: '', tattoo: '', verified: true }])}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]">
              <Plus className="w-4 h-4" /> Ajouter un avis
            </button>
          </div>
        )}

        {activeSection === 'faq' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Questions fréquentes</h3>
            {data.faqs.map((faq, idx) => (
              <div key={idx} className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-[var(--text-secondary)]">FAQ {idx + 1}</span>
                  <button onClick={() => update('faqs', data.faqs.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input value={faq.q} onChange={(e) => {
                  const f = [...data.faqs]; f[idx] = { ...f[idx], q: e.target.value }; update('faqs', f);
                }} placeholder="Question" className="w-full px-4 py-2 border rounded-lg" />
                <textarea value={faq.a} onChange={(e) => {
                  const f = [...data.faqs]; f[idx] = { ...f[idx], a: e.target.value }; update('faqs', f);
                }} placeholder="Réponse" rows={3} className="w-full px-4 py-2 border rounded-lg resize-none" />
              </div>
            ))}
            <button onClick={() => update('faqs', [...data.faqs, { q: '', a: '' }])}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]">
              <Plus className="w-4 h-4" /> Ajouter une question
            </button>
          </div>
        )}

        {activeSection === 'why' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Pourquoi nous choisir</h3>
            {data.whyChooseUs.map((item, idx) => (
              <div key={idx} className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{item.title || `Point ${idx + 1}`}</span>
                  <button onClick={() => update('whyChooseUs', data.whyChooseUs.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input value={item.title} onChange={(e) => {
                    const w = [...data.whyChooseUs]; w[idx] = { ...w[idx], title: e.target.value }; update('whyChooseUs', w);
                  }} placeholder="Titre" className="px-4 py-2 border rounded-lg" />
                  <select value={item.icon} onChange={(e) => {
                    const w = [...data.whyChooseUs]; w[idx] = { ...w[idx], icon: e.target.value as VitrineWhyChooseUs['icon'] }; update('whyChooseUs', w);
                  }} className="px-4 py-2 border rounded-lg">
                    {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <textarea value={item.description} onChange={(e) => {
                  const w = [...data.whyChooseUs]; w[idx] = { ...w[idx], description: e.target.value }; update('whyChooseUs', w);
                }} placeholder="Description" rows={2} className="w-full px-4 py-2 border rounded-lg resize-none" />
              </div>
            ))}
            <button onClick={() => update('whyChooseUs', [...data.whyChooseUs, { icon: 'award', title: '', description: '' }])}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]">
              <Plus className="w-4 h-4" /> Ajouter un point
            </button>
          </div>
        )}

        {activeSection === 'hours' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Horaires d'ouverture</h3>
            {DAYS.map(day => {
              const h = data.openingHours[day] || { open: '10:00', close: '19:00', closed: false };
              return (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                  <span className="font-semibold w-28">{DAY_LABELS[day]}</span>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={h.closed} onChange={(e) => {
                      const oh = { ...data.openingHours }; oh[day] = { ...h, closed: e.target.checked }; update('openingHours', oh);
                    }} />
                    <span className="text-sm">Fermé</span>
                  </label>
                  {!h.closed && (
                    <div className="flex gap-2 items-center">
                      <input type="time" value={h.open} onChange={(e) => {
                        const oh = { ...data.openingHours }; oh[day] = { ...h, open: e.target.value }; update('openingHours', oh);
                      }} className="px-4 py-2 border rounded-lg" />
                      <span className="text-[var(--text-tertiary)]">-</span>
                      <input type="time" value={h.close} onChange={(e) => {
                        const oh = { ...data.openingHours }; oh[day] = { ...h, close: e.target.value }; update('openingHours', oh);
                      }} className="px-4 py-2 border rounded-lg" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <a href={`/studio/${slug}`} target="_blank" rel="noopener noreferrer"
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${manualSaving || saving ? 'bg-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed pointer-events-none' : 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'}`}
        title={manualSaving || saving ? 'Attendez la fin de l\'enregistrement' : 'Ouvrir la page vitrine dans un nouvel onglet'}>
        <ExternalLink className="w-5 h-5" />
        Prévisualiser la vitrine
      </a>
    </div>
  );
};
