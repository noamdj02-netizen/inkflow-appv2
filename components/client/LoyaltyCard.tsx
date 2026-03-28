/**
 * LoyaltyCard — Carte fidélité 3D flip style Apple Wallet
 *
 * Front : logo Inkflow, prénom, solde neon, niveau "Gold Member"
 * Back  : QR code (api.qrserver.com), last studio, 10 tampons de fidélité
 * Animation : Framer Motion rotateY + preserve-3d
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, RotateCw, Smartphone, CreditCard } from 'lucide-react';

const N = {
  bg:       '#0A0A0A',
  surface:  '#111111',
  border:   '#202020',
  text:     '#F5F3EF',
  muted:    '#555555',
  neon:     '#DFFF00',
  neonDim:  'rgba(223,255,0,0.10)',
  neonGlow: '0 0 30px rgba(223,255,0,0.18)',
} as const;

interface LoyaltyCardProps {
  firstName: string;
  code: string;
  cents: number;
  stampsCount?: number;
  lastStudio?: string;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({
  firstName,
  code,
  cents,
  stampsCount = 0,
  lastStudio,
}) => {
  const [flipped, setFlipped] = useState(false);

  const qrData = encodeURIComponent(`INK-${code}`);
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&bgcolor=111111&color=DFFF00&data=${qrData}&margin=12`;

  return (
    <div className="space-y-3">
      {/* Card 3D */}
      <div
        className="relative cursor-pointer"
        style={{ perspective: 1200, height: 210 }}
        onClick={() => setFlipped(f => !f)}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%' }}
        >
          {/* ── FRONT ── */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden border select-none"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'linear-gradient(145deg, #0E0E0E 0%, #141414 55%, #0A0A0A 100%)',
              borderColor: 'rgba(223,255,0,0.18)',
              boxShadow: `${N.neonGlow}, inset 0 1px 0 rgba(223,255,0,0.06)`,
            }}
          >
            {/* Glow déco */}
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-[0.08]"
              style={{ background: N.neon, filter: 'blur(38px)' }} />
            <div className="absolute -left-8 bottom-0 w-32 h-32 rounded-full opacity-[0.04]"
              style={{ background: N.neon, filter: 'blur(30px)' }} />

            <div className="relative px-6 pt-6 pb-5 h-full flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em]"
                    style={{ color: 'rgba(223,255,0,0.5)' }}>Ink<span style={{ color: N.neon }}>flow</span></p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5"
                    style={{ color: 'rgba(245,243,239,0.25)' }}>Carte Fidélité</p>
                </div>
                <Award className="w-6 h-6 opacity-25" style={{ color: N.neon }} />
              </div>

              {/* Balance */}
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-1"
                  style={{ color: 'rgba(245,243,239,0.25)' }}>Crédit disponible</p>
                <p className="text-[42px] font-black tracking-tight tabular-nums leading-none"
                  style={{ color: N.text }}>
                  {(cents / 100).toFixed(0)}
                  <span className="text-xl ml-1" style={{ color: 'rgba(245,243,239,0.35)' }}>€</span>
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t pt-4"
                style={{ borderColor: 'rgba(223,255,0,0.07)' }}>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em]"
                    style={{ color: 'rgba(245,243,239,0.2)' }}>Gold Member</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: 'rgba(245,243,239,0.6)' }}>{firstName}</p>
                </div>
                <span className="text-[11px] font-mono tracking-widest"
                  style={{ color: 'rgba(245,243,239,0.18)' }}>···· {code.slice(0, 4)}</span>
              </div>
            </div>
          </div>

          {/* ── BACK ── */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden border select-none"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(145deg, #0E0E0E 0%, #141414 55%, #0A0A0A 100%)',
              borderColor: 'rgba(223,255,0,0.18)',
              boxShadow: N.neonGlow,
            }}
          >
            <div className="relative px-6 py-5 h-full flex items-center gap-5">
              {/* QR Code */}
              <div className="rounded-2xl overflow-hidden shrink-0 border"
                style={{ borderColor: N.border, background: N.surface }}>
                <img
                  src={qrUrl}
                  alt={`QR Code ${code}`}
                  width={90}
                  height={90}
                  style={{ display: 'block' }}
                />
              </div>

              {/* Info droite */}
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <p className="text-[9px] uppercase tracking-widest mb-0.5"
                    style={{ color: 'rgba(245,243,239,0.25)' }}>Code client</p>
                  <p className="text-base font-black tracking-widest" style={{ color: N.neon }}>{code}</p>
                </div>

                {lastStudio && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-0.5"
                      style={{ color: 'rgba(245,243,239,0.25)' }}>Dernier studio</p>
                    <p className="text-xs font-semibold truncate" style={{ color: 'rgba(245,243,239,0.6)' }}>{lastStudio}</p>
                  </div>
                )}

                {/* Tampons fidélité */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest mb-1.5"
                    style={{ color: 'rgba(245,243,239,0.25)' }}>Séances ({stampsCount}/10)</p>
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border flex items-center justify-center"
                        style={{
                          borderColor: i < stampsCount ? N.neon : 'rgba(255,255,255,0.1)',
                          background: i < stampsCount ? N.neon : 'transparent',
                        }}
                      >
                        {i < stampsCount && (
                          <svg viewBox="0 0 8 8" width="8" height="8">
                            <path d="M1.5 4L3.5 6L6.5 2" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Flip hint */}
      <p className="text-center text-[11px] flex items-center justify-center gap-1.5"
        style={{ color: N.muted }}>
        <RotateCw className="w-3 h-3" />
        Toucher pour {flipped ? 'voir la carte' : 'voir le QR code'}
      </p>

      {/* Wallet buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all active:scale-[0.97]"
          style={{ borderColor: N.border, background: N.surface, color: N.text }}
          onClick={() => alert('Apple Wallet — bientôt disponible')}
        >
          <Smartphone className="w-3.5 h-3.5" style={{ color: N.neon }} />
          Apple Wallet
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all active:scale-[0.97]"
          style={{ borderColor: N.border, background: N.surface, color: N.text }}
          onClick={() => alert('Google Pay — bientôt disponible')}
        >
          <CreditCard className="w-3.5 h-3.5" style={{ color: N.neon }} />
          Google Pay
        </button>
      </div>
    </div>
  );
};
