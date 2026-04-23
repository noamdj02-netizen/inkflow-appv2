import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Store,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Plus,
  Trash2,
  Save,
  Check,
  Phone,
  BarChart3,
  Briefcase,
  Users,
  Images,
  Zap,
  MessageSquare,
  HelpCircle,
  Sparkles,
  Clock,
  Link2,
  Link2Off,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { VitrineLinkButton } from '../dashboard/VitrineLinkButton';
import { getVitrineShareUrl } from '../../lib/urls';
import { ThemeSelector } from './ThemeSelector';
import { ImageUploadField } from '../ui/ImageUploadField';
import { useToast } from '../../contexts/ToastContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import type { VitrineData, VitrineService, VitrineArtist, VitrineTestimonial, VitrinePortfolioItem, VitrineFlashDesign, VitrineFaq, VitrineWhyChooseUs } from '../../types/vitrine';
import { getVitrineData, getVitrineSlug, getVitrineDataAsync, saveVitrineDataAsync } from '../../lib/vitrineStorage';
import { isGoogleBusinessOAuthUiEnabled } from '../../lib/googleBusinessOAuth';

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
  /** Google Business OAuth */
  googleBusinessConnected?: boolean;
  googleBusinessLocationName?: string | null;
  googleBusinessNeedsLocationSelection?: boolean;
  googleBusinessLocations?: { name: string; title: string; accountName: string }[];
  loadingGoogleBusinessLocations?: boolean;
  /** Explication si la liste des fiches est vide ou erreur API (rempli par le parent). */
  googleBusinessLocationsHint?: string | null;
  onConnectGoogleBusiness?: () => Promise<void>;
  onDisconnectGoogleBusiness?: () => Promise<void>;
  onSelectGoogleBusinessLocation?: (locationName: string) => Promise<void>;
  /** `force=true` contourne le cache Supabase (bouton Rafraîchir). */
  onLoadGoogleBusinessLocations?: (force?: boolean) => Promise<void>;
}

