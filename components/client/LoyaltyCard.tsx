/**
 * LoyaltyCard — Carte fidélité 3D flip style Apple Wallet
 * Design : bronze / ivoire (aligné espace client) — pas de bleu « SaaS »
 */

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Smartphone, CreditCard, X, Copy, Check, Loader2 } from 'lucide-react';
import {
  requestWalletPass,
  triggerApplePkpassInstall,
  openGoogleWalletSaveUrl,
  type WalletPassJsonOk,
} from '../../lib/walletNativePass';

const C = {
  accent:    '#C9A96E',
  accentDim: 'rgba(201,169,110,0.14)',
  accentGlow:'0 0 28px rgba(201,169,110,0.18)',
  text:      '#F7F4EF',
  textSub:   'rgba(247,244,239,0.58)',
  textMuted: 'rgba(247,244,239,0.28)',
  border:    'rgba(201,169,110,0.22)',
  surface:   '#16130F',
  hint:      '#9CA3AF',
  cardBg0:   '#12100C',
  cardBg1:   '#1C1812',
  ink:       '#14120E',
} as const;

type LoyaltyLevel = { label: string; color: string; next: number | null; nextLabel: string };

function getLoyaltyLevel(stamps: number, cents: number): LoyaltyLevel {
  const score = stamps * 10 + Math.floor(cents / 500);
  if (score >= 150) return { label: 'Platinum', color: '#E2E8F0', next: null, nextLabel: '' };
  if (score >= 60)  return { label: 'Gold',     color: '#FBBF24', next: 150, nextLabel: 'Platinum' };
  if (score >= 20)  return { label: 'Silver',   color: '#94A3B8', next: 60,  nextLabel: 'Gold' };
  return              { label: 'Bronze',   color: '#CD7F32', next: 20,  nextLabel: 'Silver' };
}

