/**
 * Inkflow — /client/dashboard
 * Design : App booking premium — Figma/Framer quality
 * Référence : Airbnb × Treatwell × Tattoo Maps
 * Mobile-first, dark premium, glassmorphism, bottom nav
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  loadClientDiscoveryStudios,
  type NearbyStudio,
  type FlashPreview,
} from '../../lib/supabaseGeo';

// ─── Design tokens ────────────────────────────────────────────────────────────
const D = {
  bg:        '#080808',
  surface:   '#141414',
  card:      '#1C1C1E',
  cardHover: '#242426',
  border:    'rgba(255,255,255,0.07)',
  borderMid: 'rgba(255,255,255,0.12)',
  gold:      '#C9A96E',
  goldDim:   'rgba(201,169,110,0.15)',
  goldGlow:  'rgba(201,169,110,0.08)',
  text:      '#FFFFFF',
  textSub:   '#A1A1AA',
  muted:     '#52525B',
  green:     '#22C55E',
  red:       '#EF4444',
  blur:      'blur(20px)',
  r:         { sm: 12, md: 16, lg: 20, xl: 28, full: 9999 },
  shadow:    '0 4px 24px rgba(0,0,0,0.5)',
  shadowLg:  '0 16px 48px rgba(0,0,0,0.7)',
} as const;

// ─── Style filter tabs ────────────────────────────────────────────────────────
const STYLE_TABS = ['Tous', 'Flash', 'Fine line', 'Blackwork', 'Réalisme', 'Japonais', 'Géométrique'] as const;

// ─── Utils ───────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}
function distLabel(km: number | null) {
  if (km == null) return null;
  return km < 1 ? '< 1 km' : `${Math.round(km)} km`;
}
function ratingLabel(n: number) {
  return n.toFixed(1);
}

// ─── Palette artiste (placeholder quand pas de photo) ────────────────────────
const PALETTES = [
  { bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', dot: '#6366F1' },
  { bg: 'linear-gradient(135deg,#0d1f0d,#1a3a1a)', dot: '#22C55E' },
  { bg: 'linear-gradient(135deg,#1f0d0d,#3a1a1a)', dot: '#EF4444' },
  { bg: 'linear-gradient(135deg,#1f180d,#3a2e1a)', dot: '#F59E0B' },
  { bg: 'linear-gradient(135deg,#1a0d1f,#2e1a3a)', dot: '#A855F7' },
  { bg: 'linear-gradient(135deg,#0d1a1f,#1a2e3a)', dot: '#0EA5E9' },
] as const;

// ─── Fake map dots (MVP — remplacer par Leaflet/Mapbox quand dispo) ───────────
function MapHero({ studios, onDotClick }: { studios: NearbyStudio[]; onDotClick: (s: NearbyStudio) => void }) {
  const dots = studios.slice(0, 12);
  return (
    <div style={{
      position: 'relative',
      height: 220,
      background: '#0E1117',
      overflow: 'hidden',
      borderRadius: D.r.xl,
      border: `1px solid ${D.border}`,
    }}>
      {/* Grid map texture */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.12 }}>
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#ffffff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Rues stylisées */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
        <path d="M0,110 Q120,90 240,115 T480,105" stroke="#3A3A4A" strokeWidth="8" fill="none" />
        <path d="M0,60 Q100,55 200,65 T380,58" stroke="#3A3A4A" strokeWidth="5" fill="none" />
        <path d="M120,0 Q115,60 125,140 T118,220" stroke="#3A3A4A" strokeWidth="6" fill="none" />
        <path d="M260,0 Q255,70 265,140 T258,220" stroke="#3A3A4A" strokeWidth="4" fill="none" />
        <path d="M0,170 Q160,160 320,175 T480,168" stroke="#3A3A4A" strokeWidth="4" fill="none" />
      </svg>

      {/* Studio dots */}
      {dots.map((s, i) => {
        const x = 15 + (i * 67) % 72;
        const y = 18 + (i * 43 + 17) % 64;
        const pal = PALETTES[i % PALETTES.length];
        return (
          <button
            key={s.id}
            onClick={() => onDotClick(s)}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <div style={{
              width: 36, height: 36,
              borderRadius: D.r.full,
              border: `2px solid ${pal.dot}`,
              background: D.card,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 12px ${pal.dot}44`,
              fontSize: 12, fontWeight: 700, color: D.text,
            }}>
              {initials(s.studio_name).slice(0, 1)}
            </div>
            {/* Pulse */}
            <div style={{
              position: 'absolute', inset: -4,
              borderRadius: D.r.full,
              border: `1px solid ${pal.dot}44`,
              animation: 'none',
              pointerEvents: 'none',
            }} />
          </button>
        );
      })}

      {/* "Carte interactive" badge */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        background: 'rgba(8,8,8,0.85)',
        backdropFilter: D.blur,
        border: `1px solid ${D.border}`,
        borderRadius: D.r.full,
        padding: '6px 14px',
        fontSize: 11, fontWeight: 600, color: D.gold,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={D.gold} strokeWidth="2" strokeLinecap="round">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
        {studios.length} studios proches
      </div>

      {/* Top gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(8,8,8,0.4) 0%, transparent 40%, rgba(8,8,8,0.2) 100%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── Artist horizontal card ───────────────────────────────────────────────────
function ArtistPill({ studio, index, onClick }: { studio: NearbyStudio; index: number; onClick: () => void; key?: React.Key }) {
  const pal = PALETTES[index % PALETTES.length];
  const [broken, setBroken] = useState(false);
  const dist = distLabel(studio.distance_km);

  return (
    <button onClick={onClick} style={{
      flexShrink: 0,
      width: 140,
      background: D.card,
      border: `1px solid ${D.border}`,
      borderRadius: D.r.lg,
      overflow: 'hidden',
      cursor: 'pointer',
      textAlign: 'left',
      padding: 0,
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = D.shadow; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Avatar zone */}
      <div style={{
        height: 100, position: 'relative',
        background: pal.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {studio.avatar_url && !broken ? (
          <img
            src={studio.avatar_url}
            alt={studio.studio_name}
            onError={() => setBroken(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: D.r.full,
            background: `${pal.dot}22`, border: `1.5px solid ${pal.dot}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: pal.dot,
          }}>
            {initials(studio.studio_name)}
          </div>
        )}
        {/* Online dot */}
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          width: 9, height: 9, borderRadius: D.r.full,
          background: D.green, border: `2px solid ${D.card}`,
        }} />
      </div>
      {/* Body */}
      <div style={{ padding: '10px 11px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: D.text, letterSpacing: '-0.02em', marginBottom: 3, lineHeight: 1.2 }}>
          {studio.studio_name.length > 14 ? studio.studio_name.slice(0, 13) + '…' : studio.studio_name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <span style={{ fontSize: 10, color: D.muted }}>
            {[studio.city, dist].filter(Boolean).join(' · ')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: D.gold }}>★</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: D.textSub }}>4.9</span>
          <span style={{ fontSize: 10, color: D.muted }}>(87)</span>
        </div>
      </div>
    </button>
  );
}

