/**
 * Inkflow Client — "The Tattoo Journey"
 * ─────────────────────────────────────────────────────────────────────────────
 * Design system : fond clair · texte charbon · accent bronze encre (pas de bleu « générique »)
 * Typographie   : Syne (display) + Inter (body)
 * Motion        : Framer Motion — onboarding bulles, slides, spring micro-interactions
 * Structure     : Onboarding (Welcome → StylePicker) → Dashboard (4 onglets)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Heart, Star, ChevronRight, Search, X,
  ExternalLink, Wallet, User, CalendarDays,
  Map as MapIcon, Flame, LogOut, ArrowUpRight, Copy, Share2, Check,
  Navigation, List, LayoutGrid, Eye, EyeOff, Lock,
  Edit2, ChevronDown, CheckCircle2, AlertCircle,
  Gift, Calculator, Brush, Bell, Zap, Camera, Link2, Trash2, Plus,
  PartyPopper, FileText, Images, Users,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb: any = supabase;
import { clientNeedsPassword, clientOnboardingComplete } from '../../lib/clientAuth';
import { getInviteBaseUrl } from '../../lib/urls';
import { type ClientAppointment, type ClientTab } from '../../components/client/clientExperienceTypes';
import { HealingBanner } from '../../components/client/HealingBanner';
import { ClientReviewPrompt, shouldShowReviewPrompt, markReviewPromptDismissed } from '../../components/client/ClientReviewPrompt';
import { loadClientDiscoveryStudios, type NearbyStudio } from '../../lib/supabaseGeo';
import { isSupabaseConfigured } from '../../lib/supabase';
import { NearbyMapView } from '../../components/client/NearbyMapView';
import { LoyaltyCard } from '../../components/client/LoyaltyCard';
import { useToast } from '../../contexts/ToastContext';
import { ROUEN_STUDIOS, ROUEN_FLASH, type DisplayFlash, type SheetStudio } from '../../lib/rouenStudios';
import { CLIENT_DEMO_FEED_IMAGES } from '../../lib/clientTattooDemoImages';
import { getClientStudioFavoriteIds } from '../../lib/clientFavorites';

/** Faux profils / démo Rouen : uniquement en dev local (`npm run dev`). Jamais en build production. */
const CLIENT_DEMO_ROUEN_FALLBACK = !import.meta.env.PROD;

/** Identifiant flash Supabase (UUID) — les flashs démo Rouen (rf1, …) ne sont pas persistés. */
const FLASH_ID_DB = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Favoris studios en mode invité uniquement (pas de compte). */
const GUEST_STUDIO_FAV_KEY = 'inkflow_explore_studio_favs_v1::guest';

/** Map ES natif — référence explicite pour éviter tout masquage par un import (ex. icône Lucide `Map`). */
const NativeMap: MapConstructor = globalThis.Map;

// ── Design tokens — iOS Travel Discovery ──────────────────────────────────────
const N = {
  bg:         '#FFFFFF',
  surface:    '#F5F5F5',
  elevated:   '#EBEBEB',
  border:     '#E5E5E5',
  borderMid:  '#D4D4D4',
  text:       '#111111',
  textSub:    '#555555',
  muted:      '#999999',
  /** CTA pleins, pastilles — bronze / encre (contraste avec texte blanc) */
  neon:       '#6B5345',
  neonDim:    'rgba(107,83,69,0.13)',
  neonGlow:   '0 4px 22px rgba(107,83,69,0.18)',
  /** Prix, liens, labels sur fond clair */
  neonText:   '#4A3D32',
  /** Accent sur fond sombre (nav, badges sur photo) */
  neonOnDark: '#D4BC96',
  success:    '#22C55E',
  error:      '#EF4444',
} as const;

/** Micro-UI type Apple : gris système, noir pour l’état actif — pas de bronze sur chaque contrôle */
const UI = {
  fill:         '#1C1C1E',
  onFill:       '#FFFFFF',
  chrome:       '#E8E8ED',
  borderHair:   '#D2D2D7',
  label:        '#1C1C1E',
  labelMuted:   '#636366',
  segmentedBg:  '#ECECEC',
  shadowPill:   '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)',
} as const;

const TAB_ORDER: ClientTab[] = ['explore', 'inspire', 'rdv', 'loyalty', 'profile', 'accueil', 'wallet'];

/** Grille inspiration — une image = une carte (portfolio studio + flashs à proximité) */
interface InspirePin {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  studioSlug: string;
  /** Libellé style affiché / filtre */
  styleLabel: string;
  /** Clé stable pour chips (normalizeStyleKey) */
  styleKey: string;
  city: string | null;
  distanceKm: number | null;
  source: 'flash' | 'portfolio';
}

function inferStyleFromStudioSlug(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes('fineline') || s.includes('fine-line')) return 'Fine line';
  if (s.includes('japonais') || s.includes('irezumi')) return 'Japonais';
  if (s.includes('blackwork')) return 'Blackwork';
  if (s.includes('real') || s.includes('réal')) return 'Réaliste';
  if (s.includes('traditional') || s.includes('traditionnel')) return 'Traditionnel';
  if (s.includes('tribal')) return 'Tribal';
  return '';
}

function normalizeStyleKey(label: string): string {
  const raw = label.trim().toLowerCase();
  if (!raw) return 'autre';
  if (raw.includes('fine')) return 'fine-line';
  if (raw.includes('jap') || raw.includes('irezumi')) return 'japonais';
  if (raw.includes('black')) return 'blackwork';
  if (raw.includes('réal') || raw.includes('real')) return 'realiste';
  if (raw.includes('trad')) return 'traditionnel';
  if (raw.includes('tribal')) return 'tribal';
  if (raw.includes('géom') || raw.includes('geom')) return 'geometrique';
  return raw.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 36) || 'autre';
}

function styleKeyToLabel(key: string, fallback: string): string {
  const map: Record<string, string> = {
    'fine-line': 'Fine line',
    japonais: 'Japonais',
    blackwork: 'Blackwork',
    realiste: 'Réaliste',
    traditionnel: 'Traditionnel',
    tribal: 'Tribal',
    geometrique: 'Géométrique',
    autre: 'Autres styles',
    flash: 'Flash',
    portfolio: 'Portfolio',
  };
  return map[key] ?? (fallback || key);
}

function buildInspirePins(flash: DisplayFlash[], studios: SheetStudio[]): InspirePin[] {
  const bySlug = new NativeMap(studios.map((s) => [s.slug, s]));
  const pins: InspirePin[] = [];
  const seen = new Set<string>();

  for (const f of flash) {
    const url = f.imageUrl?.trim();
    if (!url) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    const st = bySlug.get(f.studioSlug);
    const inferred = inferStyleFromStudioSlug(f.studioSlug);
    const styleLabel = (st?.styleLabel?.trim() || inferred || 'Flash').trim();
    const styleKey = normalizeStyleKey(styleLabel);
    pins.push({
      id: `flash-${f.id}`,
      imageUrl: url,
      title: f.name,
      subtitle: `${f.artist} · ${f.studio}`,
      studioSlug: f.studioSlug,
      styleLabel,
      styleKey,
      city: st?.city ?? null,
      distanceKm: typeof st?.distanceKm === 'number' ? st.distanceKm : null,
      source: 'flash',
    });
  }

  for (const s of studios) {
    const baseStyle = (s.styleLabel?.trim() || inferStyleFromStudioSlug(s.slug) || 'Portfolio').trim();
    const styleKey = normalizeStyleKey(baseStyle);
    (s.portfolioImages ?? []).forEach((url, idx) => {
      const u = url?.trim();
      if (!u || seen.has(u)) return;
      seen.add(u);
      pins.push({
        id: `pf-${s.id}-${idx}`,
        imageUrl: u,
        title: baseStyle && baseStyle !== 'Portfolio' ? baseStyle : s.name,
        subtitle: `${s.artistLabel} · ${s.name}`,
        studioSlug: s.slug,
        styleLabel: baseStyle,
        styleKey,
        city: s.city ?? null,
        distanceKm: typeof s.distanceKm === 'number' ? s.distanceKm : null,
        source: 'portfolio',
      });
    });
  }
  return pins.sort((a, b) => a.id.localeCompare(b.id));
}

const CLIENT_AVATAR_MAX_EDGE = 512;
const CLIENT_AVATAR_MAX_FILE_MB = 8;

/** Clé dédiée : l’OAuth Google écrase souvent `avatar_url` / `picture` au refresh — notre upload reste ici. */
const CLIENT_PORTAL_AVATAR_META_KEY = 'inkflow_portal_avatar_url';

function strMeta(meta: Record<string, unknown> | undefined, key: string): string | null {
  const v = meta?.[key];
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

/**
 * Photo affichée portail : URL table (ne peut pas être écrasée par OAuth),
 * puis clé dédiée user_metadata, puis avatar_url, puis picture (Google).
 */
function resolveClientPortalAvatarUrl(
  meta: Record<string, unknown> | undefined,
  dbPortalAvatarUrl?: string | null,
): string | null {
  const db =
    typeof dbPortalAvatarUrl === 'string' && dbPortalAvatarUrl.trim().length > 0
      ? dbPortalAvatarUrl.trim()
      : null;
  return (
    db ??
    strMeta(meta, CLIENT_PORTAL_AVATAR_META_KEY) ??
    strMeta(meta, 'avatar_url') ??
    strMeta(meta, 'picture') ??
    null
  );
}

/** Redimensionne en JPEG pour upload léger (évite les bugs mémoire / timeout). */
function resizeImageFileToJpegBlob(file: File, maxEdge: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let { naturalWidth: w, naturalHeight: h } = img;
        if (!w || !h) {
          reject(new Error('dimensions'));
          return;
        }
        const scale = Math.min(1, maxEdge / Math.max(w, h));
        const tw = Math.max(1, Math.round(w * scale));
        const th = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0, tw, th);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('blob'));
          },
          'image/jpeg',
          0.88,
        );
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('load'));
    };
    img.src = objectUrl;
  });
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const STYLES = [
  { id: 'japonais',    label: 'Japonais',   emoji: '🐉', desc: 'Irezumi & Koi',        grad: ['#1A1510', '#3D2E1E'] },
  { id: 'fineline',    label: 'Fine line',  emoji: '✒️', desc: 'Délicat & précis',      grad: ['#181612', '#353028'] },
  { id: 'traditional', label: 'Traditional',emoji: '💀', desc: 'Old school vibes',      grad: ['#2E0A0A', '#6B1A1A'] },
  { id: 'blackwork',   label: 'Blackwork',  emoji: '⬛', desc: 'Géométrie & contraste', grad: ['#111111', '#2A2A2A'] },
  { id: 'realiste',    label: 'Réaliste',   emoji: '📸', desc: 'Hyper-réalisme',        grad: ['#0A1E0A', '#143514'] },
  { id: 'tribal',      label: 'Tribal',     emoji: '◈',  desc: 'Motifs ancestraux',     grad: ['#1E1A0A', '#3D3210'] },
];


const CHAT_BUBBLES = [
  { text: 'Le style de Vénus ! 💚',     delay: 0.3, side: 'right' as const },
  { text: "C'est son 1er tattoo ?",      delay: 1.0, side: 'left'  as const },
  { text: '🔥 Trop beau j\'adore',      delay: 1.7, side: 'right' as const },
  { text: 'Il dure combien de temps ?', delay: 2.3, side: 'left'  as const },
];

// Types et données Rouen importés depuis lib/rouenStudios.ts
// (DisplayFlash, SheetStudio, ROUEN_STUDIOS, ROUEN_FLASH)

const TXNS = [
  { id:'1', label:'Parrainage Aurélie', sub:'il y a 3 jours', amount:'+10,00 €', pos:true },
  { id:'2', label:'Remise fidélité',    sub:'12 mars 2026',   amount:'-5,00 €',  pos:false },
  { id:'3', label:'Cashback session',   sub:'8 mars 2026',    amount:'+3,00 €',  pos:true  },
];

interface WalletTxn { id: string; label: string; sub: string; amount: string; pos: boolean; }

// ── Community feed mock ───────────────────────────────────────────────────────
const FEED_POSTS = [
  { id:'fp1', studio:'Vénus Ink Rouen', artist:'Léa Moreau', img: CLIENT_DEMO_FEED_IMAGES[0], caption:'Nouveau flash fine line 🌸', likes:42, minsAgo:12 },
  { id:'fp2', studio:'Irezumi Studio',  artist:'Hugo Martin', img: CLIENT_DEMO_FEED_IMAGES[1], caption:'Dragon koi terminé ! 3h de travail 🐉', likes:87, minsAgo:45 },
  { id:'fp3', studio:'Atelier Leblanc', artist:'Thomas Leblanc', img: CLIENT_DEMO_FEED_IMAGES[2], caption:'Mandala géométrique — disponible en flash', likes:31, minsAgo:120 },
  { id:'fp4', studio:'Noir & Réel',     artist:'Sarah Dupont', img: CLIENT_DEMO_FEED_IMAGES[3], caption:'Portrait hyper-réaliste 📸', likes:65, minsAgo:200 },
];

// ── Price estimator data ───────────────────────────────────────────────────────
const PRICE_MATRIX: Record<string, Record<string, [number, number]>> = {
  'Fine line':   { 'Petit': [80,180],   'Moyen': [150,350], 'Grand': [300,600]  },
  'Blackwork':   { 'Petit': [100,220],  'Moyen': [200,450], 'Grand': [400,900]  },
  'Japonais':    { 'Petit': [150,300],  'Moyen': [280,600], 'Grand': [550,1200] },
  'Réaliste':    { 'Petit': [120,250],  'Moyen': [250,550], 'Grand': [500,1100] },
  'Traditionnel':{ 'Petit': [80,160],   'Moyen': [140,300], 'Grand': [280,550]  },
  'Géométrique': { 'Petit': [90,190],   'Moyen': [160,360], 'Grand': [320,650]  },
};

// ── Body map zones ─────────────────────────────────────────────────────────────
const BODY_ZONES = [
  { id: 'head',      label: 'Tête' },
  { id: 'neck',      label: 'Cou / Nuque' },
  { id: 'chest',     label: 'Poitrine' },
  { id: 'back',      label: 'Dos' },
  { id: 'l_arm',     label: 'Bras gauche' },
  { id: 'r_arm',     label: 'Bras droit' },
  { id: 'l_forearm', label: 'Avant-bras G' },
  { id: 'r_forearm', label: 'Avant-bras D' },
  { id: 'ribcage',   label: 'Côtes' },
  { id: 'belly',     label: 'Ventre' },
  { id: 'hip',       label: 'Hanche' },
  { id: 'l_thigh',   label: 'Cuisse G' },
  { id: 'r_thigh',   label: 'Cuisse D' },
  { id: 'l_calf',    label: 'Mollet G' },
  { id: 'r_calf',    label: 'Mollet D' },
  { id: 'foot',      label: 'Pied / Cheville' },
  { id: 'hand',      label: 'Main / Doigt' },
  { id: 'other',     label: 'Autre' },
];

// ── Utilities ─────────────────────────────────────────────────────────────────
function daysSince(d: string) {
  const t = new Date(d).getTime();
  if (!Number.isFinite(t)) return 999;
  return Math.floor((Date.now() - t) / 86400000);
}

/** Affichage distance client — null si studio sans GPS ou user sans position */
function formatClientStudioDistance(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
function formatDateFr(d: string) { return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }); }
/** En-tête carte RDV : date lisible + heure */
function formatRdvDateTimeHeader(dateStr: string, timeStr?: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return timeStr?.trim() ? `${dateStr} · ${timeStr}` : dateStr;
  }
  const datePart = d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
  const t = timeStr?.trim();
  return t ? `${datePart} · ${t}` : datePart;
}
/** Retire un token type référence vitrine en fin de 1re partie ("RDV vitrine - ABCXYZ…") */
function cleanServiceTitleSegment(segment: string): string {
  const s = segment.trim();
  if (!s) return s;
  return s.replace(/\s*-\s*[A-Z0-9]{10,}\s*$/i, '').trim() || s;
}
/** Titre court + sous-texte optionnel pour libellés concaténés (---, retours ligne) */
function parseAppointmentService(service: string): { title: string; subtitle?: string } {
  const raw = service.trim();
  if (!raw) return { title: 'Rendez-vous' };
  const bySep = raw.split(/\s*---+\s*/).map((x) => x.trim()).filter(Boolean);
  if (bySep.length >= 2) {
    const title = cleanServiceTitleSegment(bySep[0]);
    const rest = bySep.slice(1).join(' · ');
    return rest.length > 0 ? { title, subtitle: rest } : { title };
  }
  const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    return { title: cleanServiceTitleSegment(lines[0]), subtitle: lines.slice(1).join(' ') };
  }
  const one = cleanServiceTitleSegment(raw);
  if (one.length <= 100) return { title: one };
  return { title: `${one.slice(0, 97)}…`, subtitle: raw };
}

/** Cible « X séances » depuis `inkflow_studios.stamp_loyalty_settings` (aligné CRM) */
function parseStudioStampTarget(settings: unknown): number {
  if (!settings || typeof settings !== 'object') return 10;
  const raw = (settings as { tattoosRequired?: unknown }).tattoosRequired;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 1 && raw <= 99) return Math.floor(raw);
  return 10;
}

/** Image cassée (404 storage, URL expirée) : masque pour laisser le dégradé / initiales. */
function hideBrokenImage(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none';
}

const RDV_STATUS_LABEL: Record<string, string> = {
  pending: 'En attente de confirmation',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};
