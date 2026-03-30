/**
 * ClientReviewPrompt
 * Bottom sheet de demande d'avis — s'affiche au bon moment (palier fidélité ou J14).
 * - 4-5 étoiles → redirige vers l'App Store / Google Play
 * - 1-3 étoiles → formulaire de feedback interne (ne pas polluer les stores)
 * - Stocké en localStorage : ne reparaît pas avant COOLDOWN_DAYS jours
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, ExternalLink } from 'lucide-react';

const STORAGE_KEY    = 'inkflow_review_prompt_v1';
const COOLDOWN_DAYS  = 60;

/** Appelle cette fonction depuis le contexte parent pour savoir si on peut afficher */
export function shouldShowReviewPrompt(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const { dismissedAt } = JSON.parse(raw) as { dismissedAt: number };
    const daysSince = (Date.now() - dismissedAt) / 86_400_000;
    return daysSince >= COOLDOWN_DAYS;
  } catch {
    return true;
  }
}

export function markReviewPromptDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissedAt: Date.now() }));
  } catch { /* quota / private */ }
}

/* ── Design tokens ── */
const N = {
  accent:  '#c9a96e',
  accentDim: 'rgba(201,169,110,0.12)',
  text:    '#111111',
  textSub: '#555555',
  surface: '#FFFFFF',
  border:  '#E5E5E5',
} as const;

interface Props {
  /** Contexte affiché sous le titre (ex: "Ton tatouage est maintenant cicatrisé ✨") */
  triggerLabel?: string;
  onClose: () => void;
}

export const ClientReviewPrompt: React.FC<Props> = ({ triggerLabel, onClose }) => {
  const [stars, setStars]         = useState(0);
  const [hovered, setHovered]     = useState(0);
  const [phase, setPhase]         = useState<'rating' | 'positive' | 'negative'>('rating');
  const [feedback, setFeedback]   = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleStars = (n: number) => {
    setStars(n);
    if (n >= 4) setPhase('positive');
    else        setPhase('negative');
  };

  const handleDismiss = () => {
    markReviewPromptDismissed();
    onClose();
  };

  const handleSubmitFeedback = () => {
    // On pourrait envoyer le feedback à Supabase ici
    setSubmitted(true);
    setTimeout(handleDismiss, 1800);
  };

  const displayStars = hovered || stars;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={handleDismiss}
    >
      <motion.div
        className="w-full max-w-md rounded-t-3xl px-6 pt-6 pb-10"
        style={{
          background: N.surface,
          paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: N.border }} />

        <AnimatePresence mode="wait">

          {/* ── Phase 1 : rating ── */}
          {phase === 'rating' && !submitted && (
            <motion.div key="rating"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <button type="button" onClick={handleDismiss}
                className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: N.border }}>
                <X className="w-4 h-4" style={{ color: N.textSub }} />
              </button>

              <div className="text-3xl mb-3">🎉</div>
              {triggerLabel && (
                <p className="text-xs font-semibold mb-1" style={{ color: N.accent }}>{triggerLabel}</p>
              )}
              <h3 className="text-xl font-black mb-1" style={{ color: N.text }}>
                Tu aimes Inkflow ?
              </h3>
              <p className="text-sm mb-6" style={{ color: N.textSub }}>
                30 secondes pour nous aider à grandir 🙏
              </p>

              {/* Stars */}
              <div className="flex justify-center gap-3 mb-6">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button"
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => handleStars(n)}
                    className="transition-transform active:scale-90"
                    style={{ transform: displayStars >= n ? 'scale(1.15)' : 'scale(1)' }}
                  >
                    <Star
                      className="w-9 h-9"
                      style={{
                        fill: displayStars >= n ? N.accent : 'none',
                        color: displayStars >= n ? N.accent : N.border,
                        transition: 'all 0.15s',
                      }}
                    />
                  </button>
                ))}
              </div>

              <p className="text-xs text-center" style={{ color: N.textSub }}>
                Appuie sur une étoile pour continuer
              </p>
            </motion.div>
          )}

          {/* ── Phase 2 : positif (4-5★) → App Store ── */}
          {phase === 'positive' && !submitted && (
            <motion.div key="positive"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-center"
            >
              <div className="text-4xl mb-4">🙌</div>
              <h3 className="text-xl font-black mb-2" style={{ color: N.text }}>
                Super, merci !
              </h3>
              <p className="text-sm mb-6" style={{ color: N.textSub }}>
                Un avis sur l'App Store aide d'autres passionnés de tatouage à nous découvrir.
              </p>

              <a
                href="https://apps.apple.com/app/inkflow"
                target="_blank"
                rel="noreferrer"
                onClick={handleDismiss}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold mb-3"
                style={{ background: N.accent, color: '#1a1008', boxShadow: `0 6px 24px ${N.accentDim}` }}
              >
                <ExternalLink className="w-4 h-4" />
                Laisser un avis
              </a>

              <button type="button" onClick={handleDismiss}
                className="w-full py-3 text-sm font-medium"
                style={{ color: N.textSub }}>
                Plus tard
              </button>
            </motion.div>
          )}

          {/* ── Phase 3 : négatif (1-3★) → feedback interne ── */}
          {phase === 'negative' && !submitted && (
            <motion.div key="negative"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-3xl mb-3">💬</div>
              <h3 className="text-xl font-black mb-1" style={{ color: N.text }}>
                On peut faire mieux
              </h3>
              <p className="text-sm mb-4" style={{ color: N.textSub }}>
                Dis-nous ce qui ne t'a pas convaincu — ton retour compte vraiment.
              </p>

              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Ce que j'aimerais améliorer..."
                rows={4}
                className="w-full rounded-2xl border p-4 text-sm resize-none outline-none mb-4"
                style={{ borderColor: N.border, color: N.text, background: '#F9F9F9' }}
              />

              <button type="button"
                onClick={handleSubmitFeedback}
                disabled={!feedback.trim()}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold mb-3 disabled:opacity-40 transition-opacity"
                style={{ background: N.text, color: '#fff' }}
              >
                <MessageSquare className="w-4 h-4" />
                Envoyer mon retour
              </button>

              <button type="button" onClick={handleDismiss}
                className="w-full py-3 text-sm font-medium"
                style={{ color: N.textSub }}>
                Annuler
              </button>
            </motion.div>
          )}

          {/* ── Confirmation ── */}
          {submitted && (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-black" style={{ color: N.text }}>Merci !</h3>
              <p className="text-sm mt-1" style={{ color: N.textSub }}>On prend ça en compte.</p>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