// ─── Flash card vertical ──────────────────────────────────────────────────────
function FlashCard({
  flash, studioIdx, studioCity, onClick,
}: {
  flash: FlashPreview; studioIdx: number; studioCity: string | null; onClick: () => void; key?: React.Key;
}) {
  const pal = PALETTES[studioIdx % PALETTES.length];
  const [broken, setBroken] = useState(false);
  const hasImg = flash.imageUrl && !broken;
  const deposit = Math.round(flash.price * 0.2);

  return (
    <button
      onClick={onClick}
      style={{
        background: D.card,
        border: `1px solid ${D.border}`,
        borderRadius: D.r.lg,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        padding: 0,
        width: '100%',
        transition: 'border-color 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${D.gold}55`)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = D.border)}
    >
      {/* Image */}
      <div style={{
        height: 160, position: 'relative',
        background: pal.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {hasImg ? (
          <img src={flash.imageUrl} alt={flash.title}
            onError={() => setBroken(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <path d="M28 6L33 21H48L36 29L40 44L28 36L16 44L20 29L8 21H23Z"
              stroke={pal.dot} strokeWidth="1.5" fill="none" opacity="0.6" />
            <circle cx="28" cy="28" r="6" fill={pal.dot} opacity="0.12" />
          </svg>
        )}
        {/* FLASH badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: D.bg,
          border: `1px solid ${D.gold}`,
          borderRadius: D.r.full,
          padding: '4px 10px',
          fontSize: 9, fontWeight: 800, color: D.gold, letterSpacing: '0.08em',
        }}>
          FLASH
        </div>
        {/* Price badge */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(8,8,8,0.85)',
          backdropFilter: D.blur,
          borderRadius: D.r.full,
          padding: '5px 12px',
          fontSize: 13, fontWeight: 800, color: D.text,
        }}>
          {flash.price}€
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: D.text, letterSpacing: '-0.02em', marginBottom: 4 }}>
            {flash.title}
          </div>
          <div style={{ fontSize: 11, color: D.muted }}>
            {[flash.studioName, flash.style, studioCity].filter(Boolean).join(' · ')}
          </div>
        </div>

        {/* Acompte */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: D.goldGlow,
          border: `1px solid ${D.goldDim}`,
          borderRadius: D.r.sm,
          padding: '9px 12px',
        }}>
          <div>
            <div style={{ fontSize: 10, color: D.gold, fontWeight: 600, marginBottom: 2 }}>Acompte</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: D.gold }}>{deposit}€</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: D.muted, marginBottom: 2 }}>Reste en studio</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: D.textSub }}>{flash.price - deposit}€</div>
          </div>
        </div>

        {/* CTA */}
        <div style={{
          width: '100%',
          background: D.gold,
          borderRadius: D.r.md,
          padding: '11px 0',
          textAlign: 'center',
          fontSize: 13, fontWeight: 700, color: '#0A0A0A',
          letterSpacing: '-0.01em',
        }}>
          Réserver ce flash
        </div>
      </div>
    </button>
  );
}

