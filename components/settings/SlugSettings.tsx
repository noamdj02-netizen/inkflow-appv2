import React, { useState, useEffect, useCallback } from 'react';
import { Link2, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { checkSlugAvailable, updateStudioSlug } from '../../lib/supabaseDashboard';
import { APP_URL } from '../../lib/urls';
import { Modal } from '../ui/Modal';

const SLUG_REGEX = /^[a-z0-9-]+$/;
const SLUG_MIN_LENGTH = 3;
const SLUG_MAX_LENGTH = 50;

// Slugs système réservés — un tatoueur ne peut pas les usurper
const RESERVED_SLUGS = new Set([
  'demo', 'admin', 'api', 'app', 'auth', 'billing', 'blog', 'callback',
  'dashboard', 'help', 'inkflow', 'login', 'logout', 'mail', 'me', 'pricing',
  'privacy', 'profile', 'public', 'register', 'reset', 'settings', 'signup',
  'status', 'studio', 'support', 'terms', 'test', 'user', 'users', 'www',
]);

function isReservedSlug(s: string): boolean {
  return RESERVED_SLUGS.has(s.toLowerCase());
}

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

function generateCandidates(base: string): string[] {
  const b = sanitizeSlugInput(base);
  return [
    `${b}-ink`,
    `${b}-tattoo`,
    `${b}-studio`,
    `${b}-art`,
    `${b}-2`,
    `${b}-3`,
  ].filter(s => s.length >= SLUG_MIN_LENGTH && SLUG_REGEX.test(s));
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSlugChangeConfirm, setShowSlugChangeConfirm] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : APP_URL;
  const prefix = `${baseUrl}/studio/`;

  useEffect(() => {
    setSlug(currentSlug);
    setSuggestions([]);
  }, [currentSlug]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeSlugInput(e.target.value);
    setSlug(sanitized);
    setSuggestions([]);
    if (!sanitized || sanitized.length < SLUG_MIN_LENGTH || !SLUG_REGEX.test(sanitized)) {
      setAvailability(sanitized.length > 0 ? 'invalid' : 'idle');
      return;
    }
    if (sanitized === currentSlug) {
      setAvailability('idle');
      return;
    }
    setAvailability('idle');
  };

  // Real-time availability check
  useEffect(() => {
    if (!slug || slug.length < SLUG_MIN_LENGTH || !SLUG_REGEX.test(slug)) return;
    if (slug === currentSlug) return;
    // Block reserved system slugs immediately, no network call needed
    if (isReservedSlug(slug)) {
      setAvailability('taken');
      setSuggestions(generateCandidates(slug).slice(0, 3));
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const available = await checkSlugAvailable(slug, studioId);
        if (!cancelled) {
          setAvailability(available ? 'available' : 'taken');
          if (!available) {
            // Generate and check alternatives
            setLoadingSuggestions(true);
            const candidates = generateCandidates(slug);
            const results = await Promise.all(
              candidates.map(async (c) => {
                try {
                  const ok = await checkSlugAvailable(c, studioId);
                  return ok ? c : null;
                } catch {
                  return null;
                }
              })
            );
            if (!cancelled) {
              setSuggestions(results.filter(Boolean).slice(0, 3) as string[]);
              setLoadingSuggestions(false);
            }
          }
        }
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
  const hasSlugChange = slug !== currentSlug;
  const canSave =
    isValid &&
    hasSlugChange &&
    availability === 'available' &&
    !saving;

  const performSave = async (nextSlug: string) => {
    setSaving(true);
    try {
      await updateStudioSlug(studioId, nextSlug);
      if (currentSlug && currentSlug !== nextSlug) {
        localStorage.removeItem(`inkflow-vitrine-${currentSlug}`);
      }
      onSlugUpdated?.(nextSlug);
      toast.success('URL personnalisée enregistrée');
      setAvailability('idle');
      setSuggestions([]);
      setShowSlugChangeConfirm(false);
    } catch {
      toast.error('Erreur lors de la sauvegarde. Ce slug est peut-être déjà pris.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (!canSave || !slug) return;
    if (isReservedSlug(slug)) {
      toast.error('Ce slug est réservé par le système.');
      return;
    }
    if (currentSlug && slug !== currentSlug) {
      setShowSlugChangeConfirm(true);
      return;
    }
    void performSave(slug);
  };

  const handleConfirmSlugChange = () => {
    if (!slug || !canSave) return;
    void performSave(slug);
  };

  const pickSuggestion = useCallback((s: string) => {
    setSlug(s);
    setSuggestions([]);
    setAvailability('available');
  }, []);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6">
      <h3 className="font-bold text-lg mb-2 text-[var(--text-primary)] flex items-center gap-2">
        <Link2 className="w-5 h-5 text-[var(--text-secondary)]" />
        URL personnalisée
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Choisissez l&apos;adresse de votre page vitrine. Uniquement minuscules, chiffres et tirets ({SLUG_MIN_LENGTH}–{SLUG_MAX_LENGTH} caractères). Modifier l&apos;URL après coup invalide les anciens liens et QR — une confirmation vous sera demandée.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className={`flex flex-1 rounded-xl border overflow-hidden transition-colors ${
          availability === 'taken' ? 'border-red-400 dark:border-red-500' :
          availability === 'available' ? 'border-green-500 dark:border-green-400' :
          'border-[var(--border)]'
        } bg-[var(--bg-primary)]`}>
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
          {checking && (
            <div className="flex items-center pr-3">
              <Loader2 className="w-4 h-4 text-[var(--text-tertiary)] animate-spin" />
            </div>
          )}
          {!checking && availability === 'available' && (
            <div className="flex items-center pr-3">
              <Check className="w-4 h-4 text-green-500" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={!canSave}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] min-h-[44px]"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
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

      {/* Status feedback */}
      <div className="mt-3 min-h-[24px]">
        {!checking && slug && slug !== currentSlug && (
          <>
            {availability === 'invalid' && (
              <p className="text-sm text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Min. {SLUG_MIN_LENGTH} caractères, uniquement a-z, 0-9 et tirets
              </p>
            )}
            {availability === 'taken' && isValid && (
              <div className="space-y-3">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {isReservedSlug(slug) ? 'Ce slug est réservé par le système InkFlow' : 'Ce slug est déjà pris par un autre studio'}
                </p>

                {/* Suggestions */}
                {(loadingSuggestions || suggestions.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Suggestions disponibles :
                    </span>
                    {loadingSuggestions ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-tertiary)]" />
                    ) : (
                      suggestions.map(s => (
                        <button
                          key={s}
                          onClick={() => pickSuggestion(s)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors active:scale-95"
                        >
                          {s}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            {availability === 'available' && (
              <p className="text-sm text-green-600 dark:text-green-500 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Disponible — ce slug est libre
              </p>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={showSlugChangeConfirm}
        onClose={() => !saving && setShowSlugChangeConfirm(false)}
        title="Confirmer le changement d’URL"
        size="sm"
      >
        <div className="space-y-4 text-[var(--text-secondary)] text-sm">
          <p>
            L&apos;adresse <span className="font-mono text-[var(--text-primary)]">/studio/{currentSlug}</span> ne fonctionnera plus. Les clients qui utilisent encore ce lien ou un QR imprimé devront utiliser la nouvelle URL.
          </p>
          <p className="font-medium text-[var(--text-primary)]">
            Nouvelle URL :{' '}
            <span className="font-mono break-all">
              {prefix}
              {slug}
            </span>
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setShowSlugChangeConfirm(false)}
              className="min-h-[44px] rounded-xl border border-[var(--border)] px-4 py-2.5 font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--bg-hover)] active:scale-[0.98] disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleConfirmSlugChange}
              className="min-h-[44px] rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white transition-all hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : 'Confirmer et enregistrer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