function mapsUrl(addr: string) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`; }
function generateCode(email: string) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) | 0;
  let code = '';
  for (let i = 0; i < 6; i++) { h = (h * 1103515245 + 12345) | 0; code += chars[Math.abs(h) % chars.length]; }
  return code;
}

// ══════════════════════════════════════════════════════════════════════════════
// ONBOARDING — Écran 1 : Bienvenue (bulles animées)
// ══════════════════════════════════════════════════════════════════════════════
const OnboardingWelcome: React.FC<{ onNext: () => void }> = ({ onNext }) => (
  <div
    className="fixed inset-0 z-50 flex flex-col overflow-hidden"
    style={{ background: N.bg }}
  >
    {/* Blob décoratif */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-[0.06]"
        style={{ background: N.neon, filter: 'blur(60px)' }}
      />
      <div
        className="absolute top-1/3 -left-20 w-48 h-48 rounded-full opacity-[0.04]"
        style={{ background: N.neon, filter: 'blur(40px)' }}
      />
    </div>

    {/* Zone visuelle "session tattoo" */}
    <div className="relative flex-1 flex items-center justify-center overflow-hidden">
      {/* Canvas simulant une session tattoo */}
      <div
        className="absolute inset-x-8 top-16 bottom-8 rounded-3xl overflow-hidden border"
        style={{
          borderColor: N.border,
          background: 'linear-gradient(160deg, #141010 0%, #1A1218 40%, #0E1018 100%)',
        }}
      >
        {/* Lignes de tatouage abstraites */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M150 80 C180 100 200 140 190 180 C180 220 160 240 150 280 C140 240 120 220 110 180 C100 140 120 100 150 80Z" stroke={N.neon} strokeWidth="1" strokeDasharray="4 6"/>
          <path d="M80 150 Q150 130 220 150 Q200 200 150 210 Q100 200 80 150Z" stroke={N.neon} strokeWidth="0.8" strokeDasharray="3 5" opacity="0.6"/>
          <circle cx="150" cy="180" r="30" stroke={N.neon} strokeWidth="0.6" strokeDasharray="2 4" opacity="0.4"/>
          <path d="M60 300 L100 260 L140 280 L180 250 L220 270 L240 300" stroke="rgba(245,243,239,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>

        {/* Label artiste */}
        <div
          className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full border"
          style={{ background: 'rgba(10,10,10,0.75)', backdropFilter: 'blur(8px)', borderColor: N.border }}
        >
          <div className="w-5 h-5 rounded-full" style={{ background: `linear-gradient(135deg, #3A3028, #1C1612)` }} />
          <span className="text-xs font-semibold" style={{ color: N.text }}>Léa · Vénus Ink</span>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: N.neon }} />
        </div>
      </div>

      {/* Bulles de chat animées */}
      {CHAT_BUBBLES.map((b, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: b.delay, type: 'spring', stiffness: 280, damping: 22 }}
          className={`absolute flex ${b.side === 'right' ? 'justify-end' : 'justify-start'} px-6`}
          style={{
            top: `${22 + i * 16}%`,
            left: b.side === 'right' ? 'auto' : 0,
            right: b.side === 'left' ? 'auto' : 0,
            width: '100%',
            zIndex: 10,
          }}
        >
          <div
            className="px-4 py-2.5 rounded-2xl max-w-[62%] text-sm font-medium shadow-lg"
            style={{
              background: b.side === 'right'
                ? `linear-gradient(135deg, rgba(212,188,150,0.18), rgba(212,188,150,0.08))`
                : N.elevated,
              border: `1px solid ${b.side === 'right' ? 'rgba(212,188,150,0.35)' : N.border}`,
              color: N.text,
            }}
          >
            {b.text}
          </div>
        </motion.div>
      ))}
    </div>

    {/* Bas de page */}
    <div className="px-6 pt-6 pb-10" style={{ paddingBottom: 'max(40px, env(safe-area-inset-bottom))' }}>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="text-4xl font-black leading-tight mb-2"
        style={{ color: N.text, fontFamily: 'var(--font-syne, Syne, sans-serif)' }}
      >
        Explorez l'art<br />
        <span style={{ color: N.neon }}>près de chez vous.</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm mb-8"
        style={{ color: N.muted }}
      >
        Trouvez votre prochain tatoueur, réservez et suivez votre cicatrisation.
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
        style={{
          background: N.neon,
          color: N.bg,
          boxShadow: N.neonGlow,
        }}
      >
        Découvrir
        <ArrowUpRight className="w-5 h-5" />
      </motion.button>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// ONBOARDING — Écran 2 : Sélection des styles
// ══════════════════════════════════════════════════════════════════════════════
const OnboardingStylePicker: React.FC<{ onDone: (styles: string[]) => void }> = ({ onDone }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: N.bg, paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
    >
      {/* Barre de progression */}
      <div className="px-6 pt-14 pb-2">
        <div className="flex gap-1.5 mb-8">
          <div className="h-1 flex-1 rounded-full" style={{ background: N.neon }} />
          <div className="h-1 flex-1 rounded-full" style={{ background: N.border }} />
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black leading-tight mb-1"
          style={{ color: N.text, fontFamily: 'var(--font-syne, Syne, sans-serif)' }}
        >
          Quels styles<br />t'inspirent ?
        </motion.h2>
        <p className="text-sm" style={{ color: N.muted }}>
          Choisis autant que tu veux
        </p>
      </div>

      {/* Grille de styles */}
      <div className="flex-1 overflow-y-auto px-6 pt-5">
        <div className="grid grid-cols-2 gap-3">
          {STYLES.map((s, i) => {
            const active = selected.has(s.id);
            return (
              <motion.button
                key={s.id}
                type="button"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 280, damping: 22 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggle(s.id)}
                className="relative rounded-3xl overflow-hidden text-left p-4 h-28 flex flex-col justify-between border-2 transition-all"
                style={{
                  borderColor: active ? N.neon : N.border,
                  background: active
                    ? `linear-gradient(135deg, ${s.grad[0]}, ${s.grad[1]})`
                    : N.surface,
                  boxShadow: active ? N.neonGlow : 'none',
                }}
              >
                {/* Checkmark */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: N.neon }}
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: N.bg }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <span className="text-2xl">{s.emoji}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: active ? N.text : N.text }}>
                    {s.label}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: active ? 'rgba(245,243,239,0.7)' : N.muted }}>
                    {s.desc}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pt-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onDone([...selected])}
          disabled={selected.size === 0}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all"
          style={{
            background: selected.size > 0 ? N.neon : N.border,
            color: selected.size > 0 ? N.bg : N.muted,
            boxShadow: selected.size > 0 ? N.neonGlow : 'none',
          }}
        >
          Continuer →
        </motion.button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// FLASH CARD
// ══════════════════════════════════════════════════════════════════════════════
const FlashCard: React.FC<{
  f: DisplayFlash; fav: boolean; onFav: () => void;
}> = ({ f, fav, onFav }) => {
  const cardContent = (
    <motion.div
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] overflow-hidden border"
      style={{ borderColor: N.border, background: N.surface }}
    >
      <div
        className="relative overflow-hidden"
        style={{ height: f.h * 0.82, background: `linear-gradient(155deg, ${f.grad[0]}, ${f.grad[1]})` }}
      >
        {/* Image réelle si disponible */}
        {f.imageUrl && (
          <img
            src={f.imageUrl}
            alt={f.name}
            className="absolute inset-0 z-0 w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
            onError={hideBrokenImage}
          />
        )}

        {/* SVG décoratif (fallback sans image) */}
        {!f.imageUrl && (
          <svg className="absolute inset-0 z-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
            <circle cx="70" cy="30" r="25" fill="none" stroke="rgba(212,188,150,0.22)" strokeWidth="0.5"/>
            <path d="M10 60 Q50 40 90 60 Q70 85 50 80 Q30 85 10 60Z" fill="rgba(255,255,255,0.03)"/>
          </svg>
        )}

        {/* Hot/urgency badge + countdown */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1">
          {f.hot ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black"
              style={{ background: 'rgba(239,68,68,0.90)', backdropFilter: 'blur(8px)', color: '#fff' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
              1 seul dispo
            </div>
          ) : (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold"
              style={{ background: 'rgba(10,10,10,0.78)', backdropFilter: 'blur(8px)', color: N.neonOnDark }}
            >
              <Flame className="w-3 h-3" />
              Flash unique
            </div>
          )}
          {f.expiresAt && <FlashCountdown expiresAt={f.expiresAt} />}
        </div>

        {/* Heart */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center border"
          style={{ background: 'rgba(10,10,10,0.7)', backdropFilter: 'blur(8px)', borderColor: fav ? 'rgba(212,188,150,0.45)' : N.border }}
        >
          <Heart className="w-3.5 h-3.5" style={{ color: fav ? N.neonOnDark : '#fff', fill: fav ? N.neonOnDark : 'none' }} />
        </motion.button>

        {/* Scrim bas : gradient sur toute la zone (évite la « bande » noire) + texte clair lisible */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none flex flex-col justify-end px-3 pb-2.5 pt-16"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.12) 65%, transparent 100%)',
          }}
        >
          <p
            className="text-[13px] font-bold text-white leading-tight"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.65)' }}
          >
            {f.name}
          </p>
          <p
            className="text-[10px] mt-0.5 text-white/85 leading-snug"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {f.artist} · {f.dist}
          </p>
        </div>
      </div>
      <div className="px-3 py-2.5 flex items-center justify-between">
        <span className="text-sm font-black tabular-nums" style={{ color: N.neonText }}>{f.price}€</span>
        <span className="text-[10px] px-2 py-0.5 rounded-lg font-medium" style={{ background: '#EDE8E0', color: N.textSub }}>{f.studio}</span>
      </div>
    </motion.div>
  );

  // Si le flash est lié à une vraie vitrine, on enveloppe dans un lien
  if (f.studioSlug) {
    return (
      <a href={`/studio/${f.studioSlug}`} className="block">
        {cardContent}
      </a>
    );
  }
  return cardContent;
};