interface LoyaltyCardProps {
  firstName: string;
  code: string;
  cents: number;
  stampsCount?: number;
  lastStudio?: string;
  /** Jeton session Supabase — requis pour Apple / Google Wallet via Edge Function */
  accessToken?: string | null;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({
  firstName,
  code,
  cents,
  stampsCount = 0,
  lastStudio,
  accessToken,
}) => {
  const [flipped, setFlipped] = useState(false);
  const level = getLoyaltyLevel(stampsCount, cents);
  const [walletSheet, setWalletSheet] = useState<{
    platform: 'apple' | 'google';
    payload: WalletPassJsonOk;
  } | null>(null);
  const [walletLoading, setWalletLoading] = useState<'apple' | 'google' | null>(null);
  const [copyOk, setCopyOk] = useState(false);

  const handleWallet = useCallback(
    async (platform: 'apple' | 'google') => {
      if (!accessToken) {
        setWalletSheet({
          platform,
          payload: {
            ok: true,
            platform,
            configured: false,
            userMessage: 'Session expirée. Reconnecte-toi puis réessaie.',
            clientCode: code,
            balanceEuros: (cents / 100).toFixed(0),
          },
        });
        return;
      }

      setWalletLoading(platform);
      try {
        const result = await requestWalletPass(accessToken, platform);
        if (result.success && result.kind === 'pkpass') {
          triggerApplePkpassInstall(result.blob);
          setWalletSheet(null);
          return;
        }
        if (result.success && result.kind === 'json') {
          const d = result.data;
          if (d.configured && platform === 'google' && d.googleWalletSaveUrl) {
            openGoogleWalletSaveUrl(d.googleWalletSaveUrl);
            setWalletSheet(null);
            return;
          }
          setWalletSheet({ platform, payload: d });
          return;
        }
        setWalletSheet({
          platform,
          payload: {
            ok: true,
            platform,
            configured: false,
            userMessage: result.success ? 'Réponse inattendue.' : (result as { success: false; error: string }).error,
            clientCode: code,
            balanceEuros: (cents / 100).toFixed(0),
          },
        });
      } finally {
        setWalletLoading(null);
      }
    },
    [accessToken, code, cents]
  );

  const copyCode = useCallback(
    (value?: string) => {
      const v = value ?? code;
      void navigator.clipboard.writeText(v).then(() => {
        setCopyOk(true);
        window.setTimeout(() => setCopyOk(false), 2000);
      });
    },
    [code]
  );

  const qrData = encodeURIComponent(`INK-${code}`);
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=C9A96E&bgcolor=16130F&data=${qrData}&margin=10`;

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
            className="absolute inset-0 rounded-3xl overflow-hidden select-none"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: `linear-gradient(145deg, ${C.cardBg0} 0%, ${C.cardBg1} 50%, ${C.cardBg0} 100%)`,
              border: `1px solid ${C.border}`,
              boxShadow: `${C.accentGlow}, 0 8px 32px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Glow orbs */}
            <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full"
              style={{ background: 'rgba(201,169,110,0.1)', filter: 'blur(40px)' }} />
            <div className="absolute -left-6 bottom-0 w-32 h-32 rounded-full"
              style={{ background: 'rgba(201,169,110,0.05)', filter: 'blur(30px)' }} />
            {/* Stripe déco */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.45), transparent)' }} />

            <div className="relative px-6 pt-5 pb-5 h-full flex flex-col justify-between">
              {/* Header : logo + label */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/logo-inkflow.png"
                    alt="Inkflow"
                    width={32}
                    height={32}
                    className="rounded-xl"
                    style={{ objectFit: 'contain' }}
                  />
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: C.textMuted }}>
                      Carte Fidélité
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(255,255,255,0.08)', color: level.color, border: `1px solid ${level.color}40` }}>
                  {level.label}
                </div>
              </div>

              {/* Balance */}
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: C.textMuted }}>
                  Crédit disponible
                </p>
                <p className="font-black tracking-tight tabular-nums leading-none" style={{ color: C.text, fontSize: 40 }}>
                  {(cents / 100).toFixed(0)}
                  <span className="text-lg ml-1" style={{ color: C.textSub }}>€</span>
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3"
                style={{ borderTop: '1px solid rgba(201,169,110,0.1)' }}>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.18em] mb-0.5" style={{ color: C.textMuted }}>
                    Membre
                  </p>
                  <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>{firstName}</p>
                </div>
                <span className="text-[11px] font-mono tracking-widest" style={{ color: C.textMuted }}>
                  ···· {code.slice(0, 4)}
                </span>
              </div>
            </div>
          </div>

          {/* ── BACK ── */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden select-none"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: `linear-gradient(145deg, ${C.cardBg0} 0%, ${C.cardBg1} 50%, ${C.cardBg0} 100%)`,
              border: `1px solid ${C.border}`,
              boxShadow: `${C.accentGlow}, 0 8px 32px rgba(0,0,0,0.5)`,
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.45), transparent)' }} />

            <div className="relative px-5 py-5 h-full flex items-center gap-4">
              {/* QR */}
              <div className="rounded-2xl overflow-hidden shrink-0 border p-1"
                style={{ borderColor: C.border, background: C.surface }}>
                <img src={qrUrl} alt={`QR ${code}`} width={88} height={88} style={{ display: 'block', borderRadius: 10 }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-2.5">
                <div>
                  <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: C.textMuted }}>Code client</p>
                  <p className="text-base font-black tracking-widest" style={{ color: C.accent }}>{code}</p>
                </div>

                {lastStudio && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: C.textMuted }}>Dernier studio</p>
                    <p className="text-xs font-semibold truncate" style={{ color: C.textSub }}>{lastStudio}</p>
                  </div>
                )}

                <div>
                  <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: C.textMuted }}>
                    Séances ({stampsCount}/10)
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i}
                        className="w-4.5 h-4.5 rounded-full border flex items-center justify-center"
                        style={{
                          width: 18, height: 18,
                          borderColor: i < stampsCount ? C.accent : 'rgba(255,255,255,0.1)',
                          background: i < stampsCount ? C.accent : 'transparent',
                        }}>
                        {i < stampsCount && (
                          <svg viewBox="0 0 8 8" width="8" height="8">
                            <path d="M1.5 4L3.5 6L6.5 2" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
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
        style={{ color: C.hint }}>
        <RotateCw className="w-3 h-3" />
        Toucher pour {flipped ? 'voir la carte' : 'voir le QR code'}
      </p>

      {/* Wallet buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Apple Wallet', Icon: Smartphone, platform: 'apple' as const },
          { label: 'Google Wallet', Icon: CreditCard, platform: 'google' as const },
        ].map(({ label, Icon, platform }) => (
          <button key={label} type="button"
            disabled={walletLoading !== null}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-60"
            style={{
              borderColor: 'rgba(107,83,69,0.35)',
              background: 'rgba(107,83,69,0.1)',
              color: '#2D241C',
            }}
            onClick={() => handleWallet(platform)}>
            {walletLoading === platform ? (
              <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" style={{ color: '#6B5345' }} />
            ) : (
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: '#6B5345' }} />
            )}
            <span className="truncate">{walletLoading === platform ? '…' : label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {walletSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(18,16,12,0.55)' }}
            onClick={() => setWalletSheet(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden"
              style={{
                background: '#FAFAF8',
                borderColor: 'rgba(107,83,69,0.18)',
                color: '#1a1510',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6B5345' }}>
                    {walletSheet.platform === 'apple' ? 'Apple Wallet' : 'Google Wallet'}
                  </p>
                  <h3 className="text-lg font-black leading-tight">
                    {walletSheet.payload.configured ? 'Presque fini' : 'Carte Wallet'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setWalletSheet(null)}
                  className="p-2 rounded-xl border transition-all active:scale-95"
                  style={{ borderColor: 'rgba(0,0,0,0.08)', background: '#f8fafc' }}
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 py-4 space-y-4 max-h-[min(70vh,420px)] overflow-y-auto">
                <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>
                  {walletSheet.payload.userMessage}
                </p>
                {walletSheet.payload.clientCode ? (
                  <div className="rounded-2xl border p-4 flex items-center justify-between gap-3" style={{ borderColor: 'rgba(107,83,69,0.22)', background: 'rgba(201,169,110,0.08)' }}>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>Code client</p>
                      <p className="text-lg font-black font-mono tracking-widest truncate">{walletSheet.payload.clientCode}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyCode(walletSheet.payload.clientCode)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95"
                      style={{ borderColor: 'rgba(107,83,69,0.35)', background: '#fff', color: '#5C4A3A' }}
                    >
                      {copyOk ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copyOk ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                ) : null}
                <p className="text-[11px] leading-snug" style={{ color: '#94a3b8' }}>
                  Astuce : retourne la carte ci-dessus pour afficher le QR — les studios peuvent le scanner pour retrouver ton compte.
                </p>
              </div>
              <div className="px-5 pb-5 pt-2">
                <button
                  type="button"
                  onClick={() => setWalletSheet(null)}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]"
                  style={{ background: '#6B5345', color: '#FAFAF8' }}
                >
                  Compris
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
