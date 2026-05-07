/**
 * Page de réservation publique — /book/:studioSlug
 * Tunnel de conversion Mobile-First, Light Mode, optimisé pour le paiement Stripe.
 */
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useClientFramerGestures } from '../../lib/clientFramerGestures';
import {
  ArrowLeft,
  User,
  Lock,
  ChevronRight,
  CreditCard,
  Check,
  AlertCircle,
  Zap,
  Pencil,
  Users,
  MapPin,
  Instagram,
  FileText,
} from 'lucide-react';
import { ProjectRequestForm } from '../../components/booking/ProjectRequestForm';
import { HealthQuestionnaireForm } from '../../components/booking/HealthQuestionnaireForm';
import { BookingAppInterface480 } from '../../components/booking/BookingAppInterface480';
import { SEO } from '../../components/SEO';
import { FlashCard } from '../../components/ui/FlashCard';
import {
  useBookingFlow,
  replaceUrlFlashParam,
  PLACEMENT_OTHER_VALUE,
} from '../../hooks/useBookingFlow';
import { AnalyticsEvents, captureEvent } from '../../lib/analytics/capture';
import { LANDING_URL } from '../../lib/urls';

interface PublicBookingPageProps {
  studioSlug: string;
}

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({ studioSlug }) => {
  const { tap } = useClientFramerGestures();
  const {
    studioId,
    studioInfo,
    bookingMode,
    setBookingMode,
    selectedFlashId,
    setSelectedFlashId,
    flashListLoading,
    artistContextLocked,
    artistSelectionPending,
    publicArtists,
    needsArtistChoice,
    selectArtist,
    clearArtistSelection,
    availableFlashes,
    selectedFlash,
    flashPlacementOptions,
    resolvedPlacement: _resolvedPlacement,
    depositAmount,
    projectSubmitted,
    projectError,
    setProjectError,
    handleProjectRequestSubmit,
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

  const depositAnalyticsSent = useRef(false);

  useEffect(() => {
    captureEvent(AnalyticsEvents.BOOK_PAGE_VIEWED, {
      studio_slug: studioSlug,
      funnel: 'client_booking',
    });
  }, [studioSlug]);

  useEffect(() => {
    if (paymentVerified !== true || depositAnalyticsSent.current) return;
    depositAnalyticsSent.current = true;
    const sid = studioId && studioId !== 'loading' ? studioId : undefined;
    captureEvent(AnalyticsEvents.CLIENT_BOOKING_DEPOSIT_SUCCEEDED, {
      studio_slug: studioSlug,
      studio_id: sid,
      funnel: 'client_booking',
    });
  }, [paymentVerified, studioId, studioSlug]);

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
        <motion.a
          href={`/studio/${studioSlug}`}
          whileTap={tap}
          className="w-full max-w-xs h-14 flex items-center justify-center rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-colors"
        >
          Retour au studio
        </motion.a>
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
        <motion.a
          href={`/studio/${studioSlug}`}
          whileTap={tap}
          className="w-full max-w-xs h-14 flex items-center justify-center rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-colors"
        >
          Retour au studio
        </motion.a>
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
      <div className="landing-scroll safe-top min-h-screen bg-ink-bg flex flex-col items-center justify-center p-6">
        <SEO
          title="Lien de réservation introuvable | InkFlow"
          description="Ce lien de réservation n’est plus valide ou le studio n’existe pas."
          canonical={`/book/${studioSlug}`}
          noindex
        />
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-zinc-500" strokeWidth={2} aria-hidden />
        </div>
        <h1 className="text-xl font-bold text-ink-text mb-2 text-center">Studio introuvable</h1>
        <p className="text-ink-muted text-center text-sm mb-8 max-w-sm">
          Le lien que vous avez ouvert ne correspond à aucun studio InkFlow. Vérifiez l’URL ou demandez un
          nouveau lien à votre tatoueur.
        </p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <motion.a
            href={LANDING_URL}
            whileTap={tap}
            className="h-14 flex items-center justify-center rounded-xl border border-ink-border bg-white text-ink-text font-semibold hover:bg-zinc-50 transition-colors"
          >
            Découvrir InkFlow
          </motion.a>
          <motion.a
            href="/signup"
            whileTap={tap}
            className="h-14 flex items-center justify-center rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-colors"
          >
            Créer un compte tatoueur
          </motion.a>
        </div>
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
          <motion.a
            href={`/studio/${studioSlug}`}
            whileTap={tap}
            className="absolute left-3 top-[max(0.5rem,env(safe-area-inset-top,0px))] z-10 inline-flex min-h-[44px] max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full bg-black/50 px-3.5 py-2 text-left text-sm font-medium text-white shadow-sm ring-1 ring-white/15 backdrop-blur-md transition-all hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden />
            <span className="leading-tight">Retour à la vitrine</span>
          </motion.a>
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
            <motion.a
              href={`/studio/${studioSlug}`}
              whileTap={tap}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-1 -ml-1 text-sm font-medium text-ink-muted transition-all hover:text-ink-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-bg"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden />
              Retour à la vitrine
            </motion.a>
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
            {artistSelectionPending
              ? 'Avec quel tatoueur souhaitez-vous réserver ?'
              : bookingMode === 'select'
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

        {/* — Étape tatoueur (studios multi-artistes) — */}
        {artistSelectionPending && (
          <section className="mb-8 flex flex-col gap-3" aria-label="Choix du tatoueur">
            <div className="flex flex-col gap-3">
              {publicArtists.map((artist) => (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => selectArtist(artist)}
                  className="group w-full min-h-[88px] rounded-2xl border border-ink-border border-l-[4px] border-l-emerald-500/90 bg-ink-surface p-4 sm:p-5 text-left shadow-sm flex items-center gap-4 transition-all duration-200 hover:border-ink-accent/40 hover:shadow-md active:scale-[0.99] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-bg"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800 border border-ink-border flex-shrink-0 ring-1 ring-white/5">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-7 h-7 text-zinc-500" strokeWidth={1.5} aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-ink-text text-base tracking-tight">{artist.name}</span>
                    <p className="text-ink-muted text-xs mt-1">Réserver avec ce tatoueur</p>
                  </div>
                  <ChevronRight
                    className="w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* — Écran 0 : Sélection Flash / Projet — */}
        {!artistSelectionPending && bookingMode === 'select' && (
          <section className="mb-6 flex flex-col gap-3 sm:gap-4" aria-label="Type de prestation">
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
        {!artistSelectionPending && bookingMode === 'project' && (
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
              <section className="mb-6 flex flex-col gap-4">
                <div className="flex flex-wrap gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode('select');
                      setSelectedFlashId(null);
                      replaceUrlFlashParam(null);
                      setProjectError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink-text text-sm transition-colors min-h-[44px] rounded-lg px-1 -ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-bg"
                  >
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5} aria-hidden />
                    Changer de type
                  </button>
                  {needsArtistChoice && (
                    <button
                      type="button"
                      onClick={clearArtistSelection}
                      className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink-text text-sm transition-colors min-h-[44px] rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-bg"
                    >
                      <Users className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden />
                      Changer de tatoueur
                    </button>
                  )}
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6 dark:border-neutral-700 dark:bg-neutral-950">
                  {projectError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-800 text-sm flex items-start gap-2 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-200">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
                      <span>{projectError}</span>
                    </div>
                  )}
                  <ProjectRequestForm
                    studioId={studioId === 'loading' ? null : studioId}
                    onSubmit={handleProjectRequestSubmit}
                    onCancel={() => {
                      setBookingMode('select');
                      setSelectedFlashId(null);
                      replaceUrlFlashParam(null);
                      setProjectError(null);
                    }}
                    submitLabel="Envoyer ma demande"
                    referenceInputId="project-ref-book"
                  />
                </div>
              </section>
            )}
          </>
        )}

        {/* — Flux Flash — */}
        {!artistSelectionPending && bookingMode === 'flash' && (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {!new URLSearchParams(window.location.search).get('flash') && (
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
              )}
              {needsArtistChoice && (
                <button
                  type="button"
                  onClick={clearArtistSelection}
                  className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink-text text-sm transition-colors min-h-[44px] rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-bg"
                >
                  <Users className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden />
                  Changer de tatoueur
                </button>
              )}
            </div>

            {/* 2. Choix du flash — flow-root + cartes pleine largeur pour éviter l’effondrement de hauteur (aspect-ratio) */}
            <section className="mb-8 relative z-0 isolate">
              <div className="bg-ink-surface rounded-2xl border border-ink-border p-5">
                <h2 className="text-sm font-semibold text-ink-text mb-1">Choisissez un flash</h2>
                <p className="text-xs text-ink-muted mb-4">
                  Prix et acompte selon le design sélectionné.
                </p>
                {flashListLoading || artistContextLocked ? (
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
                    {needsArtistChoice
                      ? 'Aucun flash listé pour ce tatoueur pour le moment. Essayez un autre artiste ou contactez le studio.'
                      : 'Aucun flash disponible pour le moment. Revenez plus tard ou contactez le studio.'}
                  </p>
                ) : (
                  <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 [grid-template-columns:minmax(0,1fr)_minmax(0,1fr)] flow-root pb-1">
                    {availableFlashes.map((flash) => {
                      const isSelected = selectedFlashId === flash.id;
                      return (
                        <FlashCard
                          key={flash.id}
                          variant="booking"
                          title={flash.title || 'Flash'}
                          imageUrl={flash.imageUrl}
                          price={flash.price}
                          durationMinutes={flash.durationMinutes}
                          available={flash.available}
                          selected={isSelected}
                          onClick={() => {
                            setSelectedFlashId(flash.id);
                            replaceUrlFlashParam(flash.id);
                          }}
                        />
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
              {availabilityLoading ? (
                <div className="py-8 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-ink-border border-t-zinc-900 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="bg-white rounded-[22px] border border-[#e0e0e8] overflow-hidden shadow-[0px_20px_25px_rgba(0,0,0,0.1),0px_8px_10px_rgba(0,0,0,0.1)]">
                  <BookingAppInterface480
                    title="Réserver"
                    subtitle={`Choisis un créneau pour ${studio.name}`}
                    calendarMonth={calendarMonth}
                    onPrevMonth={() =>
                      setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1))
                    }
                    onNextMonth={() =>
                      setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1))
                    }
                    availableDates={availableDates}
                    selectedDate={form.selectedDate}
                    onSelectDate={(dateStr) =>
                      setForm((f) => ({ ...f, selectedDate: dateStr, selectedTime: '' }))
                    }
                    availableSlots={form.selectedDate ? availableSlots : []}
                    selectedTime={form.selectedTime}
                    onSelectTime={(time) => setForm((f) => ({ ...f, selectedTime: time }))}
                    recap={{
                      durationLabel: '2h',
                      depositLabel: depositAmount != null ? `${depositAmount}€` : '—',
                      totalLabel:
                        selectedFlash && typeof selectedFlash.price === 'number'
                          ? `${selectedFlash.price}€`
                          : '—',
                    }}
                    onContinue={() => {
                      document.getElementById('booking-contact')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }}
                    continueDisabled={!form.selectedDate || !form.selectedTime}
                  />
                </div>
              )}
            </section>

            {/* 4. Vos Coordonnées */}
            <section id="booking-contact" className="mb-6">
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
            <motion.button
              type="button"
              onClick={handlePay}
              disabled={!canPay || isSubmitting}
              aria-busy={isSubmitting}
              whileTap={canPay && !isSubmitting ? tap : undefined}
              className={`w-full min-h-[56px] rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                canPay && !isSubmitting
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800'
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
            </motion.button>
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
