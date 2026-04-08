/**
 * Page "Devenir Parrain" — /referral
 * Landing page interne premium pour le programme partenaire InkFlow.
 * Design SaaS Dark Mode (Vercel/Linear) + animations Framer Motion.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ArrowLeft, Gift, Users, Zap, ChevronDown, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSecureStudioId } from '../hooks/useSecureStudioId';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { Logo } from '../components/Logo';
import { getInviteBaseUrl } from '../lib/urls';
import { SEO } from '../components/SEO';

const heroWorkstationImg = '/images/referral-hero-studio1.png';

/* Icônes brand pour partage */
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

/* Variants Framer Motion — style Framer */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06 + 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};
const stagger = {
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  hidden: {},
};
const FAQ_ITEMS = [
  {
    q: 'Quand reçois-je mon mois gratuit ?',
    a: "Dès que votre filleul s'inscrit et souscrit à l'abonnement Pro InkFlow, vous recevez automatiquement 1 mois d'abonnement gratuit. Le mois est ajouté à la fin de votre période actuelle.",
  },
  {
    q: "Y a-t-il une limite de parrainages ?",
    a: "Non. Vous pouvez parrainer autant de confrères que vous le souhaitez. Chaque filleul qui souscrit = 1 mois gratuit pour vous. Certains tatoueurs ont déjà cumulé plus d'un an d'abonnement offert.",
  },
  {
    q: "Mon filleul reçoit-il aussi 1 mois gratuit ?",
    a: "Oui ! C'est gagnant-gagnant : vous et votre filleul recevez chacun 1 mois d'abonnement Pro offert. C'est notre façon de remercier la communauté.",
  },
  {
    q: "Le lien de parrainage expire-t-il ?",
    a: "Non, votre lien est permanent. Vous pouvez le partager à tout moment. Il reste valide tant que votre compte InkFlow est actif.",
  },
];

