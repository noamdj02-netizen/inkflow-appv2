/**
 * ReferralCard — Carte parrainage premium
 * Style : carte d'invitation exclusive, or mat sur charbon, glassmorphism.
 * Direction artistique Iara — sobre, luxueux, aucun effet kitsch.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Share2, Users } from 'lucide-react';
import { CX } from './clientExperienceTypes';

interface ReferralCardProps {
  referralCount: number;
  shareUrl: string;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({ referralCount, shareUrl }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // fallback pour iOS
      const el = document.createElement('textarea');
      el.value = shareUrl;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Inkflow — Mon code parrainage',
        text: "Rejoins Inkflow et bénéficie de 10\u20AC offerts dès ton premier tatouage via l'app !",
        url: shareUrl,
      }).catch(() => { /* user dismissed */ });
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className="rounded-3xl overflow-hidden border"
      style={{ borderColor: CX.borderMid, background: CX.surfaceEl }}
    >
      {/* Header doré */}
      <div
        className="px-5 pt-5 pb-4 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.04) 100%)` }}
      >
        {/* Cercles décoratifs */}
        <div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.06]"
          style={{ background: CX.accent }}
        />
        <div
          className="absolute right-8 -bottom-6 w-16 h-16 rounded-full opacity-[0.05]"
          style={{ background: CX.accent }}
        />

        <div className="flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4" style={{ color: CX.accent }} />
              <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: CX.accent }}>
                Parrainage
              </span>
            </div>
            <h3 className="text-lg font-black leading-tight" style={{ color: CX.text }}>
              Gagne 10€ par ami
            </h3>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: CX.muted }}>
              Pour chaque ami qui réserve son premier tatouage via ton lien.
            </p>
          </div>

          {/* Compteur */}
          {referralCount > 0 && (
            <div
              className="flex flex-col items-center px-3 py-2 rounded-2xl border shrink-0 ml-3"
              style={{ borderColor: CX.border, background: CX.surface }}
            >
              <span className="text-xl font-black tabular-nums" style={{ color: CX.accentText }}>
                {referralCount}
              </span>
              <span className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: CX.muted }}>
                amis
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lien */}
      <div className="px-5 pb-5 pt-3 space-y-3">
        <div
          className="flex items-center gap-2 px-3.5 py-3 rounded-2xl border"
          style={{ borderColor: CX.border, background: CX.surface }}
        >
          <span
            className="flex-1 text-xs font-mono truncate"
            style={{ color: CX.textSub }}
          >
            {shareUrl.replace(/^https?:\/\//, '')}
          </span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={handleCopy}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors"
            style={{
              background: copied ? 'rgba(94,219,154,0.15)' : CX.accentDim,
              color: copied ? CX.success : CX.accent,
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <Check className="w-4 h-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <Copy className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all"
          style={{
            background: `linear-gradient(135deg, rgba(201,169,110,0.18), rgba(201,169,110,0.10))`,
            border: `1px solid rgba(201,169,110,0.28)`,
            color: CX.accentText,
          }}
        >
          <Share2 className="w-4 h-4" />
          Partager mon invitation
        </motion.button>
      </div>
    </div>
  );
};
