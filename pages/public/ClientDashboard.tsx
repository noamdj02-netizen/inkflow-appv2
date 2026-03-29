/**
 * Inkflow Client — "The Tattoo Journey"
 * ─────────────────────────────────────────────────────────────────────────────
 * Design system : #0A0A0A · blanc cassé · NEON #DFFF00
 * Typographie   : Syne (display) + Inter (body)
 * Motion        : Framer Motion — onboarding bulles, slides, spring micro-interactions
 * Structure     : Onboarding (Welcome → StylePicker) → Dashboard (4 onglets)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Heart, Star, ChevronRight, Search, X,
  ExternalLink, Wallet, User, CalendarDays,
  Map, Flame, LogOut, Clock, ArrowUpRight, Copy, Share2, Check, Lock,
  Navigation, List, LayoutGrid, LayoutDashboard, FolderKanban, Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { clientNeedsPassword } from '../../lib/clientAuth';
import { getInviteBaseUrl } from '../../lib/urls';
import { type ClientAppointment, type ClientTab } from '../../components/client/clientExperienceTypes';
import { HealingBanner } from '../../components/client/HealingBanner';
import { getNearbyStudios, type NearbyStudio } from '../../lib/supabaseGeo';
import { NearbyMapView } from '../../components/client/NearbyMapView';
import { LoyaltyCard } from '../../components/client/LoyaltyCard';
import { ROUEN_STUDIOS, ROUEN_FLASH, type DisplayFlash, type SheetStudio } from '../../lib/rouenStudios';

// ── Design tokens ─────────────────────────────────────────────────────────────
const N = {
  bg:         '#0A0A0A',
  surface:    '#111111',
  elevated:   '#181818',
  border:     '#202020',
  borderMid:  '#2C2C2C',
  text:       '#F5F3EF',
  textSub:    '#ADADAB',
  muted:      '#555555',
  neon:       '#DFFF00',
  neonDim:    'rgba(223,255,0,0.10)',
  neonGlow:   '0 0 18px rgba(223,255,0,0.28)',
  neonText:   '#E8FF3A',
  success:    '#5EDB9A',
  error:      '#F47B7B',
} as const;

const TAB_ORDER: ClientTab[] = ['explore', 'rdv', 'wallet', 'profile'];

// ── Mock data ─────────────────────────────────────────────────────────────────
const STYLES = [
  { id: 'japonais',    label: 'Japonais',   emoji: '🐉', desc: 'Irezumi & Koi',        grad: ['#1A0A2E', '#3D1A6B'] },
  { id: 'fineline',    label: 'Fine line',  emoji: '✒️', desc: 'Délicat & précis',      grad: ['#0A1A2E', '#0F3A5A'] },
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

// ── Utilities ─────────────────────────────────────────────────────────────────
function daysSince(d: string) { return Math.floor((Date.now() - new Date(d).getTime()) / 86400000); }
function formatDateFr(d: string) { return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }); }
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
          <div className="w-5 h-5 rounded-full" style={{ background: `linear-gradient(135deg, #3D1A6B, #1A0A2E)` }} />
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
                ? `linear-gradient(135deg, rgba(223,255,0,0.15), rgba(223,255,0,0.08))`
                : N.elevated,
              border: `1px solid ${b.side === 'right' ? 'rgba(223,255,0,0.2)' : N.border}`,
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
        className="relative isolate"
        style={{ minHeight: Math.max(140, f.h * 0.82), background: `linear-gradient(155deg, ${f.grad[0]}, ${f.grad[1]})` }}
      >
        {/* Image réelle si disponible */}
        {f.imageUrl && (
          <img
            src={f.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        {/* SVG décoratif (fallback sans image) */}
        {!f.imageUrl && (
          <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <circle cx="70" cy="30" r="25" fill="none" stroke="rgba(223,255,0,0.2)" strokeWidth="0.5"/>
            <path d="M10 60 Q50 40 90 60 Q70 85 50 80 Q30 85 10 60Z" fill="rgba(255,255,255,0.03)"/>
          </svg>
        )}

        {/* Heart — seul élément en haut à droite (évite chevauchement avec le titre) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          className="absolute top-2 right-2 z-20 min-w-[44px] min-h-[44px] w-11 h-11 -m-1 rounded-full flex items-center justify-center border"
          style={{ background: 'rgba(10,10,10,0.75)', backdropFilter: 'blur(8px)', borderColor: fav ? 'rgba(223,255,0,0.4)' : N.border }}
          aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className="w-3.5 h-3.5" style={{ color: fav ? N.neon : N.text, fill: fav ? N.neon : 'none' }} />
        </motion.button>

        {/* Overlay info : badge Tendance + titre dans le même bloc bas (plus de chevauchement) */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 px-3 pt-10 pb-3"
          style={{
            background: 'linear-gradient(to top, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.88) 45%, transparent 100%)',
          }}
        >
          {f.hot && (
            <div
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide mb-1.5"
              style={{ background: 'rgba(223,255,0,0.12)', color: N.neon, border: '1px solid rgba(223,255,0,0.2)' }}
            >
              <Flame className="w-3 h-3 shrink-0" />
              Tendance
            </div>
          )}
          <p className="text-[13px] font-bold leading-snug line-clamp-2" style={{ color: N.text }}>{f.name}</p>
          <p className="text-[10px] mt-1 line-clamp-1" style={{ color: 'rgba(245,243,239,0.45)' }}>{f.artist} · {f.dist}</p>
        </div>
      </div>
      <div className="px-3 py-2.5 flex items-center justify-between">
        <span className="text-sm font-black tabular-nums" style={{ color: N.neonText }}>{f.price}€</span>
        <span className="text-[10px] px-2 py-0.5 rounded-lg font-medium" style={{ background: N.elevated, color: N.muted }}>{f.studio}</span>
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
// GUEST LOGIN FORM (profil — inscription / connexion email + mot de passe)
// ══════════════════════════════════════════════════════════════════════════════
const GuestLoginForm: React.FC = () => {
  const [registerMode, setRegisterMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [phase, setPhase] = useState<'form' | 'loading' | 'confirmEmail'>('form');
  const [errorMsg, setErrorMsg] = useState('');

  const submit = async () => {
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setErrorMsg('Adresse email invalide.');
      return;
    }
    if (registerMode) {
      if (password.length < 8) {
        setErrorMsg('Mot de passe : au moins 8 caractères.');
        return;
      }
      if (password !== password2) {
        setErrorMsg('Les mots de passe ne correspondent pas.');
        return;
      }
    } else if (!password) {
      setErrorMsg('Entre ton mot de passe.');
      return;
    }

    setPhase('loading');
    setErrorMsg('');
    try {
      if (registerMode) {
        const { data, error } = await supabase.auth.signUp({
          email: em,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/client`,
            data: {
              client_onboarding_complete: true,
              client_password_set: true,
            },
          },
        });
        if (error) {
          const m = error.message.toLowerCase();
          if (m.includes('already registered') || m.includes('already been registered')) {
            setErrorMsg('Un compte existe déjà. Passe en « Me connecter ».');
          } else {
            setErrorMsg(error.message);
          }
          setPhase('form');
          return;
        }
        if (data.session?.user) {
          window.location.href = '/client/dashboard';
          return;
        }
        if (data.user && !data.session) {
          setPhase('confirmEmail');
          return;
        }
        setPhase('form');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: em, password });
        if (error) {
          const m = error.message.toLowerCase();
          setErrorMsg(
            m.includes('invalid') || m.includes('credentials')
              ? 'Email ou mot de passe incorrect.'
              : error.message
          );
          setPhase('form');
          return;
        }
        if (data.user) {
          window.location.href = '/client/dashboard';
          return;
        }
        setPhase('form');
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur inconnue');
      setPhase('form');
    }
  };

  if (phase === 'confirmEmail') {
    return (
      <div className="px-2 pt-8 pb-6 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: N.neonDim, border: `1.5px solid ${N.neon}` }}>
          <Check className="w-7 h-7" style={{ color: N.neon }} />
        </div>
        <div>
          <p className="text-xl font-black mb-2" style={{ color: N.text }}>Confirme ton email</p>
          <p className="text-sm leading-relaxed" style={{ color: N.muted }}>
            Un email a été envoyé à <strong style={{ color: N.textSub }}>{email}</strong>.<br />
            Clique sur le lien pour activer ton compte, puis reviens ici.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setPhase('form'); setPassword(''); setPassword2(''); }}
          className="text-sm font-semibold active:scale-[0.98] transition-all"
          style={{ color: N.neonText }}
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-4">
      <div className="text-center pb-2">
        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: N.neonDim, border: `1.5px solid rgba(223,255,0,0.2)` }}>
          <User className="w-6 h-6" style={{ color: N.neon }} />
        </div>
        <h2 className="text-xl font-black mb-1" style={{ color: N.text }}>Mon compte</h2>
        <p className="text-sm leading-relaxed" style={{ color: N.muted }}>
          {registerMode
            ? 'Crée ton compte avec ton email et un mot de passe.'
            : 'Connecte-toi avec ton email et ton mot de passe.'}
        </p>
      </div>

      <div className="flex rounded-2xl border p-1 gap-1" style={{ borderColor: N.border, background: N.surface }}>
        <button
          type="button"
          onClick={() => { setRegisterMode(true); setErrorMsg(''); }}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
          style={{
            background: registerMode ? N.neon : 'transparent',
            color: registerMode ? N.bg : N.muted,
            boxShadow: registerMode ? N.neonGlow : 'none',
          }}
        >
          M&apos;inscrire
        </button>
        <button
          type="button"
          onClick={() => { setRegisterMode(false); setErrorMsg(''); }}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
          style={{
            background: !registerMode ? N.neon : 'transparent',
            color: !registerMode ? N.bg : N.muted,
            boxShadow: !registerMode ? N.neonGlow : 'none',
          }}
        >
          Me connecter
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: N.muted }}>Email</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
            placeholder="ton@email.com"
            className="w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition-all"
            style={{
              background: N.elevated,
              borderColor: errorMsg ? N.error : N.border,
              color: N.text,
            }}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: N.muted }}>Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: N.muted }} />
            <input
              type="password"
              autoComplete={registerMode ? 'new-password' : 'current-password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
              placeholder={registerMode ? 'Au moins 8 caractères' : '••••••••'}
              className="w-full rounded-2xl border pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
              style={{
                background: N.elevated,
                borderColor: errorMsg ? N.error : N.border,
                color: N.text,
              }}
            />
          </div>
        </div>
        {registerMode && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: N.muted }}>Confirmer</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: N.muted }} />
              <input
                type="password"
                autoComplete="new-password"
                value={password2}
                onChange={e => { setPassword2(e.target.value); setErrorMsg(''); }}
                placeholder="Répète le mot de passe"
                className="w-full rounded-2xl border pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
                style={{
                  background: N.elevated,
                  borderColor: errorMsg ? N.error : N.border,
                  color: N.text,
                }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs px-1" style={{ color: N.error }}>{errorMsg}</p>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          disabled={phase === 'loading' || !email.trim()}
          onClick={submit}
          className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
          style={{
            background: email.trim() ? N.neon : N.border,
            color: email.trim() ? N.bg : N.muted,
            boxShadow: email.trim() ? N.neonGlow : 'none',
            cursor: phase === 'loading' ? 'not-allowed' : 'pointer',
          }}
        >
          {phase === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 animate-spin inline-block"
                style={{ borderColor: N.bg, borderTopColor: 'transparent' }} />
              Patience…
            </span>
          ) : registerMode ? (
            'Créer mon compte'
          ) : (
            'Se connecter'
          )}
        </motion.button>
      </div>

      <p className="text-center text-xs leading-relaxed" style={{ color: N.muted }}>
        Connexion sans lien magique : tout se passe ici avec ton mot de passe.
        {' '}
        <a href="/client" className="font-semibold underline underline-offset-2" style={{ color: N.neonText }}>
          Page d’accès complète
        </a>
      </p>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ARTIST BOTTOM SHEET
// ══════════════════════════════════════════════════════════════════════════════
const GuestConnectPanel: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="rounded-3xl border p-8 flex flex-col items-center text-center gap-3" style={{ borderColor: N.border, background: N.elevated }}>
    <User className="w-10 h-10 opacity-25" style={{ color: N.neon }} />
    <h3 className="text-base font-black" style={{ color: N.text }}>{title}</h3>
    <p className="text-sm leading-relaxed max-w-xs" style={{ color: N.muted }}>{body}</p>
    <a
      href="/client"
      className="mt-2 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
      style={{ background: N.neon, color: N.bg, boxShadow: N.neonGlow }}
    >
      Se connecter ou créer un compte
    </a>
  </div>
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
            <div className="absolute -bottom-7 left-5 w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white border-4"
              style={{ borderColor: N.bg, background: `linear-gradient(135deg, ${studio.grad[0]}, ${studio.grad[1]})` }}
            >
              {studio.name.slice(0, 2)}
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
                    <img src={url} alt="" className="w-full h-full object-cover" />
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
  enter: (d: number) => ({ x: d > 0 ? 50 : -50, opacity: 0, filter: 'blur(3px)' }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit:   (d: number) => ({ x: d > 0 ? -50 : 50, opacity: 0, filter: 'blur(3px)' }),
};

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
  // ── Onboarding state (localStorage) ──
  /** Accès direct à l’app ; l’onboarding plein écran reste disponible si on repasse à welcome/styles plus tard. */
  const [onboardStep, setOnboardStep] = useState<'welcome' | 'styles' | 'done'>('done');

  const finishOnboarding = (styles: string[]) => {
    try { localStorage.setItem('inkflow_onboarded_v1', '1'); } catch {}
    setOnboardStep('done');
  };

  // ── Tab state ──
  const [tab, setTab] = useState<ClientTab>('explore');
  const tabRef = useRef<ClientTab>('explore');
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
  const [search, setSearch] = useState('');
  const [artistSheet, setArtistSheet] = useState<SheetStudio | null>(null);
  const [referralCount] = useState(2);
  const [copiedCode, setCopiedCode] = useState(false);
  /** Sous-onglets de l’espace client (Profil) */
  const [clientSpaceView, setClientSpaceView] = useState<'overview' | 'projects'>('overview');

  // ── Géolocalisation & studios proches ──
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyStudios, setNearbyStudios] = useState<NearbyStudio[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hasHash = window.location.hash.includes('access_token');
    const hashFallback = hasHash ? setTimeout(() => { if (!cancelled) setBootLoading(false); }, 5000) : null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session?.user?.email) {
        setEmail(session.user.email);
        if (window.location.hash) window.history.replaceState({}, '', '/client/dashboard');
        setBootLoading(false);
      } else if (event === 'SIGNED_OUT') {
        window.location.href = '/client/dashboard';
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user?.email) {
        setEmail(session.user.email);
        setBootLoading(false);
      } else {
        setEmail(null);
        if (!hasHash) setBootLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (hashFallback) clearTimeout(hashFallback);
    };
  }, []);

  useEffect(() => {
    if (!sessionEmail) {
      setApts([]);
      setCents(0);
      setCode('');
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

        const { data: apts } = await supabase
          .from('inkflow_appointments').select('id,date,time,service,status,price,inkflow_studios(studio_name)')
          .eq('client_email', sessionEmail).order('date', { ascending: false }).limit(50);
        if (cancelled) return;
        setApts((apts ?? []).map((a: Record<string, unknown>) => ({
          id: String(a.id), date: String(a.date), time: a.time as string | undefined,
          service: String(a.service), status: String(a.status), price: Number(a.price ?? 0),
          studio_name: (a.inkflow_studios as { studio_name?: string } | null)?.studio_name,
          studio_address: 'Paris · adresse communiquée par le studio',
        })));
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
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionEmail]);

  // Demande géolocalisation + charge les studios proches
  useEffect(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        const studios = await getNearbyStudios(latitude, longitude, 50);
        setNearbyStudios(studios);
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 8000, maximumAge: 300_000 },
    );
  }, []);

  // Convertit un NearbyStudio en SheetStudio pour le bottom sheet
  const nearbyToSheet = useCallback((s: NearbyStudio): SheetStudio => ({
    id: s.id,
    slug: s.slug,
    name: s.studio_name,
    artistLabel: s.tags[0] ?? 'Tatoueur',
    styleLabel: s.tags[1] ?? '',
    rating: 0,
    distLabel: s.distance_km < 1
      ? `${Math.round(s.distance_km * 1000)} m`
      : `${s.distance_km.toFixed(1)} km`,
    grad: ['#1A0A2E', '#3D1A6B'],
    portfolioImages: s.portfolio.map((p) => p.url),
    city: s.city ?? undefined,
  }), []);

  const firstName = useMemo(() => {
    if (!sessionEmail) return 'toi';
    const l = sessionEmail.split('@')[0];
    return l.charAt(0).toUpperCase() + l.slice(1);
  }, [sessionEmail]);

  const upcoming = useMemo(() => appointments.filter(a => ['pending','confirmed','in_progress'].includes(a.status)), [appointments]);
  const completed = useMemo(() => appointments.filter(a => a.status === 'completed'), [appointments]);
  const lastTattoo = useMemo(() => completed[0] ?? null, [completed]);
  const healingDays = lastTattoo ? daysSince(lastTattoo.date) : 999;

  // Flash displays : données réelles si geo chargée, sinon Rouen fallback
  const allDisplayFlash = useMemo<DisplayFlash[]>(() => {
    if (nearbyStudios.length === 0) return ROUEN_FLASH;
    const GRADS: [string, string][] = [
      ['#1A0A2E','#3D1A6B'], ['#0A1A2E','#0F3A5A'], ['#1A0A0A','#4A1010'],
      ['#111111','#2A2A2A'], ['#0A1A0A','#143514'], ['#1A0A10','#3D1025'],
    ];
    return nearbyStudios.flatMap((s, si) =>
      s.flash.map((f, fi) => ({
        id: f.id || `${s.id}-${fi}`,
        name: f.title,
        artist: s.studio_name,
        studio: s.studio_name,
        studioSlug: s.slug,
        dist: s.distance_km < 1
          ? `${Math.round(s.distance_km * 1000)} m`
          : `${s.distance_km.toFixed(1)} km`,
        price: f.price,
        h: 160 + ((si * 3 + fi) % 5) * 18,
        grad: GRADS[(si + fi) % GRADS.length],
        hot: fi === 0 && si < 3,
        imageUrl: f.imageUrl || undefined,
      }))
    );
  }, [nearbyStudios]);

  // Studios à afficher (réels ou Rouen fallback)
  const displayStudios = useMemo<SheetStudio[]>(() => {
    if (nearbyStudios.length === 0) return ROUEN_STUDIOS;
    const GRADS: [string, string][] = [
      ['#1A0A2E','#3D1A6B'], ['#0A1A2E','#0F3A5A'],
      ['#111111','#2E2E2E'], ['#2E0A0A','#6B1A1A'],
    ];
    return nearbyStudios.slice(0, 8).map((s, i) => ({
      id: s.id,
      slug: s.slug,
      name: s.studio_name,
      artistLabel: s.tags[0] ?? 'Tatoueur',
      styleLabel: s.tags[1] ?? '',
      rating: 0,
      distLabel: s.distance_km < 1
        ? `${Math.round(s.distance_km * 1000)} m`
        : `${s.distance_km.toFixed(1)} km`,
      grad: GRADS[i % GRADS.length],
      portfolioImages: s.portfolio.map((p) => p.url),
      city: s.city ?? undefined,
    }));
  }, [nearbyStudios]);

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

  const shareUrl = `${getInviteBaseUrl().replace(/\/invite$/, '')}/invite/${code || 'demo'}`;

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
    explore: 'Découvrir',
    rdv: 'Mes RDV',
    wallet: 'Wallet',
    profile: 'Espace client',
  };
  const nextRdv = upcoming[0] ?? null;

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: N.bg, color: N.text, paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20 px-4 sm:px-5 pt-[max(3.25rem,env(safe-area-inset-top))] pb-4 border-b"
        style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(20px)', borderColor: N.border }}
      >
        <div className="flex items-end justify-between gap-3 max-w-lg mx-auto min-w-0">
          <div className="min-w-0 flex-1 pr-1">
            <p className="text-[11px] font-medium mb-0.5 uppercase tracking-widest" style={{ color: N.muted }}>
              {tab === 'explore' ? `Bonjour,` : ''}
            </p>
            <div className="min-w-0">
              <h1
                className="text-[clamp(1.35rem,5.5vw,1.875rem)] font-black leading-[1.1] tracking-tight break-words line-clamp-2 sm:line-clamp-none"
                style={{ color: N.text, fontFamily: 'var(--font-syne, Syne, sans-serif)' }}
              >
                {tab === 'explore' ? firstName : TAB_TITLES[tab]}
              </h1>
              {tab === 'profile' && !isGuest && (
                <p className="text-[11px] mt-1 font-medium truncate" style={{ color: N.muted }}>
                  {clientSpaceView === 'overview' ? 'Vue d’ensemble · ton activité Inkflow' : 'Tes projets tatouage & suivi'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => goTab('wallet')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border"
              style={{ borderColor: N.border, background: N.elevated }}
            >
              <Wallet className="w-3.5 h-3.5" style={{ color: N.neon }} />
              <span className="text-sm font-black tabular-nums" style={{ color: N.neonText }}>{(cents / 100).toFixed(0)}€</span>
            </motion.button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold border text-sm"
              style={{ borderColor: 'rgba(223,255,0,0.2)', background: N.neonDim, color: N.neonText }}>
              {firstName.slice(0, 1)}
            </div>
          </div>
        </div>
      </header>

      {isGuest && (
        <div
          className="max-w-lg mx-auto px-5 py-2.5 border-b text-center"
          style={{ borderColor: N.border, background: 'rgba(223,255,0,0.04)' }}
        >
          <p className="text-[11px] leading-snug" style={{ color: N.muted }}>
            Mode découverte — connecte-toi pour réserver, suivre tes RDV et ton wallet.
          </p>
        </div>
      )}

      {/* ── Healing banner ── */}
      {lastTattoo && healingDays < 15 && (
        <div className="max-w-lg mx-auto">
          <HealingBanner daysSinceCompletion={healingDays} serviceName={lastTattoo.service} />
        </div>
      )}

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
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >

            {/* ════ EXPLORER ════ */}
            {tab === 'explore' && (
              <div className="px-3 sm:px-4 pt-4 sm:pt-5 space-y-5 sm:space-y-6 pb-6 max-w-full min-w-0">

                {/* Localisation pill */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: N.neonDim }}
                    >
                      {geoLoading
                        ? <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: N.neon }} />
                        : <MapPin className="w-3 h-3" style={{ color: N.neon }} />
                      }
                    </div>
                    <span className="text-sm font-semibold" style={{ color: N.textSub }}>
                      {geoLoading ? 'Localisation…' : userPos ? 'Autour de moi' : 'Position inconnue'}
                    </span>
                    {userPos && nearbyStudios.length > 0 && (
                      <span className="text-sm" style={{ color: N.muted }}>
                        · {nearbyStudios.length} studio{nearbyStudios.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {/* Toggle Carte / Liste */}
                  <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ borderColor: N.border, background: N.surface }}>
                    <button
                      type="button"
                      onClick={() => setShowMap(false)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ background: !showMap ? N.elevated : 'transparent', color: !showMap ? N.neon : N.muted }}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ background: showMap ? N.elevated : 'transparent', color: showMap ? N.neon : N.muted }}
                    >
                      <Map className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Carte Google Maps */}
                {showMap && userPos && (
                  <NearbyMapView
                    userPos={userPos}
                    studios={nearbyStudios}
                    onSelectStudio={(s) => setArtistSheet(nearbyToSheet(s))}
                  />
                )}

                {/* CTA géolocalisation si non accordée */}
                {!userPos && !geoLoading && (
                  <button
                    type="button"
                    onClick={() => {
                      setGeoLoading(true);
                      navigator.geolocation?.getCurrentPosition(
                        async (pos) => {
                          const { latitude, longitude } = pos.coords;
                          setUserPos({ lat: latitude, lng: longitude });
                          const studios = await getNearbyStudios(latitude, longitude, 50);
                          setNearbyStudios(studios);
                          setGeoLoading(false);
                        },
                        () => setGeoLoading(false),
                        { timeout: 8000 },
                      );
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-sm font-semibold transition-all active:scale-[0.98]"
                    style={{ borderColor: 'rgba(223,255,0,0.25)', background: N.neonDim, color: N.neonText }}
                  >
                    <Navigation className="w-4 h-4" />
                    Activer la géolocalisation
                  </button>
                )}

                {/* Recherche */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: N.muted }} />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Style, flash, tatoueur…"
                    className="w-full rounded-2xl border pl-11 pr-10 py-3.5 text-sm outline-none"
                    style={{ background: N.surface, borderColor: N.border, color: N.text }}
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: N.borderMid }}>
                      <X className="w-3 h-3" style={{ color: N.muted }} />
                    </button>
                  )}
                </div>

                {/* Studios à la une */}
                {!search && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: N.muted }}>
                        {nearbyStudios.length > 0 ? 'Studios proches' : 'Studios à la une'}
                      </h2>
                      <button type="button" className="text-xs font-semibold" style={{ color: N.neon }}>
                        Voir tout
                      </button>
                    </div>
                    <div
                      className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:-mx-4 sm:px-4 snap-x snap-mandatory touch-pan-x overscroll-x-contain"
                      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                    >
                      {displayStudios.map((s, i) => (
                        <motion.button
                          key={s.id} type="button"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setArtistSheet(s)}
                          className="flex-shrink-0 w-[min(11rem,calc(100vw-3rem))] sm:w-44 rounded-3xl border overflow-hidden text-left snap-start"
                          style={{ borderColor: N.border, background: N.surface }}
                        >
                          <div
                            className="h-28 relative overflow-hidden"
                            style={{ background: `linear-gradient(145deg, ${s.grad[0]}, ${s.grad[1]})` }}
                          >
                            {s.portfolioImages[0] && (
                              <img
                                src={s.portfolioImages[0]}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            )}
                            {s.rating > 0 && (
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold"
                                style={{ background: 'rgba(10,10,10,0.75)', backdropFilter: 'blur(6px)', color: N.text }}>
                                <Star className="w-2.5 h-2.5 fill-current" style={{ color: N.neon }} />
                                {s.rating}
                              </div>
                            )}
                            <div className="absolute bottom-2.5 left-3 text-sm font-black text-white/80">{s.name.slice(0, 2)}</div>
                          </div>
                          <div className="p-3">
                            <p className="text-[13px] font-bold truncate" style={{ color: N.text }}>{s.name}</p>
                            <p className="text-[11px] truncate mt-0.5" style={{ color: N.muted }}>
                              {s.artistLabel}{s.styleLabel ? ` · ${s.styleLabel}` : ''}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-lg" style={{ background: N.elevated, color: N.muted }}>
                                {s.distLabel}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5" style={{ color: N.border }} />
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Flashs */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: N.muted }}>Flashs du moment</h2>
                    <span className="text-[12px]" style={{ color: N.muted }}>{filteredFlash.length} designs</span>
                  </div>
                  {filteredFlash.length === 0 ? (
                    <div className="rounded-3xl border p-10 text-center" style={{ borderColor: N.border, background: N.elevated }}>
                      <p className="text-sm" style={{ color: N.muted }}>Aucun flash pour «{search}»</p>
                    </div>
                  ) : (
                    <div className="flex gap-2 sm:gap-3 min-w-0">
                      <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-3">
                        {colA.map(f => (
                          <FlashCard key={f.id} f={f} fav={favFlash.has(f.id)}
                            onFav={() => setFavFlash(p => { const n = new Set(p); n.has(f.id) ? n.delete(f.id) : n.add(f.id); return n; })} />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-3 pt-7 sm:pt-10">
                        {colB.map(f => (
                          <FlashCard key={f.id} f={f} fav={favFlash.has(f.id)}
                            onFav={() => setFavFlash(p => { const n = new Set(p); n.has(f.id) ? n.delete(f.id) : n.add(f.id); return n; })} />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
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
                    <div className="rounded-3xl border p-10 flex flex-col items-center gap-3" style={{ borderColor: N.border, background: N.elevated }}>
                      <CalendarDays className="w-10 h-10 opacity-20" />
                      <p className="text-sm" style={{ color: N.muted }}>Aucun rendez-vous à venir</p>
                      <button type="button" onClick={() => goTab('explore')}
                        className="text-xs font-semibold px-4 py-2 rounded-xl border"
                        style={{ borderColor: N.border, background: N.surface, color: N.neonText }}>
                        Trouver un tatoueur
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcoming.map((a, i) => {
                        const d0 = Math.ceil((new Date(a.date).getTime() - Date.now()) / 86400000);
                        const jLabel = d0 > 0 ? `J−${d0}` : "Aujourd'hui !";
                        return (
                          <motion.div key={a.id}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="rounded-3xl border overflow-hidden"
                            style={{ borderColor: N.borderMid, background: N.surface }}
                          >
                            <div className="h-1" style={{ background: `linear-gradient(90deg, ${N.neon}, rgba(223,255,0,0.4))` }} />
                            <div className="p-5">
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <span className="text-sm font-black px-3 py-1 rounded-xl" style={{ background: N.neonDim, color: N.neonText }}>{jLabel}</span>
                                <div className="flex items-center gap-1.5 text-xs" style={{ color: N.muted }}>
                                  <Clock className="w-3.5 h-3.5" />{formatDateFr(a.date)}{a.time && ` · ${a.time}`}
                                </div>
                              </div>
                              <h3 className="text-base font-black mb-1" style={{ color: N.text }}>{a.service}</h3>
                              {a.studio_name && (
                                <p className="text-sm flex items-center gap-1.5 mb-1" style={{ color: N.textSub }}>
                                  <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: N.neon }} />{a.studio_name}
                                </p>
                              )}
                              <p className="text-xs mb-4 leading-relaxed" style={{ color: N.muted }}>{a.studio_address ?? 'Adresse communiquée par le studio'}</p>
                              <div className="flex gap-2 flex-wrap">
                                <a href={mapsUrl(a.studio_address ?? '')} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-2xl"
                                  style={{ background: N.neon, color: N.bg }}>
                                  Y aller <ArrowUpRight className="w-3.5 h-3.5" />
                                </a>
                                <button type="button"
                                  onClick={() => { setClientSpaceView('projects'); goTab('profile'); }}
                                  className="text-sm font-medium px-4 py-2.5 rounded-2xl border"
                                  style={{ borderColor: N.border, color: N.textSub, background: N.elevated }}>
                                  Fiche projet
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
                                className="text-xs font-semibold px-3.5 py-2 rounded-xl border"
                                style={{ borderColor: 'rgba(223,255,0,0.25)', color: N.neonText, background: N.neonDim }}>
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
                  inviteUrl={shareUrl}
                />

                {/* Parrainage */}
                <div className="rounded-3xl border overflow-hidden" style={{ borderColor: N.borderMid, background: N.surface }}>
                  {/* Header neon */}
                  <div className="px-5 pt-5 pb-4" style={{ background: `linear-gradient(135deg, rgba(223,255,0,0.06), rgba(223,255,0,0.02))` }}>
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
                    {TXNS.map((tx, i) => (
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
                </>
                )}
              </div>
            )}

            {/* ════ ESPACE CLIENT (Profil) ════ */}
            {tab === 'profile' && (
              <div className="px-4 pt-4 space-y-5 pb-6">
                {isGuest ? (
                  <GuestLoginForm />
                ) : (
                <>
                {/* Segmented : Vue d’ensemble / Projets */}
                <div
                  className="flex p-1 rounded-2xl border gap-0.5"
                  style={{ borderColor: N.borderMid, background: N.surface }}
                  role="tablist"
                  aria-label="Sections espace client"
                >
                  {([
                    { id: 'overview' as const, label: 'Vue d’ensemble', Icon: LayoutDashboard },
                    { id: 'projects' as const, label: 'Projets', Icon: FolderKanban },
                  ]).map(({ id, label, Icon }) => {
                    const on = clientSpaceView === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => setClientSpaceView(id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                        style={{
                          background: on ? N.elevated : 'transparent',
                          color: on ? N.neonText : N.muted,
                          boxShadow: on ? `0 0 0 1px ${N.borderMid}` : 'none',
                        }}
                      >
                        <Icon className="w-4 h-4 shrink-0" strokeWidth={on ? 2.2 : 1.5} />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {clientSpaceView === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22 }}
                      className="space-y-5"
                    >
                  <div className="rounded-3xl border p-5 flex items-center gap-4"
                    style={{ borderColor: N.border, background: N.elevated }}>
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-xl font-black border-2 shrink-0"
                      style={{ borderColor: 'rgba(223,255,0,0.25)', background: N.neonDim, color: N.neonText }}>
                      {firstName.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xl font-black truncate" style={{ color: N.text }}>{firstName}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: N.muted }}>{sessionEmail}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: N.neonDim, color: N.neonText }}>Membre Inkflow</span>
                        {completed.length >= 3 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                            style={{ borderColor: N.border, color: N.textSub }}>Habitué·e</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats rapides */}
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { k: 'rdv', v: String(upcoming.length), sub: 'à venir', onClick: () => goTab('rdv') },
                      { k: 'wal', v: `${(cents / 100).toFixed(0)}€`, sub: 'crédit', onClick: () => goTab('wallet') },
                      { k: 'ink', v: String(completed.length), sub: 'sessions', onClick: () => setClientSpaceView('projects') },
                    ]).map((s) => (
                      <button
                        key={s.k}
                        type="button"
                        onClick={s.onClick}
                        className="rounded-2xl border p-3 text-center transition-all active:scale-[0.98]"
                        style={{ borderColor: N.border, background: N.surface }}
                      >
                        <p className="text-xl font-black tabular-nums" style={{ color: N.neonText }}>{s.v}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: N.muted }}>{s.sub}</p>
                      </button>
                    ))}
                  </div>

                  {lastTattoo && healingDays < 15 && (
                    <button
                      type="button"
                      onClick={() => goTab('rdv')}
                      className="w-full rounded-2xl border p-4 text-left flex items-start gap-3 transition-all active:scale-[0.99]"
                      style={{ borderColor: 'rgba(223,255,0,0.2)', background: `linear-gradient(135deg, ${N.neonDim}, transparent)` }}
                    >
                      <Sparkles className="w-5 h-5 shrink-0 mt-0.5" style={{ color: N.neon }} />
                      <div>
                        <p className="text-sm font-bold" style={{ color: N.text }}>Cicatrisation en cours</p>
                        <p className="text-xs mt-0.5" style={{ color: N.muted }}>
                          J+{healingDays} · {lastTattoo.service} — conseils dans l’onglet RDV
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0 ml-auto" style={{ color: N.border }} />
                    </button>
                  )}

                  {nextRdv && (
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: N.muted }}>Prochain rendez-vous</h2>
                        <button type="button" onClick={() => goTab('rdv')} className="text-xs font-bold" style={{ color: N.neon }}>Voir tout</button>
                      </div>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.99 }}
                        onClick={() => goTab('rdv')}
                        className="w-full rounded-3xl border overflow-hidden text-left"
                        style={{ borderColor: N.borderMid, background: N.surface }}
                      >
                        <div className="h-1" style={{ background: `linear-gradient(90deg, ${N.neon}, rgba(223,255,0,0.3))` }} />
                        <div className="p-4">
                          <p className="text-base font-black mb-1" style={{ color: N.text }}>{nextRdv.service}</p>
                          <p className="text-xs flex items-center gap-1.5" style={{ color: N.muted }}>
                            <Clock className="w-3.5 h-3.5" />
                            {formatDateFr(nextRdv.date)}{nextRdv.time && ` · ${nextRdv.time}`}
                          </p>
                          {nextRdv.studio_name && (
                            <p className="text-sm mt-2 flex items-center gap-1.5" style={{ color: N.textSub }}>
                              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: N.neon }} />
                              {nextRdv.studio_name}
                            </p>
                          )}
                        </div>
                      </motion.button>
                    </section>
                  )}

                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: N.muted }}>Studios suivis</h2>
                      <button type="button" onClick={() => goTab('explore')} className="text-xs font-bold" style={{ color: N.neon }}>Explorer</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                      {displayStudios.slice(0, 8).map((s, i) => (
                        <motion.button key={s.id} type="button"
                          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setArtistSheet(s)}
                          className="flex-shrink-0 w-[min(13rem,72vw)] snap-start rounded-2xl border overflow-hidden text-left"
                          style={{ borderColor: N.border, background: N.elevated }}>
                          <div className="h-20 w-full relative"
                            style={{ background: `linear-gradient(135deg, ${s.grad[0]}, ${s.grad[1]})` }}>
                            {s.portfolioImages[0] && (
                              <img src={s.portfolioImages[0]} alt="" className="w-full h-full object-cover opacity-90" />
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-bold truncate" style={{ color: N.text }}>{s.name}</p>
                            <p className="text-[10px] truncate mt-0.5" style={{ color: N.muted }}>{s.distLabel}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </section>
                    </motion.div>
                  )}

                  {clientSpaceView === 'projects' && (
                    <motion.div
                      key="projects"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22 }}
                      className="space-y-6"
                    >
                  <section>
                    <h2 className="text-[13px] font-bold uppercase tracking-widest mb-3" style={{ color: N.muted }}>Projets en cours</h2>
                    {upcoming.length === 0 ? (
                      <div className="rounded-3xl border p-8 text-center" style={{ borderColor: N.border, background: N.surface }}>
                        <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-25" style={{ color: N.neon }} />
                        <p className="text-sm font-semibold mb-1" style={{ color: N.text }}>Aucun projet actif</p>
                        <p className="text-xs mb-4" style={{ color: N.muted }}>Réserve une séance pour lancer un projet tatouage.</p>
                        <button type="button" onClick={() => goTab('explore')}
                          className="text-xs font-bold px-4 py-2.5 rounded-xl border active:scale-[0.98] transition-all"
                          style={{ borderColor: N.border, color: N.neonText, background: N.neonDim }}>
                          Découvrir des studios
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcoming.map((a, i) => {
                          const d0 = Math.ceil((new Date(a.date).getTime() - Date.now()) / 86400000);
                          const jLabel = d0 > 0 ? `J−${d0}` : "Aujourd'hui";
                          return (
                            <motion.div key={a.id}
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                              className="rounded-3xl border overflow-hidden"
                              style={{ borderColor: N.borderMid, background: N.surface }}
                            >
                              <div className="px-4 py-3 flex items-start justify-between gap-2 border-b" style={{ borderColor: N.border }}>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg" style={{ background: N.neonDim, color: N.neonText }}>{jLabel}</span>
                                <span className="text-[11px]" style={{ color: N.muted }}>{formatDateFr(a.date)}</span>
                              </div>
                              <div className="p-4">
                                <h3 className="text-base font-black mb-1" style={{ color: N.text }}>{a.service}</h3>
                                {a.studio_name && (
                                  <p className="text-sm flex items-center gap-1.5 mb-3" style={{ color: N.textSub }}>
                                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: N.neon }} />
                                    {a.studio_name}
                                  </p>
                                )}
                                <div className="flex gap-2 flex-wrap">
                                  <button type="button" onClick={() => goTab('rdv')}
                                    className="text-xs font-bold px-3 py-2 rounded-xl border active:scale-[0.98] transition-all"
                                    style={{ borderColor: 'rgba(223,255,0,0.3)', color: N.neonText, background: N.neonDim }}>
                                    Détails RDV
                                  </button>
                                  <a href={mapsUrl(a.studio_address ?? '')} target="_blank" rel="noreferrer"
                                    className="text-xs font-semibold px-3 py-2 rounded-xl border inline-flex items-center gap-1"
                                    style={{ borderColor: N.border, color: N.textSub }}>
                                    Itinéraire <ArrowUpRight className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <section>
                    <h2 className="text-[13px] font-bold uppercase tracking-widest mb-3" style={{ color: N.muted }}>Projets terminés</h2>
                    {completed.length === 0 ? (
                      <p className="text-sm py-6 text-center rounded-2xl border" style={{ borderColor: N.border, color: N.muted, background: N.elevated }}>
                        Tes séances terminées apparaîtront ici.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {completed.map((a, i) => (
                          <motion.div key={a.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="rounded-2xl border px-4 py-3 flex items-center justify-between gap-3"
                            style={{ borderColor: N.border, background: N.elevated }}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate" style={{ color: N.text }}>{a.service}</p>
                              <p className="text-[11px] mt-0.5 truncate" style={{ color: N.muted }}>
                                {formatDateFr(a.date)}{a.studio_name ? ` · ${a.studio_name}` : ''}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold uppercase shrink-0 px-2 py-1 rounded-lg" style={{ background: 'rgba(94,219,154,0.12)', color: N.success }}>Fait</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </section>
                    </motion.div>
                  )}
                </AnimatePresence>

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

      {/* ── Bottom nav flottante neon ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <nav
          className="flex rounded-[2rem] border overflow-hidden w-full max-w-sm"
          style={{
            background: 'rgba(14,14,14,0.92)',
            backdropFilter: 'blur(24px)',
            borderColor: N.borderMid,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          {([
            { id: 'explore' as const, Icon: Map,         label: 'Explorer' },
            { id: 'rdv'     as const, Icon: CalendarDays, label: 'RDV'     },
            { id: 'wallet'  as const, Icon: Wallet,       label: 'Wallet'  },
            { id: 'profile' as const, Icon: User,         label: 'Client'  },
          ] as const).map(({ id, Icon, label }) => {
            const active = tab === id;
            return (
              <button key={id} type="button" onClick={() => goTab(id)}
                className="flex-1 flex flex-col items-center py-3.5 gap-1 relative transition-colors"
                style={{ color: active ? N.neon : N.muted }}
              >
                {active && (
                  <motion.div layoutId="nav-neon"
                    className="absolute inset-x-2 inset-y-1.5 rounded-2xl"
                    style={{ background: N.neonDim }}
                    transition={{ type: 'spring', stiffness: 420, damping: 35 }}
                  />
                )}
                <Icon className="w-5 h-5 relative z-10" strokeWidth={active ? 2.3 : 1.5} />
                <span className="text-[10px] font-semibold tracking-wide relative z-10">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
