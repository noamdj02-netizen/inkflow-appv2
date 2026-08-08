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
import { useLanguage } from '../../contexts/LanguageContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import type { VitrineData, VitrineService, VitrineWhyChooseUs } from '../../types/vitrine';
import {
  getVitrineData,
  getVitrineSlug,
  getVitrineDataAsync,
  saveVitrineDataAsync,
} from '../../lib/vitrineStorage';
import { isGoogleBusinessOAuthUiEnabled } from '../../lib/googleBusinessOAuth';

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

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
  studioName,
  userEmail,
  studioSlug: studioSlugFromDb,
  studioId,
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
  const { t, lang } = useLanguage();
  const slug =
    studioSlugFromDb != null && studioSlugFromDb !== ''
      ? studioSlugFromDb
      : getVitrineSlug(studioName);
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
      } catch {}
    }
  };

  const { saving, saved } = useAutoSave(data, silentAutoSave, { debounceMs: 800 });

  /** JSON vitrine parfois sans tableau (legacy / merge partiel) — évite .map qui crash. */
  const testimonials = useMemo(
    () => (Array.isArray(data.testimonials) ? data.testimonials : []),
    [data.testimonials]
  );

  const iconOptions = useMemo(
    () =>
      (['sparkles', 'award', 'star', 'camera', 'shield', 'heart', 'users'] as const).map(
        (value) => ({
          value,
          label: t(`dashboard.vitrine.icon.${value}`),
        })
      ),
    [t, lang]
  );

  const dayLabels = useMemo(
    (): Record<string, string> =>
      Object.fromEntries(DAYS.map((day) => [day, t(`dashboard.vitrine.day.${day}`)])),
    [t, lang]
  );

  const update = <K extends keyof VitrineData>(key: K, value: VitrineData[K]) => {
    dirtyRef.current = true;
    setData((prev) => ({ ...prev, [key]: value }));
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
        toast.success(t('dashboard.vitrine.page.saveSuccess'));
      } else {
        toast.success(t('dashboard.vitrine.page.saveSuccess'));
      }
    } catch {
      toast.warning(t('dashboard.vitrine.page.saveLocalWarning'));
    } finally {
      setManualSaving(false);
    }
  };

  const sections = useMemo(
    (): { id: string; label: string; icon: LucideIcon }[] => [
      { id: 'identity', label: t('dashboard.vitrine.section.identity'), icon: Store },
      { id: 'contact', label: t('dashboard.vitrine.section.contact'), icon: Phone },
      { id: 'stats', label: t('dashboard.vitrine.section.stats'), icon: BarChart3 },
      { id: 'services', label: t('dashboard.vitrine.section.services'), icon: Briefcase },
      { id: 'artists', label: t('dashboard.vitrine.section.artists'), icon: Users },
      { id: 'portfolio', label: t('dashboard.vitrine.section.portfolio'), icon: Images },
      { id: 'flash', label: t('dashboard.vitrine.section.flash'), icon: Zap },
      {
        id: 'testimonials',
        label: t('dashboard.vitrine.section.testimonials'),
        icon: MessageSquare,
      },
      { id: 'faq', label: t('dashboard.vitrine.section.faq'), icon: HelpCircle },
      { id: 'why', label: t('dashboard.vitrine.section.why'), icon: Sparkles },
      { id: 'hours', label: t('dashboard.vitrine.section.hours'), icon: Clock },
    ],
    [t, lang]
  );

  const sectionIndex = sections.findIndex((s) => s.id === activeSection);
  const safeSectionIndex = sectionIndex >= 0 ? sectionIndex : 0;
  const tabBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const el = tabBtnRefs.current[activeSection];
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeSection]);

  const publicUrl = slug ? getVitrineShareUrl(slug) : '';
  const slugConflict =
    studioSlugFromDb != null &&
    studioSlugFromDb !== '' &&
    getVitrineSlug(studioName) !== studioSlugFromDb;

  return (
    <div className="space-y-6 max-w-4xl w-full overflow-hidden">
      <VitrineLinkButton
        studioName={studioName}
        userEmail={userEmail}
        studioSlug={studioSlugFromDb}
      />
      {slugConflict && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 rounded-lg border border-amber-200/80 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2">
          {t('dashboard.vitrine.page.slugConflict')}
        </p>
      )}
      {studioId && (
        <ThemeSelector
          studioId={studioId}
          userEmail={userEmail}
          publicVitrineUrl={publicUrl || undefined}
        />
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="type-heading-sm sm:text-xl">{t('dashboard.vitrine.page.title')}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl leading-snug">
            {t('dashboard.vitrine.page.desc').replace('{n}', String(sections.length))}
          </p>
        </div>
        <button
          type="button"
          onClick={handleManualSave}
          disabled={saving || manualSaving}
          className="flex items-center justify-center gap-2 min-h-[44px] px-5 sm:px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 w-full sm:w-auto shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.98] motion-reduce:active:scale-100"
        >
          {manualSaving || saving ? (
            t('dashboard.vitrine.page.saving')
          ) : saved ? (
            <>
              <Check className="w-5 h-5 shrink-0" aria-hidden />
              {t('dashboard.vitrine.page.saved')}
            </>
          ) : (
            <>
              <Save className="w-5 h-5 shrink-0" aria-hidden />
              {t('dashboard.vitrine.page.save')}
            </>
          )}
        </button>
      </div>

      <div className="relative border-b border-zinc-200/80 dark:border-zinc-800 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 sm:hidden">
          {t('dashboard.vitrine.page.sectionsMobile').replace('{n}', String(sections.length))}
        </p>
        <div
          className="flex gap-2 overflow-x-auto flex-nowrap scrollbar-hide snap-x snap-mandatory scroll-px-4 sm:scroll-px-0 pb-1 -mb-1 touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
          role="tablist"
          aria-label={t('dashboard.vitrine.page.sectionsTablist')}
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
              <Icon
                className="w-4 h-4 shrink-0 opacity-90"
                strokeWidth={activeSection === id ? 2.25 : 1.75}
                aria-hidden
              />
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
          {t('dashboard.vitrine.page.sectionOf')
            .replace('{current}', String(safeSectionIndex + 1))
            .replace('{total}', String(sections.length))}
          <span className="text-zinc-400 dark:text-zinc-500"> · </span>
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            {sections[safeSectionIndex]?.label}
          </span>
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
            <h3 className="font-bold text-lg">{t('dashboard.vitrine.identity.title')}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('dashboard.vitrine.identity.studioName')}
                </label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('dashboard.vitrine.identity.tagline')}
                </label>
                <input
                  type="text"
                  value={data.tagline}
                  onChange={(e) => update('tagline', e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder={t('dashboard.vitrine.identity.taglinePh')}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                {t('dashboard.vitrine.common.description')}
              </label>
              <textarea
                value={data.description}
                onChange={(e) => update('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
            </div>
            <div className="space-y-6">
              <ImageUploadField
                label={t('dashboard.vitrine.identity.logo')}
                value={data.avatar}
                onChange={(v) => update('avatar', v)}
                shape="round"
                previewSize="md"
              />
              <ImageUploadField
                label={t('dashboard.vitrine.identity.cover')}
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
            <h3 className="font-bold text-lg">{t('dashboard.vitrine.contact.title')}</h3>
            <div>
              <label className="block text-sm font-semibold mb-2">
                {t('dashboard.vitrine.common.address')}
              </label>
              <input
                type="text"
                value={data.address}
                onChange={(e) => update('address', e.target.value)}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('dashboard.vitrine.common.phone')}
                </label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('dashboard.vitrine.common.email')}
                </label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('dashboard.vitrine.contact.instagram')}
                </label>
                <input
                  type="text"
                  value={data.instagram}
                  onChange={(e) => update('instagram', e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder={t('dashboard.vitrine.contact.instagramPh')}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('dashboard.vitrine.contact.facebook')}
                </label>
                <input
                  type="text"
                  value={data.facebook}
                  onChange={(e) => update('facebook', e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('dashboard.vitrine.contact.website')}
                </label>
                <input
                  type="text"
                  value={data.website}
                  onChange={(e) => update('website', e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder={t('dashboard.vitrine.contact.websitePh')}
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'stats' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{t('dashboard.vitrine.stats.title')}</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showStatsBanner !== false}
                  onChange={(e) => update('showStatsBanner', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium">
                  {t('dashboard.vitrine.stats.showBanner')}
                </span>
              </label>
            </div>
            <p className="text-sm text-[var(--text-tertiary)]">
              {t('dashboard.vitrine.stats.hideHint')}
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('dashboard.vitrine.stats.rating')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={data.rating}
                  onChange={(e) => update('rating', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('dashboard.vitrine.stats.reviewCount')}
                </label>
                <input
                  type="number"
                  value={data.reviewCount}
                  onChange={(e) => update('reviewCount', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('dashboard.vitrine.stats.years')}
                </label>
                <input
                  type="number"
                  value={data.yearsExperience}
                  onChange={(e) => update('yearsExperience', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('dashboard.vitrine.stats.tattoos')}
                </label>
                <input
                  type="number"
                  value={data.totalTattoos}
                  onChange={(e) => update('totalTattoos', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('dashboard.vitrine.stats.satisfaction')}
                </label>
                <input
                  type="number"
                  value={data.satisfactionRate}
                  onChange={(e) => update('satisfactionRate', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('dashboard.vitrine.stats.repeat')}
                </label>
                <input
                  type="number"
                  value={data.repeatClients}
                  onChange={(e) => update('repeatClients', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'services' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">
                  {t('dashboard.vitrine.services.toggleTitle')}
                </p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  {t('dashboard.vitrine.services.toggleDesc')}
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={data.showServicesSection !== false}
                  onChange={(e) => update('showServicesSection', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {t('dashboard.vitrine.common.showSection')}
                </span>
              </label>
            </div>
            <h3 className="font-bold text-lg">{t('dashboard.vitrine.services.contentTitle')}</h3>
            {data.services.map((service, idx) => (
              <div
                key={idx}
                className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    {t('dashboard.vitrine.common.service').replace('{n}', String(idx + 1))}
                  </span>
                  <button
                    onClick={() =>
                      update(
                        'services',
                        data.services.filter((_, i) => i !== idx)
                      )
                    }
                    className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    value={service.name}
                    onChange={(e) => {
                      const s = [...data.services];
                      s[idx] = { ...s[idx], name: e.target.value };
                      update('services', s);
                    }}
                    placeholder={t('dashboard.vitrine.common.name')}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    value={service.price}
                    onChange={(e) => {
                      const s = [...data.services];
                      s[idx] = { ...s[idx], price: e.target.value };
                      update('services', s);
                    }}
                    placeholder={t('dashboard.vitrine.services.pricePh')}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <input
                  value={service.duration}
                  onChange={(e) => {
                    const s = [...data.services];
                    s[idx] = { ...s[idx], duration: e.target.value };
                    update('services', s);
                  }}
                  placeholder={t('dashboard.vitrine.services.durationPh')}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <textarea
                  value={service.description}
                  onChange={(e) => {
                    const s = [...data.services];
                    s[idx] = { ...s[idx], description: e.target.value };
                    update('services', s);
                  }}
                  placeholder={t('dashboard.vitrine.common.description')}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg resize-none"
                />
                <select
                  value={service.icon}
                  onChange={(e) => {
                    const s = [...data.services];
                    s[idx] = { ...s[idx], icon: e.target.value as VitrineService['icon'] };
                    update('services', s);
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  {iconOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <input
                  value={service.features.join(', ')}
                  onChange={(e) => {
                    const s = [...data.services];
                    s[idx] = {
                      ...s[idx],
                      features: e.target.value
                        .split(',')
                        .map((f) => f.trim())
                        .filter(Boolean),
                    };
                    update('services', s);
                  }}
                  placeholder={t('dashboard.vitrine.services.featuresPh')}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            ))}
            <button
              onClick={() =>
                update('services', [
                  ...data.services,
                  {
                    name: '',
                    price: '',
                    duration: '',
                    description: '',
                    icon: 'sparkles',
                    features: [],
                  },
                ])
              }
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]"
            >
              <Plus className="w-4 h-4" /> {t('dashboard.vitrine.common.addService')}
            </button>
          </div>
        )}

        {activeSection === 'artists' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">{t('dashboard.vitrine.artists.title')}</h3>
            {data.artists.map((artist, idx) => (
              <div
                key={idx}
                className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    {t('dashboard.vitrine.common.artist').replace('{n}', String(idx + 1))}
                  </span>
                  <button
                    onClick={() =>
                      update(
                        'artists',
                        data.artists.filter((_, i) => i !== idx)
                      )
                    }
                    className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    value={artist.name}
                    onChange={(e) => {
                      const a = [...data.artists];
                      a[idx] = { ...a[idx], name: e.target.value };
                      update('artists', a);
                    }}
                    placeholder={t('dashboard.vitrine.common.name')}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    value={artist.role}
                    onChange={(e) => {
                      const a = [...data.artists];
                      a[idx] = { ...a[idx], role: e.target.value };
                      update('artists', a);
                    }}
                    placeholder={t('dashboard.vitrine.common.role')}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <ImageUploadField
                  label={t('dashboard.vitrine.artists.photo')}
                  value={artist.avatar}
                  onChange={(v) => {
                    const a = [...data.artists];
                    a[idx] = { ...a[idx], avatar: v };
                    update('artists', a);
                  }}
                  shape="round"
                  previewSize="sm"
                />
                <input
                  value={artist.experience}
                  onChange={(e) => {
                    const a = [...data.artists];
                    a[idx] = { ...a[idx], experience: e.target.value };
                    update('artists', a);
                  }}
                  placeholder={t('dashboard.vitrine.artists.experiencePh')}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <textarea
                  value={artist.bio}
                  onChange={(e) => {
                    const a = [...data.artists];
                    a[idx] = { ...a[idx], bio: e.target.value };
                    update('artists', a);
                  }}
                  placeholder={t('dashboard.vitrine.artists.bioPh')}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg resize-none"
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    value={artist.instagram}
                    onChange={(e) => {
                      const a = [...data.artists];
                      a[idx] = { ...a[idx], instagram: e.target.value };
                      update('artists', a);
                    }}
                    placeholder={t('dashboard.vitrine.contact.instagram')}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    value={artist.portfolio}
                    onChange={(e) => {
                      const a = [...data.artists];
                      a[idx] = { ...a[idx], portfolio: parseInt(e.target.value) || 0 };
                      update('artists', a);
                    }}
                    placeholder={t('dashboard.vitrine.artists.portfolioCountPh')}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <input
                  value={artist.specialties.join(', ')}
                  onChange={(e) => {
                    const a = [...data.artists];
                    a[idx] = {
                      ...a[idx],
                      specialties: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    };
                    update('artists', a);
                  }}
                  placeholder={t('dashboard.vitrine.artists.specialtiesPh')}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            ))}
            <button
              onClick={() =>
                update('artists', [
                  ...data.artists,
                  {
                    name: '',
                    role: '',
                    specialties: [],
                    experience: '',
                    avatar: '',
                    bio: '',
                    instagram: '',
                    portfolio: 0,
                  },
                ])
              }
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]"
            >
              <Plus className="w-4 h-4" /> {t('dashboard.vitrine.common.addArtist')}
            </button>
          </div>
        )}

        {activeSection === 'portfolio' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">{t('dashboard.vitrine.portfolio.title')}</h3>
            {data.portfolio.map((item, idx) => (
              <div
                key={idx}
                className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4"
              >
                <ImageUploadField
                  label={t('dashboard.vitrine.portfolio.photo')}
                  value={item.url}
                  onChange={(v) => {
                    const p = [...data.portfolio];
                    p[idx] = { ...p[idx], url: v };
                    update('portfolio', p);
                  }}
                  previewSize="md"
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    value={item.category}
                    onChange={(e) => {
                      const p = [...data.portfolio];
                      p[idx] = { ...p[idx], category: e.target.value };
                      update('portfolio', p);
                    }}
                    placeholder={t('dashboard.vitrine.common.category')}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    value={item.artist}
                    onChange={(e) => {
                      const p = [...data.portfolio];
                      p[idx] = { ...p[idx], artist: e.target.value };
                      update('portfolio', p);
                    }}
                    placeholder={t('dashboard.vitrine.portfolio.artistPh')}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    value={item.description}
                    onChange={(e) => {
                      const p = [...data.portfolio];
                      p[idx] = { ...p[idx], description: e.target.value };
                      update('portfolio', p);
                    }}
                    placeholder={t('dashboard.vitrine.common.description')}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    value={item.likes}
                    onChange={(e) => {
                      const p = [...data.portfolio];
                      p[idx] = { ...p[idx], likes: parseInt(e.target.value) || 0 };
                      update('portfolio', p);
                    }}
                    placeholder={t('dashboard.vitrine.portfolio.likesPh')}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      update(
                        'portfolio',
                        data.portfolio.filter((_, i) => i !== idx)
                      )
                    }
                    className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() =>
                update('portfolio', [
                  ...data.portfolio,
                  { url: '', category: '', artist: '', likes: 0, description: '' },
                ])
              }
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]"
            >
              <Plus className="w-4 h-4" /> {t('dashboard.vitrine.common.addPhoto')}
            </button>
          </div>
        )}

        {activeSection === 'flash' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">{t('dashboard.vitrine.flash.title')}</h3>
            {data.flashDesigns.map((flash, idx) => (
              <div
                key={flash.id}
                className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    {flash.title ||
                      t('dashboard.vitrine.common.flash').replace('{n}', String(idx + 1))}
                  </span>
                  <button
                    onClick={() =>
                      update(
                        'flashDesigns',
                        data.flashDesigns.filter((_, i) => i !== idx)
                      )
                    }
                    className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    value={flash.title}
                    onChange={(e) => {
                      const f = [...data.flashDesigns];
                      f[idx] = { ...f[idx], title: e.target.value };
                      update('flashDesigns', f);
                    }}
                    placeholder={t('dashboard.vitrine.common.title')}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <ImageUploadField
                  label={t('dashboard.vitrine.flash.image')}
                  value={flash.imageUrl}
                  onChange={(v) => {
                    const f = [...data.flashDesigns];
                    f[idx] = { ...f[idx], imageUrl: v };
                    update('flashDesigns', f);
                  }}
                  previewSize="md"
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={flash.price}
                    onChange={(e) => {
                      const f = [...data.flashDesigns];
                      f[idx] = { ...f[idx], price: parseInt(e.target.value) || 0 };
                      update('flashDesigns', f);
                    }}
                    placeholder={t('dashboard.vitrine.flash.pricePh')}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    value={flash.duration}
                    onChange={(e) => {
                      const f = [...data.flashDesigns];
                      f[idx] = { ...f[idx], duration: parseInt(e.target.value) || 0 };
                      update('flashDesigns', f);
                    }}
                    placeholder={t('dashboard.vitrine.flash.durationPh')}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    value={flash.style}
                    onChange={(e) => {
                      const f = [...data.flashDesigns];
                      f[idx] = { ...f[idx], style: e.target.value };
                      update('flashDesigns', f);
                    }}
                    placeholder={t('dashboard.vitrine.flash.stylePh')}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    value={flash.size}
                    onChange={(e) => {
                      const f = [...data.flashDesigns];
                      f[idx] = { ...f[idx], size: e.target.value };
                      update('flashDesigns', f);
                    }}
                    placeholder={t('dashboard.vitrine.flash.sizePh')}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <textarea
                  value={flash.description}
                  onChange={(e) => {
                    const f = [...data.flashDesigns];
                    f[idx] = { ...f[idx], description: e.target.value };
                    update('flashDesigns', f);
                  }}
                  placeholder={t('dashboard.vitrine.common.description')}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg resize-none"
                />
                <input
                  value={flash.placement.join(', ')}
                  onChange={(e) => {
                    const f = [...data.flashDesigns];
                    f[idx] = {
                      ...f[idx],
                      placement: e.target.value
                        .split(',')
                        .map((p) => p.trim())
                        .filter(Boolean),
                    };
                    update('flashDesigns', f);
                  }}
                  placeholder={t('dashboard.vitrine.flash.placementsPh')}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flash.available}
                    onChange={(e) => {
                      const f = [...data.flashDesigns];
                      f[idx] = { ...f[idx], available: e.target.checked };
                      update('flashDesigns', f);
                    }}
                  />
                  <span className="text-sm font-medium">
                    {t('dashboard.vitrine.common.available')}
                  </span>
                </label>
              </div>
            ))}
            <button
              onClick={() =>
                update('flashDesigns', [
                  ...data.flashDesigns,
                  {
                    id: `f${Date.now()}`,
                    title: '',
                    imageUrl: '',
                    price: 0,
                    duration: 60,
                    placement: [],
                    size: '',
                    available: true,
                    description: '',
                    style: '',
                  },
                ])
              }
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]"
            >
              <Plus className="w-4 h-4" /> {t('dashboard.vitrine.common.addFlash')}
            </button>
          </div>
        )}

        {activeSection === 'testimonials' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">{t('dashboard.vitrine.testimonials.title')}</h3>

            {/* Avis Google : OAuth Business Profile (optionnel) ou Place ID + témoignages */}
            <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <label className="block text-sm font-semibold text-[var(--text-primary)]">
                  {t('dashboard.vitrine.testimonials.google')}
                </label>
              </div>

              {!showGoogleBusinessOAuth ? (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {t('dashboard.vitrine.testimonials.googleFallback')}
                  </p>
                  <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 px-3 py-2.5">
                    <Info
                      className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5"
                      aria-hidden
                    />
                    <div className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-1.5">
                      <p>{t('dashboard.vitrine.testimonials.oauthDisabled')}</p>
                    </div>
                  </div>
                  {googleBusinessConnected && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {t('dashboard.vitrine.testimonials.stillLinked')}
                        </p>
                        <p className="text-[11px] text-amber-500/90 dark:text-amber-400/90 mt-0.5">
                          {t('dashboard.vitrine.testimonials.stillLinkedHint')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!onDisconnectGoogleBusiness) return;
                          setDisconnectingBusiness(true);
                          try {
                            await onDisconnectGoogleBusiness();
                            toast.success(t('dashboard.vitrine.testimonials.disconnectSuccess'));
                          } catch {
                            toast.error(t('dashboard.vitrine.testimonials.disconnectError'));
                          } finally {
                            setDisconnectingBusiness(false);
                          }
                        }}
                        disabled={disconnectingBusiness || !onDisconnectGoogleBusiness}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 border border-red-900/40 hover:bg-red-950/30 disabled:opacity-50 transition-all min-h-[36px]"
                      >
                        {disconnectingBusiness ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Link2Off className="w-3.5 h-3.5" />
                        )}
                        {t('dashboard.vitrine.common.disconnect')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t('dashboard.vitrine.testimonials.googleDesc')}
                  </p>
                  {googleBusinessConnected ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <svg
                            className="w-5 h-5 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[var(--text-primary)]">
                                {t('dashboard.vitrine.testimonials.googleBusiness')}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                {t('dashboard.vitrine.common.connected')}
                              </span>
                            </div>
                            {googleBusinessLocationName ? (
                              <p
                                className="text-[11px] text-zinc-400 truncate mt-0.5"
                                title={String(googleBusinessLocationName)}
                              >
                                {(() => {
                                  const raw = String(googleBusinessLocationName);
                                  return raw.split('/').filter(Boolean).slice(-1)[0] || raw;
                                })()}
                              </p>
                            ) : (
                              <p className="text-[11px] text-amber-400 mt-0.5">
                                {t('dashboard.vitrine.testimonials.pickLocation')}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!onDisconnectGoogleBusiness) return;
                            setDisconnectingBusiness(true);
                            try {
                              await onDisconnectGoogleBusiness();
                              toast.success(t('dashboard.vitrine.testimonials.disconnectSuccess'));
                            } catch {
                              toast.error(t('dashboard.vitrine.testimonials.disconnectError'));
                            } finally {
                              setDisconnectingBusiness(false);
                            }
                          }}
                          disabled={disconnectingBusiness || !onDisconnectGoogleBusiness}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 border border-red-900/40 hover:bg-red-950/30 disabled:opacity-50 transition-all min-h-[36px]"
                        >
                          {disconnectingBusiness ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Link2Off className="w-3.5 h-3.5" />
                          )}
                          {t('dashboard.vitrine.common.disconnect')}
                        </button>
                      </div>

                      {googleBusinessNeedsLocationSelection && (
                        <div>
                          <p className="text-xs text-zinc-400 mb-2">
                            {t('dashboard.vitrine.testimonials.whichLocation')}
                          </p>
                          {loadingGoogleBusinessLocations ? (
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />{' '}
                              {t('dashboard.vitrine.common.loading')}
                            </div>
                          ) : googleBusinessLocations.length === 0 ? (
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 space-y-3">
                              <p className="text-sm font-medium text-[var(--text-primary)]">
                                {t('dashboard.vitrine.testimonials.noLocation')}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {googleBusinessLocationsHint ||
                                  t('dashboard.vitrine.testimonials.noLocationHint')}
                              </p>
                              {onLoadGoogleBusinessLocations && (
                                <button
                                  type="button"
                                  onClick={() => void onLoadGoogleBusinessLocations(true)}
                                  disabled={loadingGoogleBusinessLocations}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:bg-zinc-800/50 disabled:opacity-50 transition-all active:scale-[0.98]"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                  {t('dashboard.vitrine.common.refreshList')}
                                </button>
                              )}
                            </div>
                          ) : (
                            <ul className="rounded-xl border border-[var(--border)] divide-y divide-zinc-800 overflow-hidden">
                              {googleBusinessLocations.map((loc) => (
                                <li key={loc.name}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void Promise.resolve(
                                        onSelectGoogleBusinessLocation?.(loc.name)
                                      ).catch((e: unknown) => {
                                        const msg =
                                          e instanceof Error
                                            ? e.message
                                            : t('dashboard.vitrine.testimonials.saveError');
                                        toast.error(
                                          msg.length > 160 ? `${msg.slice(0, 157)}…` : msg
                                        );
                                      });
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-zinc-800/60 transition-all active:scale-[0.99]"
                                  >
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                      {loc.title}
                                    </p>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                      {loc.accountName}
                                    </p>
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
                        try {
                          await onConnectGoogleBusiness();
                        } catch (err) {
                          toast.error(
                            (err as Error).message ||
                              t('dashboard.vitrine.testimonials.connectError')
                          );
                          setConnectingBusiness(false);
                        }
                      }}
                      disabled={connectingBusiness || !onConnectGoogleBusiness}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:bg-zinc-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                      {connectingBusiness ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{' '}
                          {t('dashboard.vitrine.common.connecting')}
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4" />{' '}
                          {t('dashboard.vitrine.testimonials.connectGoogle')}
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
            {testimonials.map((review, idx) => (
              <div
                key={idx}
                className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    {review.name ||
                      t('dashboard.vitrine.common.review').replace('{n}', String(idx + 1))}
                  </span>
                  <button
                    onClick={() =>
                      update(
                        'testimonials',
                        testimonials.filter((_, i) => i !== idx)
                      )
                    }
                    className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    value={review.name}
                    onChange={(e) => {
                      const x = [...testimonials];
                      x[idx] = { ...x[idx], name: e.target.value };
                      update('testimonials', x);
                    }}
                    placeholder={t('dashboard.vitrine.common.name')}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={review.rating}
                    onChange={(e) => {
                      const x = [...testimonials];
                      x[idx] = { ...x[idx], rating: parseInt(e.target.value) || 5 };
                      update('testimonials', x);
                    }}
                    placeholder={t('dashboard.vitrine.testimonials.ratingPh')}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <input
                  value={review.date}
                  onChange={(e) => {
                    const x = [...testimonials];
                    x[idx] = { ...x[idx], date: e.target.value };
                    update('testimonials', x);
                  }}
                  placeholder={t('dashboard.vitrine.testimonials.datePh')}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <textarea
                  value={review.text}
                  onChange={(e) => {
                    const x = [...testimonials];
                    x[idx] = { ...x[idx], text: e.target.value };
                    update('testimonials', x);
                  }}
                  placeholder={t('dashboard.vitrine.testimonials.textPh')}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg resize-none"
                />
                <ImageUploadField
                  label={t('dashboard.vitrine.testimonials.clientPhoto')}
                  value={review.avatar}
                  onChange={(v) => {
                    const x = [...testimonials];
                    x[idx] = { ...x[idx], avatar: v };
                    update('testimonials', x);
                  }}
                  shape="round"
                  previewSize="sm"
                />
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('dashboard.vitrine.testimonials.tattoo')}
                  </label>
                  <input
                    value={review.tattoo}
                    onChange={(e) => {
                      const x = [...testimonials];
                      x[idx] = { ...x[idx], tattoo: e.target.value };
                      update('testimonials', x);
                    }}
                    placeholder={t('dashboard.vitrine.testimonials.tattooPh')}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={review.verified}
                    onChange={(e) => {
                      const x = [...testimonials];
                      x[idx] = { ...x[idx], verified: e.target.checked };
                      update('testimonials', x);
                    }}
                  />
                  <span className="text-sm font-medium">
                    {t('dashboard.vitrine.testimonials.verified')}
                  </span>
                </label>
              </div>
            ))}
            <button
              onClick={() =>
                update('testimonials', [
                  ...testimonials,
                  {
                    name: '',
                    rating: 5,
                    date: '',
                    text: '',
                    avatar: '',
                    tattoo: '',
                    verified: true,
                  },
                ])
              }
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]"
            >
              <Plus className="w-4 h-4" /> {t('dashboard.vitrine.common.addReview')}
            </button>
          </div>
        )}

        {activeSection === 'faq' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">{t('dashboard.vitrine.faq.title')}</h3>
            {data.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-[var(--text-secondary)]">
                    {t('dashboard.vitrine.common.faq').replace('{n}', String(idx + 1))}
                  </span>
                  <button
                    onClick={() =>
                      update(
                        'faqs',
                        data.faqs.filter((_, i) => i !== idx)
                      )
                    }
                    className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={faq.q}
                  onChange={(e) => {
                    const f = [...data.faqs];
                    f[idx] = { ...f[idx], q: e.target.value };
                    update('faqs', f);
                  }}
                  placeholder={t('dashboard.vitrine.common.question')}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <textarea
                  value={faq.a}
                  onChange={(e) => {
                    const f = [...data.faqs];
                    f[idx] = { ...f[idx], a: e.target.value };
                    update('faqs', f);
                  }}
                  placeholder={t('dashboard.vitrine.common.answer')}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg resize-none"
                />
              </div>
            ))}
            <button
              onClick={() => update('faqs', [...data.faqs, { q: '', a: '' }])}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]"
            >
              <Plus className="w-4 h-4" /> {t('dashboard.vitrine.common.addFaq')}
            </button>
          </div>
        )}

        {activeSection === 'why' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">{t('dashboard.vitrine.why.title')}</h3>
            {data.whyChooseUs.map((item, idx) => (
              <div
                key={idx}
                className="p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    {item.title ||
                      t('dashboard.vitrine.common.point').replace('{n}', String(idx + 1))}
                  </span>
                  <button
                    onClick={() =>
                      update(
                        'whyChooseUs',
                        data.whyChooseUs.filter((_, i) => i !== idx)
                      )
                    }
                    className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    value={item.title}
                    onChange={(e) => {
                      const w = [...data.whyChooseUs];
                      w[idx] = { ...w[idx], title: e.target.value };
                      update('whyChooseUs', w);
                    }}
                    placeholder={t('dashboard.vitrine.common.title')}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <select
                    value={item.icon}
                    onChange={(e) => {
                      const w = [...data.whyChooseUs];
                      w[idx] = { ...w[idx], icon: e.target.value as VitrineWhyChooseUs['icon'] };
                      update('whyChooseUs', w);
                    }}
                    className="px-4 py-2 border rounded-lg"
                  >
                    {iconOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={item.description}
                  onChange={(e) => {
                    const w = [...data.whyChooseUs];
                    w[idx] = { ...w[idx], description: e.target.value };
                    update('whyChooseUs', w);
                  }}
                  placeholder={t('dashboard.vitrine.common.description')}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg resize-none"
                />
              </div>
            ))}
            <button
              onClick={() =>
                update('whyChooseUs', [
                  ...data.whyChooseUs,
                  { icon: 'award', title: '', description: '' },
                ])
              }
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-blue-500 hover:text-[var(--text-primary)]"
            >
              <Plus className="w-4 h-4" /> {t('dashboard.vitrine.common.addPoint')}
            </button>
          </div>
        )}

        {activeSection === 'hours' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">{t('dashboard.vitrine.hours.title')}</h3>
            {DAYS.map((day) => {
              const h = data.openingHours[day] || { open: '10:00', close: '19:00', closed: false };
              return (
                <div
                  key={day}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <span className="font-semibold w-28">{dayLabels[day]}</span>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={h.closed}
                      onChange={(e) => {
                        const oh = { ...data.openingHours };
                        oh[day] = { ...h, closed: e.target.checked };
                        update('openingHours', oh);
                      }}
                    />
                    <span className="text-sm">{t('dashboard.vitrine.common.closed')}</span>
                  </label>
                  {!h.closed && (
                    <div className="flex gap-2 items-center">
                      <input
                        type="time"
                        value={h.open}
                        onChange={(e) => {
                          const oh = { ...data.openingHours };
                          oh[day] = { ...h, open: e.target.value };
                          update('openingHours', oh);
                        }}
                        className="px-4 py-2 border rounded-lg"
                      />
                      <span className="text-[var(--text-tertiary)]">-</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={(e) => {
                          const oh = { ...data.openingHours };
                          oh[day] = { ...h, close: e.target.value };
                          update('openingHours', oh);
                        }}
                        className="px-4 py-2 border rounded-lg"
                      />
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
              {t('dashboard.vitrine.page.prev')}
            </button>
            <button
              type="button"
              disabled={safeSectionIndex >= sections.length - 1}
              onClick={() => setActiveSection(sections[safeSectionIndex + 1].id)}
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-35 disabled:cursor-not-allowed transition-colors active:scale-[0.98] motion-reduce:active:scale-100"
            >
              {t('dashboard.vitrine.page.next')}
              <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <a
        href={`/studio/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${manualSaving || saving ? 'bg-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed pointer-events-none' : 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'}`}
        title={
          manualSaving || saving
            ? t('dashboard.vitrine.page.previewWait')
            : t('dashboard.vitrine.page.previewTitle')
        }
      >
        <ExternalLink className="w-5 h-5" />
        {t('dashboard.vitrine.page.preview')}
      </a>
    </div>
  );
};
