import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, User, Hash, Palette, Shield, Plus, Trash2, Save,
  Check, Loader2, ChevronRight, CreditCard, FileText, Upload,
  Crown, Hammer, GraduationCap, X, AlertCircle, MapPin, Search,
  Link2, Link2Off, Star,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import type { ArtistAccount } from '../../types';
import { searchGooglePlaces } from '../../lib/googlePlaces';
import { looksLikeShortMapsShareLink, parsePlaceIdFromPaste } from '../../lib/parseGooglePlaceId';
import type { GooglePlaceSearchResultDTO } from '../../types/googlePlaces';
import { GooglePlaceMapPreview } from './GooglePlaceMapPreview';

// ── Types ────────────────────────────────────────────────────────────────────

type TeamRole = 'admin' | 'tatoueur' | 'apprenti';

const ROLES: { id: TeamRole; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { id: 'admin',     label: 'Admin',    icon: <Crown className="w-3.5 h-3.5" />,     color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',    desc: 'Accès complet — gère les abonnements et l\'équipe' },
  { id: 'tatoueur',  label: 'Tatoueur', icon: <Hammer className="w-3.5 h-3.5" />,    color: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400', desc: 'Gère son planning, ses clients et flashs' },
  { id: 'apprenti',  label: 'Apprenti', icon: <GraduationCap className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400',  desc: 'Accès limité — lecture seule sur les RDV' },
];

interface IdentityForm {
  studioName: string;
  artistName: string;
  firstName: string;
  lastName: string;
  siret: string;
}

interface EtablissementPageProps {
  studioId: string | null;
  studioName: string;
  siret?: string | null;
  email: string;
  user: { avatar?: string; studioName?: string; email?: string } | null;
  artists: ArtistAccount[];
  onSaveIdentity: (form: IdentityForm) => Promise<void>;
  onAddArtist: (a: Omit<ArtistAccount, 'id' | 'createdAt' | 'studioId'>) => void;
  onDeleteArtist: (id: string) => void;
  onGoToBilling: () => void;
  subscriptionStatus?: string;
  trialEndsAt?: string | null;
  /** Place ID Google (avis sur la vitrine) — persistance Supabase */
  googlePlaceId?: string | null;
  useSupabase?: boolean;
  onSaveGooglePlaceId?: (placeId: string | null) => Promise<void>;
  /** Google Business Profile OAuth */
  googleBusinessConnected?: boolean;
  googleBusinessLocationName?: string | null;
  googleBusinessNeedsLocationSelection?: boolean;
  onConnectGoogleBusiness?: () => Promise<void>;
  onDisconnectGoogleBusiness?: () => Promise<void>;
  onSelectGoogleBusinessLocation?: (locationName: string) => Promise<void>;
  googleBusinessLocations?: { name: string; title: string; accountName: string }[];
  loadingGoogleBusinessLocations?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function validateSiret(s: string): boolean {
  const clean = s.replace(/\s/g, '');
  if (clean.length !== 14 || !/^\d{14}$/.test(clean)) return false;
  // Luhn-like check (Somme des chiffres * alternance)
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let n = parseInt(clean[i], 10);
    if (i % 2 === 0) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  return sum % 10 === 0;
}

function formatSiret(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 14);
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

// ── Component ─────────────────────────────────────────────────────────────────

export const EtablissementPage: React.FC<EtablissementPageProps> = ({
  studioId,
  studioName,
  siret,
  email,
  user,
  artists,
  onSaveIdentity,
  onAddArtist,
  onDeleteArtist,
  onGoToBilling,
  subscriptionStatus,
  trialEndsAt,
  googlePlaceId = null,
  useSupabase = false,
  onSaveGooglePlaceId,
  googleBusinessConnected = false,
  googleBusinessLocationName = null,
  googleBusinessNeedsLocationSelection = false,
  onConnectGoogleBusiness,
  onDisconnectGoogleBusiness,
  onSelectGoogleBusinessLocation,
  googleBusinessLocations = [],
  loadingGoogleBusinessLocations = false,
}) => {
  const toast = useToast();

  // ── Section 1 — Identity ──────────────────────────────────────────────────
  const [identity, setIdentity] = useState<IdentityForm>({
    studioName: studioName || '',
    artistName: '',
    firstName: '',
    lastName: '',
    siret: siret ? formatSiret(siret) : '',
  });
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savedIdentity, setSavedIdentity] = useState(false);
  const siretClean = identity.siret.replace(/\s/g, '');
  const siretValid = siretClean.length === 0 || validateSiret(siretClean);

  const handleSaveIdentity = async () => {
    if (savingIdentity) return;
    if (siretClean && !validateSiret(siretClean)) {
      toast.error('Numéro SIRET invalide (14 chiffres)');
      return;
    }
    setSavingIdentity(true);
    try {
      await onSaveIdentity({ ...identity, siret: siretClean });
      setSavedIdentity(true);
      toast.success('Identité enregistrée');
      setTimeout(() => setSavedIdentity(false), 3000);
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingIdentity(false);
    }
  };

  // ── Section 2 — Team ─────────────────────────────────────────────────────
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'tatoueur' as TeamRole });
  const [addingMember, setAddingMember] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      toast.error('Nom et email requis');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMember.email)) {
      toast.error('Adresse email invalide');
      return;
    }
    setAddingMember(true);
    onAddArtist({
      name: newMember.name.trim(),
      email: newMember.email.trim(),
      role: newMember.role,
      specialties: [],
      permissions: {},
      active: true,
      avatar: undefined,
    });
    setNewMember({ name: '', email: '', role: 'tatoueur' });
    setShowAddMember(false);
    toast.success('Collaborateur ajouté');
    setTimeout(() => setAddingMember(false), 400);
  };

  // ── Section 3 — Billing / Plan ────────────────────────────────────────────
  const isActive = subscriptionStatus === 'active';
  const inTrial = !isActive && !!trialEndsAt && new Date(trialEndsAt) > new Date();
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  // ── Google Place (avis vitrine) ─────────────────────────────────────────
  const [placeSearch, setPlaceSearch] = useState('');
  const [debouncedPlaceQuery, setDebouncedPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<GooglePlaceSearchResultDTO[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [savingGooglePlace, setSavingGooglePlace] = useState(false);
  const [manualPlaceId, setManualPlaceId] = useState('');
  /** Évite un toast à chaque frappe si la recherche échoue en boucle */
  const lastGooglePlacesErrorToastAt = useRef(0);

  // ── Google Business OAuth ─────────────────────────────────────────────────
  const [connectingBusiness, setConnectingBusiness] = useState(false);
  const [disconnectingBusiness, setDisconnectingBusiness] = useState(false);

  const handleConnectBusiness = async () => {
    if (!onConnectGoogleBusiness) return;
    setConnectingBusiness(true);
    try {
      await onConnectGoogleBusiness();
    } catch (err) {
      toast.error((err as Error).message || 'Impossible de lancer la connexion Google Business');
    } finally {
      setConnectingBusiness(false);
    }
  };

  const handleDisconnectBusiness = async () => {
    if (!onDisconnectGoogleBusiness) return;
    setDisconnectingBusiness(true);
    try {
      await onDisconnectGoogleBusiness();
      toast.success('Compte Google Business déconnecté');
    } catch {
      toast.error('Impossible de déconnecter');
    } finally {
      setDisconnectingBusiness(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPlaceQuery(placeSearch.trim()), 450);
    return () => clearTimeout(t);
  }, [placeSearch]);

  useEffect(() => {
    if (!useSupabase || !onSaveGooglePlaceId || debouncedPlaceQuery.length < 2) {
      if (debouncedPlaceQuery.length < 2) setPlaceResults([]);
      return;
    }
    let cancelled = false;
    setSearchingPlaces(true);
    searchGooglePlaces(debouncedPlaceQuery)
      .then((r) => {
        if (!cancelled) setPlaceResults(r);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setPlaceResults([]);
          const now = Date.now();
          if (now - lastGooglePlacesErrorToastAt.current > 12_000) {
            lastGooglePlacesErrorToastAt.current = now;
            toast.error(err.message || 'Recherche Google indisponible');
          }
        }
      })
      .finally(() => {
        if (!cancelled) setSearchingPlaces(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedPlaceQuery, useSupabase, onSaveGooglePlaceId, toast]);

  const handlePickGooglePlace = async (placeId: string) => {
    if (!onSaveGooglePlaceId) return;
    setSavingGooglePlace(true);
    try {
      await onSaveGooglePlaceId(placeId);
      toast.success('Fiche Google enregistrée — les avis s’affichent sur la vitrine');
      setPlaceSearch('');
      setPlaceResults([]);
      setManualPlaceId('');
    } catch {
      toast.error('Impossible d’enregistrer');
    } finally {
      setSavingGooglePlace(false);
    }
  };

  const handleClearGooglePlace = async () => {
    if (!onSaveGooglePlaceId) return;
    setSavingGooglePlace(true);
    try {
      await onSaveGooglePlaceId(null);
      toast.success('Lien Google retiré');
      setPlaceSearch('');
      setPlaceResults([]);
      setManualPlaceId('');
    } catch {
      toast.error('Impossible de retirer le lien');
    } finally {
      setSavingGooglePlace(false);
    }
  };

  const handleSaveManualPlaceId = async () => {
    if (!onSaveGooglePlaceId) return;
    const idRaw = manualPlaceId.trim();
    if (!idRaw) {
      toast.error('Collez d’abord un Place ID ou une URL Maps');
      return;
    }
    if (looksLikeShortMapsShareLink(idRaw)) {
      toast.error(
        'Les liens « Partager » courts ne contiennent pas le Place ID. Ouvrez le lien dans le navigateur, puis copiez l’URL de la barre d’adresse ou utilisez le Place ID Finder Google.'
      );
      return;
    }
    const parsed = parsePlaceIdFromPaste(idRaw);
    if (!parsed) {
      toast.error(
        'Place ID non reconnu. Attendu : texte du type ChIJ… ou une URL avec place_id= / query_place_id=.'
      );
      return;
    }
    await handlePickGooglePlace(parsed);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <div className="mb-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Établissement</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Gérez l'identité professionnelle, l'équipe et la facturation de votre studio.
        </p>
      </div>

      {/* ══ Section 1 — Identité Professionnelle ══ */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-white">Identité professionnelle</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Informations légales et artistiques du studio</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Studio name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />Nom du studio</span>
            </label>
            <input
              type="text"
              value={identity.studioName}
              onChange={e => setIdentity(p => ({ ...p, studioName: e.target.value }))}
              placeholder="Ex: Studio Noir & Encre"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
            />
          </div>

          {/* First / Last name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Prénom</span>
              </label>
              <input
                type="text"
                value={identity.firstName}
                onChange={e => setIdentity(p => ({ ...p, firstName: e.target.value }))}
                placeholder="Jade"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                Nom
              </label>
              <input
                type="text"
                value={identity.lastName}
                onChange={e => setIdentity(p => ({ ...p, lastName: e.target.value }))}
                placeholder="Torres"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
              />
            </div>
          </div>

          {/* Artist name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
              <span className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" />Nom d'artiste</span>
            </label>
            <input
              type="text"
              value={identity.artistName}
              onChange={e => setIdentity(p => ({ ...p, artistName: e.target.value }))}
              placeholder="Ex: @jadeinktattoo"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
            />
          </div>

          {/* SIRET */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
              <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />Numéro SIRET <span className="text-red-400">*</span></span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={identity.siret}
                onChange={e => setIdentity(p => ({ ...p, siret: formatSiret(e.target.value) }))}
                placeholder="123 456 789 00012"
                maxLength={17}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white ${
                  !siretValid && siretClean.length > 0
                    ? 'border-red-400 dark:border-red-500 focus:ring-red-500/20'
                    : siretClean.length === 14 && siretValid
                    ? 'border-emerald-400 dark:border-emerald-500 focus:ring-emerald-500/20'
                    : 'border-zinc-200 dark:border-zinc-700 focus:ring-violet-500/30 focus:border-violet-400'
                }`}
              />
              {siretClean.length === 14 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {siretValid
                    ? <Check className="w-4 h-4 text-emerald-500" />
                    : <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
              )}
            </div>
            {!siretValid && siretClean.length > 0 && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                SIRET invalide — 14 chiffres requis
              </p>
            )}
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
              Obligatoire pour l'émission de factures légales.
            </p>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSaveIdentity}
              disabled={savingIdentity || (!siretValid && siretClean.length > 0)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {savingIdentity ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Enregistrement…</>
              ) : savedIdentity ? (
                <><Check className="w-4 h-4 text-emerald-400" />Enregistré</>
              ) : (
                <><Save className="w-4 h-4" />Enregistrer</>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ══ Avis Google Maps (vitrine) ══ */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-white">Google Maps — avis vitrine</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Liez votre fiche pour afficher note et avis (clé API uniquement côté serveur).
            </p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {!useSupabase || !studioId ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Connectez-vous avec Supabase activé pour associer une fiche Google à votre studio.
            </p>
          ) : !onSaveGooglePlaceId ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Configuration indisponible.</p>
          ) : (
            <>
              {googlePlaceId ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/40">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Place ID</p>
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 font-mono truncate" title={googlePlaceId}>
                        {googlePlaceId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearGooglePlace}
                      disabled={savingGooglePlace}
                      className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                      Retirer
                    </button>
                  </div>
                  <GooglePlaceMapPreview placeId={googlePlaceId} />
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                  <span className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    Rechercher votre établissement
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={placeSearch}
                    onChange={(e) => setPlaceSearch(e.target.value)}
                    placeholder="Ex : Studio Tattoo Paris"
                    disabled={savingGooglePlace}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-400 transition-all"
                  />
                  {searchingPlaces && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 animate-spin" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                  Au moins 2 caractères. Choisissez le bon résultat dans la liste.
                </p>
              </div>

              {placeResults.length > 0 && (
                <ul className="rounded-xl border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
                  {placeResults.map((r) => (
                    <li key={r.placeId}>
                      <button
                        type="button"
                        disabled={savingGooglePlace}
                        onClick={() => handlePickGooglePlace(r.placeId)}
                        className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all active:scale-[0.99] disabled:opacity-50"
                      >
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{r.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{r.formattedAddress}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* ── Google Business OAuth ── */}
              {useSupabase && studioId && (onConnectGoogleBusiness || googleBusinessConnected) && (
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      Connexion directe Google Business
                    </p>
                    <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      Tous les avis
                    </span>
                  </div>

                  {googleBusinessConnected ? (
                    <div className="space-y-3">
                      <div className="flex items-start sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Compte connecté</p>
                            {googleBusinessLocationName ? (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-mono" title={googleBusinessLocationName}>
                                {googleBusinessLocationName.split('/').slice(-1)[0] || googleBusinessLocationName}
                              </p>
                            ) : (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400">Sélectionnez une fiche ci-dessous</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleDisconnectBusiness}
                          disabled={disconnectingBusiness}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50 transition-all"
                        >
                          {disconnectingBusiness
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Link2Off className="w-3.5 h-3.5" />}
                          Déconnecter
                        </button>
                      </div>

                      {/* Multi-location picker */}
                      {googleBusinessNeedsLocationSelection && (
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                            Plusieurs fiches détectées — choisissez la bonne :
                          </p>
                          {loadingGoogleBusinessLocations ? (
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />Chargement des fiches…
                            </div>
                          ) : (
                            <ul className="rounded-xl border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
                              {googleBusinessLocations.map((loc) => (
                                <li key={loc.name}>
                                  <button
                                    type="button"
                                    onClick={() => onSelectGoogleBusinessLocation?.(loc.name)}
                                    className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all active:scale-[0.99]"
                                  >
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{loc.title}</p>
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{loc.accountName}</p>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        Connectez votre compte Google Business pour afficher <strong>tous</strong> vos avis sur la vitrine (pas seulement les 5 derniers de Google Maps).
                      </p>
                      <button
                        type="button"
                        onClick={handleConnectBusiness}
                        disabled={connectingBusiness || !useSupabase}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                      >
                        {connectingBusiness
                          ? <><Loader2 className="w-4 h-4 animate-spin" />Redirection…</>
                          : <><Link2 className="w-4 h-4" />Connecter mon compte Google Business</>}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                  Ou coller un Place ID
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-3">
                  Ne collez pas le lien court <code className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded">share.google/…</code> — ouvrez-le dans le navigateur et copiez l’URL complète. Le Place ID apparaît souvent après{' '}
                  <code className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded">place_id=</code>
                  {' '}ou{' '}
                  <code className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded">query_place_id=</code>
                  . Sinon utilisez le{' '}
                  <a
                    href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-600 dark:text-zinc-300 underline underline-offset-2"
                  >
                    Place ID Finder
                  </a>
                  {' '}Google.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={manualPlaceId}
                    onChange={(e) => setManualPlaceId(e.target.value)}
                    placeholder="Ex : ChIJN1t_tDeuEmsRUsoyG83frY4"
                    disabled={savingGooglePlace || !!googlePlaceId}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-400 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleSaveManualPlaceId}
                    disabled={savingGooglePlace || !!googlePlaceId || !manualPlaceId.trim()}
                    className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    Enregistrer ce Place ID
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ══ Section 2 — Gestion d'Équipe ══ */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-zinc-900 dark:text-white">Gestion d'équipe</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">{artists.length} collaborateur{artists.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        </div>

        {/* Add member form */}
        {showAddMember && (
          <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newMember.name}
                  onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nom complet"
                  className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
                <input
                  type="email"
                  value={newMember.email}
                  onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@exemple.com"
                  className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>

              {/* Role selector */}
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setNewMember(p => ({ ...p, role: r.id }))}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      newMember.role === r.id
                        ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <span className={`p-1 rounded-lg ${newMember.role === r.id ? r.color : ''}`}>{r.icon}</span>
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {ROLES.find(r => r.id === newMember.role)?.desc}
              </p>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowAddMember(false); setNewMember({ name: '', email: '', role: 'tatoueur' }); }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={addingMember}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-all active:scale-[0.98]"
                >
                  {addingMember ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members list */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {artists.length === 0 && !showAddMember && (
            <div className="px-5 py-8 text-center">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Aucun collaborateur pour l'instant</p>
              <button
                onClick={() => setShowAddMember(true)}
                className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                + Inviter un collaborateur
              </button>
            </div>
          )}
          {artists.map(artist => {
            const role = ROLES.find(r => r.id === (artist.role as TeamRole)) ?? ROLES[1];
            const initials = artist.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={artist.id} className="flex items-center gap-3 px-5 py-3.5">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white overflow-hidden">
                  {artist.avatar
                    ? <img src={artist.avatar} alt="" className="w-full h-full object-cover" />
                    : initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{artist.name}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{artist.email}</p>
                </div>
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 ${role.color}`}>
                  {role.icon}{role.label}
                </span>
                {deleteConfirmId === artist.id ? (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => { onDeleteArtist(artist.id); setDeleteConfirmId(null); toast.success('Collaborateur retiré'); }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-red-600 text-white hover:bg-red-700 transition-all"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(artist.id)}
                    className="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ══ Section 3 — Facturation & Documents ══ */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-white">Facturation & Abonnement</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Gérer votre plan et vos factures</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Plan status */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${
            isActive
              ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10'
              : inTrial
              ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10'
              : 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10'
          }`}>
            <div>
              <p className={`text-sm font-bold ${
                isActive ? 'text-emerald-700 dark:text-emerald-400'
                : inTrial ? 'text-amber-700 dark:text-amber-400'
                : 'text-red-700 dark:text-red-400'
              }`}>
                {isActive ? '✓ Abonnement actif' : inTrial ? `⏳ Essai — ${trialDaysLeft}j restants` : '⚠ Accès restreint'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {isActive ? 'Plan Solo — renouvellement mensuel' : inTrial ? 'Passez à un plan payant pour continuer' : 'Abonnez-vous pour débloquer l\'accès'}
              </p>
            </div>
            <button
              onClick={onGoToBilling}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-all active:scale-[0.98]"
            >
              Gérer <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Invoices placeholder */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />Factures récentes
            </p>
            <div className="space-y-2">
              {[
                { date: 'Mars 2026', amount: '29€', status: 'Payée' },
                { date: 'Fév. 2026',  amount: '29€', status: 'Payée' },
                { date: 'Jan. 2026',  amount: '29€', status: 'Payée' },
              ].map((inv, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{inv.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {inv.status}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">{inv.amount}</span>
                    <button className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
              L'historique complet est disponible depuis le portail Stripe.
            </p>
          </div>

          {/* Documents upload */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />Documents légaux
            </p>
            <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 transition-all text-sm font-medium active:scale-[0.98]">
              <Upload className="w-4 h-4" />
              Déposer un document (PDF, max 5 Mo)
            </button>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
              Contrats de consentement, Kbis, assurance RC Pro…
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
