import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  MapPin, Phone, Mail, Clock, Instagram, CheckCircle, Star,
  MessageCircle, Share2, Heart, Award, Shield, Users, Camera, X,
  Facebook, ExternalLink, Calendar, ArrowRight, Menu,
  ChevronDown, Send, AlertCircle, Sparkles, Copy, ArrowLeft
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { ProjectRequestForm } from '../../components/booking/ProjectRequestForm';
import { VitrineBookingForm } from '../../components/booking/VitrineBookingForm';
import { getVitrineData, getVitrineDataBySlugAsync } from '../../lib/vitrineStorage';
import { getStudioIdBySlug } from '../../lib/supabaseDashboard';
import { SEO, createTattooStudioSchema } from '../../components/SEO';
import { createProjectRequest } from '../../lib/supabaseProjectRequests';
import { createCheckoutSession } from '../../lib/stripeClient';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { recordVitrineChannelView } from '../../lib/studioPublicMetrics';
import { useRealtimeVitrine } from '../../hooks/useRealtimeSync';
import { useToast } from '../../contexts/ToastContext';
import type { VitrineData, VitrineFlashDesign } from '../../types/vitrine';
import type { ProjectRequestFormData } from '../../types';
import { DemoTour, type TourStep } from '../../components/demo/DemoTour';
import { LANDING_URL, LANDING_TERMS_URL, LANDING_PRIVACY_URL, safeExternalHttpUrl } from '../../lib/urls';
import { getVitrineTheme } from '../../lib/themes';
import { StudioThemeRouter } from '../../components/studio-themes/StudioThemeRouter';
import { GoogleReviews } from '../../components/vitrine/GoogleReviews';
import { VitrineScrollReveal } from '../../components/vitrine/VitrineScrollReveal';
import { fetchPublicGoogleReviews, fetchBusinessPublicReviews } from '../../lib/googlePlaces';
import type { GoogleReviewsPayload } from '../../types/googlePlaces';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
const STRUCTURAL_THEMES = ['classic', 'split', 'vintage'] as const;

const ICON_MAP = { sparkles: Sparkles, award: Award, star: Star, camera: Camera, shield: Shield, heart: Heart, users: Users };

type VitrineHeadingIcon = React.ComponentType<{ className?: string; strokeWidth?: number }>;

/** En-tête de section vitrine « Pinterest » : pas de pastille colorée, typo éditoriale. */
function VitrineSectionHeading({
  eyebrow,
  title,
  icon: Icon,
  action,
}: {
  eyebrow: string;
  title: string;
  icon: VitrineHeadingIcon;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 sm:mb-10 border-b border-neutral-200/70 pb-5 sm:pb-6">
      <div className="flex items-center gap-2 text-neutral-400 mb-1.5">
        <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em]">{eyebrow}</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between gap-x-4 gap-y-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight min-w-0">{title}</h2>
        {action != null && action !== false ? <div className="shrink-0 flex sm:justify-end">{action}</div> : null}
      </div>
    </header>
  );
}

const VITRINE_GUIDE_STEPS: TourStep[] = [
  { target: '[data-joyride="vitrine-hero"]', title: 'Bienvenue sur votre vitrine', content: "Voici exactement ce que voient vos clients : votre photo, nom du studio, note et avis, adresse. Tout est modifiable depuis Paramètres > Vitrine dans le dashboard." },
  { target: '[data-joyride="vitrine-reserver"]', title: 'Bouton Réserver', content: "Le CTA principal. Les clients cliquent ici pour choisir un créneau et prendre RDV. En production, ils sont redirigés vers votre calendrier de réservation." },
  { target: '[data-joyride="vitrine-coordonnees"]', title: 'Adresse et horaires', content: "L'emplacement du studio et les horaires d'ouverture sont affichés ici. Modifiables depuis le dashboard. Le jour actuel est mis en évidence (ex. Lundi 10h-19h)." },
  { target: '[data-joyride="vitrine-portfolio"]', title: 'Portfolio détaillé', content: "Vos réalisations avec catégorie, description, artiste et nombre de likes. Au survol, le client voit tout. Ajoutez vos photos depuis le dashboard (Portfolio) pour montrer votre style." },
  { target: '[data-joyride="vitrine-flash"]', title: 'Galerie Flash', content: "Vos flashs disponibles à la réservation. Chaque design affiche prix, durée, emplacements suggérés. En cliquant, le client ouvre la fiche de réservation avec paiement de l'acompte." },
  { target: '[data-joyride="vitrine-flash-modal"]', title: 'Réservation et acompte', content: "Le client saisit ses coordonnées et paie l'acompte en ligne (Stripe). Son RDV est bloqué à son nom. Une fois payé : email de confirmation au client, notification au tatoueur. Il peut aussi demander un créneau sans payer tout de suite." },
];

interface PublicStudioPageProProps {
  studioSlug: string;
}