// ══════════════════════════════════════════════════════════════════════════════
// GUEST LOGIN FORM (profil tab — magic link inline)
// ══════════════════════════════════════════════════════════════════════════════
const GuestLoginForm: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  const reset = () => { setErrorMsg(''); };

  const submit = async () => {
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setErrorMsg('Email invalide.'); return; }
    if (pwd.length < 8) { setErrorMsg('Mot de passe : 8 caractères min.'); return; }
    if (mode === 'signup' && pwd !== pwd2) { setErrorMsg('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true); setErrorMsg('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: em, password: pwd,
          options: { data: { client_onboarding_complete: true, client_password_set: true } },
        });
        if (error) {
          const m = error.message.toLowerCase();
          setErrorMsg(m.includes('already') ? 'Un compte existe déjà. Passe en « Se connecter ».' : error.message);
          return;
        }
        if (data.session) { window.location.reload(); return; }
        setDone(true);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: em, password: pwd });
        if (error) {
          setErrorMsg('Email ou mot de passe incorrect.');
          return;
        }
        if (data.user) { window.location.reload(); }
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center text-center gap-5 py-10">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: N.neonDim, border: `1.5px solid ${N.neon}` }}>
          <Check className="w-7 h-7" style={{ color: N.neon }} />
        </div>
        <div>
          <p className="text-xl font-black mb-2" style={{ color: N.text }}>Vérifie ta boîte mail</p>
          <p className="text-sm leading-relaxed" style={{ color: N.muted }}>
            Un email de confirmation a été envoyé à<br />
            <strong style={{ color: N.textSub }}>{email}</strong>.<br />
            Clique sur le lien pour activer ton compte.
          </p>
        </div>
        <button type="button" onClick={() => { setDone(false); setMode('signin'); }}
          className="text-sm font-semibold" style={{ color: N.neon }}>
          Déjà confirmé ? Se connecter
        </button>
      </div>
    );
  }

  const canSubmit = email.trim() && pwd.length >= 8 && (mode === 'signin' || pwd === pwd2);

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="text-center pb-1">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
          style={{ background: N.neonDim }}>
          <User className="w-5 h-5" style={{ color: N.neon }} />
        </div>
        <h2 className="text-xl font-black mb-1" style={{ color: N.text }}>Mon compte</h2>
        <p className="text-xs" style={{ color: N.muted }}>Accède à tes RDV, ton wallet et tes favoris.</p>
      </div>

      {/* Tab toggle */}
      <div className="flex rounded-2xl p-1 gap-1" style={{ background: N.surface }}>
        {(['signup', 'signin'] as const).map(m => (
          <button key={m} type="button"
            onClick={() => { setMode(m); reset(); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? N.text : N.muted,
              boxShadow: mode === m ? '0 1px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
            {m === 'signup' ? "S'inscrire" : 'Se connecter'}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="space-y-2.5">
        <input type="email" value={email}
          onChange={e => { setEmail(e.target.value); reset(); }}
          placeholder="ton@email.com"
          className="w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition-all"
          style={{ background: N.surface, borderColor: N.border, color: N.text, caretColor: N.neon }}
          onFocus={e => (e.currentTarget.style.borderColor = N.neon)}
          onBlur={e => (e.currentTarget.style.borderColor = N.border)}
        />

        <div className="relative">
          <input type={showPwd ? 'text' : 'password'} value={pwd}
            onChange={e => { setPwd(e.target.value); reset(); }}
            onKeyDown={e => e.key === 'Enter' && !loading && canSubmit && submit()}
            placeholder="Mot de passe (8 car. min.)"
            className="w-full rounded-2xl border px-4 py-3.5 pr-11 text-sm outline-none transition-all"
            style={{ background: N.surface, borderColor: N.border, color: N.text, caretColor: N.neon }}
            onFocus={e => (e.currentTarget.style.borderColor = N.neon)}
            onBlur={e => (e.currentTarget.style.borderColor = N.border)}
          />
          <button type="button" onClick={() => setShowPwd(p => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1">
            {showPwd
              ? <EyeOff className="w-4 h-4" style={{ color: N.muted }} />
              : <Eye className="w-4 h-4" style={{ color: N.muted }} />
            }
          </button>
        </div>

        {mode === 'signup' && (
          <input type={showPwd ? 'text' : 'password'} value={pwd2}
            onChange={e => { setPwd2(e.target.value); reset(); }}
            placeholder="Confirme le mot de passe"
            className="w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition-all"
            style={{
              background: N.surface,
              borderColor: pwd2 && pwd !== pwd2 ? N.error : N.border,
              color: N.text, caretColor: N.neon,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = pwd2 && pwd !== pwd2 ? N.error : N.neon)}
            onBlur={e => (e.currentTarget.style.borderColor = pwd2 && pwd !== pwd2 ? N.error : N.border)}
          />
        )}

        {errorMsg && (
          <p className="text-xs px-1 font-medium" style={{ color: N.error }}>{errorMsg}</p>
        )}
      </div>

      {/* Submit */}
      <motion.button type="button" whileTap={{ scale: 0.98 }}
        disabled={loading || !canSubmit}
        onClick={submit}
        className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
        style={{
          background: canSubmit ? N.neon : N.border,
          color: canSubmit ? '#fff' : N.muted,
          boxShadow: canSubmit ? N.neonGlow : 'none',
        }}>
        {loading
          ? <span className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
          : <><Lock className="w-4 h-4" />{mode === 'signup' ? 'Créer mon compte' : 'Me connecter'}</>
        }
      </motion.button>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ARTIST BOTTOM SHEET
// ══════════════════════════════════════════════════════════════════════════════
const GuestConnectPanel: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 340, damping: 32 }}
    className="rounded-3xl overflow-hidden"
    style={{ background: 'linear-gradient(145deg, #1a1008 0%, #2d1f0e 60%, #1a1008 100%)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
  >
    {/* Top accent line */}
    <div className="h-1" style={{ background: `linear-gradient(90deg, ${N.neon}, #D4BC96, ${N.neon})` }} />
    <div className="p-8 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.25)' }}>
        ✦
      </div>
      <div>
        <h3 className="text-lg font-black text-white mb-1">{title}</h3>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{body}</p>
      </div>
      <motion.a
        href="/client"
        whileTap={{ scale: 0.97 }}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm"
        style={{ background: '#c9a96e', color: '#1a1008', boxShadow: '0 6px 24px rgba(201,169,110,0.35)' }}
      >
        Se connecter ou créer un compte
      </motion.a>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Aucune carte bancaire requise</p>
    </div>
  </motion.div>
);

const ArtistSheet: React.FC<{ studio: SheetStudio | null; onClose: () => void; isGuest?: boolean }> = ({ studio, onClose, isGuest }) => (
  <AnimatePresence>
    {studio && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 360, damping: 36 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-t-[2.5rem] border-t border-x overflow-hidden max-h-[90vh] overflow-y-auto"
          style={{ background: N.bg, borderColor: N.borderMid }}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full" style={{ background: N.borderMid }} />
          </div>

          <div
            className="h-36 mx-4 rounded-2xl relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${studio.grad[0]}, ${studio.grad[1]})` }}
          >
            <button type="button" onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center border"
              style={{ background: 'rgba(10,10,10,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="absolute -bottom-7 left-5 w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-lg font-black text-white border-4"
              style={{ borderColor: N.bg, background: `linear-gradient(135deg, ${studio.grad[0]}, ${studio.grad[1]})` }}
            >
              {studio.avatarUrl ? (
                <img src={studio.avatarUrl} alt="" className="w-full h-full object-cover object-top" onError={hideBrokenImage} />
              ) : (
                studio.name.slice(0, 2)
              )}
            </div>
          </div>

          <div className="px-5 pt-10 pb-8 space-y-4">
            <div>
              <h2 className="text-xl font-black" style={{ color: N.text }}>{studio.name}</h2>
              <p className="text-sm mt-0.5" style={{ color: N.muted }}>
                {studio.artistLabel}{studio.styleLabel ? ` · ${studio.styleLabel}` : ''}
                {studio.city ? ` · ${studio.city}` : ''}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { l: 'Note', v: studio.rating > 0 ? String(studio.rating) : '–', neon: true },
                { l: 'Distance', v: studio.distLabel, neon: false },
                { l: 'Style', v: studio.styleLabel || '–', neon: false },
              ].map(({ l, v, neon }) => (
                <div key={l} className="rounded-2xl border p-3 text-center" style={{ borderColor: N.border, background: N.elevated }}>
                  <p className="text-sm font-black truncate" style={{ color: neon ? N.neonText : N.text }}>{v}</p>
                  <p className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: N.muted }}>{l}</p>
                </div>
              ))}
            </div>

            {/* Portfolio images */}
            <div className="grid grid-cols-3 gap-2">
              {studio.portfolioImages.length > 0
                ? studio.portfolioImages.slice(0, 6).map((url, i) => (
                  <div key={i} className="aspect-square rounded-2xl border overflow-hidden" style={{ borderColor: N.border }}>
                    <img src={url} alt="" className="w-full h-full object-cover" onError={hideBrokenImage} />
                  </div>
                ))
                : Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="aspect-square rounded-2xl border overflow-hidden" style={{ borderColor: N.border }}>
                    <div className="w-full h-full" style={{ background: `linear-gradient(${135 + i * 20}deg, ${studio.grad[0]}, ${studio.grad[1]})` }} />
                  </div>
                ))
              }
            </div>

            <div className="flex gap-2">
              {studio.slug && (
                <a
                  href={`/studio/${studio.slug}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border transition-all"
                  style={{ borderColor: N.borderMid, color: N.text, background: N.elevated }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Vitrine
                </a>
              )}
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (isGuest) { window.location.href = '/client'; return; }
                  if (studio.slug) { window.location.href = `/book/${studio.slug}`; }
                }}
                className="flex-1 py-3.5 rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all"
                style={{ background: N.neon, color: N.bg, boxShadow: N.neonGlow }}
              >
                {isGuest ? 'Se connecter' : 'Réserver'}
              </motion.button>
            </div>
          </div>
          <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ══════════════════════════════════════════════════════════════════════════════
// PAGE TRANSITIONS
// ══════════════════════════════════════════════════════════════════════════════
const pageV = {
  enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? -24 : 24, opacity: 0 }),
};

// ══════════════════════════════════════════════════════════════════════════════
// FLASH COUNTDOWN PILL
// ══════════════════════════════════════════════════════════════════════════════
const FlashCountdown: React.FC<{ expiresAt: number }> = ({ expiresAt }) => {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) { setLabel('Expire bientôt'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h > 0) setLabel(`⚡ ${h}h${m < 10 ? '0' + m : m}`);
      else if (m > 0) setLabel(`⚡ ${m} min`);
      else setLabel('⚡ < 1 min');
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!label) return null;
  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black"
      style={{ background: 'rgba(239,68,68,0.90)', color: '#fff' }}
    >
      <span className="w-1 h-1 rounded-full bg-white animate-pulse shrink-0" />
      {label}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ANNIVERSARY BANNER
// ══════════════════════════════════════════════════════════════════════════════
const AnniversaryBanner: React.FC<{
  appointment: ClientAppointment;
  years: number;
  onDismiss: () => void;
}> = ({ appointment, years, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: -10, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.97 }}
    className="mx-4 mt-3 rounded-2xl overflow-hidden border relative"
    style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))', borderColor: 'rgba(251,191,36,0.28)' }}
  >
    <div className="px-4 py-3.5 flex items-start gap-3">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-xl"
        style={{ background: 'rgba(251,191,36,0.18)' }}>
        🎂
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black" style={{ color: '#FBBF24' }}>
          {years} an{years > 1 ? 's' : ''} déjà !
        </p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(251,191,36,0.75)' }}>
          Ton tatouage <span className="font-semibold">"{appointment.service}"</span>
          {appointment.studio_name ? ` chez ${appointment.studio_name}` : ''} a {years} an{years > 1 ? 's' : ''} aujourd'hui. Comment il vieillit ? 🔥
        </p>
      </div>
      <button type="button" onClick={onDismiss}
        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(251,191,36,0.12)' }}>
        <X className="w-3.5 h-3.5" style={{ color: 'rgba(251,191,36,0.6)' }} />
      </button>
    </div>
  </motion.div>
);

// ══════════════════════════════════════════════════════════════════════════════
// COMMUNITY FEED SECTION
// ══════════════════════════════════════════════════════════════════════════════
const CommunityFeed: React.FC = () => {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setLikedPosts(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between px-5 mb-3">
        <h2 className="text-xl font-black" style={{ color: N.text }}>
          Feed <span className="text-base font-normal" style={{ color: N.muted }}>Studios</span>
        </h2>
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
      </div>
      <div className="flex gap-4 overflow-x-auto pl-5 pr-3 pb-2" style={{ scrollbarWidth: 'none' }}>
        {FEED_POSTS.map((post) => (
          <motion.div key={post.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-shrink-0 rounded-3xl overflow-hidden border"
            style={{ width: 200, background: N.surface, borderColor: N.border }}
          >
            <div className="relative h-48">
              <img src={post.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }} />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-[11px] font-semibold text-white leading-snug line-clamp-2">{post.caption}</p>
              </div>
              <motion.button type="button" whileTap={{ scale: 0.85 }}
                onClick={() => toggle(post.id)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                <Heart className="w-4 h-4"
                  style={{ color: likedPosts.has(post.id) ? '#fb7185' : '#fff', fill: likedPosts.has(post.id) ? '#fb7185' : 'none' }} />
              </motion.button>
            </div>
            <div className="px-3 py-2.5">
              <p className="text-[11px] font-bold truncate" style={{ color: N.text }}>{post.studio}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px]" style={{ color: N.muted }}>{post.minsAgo < 60 ? `il y a ${post.minsAgo} min` : `il y a ${Math.floor(post.minsAgo/60)}h`}</p>
                <p className="text-[10px]" style={{ color: N.muted }}>{post.likes + (likedPosts.has(post.id) ? 1 : 0)} ❤️</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PRIX ESTIMATEUR MODAL
// ══════════════════════════════════════════════════════════════════════════════
const PriceEstimator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [style, setStyle] = useState('');
  const [size, setSize] = useState('');
  const range = style && size ? PRICE_MATRIX[style]?.[size] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-[2.5rem] border-t border-x overflow-hidden"
        style={{ background: N.bg, borderColor: N.borderMid }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: N.borderMid }} />
        </div>
        <div className="px-6 pb-10 pt-3 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: N.neonDim }}>
              <Calculator className="w-5 h-5" style={{ color: N.neon }} />
            </div>
            <div>
              <h3 className="text-xl font-black" style={{ color: N.text }}>Estimateur de prix</h3>
              <p className="text-xs" style={{ color: N.muted }}>Fourchette indicative · tarifs Rouen</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: N.muted }}>Style</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PRICE_MATRIX).map((s) => (
                <button key={s} type="button"
                  onClick={() => setStyle(s)}
                  className="px-3 py-2 rounded-2xl text-xs font-semibold border transition-all"
                  style={{
                    background: style === s ? N.neon : 'transparent',
                    borderColor: style === s ? N.neon : N.border,
                    color: style === s ? N.bg : N.muted,
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: N.muted }}>Taille</p>
            <div className="flex gap-2">
              {['Petit', 'Moyen', 'Grand'].map((sz) => (
                <button key={sz} type="button"
                  onClick={() => setSize(sz)}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all"
                  style={{
                    background: size === sz ? N.neon : 'transparent',
                    borderColor: size === sz ? N.neon : N.border,
                    color: size === sz ? N.bg : N.muted,
                  }}>
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {range && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-3xl p-5 text-center border"
                style={{ background: N.neonDim, borderColor: `${N.neon}40` }}
              >
                <p className="text-4xl font-black tabular-nums" style={{ color: N.neonText }}>
                  {range[0]}€ – {range[1]}€
                </p>
                <p className="text-xs mt-1" style={{ color: N.muted }}>
                  {style} · {size} · estimation Inkflow
                </p>
                <p className="text-[10px] mt-2" style={{ color: N.muted }}>
                  Tarif final fixé par l'artiste lors de la consultation.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
      </motion.div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// COMMISSION FORM MODAL
// ══════════════════════════════════════════════════════════════════════════════
const CommissionModal: React.FC<{
  sessionEmail: string | null;
  onClose: () => void;
}> = ({ sessionEmail, onClose }) => {
  const toast = useToast();
  const [style, setStyle] = useState('');
  const [zone, setZone] = useState('');
  const [budget, setBudget] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!sessionEmail) { window.location.href = '/client'; return; }
    if (!style || !desc.trim()) { toast.error('Remplis le style et la description'); return; }
    setLoading(true);
    try {
      await (supabase as any).from('inkflow_commissions').insert({
        client_email: sessionEmail,
        style,
        body_zone: zone || null,
        budget: budget ? parseInt(budget) : null,
        description: desc.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      setDone(true);
    } catch {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.86)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-[2.5rem] border-t border-x overflow-y-auto max-h-[90vh]"
        style={{ background: N.bg, borderColor: N.borderMid }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: N.borderMid }} />
        </div>
        {done ? (
          <div className="flex flex-col items-center gap-4 px-6 pb-12 pt-4 text-center">
            <div className="text-5xl">🎨</div>
            <h3 className="text-xl font-black" style={{ color: N.text }}>Demande envoyée !</h3>
            <p className="text-sm" style={{ color: N.muted }}>
              Les studios compatibles avec ton style seront notifiés. Tu recevras un devis sous 48h.
            </p>
            <button type="button" onClick={onClose}
              className="mt-2 px-8 py-3.5 rounded-2xl font-bold text-sm"
              style={{ background: N.neon, color: N.bg, boxShadow: N.neonGlow }}>
              Parfait !
            </button>
          </div>
        ) : (
          <div className="px-6 pb-8 pt-2 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: N.neonDim }}>
                <Brush className="w-5 h-5" style={{ color: N.neon }} />
              </div>
              <div>
                <h3 className="text-xl font-black" style={{ color: N.text }}>Design sur mesure</h3>
                <p className="text-xs" style={{ color: N.muted }}>Commande un projet custom auprès des artistes Inkflow</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: N.muted }}>Style recherché *</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PRICE_MATRIX).map((s) => (
                  <button key={s} type="button" onClick={() => setStyle(s)}
                    className="px-3 py-2 rounded-2xl text-xs font-semibold border transition-all"
                    style={{
                      background: style === s ? N.neon : 'transparent',
                      borderColor: style === s ? N.neon : N.border,
                      color: style === s ? N.bg : N.muted,
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: N.muted }}>Emplacement</p>
              <div className="flex flex-wrap gap-2">
                {['Bras', 'Dos', 'Cuisse', 'Cheville', 'Poitrine', 'Cou', 'Autre'].map((z) => (
                  <button key={z} type="button" onClick={() => setZone(z === zone ? '' : z)}
                    className="px-3 py-2 rounded-2xl text-xs font-semibold border transition-all"
                    style={{
                      background: zone === z ? N.elevated : 'transparent',
                      borderColor: zone === z ? N.borderMid : N.border,
                      color: zone === z ? N.text : N.muted,
                    }}>
                    {z}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: N.muted }}>Budget indicatif (€)</p>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="ex: 250"
                className="w-full rounded-2xl border px-4 py-3.5 text-sm outline-none"
                style={{ background: N.surface, borderColor: N.border, color: N.text, caretColor: N.neon }}
                onFocus={e => (e.currentTarget.style.borderColor = N.neon)}
                onBlur={e => (e.currentTarget.style.borderColor = N.border)}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: N.muted }}>Description du projet *</p>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Décris ton idée, les références visuelles, le niveau de détail souhaité..."
                rows={4}
                className="w-full rounded-2xl border px-4 py-3.5 text-sm outline-none resize-none"
                style={{ background: N.surface, borderColor: N.border, color: N.text, caretColor: N.neon }}
                onFocus={e => (e.currentTarget.style.borderColor = N.neon)}
                onBlur={e => (e.currentTarget.style.borderColor = N.border)}
              />
            </div>

            <motion.button type="button" whileTap={{ scale: 0.98 }}
              disabled={loading || !style || !desc.trim()}
              onClick={submit}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{
                background: style && desc.trim() ? N.neon : N.border,
                color: style && desc.trim() ? N.bg : N.muted,
                boxShadow: style && desc.trim() ? N.neonGlow : 'none',
              }}>
              {loading
                ? <span className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: N.bg, borderTopColor: 'transparent' }} />
                : <><Brush className="w-4 h-4" /> Envoyer ma demande</>
              }
            </motion.button>
          </div>
        )}
        <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
      </motion.div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// GIFT CARD SECTION
// ══════════════════════════════════════════════════════════════════════════════
const GiftCardSection: React.FC<{ sessionEmail: string }> = ({ sessionEmail }) => {
  const toast = useToast();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const PRESET_AMOUNTS = [25, 50, 100, 150];

  const sendGift = async () => {
    const em = recipientEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { toast.error('Email invalide'); return; }
    if (!amount) { toast.error('Choisis un montant'); return; }
    setLoading(true);
    try {
      let h = 5381;
      const seed = `${sessionEmail}-${em}-${amount}-${Date.now()}`;
      for (let i = 0; i < seed.length; i++) h = ((h << 5) + h) + seed.charCodeAt(i);
      const giftCode = 'GIFT-' + Math.abs(h).toString(36).toUpperCase().slice(0, 8);
      await (supabase as any).from('inkflow_gift_cards').insert({
        sender_email: sessionEmail,
        recipient_email: em,
        amount_cents: parseInt(amount) * 100,
        code: giftCode,
        message: message.trim() || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      setDone(true);
    } catch {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const redeemGift = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('inkflow_gift_cards')
        .select('id, amount_cents, status')
        .eq('code', redeemCode.trim().toUpperCase())
        .eq('recipient_email', sessionEmail)
        .maybeSingle();
      if (!data) { toast.error('Code invalide ou non destiné à ce compte'); return; }
      if ((data as { status: string }).status === 'used') { toast.error('Ce code a déjà été utilisé'); return; }
      // Crédit wallet
      const d = data as { id: string; amount_cents: number; status: string };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('inkflow_credit_wallet', { p_email: sessionEmail, p_cents: d.amount_cents });
      await (supabase as any).from('inkflow_gift_cards').update({ status: 'used', used_at: new Date().toISOString() }).eq('id', d.id);
      toast.success(`+${(d.amount_cents / 100).toFixed(0)}€ crédités sur ton wallet !`);
      setRedeemCode('');
    } catch {
      toast.error('Erreur lors de l\'activation');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Envoyer une gift card */}
      <div className="rounded-3xl border overflow-hidden" style={{ borderColor: N.borderMid, background: N.surface }}>
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: N.border }}>
          <div className="flex items-center gap-3 mb-1">
            <Gift className="w-5 h-5" style={{ color: N.neon }} />
            <h3 className="text-base font-black" style={{ color: N.text }}>Offrir une session</h3>
          </div>
          <p className="text-xs" style={{ color: N.muted }}>Envoie un crédit Inkflow à un proche</p>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
            <div className="text-4xl">🎁</div>
            <p className="text-base font-black" style={{ color: N.text }}>Cadeau envoyé !</p>
            <p className="text-xs" style={{ color: N.muted }}>Le destinataire recevra un email avec son code.</p>
            <button type="button" onClick={() => { setDone(false); setRecipientEmail(''); setAmount(''); setMessage(''); }}
              className="text-xs font-semibold px-4 py-2 rounded-xl border"
              style={{ borderColor: N.border, color: N.neonText, background: N.neonDim }}>
              Envoyer un autre
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-3">
            <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}
              placeholder="Email du destinataire"
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{ background: N.elevated, borderColor: N.border, color: N.text, caretColor: N.neon }}
              onFocus={e => (e.currentTarget.style.borderColor = N.neon)}
              onBlur={e => (e.currentTarget.style.borderColor = N.border)}
            />
            <div className="flex gap-2">
              {PRESET_AMOUNTS.map((a) => (
                <button key={a} type="button" onClick={() => setAmount(String(a))}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold border transition-all"
                  style={{
                    background: amount === String(a) ? N.neon : 'transparent',
                    borderColor: amount === String(a) ? N.neon : N.border,
                    color: amount === String(a) ? N.bg : N.muted,
                  }}>
                  {a}€
                </button>
              ))}
            </div>
            <input type="text" value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Message (optionnel)"
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{ background: N.elevated, borderColor: N.border, color: N.text, caretColor: N.neon }}
              onFocus={e => (e.currentTarget.style.borderColor = N.neon)}
              onBlur={e => (e.currentTarget.style.borderColor = N.border)}
            />
            <motion.button type="button" whileTap={{ scale: 0.98 }}
              disabled={loading || !recipientEmail || !amount}
              onClick={sendGift}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
              style={{
                background: recipientEmail && amount ? N.neon : N.border,
                color: recipientEmail && amount ? N.bg : N.muted,
                boxShadow: recipientEmail && amount ? N.neonGlow : 'none',
              }}>
              {loading
                ? <span className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: N.bg, borderTopColor: 'transparent' }} />
                : <><Gift className="w-4 h-4" /> Envoyer le cadeau</>
              }
            </motion.button>
          </div>
        )}
      </div>

      {/* Activer un code cadeau */}
      <div className="rounded-3xl border overflow-hidden" style={{ borderColor: N.border, background: N.surface }}>
        <div className="px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: N.muted }}>Activer un code cadeau</p>
          <div className="flex gap-2">
            <input type="text" value={redeemCode} onChange={e => setRedeemCode(e.target.value)}
              placeholder="GIFT-XXXXXXXX"
              className="flex-1 rounded-2xl border px-4 py-3 text-sm outline-none font-mono uppercase"
              style={{ background: N.elevated, borderColor: N.border, color: N.text, caretColor: N.neon }}
              onFocus={e => (e.currentTarget.style.borderColor = N.neon)}
              onBlur={e => (e.currentTarget.style.borderColor = N.border)}
            />
            <motion.button type="button" whileTap={{ scale: 0.95 }}
              onClick={redeemGift}
              disabled={redeeming || !redeemCode.trim()}
              className="w-14 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: redeemCode.trim() ? N.neon : N.border,
                color: redeemCode.trim() ? N.bg : N.muted,
              }}>
              {redeeming
                ? <span className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: N.bg, borderTopColor: 'transparent' }} />
                : <Check className="w-5 h-5" />
              }
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// FICHE RDV (aperçu complet — libellé long, lieu, statut)
// ══════════════════════════════════════════════════════════════════════════════
const ClientAppointmentDetailSheet: React.FC<{
  appointment: ClientAppointment;
  onClose: () => void;
}> = ({ appointment: a, onClose }) => {
  const statusLabel = RDV_STATUS_LABEL[a.status] ?? a.status;
  const priceLabel =
    typeof a.price === 'number' && a.price > 0
      ? `${Number(a.price).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[72] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.86)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-[2.5rem] border-t border-x max-h-[min(88dvh,720px)] overflow-hidden flex flex-col"
        style={{ background: N.bg, borderColor: N.borderMid }}
      >
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: N.borderMid }} />
        </div>
        <div className="px-5 pb-6 pt-1 overflow-y-auto overscroll-contain space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: N.muted }}>
              Rendez-vous
            </p>
            <p className="text-lg font-black leading-snug" style={{ color: N.text }}>
              {formatRdvDateTimeHeader(a.date, a.time)}
            </p>
            <p className="text-xs mt-2" style={{ color: N.muted }}>
              {formatDateFr(a.date)}
              {statusLabel ? ` · ${statusLabel}` : ''}
              {priceLabel ? ` · ${priceLabel}` : ''}
            </p>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: N.border, background: N.surface }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: N.muted }}>
              Détails du projet
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: N.text }}>
              {a.service.trim() || '—'}
            </p>
          </div>
          {(a.studio_name || a.studio_address) && (
            <div className="flex gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: N.neonDim }}
              >
                <MapPin className="w-5 h-5" style={{ color: N.neonText }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: N.text }}>
                  {a.studio_name ?? 'Studio'}
                </p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: N.muted }}>
                  {a.studio_address ?? 'Adresse communiquée par le studio'}
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <a
              href={mapsUrl(a.studio_address ?? '')}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold active:scale-[0.98] transition-transform"
              style={{ background: N.neon, color: N.bg }}
            >
              <Navigation className="w-4 h-4 shrink-0" />
              Itinéraire
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold border active:scale-[0.98] transition-transform"
              style={{ borderColor: N.border, color: N.textSub, background: N.elevated }}
            >
              Fermer
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// REVIEW MODAL
// ══════════════════════════════════════════════════════════════════════════════
const ReviewModal: React.FC<{
  appointment: ClientAppointment;
  sessionEmail: string;
  onClose: () => void;
}> = ({ appointment, sessionEmail, onClose }) => {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const LABELS = ['', '😕 Décevant', '😐 Passable', '🙂 Bien', '😊 Très bien', '🔥 Exceptionnel !'];

  const submit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await anyDb.from('inkflow_client_reviews').upsert({
        client_email: sessionEmail,
        appointment_id: appointment.id,
        rating,
        comment: comment.trim() || null,
        created_at: new Date().toISOString(),
      }, { onConflict: 'client_email,appointment_id' });
      setDone(true);
    } catch {
      toast.error('Impossible d\'envoyer l\'avis');
    } finally {
      setLoading(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.86)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-[2.5rem] border-t border-x overflow-hidden"
        style={{ background: N.bg, borderColor: N.borderMid }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: N.borderMid }} />
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-4 px-6 pb-12 pt-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: N.neonDim, border: `2px solid ${N.neon}` }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: N.neon }} />
            </div>
            <h3 className="text-xl font-black" style={{ color: N.text }}>Merci pour ton avis !</h3>
            <p className="text-sm" style={{ color: N.muted }}>Ton retour aide la communauté Inkflow.</p>
            <button type="button" onClick={onClose}
              className="mt-2 px-8 py-3.5 rounded-2xl font-bold text-sm"
              style={{ background: N.neon, color: N.bg, boxShadow: N.neonGlow }}>
              Super !
            </button>
          </div>
        ) : (
          <div className="px-6 pb-8 pt-2 space-y-5">
            <div>
              <h3 className="text-xl font-black mb-1" style={{ color: N.text }}>
                Comment s'est passée ta séance ?
              </h3>
              <p className="text-sm" style={{ color: N.muted }}>
                {appointment.service}{appointment.studio_name ? ` · ${appointment.studio_name}` : ''}
              </p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-3 py-2">
              {[1,2,3,4,5].map((s) => (
                <motion.button key={s} type="button"
                  whileTap={{ scale: 0.88 }}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  style={{ transform: displayRating >= s ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.15s' }}
                >
                  <Star className="w-10 h-10 transition-colors"
                    style={{
                      color: displayRating >= s ? '#FBBF24' : N.border,
                      fill: displayRating >= s ? '#FBBF24' : 'none',
                    }}
                  />
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {displayRating > 0 && (
                <motion.p key={displayRating}
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-center text-sm font-bold"
                  style={{ color: N.neonText }}
                >
                  {LABELS[displayRating]}
                </motion.p>
              )}
            </AnimatePresence>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partage ton expérience (optionnel)..."
              rows={3}
              className="w-full rounded-2xl border px-4 py-3.5 text-sm outline-none resize-none"
              style={{ background: N.surface, borderColor: N.border, color: N.text, caretColor: N.neon }}
              onFocus={e => (e.currentTarget.style.borderColor = N.neon)}
              onBlur={e => (e.currentTarget.style.borderColor = N.border)}
            />

            <motion.button type="button" whileTap={{ scale: 0.98 }}
              disabled={rating === 0 || loading}
              onClick={submit}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{
                background: rating > 0 ? N.neon : N.border,
                color: rating > 0 ? N.bg : N.muted,
                boxShadow: rating > 0 ? N.neonGlow : 'none',
              }}>
              {loading
                ? <span className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: N.bg, borderTopColor: 'transparent' }} />
                : 'Publier mon avis'
              }
            </motion.button>
          </div>
        )}
        <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
      </motion.div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// BODY MAP — Ma collection de tattoos
// ══════════════════════════════════════════════════════════════════════════════
const BodyMap: React.FC<{
  tags: Set<string>;
  onToggle: (id: string) => void;
}> = ({ tags, onToggle }) => (
  <div className="rounded-3xl border overflow-hidden" style={{ borderColor: N.border, background: N.surface }}>
    <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: N.neonDim }}>
        <User className="w-4 h-4" style={{ color: N.neon }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black truncate" style={{ color: N.text }}>Ma collection</p>
        <p className="text-[10px]" style={{ color: N.muted }}>Touche une zone pour marquer un tatouage</p>
      </div>
      <span className="text-xs font-bold tabular-nums px-2.5 py-1 rounded-full shrink-0"
        style={{ background: N.neonDim, color: N.neonText }}>
        {tags.size} zone{tags.size !== 1 ? 's' : ''}
      </span>
    </div>

    <div className="px-3 pb-4 pt-2 flex flex-wrap gap-2">
      {BODY_ZONES.map(({ id, label }) => {
        const active = tags.has(id);
        return (
          <motion.button
            key={id}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => onToggle(id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold border transition-all"
            style={{
              background: active ? N.neonDim : 'transparent',
              borderColor: active ? N.neon : N.border,
              color: active ? N.neonText : N.muted,
            }}
          >
            {active && (
              <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: N.neon }} />
            )}
            {label}
          </motion.button>
        );
      })}
    </div>

    {tags.size > 0 && (
      <div className="px-4 pb-4">
        <div className="rounded-2xl px-3 py-2.5 text-[11px]"
          style={{ background: 'rgba(107,83,69,0.05)', border: `1px solid ${N.border}` }}>
          <span style={{ color: N.muted }}>
            Zones encres :{' '}
            <span className="font-semibold" style={{ color: N.textSub }}>
              {[...tags].map(id => BODY_ZONES.find(z => z.id === id)?.label ?? id).join(', ')}
            </span>
          </span>
        </div>
      </div>
    )}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// SPINNER