// ─── Flash detail sheet ───────────────────────────────────────────────────────
function FlashSheet({
  flash, studioIdx, studio, onClose,
}: {
  flash: FlashPreview; studioIdx: number; studio: NearbyStudio | null; onClose: () => void;
}) {
  const pal = PALETTES[studioIdx % PALETTES.length];
  const [broken, setBroken] = useState(false);
  const [slot, setSlot] = useState(1);
  const deposit = Math.round(flash.price * 0.2);
  const today = new Date();
  const slots = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i + 1);
    return {
      day: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][d.getDay()],
      num: d.getDate(),
      full: i === 0,
    };
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 300,
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: D.surface,
        borderRadius: '28px 28px 0 0',
        border: `1px solid ${D.border}`,
        borderBottom: 'none',
        zIndex: 301,
        maxHeight: '92dvh',
        overflowY: 'auto',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom,0px))',
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: D.muted, margin: '14px auto 0', opacity: 0.5 }} />

        {/* Hero */}
        <div style={{
          height: 220, margin: '16px 16px 0',
          borderRadius: D.r.lg, overflow: 'hidden',
          background: pal.bg, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {flash.imageUrl && !broken ? (
            <img src={flash.imageUrl} alt={flash.title}
              onError={() => setBroken(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <svg width="72" height="72" viewBox="0 0 56 56" fill="none">
              <path d="M28 6L33 21H48L36 29L40 44L28 36L16 44L20 29L8 21H23Z"
                stroke={pal.dot} strokeWidth="1.5" fill="none" opacity="0.5" />
            </svg>
          )}
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, left: 12,
            width: 36, height: 36, borderRadius: D.r.full,
            background: 'rgba(8,8,8,0.8)', backdropFilter: D.blur,
            border: `1px solid ${D.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={D.text} strokeWidth="2" strokeLinecap="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            background: D.bg, border: `1px solid ${D.gold}`,
            borderRadius: D.r.full, padding: '4px 12px',
            fontSize: 9, fontWeight: 800, color: D.gold, letterSpacing: '0.08em',
          }}>
            FLASH DISPO
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          {/* Title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: D.text, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              {flash.title}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: D.text, letterSpacing: '-0.04em', flexShrink: 0 }}>
              {flash.price}€
            </div>
          </div>
          <div style={{ fontSize: 12, color: D.muted, marginBottom: 20 }}>
            {[flash.style, studio?.city].filter(Boolean).join(' · ')}
          </div>

          {/* Artist block */}
          {studio && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: D.card, border: `1px solid ${D.border}`,
              borderRadius: D.r.md, padding: '13px 14px', marginBottom: 20,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: D.r.full,
                background: pal.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 800, color: pal.dot, flexShrink: 0,
              }}>
                {initials(studio.studio_name)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: D.text }}>{studio.studio_name}</div>
                <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>
                  {studio.city ?? ''} · <span style={{ color: D.gold }}>★</span> 4.9
                </div>
              </div>
              <div style={{
                marginLeft: 'auto',
                fontSize: 11, fontWeight: 600, color: D.gold,
                background: D.goldDim, border: `1px solid ${D.goldDim}`,
                borderRadius: D.r.full, padding: '6px 14px', flexShrink: 0, cursor: 'pointer',
              }}>
                Voir profil
              </div>
            </div>
          )}

          {/* Dispo */}
          <div style={{ fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Prochaines disponibilités
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {slots.map((s, i) => {
              const sel = slot === i;
              return (
                <button key={i} onClick={() => !s.full && setSlot(i)} style={{
                  flex: 1, borderRadius: D.r.md, padding: '12px 0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  cursor: s.full ? 'not-allowed' : 'pointer', border: 'none',
                  background: sel ? D.gold : s.full ? D.surface : D.card,
                  border: `1.5px solid ${sel ? D.gold : s.full ? D.border : D.border}` as any,
                  opacity: s.full ? 0.4 : 1, transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: sel ? '#0A0A0A' : D.muted }}>{s.day}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: sel ? '#0A0A0A' : s.full ? D.muted : D.text, letterSpacing: '-0.03em' }}>{s.num}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: sel ? '#0A0A0A99' : D.muted }}>{s.full ? 'Complet' : 'Dispo'}</div>
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <div style={{
            width: '100%',
            background: D.gold,
            borderRadius: D.r.lg,
            padding: '16px 0',
            textAlign: 'center',
            fontSize: 16, fontWeight: 800,
            color: '#0A0A0A',
            cursor: 'pointer',
            letterSpacing: '-0.02em',
            boxShadow: `0 8px 32px ${D.gold}44`,
            marginBottom: 12,
          }}>
            Réserver · Acompte {deposit}€
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: D.muted }}>
            Reste {flash.price - deposit}€ à régler en studio
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Skeleton cards ───────────────────────────────────────────────────────────
function SkeletonPill() {
  return (
    <div style={{ flexShrink: 0, width: 140, height: 166, background: D.card, borderRadius: D.r.lg, border: `1px solid ${D.border}` }}>
      <div style={{ height: 100, background: '#1E1E20' }} />
      <div style={{ padding: 10 }}>
        <div style={{ height: 12, width: '70%', background: '#1E1E20', borderRadius: 6, marginBottom: 6 }} />
        <div style={{ height: 10, width: '50%', background: '#1E1E20', borderRadius: 5 }} />
      </div>
    </div>
  );
}
function SkeletonFlash() {
  return (
    <div style={{ background: D.card, borderRadius: D.r.lg, overflow: 'hidden', border: `1px solid ${D.border}` }}>
      <div style={{ height: 160, background: '#1E1E20' }} />
      <div style={{ padding: 14 }}>
        <div style={{ height: 15, width: '60%', background: '#1E1E20', borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 11, width: '40%', background: '#1E1E20', borderRadius: 5, marginBottom: 14 }} />
        <div style={{ height: 46, background: '#1E1E20', borderRadius: D.r.sm, marginBottom: 10 }} />
        <div style={{ height: 40, background: '#1E1E20', borderRadius: D.r.md }} />
      </div>
    </div>
  );
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────
type Tab = 'home' | 'explore' | 'map' | 'rdv' | 'profile';

const NAV_ITEMS: { id: Tab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: 'home', label: 'Accueil',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? D.gold : 'none'} stroke={a ? D.gold : D.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'explore', label: 'Explorer',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? D.gold : D.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    id: 'map', label: 'Carte',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? D.gold : D.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    id: 'rdv', label: 'Mes RDV',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? D.gold : D.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'profile', label: 'Profil',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? D.gold : D.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(10,10,10,0.92)',
      backdropFilter: D.blur,
      borderTop: `1px solid ${D.border}`,
      display: 'flex',
      paddingTop: 10,
      paddingBottom: 'calc(10px + env(safe-area-inset-bottom,0px))',
      zIndex: 100,
    }}>
      {NAV_ITEMS.map(({ id, label, icon }) => (
        <button key={id} onClick={() => onChange(id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', minHeight: 44,
          transition: 'opacity 0.15s',
        }}>
          {icon(active === id)}
          <span style={{ fontSize: 10, fontWeight: 600, color: active === id ? D.gold : D.muted, letterSpacing: '-0.01em' }}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export function ClientDashboard() {
  const [tab, setTab]             = useState<Tab>('home');
  const [userName, setUserName]   = useState('');
  const [userInit, setUserInit]   = useState('');
  const [studios, setStudios]     = useState<NearbyStudio[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeFilter, setFilter] = useState<string>('Tous');
  const [selectedFlash, setFlash] = useState<{ flash: FlashPreview; studioIdx: number; studio: NearbyStudio | null } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || '';
      setUserName(name);
      setUserInit(initials(name) || u.email?.[0]?.toUpperCase() || '?');
    });
  }, []);

  // Studios
  useEffect(() => {
    let cancelled = false;
    const load = (lat?: number, lng?: number) =>
      loadClientDiscoveryStudios(lat, lng, 120, 40)
        .then((d) => { if (!cancelled) { setStudios(d); setLoading(false); } })
        .catch(() => { if (!cancelled) setLoading(false); });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => load(p.coords.latitude, p.coords.longitude),
        () => load(),
        { timeout: 5000 },
      );
    } else { load(); }
    return () => { cancelled = true; };
  }, []);

  // Flashes filtrés
  const allFlashes = studios.flatMap((s, si) =>
    (s.flash ?? []).map((f) => ({ flash: f, studioIdx: si, studio: s }))
  );
  const filtered = activeFilter === 'Tous' ? allFlashes
    : allFlashes.filter((x) =>
        activeFilter === 'Flash' ? true
        : x.flash.style?.toLowerCase().includes(activeFilter.toLowerCase())
      );

  const openFlash = useCallback((flash: FlashPreview, studioIdx: number, studio: NearbyStudio | null) => {
    setFlash({ flash, studioIdx, studio });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const firstName = userName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bonsoir' : 'Bonsoir';

  return (
    <div style={{
      background: D.bg,
      minHeight: '100dvh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* ── Scroll container ── */}
      <div
        ref={scrollRef}
        style={{ overflowY: 'auto', height: '100dvh', paddingBottom: 80 }}
      >
        {/* ── HEADER ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(8,8,8,0.88)',
          backdropFilter: D.blur,
          borderBottom: `1px solid ${D.border}`,
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Greeting */}
          <div>
            <div style={{ fontSize: 11, color: D.muted, fontWeight: 500 }}>
              {greeting}{firstName ? `, ${firstName}` : ''} 👋
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: D.text, letterSpacing: '-0.04em', lineHeight: 1 }}>
              ink<span style={{ color: D.gold }}>flow</span>
            </div>
          </div>

          {/* Search pill + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: D.card, border: `1px solid ${D.border}`,
              borderRadius: D.r.full, padding: '9px 16px',
              cursor: 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <span style={{ fontSize: 13, color: D.muted, fontWeight: 500 }}>Styles, artistes…</span>
            </div>

            {/* Notif */}
            <div style={{
              width: 38, height: 38, borderRadius: D.r.full,
              background: D.card, border: `1px solid ${D.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', flexShrink: 0, cursor: 'pointer',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.textSub} strokeWidth="1.8" strokeLinecap="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <div style={{
                position: 'absolute', top: 9, right: 9,
                width: 7, height: 7, borderRadius: D.r.full,
                background: D.red, border: `1.5px solid ${D.bg}`,
              }} />
            </div>

            {/* Avatar */}
            {userInit && (
              <div style={{
                width: 38, height: 38, borderRadius: D.r.full,
                background: D.gold, color: '#0A0A0A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, flexShrink: 0, cursor: 'pointer',
              }}>
                {userInit}
              </div>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ padding: '20px 20px 0' }}>

          {/* MAP HERO */}
          {loading ? (
            <div style={{ height: 220, background: D.card, borderRadius: D.r.xl, border: `1px solid ${D.border}`, marginBottom: 24 }} />
          ) : (
            <div style={{ marginBottom: 24 }}>
              <MapHero
                studios={studios}
                onDotClick={(s) => {
                  const flash = s.flash?.[0];
                  if (flash) openFlash(flash, studios.indexOf(s), s);
                }}
              />
            </div>
          )}

          {/* ARTISTES PROCHES */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: D.text, letterSpacing: '-0.03em' }}>
                Artistes proches
              </div>
              <span style={{ fontSize: 12, color: D.gold, fontWeight: 600, cursor: 'pointer' }}>Voir tout</span>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
              {loading
                ? Array.from({ length: 4 }, (_, i) => <SkeletonPill key={i} />)
                : studios.length > 0
                  ? studios.slice(0, 8).map((s, i) => (
                      <ArtistPill
                        key={s.id}
                        studio={s}
                        index={i}
                        onClick={() => {
                          const f = s.flash?.[0];
                          if (f) openFlash(f, i, s);
                        }}
                      />
                    ))
                  : (
                    <div style={{ padding: '20px 0', color: D.muted, fontSize: 13 }}>
                      Aucun studio trouvé près de toi
                    </div>
                  )
              }
            </div>
          </div>

          {/* FILTER CHIPS */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 20, paddingBottom: 2 }}>
            {STYLE_TABS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flexShrink: 0,
                  padding: '8px 16px', borderRadius: D.r.full,
                  fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
                  border: 'none', cursor: 'pointer',
                  background: activeFilter === f ? D.gold : D.card,
                  color: activeFilter === f ? '#0A0A0A' : D.muted,
                  boxShadow: activeFilter === f ? `0 4px 16px ${D.gold}44` : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* FLASH SECTION */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: D.text, letterSpacing: '-0.03em' }}>
                  À explorer
                </div>
                <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>
                  {loading ? '…' : `${filtered.length} flash disponible${filtered.length !== 1 ? 's' : ''}`}
                </div>
              </div>
              <span style={{ fontSize: 12, color: D.gold, fontWeight: 600, cursor: 'pointer' }}>Filtres</span>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                {Array.from({ length: 4 }, (_, i) => <SkeletonFlash key={i} />)}
              </div>
            ) : filtered.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                {filtered.slice(0, 12).map(({ flash, studioIdx, studio: s }) => (
                  <FlashCard
                    key={flash.id}
                    flash={flash}
                    studioIdx={studioIdx}
                    studioCity={s.city}
                    onClick={() => openFlash(flash, studioIdx, s)}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                padding: '56px 24px', textAlign: 'center',
                color: D.muted, fontSize: 14,
                background: D.card, borderRadius: D.r.lg,
                border: `1px solid ${D.border}`,
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎨</div>
                Aucun flash pour ce style
                <br />
                <button
                  onClick={() => setFilter('Tous')}
                  style={{
                    marginTop: 12, fontSize: 12, color: D.gold,
                    background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Voir tout
                </button>
              </div>
            )}
          </div>

          {/* BLOC "Tu es tatoueur ?" */}
          <div style={{
            background: `linear-gradient(135deg, ${D.goldGlow}, transparent)`,
            border: `1px solid ${D.goldDim}`,
            borderRadius: D.r.xl,
            padding: '20px 20px',
            marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: D.text, letterSpacing: '-0.03em', marginBottom: 4 }}>
                Tu es tatoueur ?
              </div>
              <div style={{ fontSize: 12, color: D.muted, lineHeight: 1.4 }}>
                Crée ta vitrine gratuite et reçois des réservations en ligne.
              </div>
            </div>
            <a href="/signup" style={{
              flexShrink: 0,
              padding: '10px 18px',
              background: D.gold, borderRadius: D.r.md,
              fontSize: 12, fontWeight: 800, color: '#0A0A0A',
              textDecoration: 'none', letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}>
              Rejoindre →
            </a>
          </div>

        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <BottomNav active={tab} onChange={setTab} />

      {/* ── FLASH SHEET ── */}
      {selectedFlash && (
        <FlashSheet
          flash={selectedFlash.flash}
          studioIdx={selectedFlash.studioIdx}
          studio={selectedFlash.studio}
          onClose={() => setFlash(null)}
        />
      )}
    </div>
  );
}