export const ReferralPage: React.FC = () => {
  useAuth();
  const { studioId } = useSecureStudioId();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {};
  }, []);
  const toast = useToast();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [friendsInvited, setFriendsInvited] = useState(0);
  const [monthsEarned, setMonthsEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!studioId) {
      setReferralCode('ABC123');
      setLoading(false);
      return;
    }
    try {
      const { data: studio } = await supabase
        .from('inkflow_studios')
        .select('referral_code')
        .eq('id', studioId)
        .single();
      const code = (studio as { referral_code?: string } | null)?.referral_code ?? 'ABC123';
      setReferralCode(code);

      const { data: referrals } = await supabase
        .from('inkflow_referrals')
        .select('id, status')
        .eq('referrer_id', studioId);
      const refs = (referrals ?? []) as { id: string; status?: string }[];
      const completed = refs.filter((r) => r.status === 'completed');
      setFriendsInvited(refs.length);
      setMonthsEarned(completed.length);
    } catch {
      setReferralCode('ABC123');
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const inviteUrl = referralCode ? `${getInviteBaseUrl()}/${referralCode}` : '';
  const shareMessage = `Yo ! ✌️ Si tu cherches un outil pour gérer ton studio de tatouage, je te recommande InkFlow. Passe par mon lien pour t'inscrire, on gagnera tous les deux 1 mois d'abonnement offert : ${inviteUrl}`;

  const handleCopy = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  }, [inviteUrl, toast]);

  const shareWhatsApp = useCallback(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank', 'noopener,noreferrer');
  }, [inviteUrl]);

  const shareInstagram = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      toast.success('Message copié ! Collez-le dans une story ou un DM Instagram.');
    } catch {
      toast.error('Impossible de copier');
    }
  }, [inviteUrl, toast]);

  const shareEmail = useCallback(() => {
    const subject = encodeURIComponent('InkFlow — 1 mois offert pour toi et pour moi 🎁');
    const body = encodeURIComponent(shareMessage);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [inviteUrl]);

  if (loading) {
    return (
      <motion.div
        className="landing-scroll min-h-screen bg-neutral-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-10 h-10 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          <span className="text-neutral-600">Chargement…</span>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="landing-scroll min-h-screen bg-neutral-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <SEO
        title="Programme parrainage"
        description="Parrainez d'autres studios InkFlow et offrez-vous des mois d'abonnement. Réservé aux comptes connectés."
        canonical="/referral"
        noindex
        ogImageAlt="Parrainage InkFlow"
      />
      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-xl"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <motion.a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            <span className="font-medium">Retour au dashboard</span>
          </motion.a>
          <Logo size="sm" className="rounded-lg" />
        </div>
      </motion.header>

      <main className="pt-20 pb-24">
        {/* 1. Hero Section — Split Layout */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              className="order-2 lg:order-1 space-y-8"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              <motion.span
                variants={fadeUp}
                custom={0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 text-sm font-medium"
              >
                ✨ Programme Partenaire
              </motion.span>
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight leading-[1.1]"
              >
                Offrez 1 mois, Gagnez 1 mois.
              </motion.h1>
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-lg sm:text-xl text-neutral-600 max-w-xl leading-relaxed"
              >
                Aidez vos confrères à reprendre le contrôle de leur studio. Partagez InkFlow et
                gagnez des mois d&apos;abonnement gratuit. Sans limite.
              </motion.p>
              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-wrap gap-4 pt-2"
              >
                <div className="flex items-center gap-2 text-neutral-600">
                  <Gift className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                  <span className="text-sm">1 mois offert par filleul</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                  <Zap className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
                  <span className="text-sm">Activation immédiate</span>
                </div>
              </motion.div>
            </motion.div>
            <motion.div
              className="order-1 lg:order-2 relative"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-white aspect-[4/3] sm:aspect-square shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <img
                  src={heroWorkstationImg}
                  alt="Poste de travail tatoueur — studio de tatouage"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1568515041312-08adf6d4e35a?w=800&q=80';
                  }}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"
                  aria-hidden
                />
              </motion.div>
              <div
                className="absolute -z-10 -inset-4 bg-emerald-500/5 blur-3xl rounded-3xl"
                aria-hidden
              />
            </motion.div>
          </div>
        </section>

        {/* Stats — Toujours affichées */}
        <motion.section
          className="max-w-6xl mx-auto px-4 sm:px-6 py-8"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <Users className="w-8 h-8 text-zinc-500 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-3xl font-bold text-white">{friendsInvited}</p>
              <p className="text-sm text-zinc-400 mt-1">Amis invités</p>
            </motion.div>
            <motion.div
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 }}
              whileHover={{ scale: 1.02 }}
            >
              <Gift className="w-8 h-8 text-emerald-400/80 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-3xl font-bold text-emerald-400">{monthsEarned}</p>
              <p className="text-sm text-zinc-400 mt-1">Mois gratuits gagnés</p>
            </motion.div>
            <motion.div
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center col-span-2 lg:col-span-1"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-2xl font-bold text-white">
                {monthsEarned > 0 ? `~${monthsEarned * 29}€` : '—'}
              </p>
              <p className="text-sm text-zinc-400 mt-1">Économies estimées</p>
            </motion.div>
            <motion.div
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center col-span-2 lg:col-span-1"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.18 }}
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-sm font-medium text-emerald-700">Votre code</p>
              <p className="text-xl font-bold text-neutral-900 mt-1 tracking-wider">
                {referralCode ?? '—'}
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* 2. Carte "Lien Magique" */}
        <motion.section
          className="max-w-2xl mx-auto px-4 sm:px-6 py-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 space-y-6 hover:border-neutral-700 transition-colors"
          >
            <div>
              <h2 className="text-lg font-semibold text-white">Votre lien de parrainage</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Partagez ce lien unique à vos confrères. Chaque inscription = 1 mois offert pour vous
                deux.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0 rounded-xl bg-black border border-white/10 px-4 py-3.5 font-mono text-sm text-zinc-300 truncate">
                {inviteUrl || '—'}
              </div>
              <motion.button
                onClick={handleCopy}
                className={`flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-colors ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={copied ? { scale: [1, 1.03, 1] } : {}}
                transition={{ duration: 0.25 }}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" strokeWidth={2} />
                    Lien copié !
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" strokeWidth={1.5} />
                    Copier le lien
                  </>
                )}
              </motion.button>
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-3">Ou partager via :</p>
              <div className="flex flex-wrap gap-3">
                <motion.button
                  onClick={shareWhatsApp}
                  className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 border border-white/20 text-zinc-300 hover:bg-white/20 hover:text-white transition-colors"
                  title="Partager sur WhatsApp"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <WhatsAppIcon className="w-6 h-6" />
                </motion.button>
                <motion.button
                  onClick={shareInstagram}
                  className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 border border-white/20 text-zinc-300 hover:bg-white/20 hover:text-white transition-colors"
                  title="Copier pour Instagram"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <InstagramIcon className="w-6 h-6" />
                </motion.button>
                <motion.button
                  onClick={shareEmail}
                  className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 border border-white/20 text-zinc-300 hover:bg-white/20 hover:text-white transition-colors"
                  title="Partager par email"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mail className="w-5 h-5" strokeWidth={1.5} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* 3. Comment ça marche */}
        <motion.section
          className="max-w-6xl mx-auto px-4 sm:px-6 py-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <motion.h2
            className="text-3xl sm:text-4xl font-extrabold text-neutral-900 text-center mb-4"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Simple. Rapide. Sans limite.
          </motion.h2>
          <motion.p
            className="text-neutral-600 text-center mb-16 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            Trois étapes pour transformer vos recommandations en mois gratuits.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&auto=format&fit=crop', step: '1', title: 'Partagez votre lien', desc: "Envoyez votre lien unique à vos confrères tatoueurs par WhatsApp, Instagram, email ou en personne. Le lien ne change jamais." },
              { img: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=600&auto=format&fit=crop', step: '2', title: "Ils s'inscrivent", desc: "Votre ami crée son compte InkFlow via votre lien et souscrit à l'abonnement Pro. La récompense est déclenchée automatiquement." },
              { img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=600&auto=format&fit=crop', step: '3', title: 'Vous gagnez 1 mois', desc: "Vous recevez 1 mois d'abonnement gratuit. Lui aussi. Sans limite de parrainages — certains cumulent plus d'un an offert." },
            ].map((card, i) => (
            <motion.div
              key={i}
              className="rounded-2xl border border-neutral-700 bg-neutral-900 overflow-hidden hover:border-neutral-600 transition-colors"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="h-36 overflow-hidden">
                <img src={card.img} alt={card.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Étape {card.step}
                </span>
                <h3 className="text-xl font-semibold text-white mt-2">{card.title}</h3>
                <p className="text-zinc-400 mt-2 text-sm leading-relaxed">{card.desc}</p>
              </div>
            </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 4. Ce que votre filleul gagne */}
        <motion.section
          className="max-w-6xl mx-auto px-4 sm:px-6 py-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 sm:p-12 hover:border-neutral-700 transition-colors">
            <h2 className="text-2xl font-bold text-white mb-6">
              Ce que votre confrère gagne en s&apos;inscrivant
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">1 mois Pro offert</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Accès complet à InkFlow dès l&apos;inscription.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Prise de RDV en ligne</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Vitrine, acomptes, rappels automatiques.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Gestion clients & finance</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    CRM, facturation, suivi des acomptes.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Support dédié</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Équipe réactive pour les tatoueurs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 5. Social Proof / Témoignages */}
        <motion.section
          className="max-w-6xl mx-auto px-4 sm:px-6 py-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <motion.h2
            className="text-2xl font-bold text-neutral-900 text-center mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ils ont déjà parrainé leurs confrères
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 flex flex-col sm:flex-row gap-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.01 }}
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
                alt="Thomas"
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/10 flex-shrink-0"
              />
              <div>
                <blockquote className="text-zinc-300 italic leading-relaxed">
                  &ldquo;J&apos;ai partagé mon lien avec 4 potes tatoueurs sur WhatsApp. Résultat :
                  mon abonnement InkFlow est gratuit jusqu&apos;à la fin de l&apos;année. C&apos;est
                  le meilleur deal possible.&rdquo;
                </blockquote>
                <footer className="mt-4">
                  <cite className="not-italic font-medium text-white">Thomas</cite>
                  <span className="text-zinc-500">, Tatoueur à Lyon</span>
                </footer>
              </div>
            </motion.div>
            <motion.div
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 flex flex-col sm:flex-row gap-6"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.01 }}
            >
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
                alt="Léa"
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/10 flex-shrink-0"
              />
              <div>
                <blockquote className="text-zinc-300 italic leading-relaxed">
                  &ldquo;J&apos;en parle à chaque convention. En 3 mois j&apos;ai parrainé 6
                  artistes. Je ne paie plus InkFlow depuis février. Merci l&apos;équipe !&rdquo;
                </blockquote>
                <footer className="mt-4">
                  <cite className="not-italic font-medium text-white">Léa</cite>
                  <span className="text-zinc-500">, Artiste à Bordeaux</span>
                </footer>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* 6. FAQ */}
        <motion.section
          className="max-w-2xl mx-auto px-4 sm:px-6 py-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <motion.h2
            className="text-2xl font-bold text-neutral-900 text-center mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Questions fréquentes
          </motion.h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <motion.button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
                  whileTap={{ scale: 0.995 }}
                >
                  <span className="font-medium text-white">{item.q}</span>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                  </motion.span>
                </motion.button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4">
                        <p className="text-zinc-400 text-sm leading-relaxed">{item.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 7. CTA final */}
        <motion.section
          className="max-w-2xl mx-auto px-4 sm:px-6 py-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 sm:p-12 text-center hover:border-neutral-700 transition-colors">
            <h2 className="text-2xl font-bold text-white mb-4">
              Prêt à partager ?
            </h2>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Chaque confrère que vous invitez vous rapproche d&apos;un abonnement 100 % gratuit.
            </p>
            <motion.button
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Copy className="w-5 h-5" strokeWidth={1.5} />
              Copier mon lien de parrainage
            </motion.button>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <motion.footer
        className="border-t border-neutral-200 bg-white py-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a
            href="/dashboard"
            className="text-neutral-600 hover:text-neutral-900 text-sm font-medium transition-colors"
          >
            ← Retour au dashboard
          </a>
          <span className="text-neutral-500 text-sm">
            Programme Partenaire InkFlow • Sans engagement
          </span>
        </div>
      </motion.footer>
    </motion.div>
  );
};