// ══════════════════════════════════════════════════════════════════════════════
const Spinner: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: N.bg }}>
    <div className="w-9 h-9 rounded-full border-2 animate-spin" style={{ borderColor: N.border, borderTopColor: N.neon }} />
    <p className="text-xs" style={{ color: N.muted }}>Chargement…</p>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export const ClientDashboard: React.FC = () => {
  const toast = useToast();

  // ── Onboarding state (localStorage) ──
  /** Accès direct à l’app ; l’onboarding plein écran reste disponible si on repasse à welcome/styles plus tard. */
  const [onboardStep, setOnboardStep] = useState<'welcome' | 'styles' | 'done'>('done');

  const finishOnboarding = (styles: string[]) => {
    try { localStorage.setItem('inkflow_onboarded_v1', '1'); } catch {}
    setOnboardStep('done');
  };

  // ── Tab state ──
  const [tab, setTab] = useState<ClientTab>('accueil');
  const tabRef = useRef<ClientTab>('accueil');
  const [slideDir, setSlideDir] = useState(1);
  const goTab = (t: ClientTab) => {
    setSlideDir(TAB_ORDER.indexOf(t) > TAB_ORDER.indexOf(tabRef.current) ? 1 : -1);
    tabRef.current = t;
    setTab(t);
  };

  // ── Auth & data ──
  const [sessionEmail, setEmail] = useState<string | null>(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [appointments, setApts] = useState<ClientAppointment[]>([]);
  const [cents, setCents] = useState(0);
  const [code, setCode] = useState('');
  const [favFlash, setFavFlash] = useState<Set<string>>(new Set());
  /** Favoris Inspiration (IDs pin) — localStorage par session (email ou guest) */
  const [favInspireIds, setFavInspireIds] = useState<Set<string>>(new Set());
  const [inspireStyleKey, setInspireStyleKey] = useState<string | null>(null);
  const [inspireZone, setInspireZone] = useState<'all' | 'near5' | `city:${string}`>('all');
  const [inspireFavoritesOnly, setInspireFavoritesOnly] = useState(false);
  /** Cœurs sur les cartes studio « À découvrir » (préférence locale de session). */
  const [favStudios, setFavStudios] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [artistSheet, setArtistSheet] = useState<SheetStudio | null>(null);
  const [referralCount] = useState(2);
  const [copiedCode, setCopiedCode] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // ── Nouvelles features ──
  const [walletTxns, setWalletTxns] = useState<WalletTxn[]>([]);
  const [reviewTarget, setReviewTarget] = useState<ClientAppointment | null>(null);
  const [rdvDetailTarget, setRdvDetailTarget] = useState<ClientAppointment | null>(null);
  const [bodyMapTags, setBodyMapTags] = useState<Set<string>>(new Set());
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  /** URL publique expirée ou 404 : on retombe sur l’initiale. */
  const [profileAvatarLoadFailed, setProfileAvatarLoadFailed] = useState(false);
  /** True si un fichier a été envoyé sur Supabase Storage (clé metadata dédiée), pas seulement la photo Google. */
  const [hasClientUploadedAvatar, setHasClientUploadedAvatar] = useState(false);
  const [profileAvatarUploading, setProfileAvatarUploading] = useState(false);
  const clientAvatarInputRef = useRef<HTMLInputElement>(null);
  const [showPriceEstimator, setShowPriceEstimator] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [dismissedAnniversaries, setDismissedAnniversaries] = useState<Set<string>>(new Set());
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [reviewTriggerLabel, setReviewTriggerLabel] = useState<string | undefined>(undefined);

  // ── Géolocalisation & studios proches ──
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyStudios, setNearbyStudios] = useState<NearbyStudio[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  /** Photo profil : lit inkflow_client_portal_profiles (prioritaire) + backfill depuis user_metadata. */
  const applyPortalAvatarFromUser = useCallback(async (user: { id: string; user_metadata?: Record<string, unknown> }) => {
    const um = (user.user_metadata ?? {}) as Record<string, unknown>;
    let dbUrl: string | null = null;
    const { data: row, error: rowErr } = await supabase
      .from('inkflow_client_portal_profiles')
      .select('portal_avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!rowErr && row?.portal_avatar_url && typeof row.portal_avatar_url === 'string') {
      const t = row.portal_avatar_url.trim();
      if (t) dbUrl = t;
    }
    const metaInk = strMeta(um, CLIENT_PORTAL_AVATAR_META_KEY);
    const cleanMeta = metaInk ? metaInk.replace(/\?.*$/, '') : null;
    if (!dbUrl && cleanMeta) {
      void supabase.from('inkflow_client_portal_profiles').upsert(
        { user_id: user.id, portal_avatar_url: cleanMeta, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
      dbUrl = cleanMeta;
    }
    setProfileAvatarUrl(resolveClientPortalAvatarUrl(um, dbUrl));
    setHasClientUploadedAvatar(!!(dbUrl || strMeta(um, CLIENT_PORTAL_AVATAR_META_KEY)));
  }, []);

  useEffect(() => {
    setProfileAvatarLoadFailed(false);
  }, [profileAvatarUrl]);

  useEffect(() => {
    let cancelled = false;
    const hasHash = window.location.hash.includes('access_token');
    const hashFallback = hasHash ? setTimeout(() => { if (!cancelled) setBootLoading(false); }, 5000) : null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      setAccessToken(session?.access_token ?? null);
      if (session?.user?.email) {
        setEmail(session.user.email);
        void applyPortalAvatarFromUser(session.user);
        if (window.location.hash) window.history.replaceState({}, '', '/client/dashboard');
        setBootLoading(false);
      } else if (event === 'SIGNED_OUT') {
        window.location.href = '/client/dashboard';
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setAccessToken(session?.access_token ?? null);
      if (session?.user?.email) {
        setEmail(session.user.email);
        void applyPortalAvatarFromUser(session.user);
        setBootLoading(false);
      } else {
        setEmail(null);
        setProfileAvatarUrl(null);
        setHasClientUploadedAvatar(false);
        if (!hasHash) setBootLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (hashFallback) clearTimeout(hashFallback);
    };
  }, [applyPortalAvatarFromUser]);

  useEffect(() => {
    if (!sessionEmail) {
      setApts([]);
      setCents(0);
      setCode('');
      setProfileAvatarUrl(null);
      setHasClientUploadedAvatar(false);
      setDataLoading(false);
      return;
    }
    let cancelled = false;
    setDataLoading(true);
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const meta = user?.user_metadata ?? ({} as Record<string, unknown>);
        if (clientNeedsPassword(meta)) { window.location.replace('/client'); return; }
        // Page bienvenue supprimée — onboarding intégré dans le flux login

        const { data: apts } = await supabase
          .from('inkflow_appointments')
          .select(
            'id,date,time,service,status,price,studio_id,inkflow_studios(studio_name,slug,stamp_loyalty_settings)'
          )
          .eq('client_email', sessionEmail).order('date', { ascending: false }).limit(50);
        if (cancelled) return;
        setApts((apts ?? []).map((a: Record<string, unknown>) => {
          const st = a.inkflow_studios as {
            studio_name?: string;
            slug?: string | null;
            stamp_loyalty_settings?: unknown;
          } | null;
          const stampTarget = parseStudioStampTarget(st?.stamp_loyalty_settings);
          return {
            id: String(a.id), date: String(a.date), time: a.time as string | undefined,
            service: String(a.service), status: String(a.status), price: Number(a.price ?? 0),
            studio_id: typeof a.studio_id === 'string' ? a.studio_id : undefined,
            studio_name: st?.studio_name,
            studio_slug: st?.slug ?? null,
            studio_stamp_target: stampTarget,
            studio_address: 'Paris · adresse communiquée par le studio',
          };
        }));
        const { data: w } = await supabase.from('inkflow_client_wallets').select('balance_cents').eq('email', sessionEmail).maybeSingle();
        if (cancelled) return;
        setCents((w as { balance_cents?: number } | null)?.balance_cents ?? 0);
        const { data: cd } = await supabase.from('inkflow_client_codes').select('code').eq('email', sessionEmail).maybeSingle();
        if (!cd) {
          const c = generateCode(sessionEmail);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('inkflow_client_codes') as any).insert({ email: sessionEmail, code: c });
          if (!cancelled) setCode(c);
        } else if (!cancelled) { setCode((cd as { code: string }).code); }

        // ── Wallet transactions (table réelle ou dérivé des RDV complétés) ──
        try {
          const { data: txData, error: txErr } = await anyDb
            .from('inkflow_wallet_transactions')
            .select('id, label, amount_cents, type, created_at')
            .eq('client_email', sessionEmail)
            .order('created_at', { ascending: false })
            .limit(20);

          if (!cancelled) {
            if (!txErr && txData && txData.length > 0) {
              setWalletTxns(
                (txData as Array<{ id: string; label?: string; type: string; amount_cents: number; created_at: string }>)
                  .map((tx) => ({
                    id: String(tx.id),
                    label: tx.label ?? tx.type ?? 'Transaction',
                    sub: new Date(tx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
                    amount: tx.amount_cents >= 0
                      ? `+${(tx.amount_cents / 100).toFixed(2).replace('.', ',')} €`
                      : `${(tx.amount_cents / 100).toFixed(2).replace('.', ',')} €`,
                    pos: tx.amount_cents >= 0,
                  }))
              );
            } else {
              // Fallback : dériver des RDV complétés
              const doneApts = (apts ?? []).filter((a: Record<string, unknown>) => a.status === 'completed');
              if (doneApts.length > 0) {
                setWalletTxns(
                  doneApts.slice(0, 10).map((a: Record<string, unknown>) => ({
                    id: String(a.id),
                    label: `Cashback — ${String(a.service)}`,
                    sub: new Date(String(a.date)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
                    amount: '+3,00 €',
                    pos: true,
                  }))
                );
              }
            }
          }
        } catch { /* table peut ne pas encore exister */ }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionEmail]);

  useEffect(() => {
    if (!sessionEmail) {
      setFavFlash(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('inkflow_client_favorites')
        .select('flash_id')
        .eq('client_email', sessionEmail);
      if (cancelled || error) return;
      setFavFlash(new Set((data ?? []).map((r: { flash_id: string }) => r.flash_id)));
    })();
    return () => { cancelled = true; };
  }, [sessionEmail]);

  const inspireFavStorageKey = useMemo(
    () => `inkflow_inspire_pin_favs_v1::${sessionEmail ?? 'guest'}`,
    [sessionEmail],
  );

  useEffect(() => {
    let cancelled = false;
    if (!sessionEmail) {
      try {
        const raw = localStorage.getItem(GUEST_STUDIO_FAV_KEY);
        if (raw) {
          const arr = JSON.parse(raw) as unknown;
          setFavStudios(
            new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []),
          );
        } else {
          setFavStudios(new Set());
        }
      } catch {
        setFavStudios(new Set());
      }
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      let merged = await getClientStudioFavoriteIds(sessionEmail);
      if (cancelled) return;
      try {
        const legacyKey = `inkflow_explore_studio_favs_v1::${sessionEmail}`;
        const raw = localStorage.getItem(legacyKey);
        if (raw) {
          const arr = JSON.parse(raw) as unknown;
          const legacyIds = Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
          for (const studioId of legacyIds) {
            if (merged.has(studioId)) continue;
            const { error } = await supabase
              .from('inkflow_client_studio_favorites')
              .insert({ client_email: sessionEmail, studio_id: studioId });
            if (!error) merged = new Set(merged).add(studioId);
          }
          localStorage.removeItem(legacyKey);
        }
      } catch {
        /* ignore migration locale */
      }
      if (!cancelled) setFavStudios(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionEmail]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(inspireFavStorageKey);
      if (raw) {
        const arr = JSON.parse(raw) as unknown;
        setFavInspireIds(new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []));
      } else {
        setFavInspireIds(new Set());
      }
    } catch {
      setFavInspireIds(new Set());
    }
  }, [inspireFavStorageKey]);

  // Body map persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inkflow_body_map_v1');
      if (saved) setBodyMapTags(new Set(JSON.parse(saved) as string[]));
    } catch {}
  }, []);

  // Profile display name + avatar (table + metadata)
  useEffect(() => {
    if (!sessionEmail) return;
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata ?? {};
      setDisplayName((meta.display_name as string | undefined) ?? '');
      if (data.user) void applyPortalAvatarFromUser(data.user);
    });
  }, [sessionEmail, applyPortalAvatarFromUser]);

  const handleClientAvatarSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (clientAvatarInputRef.current) clientAvatarInputRef.current.value = '';
      if (!file || !sessionEmail) return;
      if (!file.type.startsWith('image/')) {
        toast.error('Choisis une image (photo ou capture d’écran).');
        return;
      }
      if (file.size > CLIENT_AVATAR_MAX_FILE_MB * 1024 * 1024) {
        toast.error(`Image trop lourde (max. ${CLIENT_AVATAR_MAX_FILE_MB} Mo).`);
        return;
      }
      setProfileAvatarUploading(true);
      try {
        const { data: authData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !authData.user?.id) throw new Error('session');
        const user = authData.user;
        const blob = await resizeImageFileToJpegBlob(file, CLIENT_AVATAR_MAX_EDGE);
        const path = `client-avatars/${user.id}.jpg`;
        const { error: upErr } = await supabase.storage
          .from('inkflow-assets')
          .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('inkflow-assets').getPublicUrl(path);
        const publicUrlClean = pub.publicUrl.split('?')[0];
        const { error: dbErr } = await supabase.from('inkflow_client_portal_profiles').upsert(
          {
            user_id: user.id,
            portal_avatar_url: publicUrlClean,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
        if (dbErr) throw dbErr;
        const prevMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
        const { error: authErr } = await supabase.auth.updateUser({
          data: { ...prevMeta, [CLIENT_PORTAL_AVATAR_META_KEY]: publicUrlClean },
        });
        if (authErr) throw authErr;
        await supabase.auth.refreshSession();
        const { data: freshUser } = await supabase.auth.getUser();
        if (freshUser.user) await applyPortalAvatarFromUser(freshUser.user);
        else {
          setProfileAvatarUrl(`${publicUrlClean}?t=${Date.now()}`);
          setHasClientUploadedAvatar(true);
        }
        toast.success('Photo de profil enregistrée !');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        const short = msg.replace(/^StorageApiError:\s*/i, '').slice(0, 120);
        if (msg.includes('load') || msg.includes('dimensions') || msg.includes('canvas') || msg.includes('blob')) {
          toast.error(
            'Impossible de lire cette image. Sur iPhone, ouvre la photo → Partager → Enregistrer une copie en JPEG, puis réessaie.',
          );
        } else if (short) {
          toast.error(`Photo : ${short}`);
        } else {
          toast.error(
            'Impossible d’enregistrer la photo. Vérifie ta connexion. Applique les migrations Supabase (storage client-avatars + table inkflow_client_portal_profiles).',
          );
        }
      } finally {
        setProfileAvatarUploading(false);
      }
    },
    [sessionEmail, toast, applyPortalAvatarFromUser],
  );

  const removeClientAvatar = useCallback(async () => {
    if (!sessionEmail) return;
    setProfileAvatarUploading(true);
    try {
      const { data: authData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !authData.user?.id) throw new Error('session');
      const user = authData.user;
      const path = `client-avatars/${user.id}.jpg`;
      await supabase.from('inkflow_client_portal_profiles').delete().eq('user_id', user.id);
      await supabase.storage.from('inkflow-assets').remove([path]).catch(() => {});
      const prevMeta = { ...(user.user_metadata ?? {}) } as Record<string, unknown>;
      delete prevMeta[CLIENT_PORTAL_AVATAR_META_KEY];
      const { error: authErr } = await supabase.auth.updateUser({ data: prevMeta });
      if (authErr) throw authErr;
      await supabase.auth.refreshSession();
      const { data: fresh } = await supabase.auth.getUser();
      if (fresh.user) await applyPortalAvatarFromUser(fresh.user);
      else {
        setProfileAvatarUrl(resolveClientPortalAvatarUrl(prevMeta));
        setHasClientUploadedAvatar(false);
      }
      toast.success('Photo Inkflow retirée — ta photo Google (si connexion Google) peut réapparaître.');
    } catch {
      toast.error('Impossible de retirer la photo pour l’instant.');
    } finally {
      setProfileAvatarUploading(false);
    }
  }, [sessionEmail, toast, applyPortalAvatarFromUser]);

  const toggleBodyTag = useCallback((id: string) => {
    setBodyMapTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem('inkflow_body_map_v1', JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const saveDisplayName = async () => {
    if (!displayName.trim()) return;
    await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
    setProfileEditMode(false);
    toast.success('Nom mis à jour !');
  };

  const toggleFlashFavorite = useCallback(async (flashId: string) => {
    if (!sessionEmail) {
      toast.error('Connecte-toi pour enregistrer tes favoris.');
      return;
    }
    if (!FLASH_ID_DB.test(flashId)) {
      toast.error('Les favoris en ligne sont disponibles pour les flashs du catalogue (géolocalisation activée).');
      return;
    }
    const removing = favFlash.has(flashId);
    try {
      if (removing) {
        const { error } = await supabase
          .from('inkflow_client_favorites')
          .delete()
          .eq('client_email', sessionEmail)
          .eq('flash_id', flashId);
        if (error) throw error;
        setFavFlash((prev) => {
          const next = new Set(prev);
          next.delete(flashId);
          return next;
        });
        toast.success('Retiré des favoris');
      } else {
        const { error } = await supabase
          .from('inkflow_client_favorites')
          .insert({ client_email: sessionEmail, flash_id: flashId });
        if (error) throw error;
        setFavFlash((prev) => new Set(prev).add(flashId));
        toast.success('Ajouté aux favoris');
      }
    } catch {
      toast.error('Impossible de mettre à jour les favoris');
    }
  }, [sessionEmail, favFlash, toast]);

  // Studios réels (même données que la vitrine /studio/:slug) : chargement immédiat, puis affinage GPS
  useEffect(() => {
    let cancelled = false;
    const apply = (list: NearbyStudio[]) => {
      if (!cancelled) {
        setNearbyStudios(list);
        setGeoLoading(false);
      }
    };
    if (!isSupabaseConfigured()) {
      setGeoLoading(false);
      return () => { cancelled = true; };
    }
    setGeoLoading(true);
    loadClientDiscoveryStudios(null, null, 120, 40).then(apply);
    if (!navigator.geolocation) {
      return () => { cancelled = true; };
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        setGeoLoading(true);
        loadClientDiscoveryStudios(latitude, longitude, 80, 40).then(apply);
      },
      () => {},
      { timeout: 8000, maximumAge: 300_000 },
    );
    return () => { cancelled = true; };
  }, []);

  // Convertit un NearbyStudio en SheetStudio pour le bottom sheet
  const nearbyToSheet = useCallback((s: NearbyStudio): SheetStudio => ({
    id: s.id,
    slug: s.slug,
    name: s.studio_name,
    artistLabel: s.tags[0] ?? 'Tatoueur',
    styleLabel: s.tags[1] ?? '',
    rating: 0,
    distLabel: formatClientStudioDistance(s.distance_km),
    grad: ['#1C1612', '#3A3028'],
    avatarUrl: s.avatar_url?.trim() || null,
    portfolioImages: (s.portfolio ?? []).map((p) => p.url),
    city: s.city ?? undefined,
    distanceKm: s.distance_km ?? undefined,
  }), []);

  const firstName = useMemo(() => {
    if (displayName) return displayName.split(' ')[0];
    if (!sessionEmail) return 'toi';
    const l = sessionEmail.split('@')[0];
    return l.charAt(0).toUpperCase() + l.slice(1);
  }, [sessionEmail, displayName]);

  const upcoming = useMemo(() => appointments.filter(a => ['pending','confirmed','in_progress'].includes(a.status)), [appointments]);
  const completed = useMemo(() => appointments.filter(a => a.status === 'completed'), [appointments]);
  const lastTattoo = useMemo(() => completed[0] ?? null, [completed]);

  /** RDV anniversaires : exactement 1 an (± 1 jour) aujourd'hui */
  const anniversaryAppointments = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return completed.filter((a) => {
      const d = new Date(a.date); d.setHours(0,0,0,0);
      const diffMs = today.getTime() - d.getTime();
      const diffDays = Math.round(diffMs / 86400000);
      return diffDays > 0 && diffDays % 365 < 2; // ± 1 jour
    });
  }, [completed]);

  /** Review prompt — déclenché au palier fidélité ou J14 cicatrisation */
  useEffect(() => {
    if (!shouldShowReviewPrompt()) return;
    // Paliers fidélité : 2 séances = Silver, 5 = Gold, 10 = Platinum
    const milestones = [2, 5, 10];
    if (milestones.includes(completed.length)) {
      const label = completed.length === 10 ? 'Tu viens d\'atteindre le statut Platinum 🏆'
        : completed.length === 5 ? 'Tu viens d\'atteindre le statut Gold ⭐'
        : 'Tu viens d\'atteindre le statut Silver 🥈';
      setReviewTriggerLabel(label);
      setShowReviewPrompt(true);
      return;
    }
    // J14 : dernier tattoo cicatrisé depuis 14 jours
    if (lastTattoo) {
      const daysSince = Math.round((Date.now() - new Date(lastTattoo.date).getTime()) / 86_400_000);
      if (daysSince === 14 || daysSince === 15) {
        setReviewTriggerLabel('Ton tatouage est maintenant cicatrisé ✨');
        setShowReviewPrompt(true);
      }
    }
  }, [completed.length, lastTattoo]);

  /** Badge rouge tab RDV : prochain RDV dans < 48h */
  const rdvUrgent = useMemo(() => {
    return upcoming.some((a) => {
      const d = new Date(a.date).getTime() - Date.now();
      return d > 0 && d < 48 * 3600 * 1000;
    });
  }, [upcoming]);

  /** Progression par studio (même logique que les fiches CRM : RDV terminés par lieu) */
  const walletProgressByStudio = useMemo(() => {
    type Row = {
      studioKey: string;
      label: string;
      slug: string | null;
      targetStamps: number;
      completed: number;
      upcoming: number;
    };
    const m = new NativeMap<string, Row>();
    for (const a of appointments) {
      const key =
        (a.studio_id && a.studio_id.trim()) ||
        (a.studio_name ? `name:${a.studio_name.trim().toLowerCase()}` : `apt:${a.id}`);
      const target = a.studio_stamp_target ?? 10;
      if (!m.has(key)) {
        m.set(key, {
          studioKey: key,
          label: (a.studio_name && a.studio_name.trim()) || 'Studio',
          slug: a.studio_slug ?? null,
          targetStamps: target,
          completed: 0,
          upcoming: 0,
        });
      }
      const row = m.get(key);
      if (!row) continue;
      if (target !== 10) row.targetStamps = target;
      if (a.status === 'completed') row.completed += 1;
      else if (['pending', 'confirmed', 'in_progress'].includes(a.status)) row.upcoming += 1;
    }
    return Array.from(m.values()).sort((x, y) => {
      if (y.completed !== x.completed) return y.completed - x.completed;
      return x.label.localeCompare(y.label, 'fr');
    });
  }, [appointments]);
  const healingDays = lastTattoo ? daysSince(lastTattoo.date) : 999;

  // Flash displays : prod = uniquement Supabase ; dev = fallback Rouen si liste vide
  const allDisplayFlash = useMemo<DisplayFlash[]>(() => {
    if (nearbyStudios.length === 0) return CLIENT_DEMO_ROUEN_FALLBACK ? ROUEN_FLASH : [];
    const GRADS: [string, string][] = [
      ['#1C1612', '#3A3028'], ['#181612', '#2C2820'], ['#1A0A0A', '#4A1010'],
      ['#111111', '#2A2A2A'], ['#0A1A0A', '#143514'], ['#1A1210', '#352218'],
    ];
    return nearbyStudios.flatMap((s, si) =>
      (s.flash ?? []).map((f, fi) => ({
        id: f.id || `${s.id}-${fi}`,
        name: f.title,
        artist: s.studio_name,
        studio: s.studio_name,
        studioSlug: s.slug,
        dist: formatClientStudioDistance(s.distance_km),
        price: f.price,
        h: 160 + ((si * 3 + fi) % 5) * 18,
        grad: GRADS[(si + fi) % GRADS.length],
        hot: fi === 0 && si < 3,
        imageUrl: f.imageUrl || undefined,
      }))
    );
  }, [nearbyStudios]);

  // Studios à afficher : prod = réels uniquement
  const displayStudios = useMemo<SheetStudio[]>(() => {
    if (nearbyStudios.length === 0) return CLIENT_DEMO_ROUEN_FALLBACK ? ROUEN_STUDIOS : [];
    const GRADS: [string, string][] = [
      ['#1C1612', '#3A3028'], ['#181612', '#2C2820'],
      ['#111111', '#2E2E2E'], ['#2E0A0A', '#6B1A1A'],
    ];
    return nearbyStudios.slice(0, 8).map((s, i) => ({
      id: s.id,
      slug: s.slug,
      name: s.studio_name,
      artistLabel: s.tags[0] ?? 'Tatoueur',
      styleLabel: s.tags[1] ?? '',
      rating: 0,
      distLabel: formatClientStudioDistance(s.distance_km),
      grad: GRADS[i % GRADS.length],
      avatarUrl: s.avatar_url?.trim() || null,
      portfolioImages: (s.portfolio ?? []).map((p) => p.url),
      city: s.city ?? undefined,
      distanceKm: s.distance_km ?? undefined,
    }));
  }, [nearbyStudios]);

  const filteredExploreStudios = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return displayStudios;
    return displayStudios.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.artistLabel?.toLowerCase().includes(q) ?? false) ||
        (s.styleLabel?.toLowerCase().includes(q) ?? false),
    );
  }, [displayStudios, search]);

  /** Studios marqués cœur (Explore) — intersecte avec la liste courante pour l’affichage profil. */
  const savedStudios = useMemo(
    () => displayStudios.filter((s) => favStudios.has(s.id)),
    [displayStudios, favStudios],
  );

  const filteredFlash = useMemo<DisplayFlash[]>(() => {
    const q = search.trim().toLowerCase();
    return q
      ? allDisplayFlash.filter(f =>
          f.name.toLowerCase().includes(q) ||
          f.artist.toLowerCase().includes(q) ||
          f.studio.toLowerCase().includes(q),
        )
      : allDisplayFlash;
  }, [search, allDisplayFlash]);

  const colA = filteredFlash.filter((_, i) => i % 2 === 0);
  const colB = filteredFlash.filter((_, i) => i % 2 !== 0);

  const inspirePins = useMemo(
    () => buildInspirePins(allDisplayFlash, displayStudios),
    [allDisplayFlash, displayStudios],
  );

  const inspireStyleOptions = useMemo(() => {
    const m = new NativeMap<string, string>();
    for (const p of inspirePins) {
      if (!m.has(p.styleKey)) {
        m.set(p.styleKey, p.styleLabel || styleKeyToLabel(p.styleKey, p.styleKey));
      }
    }
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], 'fr'));
  }, [inspirePins]);

  const inspireCityOptions = useMemo(() => {
    const cities = new Set<string>();
    for (const p of inspirePins) {
      const c = p.city?.trim();
      if (c) cities.add(c);
    }
    return [...cities].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [inspirePins]);

  const inspireHasDistance = useMemo(
    () => inspirePins.some((p) => p.distanceKm != null),
    [inspirePins],
  );

  const filteredInspirePins = useMemo(() => {
    let list = inspirePins;
    if (inspireFavoritesOnly) list = list.filter((p) => favInspireIds.has(p.id));
    if (inspireStyleKey) list = list.filter((p) => p.styleKey === inspireStyleKey);
    if (inspireZone === 'near5') {
      list = list.filter((p) => p.distanceKm != null && p.distanceKm <= 5);
    } else if (inspireZone.startsWith('city:')) {
      const want = inspireZone.slice(5).toLowerCase();
      list = list.filter((p) => (p.city || '').toLowerCase() === want);
    }
    return list;
  }, [inspirePins, inspireFavoritesOnly, favInspireIds, inspireStyleKey, inspireZone]);

  const toggleInspirePinFavorite = useCallback(
    (e: React.MouseEvent, pinId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setFavInspireIds((prev) => {
        const next = new Set(prev);
        if (next.has(pinId)) next.delete(pinId);
        else next.add(pinId);
        try {
          localStorage.setItem(inspireFavStorageKey, JSON.stringify([...next]));
        } catch {
          /* quota */
        }
        return next;
      });
    },
    [inspireFavStorageKey],
  );

  const openStudioFromInspirePin = useCallback(
    (pin: InspirePin) => {
      const sheet =
        displayStudios.find((x) => x.slug === pin.studioSlug) ??
        (CLIENT_DEMO_ROUEN_FALLBACK ? ROUEN_STUDIOS.find((x) => x.slug === pin.studioSlug) : undefined);
      if (sheet) setArtistSheet(sheet);
      else toast.error('Studio introuvable pour cette image.');
    },
    [displayStudios, toast],
  );

  const toggleExploreStudioFavorite = useCallback(
    async (studioId: string) => {
      const wasFav = favStudios.has(studioId);
      const adding = !wasFav;
      if (!sessionEmail) {
        setFavStudios((prev) => {
          const next = new Set(prev);
          if (adding) next.add(studioId);
          else next.delete(studioId);
          try {
            localStorage.setItem(GUEST_STUDIO_FAV_KEY, JSON.stringify([...next]));
          } catch {
            /* quota */
          }
          return next;
        });
        return;
      }
      try {
        if (adding) {
          const { error } = await supabase
            .from('inkflow_client_studio_favorites')
            .insert({ client_email: sessionEmail, studio_id: studioId });
          if (error) throw error;
          setFavStudios((prev) => new Set(prev).add(studioId));
          toast.success('Studio enregistré dans ton profil');
        } else {
          const { error } = await supabase
            .from('inkflow_client_studio_favorites')
            .delete()
            .eq('client_email', sessionEmail)
            .eq('studio_id', studioId);
          if (error) throw error;
          setFavStudios((prev) => {
            const next = new Set(prev);
            next.delete(studioId);
            return next;
          });
          toast.success('Retiré des favoris');
        }
      } catch {
        toast.error('Impossible de mettre à jour les favoris');
      }
    },
    [sessionEmail, favStudios, toast],
  );

  const studiosWithMapCoords = useMemo(
    () =>
      nearbyStudios.filter(
        (s) =>
          s.latitude != null &&
          s.longitude != null &&
          Number.isFinite(s.latitude) &&
          Number.isFinite(s.longitude),
      ),
    [nearbyStudios],
  );

  const shareUrl = `${getInviteBaseUrl()}/${code || 'demo'}`;

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(shareUrl); } catch {}
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ── Onboarding ──
  if (onboardStep === 'welcome') return <OnboardingWelcome onNext={() => setOnboardStep('styles')} />;
  if (onboardStep === 'styles') return <OnboardingStylePicker onDone={finishOnboarding} />;

  if (bootLoading) return <Spinner />;
  if (sessionEmail && dataLoading) return <Spinner />;

  const isGuest = !sessionEmail;

  const TAB_TITLES: Record<ClientTab, string> = {
    accueil: 'Accueil',
    explore: 'Explorer',
    inspire: 'Inspiration',
    rdv: 'Mes RDV',
    loyalty: 'Fidélité',
    wallet: 'Portefeuille',
    profile: 'Profil',
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: N.bg, color: N.text, paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20 px-5 pt-safe-top pt-12 pb-3 border-b"
        style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(20px)', borderColor: N.border }}
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* IF. logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter" style={{ color: N.text, letterSpacing: '-0.04em' }}>
              IF.
            </span>
            {tab !== 'accueil' && (
              <span className="text-base font-semibold" style={{ color: N.textSub }}>
                {TAB_TITLES[tab]}
              </span>
            )}
          </div>
          {/* Right: wallet + avatar */}
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => goTab('wallet')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border"
              style={{ borderColor: N.border, background: N.surface }}
            >
              <Wallet className="w-3.5 h-3.5" style={{ color: N.neonText }} />
              <span className="text-sm font-bold tabular-nums" style={{ color: N.neonText }}>{(cents / 100).toFixed(0)}€</span>
            </motion.button>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold border text-sm overflow-hidden shrink-0"
              style={{
                borderColor: N.border,
                background: profileAvatarUrl && !profileAvatarLoadFailed ? N.surface : N.neon,
                color: profileAvatarUrl && !profileAvatarLoadFailed ? N.text : '#fff',
              }}
            >
              {profileAvatarUrl && !profileAvatarLoadFailed ? (
                <img
                  src={profileAvatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setProfileAvatarLoadFailed(true)}
                />
              ) : (
                firstName.slice(0, 1).toUpperCase()
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Healing banner ── */}
      {lastTattoo && healingDays < 15 && (
        <div className="max-w-lg mx-auto">
          <HealingBanner daysSinceCompletion={healingDays} serviceName={lastTattoo.service} />
        </div>
      )}

      {/* ── Anniversary banners ── */}
      <AnimatePresence>
        {anniversaryAppointments.filter(a => !dismissedAnniversaries.has(a.id)).map((a) => {
          const years = Math.round((Date.now() - new Date(a.date).getTime()) / (365.25 * 86400000));
          return (
            <div key={a.id} className="max-w-lg mx-auto">
              <AnniversaryBanner
                appointment={a}
                years={years}
                onDismiss={() => setDismissedAnniversaries(p => new Set([...p, a.id]))}
              />
            </div>
          );
        })}
      </AnimatePresence>

      {/* ── Content ── */}
      <main className="max-w-lg mx-auto">
        <AnimatePresence mode="wait" custom={slideDir}>
          <motion.div
            key={tab}
            custom={slideDir}
            variants={pageV}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.8 }}
          >

            {/* ════ ACCUEIL ════ */}
            {tab === 'accueil' && (
              <div className="pb-6">
                <div className="px-5 pt-5">
                  {/* Studio card */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0"
                      style={{ background: N.neonDim, color: N.neon }}
                    >
                      IF.
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: N.muted }}>
                        Ton Studio
                      </p>
                      <h1 className="text-xl font-black leading-tight" style={{ color: N.text }}>
                        {completed[0]?.studio_name || upcoming[0]?.studio_name || 'Studio Inkflow'}
                      </h1>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    <div className="rounded-2xl border px-3 py-3 text-center" style={{ borderColor: N.border, background: N.surface }}>
                      <p className="text-2xl font-black" style={{ color: N.text }}>{completed.length}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: N.muted }}>Tattoos</p>
                    </div>
                    <div className="rounded-2xl border px-3 py-3 text-center" style={{ borderColor: N.border, background: N.surface }}>
                      <p className="text-2xl font-black" style={{ color: N.neonText }}>{(cents / 100).toFixed(0)}€</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: N.muted }}>Wallet</p>
                    </div>
                    <div className="rounded-2xl border px-3 py-3 text-center" style={{ borderColor: N.border, background: N.surface }}>
                      <p className="text-2xl font-black" style={{ color: N.text }}>{appointments.length}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: N.muted }}>RDV total</p>
                    </div>
                  </div>

                  {/* Prochain RDV */}
                  {upcoming.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-3xl border overflow-hidden mb-4"
                      style={{ borderColor: N.borderMid, background: N.surface }}
                    >
                      <div className="px-4 pt-3.5 pb-2 border-b" style={{ borderColor: N.border }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: N.muted }}>
                          Prochain RDV
                        </p>
                      </div>
                      <div className="px-4 py-3.5">
                        <p className="font-bold truncate" style={{ color: N.text }}>
                          {parseAppointmentService(upcoming[0].service).title}
                        </p>
                        <p className="text-sm mt-0.5" style={{ color: N.textSub }}>
                          {formatRdvDateTimeHeader(upcoming[0].date, upcoming[0].time)}
                        </p>
                        {upcoming[0].studio_name && (
                          <p className="text-xs mt-0.5" style={{ color: N.muted }}>{upcoming[0].studio_name}</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Fidélité progress */}
                  {walletProgressByStudio.length > 0 && (() => {
                    const top = walletProgressByStudio[0];
                    const cap = Math.max(1, top.targetStamps);
                    const filled = Math.min(top.completed, cap);
                    const pct = Math.round((filled / cap) * 100);
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="rounded-3xl border overflow-hidden mb-5"
                        style={{ borderColor: N.borderMid, background: N.surface }}
                      >
                        <div className="px-4 pt-3.5 pb-2 border-b" style={{ borderColor: N.border }}>
                          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: N.muted }}>
                            Fidélité — {top.label}
                          </p>
                        </div>
                        <div className="px-4 py-3.5">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold" style={{ color: N.text }}>
                              {filled} séance{filled !== 1 ? 's' : ''} sur {cap}
                            </p>
                            <span className="text-xs font-black tabular-nums" style={{ color: N.neonText }}>
                              {pct}%
                            </span>
                          </div>
                          <div
                            className="h-2 rounded-full overflow-hidden"
                            style={{ background: N.elevated }}
                            role="progressbar"
                            aria-valuenow={filled}
                            aria-valuemin={0}
                            aria-valuemax={cap}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: N.neon }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* CTA Réserver */}
                  {(upcoming[0]?.studio_slug || completed[0]?.studio_slug) ? (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const slug = upcoming[0]?.studio_slug || completed[0]?.studio_slug;
                        if (slug) window.location.href = `/studio/${slug}`;
                      }}
                      className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
                      style={{ background: N.neon, color: N.bg, boxShadow: N.neonGlow }}
                    >
                      Réserver une séance
                      <ArrowUpRight className="w-5 h-5" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { window.location.href = '/book'; }}
                      className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
                      style={{ background: N.neon, color: N.bg, boxShadow: N.neonGlow }}
                    >
                      Trouver un tatoueur
                      <ArrowUpRight className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>

                {/* Healing banner */}
                {lastTattoo && healingDays < 15 && (
                  <div className="mx-5 mt-5">
                    <HealingBanner daysSinceCompletion={healingDays} serviceName={lastTattoo.service} />
                  </div>
                )}
              </div>
            )}

            {/* ════ EXPLORER (carte + studios + flashs) ════ */}
            {tab === 'explore' && (
              <div className="px-4 pt-5 pb-6 space-y-5">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-black leading-tight mb-2"
                    style={{ color: N.text, letterSpacing: '-0.02em' }}
                  >
                    Découvrir
                  </motion.h1>
                  <p className="text-sm leading-relaxed" style={{ color: N.textSub }}>
                    Studios et flashs autour de toi. Touche une carte pour ouvrir la vitrine ou enregistrer un coup de cœur.
                  </p>
                </div>

                <div className="relative">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: N.muted }}
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un studio, un style…"
                    className="w-full rounded-2xl border pl-10 pr-4 py-3 text-sm outline-none"
                    style={{ borderColor: N.border, background: N.surface, color: N.text }}
                    autoComplete="off"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMap(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold border active:scale-[0.98] transition-transform"
                    style={{
                      borderColor: !showMap ? N.neon : N.border,
                      background: !showMap ? N.neonDim : N.elevated,
                      color: !showMap ? N.neonText : N.textSub,
                    }}
                  >
                    <List className="w-4 h-4" />
                    Liste
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold border active:scale-[0.98] transition-transform"
                    style={{
                      borderColor: showMap ? N.neon : N.border,
                      background: showMap ? N.neonDim : N.elevated,
                      color: showMap ? N.neonText : N.textSub,
                    }}
                  >
                    <MapIcon className="w-4 h-4" />
                    Carte
                  </button>
                </div>

                {showMap && (
                  <div className="space-y-2">
                    {userPos && studiosWithMapCoords.length > 0 ? (
                      <NearbyMapView
                        userPos={userPos}
                        studios={studiosWithMapCoords}
                        onSelectStudio={(s) => setArtistSheet(nearbyToSheet(s))}
                      />
                    ) : (
                      <div
                        className="rounded-2xl border px-4 py-8 text-center"
                        style={{ borderColor: N.border, background: N.surface }}
                      >
                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: N.muted }} />
                        <p className="text-sm font-semibold mb-1" style={{ color: N.text }}>
                          {userPos ? 'Aucun studio géolocalisé' : 'Active la géolocalisation'}
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: N.muted }}>
                          {userPos
                            ? 'Les studios sans coordonnées GPS n’apparaissent pas sur la carte — vois la liste ci-dessous.'
                            : 'Autorise la position dans ton navigateur pour afficher la carte et les distances.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {geoLoading && (
                  <p className="text-[11px] text-center font-medium" style={{ color: N.muted }}>
                    Mise à jour des studios…
                  </p>
                )}

                <section>
                  <h2 className="text-[13px] font-bold uppercase tracking-widest mb-3" style={{ color: N.muted }}>
                    À découvrir
                  </h2>
                  {filteredExploreStudios.length === 0 ? (
                    <div
                      className="rounded-3xl border px-4 py-8 text-center"
                      style={{ borderColor: N.border, background: N.surface }}
                    >
                      <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: N.muted }} />
                      <p className="text-sm font-semibold" style={{ color: N.text }}>
                        Aucun studio pour cette recherche
                      </p>
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: N.muted }}>
                        Vérifie ta connexion ou élargis ta zone (géolocalisation).
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredExploreStudios.map((s, i) => (
                        <div key={s.id} className="relative">
                          <motion.button
                            type="button"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.05, 0.4) }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setArtistSheet(s)}
                            className="w-full flex items-center gap-3.5 p-4 rounded-3xl border text-left pr-14"
                            style={{ borderColor: N.border, background: N.surface }}
                          >
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 overflow-hidden"
                              style={{ background: `linear-gradient(135deg, ${s.grad[0]}, ${s.grad[1]})` }}
                            >
                              {s.avatarUrl ? (
                                <img
                                  src={s.avatarUrl}
                                  alt=""
                                  className="w-full h-full object-cover object-top"
                                  onError={hideBrokenImage}
                                />
                              ) : (
                                s.name.slice(0, 2)
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate" style={{ color: N.text }}>
                                {s.name}
                              </p>
                              <p className="text-[11px] truncate mt-0.5" style={{ color: N.muted }}>
                                {s.artistLabel}
                                {s.styleLabel ? ` · ${s.styleLabel}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs font-semibold" style={{ color: N.muted }}>
                                {s.distLabel}
                              </span>
                              <ChevronRight className="w-4 h-4" style={{ color: N.border }} />
                            </div>
                          </motion.button>
                          <button
                            type="button"
                            aria-label={favStudios.has(s.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            aria-pressed={favStudios.has(s.id)}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void toggleExploreStudioFavorite(s.id);
                            }}
                            className="absolute top-1/2 -translate-y-1/2 right-3 z-10 w-11 h-11 rounded-full flex items-center justify-center border active:scale-95 transition-transform"
                            style={{
                              background: 'rgba(255,255,255,0.95)',
                              borderColor: N.border,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}
                          >
                            <Heart
                              className="w-5 h-5"
                              style={{ color: favStudios.has(s.id) ? '#ef4444' : N.muted }}
                              fill={favStudios.has(s.id) ? '#ef4444' : 'none'}
                              strokeWidth={2}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {filteredFlash.length > 0 && (
                  <section>
                    <h2 className="text-[13px] font-bold uppercase tracking-widest mb-3" style={{ color: N.muted }}>
                      Flash du moment
                    </h2>
                    <div className="flex gap-2">
                      <div className="flex-1 flex flex-col gap-2">
                        {colA.map((f) => (
                          <FlashCard
                            key={f.id}
                            f={f}
                            fav={favFlash.has(f.id)}
                            onFav={() => void toggleFlashFavorite(f.id)}
                          />
                        ))}
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        {colB.map((f) => (
                          <FlashCard
                            key={f.id}
                            f={f}
                            fav={favFlash.has(f.id)}
                            onFav={() => void toggleFlashFavorite(f.id)}
                          />
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ════ INSPIRATION ════ */}
            {tab === 'inspire' && (
              <div className="px-4 pt-5 pb-6">
                <div className="mb-4">
                  <motion.h1
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-black leading-tight mb-2"
                    style={{ color: N.text, letterSpacing: '-0.02em' }}
                  >
                    Inspiration tattoo
                  </motion.h1>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: N.textSub }}>
                    Des réalisations et flashs des tatoueurs près de toi — portfolio synchronisé avec l’app pro. Touche une
                    photo pour ouvrir le studio et réserver.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        goTab('explore');
                        setShowMap(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold active:scale-[0.98] transition-transform"
                      style={{ background: N.neon, color: '#fff' }}
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      Carte & studios
                    </button>
                    <button
                      type="button"
                      onClick={() => goTab('explore')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border active:scale-[0.98] transition-transform"
                      style={{ borderColor: N.border, color: N.textSub, background: N.surface }}
                    >
                      <Search className="w-3.5 h-3.5" />
                      Rechercher
                    </button>
                  </div>
                </div>

                {inspirePins.length > 0 && (
                  <div className="mb-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-widest shrink-0" style={{ color: N.muted }}>
                        Filtres
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setInspireStyleKey(null);
                          setInspireZone('all');
                          setInspireFavoritesOnly(false);
                        }}
                        className="text-[10px] font-semibold px-2 py-1 rounded-lg border shrink-0 active:scale-[0.98] transition-transform"
                        style={{ borderColor: N.border, color: N.neonText, background: N.neonDim }}
                      >
                        Réinitialiser
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                      <button
                        type="button"
                        onClick={() => setInspireFavoritesOnly((v) => !v)}
                        className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 active:scale-[0.98] transition-all min-h-[40px]"
                        style={{
                          borderColor: inspireFavoritesOnly ? N.neon : N.border,
                          background: inspireFavoritesOnly ? N.neonDim : N.surface,
                          color: inspireFavoritesOnly ? N.neonText : N.textSub,
                        }}
                      >
                        <Heart
                          className="w-3.5 h-3.5"
                          fill={inspireFavoritesOnly ? 'currentColor' : 'none'}
                          strokeWidth={2}
                        />
                        Favoris{favInspireIds.size > 0 ? ` (${favInspireIds.size})` : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspireStyleKey(null)}
                        className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border active:scale-[0.98] transition-all min-h-[40px]"
                        style={{
                          borderColor: !inspireStyleKey ? N.neon : N.border,
                          background: !inspireStyleKey ? N.neonDim : N.elevated,
                          color: !inspireStyleKey ? N.neonText : N.textSub,
                        }}
                      >
                        Tous styles
                      </button>
                      {inspireStyleOptions.map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setInspireStyleKey(inspireStyleKey === key ? null : key)}
                          className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border active:scale-[0.98] transition-all min-h-[40px] max-w-[140px] truncate"
                          style={{
                            borderColor: inspireStyleKey === key ? N.neon : N.border,
                            background: inspireStyleKey === key ? N.neonDim : N.elevated,
                            color: inspireStyleKey === key ? N.neonText : N.textSub,
                          }}
                          title={label}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                      <button
                        type="button"
                        onClick={() => setInspireZone('all')}
                        className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border active:scale-[0.98] transition-all min-h-[40px]"
                        style={{
                          borderColor: inspireZone === 'all' ? N.neon : N.border,
                          background: inspireZone === 'all' ? N.neonDim : N.elevated,
                          color: inspireZone === 'all' ? N.neonText : N.textSub,
                        }}
                      >
                        Toutes zones
                      </button>
                      {inspireHasDistance && (
                        <button
                          type="button"
                          onClick={() => setInspireZone((z) => (z === 'near5' ? 'all' : 'near5'))}
                          className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border active:scale-[0.98] transition-all min-h-[40px]"
                          style={{
                            borderColor: inspireZone === 'near5' ? N.neon : N.border,
                            background: inspireZone === 'near5' ? N.neonDim : N.elevated,
                            color: inspireZone === 'near5' ? N.neonText : N.textSub,
                          }}
                        >
                          ≤ 5 km
                        </button>
                      )}
                      {inspireCityOptions.map((city) => {
                        const id = `city:${city}` as const;
                        const active = inspireZone === id;
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => setInspireZone(active ? 'all' : id)}
                            className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border active:scale-[0.98] transition-all min-h-[40px]"
                            style={{
                              borderColor: active ? N.neon : N.border,
                              background: active ? N.neonDim : N.elevated,
                              color: active ? N.neonText : N.textSub,
                            }}
                          >
                            {city}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {inspirePins.length === 0 ? (
                  <div className="rounded-3xl border p-10 text-center" style={{ borderColor: N.border, background: N.surface }}>
                    <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: N.muted }} />
                    <p className="text-sm font-semibold mb-1" style={{ color: N.text }}>
                      Aucune image pour l’instant
                    </p>
                    <p className="text-xs mb-4" style={{ color: N.muted }}>
                      Active la géolocalisation dans Découvrir pour charger les portfolios des studios autour de toi.
                    </p>
                    <button
                      type="button"
                      onClick={() => goTab('explore')}
                      className="text-xs font-bold px-4 py-2.5 rounded-xl"
                      style={{ background: N.neon, color: '#fff' }}
                    >
                      Ouvrir Découvrir
                    </button>
                  </div>
                ) : filteredInspirePins.length === 0 ? (
                  <div className="rounded-3xl border p-8 text-center" style={{ borderColor: N.border, background: N.surface }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: N.text }}>
                      Aucun résultat
                    </p>
                    <p className="text-xs mb-4" style={{ color: N.muted }}>
                      Essaie d’autres filtres ou enlève « Favoris ».
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setInspireStyleKey(null);
                        setInspireZone('all');
                        setInspireFavoritesOnly(false);
                      }}
                      className="text-xs font-bold px-4 py-2.5 rounded-xl"
                      style={{ background: N.neon, color: '#fff' }}
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                ) : (
                  <div className="columns-2 gap-2 sm:columns-3 sm:gap-2.5 [column-fill:balance]">
                    {filteredInspirePins.map((pin, i) => (
                      <div key={pin.id} className="relative mb-2 break-inside-avoid">
                        <motion.button
                          type="button"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.04, 0.6) }}
                          onClick={() => openStudioFromInspirePin(pin)}
                          className="w-full rounded-2xl overflow-hidden text-left border active:scale-[0.98] transition-transform touch-manipulation"
                          style={{
                            borderColor: N.border,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          <div className="relative w-full bg-zinc-100">
                            <img
                              src={pin.imageUrl}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="w-full h-auto block object-cover"
                              style={{ maxHeight: 'min(420px, 70vh)' }}
                              onError={hideBrokenImage}
                            />
                            <div
                              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none"
                              aria-hidden
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 pr-12">
                              <p className="text-[11px] sm:text-xs font-bold text-white leading-tight line-clamp-2 drop-shadow-sm">
                                {pin.title}
                              </p>
                              <p className="text-[9px] sm:text-[10px] text-white/85 mt-0.5 line-clamp-2">{pin.subtitle}</p>
                            </div>
                          </div>
                        </motion.button>
                        <button
                          type="button"
                          aria-label={favInspireIds.has(pin.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                          aria-pressed={favInspireIds.has(pin.id)}
                          onClick={(e) => toggleInspirePinFavorite(e, pin.id)}
                          className="absolute top-2 right-2 z-20 w-11 h-11 rounded-full flex items-center justify-center border active:scale-95 transition-transform touch-manipulation"
                          style={{
                            background: 'rgba(255,255,255,0.92)',
                            borderColor: N.border,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                          }}
                        >
                          <Heart
                            className="w-5 h-5"
                            style={{
                              color: favInspireIds.has(pin.id) ? '#ef4444' : N.muted,
                            }}
                            fill={favInspireIds.has(pin.id) ? '#ef4444' : 'none'}
                            strokeWidth={2}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-center mt-6 px-2 leading-relaxed" style={{ color: N.muted }}>
                  Les visuels proviennent des portfolios publics des studios (et bientôt des flux Instagram synchronisés
                  côté pro, sous conditions Meta). Résultats et disponibilités selon chaque tatoueur — Inkflow ne modère
                  pas le contenu artistique.
                </p>
              </div>
            )}

            {/* ════ RDV ════ */}
            {tab === 'rdv' && (
              <div className="px-4 pt-5 space-y-8 pb-6">
                {isGuest ? (
                  <GuestConnectPanel
                    title="Tes rendez-vous"
                    body="Connecte-toi avec l’email utilisé lors d’une réservation pour voir tes RDV à venir et ton historique."
                  />
                ) : (
                <>
                <section>
                  <h2 className="text-[13px] font-bold uppercase tracking-widest mb-4" style={{ color: N.muted }}>À venir</h2>
                  {upcoming.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                      className="rounded-3xl overflow-hidden"
                      style={{ background: 'linear-gradient(145deg, #f9f6f2 0%, #f0ebe3 100%)', border: `1px solid ${N.border}` }}
                    >
                      <div className="p-8 flex flex-col items-center text-center gap-4">
                        <div className="text-4xl">🗓️</div>
                        <div>
                          <p className="font-black text-base mb-1" style={{ color: N.text }}>Aucun RDV à venir</p>
                          <p className="text-sm" style={{ color: N.muted }}>Réserve ta prochaine session directement depuis l'app.</p>
                        </div>
                        <motion.button type="button" whileTap={{ scale: 0.97 }}
                          onClick={() => goTab('explore')}
                          className="w-full py-3.5 rounded-2xl text-sm font-bold"
                          style={{ background: N.neon, color: '#fff', boxShadow: N.neonGlow }}>
                          Trouver un tatoueur
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {upcoming.map((a, i) => {
                        const d0 = Math.ceil((new Date(a.date).getTime() - Date.now()) / 86400000);
                        const jLabel = d0 > 0 ? `J−${d0}` : "Aujourd'hui !";
                        const { title, subtitle } = parseAppointmentService(a.service);
                        return (
                          <motion.div key={a.id}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="rounded-3xl border overflow-hidden"
                            style={{ borderColor: N.borderMid, background: N.surface }}
                          >
                            <div className="h-1" style={{ background: `linear-gradient(90deg, ${N.neon}, rgba(212,188,150,0.5))` }} />
                            <div className="p-4">
                              <div className="mb-2">
                                <p className="text-[15px] font-bold leading-snug break-words" style={{ color: N.text }}>
                                  {formatRdvDateTimeHeader(a.date, a.time)}
                                </p>
                                <span
                                  className="inline-block mt-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg"
                                  style={{ background: N.neonDim, color: N.neonText }}
                                >
                                  {jLabel}
                                </span>
                              </div>
                              <h3 className="text-base font-bold leading-snug break-words mt-2" style={{ color: N.text }}>
                                {title}
                              </h3>
                              {subtitle ? (
                                <p
                                  className="text-xs mt-1.5 leading-relaxed line-clamp-3"
                                  style={{ color: N.textSub }}
                                  title={subtitle}
                                >
                                  {subtitle}
                                </p>
                              ) : null}
                              {a.studio_name && (
                                <div className="mt-3 pt-3 border-t" style={{ borderColor: N.border }}>
                                  <p className="text-sm font-semibold flex items-start gap-2" style={{ color: N.text }}>
                                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: N.neonText }} />
                                    <span className="min-w-0">{a.studio_name}</span>
                                  </p>
                                  <p className="text-xs mt-1 pl-6 leading-snug" style={{ color: N.muted }}>
                                    {a.studio_address ?? 'Adresse communiquée par le studio'}
                                  </p>
                                </div>
                              )}
                              <div className="flex gap-2 mt-3">
                                <a
                                  href={mapsUrl(a.studio_address ?? '')}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 text-sm font-bold px-3 py-2.5 rounded-2xl active:scale-[0.98] transition-transform"
                                  style={{ background: N.neon, color: N.bg }}
                                >
                                  <Navigation className="w-4 h-4 shrink-0" />
                                  Y aller
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setRdvDetailTarget(a)}
                                  className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2.5 rounded-2xl border active:scale-[0.98] transition-transform"
                                  style={{ borderColor: N.border, color: N.textSub, background: N.elevated }}
                                >
                                  <FileText className="w-4 h-4 shrink-0" />
                                  Fiche
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-[13px] font-bold uppercase tracking-widest mb-4" style={{ color: N.muted }}>Historique</h2>
                  {completed.length === 0 ? (
                    <p className="text-sm" style={{ color: N.muted }}>Tes tatouages passés apparaîtront ici.</p>
                  ) : (
                    <div className="space-y-3">
                      {completed.map((a, i) => (
                        <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                          className="rounded-3xl border overflow-hidden" style={{ borderColor: N.border, background: N.surface }}>
                          <div className="h-28 flex items-end p-4" style={{ background: `linear-gradient(135deg, #141010, #1E1A10)` }}>
                            <span className="text-xs font-semibold" style={{ color: N.textSub }}>{a.service} — Résultat</span>
                          </div>
                          <div className="p-4">
                            <p className="text-xs" style={{ color: N.muted }}>{formatDateFr(a.date)}</p>
                            <div className="flex gap-2 mt-3">
                              <button type="button"
                                onClick={() => setReviewTarget(a)}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border"
                                style={{ borderColor: 'rgba(107,83,69,0.22)', color: N.neonText, background: N.neonDim }}>
                                <Star className="w-3 h-3" />
                                Laisser un avis
                              </button>
                              <button type="button"
                                onClick={() => goTab('explore')}
                                className="text-xs font-medium px-3.5 py-2 rounded-xl border"
                                style={{ borderColor: N.border, color: N.muted, background: N.elevated }}>
                                Reprendre RDV
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>
                </>
                )}
              </div>
            )}

            {/* ════ FIDÉLITÉ ════ */}
            {tab === 'loyalty' && (
              <div className="px-4 pt-5 space-y-6 pb-6">
                {isGuest ? (
                  <GuestConnectPanel
                    title="Fidélité & parrainage"
                    body="Crée un compte ou connecte-toi pour voir tes tampons, ta progression et ton code parrainage."
                  />
                ) : (
                <>
                {/* Carte fidélité 3D flip */}
                <LoyaltyCard
                  firstName={firstName}
                  code={code || 'XXXXXX'}
                  cents={cents}
                  stampsCount={completed.length}
                  lastStudio={completed[0] ? (completed[0].studio_name ?? undefined) : undefined}
                  accessToken={accessToken}
                />

                {/* Progression par studio */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 shrink-0" style={{ color: N.muted }} aria-hidden />
                    <h2 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: N.muted }}>
                      Tes tatoueurs
                    </h2>
                  </div>
                  {walletProgressByStudio.length === 0 ? (
                    <p className="text-sm rounded-2xl border px-4 py-4" style={{ borderColor: N.border, color: N.muted, background: N.surface }}>
                      Dès que tu auras un rendez-vous, ta progression par tatoueur / studio apparaîtra ici.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {walletProgressByStudio.map((row, i) => {
                        const cap = Math.max(1, row.targetStamps);
                        const filled = Math.min(row.completed, cap);
                        const pct = Math.min(100, Math.round((filled / cap) * 100));
                        return (
                          <motion.div
                            key={row.studioKey}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-2xl border px-4 py-3.5"
                            style={{ borderColor: N.border, background: N.surface }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate" style={{ color: N.text }}>{row.label}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: N.muted }}>
                                  {row.completed} séance{row.completed !== 1 ? 's' : ''} terminée{row.completed !== 1 ? 's' : ''}
                                  {row.upcoming > 0 ? ` · ${row.upcoming} RDV à venir` : ''}
                                </p>
                              </div>
                              <span className="text-xs font-black tabular-nums shrink-0" style={{ color: N.neonText }}>
                                {filled}/{cap}
                              </span>
                            </div>
                            <div
                              className="mt-2.5 h-1.5 rounded-full overflow-hidden"
                              style={{ background: N.elevated }}
                              role="progressbar"
                              aria-valuenow={filled}
                              aria-valuemin={0}
                              aria-valuemax={cap}
                              aria-label={`Progression fidélité ${row.label}`}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: N.neon }}
                              />
                            </div>
                            {row.slug ? (
                              <button
                                type="button"
                                className="mt-3 text-xs font-semibold inline-flex items-center gap-1 active:scale-[0.98] transition-transform"
                                style={{ color: N.neonText }}
                                onClick={() => { window.location.href = `/studio/${row.slug}`; }}
                              >
                                Voir la vitrine
                                <ChevronRight className="w-3.5 h-3.5" aria-hidden />
                              </button>
                            ) : null}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Parrainage */}
                <div className="rounded-3xl border overflow-hidden" style={{ borderColor: N.borderMid, background: N.surface }}>
                  <div className="px-5 pt-5 pb-4" style={{ background: `linear-gradient(135deg, rgba(212,188,150,0.08), rgba(212,188,150,0.02))` }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: N.neon }}>Parrainage</p>
                        <h3 className="text-lg font-black" style={{ color: N.text }}>Gagne 10€ par ami</h3>
                        <p className="text-xs mt-1" style={{ color: N.muted }}>Pour chaque ami qui réserve son 1er tattoo via ton lien.</p>
                      </div>
                      {referralCount > 0 && (
                        <div className="flex flex-col items-center px-3 py-2 rounded-2xl border ml-3 shrink-0"
                          style={{ borderColor: N.border, background: N.elevated }}>
                          <span className="text-xl font-black tabular-nums" style={{ color: N.neonText }}>{referralCount}</span>
                          <span className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: N.muted }}>amis</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-3 space-y-3">
                    <div className="flex items-center gap-2 px-3.5 py-3 rounded-2xl border" style={{ borderColor: N.border, background: N.elevated }}>
                      <span className="flex-1 text-xs font-mono truncate" style={{ color: N.textSub }}>
                        {shareUrl.replace(/^https?:\/\//, '')}
                      </span>
                      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={copyCode}
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: copiedCode ? 'rgba(94,219,154,0.15)' : N.neonDim, color: copiedCode ? N.success : N.neon }}>
                        <AnimatePresence mode="wait" initial={false}>
                          {copiedCode
                            ? <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check className="w-4 h-4" /></motion.span>
                            : <motion.span key="p" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Copy className="w-4 h-4" /></motion.span>
                          }
                        </AnimatePresence>
                      </motion.button>
                    </div>
                    <motion.button type="button" whileTap={{ scale: 0.98 }}
                      onClick={() => navigator.share?.({ title: 'Inkflow', url: shareUrl }).catch(() => {})}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
                      style={{ background: N.neon, color: N.bg, boxShadow: N.neonGlow }}>
                      <Share2 className="w-4 h-4" />
                      Partager mon invitation
                    </motion.button>
                  </div>
                </div>
                </>
                )}
              </div>
            )}

            {/* ════ WALLET ════ */}
            {tab === 'wallet' && (
              <div className="px-4 pt-5 space-y-6 pb-6">
                {isGuest ? (
                  <GuestConnectPanel
                    title="Wallet & parrainage"
                    body="Crée un compte ou connecte-toi pour activer ton crédit fidélité, ton code parrainage et l’historique des gains."
                  />
                ) : (
                <>
                {/* Carte fidélité 3D flip */}
                <LoyaltyCard
                  firstName={firstName}
                  code={code || 'XXXXXX'}
                  cents={cents}
                  stampsCount={completed.length}
                  lastStudio={completed[0] ? (completed[0].studio_name ?? undefined) : undefined}
                  accessToken={accessToken}
                />

                {/* Progression par studio / tatoueur (alignée sur tes RDV + objectif tampons du studio) */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 shrink-0" style={{ color: N.muted }} aria-hidden />
                    <h2 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: N.muted }}>
                      Tes tatoueurs
                    </h2>
                  </div>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: N.textSub }}>
                    Séances terminées par lieu — même base que la fiche client côté studio. Le compteur utilise l’objectif tampons du studio quand il est configuré.
                  </p>
                  {walletProgressByStudio.length === 0 ? (
                    <p className="text-sm rounded-2xl border px-4 py-4" style={{ borderColor: N.border, color: N.muted, background: N.surface }}>
                      Dès que tu auras un rendez-vous, ta progression par tatoueur / studio apparaîtra ici.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {walletProgressByStudio.map((row, i) => {
                        const cap = Math.max(1, row.targetStamps);
                        const filled = Math.min(row.completed, cap);
                        const pct = Math.min(100, Math.round((filled / cap) * 100));
                        return (
                          <motion.div
                            key={row.studioKey}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-2xl border px-4 py-3.5"
                            style={{ borderColor: N.border, background: N.surface }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate" style={{ color: N.text }}>{row.label}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: N.muted }}>
                                  {row.completed} séance{row.completed !== 1 ? 's' : ''} terminée{row.completed !== 1 ? 's' : ''}
                                  {row.upcoming > 0
                                    ? ` · ${row.upcoming} RDV à venir`
                                    : ''}
                                </p>
                              </div>
                              <span className="text-xs font-black tabular-nums shrink-0" style={{ color: N.neonText }}>
                                {filled}/{cap}
                              </span>
                            </div>
                            <div
                              className="mt-2.5 h-1.5 rounded-full overflow-hidden"
                              style={{ background: N.elevated }}
                              role="progressbar"
                              aria-valuenow={filled}
                              aria-valuemin={0}
                              aria-valuemax={cap}
                              aria-label={`Progression fidélité ${row.label}`}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: N.neon }}
                              />
                            </div>
                            {row.slug ? (
                              <button
                                type="button"
                                className="mt-3 text-xs font-semibold inline-flex items-center gap-1 active:scale-[0.98] transition-transform"
                                style={{ color: N.neonText }}
                                onClick={() => { window.location.href = `/studio/${row.slug}`; }}
                              >
                                Voir la vitrine
                                <ChevronRight className="w-3.5 h-3.5" aria-hidden />
                              </button>
                            ) : null}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Parrainage */}
                <div className="rounded-3xl border overflow-hidden" style={{ borderColor: N.borderMid, background: N.surface }}>
                  {/* Header neon */}
                  <div className="px-5 pt-5 pb-4" style={{ background: `linear-gradient(135deg, rgba(212,188,150,0.08), rgba(212,188,150,0.02))` }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: N.neon }}>Parrainage</p>
                        <h3 className="text-lg font-black" style={{ color: N.text }}>Gagne 10€ par ami</h3>
                        <p className="text-xs mt-1" style={{ color: N.muted }}>Pour chaque ami qui réserve son 1er tattoo via ton lien.</p>
                      </div>
                      {referralCount > 0 && (
                        <div className="flex flex-col items-center px-3 py-2 rounded-2xl border ml-3 shrink-0"
                          style={{ borderColor: N.border, background: N.elevated }}>
                          <span className="text-xl font-black tabular-nums" style={{ color: N.neonText }}>{referralCount}</span>
                          <span className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: N.muted }}>amis</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 space-y-3">
                    <div className="flex items-center gap-2 px-3.5 py-3 rounded-2xl border" style={{ borderColor: N.border, background: N.elevated }}>
                      <span className="flex-1 text-xs font-mono truncate" style={{ color: N.textSub }}>
                        {shareUrl.replace(/^https?:\/\//, '')}
                      </span>
                      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={copyCode}
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: copiedCode ? 'rgba(94,219,154,0.15)' : N.neonDim, color: copiedCode ? N.success : N.neon }}>
                        <AnimatePresence mode="wait" initial={false}>
                          {copiedCode
                            ? <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check className="w-4 h-4" /></motion.span>
                            : <motion.span key="p" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Copy className="w-4 h-4" /></motion.span>
                          }
                        </AnimatePresence>
                      </motion.button>
                    </div>
                    <motion.button type="button" whileTap={{ scale: 0.98 }}
                      onClick={() => navigator.share?.({ title: 'Inkflow', url: shareUrl }).catch(() => {})}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
                      style={{ background: N.neon, color: N.bg, boxShadow: N.neonGlow }}>
                      <Share2 className="w-4 h-4" />
                      Partager mon invitation
                    </motion.button>
                  </div>
                </div>

                {/* Transactions */}
                <section>
                  <h2 className="text-[13px] font-bold uppercase tracking-widest mb-3" style={{ color: N.muted }}>Transactions</h2>
                  <div className="rounded-3xl border overflow-hidden" style={{ borderColor: N.border, background: N.surface }}>
                    {(walletTxns.length > 0 ? walletTxns : TXNS).map((tx, i) => (
                      <motion.div key={tx.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-3 px-4 py-4 border-b last:border-0"
                        style={{ borderColor: N.border }}>
                        <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                          style={{ background: tx.pos ? 'rgba(94,219,154,0.1)' : 'rgba(244,123,123,0.1)' }}>
                          <span className="text-sm font-bold" style={{ color: tx.pos ? N.success : N.error }}>{tx.pos ? '+' : '−'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: N.text }}>{tx.label}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: N.muted }}>{tx.sub}</p>
                        </div>
                        <span className="text-sm font-black tabular-nums shrink-0" style={{ color: tx.pos ? N.success : N.muted }}>{tx.amount}</span>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Quick actions */}
                <section>
                  <h2 className="text-[13px] font-bold uppercase tracking-widest mb-3" style={{ color: N.muted }}>Services</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { Icon: Calculator, label: 'Estimer un prix', sub: 'Fourchette indicative', onClick: () => setShowPriceEstimator(true) },
                      { Icon: Brush,      label: 'Design sur mesure', sub: 'Commande un projet custom', onClick: () => setShowCommissionModal(true) },
                    ].map(({ Icon, label, sub, onClick }) => (
                      <motion.button key={label} type="button" whileTap={{ scale: 0.97 }} onClick={onClick}
                        className="rounded-3xl border p-4 text-left flex flex-col gap-2 transition-all active:opacity-80"
                        style={{ borderColor: N.border, background: N.surface }}>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                          style={{ background: N.neonDim }}>
                          <Icon className="w-5 h-5" style={{ color: N.neon }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-tight" style={{ color: N.text }}>{label}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: N.muted }}>{sub}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </section>

                {/* Gift cards */}
                <section>
                  <h2 className="text-[13px] font-bold uppercase tracking-widest mb-3" style={{ color: N.muted }}>Gift Cards</h2>
                  <GiftCardSection sessionEmail={sessionEmail!} />
                </section>
                </>
                )}
              </div>
            )}

            {/* ════ PROFIL ════ */}
            {tab === 'profile' && (
              <div className="px-4 pt-5 space-y-6 pb-6">
                {isGuest ? (
                  <GuestLoginForm />
                ) : (
                <>
                {/* Profile card avec édition du nom */}
                <div className="rounded-3xl border overflow-hidden"
                  style={{ borderColor: N.border, background: N.elevated }}>
                  <div className="p-5 flex items-center gap-4">
                    <div className="relative shrink-0">
                      <input
                        ref={clientAvatarInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        aria-hidden
                        tabIndex={-1}
                        onChange={(ev) => void handleClientAvatarSelect(ev)}
                      />
                      <button
                        type="button"
                        disabled={profileAvatarUploading}
                        onClick={() => clientAvatarInputRef.current?.click()}
                        className="relative w-16 h-16 rounded-3xl flex items-center justify-center text-xl font-black border-2 overflow-hidden active:scale-[0.98] transition-transform disabled:opacity-70"
                        style={{ borderColor: 'rgba(107,83,69,0.22)', background: N.neonDim, color: N.neonText }}
                        aria-label="Choisir une photo de profil"
                      >
                        {profileAvatarUrl && !profileAvatarLoadFailed ? (
                          <img
                            src={profileAvatarUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={() => setProfileAvatarLoadFailed(true)}
                          />
                        ) : (
                          <span className="relative z-10">{firstName.slice(0, 1).toUpperCase()}</span>
                        )}
                        {profileAvatarUploading && (
                          <div
                            className="absolute inset-0 z-20 flex items-center justify-center bg-black/35"
                            aria-live="polite"
                          >
                            <span
                              className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin"
                              aria-hidden
                            />
                          </div>
                        )}
                        <span
                          className="absolute bottom-0.5 right-0.5 z-10 w-7 h-7 rounded-xl flex items-center justify-center border shadow-sm pointer-events-none"
                          style={{ background: '#fff', borderColor: N.border }}
                          aria-hidden
                        >
                          <Camera className="w-3.5 h-3.5" style={{ color: N.neonText }} />
                        </span>
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      {profileEditMode ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && void saveDisplayName()}
                            placeholder="Ton prénom..."
                            autoFocus
                            className="flex-1 rounded-xl border px-3 py-2 text-sm font-bold outline-none"
                            style={{ background: N.surface, borderColor: N.neon, color: N.text, caretColor: N.neon, minWidth: 0 }}
                          />
                          <button type="button" onClick={() => void saveDisplayName()}
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: N.neon }}>
                            <Check className="w-4 h-4" style={{ color: N.bg }} />
                          </button>
                          <button type="button" onClick={() => setProfileEditMode(false)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: N.elevated, border: `1px solid ${N.border}` }}>
                            <X className="w-4 h-4" style={{ color: N.muted }} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-black truncate" style={{ color: N.text }}>{firstName}</p>
                          <button type="button" onClick={() => { setDisplayName(firstName === 'toi' ? '' : firstName); setProfileEditMode(true); }}
                            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: N.surface, border: `1px solid ${N.border}` }}>
                            <Edit2 className="w-3.5 h-3.5" style={{ color: N.muted }} />
                          </button>
                        </div>
                      )}
                      <p className="text-xs truncate mt-0.5" style={{ color: N.muted }}>{sessionEmail}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={profileAvatarUploading}
                          onClick={() => clientAvatarInputRef.current?.click()}
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-xl border active:scale-[0.98] transition-transform disabled:opacity-50"
                          style={{ borderColor: N.border, background: N.surface, color: N.neonText }}
                        >
                          {profileAvatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
                        </button>
                        {hasClientUploadedAvatar ? (
                          <button
                            type="button"
                            disabled={profileAvatarUploading}
                            onClick={() => void removeClientAvatar()}
                            className="text-[11px] font-medium px-3 py-1.5 rounded-xl border active:scale-[0.98] transition-transform disabled:opacity-50 inline-flex items-center gap-1"
                            style={{ borderColor: N.border, color: N.muted, background: N.elevated }}
                          >
                            <Trash2 className="w-3 h-3" />
                            Retirer ma photo Inkflow
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: N.neonDim, color: N.neonText }}>
                          {completed.length >= 10 ? 'Platinum Member' : completed.length >= 5 ? 'Gold Member' : completed.length >= 2 ? 'Silver Member' : 'Bronze Member'}
                        </span>
                        <span className="text-[10px]" style={{ color: N.muted }}>{completed.length} séance{completed.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Map — Ma collection */}
                <section>
                  <h2 className="text-[13px] font-bold uppercase tracking-widest mb-3" style={{ color: N.muted }}>Ma Collection</h2>
                  <BodyMap tags={bodyMapTags} onToggle={toggleBodyTag} />
                </section>

                <section>
                  <h2 className="text-[13px] font-bold uppercase tracking-widest mb-3" style={{ color: N.muted }}>Studios sauvegardés</h2>
                  <p className="text-[11px] leading-relaxed mb-3" style={{ color: N.muted }}>
                    Les studios que tu marques avec le cœur dans Explorer restent listés ici (sauvegarde sur cet appareil).
                  </p>
                  {savedStudios.length === 0 ? (
                    <div className="rounded-3xl border px-4 py-8 text-center" style={{ borderColor: N.border, background: N.surface }}>
                      <p className="text-sm font-semibold" style={{ color: N.text }}>Aucun studio enregistré</p>
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: N.muted }}>
                        Ouvre l’onglet Explorer et touche le cœur sur une carte « À découvrir ».
                      </p>
                    </div>
                  ) : (
                  <div className="space-y-2">
                    {savedStudios.map((s, i) => (
                      <motion.button key={s.id} type="button"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setArtistSheet(s)}
                        className="w-full flex items-center gap-3.5 p-4 rounded-3xl border text-left"
                        style={{ borderColor: N.border, background: N.surface }}>
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${s.grad[0]}, ${s.grad[1]})` }}>
                          {s.avatarUrl
                            ? <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover object-top" onError={hideBrokenImage} />
                            : s.name.slice(0, 2)
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: N.text }}>{s.name}</p>
                          <p className="text-[11px] truncate mt-0.5" style={{ color: N.muted }}>
                            {s.artistLabel}{s.styleLabel ? ` · ${s.styleLabel}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-semibold" style={{ color: N.muted }}>{s.distLabel}</span>
                          <ChevronRight className="w-4 h-4 ml-1" style={{ color: N.border }} />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  )}
                </section>

                <button type="button"
                  onClick={() => supabase.auth.signOut().then(() => { window.location.href = '/client/dashboard'; })}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-sm font-medium active:scale-[0.98] transition-all"
                  style={{ borderColor: N.border, background: N.surface, color: N.muted }}>
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
                </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Artist sheet ── */}
      <ArtistSheet studio={artistSheet} onClose={() => setArtistSheet(null)} isGuest={isGuest} />

      {/* ── Fiche RDV (libellé complet) ── */}
      <AnimatePresence>
        {rdvDetailTarget && (
          <ClientAppointmentDetailSheet
            key={rdvDetailTarget.id}
            appointment={rdvDetailTarget}
            onClose={() => setRdvDetailTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Review modal ── */}
      <AnimatePresence>
        {reviewTarget && sessionEmail && (
          <ReviewModal
            appointment={reviewTarget}
            sessionEmail={sessionEmail}
            onClose={() => setReviewTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Review prompt ── */}
      <AnimatePresence>
        {showReviewPrompt && (
          <ClientReviewPrompt
            triggerLabel={reviewTriggerLabel}
            onClose={() => {
              markReviewPromptDismissed();
              setShowReviewPrompt(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Price estimator bottom sheet ── */}
      <AnimatePresence>
        {showPriceEstimator && (
          <PriceEstimator onClose={() => setShowPriceEstimator(false)} />
        )}
      </AnimatePresence>

      {/* ── Commission modal ── */}
      <AnimatePresence>
        {showCommissionModal && (
          <CommissionModal
            sessionEmail={sessionEmail}
            onClose={() => setShowCommissionModal(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Bottom nav flottante neon ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <nav
          className="flex rounded-[2rem] border overflow-hidden w-full max-w-md px-0.5"
          style={{
            background: 'rgba(14,14,14,0.92)',
            backdropFilter: 'blur(24px)',
            borderColor: N.borderMid,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          {([
            { id: 'explore' as const, Icon: MapIcon,      label: 'Explorer', badge: false },
            { id: 'inspire' as const, Icon: Images,       label: 'Inspi',    badge: false },
            { id: 'rdv'     as const, Icon: CalendarDays, label: 'RDV',      badge: rdvUrgent },
            { id: 'loyalty' as const, Icon: Gift,         label: 'Fidélité', badge: false },
            { id: 'profile' as const, Icon: User,         label: 'Profil',   badge: false },
          ] as const).map(({ id, Icon, label, badge }) => {
            const active = tab === id;
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => goTab(id)}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="flex-1 flex flex-col items-center py-2.5 sm:py-3 gap-0.5 min-w-0 relative"
                style={{ color: active ? N.neonOnDark : N.muted }}
              >
                {active && (
                  <motion.div layoutId="nav-neon"
                    className="absolute inset-x-1 sm:inset-x-1.5 inset-y-1 rounded-xl sm:rounded-2xl"
                    style={{ background: N.neonDim }}
                    transition={{ type: 'spring', stiffness: 420, damping: 35 }}
                  />
                )}
                <div className="relative z-10 shrink-0">
                  <Icon className="w-[1.15rem] h-[1.15rem] sm:w-5 sm:h-5" strokeWidth={active ? 2.3 : 1.5} />
                  {badge && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: N.error }} />
                  )}
                </div>
                <span className="text-[8px] sm:text-[9px] font-semibold tracking-tight relative z-10 truncate max-w-full px-0.5">{label}</span>
              </motion.button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
