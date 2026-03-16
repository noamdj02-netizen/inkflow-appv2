import React, { useState, useEffect } from 'react';
import { Link2, Check, AlertCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { checkSlugAvailable, updateStudioSlug } from '../../lib/supabaseDashboard';
import { APP_URL } from '../../lib/urls';

const SLUG_REGEX = /^[a-z0-9-]+$/;
const SLUG_MIN_LENGTH = 3;
const SLUG_MAX_LENGTH = 50;

function sanitizeSlugInput(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, SLUG_MAX_LENGTH);
}

interface SlugSettingsProps {
  studioId: string;
  currentSlug: string;
  onSlugUpdated?: (newSlug: string) => void;
}

export const SlugSettings: React.FC<SlugSettingsProps> = ({
  studioId,
  currentSlug,
  onSlugUpdated,
}) => {
  const toast = useToast();
  const [slug, setSlug] = useState(currentSlug);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<'idle' | 'available' | 'taken' | 'invalid'>('idle');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : APP_URL;
  const prefix = `${baseUrl}/studio/`;

  useEffect(() => {
    setSlug(currentSlug);
  }, [currentSlug]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = sanitizeSlugInput(raw);
    setSlug(sanitized);
    if (!sanitized) {
      setAvailability('invalid');
      return;
    }
    if (sanitized.length < SLUG_MIN_LENGTH) {
      setAvailability('invalid');
      return;
    }
    if (!SLUG_REGEX.test(sanitized)) {
      setAvailability('invalid');
      return;
    }
    if (sanitized === currentSlug) {
      setAvailability('idle');
      return;
    }
    setAvailability('idle');
  };

  useEffect(() => {
    if (!slug || slug.length < SLUG_MIN_LENGTH || !SLUG_REGEX.test(slug)) return;
    if (slug === currentSlug) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const available = await checkSlugAvailable(slug, studioId);
        if (!cancelled) setAvailability(available ? 'available' : 'taken');
      } catch {
        if (!cancelled) setAvailability('taken');
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug, currentSlug, studioId]);

  const isValid = slug.length >= SLUG_MIN_LENGTH && SLUG_REGEX.test(slug);
  const canSave = isValid && (availability === 'available' || slug === currentSlug) && !saving;

  const handleSave = async () => {
    if (!canSave || !slug) return;
    setSaving(true);
    try {
      await updateStudioSlug(studioId, slug);
      onSlugUpdated?.(slug);
      toast.success('URL personnalisée enregistrée');
      setAvailability('idle');
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde. Ce slug est peut-être déjà pris.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6">
      <h3 className="font-bold text-lg mb-2 text-[var(--text-primary)] flex items-center gap-2">
        <Link2 className="w-5 h-5 text-[var(--text-secondary)]" />
        URL personnalisée
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Choisissez l&apos;adresse de votre page vitrine. Uniquement minuscules, chiffres et tirets.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden">
          <span className="px-4 py-3 text-sm text-[var(--text-secondary)] bg-[var(--bg-card-secondary)] border-r border-[var(--border)] whitespace-nowrap">
            {prefix}
          </span>
          <input
            type="text"
            value={slug}
            onChange={handleInputChange}
            placeholder="mon-studio"
            className="flex-1 min-w-0 px-4 py-3 bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-0 placeholder:text-[var(--text-tertiary)]"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] min-h-[44px]"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Sauvegarder
            </>
          )}
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 min-h-[24px]">
        {checking && (
          <span className="text-sm text-[var(--text-tertiary)]">Vérification...</span>
        )}
        {!checking && slug && slug !== currentSlug && (
          <>
            {availability === 'invalid' && (
              <span className="text-sm text-amber-600 dark:text-amber-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Min. {SLUG_MIN_LENGTH} caractères, uniquement a-z, 0-9 et tirets
              </span>
            )}
            {availability === 'taken' && isValid && (
              <span className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Ce slug est déjà pris
              </span>
            )}
            {availability === 'available' && (
              <span className="text-sm text-green-600 dark:text-green-500 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Disponible
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