export const PublicStudioPagePro: React.FC<PublicStudioPageProProps> = ({ studioSlug }) => {
  const toast = useToast();
  /** Le scroll de la vitrine se fait dans `.landing-scroll` (fixed + overflow), pas sur `window`. */
  const landingScrollRef = useRef<HTMLDivElement>(null);
  const [studio, setStudio] = useState<VitrineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFlash, setSelectedFlash] = useState<VitrineFlashDesign | null>(null);
  const [activeSection, setActiveSection] = useState('about');
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [showProjectRequestForm, setShowProjectRequestForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingStudioId, setBookingStudioId] = useState<string | null>(null);
  /** Résolu tôt pour l’upload des images « demande de projet » (même bucket que réservations). */
  const [projectRequestStudioId, setProjectRequestStudioId] = useState<string | null>(null);
  /** Évite de confondre « pas encore résolu » et « aucun studio en base » (slug invalide / RLS). */
  const [studioRecordResolved, setStudioRecordResolved] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [flashDepositName, setFlashDepositName] = useState('');
  const [flashDepositEmail, setFlashDepositEmail] = useState('');
  const [flashDepositAcceptTerms, setFlashDepositAcceptTerms] = useState(false);
  const [flashDepositLoading, setFlashDepositLoading] = useState(false);
  const [flashDepositError, setFlashDepositError] = useState<string | null>(null);
  const [flashDepositUrl, setFlashDepositUrl] = useState<string | null>(null);
  const [runVitrineTour, setRunVitrineTour] = useState(false);
  const [vitrineStepIndex, setVitrineStepIndex] = useState(0);
  const [googleReviewsPayload, setGoogleReviewsPayload] = useState<GoogleReviewsPayload | null>(null);
  /** Favori navigateur (localStorage) — même slug = même préférence sur l’appareil */
  const [studioFavorite, setStudioFavorite] = useState(false);
  const activeTheme = getVitrineTheme(studio?.theme ?? 'light') ?? getVitrineTheme('light')!;
  const primaryColor = activeTheme?.accentColor ?? '#171717';
  const vitrineReduce = useReducedMotion();
  const vitrineTap = vitrineReduce ? undefined : { scale: 0.98 };
  const vitrineTapSoft = vitrineReduce ? undefined : { scale: 0.99 };

  const loadVitrine = React.useCallback(() => {
    setLoading(true);
    getVitrineDataBySlugAsync(studioSlug)
      .then((data) => {
        setStudio(data);
      })
      .catch(() => {
        setStudio(getVitrineData(studioSlug));
      })
      .finally(() => setLoading(false));
  }, [studioSlug]);

  useEffect(() => {
    loadVitrine();
  }, [loadVitrine]);

  useEffect(() => {
    try {
      setStudioFavorite(localStorage.getItem(`inkflow-vitrine-fav-${studioSlug}`) === '1');
    } catch {
      setStudioFavorite(false);
    }
  }, [studioSlug]);

  useEffect(() => {
    let cancelled = false;
    setStudioRecordResolved(false);
    if (!isSupabaseConfigured()) {
      setProjectRequestStudioId(null);
      setStudioRecordResolved(true);
      return () => {
        cancelled = true;
      };
    }
    getStudioIdBySlug(studioSlug).then((id) => {
      if (!cancelled) {
        setProjectRequestStudioId(id ?? null);
        setStudioRecordResolved(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [studioSlug]);

  const vitrineViewRecordedRef = useRef(false);
  useEffect(() => {
    vitrineViewRecordedRef.current = false;
  }, [studioSlug]);
  useEffect(() => {
    if (!projectRequestStudioId || !isSupabaseConfigured()) return;
    if (vitrineViewRecordedRef.current) return;
    vitrineViewRecordedRef.current = true;
    recordVitrineChannelView(projectRequestStudioId);
  }, [projectRequestStudioId]);

  useEffect(() => {
    let cancelled = false;
    const slug = (studio?.slug ?? studioSlug).trim().toLowerCase();
    if (!slug) return;

    // Priorité 1 : avis Google Business Profile (compte OAuth connecté — illimité)
    // Priorité 2 : avis Places API (5 max, via google_place_id)
    fetchBusinessPublicReviews(slug).then((biz) => {
      if (cancelled) return;
      if (biz?.configured && biz.reviews.length > 0) {
        setGoogleReviewsPayload({
          rating: biz.averageRating,
          userRatingsTotal: biz.totalReviewCount,
          reviews: biz.reviews.map((r) => ({
            authorName: r.authorName,
            rating: r.rating,
            text: r.text,
            relativeTimeDescription: r.relativeTimeDescription,
          })),
        });
        return;
      }
      // Fallback Places API
      fetchPublicGoogleReviews(slug).then((res) => {
        if (cancelled || !res || !res.configured) {
          if (!cancelled) setGoogleReviewsPayload(null);
          return;
        }
        if (!cancelled) {
          setGoogleReviewsPayload({
            rating: res.rating,
            userRatingsTotal: res.userRatingsTotal,
            reviews: res.reviews,
          });
        }
      });
    }).catch(() => {
      // Fallback Places API si Business Profile échoue
      if (cancelled) return;
      fetchPublicGoogleReviews(slug).then((res) => {
        if (cancelled || !res || !res.configured) { if (!cancelled) setGoogleReviewsPayload(null); return; }
        if (!cancelled) setGoogleReviewsPayload({ rating: res.rating, userRatingsTotal: res.userRatingsTotal, reviews: res.reviews });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [studio?.slug, studioSlug]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadVitrine();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [loadVitrine]);

  useRealtimeVitrine(studioSlug, setStudio);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'cancelled') {
      toast.info('Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.');
      window.history.replaceState({}, '', `/studio/${studioSlug}`);
    }
  }, [studioSlug, toast]);

  useEffect(() => {
    if (studioSlug !== 'demo') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('guide') === '1') {
      const timer = setTimeout(() => setRunVitrineTour(true), 800);
      return () => clearTimeout(timer);
    }
  }, [studioSlug]);

  useEffect(() => {
    if (selectedFlash) {
      setFlashDepositName('');
      setFlashDepositEmail('');
      setFlashDepositAcceptTerms(false);
      setFlashDepositError(null);
      setFlashDepositUrl(null);
    }
  }, [selectedFlash]);

  useEffect(() => {
    const modalOpen =
      showProjectRequestForm ||
      showBookingForm ||
      showContactForm ||
      selectedFlash != null ||
      selectedImage != null;
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showProjectRequestForm) setShowProjectRequestForm(false);
      else if (showBookingForm) setShowBookingForm(false);
      else if (showContactForm) setShowContactForm(false);
      else if (selectedFlash) setSelectedFlash(null);
      else if (selectedImage) setSelectedImage(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    showProjectRequestForm,
    showBookingForm,
    showContactForm,
    selectedFlash,
    selectedImage,
  ]);

  useEffect(() => {
    const scroller = landingScrollRef.current;
    if (!scroller) return;

    const sections =
      studio?.showServicesSection === false
        ? ['about', 'artists', 'portfolio', 'flash', 'testimonials', 'faq']
        : ['about', 'services', 'artists', 'portfolio', 'flash', 'testimonials', 'faq'];

    const handleScroll = () => {
      setHeaderScrolled(scroller.scrollTop > 100);
      const anchorY = scroller.getBoundingClientRect().top + 120;
      let current = sections[0];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= anchorY) current = id;
      }
      setActiveSection(current);
    };

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, [studio?.showServicesSection, loading, studio]);

  const studioDisplay = useMemo(() => {
    if (!studio) return null;
    return {
      ...studio,
      services: studio.services.map(s => ({ ...s, icon: ICON_MAP[s.icon] || Sparkles })),
      whyChooseUs: studio.whyChooseUs.map(w => ({ ...w, icon: ICON_MAP[w.icon] || Award }))
    };
  }, [studio]);

  useEffect(() => {
    if (studioSlug !== 'demo' || !runVitrineTour || !studio) return;
    if (vitrineStepIndex >= 4) {
      const firstAvailable = studio.flashDesigns?.find((f) => f.available) ?? studio.flashDesigns?.[0];
      if (firstAvailable) {
        const timer = setTimeout(() => setSelectedFlash(firstAvailable), vitrineStepIndex === 4 ? 400 : 0);
        return () => clearTimeout(timer);
      }
    } else {
      setSelectedFlash(null);
    }
  }, [studioSlug, runVitrineTour, vitrineStepIndex, studio]);

  /** Lien Maps public : URL fiche Google (paramètres) ou recherche Maps sur l’adresse du studio */
  const publicGoogleMapsHref = useMemo(() => {
    const custom = safeExternalHttpUrl(studio?.googleBusinessUrl ?? '');
    if (custom) return custom;
    const addr = (studio?.address ?? '').trim();
    if (!addr) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  }, [studio?.googleBusinessUrl, studio?.address]);

  const navSections = useMemo(() => {
    const all = [
      { id: 'about', label: 'À propos' },
      { id: 'services', label: 'Services' },
      { id: 'artists', label: 'Artistes' },
      { id: 'portfolio', label: 'Portfolio' },
      { id: 'flash', label: 'Flash' },
      { id: 'testimonials', label: 'Avis' },
    ];
    if (studio?.showServicesSection === false) return all.filter((s) => s.id !== 'services');
    return all;
  }, [studio?.showServicesSection]);

  const handleProjectRequestSubmit = async (data: ProjectRequestFormData) => {
    const studioId = projectRequestStudioId ?? (await getStudioIdBySlug(studioSlug));
    if (!studioId) {
      toast.error('Ce studio n\'est pas encore configuré. Contactez-nous directement.');
      return;
    }
    try {
      await createProjectRequest(data, studioId);
      setRequestSuccess(true);
      setShowProjectRequestForm(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Une erreur est survenue. Réessayez.';
      toast.error(msg);
    }
  };

  const openBookingForm = async () => {
    setBookingError(null);
    setBookingStudioId(null);
    setShowBookingForm(true);
    try {
      const id = await getStudioIdBySlug(studioSlug);
      if (!id) {
        setBookingError('Studio introuvable. Contactez-nous directement.');
      }
      setBookingStudioId(id ?? null);
    } catch {
      setBookingError('Impossible de charger le formulaire. Réessayez.');
    }
  };

  const handleBookingSuccess = () => {
    setBookingSuccess(true);
    setShowBookingForm(false);
    setBookingError(null);
  };

  const handleFlashDepositPayment = async () => {
    if (!selectedFlash?.available) return;
    const name = flashDepositName.trim();
    const email = flashDepositEmail.trim();
    if (!name || !email) {
      setFlashDepositError('Veuillez renseigner votre nom et votre email.');
      return;
    }
    setFlashDepositError(null);
    setFlashDepositLoading(true);
    try {
      const studioId = await getStudioIdBySlug(studioSlug);
      if (!studioId) {
        setFlashDepositError('Studio introuvable. Réessayez plus tard.');
        setFlashDepositLoading(false);
        return;
      }
      /** Aligné sur create-checkout-session (flash sans RDV) : deposit_amount en base, sinon 30 % (min 10 € si prix > 0, sinon 30 €). */
      const da = (selectedFlash as { depositAmount?: number }).depositAmount;
      const price = selectedFlash.price ?? 0;
      const amount =
        da != null && da > 0
          ? da
          : price > 0
            ? Math.max(Math.round((price * 30) / 100), 10)
            : 30;
      let clientPortalUserId: string | undefined;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id) clientPortalUserId = session.user.id;
      } catch {
        /* non connecté */
      }
      const result = await createCheckoutSession({
        studioId,
        studioSlug,
        appointmentId: '',
        flashId: selectedFlash.id,
        amount,
        clientName: name,
        clientEmail: email,
        serviceName: selectedFlash.title,
        type: 'deposit',
        ...(clientPortalUserId ? { clientPortalUserId } : {}),
      });
      if ('url' in result && result.url) {
        setFlashDepositUrl(result.url);
        try {
          window.location.href = result.url;
        } catch {
          // Redirection bloquée : le lien est affiché dans la modale
        }
        return;
      }
      setFlashDepositError('error' in result ? result.error : 'Impossible de créer la session de paiement.');
    } catch (err) {
      setFlashDepositError(err instanceof Error ? err.message : 'Erreur lors du paiement.');
    } finally {
      setFlashDepositLoading(false);
    }
  };

  const handleContactSubmit = async () => {
    setContactLoading(true);
    try {
      const studioId = await getStudioIdBySlug(studioSlug);
      if (!studioId) {
        toast.error('Studio introuvable. Contactez-nous directement.');
        return;
      }
      const descriptionParts = [contactSubject ? `Sujet: ${contactSubject}` : '', contactPhone ? `Téléphone: ${contactPhone}` : '', contactMessage].filter(Boolean);
      await createProjectRequest(
        {
          clientName: contactName.trim(),
          clientEmail: contactEmail.trim(),
          description: descriptionParts.join('\n\n'),
        },
        studioId
      );
      setRequestSuccess(true);
      setShowContactForm(false);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactSubject('');
      setContactMessage('');
    } catch {
      toast.error('Une erreur est survenue. Réessayez.');
    } finally {
      setContactLoading(false);
    }
  };

  /** Navigation SPA explicite — garantit que les liens Réserver / book fonctionnent. */
  const navigateTo = (path: string) => {
    const full = path.startsWith('http') ? path : `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
    if (full.startsWith(window.location.origin)) {
      const url = new URL(full);
      const targetPath = url.pathname + url.search;
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new CustomEvent('inkflow-navigate'));
    } else {
      window.location.href = full;
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sectionId);
    setShowMobileMenu(false);
  };

  const shareStudio = async () => {
    if (!studioDisplay) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: studioDisplay.name, text: studioDisplay.tagline, url: window.location.href });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papier !');
    }
  };

  const toggleStudioFavorite = () => {
    const next = !studioFavorite;
    setStudioFavorite(next);
    try {
      const key = `inkflow-vitrine-fav-${studioSlug}`;
      if (next) localStorage.setItem(key, '1');
      else localStorage.removeItem(key);
    } catch { /* quota / private mode */ }
    toast.success(next ? 'Studio enregistré dans vos favoris sur cet appareil' : 'Retiré de vos favoris');
  };

  const getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const isOpen = () => {
    if (!studioDisplay) return false;
    const currentDay = getCurrentDay();
    const hours = studioDisplay.openingHours?.[currentDay as keyof typeof studioDisplay.openingHours];
    if (!hours || hours.closed) return false;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const openParts = (hours.open ?? '').split(':').map(Number);
    const closeParts = (hours.close ?? '').split(':').map(Number);
    if (openParts.length < 2 || closeParts.length < 2) return false;
    const openTime = openParts[0] * 60 + openParts[1];
    const closeTime = closeParts[0] * 60 + closeParts[1];
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const dayLabels: Record<string, string> = {
    monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi',
    friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche'
  };

  const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  /** Attendre la RPC slug avant d’afficher une vitrine (sinon template par défaut puis « introuvable »). */
  const awaitingPublicSlugResolution =
    isSupabaseConfigured() && studioSlug !== 'demo' && !studioRecordResolved;

  const studioMissingInSupabase =
    isSupabaseConfigured() &&
    studioSlug !== 'demo' &&
    studioRecordResolved &&
    projectRequestStudioId === null;

  if (loading || !studioDisplay || awaitingPublicSlugResolution) {
    return (
      <div className="landing-scroll min-h-[100dvh] bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 space-y-8 animate-pulse motion-reduce:animate-none">
          <div className="h-[50vh] sm:h-[55vh] rounded-2xl bg-neutral-200/90" aria-hidden />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 w-48 rounded-lg bg-neutral-200" aria-hidden />
              <div className="h-24 rounded-xl bg-neutral-100 border border-neutral-200/80" aria-hidden />
              <div className="h-40 rounded-xl bg-neutral-100 border border-neutral-200/80" aria-hidden />
            </div>
            <div className="h-64 rounded-xl bg-neutral-100 border border-neutral-200/80" aria-hidden />
          </div>
          <p className="text-center text-sm font-medium text-neutral-500">Chargement de la vitrine…</p>
        </div>
      </div>
    );
  }

  if (studioMissingInSupabase) {
    return (
      <div className="landing-scroll min-h-[100dvh] bg-neutral-50 flex flex-col items-center justify-center px-4 py-16">
        <AlertCircle className="w-12 h-12 text-amber-600 mb-4 shrink-0" aria-hidden />
        <h1 className="text-xl font-semibold text-neutral-900 text-center">Studio introuvable</h1>
        <p className="text-sm text-neutral-600 text-center max-w-md mt-2">
          Ce lien ne correspond à aucun studio InkFlow. Vérifiez l’URL ou que le slug en base correspond bien (casse, tirets). En développement, ouvrez la console : les appels{' '}
          <code className="text-xs bg-neutral-200/80 px-1 rounded">get_studio_public_by_slug</code> sont tracés.
        </p>
        <a
          href={LANDING_URL}
          className="mt-6 text-sm font-medium text-neutral-900 underline-offset-2 hover:underline active:scale-[0.98] transition-all"
        >
          Retour à l’accueil
        </a>
      </div>
    );
  }

  // Route structural themes (classic, split, vintage) to their dedicated layout components
  if (studio && STRUCTURAL_THEMES.includes(studio.theme as typeof STRUCTURAL_THEMES[number])) {
    return <StudioThemeRouter data={studio} fallback={null} googleReviews={googleReviewsPayload} />;
  }

  const studioName = studioDisplay.name?.trim() || studioSlug.replace(/-/g, ' ');
  const heroCover = (studioDisplay.coverImage || '').trim();
  const heroAvatar = (studioDisplay.avatar || '').trim();
  const studioSchema = createTattooStudioSchema({
    name: studioDisplay.name,
    description: studioDisplay.description || studioDisplay.tagline,
    address: studioDisplay.address || '',
    city: studioDisplay.address?.split(',').pop()?.trim() || '',
    postalCode: '',
    image: studioDisplay.coverImage || studioDisplay.avatar,
    slug: studioSlug,
  });

  const vitrineBookingCard = (
    <Card
      size="sm"
      className="gap-0 border border-neutral-200/80 bg-white text-neutral-900 shadow-sm ring-0 rounded-2xl py-0 sm:max-w-none"
    >
      <CardHeader className="border-0 pt-4 pb-2 sm:pt-6 sm:pb-3 md:px-8 md:pt-8">
        <CardTitle className="text-xl sm:text-2xl font-bold text-neutral-900">Réserver</CardTitle>
        <CardDescription className="text-sm text-neutral-800">
          Réservez votre session en quelques clics
        </CardDescription>
        <CardAction>
          <Badge
            className={cn(
              'h-6 gap-1.5 border-0 pl-1.5 text-xs font-semibold',
              isOpen() ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
            )}
          >
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                isOpen() ? 'animate-pulse bg-emerald-500' : 'bg-red-500'
              )}
              aria-hidden
            />
            {isOpen() ? 'Ouvert' : 'Fermé'}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0 pb-6 sm:px-4 md:px-8">
        <Button
          asChild
          size="lg"
          className="h-auto min-h-11 w-full rounded-lg border-0 bg-[var(--vitrine-primary)] py-3.5 text-base font-semibold text-white hover:opacity-90"
        >
          <a
            href={`/book/${studioSlug}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigateTo(`/book/${studioSlug}`);
            }}
          >
            Prendre rendez-vous
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-11 w-full rounded-lg border-neutral-300 py-3 text-base font-medium"
          onClick={() => setShowProjectRequestForm(true)}
        >
          Demande de projet
        </Button>
        <Button
          type="button"
          className="h-auto min-h-11 w-full rounded-lg border-0 bg-neutral-900 py-3 text-base font-medium text-white hover:bg-neutral-800"
          onClick={openBookingForm}
        >
          Créneau sur mesure
        </Button>
        <ul className="mt-1 flex list-none flex-col gap-3 p-0" role="list">
          {[
            { icon: CheckCircle, text: 'Confirmation instantanée', color: 'text-neutral-600' },
            { icon: Shield, text: 'Paiement sécurisé', color: 'text-neutral-600' },
            { icon: Calendar, text: 'Rappels automatiques', color: 'text-neutral-600' },
            { icon: Award, text: 'Retouche incluse', color: 'text-neutral-600' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.text} className="flex items-center gap-3">
                <Icon className={cn('size-5 shrink-0', item.color)} aria-hidden />
                <span className="text-sm font-medium text-neutral-800">{item.text}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col gap-1 border-t border-neutral-200 py-4 text-center text-sm text-neutral-800 sm:px-4 md:px-8">
        <p>Besoin d&apos;aide ?</p>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-base font-semibold text-neutral-900 underline-offset-2 hover:underline"
          onClick={() => setShowContactForm(true)}
        >
          Contactez-nous
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div
      ref={landingScrollRef}
      className={`landing-scroll relative min-h-[100dvh] ${activeTheme?.containerClasses ?? 'bg-neutral-50'}`}
      style={{ ['--vitrine-primary' as string]: primaryColor }}
    >
      <SEO
        title={`${studioName} | Tatoueur & Prise de RDV - InkFlow`}
        description={`Découvrez les flashs et prenez rendez-vous avec ${studioName}. Réservez votre prochain tatouage facilement en ligne.`}
        canonical={`/studio/${studioSlug}`}
        ogImage={heroCover || heroAvatar}
        ogImageAlt={`Vitrine ${studioName} — studio de tatouage sur InkFlow`}
        keywords={`${studioName}, tatoueur, réservation tatouage, studio tattoo, InkFlow`}
        schema={studioSchema}
      />
      <a
        href="#contenu-vitrine"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-neutral-900 focus:text-white focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-900"
      >
        Aller au contenu
      </a>
      {/* Sticky Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-top border-b border-neutral-200/60 ${headerScrolled ? 'bg-[#f7f7f5]/95 backdrop-blur-md shadow-sm' : 'bg-[#f7f7f5]/90 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              {studioSlug === 'demo' && (
                <a href={LANDING_URL} className="flex items-center gap-2 px-3 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors text-sm font-medium">
                  <ArrowLeft className="w-4 h-4" />
                  Retour à l&apos;accueil
                </a>
              )}
              <Logo />
              <div className="hidden sm:block min-w-0">
                <div className="font-bold text-lg text-black truncate">{studioDisplay.name || studioName}</div>
                {studioDisplay.tagline?.trim() ? (
                  <div className="text-xs text-neutral-700 truncate">{studioDisplay.tagline}</div>
                ) : null}
              </div>
            </div>
            <nav className="hidden lg:flex items-center gap-8" aria-label="Sections de la page">
              {navSections.map(section => (
                <button key={section.id} type="button" onClick={() => scrollToSection(section.id)}
                  className={`text-sm font-medium transition-all relative group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 ${activeSection === section.id ? 'text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'}`}>
                  {section.label}
                  <span className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-neutral-900 transition-transform ${activeSection === section.id ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} aria-hidden />
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <motion.button type="button" onClick={shareStudio} aria-label="Partager la page" whileTap={vitrineTap} className="hidden md:flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2">
                <Share2 className="w-5 h-5" aria-hidden />
              </motion.button>
              <motion.button type="button" onClick={() => setShowContactForm(true)} whileTap={vitrineTap} className="hidden md:flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2">
                <MessageCircle className="w-5 h-5" aria-hidden />
                <span className="text-sm font-medium">Contact</span>
              </motion.button>
              <motion.a href={`/book/${studioSlug}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigateTo(`/book/${studioSlug}`); }} data-joyride="vitrine-reserver" whileTap={vitrineTap} className="bg-[var(--vitrine-primary)] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 text-sm sm:text-base min-h-[44px] items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" aria-hidden />
                <span>Réserver</span>
              </motion.a>
              <motion.button type="button" onClick={() => setShowMobileMenu(!showMobileMenu)} aria-expanded={showMobileMenu} aria-controls="vitrine-mobile-nav" aria-label={showMobileMenu ? 'Fermer le menu' : 'Ouvrir le menu'} whileTap={vitrineTap} className="lg:hidden p-2 text-neutral-700 hover:bg-neutral-100 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2">
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
          {showMobileMenu && (
            <div id="vitrine-mobile-nav" className="lg:hidden py-4 border-t border-neutral-200">
              <nav className="space-y-1" aria-label="Navigation mobile">
                {navSections.map(section => (
                  <button key={section.id} type="button" onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium min-h-[44px] flex items-center ${activeSection === section.id ? 'bg-neutral-900 text-white' : 'text-neutral-800 hover:bg-neutral-100'}`}>
                    {section.label}
                  </button>
                ))}
                <div className="border-t border-neutral-200 mt-2 pt-2 flex gap-2">
                  <button onClick={() => { shareStudio(); setShowMobileMenu(false); }} className="flex-1 px-4 py-3 rounded-lg font-medium text-neutral-700 hover:bg-neutral-100 flex items-center justify-center gap-2 min-h-[44px]">
                    <Share2 className="w-5 h-5" /> Partager
                  </button>
                  <button onClick={() => { setShowContactForm(true); setShowMobileMenu(false); }} className="flex-1 px-4 py-3 rounded-lg font-medium text-neutral-700 hover:bg-neutral-100 flex items-center justify-center gap-2 min-h-[44px]">
                    <MessageCircle className="w-5 h-5" /> Contact
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main id="contenu-vitrine" tabIndex={-1} className="outline-none">

      {/* Hero Cover */}
      <section aria-labelledby="vitrine-studio-title" className="relative min-h-[66dvh] h-[min(68dvh,32rem)] sm:h-[70vh] md:min-h-0 md:h-[80vh] overflow-hidden mt-16 sm:mt-20" data-joyride="vitrine-hero">
        <div
          aria-hidden
          className={`absolute inset-0 bg-cover bg-center ${heroCover ? '' : 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900'}`}
          style={heroCover ? { backgroundImage: `url(${heroCover})` } : undefined}
        />
        {/* Mobile : dégradé plus doux pour voir la photo ; md+ : assombrissement fort pour le texte sur grand hero */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/32 to-black/[0.06] md:from-black/[0.94] md:via-black/60 md:to-black/20"
          aria-hidden
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-12 max-md:pb-[max(1.25rem,env(safe-area-inset-bottom))] safe-bottom">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="flex flex-col md:flex-row md:items-end gap-4 sm:gap-8"
              initial={vitrineReduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                vitrineReduce
                  ? { duration: 0 }
                  : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
              }
            >
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 min-w-0 max-md:gap-5">
                {heroAvatar ? (
                  <img
                    src={heroAvatar}
                    alt={`Photo du studio ${studioName}`}
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-40 md:h-40 rounded-2xl sm:rounded-3xl border-4 border-white/95 shadow-2xl object-cover flex-shrink-0 max-md:ring-2 max-md:ring-white/20"
                  />
                ) : (
                  <div
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-40 md:h-40 rounded-2xl sm:rounded-3xl border-4 border-white/40 shadow-2xl flex-shrink-0 flex items-center justify-center bg-white/10 text-white text-2xl sm:text-3xl md:text-4xl font-bold max-md:ring-2 max-md:ring-white/15"
                    aria-hidden
                  >
                    {studioName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 text-white pb-0 sm:pb-2 min-w-0 max-md:pt-0.5">
                  <h1
                    id="vitrine-studio-title"
                    className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold sm:font-bold mb-2 sm:mb-3 leading-[1.1] sm:leading-tight text-balance max-md:tracking-[-0.02em] max-md:[text-shadow:0_3px_28px_rgba(0,0,0,0.55),0_1px_2px_rgba(0,0,0,0.4)] drop-shadow-lg"
                  >
                    {studioDisplay.name?.trim() || studioName}
                  </h1>
                  {studioDisplay.tagline?.trim() ? (
                    <p className="text-base sm:text-xl md:text-2xl text-white/95 max-md:leading-relaxed text-pretty mb-4 sm:mb-6 max-md:[text-shadow:0_2px_16px_rgba(0,0,0,0.5)]">
                      {studioDisplay.tagline}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 sm:gap-3 max-md:gap-2.5">
                    {(studioDisplay.rating > 0 || studioDisplay.reviewCount > 0) && (
                      <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/30 text-sm sm:text-base">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        <span className="font-bold">{studioDisplay.rating}</span>
                        <span className="opacity-90">• {studioDisplay.reviewCount} avis</span>
                      </div>
                    )}
                    {studioDisplay.address?.trim() ? (
                      <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/30 text-sm sm:text-base min-w-0 max-md:max-w-full max-md:flex-1 max-md:min-w-[min(100%,20rem)]">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="truncate sm:max-w-none">{studioDisplay.address}</span>
                      </div>
                    ) : null}
                    {studioDisplay.yearsExperience > 0 ? (
                      <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/30 text-sm sm:text-base">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span>{studioDisplay.yearsExperience} ans d&apos;expertise</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex w-full min-w-0 max-w-full flex-shrink-0 self-stretch border-t border-white/10 pt-4 max-md:mt-1 md:max-w-md md:shrink-0 md:ml-auto md:border-0 md:pt-0 md:mt-0 md:items-end md:self-end md:pb-2">
                <div
                  className="flex w-full min-w-0 flex-row flex-nowrap items-center justify-start gap-1.5 sm:gap-2 md:justify-end"
                  role="group"
                  aria-label="Réservation, partage et favoris"
                >
                  <motion.a
                    href={`/book/${studioSlug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigateTo(`/book/${studioSlug}`);
                    }}
                    data-joyride="vitrine-hero-cta"
                    whileTap={vitrineTap}
                    className="inline-flex min-w-0 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--vitrine-primary)] px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-white shadow-pro max-md:shadow-[0_8px_28px_-4px_rgba(0,0,0,0.5)] sm:shadow-lg sm:shadow-black/25 max-md:ring-1 max-md:ring-inset max-md:ring-white/20 transition [transform:translateZ(0)] hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 min-h-[44px] cursor-pointer"
                  >
                    <Calendar className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                    Réserver
                  </motion.a>
                  <motion.button
                    type="button"
                    onClick={shareStudio}
                    aria-label="Partager la vitrine"
                    whileTap={vitrineTap}
                    className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-all border border-white/30 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 shrink-0"
                  >
                    <Share2 className="w-5 h-5 sm:w-5 sm:h-5 text-white" aria-hidden />
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={toggleStudioFavorite}
                    aria-pressed={studioFavorite}
                    aria-label={studioFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    title={studioFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    whileTap={vitrineTap}
                    className={`p-2.5 sm:p-3 backdrop-blur-md rounded-xl transition-all border min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 shrink-0 ${
                      studioFavorite
                        ? 'bg-rose-500/35 border-rose-300/60 hover:bg-rose-500/45'
                        : 'bg-white/20 hover:bg-white/30 border-white/30'
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 sm:w-5 sm:h-5 ${
                        studioFavorite ? 'fill-rose-300 text-rose-50' : 'text-white fill-transparent'
                      }`}
                      aria-hidden
                    />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Réservation : max-lg — sous le hero (desktop : colonne latérale) */}
      <div className="lg:hidden relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-0">
        <VitrineScrollReveal index={0}>{vitrineBookingCard}</VitrineScrollReveal>
      </div>

      {/* Stats Banner — masquable via Paramètres > Vitrine > Statistiques */}
      {studioDisplay.showStatsBanner !== false && (
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white py-4 sm:py-6 relative overflow-hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl motion-reduce:blur-none" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl motion-reduce:blur-none" />
        </div>
        <VitrineScrollReveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" index={0}>
          <div className="flex md:grid flex-nowrap md:grid-cols-4 overflow-x-auto md:overflow-visible gap-4 md:gap-6 pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scrollbar-hide">
            <div className="flex-shrink-0 min-w-[120px] md:min-w-0 snap-center text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-1">{studioDisplay.totalTattoos}+</div>
              <div className="text-xs sm:text-sm text-neutral-300">Tatouages réalisés</div>
            </div>
            <div className="flex-shrink-0 min-w-[120px] md:min-w-0 snap-center text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-1">{studioDisplay.satisfactionRate}%</div>
              <div className="text-xs sm:text-sm text-neutral-300">Satisfaction</div>
            </div>
            <div className="flex-shrink-0 min-w-[120px] md:min-w-0 snap-center text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-1">{studioDisplay.repeatClients}%</div>
              <div className="text-xs sm:text-sm text-neutral-300">Clients fidèles</div>
            </div>
            <div className="flex-shrink-0 min-w-[120px] md:min-w-0 snap-center text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-1">{studioDisplay.artists.length}</div>
              <div className="text-xs sm:text-sm text-neutral-300">Artistes experts</div>
            </div>
          </div>
        </VitrineScrollReveal>
      </div>
      )}

      {/* Main Content — safe-bottom pour éviter contenu coupé sur mobile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 pb-[max(7rem,env(safe-area-inset-bottom))] lg:pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="grid lg:grid-cols-3 gap-8 sm:gap-12">
          <div className="lg:col-span-2 space-y-10 sm:space-y-16 relative z-10">
            {/* About */}
            <section id="about" className="scroll-mt-24 sm:scroll-mt-32">
              <VitrineScrollReveal index={1}>
              <div className="bg-white rounded-xl p-6 sm:p-8 md:p-10 border border-neutral-200/80 shadow-sm">
                <VitrineSectionHeading eyebrow="Le studio" title="À propos" icon={Sparkles} />
                <p className="text-neutral-600 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-3xl">{studioDisplay.description}</p>
                {(() => {
                  const aboutPhoto = (studioDisplay.coverImage || '').trim() || (studioDisplay.avatar || '').trim();
                  if (!aboutPhoto) return null;
                  return (
                    <div className="w-full mb-6 sm:mb-8 rounded-xl overflow-hidden ring-1 ring-neutral-200/80 shadow-sm">
                      <img
                        src={aboutPhoto}
                        alt="Couverture du studio"
                        loading="lazy"
                        decoding="async"
                        sizes="(max-width: 1024px) 100vw, min(896px, 66vw)"
                        className="block w-full h-auto max-w-full max-h-[min(80vh,900px)] min-h-0"
                      />
                    </div>
                  );
                })()}
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-neutral-200/70">
                  {studioDisplay.whyChooseUs.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-lg border border-neutral-200/80 hover:border-neutral-300 transition-colors group">
                        <div className="w-11 h-11 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-neutral-700" strokeWidth={1.75} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-neutral-900 mb-2">{item.title}</h3>
                          <p className="text-sm text-neutral-800 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              </VitrineScrollReveal>
            </section>

            {/* Services — masquable via Paramètres > Vitrine > Services */}
            {studioDisplay.showServicesSection !== false && (
            <section id="services" className="scroll-mt-24 sm:scroll-mt-32">
              <VitrineScrollReveal index={2}>
              <div className="bg-white rounded-xl p-6 sm:p-8 md:p-10 border border-neutral-200/80 shadow-sm">
                <VitrineSectionHeading eyebrow="Prestations" title="Services" icon={Award} />
                <div className="space-y-4 sm:space-y-5">
                  {studioDisplay.services.map((service, idx) => {
                    const Icon = service.icon;
                    return (
                      <div key={idx} className="group relative rounded-lg border border-neutral-200/80 hover:border-neutral-300 transition-colors overflow-hidden bg-white">
                        <div className="p-4 sm:p-6 md:p-8 flex flex-col md:flex-row gap-4 sm:gap-6">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                              <Icon className="w-6 h-6 text-neutral-700" strokeWidth={1.75} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2 sm:mb-3">{service.name}</h3>
                            <p className="text-neutral-800 mb-4 leading-relaxed">{service.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {service.features.map((feature, i) => (
                                <span key={i} className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs sm:text-sm rounded-md font-medium flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-neutral-500" strokeWidth={2} />
                                  {feature}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-700">
                              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{service.duration}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right md:text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">{service.price}</div>
                            <a href={`/book/${studioSlug}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigateTo(`/book/${studioSlug}`); }} className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[var(--vitrine-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm sm:text-base w-full md:w-auto cursor-pointer">
                              Réserver
                              <ArrowRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              </VitrineScrollReveal>
            </section>
            )}

            {/* Artistes — contenu Paramètres > Vitrine (JSON) ; les pages tatoueur dédiées : /artist/:slug */}
            <section id="artists" className="scroll-mt-24 sm:scroll-mt-32">
              <VitrineScrollReveal index={3}>
              <div className="bg-white rounded-xl p-6 sm:p-8 md:p-10 border border-neutral-200/80 shadow-sm">
                <VitrineSectionHeading eyebrow="Équipe" title="Artistes" icon={Users} />
                <div className="space-y-8">
                  {studioDisplay.artists.map((artist, idx) => (
                    <div key={idx} className="group rounded-lg p-4 sm:p-6 md:p-8 border border-neutral-200/80 hover:border-neutral-300 transition-colors">
                      <div className="flex flex-col md:flex-row gap-4 sm:gap-8">
                        <img src={artist.avatar} alt={artist.name} loading="lazy" className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-lg object-cover flex-shrink-0 mx-auto md:mx-0" />
                        <div className="flex-1">
                          <h3 className="text-xl sm:text-3xl font-bold text-neutral-900 mb-2 text-center md:text-left">{artist.name}</h3>
                          <p className="text-neutral-800 text-sm font-medium mb-4">{artist.role}</p>
                          <p className="text-neutral-800 mb-6 leading-relaxed">{artist.bio}</p>
                          <div className="flex flex-wrap gap-2 mb-6">
                            {artist.specialties.map((spec, i) => (
                              <span key={i} className="px-3 py-1.5 bg-neutral-100 text-neutral-800 text-xs sm:text-sm rounded-md font-medium border border-neutral-200/80">{spec}</span>
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-neutral-800">
                              <Award className="w-5 h-5 text-neutral-700" />
                              <span className="font-semibold">{artist.experience} d&apos;expérience</span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-800">
                              <Camera className="w-5 h-5 text-neutral-700" />
                              <span className="font-semibold">{artist.portfolio}+ tatouages</span>
                            </div>
                            <a href={`https://instagram.com/${artist.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-neutral-800 hover:text-neutral-900 font-medium underline-offset-4 hover:underline">
                              <Instagram className="w-5 h-5" />
                              {artist.instagram}
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </VitrineScrollReveal>
            </section>

            {/* Portfolio */}
            <section id="portfolio" className="scroll-mt-24 sm:scroll-mt-32" data-joyride="vitrine-portfolio">
              <VitrineScrollReveal index={4}>
              <div className="bg-white rounded-xl p-6 sm:p-8 md:p-10 border border-neutral-200/80 shadow-sm">
                <VitrineSectionHeading eyebrow="Galerie" title="Portfolio" icon={Camera} />
                {studioDisplay.portfolio.length === 0 ? (
                  <p className="text-sm text-neutral-500 mb-6 max-w-md leading-relaxed">
                    Les photos de réalisations apparaîtront ici. Ajoutez-les depuis le dashboard — en attendant, suivez le studio sur Instagram.
                  </p>
                ) : (
                  <div className="columns-2 md:columns-3 gap-2 sm:gap-3 [column-fill:balance]">
                    {studioDisplay.portfolio.map((item, idx) => (
                      <div
                        key={idx}
                        className={`break-inside-avoid mb-2 sm:mb-3 group relative rounded-md overflow-hidden cursor-pointer ring-1 ring-neutral-200/80 ${(runVitrineTour && vitrineStepIndex === 3 && idx === 0) ? 'ring-neutral-400' : ''}`}
                        onClick={() => setSelectedImage(item.url)}
                      >
                        <img src={item.url} alt={item.description || 'Portfolio'} loading="lazy" className="w-full h-auto object-cover object-center group-hover:opacity-95 transition-opacity duration-300" />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity ${(runVitrineTour && vitrineStepIndex === 3 && idx === 0) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
                            {item.category && <div className="text-[10px] font-medium uppercase tracking-wider opacity-80 mb-0.5">{item.category}</div>}
                            {item.description && <div className="text-sm font-medium leading-snug">{item.description}</div>}
                            <div className="flex items-center gap-2 mt-2 text-xs opacity-90">
                              <span>{item.artist}</span>
                              {item.likes ? (
                                <>
                                  <span aria-hidden>·</span>
                                  <Heart className="w-3 h-3 inline" />
                                  <span>{item.likes}</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-8 sm:mt-10 flex justify-center">
                  <a
                    href={`https://instagram.com/${studioDisplay.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-300 text-neutral-800 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
                  >
                    <Instagram className="w-4 h-4" strokeWidth={1.75} />
                    Instagram
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" strokeWidth={1.75} />
                  </a>
                </div>
              </div>
              </VitrineScrollReveal>
            </section>

            {/* Flash */}
            <section id="flash" className="scroll-mt-24 sm:scroll-mt-32" data-joyride="vitrine-flash">
              <VitrineScrollReveal index={5}>
              <div className="bg-white rounded-xl p-6 sm:p-8 md:p-10 border border-neutral-200/80 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10 border-b border-neutral-200/70 pb-5 sm:pb-6">
                  <div>
                    <div className="flex items-center gap-2 text-neutral-400 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em]">Flash</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight">Disponibles</h2>
                  </div>
                  <span className="text-xs sm:text-sm px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-md font-medium tabular-nums w-fit">
                    {studioDisplay.flashDesigns.filter(f => f.available).length} dispo
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  {studioDisplay.flashDesigns.map((flash) => (
                    <motion.div
                      key={flash.id}
                      whileTap={!flash.available || vitrineReduce ? undefined : vitrineTapSoft}
                      className={`group relative aspect-square rounded-lg overflow-hidden ring-1 ring-neutral-200/80 hover:ring-neutral-300 transition-all ${!flash.available ? 'opacity-70' : ''}`}
                    >
                      <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedFlash(flash)}>
                        <img src={flash.imageUrl} alt={flash.title} loading="lazy" className="w-full h-full object-cover object-center group-hover:opacity-95 transition-opacity duration-300" />

                        {/* Mobile overlay — compact: title + price only */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent md:hidden">
                          <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
                            <h3 className="text-xs font-bold leading-tight line-clamp-1 mb-1">{flash.title}</h3>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-sm font-black">{flash.price}€</span>
                              {flash.available ? (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">Réserver</span>
                              ) : (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-red-500/80 rounded-full">Réservé</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Desktop overlay — full info on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                            <div className="flex items-center gap-2 mb-3">
                              {flash.style && <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">{flash.style}</span>}
                              {flash.size && <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">{flash.size}</span>}
                            </div>
                            <h3 className="text-2xl font-bold mb-2">{flash.title}</h3>
                            {flash.description && <p className="text-sm opacity-90 mb-4 line-clamp-2">{flash.description}</p>}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-3xl font-bold">{flash.price}€</div>
                                {flash.duration && <div className="text-sm opacity-80">~{flash.duration}min</div>}
                              </div>
                              {flash.available ? (
                                <motion.button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedFlash(flash); }}
                                  whileTap={vitrineTap}
                                  className="px-6 py-3 bg-white text-neutral-900 rounded-lg font-medium hover:bg-neutral-100 transition-colors"
                                >
                                  Réserver
                                </motion.button>
                              ) : (
                                <div className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold">Réservé</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              </VitrineScrollReveal>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="scroll-mt-24 sm:scroll-mt-32">
              <VitrineScrollReveal index={6}>
              <div className="bg-white rounded-xl p-6 sm:p-8 md:p-10 border border-neutral-200/80 shadow-sm">
                <VitrineSectionHeading
                  eyebrow="Témoignages"
                  title="Avis clients"
                  icon={Star}
                  action={
                    publicGoogleMapsHref ? (
                      <motion.a
                        href={publicGoogleMapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileTap={vitrineTap}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-neutral-300 bg-white text-neutral-900 text-sm font-medium hover:bg-neutral-50 transition-all"
                      >
                        <MapPin className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                        Google Maps
                        <ExternalLink className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                      </motion.a>
                    ) : undefined
                  }
                />
                <p className="text-neutral-500 text-sm sm:text-base mb-8 sm:mb-10 -mt-4 max-w-xl">Retours de clients après leur séance.</p>
                <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
                  {studioDisplay.testimonials.map((testimonial, idx) => (
                    <div key={idx} className="p-4 sm:p-6 rounded-lg border border-neutral-200/80 hover:border-neutral-300 transition-colors">
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-neutral-800 mb-6 leading-relaxed">"{testimonial.text}"</p>
                      <div className="flex items-center gap-4 pt-6 border-t border-neutral-200">
                        <img src={testimonial.avatar} alt={testimonial.name} loading="lazy" className="w-14 h-14 rounded-full object-cover" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-bold">{testimonial.name}</div>
                            {testimonial.verified && <CheckCircle className="w-4 h-4 text-green-600" />}
                          </div>
                          <div className="text-sm text-neutral-700">{testimonial.tattoo}</div>
                          <div className="text-xs text-neutral-600">{testimonial.date}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {googleReviewsPayload && (
                  <div className="mt-8 sm:mt-10">
                    <GoogleReviews data={googleReviewsPayload} />
                  </div>
                )}
                <div className="mt-8 sm:mt-10 pt-8 border-t border-neutral-200/70 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 mb-2">Réserver</p>
                  <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-1">Une place avec nous</h3>
                  <p className="text-sm text-neutral-500 mb-5 max-w-sm mx-auto">{studioDisplay.satisfactionRate}% de clients satisfaits — rejoignez-les.</p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
                    <a href={`/book/${studioSlug}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigateTo(`/book/${studioSlug}`); }} className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-[var(--vitrine-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity w-full sm:w-auto min-h-[44px] cursor-pointer active:scale-[0.98]">
                      Prendre rendez-vous
                      <ArrowRight className="w-4 h-4" strokeWidth={2} />
                    </a>
                    {publicGoogleMapsHref && (
                      <a
                        href={publicGoogleMapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-lg border border-neutral-300 bg-white text-neutral-900 text-sm font-medium hover:bg-neutral-50 w-full sm:w-auto min-h-[44px] active:scale-[0.98] transition-all"
                      >
                        <MapPin className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                        Google Maps
                        <ExternalLink className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              </VitrineScrollReveal>
            </section>

            {/* FAQ */}
            <section id="faq" className="scroll-mt-24 sm:scroll-mt-32">
              <VitrineScrollReveal index={7}>
              <div className="bg-white rounded-xl p-6 sm:p-8 md:p-10 border border-neutral-200/80 shadow-sm">
                <VitrineSectionHeading eyebrow="FAQ" title="Questions fréquentes" icon={AlertCircle} />
                <p className="text-neutral-500 text-sm sm:text-base mb-8 sm:mb-10 -mt-4">Avant votre première séance.</p>
                <div className="space-y-2 sm:space-y-3">
                  {studioDisplay.faqs.map((faq, idx) => (
                    <div key={idx} className="border border-neutral-200/80 rounded-lg overflow-hidden hover:border-neutral-300 transition-colors">
                      <button onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)} className="w-full px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors">
                        <span className="font-bold text-base sm:text-lg text-neutral-900 pr-4">{faq.q}</span>
                        <ChevronDown className={`w-6 h-6 flex-shrink-0 transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedFaq === idx && (
                        <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 text-neutral-800 leading-relaxed text-sm sm:text-base">{faq.a}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              </VitrineScrollReveal>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:space-y-6 lg:self-start" data-joyride="vitrine-coordonnees">
            <VitrineScrollReveal className="hidden lg:block" index={1}>
              {vitrineBookingCard}
            </VitrineScrollReveal>

            <VitrineScrollReveal index={2}>
            <div className="bg-white rounded-xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900 mb-5">Coordonnées</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-neutral-700" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-1">Adresse</div>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studioDisplay.address)}`} target="_blank" rel="noopener noreferrer" className="text-neutral-700 hover:text-neutral-900 text-sm underline-offset-2 hover:underline">
                      {studioDisplay.address}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-neutral-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-1">Téléphone</div>
                    <a href={`tel:${studioDisplay.phone}`} className="text-neutral-700 hover:text-neutral-900 text-sm font-medium underline-offset-2 hover:underline">{studioDisplay.phone}</a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-neutral-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-1">Email</div>
                    <a href={`mailto:${studioDisplay.email}`} className="text-neutral-700 hover:text-neutral-900 text-sm underline-offset-2 hover:underline">{studioDisplay.email}</a>
                  </div>
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-neutral-200">
                <div className="font-semibold text-sm mb-4">Réseaux sociaux</div>
                <div className="flex gap-3">
                  <a href={`https://instagram.com/${studioDisplay.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-neutral-900 text-white rounded-lg flex items-center justify-center hover:bg-neutral-800 transition-colors">
                    <Instagram className="w-5 h-5" strokeWidth={1.75} />
                  </a>
                  <a href={`https://facebook.com/${studioDisplay.facebook}`} target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-neutral-900 text-white rounded-lg flex items-center justify-center hover:bg-neutral-800 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
            </VitrineScrollReveal>

            <VitrineScrollReveal index={3}>
            <div className="bg-white rounded-xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900 mb-5 flex items-center gap-2">
                <Clock className="w-5 h-5 text-neutral-500" strokeWidth={1.75} />
                Horaires
              </h3>
              <div className="space-y-3">
                {DAY_ORDER.map((day) => {
                  const hours = studioDisplay.openingHours?.[day];
                  if (!hours) return null;
                  const h = hours as { closed?: boolean; open?: string; close?: string };
                  const isToday = getCurrentDay() === day;
                  return (
                    <div key={day} className={`flex justify-between items-center py-2 rounded-md transition-colors ${isToday ? 'bg-neutral-900 text-white px-3 font-semibold' : 'text-neutral-700'}`}>
                      <span className="capitalize text-sm">{dayLabels[day] || day}</span>
                      <span className={`text-sm ${isToday ? 'font-bold' : 'font-semibold'}`}>
                        {h.closed ? 'Fermé' : `${h.open ?? ''} - ${h.close ?? ''}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            </VitrineScrollReveal>
          </div>
        </div>
      </div>

      </main>

      {/* Footer — safe-bottom pour éviter coupure sur mobile */}
      <footer className="bg-neutral-900 text-white mt-24 py-16 pb-[max(7rem,env(safe-area-inset-bottom))] lg:pb-[max(4rem,env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {studioDisplay.siret && (
            <p className="text-neutral-500 text-sm mb-6">
              SIRET : {studioDisplay.siret.replace(/\s/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')}
            </p>
          )}
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-neutral-900 font-bold text-xl">I</span>
                </div>
                <div>
                  <div className="font-bold text-xl">{studioDisplay.name}</div>
                  <div className="text-sm text-neutral-400">{studioDisplay.tagline}</div>
                </div>
              </div>
              <p className="text-neutral-300 leading-relaxed mb-6">
                {studioDisplay.description || 'Studio professionnel de tatouage. Créations uniques et travail de qualité.'}
              </p>
              <div className="flex gap-3">
                <a href={`https://instagram.com/${studioDisplay.instagram.replace('@', '')}`} className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href={`https://facebook.com/${studioDisplay.facebook}`} className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Navigation</h4>
              <ul className="space-y-3 text-neutral-300">
                <li><button type="button" onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">À propos</button></li>
                {studioDisplay.showServicesSection !== false && (
                  <li><button type="button" onClick={() => scrollToSection('services')} className="hover:text-white transition-colors">Services</button></li>
                )}
                <li><button type="button" onClick={() => scrollToSection('portfolio')} className="hover:text-white transition-colors">Portfolio</button></li>
                <li><button type="button" onClick={() => scrollToSection('testimonials')} className="hover:text-white transition-colors">Avis</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Contact</h4>
              <ul className="space-y-3 text-neutral-300 text-sm">
                <li>{studioDisplay.address}</li>
                <li><a href={`tel:${studioDisplay.phone}`} className="hover:text-white transition-colors">{studioDisplay.phone}</a></li>
                <li><a href={`mailto:${studioDisplay.email}`} className="hover:text-white transition-colors">{studioDisplay.email}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-sm text-neutral-400">
            <p>© 2025 {studioDisplay.name}. Tous droits réservés.</p>
            <p className="mt-2">Propulsé par <span className="font-semibold text-white">InkFlow</span></p>
          </div>
        </div>
      </footer>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex gap-2 border-t border-neutral-200/90 bg-[#f7f7f5]/98 backdrop-blur-xl px-3 py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.12)] supports-[backdrop-filter]:bg-[#f7f7f5]/92"
        aria-label="Actions rapides vitrine"
      >
        <motion.a
          href={`/book/${studioSlug}`}
          onClick={(e) => {
            e.preventDefault();
            navigateTo(`/book/${studioSlug}`);
          }}
          whileTap={vitrineTap}
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-[var(--vitrine-primary)] text-white font-semibold text-sm shadow-sm transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
        >
          <Calendar className="w-5 h-5 shrink-0" aria-hidden />
          Réserver
        </motion.a>
        <motion.button
          type="button"
          onClick={() => setShowContactForm(true)}
          whileTap={vitrineTap}
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl border border-neutral-300 bg-white font-semibold text-sm text-neutral-900 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
        >
          <MessageCircle className="w-5 h-5 shrink-0" aria-hidden />
          Contact
        </motion.button>
      </nav>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Agrandissement du portfolio"
          className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 motion-reduce:transition-none"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            aria-label="Fermer"
            className="absolute top-6 right-6 w-12 h-12 bg-neutral-200 hover:bg-neutral-300 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            <X className="w-6 h-6 text-neutral-700" aria-hidden />
          </button>
          <img src={selectedImage} alt="Œuvre du portfolio en grand format" className="max-w-full max-h-full object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Flash Detail Modal */}
      {selectedFlash && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vitrine-flash-title"
          className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm overflow-y-auto motion-reduce:transition-none"
          onClick={() => setSelectedFlash(null)}
        >
          <div className="min-h-full flex items-start sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full my-4 sm:my-8" onClick={(e) => e.stopPropagation()} data-joyride="vitrine-flash-modal">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 p-4 sm:p-8">
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <img src={selectedFlash.imageUrl} alt={selectedFlash.title} className="w-full h-full object-cover" />
                {!selectedFlash.available && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-xl">Réservé</div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-neutral-100 rounded-full text-xs font-semibold">{selectedFlash.style}</span>
                      <span className="px-3 py-1 bg-neutral-100 rounded-full text-xs font-semibold">{selectedFlash.size}</span>
                    </div>
                    <h3 id="vitrine-flash-title" className="text-3xl font-bold mb-2">{selectedFlash.title}</h3>
                  </div>
                  <button type="button" onClick={() => setSelectedFlash(null)} aria-label="Fermer la fiche flash" className="w-10 h-10 hover:bg-neutral-100 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2">
                    <X className="w-6 h-6" aria-hidden />
                  </button>
                </div>
                <p className="text-neutral-700 mb-6 leading-relaxed">{selectedFlash.description}</p>
                <div className="grid grid-cols-2 gap-4 py-6 mb-6 border-y border-neutral-200">
                  <div>
                    <div className="text-sm text-neutral-600 mb-1">Prix</div>
                    <div className="text-3xl font-bold">{selectedFlash.price}€</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 mb-1">Durée estimée</div>
                    <div className="text-3xl font-bold">{selectedFlash.duration}<span className="text-lg">min</span></div>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="text-sm font-semibold text-neutral-900 mb-3">Emplacements suggérés</div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedFlash.placement ?? []).map((place: string) => (
                      <span key={place} className="px-4 py-2 bg-neutral-100 rounded-lg text-sm font-medium">{place}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-auto space-y-4">
                  {selectedFlash.available && (
                    <>
                      {flashDepositUrl ? (
                        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 sm:p-5">
                          <div className="text-sm font-semibold text-green-800 mb-2">Lien de paiement généré</div>
                          <p className="text-sm text-neutral-700 mb-3">Cliquez ci-dessous pour ouvrir la page de paiement sécurisé Stripe, ou copiez le lien pour l&apos;ouvrir plus tard.</p>
                          <div className="flex flex-col sm:flex-row gap-2 mb-3">
                            <input
                              type="text"
                              readOnly
                              value={flashDepositUrl}
                              className="flex-1 min-w-0 px-3 py-2.5 border border-neutral-200 rounded-lg bg-white text-neutral-700 text-sm truncate"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(flashDepositUrl ?? '').then(() => toast.success('Lien copié')).catch(() => { toast.error('Impossible de copier le lien'); });
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 shrink-0"
                              >
                                <Copy className="w-4 h-4" /> Copier
                              </button>
                              <a
                                href={flashDepositUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 shrink-0"
                              >
                                <ExternalLink className="w-4 h-4" /> Ouvrir le paiement
                              </a>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFlashDepositUrl(null)}
                            className="text-sm text-neutral-600 hover:text-neutral-900 underline"
                          >
                            Générer un autre lien
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="rounded-xl border-2 border-neutral-200 bg-neutral-50 p-4 sm:p-5">
                            <div className="text-sm font-semibold text-neutral-900 mb-3">Réserver en payant l&apos;acompte</div>
                            <p className="text-sm text-neutral-600 mb-4">Indiquez vos coordonnées puis cliquez pour être redirigé vers le paiement sécurisé. Le flash sera réservé à votre nom.</p>
                            <div className="grid sm:grid-cols-2 gap-3 mb-4">
                              <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Nom *</label>
                                <input
                                  type="text"
                                  value={flashDepositName}
                                  onChange={(e) => { setFlashDepositName(e.target.value); setFlashDepositError(null); }}
                                  placeholder="Votre nom"
                                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-neutral-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Email *</label>
                                <input
                                  type="email"
                                  value={flashDepositEmail}
                                  onChange={(e) => { setFlashDepositEmail(e.target.value); setFlashDepositError(null); }}
                                  placeholder="votre@email.com"
                                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-neutral-900"
                                />
                              </div>
                            </div>
                            <label className="flex items-start gap-3 mb-4 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={flashDepositAcceptTerms}
                                onChange={(e) => setFlashDepositAcceptTerms(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                              />
                              <span className="text-sm text-neutral-700">
                                J&apos;accepte les{' '}
                                <a href={LANDING_TERMS_URL} target="_blank" rel="noopener noreferrer" className="underline font-medium">conditions générales de vente</a>
                                {' '}et la{' '}
                                <a href={LANDING_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="underline font-medium">politique de confidentialité</a> (RGPD). *
                              </span>
                            </label>
                            {flashDepositError && (
                              <div className="mb-3">
                                <p className="text-sm text-red-600 mb-1.5">{flashDepositError}</p>
                                <a href="/aide#paiement" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline">
                                  En savoir plus
                                </a>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={handleFlashDepositPayment}
                              disabled={flashDepositLoading || !flashDepositName.trim() || !flashDepositEmail.trim() || !flashDepositAcceptTerms}
                              className="w-full bg-[var(--vitrine-primary)] text-white text-center py-3.5 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
                            >
                              {flashDepositLoading ? (
                                <>
                                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Redirection vers le paiement…
                                </>
                              ) : (
                                <>Payer l&apos;acompte ({(selectedFlash as { depositAmount?: number }).depositAmount ?? (Math.round((selectedFlash.price ?? 0) * 0.3) || 30)}€)</>
                              )}
                            </button>
                          </div>
                          <p className="text-center text-sm text-neutral-500">ou</p>
                          <a href={`/book/${studioSlug}?flash=${selectedFlash.id}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigateTo(`/book/${studioSlug}?flash=${selectedFlash.id}`); }} className="block w-full border-2 border-neutral-900 text-neutral-900 text-center py-3 rounded-xl font-semibold hover:bg-neutral-50 transition-all cursor-pointer">
                            Demander un créneau sans payer maintenant
                          </a>
                        </>
                      )}
                    </>
                  )}
                  {!selectedFlash.available && (
                    <div className="w-full bg-neutral-200 text-neutral-500 text-center py-4 rounded-xl font-bold text-lg cursor-not-allowed">Flash déjà réservé</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal (Demande de RDV) */}
      {showBookingForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vitrine-booking-title"
          className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowBookingForm(false)}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 id="vitrine-booking-title" className="text-2xl font-bold">Demande de rendez-vous</h3>
              <button type="button" onClick={() => setShowBookingForm(false)} aria-label="Fermer" className="w-10 h-10 hover:bg-neutral-100 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2">
                <X className="w-6 h-6" aria-hidden />
              </button>
            </div>
            {bookingStudioId ? (
              <VitrineBookingForm
                studioId={bookingStudioId}
                onSubmitSuccess={handleBookingSuccess}
                onError={setBookingError}
                onCancel={() => setShowBookingForm(false)}
                submitLabel="Envoyer ma demande"
                submitError={bookingError}
              />
            ) : bookingError ? (
              <p className="text-red-600 py-8">{bookingError}</p>
            ) : (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Project Request Form Modal */}
      {showProjectRequestForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vitrine-project-title"
          className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowProjectRequestForm(false)}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 id="vitrine-project-title" className="text-2xl font-bold">Demande de projet</h3>
              <button type="button" onClick={() => setShowProjectRequestForm(false)} aria-label="Fermer" className="w-10 h-10 hover:bg-neutral-100 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2">
                <X className="w-6 h-6" aria-hidden />
              </button>
            </div>
            <ProjectRequestForm
              studioId={projectRequestStudioId}
              onSubmit={handleProjectRequestSubmit}
              onCancel={() => setShowProjectRequestForm(false)}
              submitLabel="Envoyer ma demande"
            />
          </div>
        </div>
      )}

      {/* Success Toasts */}
      {requestSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-green-600 text-white rounded-xl font-semibold shadow-lg">
          Demande envoyée ! L'artiste vous répondra bientôt.
        </div>
      )}
      {bookingSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-green-600 text-white rounded-xl font-semibold shadow-lg">
          Demande envoyée au tatoueur !
        </div>
      )}

      {/* Contact Form Modal */}
      {showContactForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vitrine-contact-title"
          className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowContactForm(false)}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <h3 id="vitrine-contact-title" className="text-3xl font-bold">Nous contacter</h3>
              <button type="button" onClick={() => setShowContactForm(false)} aria-label="Fermer" className="w-10 h-10 hover:bg-neutral-100 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2">
                <X className="w-6 h-6" aria-hidden />
              </button>
            </div>
            <div className="space-y-6" role="group" aria-labelledby="vitrine-contact-title">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Nom *</label>
                  <input type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent" placeholder="Votre nom" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email *</label>
                  <input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent" placeholder="votre@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Téléphone</label>
                <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent" placeholder="+33 6 12 34 56 78" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Sujet *</label>
                <select required value={contactSubject} onChange={(e) => setContactSubject(e.target.value)} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent">
                  <option value="">Sélectionnez un sujet</option>
                  <option value="quote">Demande de devis</option>
                  <option value="appointment">Prise de rendez-vous</option>
                  <option value="info">Demande d'information</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Message *</label>
                <textarea required rows={6} value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none" placeholder="Décrivez votre projet ou posez vos questions..." />
              </div>
              <button
                type="button"
                disabled={contactLoading}
                onClick={() => void handleContactSubmit()}
                className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none min-h-[44px]"
              >
                {contactLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Envoyer le message
                  </>
                )}
              </button>
              <p className="text-sm text-neutral-600 text-center">Nous vous répondrons sous <strong>24 heures</strong></p>
            </div>
          </div>
        </div>
      )}

      {runVitrineTour && studioSlug === 'demo' && (
        <DemoTour
          steps={VITRINE_GUIDE_STEPS}
          onStepChange={setVitrineStepIndex}
          onFinish={() => { setRunVitrineTour(false); setVitrineStepIndex(0); }}
        />
      )}
    </div>
  );
};