export const VitrineSettings: React.FC<VitrineSettingsProps> = ({
  studioName, userEmail, studioSlug: studioSlugFromDb, studioId,
  googleBusinessConnected = false,
  googleBusinessLocationName = null,
  googleBusinessNeedsLocationSelection = false,
  googleBusinessLocations = [],
  loadingGoogleBusinessLocations = false,
  googleBusinessLocationsHint = null,
  onConnectGoogleBusiness,
  onDisconnectGoogleBusiness,
  onSelectGoogleBusinessLocation,
  onLoadGoogleBusinessLocations,
}) => {
  const toast = useToast();
  const slug = (studioSlugFromDb != null && studioSlugFromDb !== '') ? studioSlugFromDb : getVitrineSlug(studioName);
  const [data, setData] = useState<VitrineData>(() => getVitrineData(slug));
  const [activeSection, setActiveSection] = useState<string>('identity');
  const [manualSaving, setManualSaving] = useState(false);
  const [connectingBusiness, setConnectingBusiness] = useState(false);
  const [disconnectingBusiness, setDisconnectingBusiness] = useState(false);
  const initialLoadRef = useRef(true);
  const showGoogleBusinessOAuth = isGoogleBusinessOAuthUiEnabled();

  // Charge les fiches dispo seulement quand le sélecteur de localisation est visible
  useEffect(() => {
    if (!showGoogleBusinessOAuth) return;
    if (
      activeSection === 'testimonials' &&
      googleBusinessNeedsLocationSelection &&
      googleBusinessLocations.length === 0 &&
      onLoadGoogleBusinessLocations
    ) {
      onLoadGoogleBusinessLocations(false).catch(() => {});
    }
  }, [
    activeSection,
    googleBusinessNeedsLocationSelection,
    googleBusinessLocations.length,
    onLoadGoogleBusinessLocations,
    showGoogleBusinessOAuth,
  ]);
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

  const sections = useMemo(
    (): { id: string; label: string; icon: LucideIcon }[] => [
      { id: 'identity', label: 'Identité & Présentation', icon: Store },
      { id: 'contact', label: 'Contact & Réseaux', icon: Phone },
      { id: 'stats', label: 'Statistiques', icon: BarChart3 },
      { id: 'services', label: 'Services', icon: Briefcase },
      { id: 'artists', label: 'Artistes', icon: Users },
      { id: 'portfolio', label: 'Portfolio', icon: Images },
      { id: 'flash', label: 'Flash', icon: Zap },
      { id: 'testimonials', label: 'Avis clients', icon: MessageSquare },
      { id: 'faq', label: 'FAQ', icon: HelpCircle },
      { id: 'why', label: 'Pourquoi nous', icon: Sparkles },
      { id: 'hours', label: 'Horaires', icon: Clock },
    ],
    []
  );

  const sectionIndex = sections.findIndex((s) => s.id === activeSection);
  const safeSectionIndex = sectionIndex >= 0 ? sectionIndex : 0;
  const tabBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const el = tabBtnRefs.current[activeSection];
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeSection]);

  const publicUrl = slug ? getVitrineShareUrl(slug) : '';
  const slugConflict = (studioSlugFromDb != null && studioSlugFromDb !== '') &&
    getVitrineSlug(studioName) !== studioSlugFromDb;

  return (
    <div className="space-y-6 max-w-4xl w-full overflow-hidden">
      <VitrineLinkButton studioName={studioName} userEmail={userEmail} studioSlug={studioSlugFromDb} />
      {slugConflict && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 rounded-lg border border-amber-200/80 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2">
          Ce nom de studio était déjà pris — l'URL dans le bloc « Lien de votre vitrine » est votre lien unique.
        </p>
      )}
      {studioId && (
        <ThemeSelector studioId={studioId} userEmail={userEmail} publicVitrineUrl={publicUrl || undefined} />
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Personnaliser votre page vitrine
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl leading-snug">
            {sections.length} sections au total — la sauvegarde est automatique. Utilisez le bouton pour forcer une synchro immédiate.
          </p>
        </div>
        <button
          type="button"
          onClick={handleManualSave}
          disabled={saving || manualSaving}
          className="flex items-center justify-center gap-2 min-h-[44px] px-5 sm:px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 w-full sm:w-auto shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.98] motion-reduce:active:scale-100"
        >
          {manualSaving || saving ? (
            'Enregistrement...'
          ) : saved ? (
            <>
              <Check className="w-5 h-5 shrink-0" aria-hidden />
              Enregistré
            </>
          ) : (
            <>
              <Save className="w-5 h-5 shrink-0" aria-hidden />
              Enregistrer
            </>
          )}
        </button>
      </div>

      <div className="relative border-b border-zinc-200/80 dark:border-zinc-800 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 sm:hidden">
          Sections ({sections.length})
        </p>
        <div
          className="flex gap-2 overflow-x-auto flex-nowrap scrollbar-hide snap-x snap-mandatory scroll-px-4 sm:scroll-px-0 pb-1 -mb-1 touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
          role="tablist"
          aria-label="Blocs de la vitrine"
        >
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              ref={(el) => {
                tabBtnRefs.current[id] = el;
              }}
              type="button"
              role="tab"
              id={`vitrine-tab-${id}`}
              aria-selected={activeSection === id}
              aria-controls={`vitrine-panel-${id}`}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium whitespace-nowrap shrink-0 snap-start transition-colors border active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] ${
                activeSection === id
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm dark:bg-white dark:text-zinc-900 dark:border-white'
                  : 'bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/80'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0 opacity-90" strokeWidth={activeSection === id ? 2.25 : 1.75} aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
          Section {safeSectionIndex + 1} sur {sections.length}
          <span className="text-zinc-400 dark:text-zinc-500"> · </span>
          <span className="font-medium text-zinc-600 dark:text-zinc-300">{sections[safeSectionIndex]?.label}</span>
        </p>
      </div>

      <div
        className="bg-[var(--bg-card)] rounded-2xl p-6 md:p-8 border border-[var(--border)]"
        role="tabpanel"
        id={`vitrine-panel-${activeSection}`}
        aria-labelledby={`vitrine-tab-${activeSection}`}
      >
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

            {/* Avis Google : OAuth Business Profile (optionnel) ou Place ID + témoignages */}
            <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <label className="block text-sm font-semibold text-[var(--text-primary)]">Avis Google</label>
              </div>

              {!showGoogleBusinessOAuth ? (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Parcours recommandé tant que le projet Google Cloud n’est pas approuvé pour l’API Business Profile : liez votre fiche via l’URL Maps ou le{' '}
                    <strong className="text-zinc-700 dark:text-zinc-300">Place ID</strong> dans{' '}
                    <strong className="text-zinc-700 dark:text-zinc-300">Paramètres → Établissement</strong>
                    {' '}(avis publics via Google Places), puis complétez avec les témoignages manuels ci-dessous.
                  </p>
                  <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 px-3 py-2.5">
                    <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden />
                    <div className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-1.5">
                      <p>
                        La connexion « compte Google Business » (tous les avis, API Account Management) est désactivée côté app. Pour la réactiver après validation Google : variable{' '}
                        <code className="font-mono text-[10px] text-zinc-800 dark:text-zinc-200">VITE_GOOGLE_BUSINESS_OAUTH_ENABLED=true</code>
                        {' '}sur Vercel ou dans <code className="font-mono text-[10px]">.env.local</code>.
                      </p>
                    </div>
                  </div>
                  {googleBusinessConnected && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Compte encore lié côté serveur</p>
                        <p className="text-[11px] text-amber-500/90 dark:text-amber-400/90 mt-0.5">
                          La synchro OAuth n’est pas utilisée avec la config actuelle. Déconnectez pour nettoyer, ou activez l’OAuth comme ci-dessus.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!onDisconnectGoogleBusiness) return;
                          setDisconnectingBusiness(true);
                          try { await onDisconnectGoogleBusiness(); toast.success('Compte Google déconnecté'); }
                          catch { toast.error('Impossible de déconnecter'); }
                          finally { setDisconnectingBusiness(false); }
                        }}
                        disabled={disconnectingBusiness || !onDisconnectGoogleBusiness}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 border border-red-900/40 hover:bg-red-950/30 disabled:opacity-50 transition-all min-h-[36px]"
                      >
                        {disconnectingBusiness ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2Off className="w-3.5 h-3.5" />}
                        Déconnecter
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Connectez votre compte Google Business pour afficher vos avis Google sur la vitrine (API Google, soumise à quotas et validation Cloud).
                  </p>
                  {googleBusinessConnected ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[var(--text-primary)]">Google Business</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                Connecté
                              </span>
                            </div>
                            {googleBusinessLocationName ? (
                              <p className="text-[11px] text-zinc-400 truncate mt-0.5" title={googleBusinessLocationName}>
                                {googleBusinessLocationName.split('/').slice(-1)[0] || googleBusinessLocationName}
                              </p>
                            ) : (
                              <p className="text-[11px] text-amber-400 mt-0.5">Choisissez une fiche ci-dessous</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!onDisconnectGoogleBusiness) return;
                            setDisconnectingBusiness(true);
                            try { await onDisconnectGoogleBusiness(); toast.success('Compte Google déconnecté'); }
                            catch { toast.error('Impossible de déconnecter'); }
                            finally { setDisconnectingBusiness(false); }
                          }}
                          disabled={disconnectingBusiness || !onDisconnectGoogleBusiness}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 border border-red-900/40 hover:bg-red-950/30 disabled:opacity-50 transition-all min-h-[36px]"
                        >
                          {disconnectingBusiness ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2Off className="w-3.5 h-3.5" />}
                          Déconnecter
                        </button>
                      </div>

                      {googleBusinessNeedsLocationSelection && (
                        <div>
                          <p className="text-xs text-zinc-400 mb-2">Quelle fiche correspond à votre vitrine ?</p>
                          {loadingGoogleBusinessLocations ? (
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement…
                            </div>
                          ) : googleBusinessLocations.length === 0 ? (
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 space-y-3">
                              <p className="text-sm font-medium text-[var(--text-primary)]">Aucune fiche trouvée</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {googleBusinessLocationsHint ||
                                  'Si votre établissement est bien sur Google Maps, vérifiez que vous avez connecté le bon compte Google, ou renseignez un Place ID dans Paramètres > Établissement.'}
                              </p>
                              {onLoadGoogleBusinessLocations && (
                                <button
                                  type="button"
                                  onClick={() => void onLoadGoogleBusinessLocations(true)}
                                  disabled={loadingGoogleBusinessLocations}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:bg-zinc-800/50 disabled:opacity-50 transition-all active:scale-[0.98]"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                  Rafraîchir la liste
                                </button>
                              )}
                            </div>
                          ) : (
                            <ul className="rounded-xl border border-[var(--border)] divide-y divide-zinc-800 overflow-hidden">
                              {googleBusinessLocations.map((loc) => (
                                <li key={loc.name}>
                                  <button
                                    type="button"
                                    onClick={() => onSelectGoogleBusinessLocation?.(loc.name)}
                                    className="w-full text-left px-4 py-3 hover:bg-zinc-800/60 transition-all active:scale-[0.99]"
                                  >
                                    <p className="text-sm font-medium text-[var(--text-primary)]">{loc.title}</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">{loc.accountName}</p>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!onConnectGoogleBusiness) return;
                        setConnectingBusiness(true);
                        try { await onConnectGoogleBusiness(); }
                        catch (err) { toast.error((err as Error).message || 'Impossible de lancer la connexion'); setConnectingBusiness(false); }
                      }}
                      disabled={connectingBusiness || !onConnectGoogleBusiness}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:bg-zinc-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                      {connectingBusiness
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Connexion…</>
                        : <><Link2 className="w-4 h-4" /> Connecter Google Business</>}
                    </button>
                  )}
                </>
              )}
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

        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--text-tertiary)] order-2 sm:order-1 text-center sm:text-left">
            <span className="font-medium text-[var(--text-primary)]">
              {safeSectionIndex + 1} / {sections.length}
            </span>
            {' · '}
            {sections[safeSectionIndex]?.label}
          </p>
          <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={safeSectionIndex <= 0}
              onClick={() => setActiveSection(sections[safeSectionIndex - 1].id)}
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-zinc-50 dark:hover:bg-zinc-800/60 disabled:opacity-35 disabled:cursor-not-allowed transition-colors active:scale-[0.98] motion-reduce:active:scale-100"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden />
              Précédent
            </button>
            <button
              type="button"
              disabled={safeSectionIndex >= sections.length - 1}
              onClick={() => setActiveSection(sections[safeSectionIndex + 1].id)}
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed transition-colors active:scale-[0.98] motion-reduce:active:scale-100"
            >
              Suivant
              <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
            </button>
          </div>
        </div>
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
