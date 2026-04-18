/**
 * Page de réservation publique — /book/:studioSlug
 * Tunnel de conversion Mobile-First, Light Mode, optimisé pour le paiement Stripe.
 */
import React from 'react';
import {
  ArrowLeft,
  User,
  Lock,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Check,
  AlertCircle,
  Zap,
  Pencil,
  Send,
  MapPin,
  Instagram,
  FileText,
} from 'lucide-react';
import { ReferenceImageUpload } from '../../components/booking/ReferenceImageUpload';
import { HealthQuestionnaireForm } from '../../components/booking/HealthQuestionnaireForm';
import { toLocalDateString } from '../../lib/utils';
import { SEO } from '../../components/SEO';
import {
  useBookingFlow,
  replaceUrlFlashParam,
  PLACEMENT_OTHER_VALUE,
} from '../../hooks/useBookingFlow';

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

interface PublicBookingPageProps {
  studioSlug: string;
}

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({ studioSlug }) => {
  const {
    studioId,
    studioInfo,
    bookingMode,
    setBookingMode,
    selectedFlashId,
    setSelectedFlashId,
    flashListLoading,
    availableFlashes,
    selectedFlash,
    flashPlacementOptions,
    resolvedPlacement,
    depositAmount,
    projectSubmitted,
    projectForm,
    setProjectForm,
    projectImages,
    setProjectImages,
    projectSubmitting,
    projectError,
    handleProjectSubmit,
    availabilityLoading,
    availableDates,
    availableSlots,
    calendarMonth,
    setCalendarMonth,
    form,
    setForm,
    isSubmitting,
    showHealthForm,
    setShowHealthForm,
    healthFormCompleted,
    handleHealthFormComplete,
    paymentError,
    paymentVerified,
    paymentsOnline,
    canPay,
    handlePay,
  } = useBookingFlow(studioSlug);

  // ── Écrans de résultat paiement ──────────────────────────────────────────────

  if (paymentVerified === true) {
    return (
      <div className="landing-scroll safe-top min-h-screen bg-ink-bg flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-emerald-600" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-ink-text mb-2">Paiement réussi</h2>
        <p className="text-ink-muted text-center text-sm mb-8 max-w-xs">
          Votre acompte a bien été enregistré. Le studio vous contactera pour confirmer votre rendez-vous.
        </p>
        <a
          href={`/studio/${studioSlug}`}
          className="w-full max-w-xs h-14 flex items-center justify-center rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-colors"
        >
          Retour au studio
        </a>
      </div>
    );
  }

  if (
    paymentVerified === false &&
    new URLSearchParams(window.location.search).has('session_id')
  ) {
    return (
      <div className="landing-scroll safe-top min-h-screen bg-ink-bg flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-amber-600" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-ink-text mb-2">Vérification en cours</h2>
        <p className="text-ink-muted text-center text-sm mb-8 max-w-xs">
          {paymentError ||
            'Nous vérifions votre paiement. Si vous avez été débité, votre réservation sera confirmée sous peu.'}
        </p>
        <a
          href={`/studio/${studioSlug}`}
          className="w-full max-w-xs h-14 flex items-center justify-center rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-colors"
        >
          Retour au studio
        </a>
      </div>
    );
  }

  if (studioId === 'loading') {
    return (
      <div className="landing-scroll safe-top min-h-screen bg-ink-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-ink-border border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  const supabaseEnabled = !!(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  const showPaymentsOfflineBanner = supabaseEnabled && paymentsOnline === false;

  if (supabaseEnabled && studioId === null) {
    return (
      <div className="landing-scroll safe-top min-h-screen bg-ink-bg flex items-center justify-center p-4">
        <p className="text-ink-muted">Studio introuvable.</p>
      </div>
    );
  }

  const studio = studioInfo ?? { name: studioSlug, avatar: '', coverImage: '' };

  return (
    <div className="book-public-root bg-ink-bg">
      <SEO
        title={`Réserver chez ${studio.name}`}
        description={`Prenez rendez-vous en ligne chez ${studio.name}. Choisissez la date, décrivez votre projet et réglez l'acompte en toute sécurité.`}
        canonical={`/book/${studioSlug}`}
        ogImage={(studio.coverImage || studio.avatar) || undefined}
        ogImageAlt={`Réservation tatouage — ${studio.name}`}
        keywords={`réservation tatouage, ${studio.name}, RDV tattoo, acompte tatouage`}
      />

      <a
        href="#book-public-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-30 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-zinc-900 focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ink-accent focus:ring-offset-2 focus:ring-offset-ink-bg"
      >
        Aller au contenu de réservation
      </a>

      <div
        id="book-public-content"
        tabIndex={-1}
        role="region"
        aria-labelledby="booking-studio-title"
        className="book-public-scroll outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink-accent/50"
      >
      <main id="booking-main">
      {studio.coverImage ? (
        <div className="relative w-full h-36 sm:h-44 overflow-hidden bg-zinc-900">
          <img
            src={studio.coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            decoding="async"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black"
            aria-hidden
          />
          <a
            href={`/studio/${studioSlug}`}
            className="absolute left-3 top-[max(0.5rem,env(safe-area-inset-top,0px))] z-10 inline-flex min-h-[44px] max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full bg-black/50 px-3.5 py-2 text-left text-sm font-medium text-white shadow-sm ring-1 ring-white/15 backdrop-blur-md transition-all hover:bg-black/65 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden />
            <span className="leading-tight">Retour à la vitrine</span>
          </a>
        </div>
      ) : null}

      {showPaymentsOfflineBanner && (
        <div
          role="status"
          className="bg-amber-50 border-b border-amber-100/80 px-4 py-3 text-sm text-amber-950"
        >
          <div className="max-w-md mx-auto flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" strokeWidth={2} />
            <div>
              <p className="font-medium text-amber-950">Paiement en ligne indisponible</p>
              <p className="text-amber-900/90 mt-1 text-[13px] leading-snug">
                Ce studio n’a pas encore finalisé Stripe Connect. Vous pouvez envoyer une demande (projet sur mesure)
                ou contacter le studio depuis sa vitrine pour régler l’acompte autrement.
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={`max-w-md mx-auto px-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-10 ${
          !studio.coverImage ? 'pt-[max(1rem,env(safe-area-inset-top,0px))]' : ''
        }`}
      >
        {!studio.coverImage && (
          <nav className="pb-3" aria-label="Navigation vers la vitrine">
            <a
              href={`/studio/${studioSlug}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-1 -ml-1 text-sm font-medium text-ink-muted transition-all hover:text-ink-text active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-bg"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden />
              Retour à la vitrine
            </a>
          </nav>
        )}
        {/* En-tête Tatoueur */}
        <section
          className={`${studio.coverImage ? 'pt-8' : 'pt-2'} pb-6 text-center`}
          aria-describedby="booking-step-hint"
        >
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-zinc-200 border-2 border-white shadow-lg ring-2 ring-zinc-100">
            {studio.avatar ? (
              <img src={studio.avatar} alt={studio.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-10 h-10 text-zinc-400" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <h1 id="booking-studio-title" className="text-2xl font-bold text-ink-text mt-4 tracking-tight">
            {studio.name}
          </h1>
          <p id="booking-step-hint" className="text-ink-muted text-sm mt-1">
            {bookingMode === 'select'
              ? 'Choisissez votre type de prestation'
              : bookingMode === 'project'
              ? 'Demande de projet sur mesure'
              : 'Réservation & Acompte'}
          </p>
          <span
            className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-medium border ${
              showPaymentsOfflineBanner
                ? 'bg-amber-50/90 text-amber-950 border-amber-200/80'
                : 'bg-emerald-50/95 text-emerald-900 border-emerald-200/80'
            }`}
          >
            <Lock
              className={`w-3.5 h-3.5 shrink-0 ${showPaymentsOfflineBanner ? 'text-amber-700' : 'text-emerald-600'}`}
              strokeWidth={1.5}
            />
            {showPaymentsOfflineBanner ? 'Encaissement à activer côté studio' : 'Paiement sécurisé'}
          </span>
        </section>

        {/* — Écran 0 : Sélection Flash / Projet — */}
        {bookingMode === 'select' && (
          <section className="mb-6 space-y-3 sm:space-y-4" aria-label="Type de prestation">
            <button
              type="button"
              onClick={() => {
                setBookingMode('flash');
                setSelectedFlashId(null);
                replaceUrlFlashParam(null);
              }}
              className="group w-full min-h-[100px] rounded-2xl border border-ink-border border-l-[4px] border-l-amber-500 bg-ink-surface p-4 sm:p-5 text-left shadow-sm flex items-stretch gap-3 sm:gap-4 transition-all duration-200 hover:border-ink-accent/40 hover:shadow-md active:scale-[0.99] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-bg"
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 self-center ring-1 ring-amber-500/15"
                aria-hidden
              >
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink-text text-base tracking-tight">Flash</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-amber-800/90 bg-amber-100/90 px-2 py-0.5 rounded-md">
                    Rapide
                  </span>
                </div>
                <p className="text-ink-muted text-sm mt-1.5 leading-relaxed">
                  {showPaymentsOfflineBanner
                    ? 'Créneau et acompte : le studio doit activer Stripe pour payer en ligne.'
                    : "Dessin déjà prêt — créneau + acompte en ligne."}
                </p>
              </div>
              <ChevronRight
                className="w-5 h-5 text-zinc-400 self-center flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                strokeWidth={1.5}
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingMode('project');
                setSelectedFlashId(null);
                replaceUrlFlashParam(null);
              }}
              className="group w-full min-h-[100px] rounded-2xl border border-ink-border border-l-[4px] border-l-violet-500 bg-ink-surface p-4 sm:p-5 text-left shadow-sm flex items-stretch gap-3 sm:gap-4 transition-all duration-200 hover:border-ink-accent/40 hover:shadow-md active:scale-[0.99] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-bg"
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 self-center ring-1 ring-violet-500/15"
                aria-hidden
              >
                <Pencil className="w-6 h-6 sm:w-7 sm:h-7 text-violet-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink-text text-base tracking-tight">
                    Projet sur mesure
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-violet-800/90 bg-violet-100/90 px-2 py-0.5 rounded-md">
                    Sur mesure
                  </span>
                </div>
                <p className="text-ink-muted text-sm mt-1.5 leading-relaxed">
                  Décrivez votre idée — l'artiste répond puis vous propose un créneau.
                </p>
              </div>
              <ChevronRight
                className="w-5 h-5 text-zinc-400 self-center flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                strokeWidth={1.5}
                aria-hidden
              />
            </button>
          </section>
        )}

        {/* — Écran Projet sur mesure — */}
        {bookingMode === 'project' && (
          <>
            {projectSubmitted ? (
              <section className="mb-6 flex flex-col items-center text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-emerald-600" strokeWidth={2} />
                </div>
                <h2 className="text-xl font-bold text-ink-text mb-2">Demande envoyée !</h2>
                <p className="text-ink-muted text-sm max-w-xs">
                  L'artiste va étudier votre projet et vous recontacte avec le tarif et un lien
                  pour choisir votre créneau.
                </p>
                <a
                  href={`/studio/${studioSlug}`}
                  className="mt-6 inline-flex items-center gap-2 text-ink-muted hover:text-ink-text text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                  Retour au studio
                </a>
              </section>
            ) : (
              <section className="space-y-4 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setBookingMode('select');
                    setSelectedFlashId(null);
                    replaceUrlFlashParam(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink-text text-sm mb-2 transition-colors min-h-[44px] rounded-lg px-1 -ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-bg"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.5} aria-hidden />
                  Changer de type
                </button>
                <div className="bg-ink-surface rounded-2xl border border-ink-border p-5">
                  <h2 className="text-sm font-semibold text-ink-text mb-4">
                    Décrivez votre projet
                  </h2>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) =>
                      setProjectForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Style, emplacement, taille, couleurs, idées... Plus c'est précis, mieux l'artiste peut vous répondre."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors resize-none text-sm"
                  />
                  <ReferenceImageUpload
                    value={projectImages}
                    onChange={setProjectImages}
                    variant="light"
                    inputId="ref-upload-project"
                    className="mt-3"
                  />
                </div>
                <div className="bg-ink-surface rounded-2xl border border-ink-border p-5">
                  <h2 className="text-sm font-semibold text-ink-text mb-4">Vos coordonnées</h2>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1.5">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={projectForm.firstName}
                        onChange={(e) =>
                          setProjectForm((f) => ({ ...f, firstName: e.target.value }))
                        }
                        placeholder="Jean"
                        className="w-full px-4 py-3 rounded-xl border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1.5">Nom</label>
                      <input
                        type="text"
                        value={projectForm.lastName}
                        onChange={(e) =>
                          setProjectForm((f) => ({ ...f, lastName: e.target.value }))
                        }
                        placeholder="Dupont"
                        className="w-full px-4 py-3 rounded-xl border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors text-sm"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-ink-muted mb-1.5">Email</label>
                    <input
                      type="email"
                      value={projectForm.email}
                      onChange={(e) => setProjectForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="jean@exemple.com"
                      className="w-full px-4 py-3 rounded-xl border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-ink-muted mb-1.5">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={projectForm.phone}
                      onChange={(e) => setProjectForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="06 12 34 56 78"
                      className="w-full px-4 py-3 rounded-xl border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-ink-muted mb-1.5">
                      <Instagram className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Instagram{' '}
                      <span className="font-normal text-zinc-400">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={projectForm.instagram}
                      onChange={(e) =>
                        setProjectForm((f) => ({ ...f, instagram: e.target.value }))
                      }
                      placeholder="@votre_pseudo"
                      autoComplete="off"
                      className="w-full px-4 py-3 rounded-xl border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors text-sm"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1.5">
                      Pour échanger plus facilement avec l'artiste en message privé.
                    </p>
                  </div>
                </div>
                {projectError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{projectError}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleProjectSubmit}
                  disabled={
                    !projectForm.firstName ||
                    !projectForm.lastName ||
                    !projectForm.email ||
                    !projectForm.description ||
                    projectSubmitting
                  }
                  aria-busy={projectSubmitting}
                  className={`w-full min-h-[56px] rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all ${
                    !projectForm.firstName ||
                    !projectForm.lastName ||
                    !projectForm.email ||
                    !projectForm.description ||
                    projectSubmitting
                      ? 'bg-zinc-200 text-ink-muted cursor-not-allowed'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.99]'
                  }`}
                >
                  {projectSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" strokeWidth={1.5} />
                      Envoyer ma demande
                    </>
                  )}
                </button>
              </section>
            )}
          </>
        )}

        {/* — Flux Flash — */}
        {bookingMode === 'flash' && (
          <>
            {!new URLSearchParams(window.location.search).get('flash') && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setBookingMode('select');
                    setSelectedFlashId(null);
                    replaceUrlFlashParam(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink-text text-sm transition-colors min-h-[44px] rounded-lg px-1 -ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-bg"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.5} aria-hidden />
                  Changer de type
                </button>
              </div>
            )}

            {/* 2. Choix du flash — flow-root + cartes pleine largeur pour éviter l’effondrement de hauteur (aspect-ratio) */}
            <section className="mb-8 relative z-0 isolate">
              <div className="bg-ink-surface rounded-2xl border border-ink-border p-5">
                <h2 className="text-sm font-semibold text-ink-text mb-1">Choisissez un flash</h2>
                <p className="text-xs text-ink-muted mb-4">
                  Prix et acompte selon le design sélectionné.
                </p>
                {flashListLoading ? (
                  <div
                    className="py-12 flex items-center justify-center"
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                    aria-label="Chargement des flashs"
                  >
                    <div className="w-8 h-8 border-2 border-ink-border border-t-zinc-900 rounded-full animate-spin motion-reduce:animate-none" />
                  </div>
                ) : availableFlashes.length === 0 ? (
                  <p className="text-sm text-ink-muted text-center py-8">
                    Aucun flash disponible pour le moment. Revenez plus tard ou contactez le studio.
                  </p>
                ) : (
                  <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 [grid-template-columns:minmax(0,1fr)_minmax(0,1fr)] flow-root pb-1">
                    {availableFlashes.map((flash) => {
                      const isSelected = selectedFlashId === flash.id;
                      const priceLabel =
                        typeof flash.price === 'number'
                          ? `${flash.price.toLocaleString('fr-FR')} €`
                          : '—';
                      return (
                        <button
                          key={flash.id}
                          type="button"
                          aria-pressed={isSelected}
                          aria-label={`${flash.title || 'Flash'}, ${priceLabel}${isSelected ? ', sélectionné' : ''}`}
                          onClick={() => {
                            setSelectedFlashId(flash.id);
                            replaceUrlFlashParam(flash.id);
                          }}
                          className={`group flex w-full min-w-0 flex-col rounded-2xl border text-left transition-all active:scale-[0.99] touch-manipulation shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 ${
                            isSelected
                              ? 'ring-2 ring-emerald-500 border-emerald-500/80 shadow-md'
                              : 'border-ink-border/90 hover:border-ink-accent/50 hover:shadow-md'
                          }`}
                        >
                          {flash.imageUrl ? (
                            <div className="relative w-full min-h-[160px] aspect-[3/4] shrink-0 bg-ink-surface overflow-hidden rounded-2xl">
                              <img
                                src={flash.imageUrl}
                                alt={flash.title || 'Flash'}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                              />
                              <div
                                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                                aria-hidden
                              />
                              {isSelected && (
                                <div
                                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white/90"
                                  aria-hidden
                                >
                                  <Check className="h-4 w-4" strokeWidth={2.5} />
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 p-3 pt-10">
                                <p className="text-[13px] font-semibold leading-snug text-white drop-shadow-md line-clamp-2">
                                  {flash.title || 'Flash'}
                                </p>
                                <p className="mt-1 text-base font-bold tabular-nums tracking-tight text-white drop-shadow-md">
                                  {priceLabel}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl">
                              <div className="relative flex w-full min-h-[160px] aspect-[3/4] shrink-0 items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200/80">
                                <Zap className="h-12 w-12 text-zinc-400" strokeWidth={1.25} />
                                {isSelected && (
                                  <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white">
                                    <Check className="h-4 w-4" strokeWidth={2.5} />
                                  </div>
                                )}
                              </div>
                              <div className="border-t border-ink-border bg-ink-bg/80 p-3">
                                <p className="text-[13px] font-semibold leading-snug text-ink-text line-clamp-2">
                                  {flash.title || 'Flash'}
                                </p>
                                <p className="mt-1 text-base font-bold tabular-nums text-ink-text">
                                  {priceLabel}
                                </p>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Détails du tatouage (emplacement) */}
            {selectedFlash && (
              <section className="mb-6">
                <div className="bg-ink-surface rounded-2xl border border-ink-border p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-ink-surface">
                      <MapPin className="h-5 w-5 text-ink-muted" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-ink-text">Détails du tatouage</h2>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        Indiquez où vous souhaitez ce flash. Le studio validera avec vous si besoin.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="flash-placement"
                      className="block text-xs font-medium text-ink-muted mb-1.5"
                    >
                      Emplacement souhaité <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="flash-placement"
                      value={form.flashPlacementPreset}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          flashPlacementPreset: e.target.value,
                          flashPlacementCustom:
                            e.target.value === PLACEMENT_OTHER_VALUE
                              ? f.flashPlacementCustom
                              : '',
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-ink-border bg-ink-surface text-ink-text text-sm focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors"
                    >
                      <option value="">Choisir une zone…</option>
                      {flashPlacementOptions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                      <option value={PLACEMENT_OTHER_VALUE}>Autre — préciser</option>
                    </select>
                    {form.flashPlacementPreset === PLACEMENT_OTHER_VALUE && (
                      <input
                        type="text"
                        value={form.flashPlacementCustom}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, flashPlacementCustom: e.target.value }))
                        }
                        placeholder="Ex. : flanc droit, derrière l'oreille, haut du dos…"
                        className="mt-2 w-full px-4 py-3 rounded-xl border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors text-sm"
                        autoComplete="off"
                      />
                    )}
                  </div>
                  <div className="mt-4">
                    <label
                      htmlFor="flash-notes"
                      className="block text-xs font-medium text-ink-muted mb-1.5"
                    >
                      Précisions (optionnel)
                    </label>
                    <textarea
                      id="flash-notes"
                      value={form.flashNotes}
                      onChange={(e) => setForm((f) => ({ ...f, flashNotes: e.target.value }))}
                      placeholder="Côté gauche ou droit, taille souhaitée, contraintes médicales, références…"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors resize-none text-sm"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* 3. Disponibilités */}
            <section className="mb-6 relative z-0">
              <div className="bg-ink-surface rounded-2xl border border-ink-border p-5">
                <h2 className="text-sm font-semibold text-ink-text mb-3">Disponibilités</h2>
                {availabilityLoading ? (
                  <div className="py-8 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-ink-border border-t-zinc-900 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        aria-label="Mois précédent"
                        onClick={() =>
                          setCalendarMonth(
                            (p) => new Date(p.getFullYear(), p.getMonth() - 1)
                          )
                        }
                        className="p-2 rounded-lg hover:bg-ink-surface text-ink-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
                      >
                        <ChevronLeft className="w-5 h-5" aria-hidden />
                      </button>
                      <span className="font-semibold text-ink-text text-sm">
                        {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                      </span>
                      <button
                        type="button"
                        aria-label="Mois suivant"
                        onClick={() =>
                          setCalendarMonth(
                            (p) => new Date(p.getFullYear(), p.getMonth() + 1)
                          )
                        }
                        className="p-2 rounded-lg hover:bg-ink-surface text-ink-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
                      >
                        <ChevronRight className="w-5 h-5" aria-hidden />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {WEEKDAYS.map((d) => (
                        <div
                          key={d}
                          className="text-center text-[10px] font-medium text-zinc-400"
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {(() => {
                        const first = new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth(),
                          1
                        );
                        const last = new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() + 1,
                          0
                        );
                        const startPad = first.getDay();
                        const days: (Date | null)[] = [];
                        for (let i = 0; i < startPad; i++) days.push(null);
                        for (let d = 1; d <= last.getDate(); d++)
                          days.push(
                            new Date(
                              calendarMonth.getFullYear(),
                              calendarMonth.getMonth(),
                              d
                            )
                          );
                        return days.map((d, i) => {
                          if (!d) return <div key={`e-${i}`} />;
                          const dateStr = toLocalDateString(d);
                          const isAvailable = availableDates.includes(dateStr);
                          const selected = form.selectedDate === dateStr;
                          return (
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() =>
                                isAvailable &&
                                setForm((f) => ({
                                  ...f,
                                  selectedDate: dateStr,
                                  selectedTime: '',
                                }))
                              }
                              disabled={!isAvailable}
                              className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                                !isAvailable
                                  ? 'text-zinc-300 cursor-not-allowed'
                                  : selected
                                  ? 'bg-zinc-900 text-white'
                                  : 'text-ink-text hover:bg-ink-surface'
                              }`}
                            >
                              {d.getDate()}
                            </button>
                          );
                        });
                      })()}
                    </div>
                    {form.selectedDate && (
                      <div>
                        <p className="text-xs font-medium text-ink-muted mb-2">
                          Créneau horaire
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {availableSlots.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, selectedTime: time }))}
                              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                                form.selectedTime === time
                                  ? 'bg-zinc-900 text-white'
                                  : 'bg-ink-surface text-ink-text hover:bg-zinc-200'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* 4. Vos Coordonnées */}
            <section className="mb-6">
              <div className="bg-ink-surface rounded-2xl border border-ink-border p-5">
                <h2 className="text-sm font-semibold text-ink-text mb-3">Vos coordonnées</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1.5">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      placeholder="Jean"
                      className="w-full px-4 py-3 rounded-xl border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1.5">Nom</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      placeholder="Dupont"
                      className="w-full px-4 py-3 rounded-xl border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors text-sm"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="jean@exemple.com"
                    className="w-full px-4 py-3 rounded-xl border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors text-sm"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="06 12 34 56 78"
                    className="w-full px-4 py-3 rounded-xl border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors text-sm"
                  />
                </div>
                <div className="mt-3">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-ink-muted mb-1.5">
                    <Instagram className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Instagram{' '}
                    <span className="font-normal text-zinc-400">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                    placeholder="@votre_pseudo"
                    autoComplete="off"
                    className="w-full px-4 py-3 rounded-xl border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent focus:ring-1 focus:ring-ink-accent transition-colors text-sm"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1.5">
                    Pour que le studio puisse vous contacter en DM si besoin.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
      </main>
      </div>

      {/* Modal Questionnaire de Santé */}
      {showHealthForm && (
        <div
          className="fixed inset-0 z-[60] bg-ink-bg overflow-y-auto overscroll-contain"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          }}
        >
          <div className="min-h-full px-4 py-4">
            <div className="max-w-lg mx-auto">
              <HealthQuestionnaireForm
                clientName={`${form.firstName} ${form.lastName}`}
                clientEmail={form.email}
                initialData={{
                  clientName: `${form.firstName} ${form.lastName}`,
                  clientInstagram: form.instagram,
                }}
                onComplete={handleHealthFormComplete}
                onBack={() => setShowHealthForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Barre d’action paiement — en flux sous le scroll (plus de fixed = plus de chevauchement) */}
      {bookingMode === 'flash' && !showHealthForm && (
        <footer className="relative z-10 shrink-0 border-t border-ink-border bg-ink-surface shadow-[0_-2px_16px_rgba(0,0,0,0.12)] safe-bottom">
          <div className="max-w-md mx-auto px-4 py-3 sm:py-4">
            {selectedFlash && typeof selectedFlash.price === 'number' && (
              <div className="flex items-center justify-between mb-2 text-xs text-ink-muted">
                <span>Prix du tatouage</span>
                <span className="font-medium text-ink-text">{selectedFlash.price}€</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-ink-muted">Acompte requis</span>
              <span className="text-xl font-bold text-ink-text">
                {depositAmount != null ? `${depositAmount}€` : '—'}
              </span>
            </div>
            {paymentError && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}
            {healthFormCompleted && (
              <div className="mb-3 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                <Check className="w-4 h-4" />
                Questionnaire de santé complété
              </div>
            )}
            <button
              type="button"
              onClick={handlePay}
              disabled={!canPay || isSubmitting}
              aria-busy={isSubmitting}
              className={`w-full min-h-[56px] rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                canPay && !isSubmitting
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.99]'
                  : 'bg-zinc-200 text-ink-muted cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirection vers Stripe...
                </>
              ) : healthFormCompleted ? (
                <>
                  <CreditCard className="w-5 h-5" strokeWidth={1.5} />
                  {depositAmount != null
                    ? `Payer ${depositAmount}€ et Réserver`
                    : 'Choisissez un flash'}
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" strokeWidth={1.5} />
                  {depositAmount != null
                    ? `Questionnaire santé → Payer ${depositAmount}€`
                    : 'Choisissez un flash'}
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[10px] text-zinc-400 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" strokeWidth={1.5} />
              {paymentsOnline === false
                ? 'Stripe Connect requis côté studio pour payer ici.'
                : 'Paiement sécurisé Stripe • Apple Pay • Google Pay'}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};
