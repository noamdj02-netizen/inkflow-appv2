import React, { useState } from 'react';
import { Gift, Share2, CheckCircle, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import { CX } from './clientExperienceTypes';

interface ReferralCardProps {
  referralCount: number;
  shareUrl: string;
}

/** Parrainage — lien de partage + compteur (Jade & Aurélie style) */
export const ReferralCard: React.FC<ReferralCardProps> = ({ referralCount, shareUrl }) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Lien copié');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copie impossible');
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Inkflow', text: 'Réserve ton tatouage avec mon lien', url: shareUrl });
      } catch {
        copy();
      }
    } else {
      copy();
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      className="rounded-2xl border p-5"
      style={{
        background: CX.surface,
        borderColor: CX.border,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-5 h-5" style={{ color: CX.accent }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: CX.accent }}>
          Parrainer un ami
        </span>
      </div>
      <p className="text-base font-semibold mb-1" style={{ color: CX.text }}>
        Gagnez <span style={{ color: CX.accent }}>10€</span> pour chaque ami qui réserve
      </p>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: CX.muted }}>
        Ton ami utilise ton lien : vous cumulez des avantages chez les studios Inkflow.
      </p>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div
          className="flex-1 rounded-2xl px-3 py-2.5 border text-xs font-mono truncate"
          style={{ background: CX.bg, borderColor: CX.border, color: CX.muted }}
        >
          {shareUrl}
        </div>
        <button
          type="button"
          onClick={copy}
          className="w-11 h-11 rounded-2xl flex items-center justify-center border transition-all active:scale-[0.96]"
          style={{ borderColor: CX.border, background: CX.surfaceGlass }}
        >
          {copied ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" style={{ color: CX.accent }} />}
        </button>
        <button
          type="button"
          onClick={share}
          className="w-11 h-11 rounded-2xl flex items-center justify-center border transition-all active:scale-[0.96]"
          style={{ borderColor: CX.border, background: CX.surfaceGlass }}
        >
          <Share2 className="w-5 h-5" style={{ color: CX.accent }} />
        </button>
      </div>
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: CX.border }}>
        <span className="text-xs" style={{ color: CX.muted }}>
          Parrainages réussis
        </span>
        <span className="text-lg font-black tabular-nums" style={{ color: CX.accent }}>
          {referralCount}
        </span>
      </div>
    </motion.div>
  );
};
