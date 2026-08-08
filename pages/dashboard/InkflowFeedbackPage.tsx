import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ImagePlus, LifeBuoy, Loader2, Send, X } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  FEEDBACK_MAX_SCREENSHOTS,
  submitProductFeedback,
  type FeedbackModule,
  type FeedbackType,
} from '../../lib/submitProductFeedback';
import { SUPPORT_EMAIL } from '../../lib/supportContact';

const TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: 'Bug / dysfonctionnement' },
  { value: 'idea', label: 'Idée d’amélioration' },
  { value: 'question', label: 'Question produit' },
  { value: 'other', label: 'Autre' },
];

const MODULE_OPTIONS: { value: FeedbackModule; label: string }[] = [
  { value: 'agenda', label: 'Agenda / RDV' },
  { value: 'demandes', label: 'Demandes' },
  { value: 'clients', label: 'Clients / CRM' },
  { value: 'finance', label: 'Finance / paiements' },
  { value: 'vitrine', label: 'Vitrine' },
  { value: 'reservation', label: 'Réservation en ligne' },
  { value: 'parametres', label: 'Paramètres' },
  { value: 'autre', label: 'Autre' },
];

export const InkflowFeedbackPage: React.FC = () => {
  const { user, isAuthenticated, authLoading } = useAuth();
  const toast = useToast();
  const [type, setType] = useState<FeedbackType>('bug');
  const [module, setModule] = useState<FeedbackModule>('agenda');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const canSubmit = message.trim().length >= 10 && !loading;

  const returnDashboard = useCallback(() => {
    window.history.pushState({}, '', '/dashboard');
    window.dispatchEvent(new Event('inkflow-navigate'));
  }, []);

  const onPickFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    const valid = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) {
      toast.error('Choisis une image (JPG, PNG ou WebP).');
      return;
    }
    setFiles((prev) => [...prev, ...valid].slice(0, FEEDBACK_MAX_SCREENSHOTS));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await submitProductFeedback({
        type,
        module,
        message,
        files,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      });
      setSent(true);
      toast.success('Signalement envoyé. Merci, on te répond sous 1 à 2 jours ouvrés.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally {
      setLoading(false);
    }
  };

  const userLabel = useMemo(() => user?.email ?? 'Compte connecté', [user?.email]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="landing-scroll min-h-[100dvh] bg-[#f6f5f2] dark:bg-zinc-950">
      <SEO
        title="Signaler un bug | InkFlow"
        description="Contacte l'équipe InkFlow, envoie des captures et décris un problème sur l'app tatoueur."
        canonical="/dashboard/signalement"
      />

      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={returnDashboard}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl text-sm font-medium text-zinc-600 transition-all hover:text-zinc-900 active:scale-[0.98] dark:text-zinc-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            Dashboard
          </button>
          <div className="flex items-center gap-2">
            <Logo size="xs" />
            <span className="font-display text-sm font-bold text-zinc-900 dark:text-white">
              InkFlow
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Support produit
          </p>
          <div className="mt-4 flex items-start gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200/80 bg-white shadow-[0_8px_24px_-12px_rgba(9,9,11,0.12)] dark:border-zinc-700 dark:bg-zinc-900"
              aria-hidden
            >
              <LifeBuoy
                className="h-6 w-6 text-emerald-600 dark:text-emerald-500"
                strokeWidth={1.75}
              />
            </span>
            <div className="min-w-0 pt-0.5">
              <h1 className="type-heading">Signaler un bug</h1>
              <p className="mt-1 text-sm text-zinc-500">Retour direct à l&apos;équipe InkFlow</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
            Décris ce qui ne va pas, ajoute des captures d&apos;écran. L&apos;équipe InkFlow reçoit
            ton message sur{' '}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{SUPPORT_EMAIL}</span>{' '}
            pour vérifier que tout fonctionne.
          </p>
          <p className="mt-2 text-xs text-zinc-500">Connecté : {userLabel}</p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">
              Merci, c&apos;est bien parti.
            </p>
            <p className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-200/90">
              On analyse ton signalement et on revient vers toi par e-mail si besoin.
            </p>
            <button
              type="button"
              onClick={returnDashboard}
              className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-900"
            >
              Retour au dashboard
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as FeedbackType)}
                  className="min-h-[44px] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Zone de l&apos;app
                </span>
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value as FeedbackModule)}
                  className="min-h-[44px] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {MODULE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Description
              </span>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex. : Sur iPhone, quand j’ouvre une fiche client depuis Demandes, le bouton PDF ne répond pas…"
                className="resize-y rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <span className="text-xs text-zinc-500">Minimum 10 caractères.</span>
            </label>

            <div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Captures d&apos;écran ({files.length}/{FEEDBACK_MAX_SCREENSHOTS})
              </span>
              <p className="mt-1 text-xs text-zinc-500">
                JPG, PNG ou WebP — max 5 Mo par image. Idéal : écran entier + message d&apos;erreur.
              </p>

              <label className="mt-3 flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-6 transition-colors hover:border-zinc-400 hover:bg-zinc-100/80 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-600">
                <ImagePlus className="h-8 w-8 text-zinc-400" strokeWidth={1.5} />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Importer des captures
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    onPickFiles(e.target.files);
                    e.target.value = '';
                  }}
                  disabled={files.length >= FEEDBACK_MAX_SCREENSHOTS}
                />
              </label>

              {previews.length > 0 ? (
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {previews.map((src, i) => (
                    <li
                      key={src}
                      className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
                    >
                      <img
                        src={src}
                        alt={`Capture ${i + 1}`}
                        className="aspect-[4/3] w-full object-cover object-top"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900/80 text-white transition-all hover:bg-zinc-900 active:scale-[0.98]"
                        aria-label={`Retirer la capture ${i + 1}`}
                      >
                        <X className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
              ) : (
                <Send className="h-5 w-5" strokeWidth={2} />
              )}
              {loading ? 'Envoi en cours…' : 'Envoyer à InkFlow'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
};
