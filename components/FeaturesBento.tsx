import React, { useState, useEffect } from 'react';
import {
  Calendar, CreditCard, Users, Zap, Shield, Clock,
  TrendingUp, Sparkles, Check, ChevronRight, ChevronLeft,
  Send, Bell, FileText, MessageCircle,
} from 'lucide-react';
import { useIntersectionAnimation } from '../hooks/useIntersectionAnimation';

const DEMO_CYCLE_MS = 2800;

/* ------------------------------------------------------------------ */
/*  Wrapper: cycle animé type démo vidéo                               */
/* ------------------------------------------------------------------ */
const DemoCycle: React.FC<{ children: React.ReactNode[]; className?: string; indicatorColor?: 'indigo' | 'white' | 'green' | 'purple' }> = ({ children, className = '', indicatorColor = 'indigo' }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((prev) => (prev + 1) % children.length), DEMO_CYCLE_MS);
    return () => clearInterval(t);
  }, [children.length]);
  const activeClass = indicatorColor === 'white' ? 'bg-white/80' : indicatorColor === 'green' ? 'bg-green-500' : indicatorColor === 'purple' ? 'bg-purple-500' : 'bg-indigo-500';
  const inactiveClass = indicatorColor === 'white' ? 'bg-white/20' : 'bg-neutral-200/80';
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {children.map((child, idx) => (
          <div key={idx} className={`transition-opacity duration-400 ${idx === i ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>{child}</div>
        ))}
      </div>
      <div className="flex gap-1 mt-2">
        {children.map((_, idx) => (
          <div key={idx} className={`h-0.5 flex-1 rounded-full transition-colors ${idx === i ? activeClass : inactiveClass}`} />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Mini-UI: Calendrier semaine + RDV (animé)                          */
/* ------------------------------------------------------------------ */
const MiniCalendarUI: React.FC = () => {
  const scenes = [
    {
      days: [
        { label: 'Lun', num: 17 },
        { label: 'Mar', num: 18, dots: 1 },
        { label: 'Mer', num: 19, dots: 2 },
        { label: 'Jeu', num: 20, active: true, dots: 3 },
        { label: 'Ven', num: 21, dots: 1 },
        { label: 'Sam', num: 22 },
        { label: 'Dim', num: 23 },
      ],
      rdvs: [
        { letter: 'M', name: 'Marie D. — Flash rose', time: '14h00 – 16h00', status: 'Confirmé', statusClass: 'emerald' },
        { letter: 'L', name: 'Lucas T. — Sleeve bras', time: '17h00 – 19h30', status: 'En attente', statusClass: 'amber' },
      ],
    },
    {
      days: [
        { label: 'Lun', num: 24 },
        { label: 'Mar', num: 25, dots: 2 },
        { label: 'Mer', num: 26, active: true, dots: 1 },
        { label: 'Jeu', num: 27, dots: 3 },
        { label: 'Ven', num: 28 },
        { label: 'Sam', num: 29 },
        { label: 'Dim', num: 30 },
      ],
      rdvs: [
        { letter: 'C', name: 'Chloé R. — Mandala dos', time: '10h00 – 12h00', status: 'Confirmé', statusClass: 'emerald' },
        { letter: 'T', name: 'Thomas B. — Minimaliste', time: '15h00 – 16h00', status: 'Confirmé', statusClass: 'emerald' },
      ],
    },
    {
      days: [
        { label: 'Lun', num: 3 },
        { label: 'Mar', num: 4, active: true, dots: 2 },
        { label: 'Mer', num: 5, dots: 1 },
        { label: 'Jeu', num: 6 },
        { label: 'Ven', num: 7, dots: 3 },
        { label: 'Sam', num: 8 },
        { label: 'Dim', num: 9 },
      ],
      rdvs: [
        { letter: 'S', name: 'Sophie D. — Rose traditional', time: '11h00 – 13h00', status: 'Confirmé', statusClass: 'emerald' },
        { letter: 'A', name: 'Alex M. — Dragon', time: '14h00 – 17h00', status: 'En attente', statusClass: 'amber' },
      ],
    },
  ];

  return (
    <DemoCycle>
      {scenes.map((scene, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden max-w-md">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100">
            <ChevronLeft className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-semibold text-neutral-700">Février 2026</span>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="grid grid-cols-7 gap-1 px-3 py-2.5">
            {scene.days.map((d) => (
              <div key={d.label} className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-neutral-400 font-medium">{d.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${d.active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-neutral-700 hover:bg-neutral-50'}`}>{d.num}</div>
                <div className="flex gap-0.5 h-1.5">
                  {Array.from({ length: d.dots || 0 }).map((_, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full ${d.active ? 'bg-indigo-300' : 'bg-indigo-400'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 pb-3 space-y-2">
            {scene.rdvs.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${i === 0 ? 'bg-indigo-50/80 border-indigo-100/60' : 'bg-white border-neutral-100'}`}>
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{r.letter}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-neutral-800 truncate">{r.name}</div>
                  <div className="text-[10px] text-neutral-500">{r.time}</div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${r.statusClass === 'emerald' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-amber-700 bg-amber-50 border border-amber-100'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </DemoCycle>
  );
};

/* ------------------------------------------------------------------ */
/*  Mini-UI: Transactions Stripe (animé)                                */
/* ------------------------------------------------------------------ */
const MiniPaymentsUI: React.FC = () => {
  const scenes = [
    { total: '4 250 €', pct: 72, goal: '5 900 €', txns: [{ name: 'Marie D.', amount: '+50 €', ok: true }, { name: 'Lucas T.', amount: '+100 €', ok: true }, { name: 'Chloé R.', amount: '+75 €', ok: false }] },
    { total: '5 120 €', pct: 87, goal: '5 900 €', txns: [{ name: 'Thomas B.', amount: '+120 €', ok: true }, { name: 'Sophie D.', amount: '+80 €', ok: true }, { name: 'Alex M.', amount: '+50 €', ok: true }] },
    { total: '5 890 €', pct: 99, goal: '5 900 €', txns: [{ name: 'Marie L.', amount: '+200 €', ok: true }, { name: 'Lucas M.', amount: '+150 €', ok: true }, { name: 'Chloé T.', amount: '+90 €', ok: false }] },
  ];

  return (
    <DemoCycle indicatorColor="white">
      {scenes.map((s, idx) => (
        <div key={idx} className="space-y-4 mt-2">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-neutral-400">Acomptes ce mois</span>
              <span className="text-xs font-semibold text-white">{s.total}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${s.pct}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-neutral-500">{s.pct}% de l&apos;objectif</span>
              <span className="text-[10px] text-neutral-500">{s.goal}</span>
            </div>
          </div>
          <div className="space-y-2">
            {s.txns.map((t, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">{t.name.charAt(0)}</div>
                <div className="flex-1 min-w-0"><span className="text-xs font-medium text-white truncate block">{t.name}</span></div>
                <span className="text-xs font-bold text-emerald-400">{t.amount}</span>
                {t.ok ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </DemoCycle>
  );
};

/* ------------------------------------------------------------------ */
/*  Mini-UI: Galerie Flash (animé) — photos tatouages réelles          */
/* ------------------------------------------------------------------ */
const GALLERY_IMAGES = {
  irisFloral: '/gallery/iris-floral.png',
  leopard: '/gallery/leopard.png',
  botanique: '/gallery/botanique.png',
  mandala: '/gallery/mandala.png',
  marguerite: '/gallery/marguerite.png',
  irisJambe: '/gallery/iris-jambe.png',
  botaniqueMain: '/gallery/botanique-main.png',
  carpeKoi: '/gallery/carpe-koi.png',
};

const MiniFlashGallery: React.FC = () => {
  const scenes = [
    [
      { name: 'Iris floral', price: '180 €', src: GALLERY_IMAGES.irisFloral },
      { name: 'Léopard', price: '150 €', src: GALLERY_IMAGES.leopard },
      { name: 'Botanique', price: '120 €', src: GALLERY_IMAGES.botanique },
    ],
    [
      { name: 'Mandala', price: '200 €', src: GALLERY_IMAGES.mandala },
      { name: 'Marguerite', price: '140 €', src: GALLERY_IMAGES.marguerite },
      { name: 'Carpe Koï', price: '220 €', src: GALLERY_IMAGES.carpeKoi },
    ],
    [
      { name: 'Iris détail', price: '160 €', src: GALLERY_IMAGES.irisJambe },
      { name: 'Vignes', price: '130 €', src: GALLERY_IMAGES.botaniqueMain },
      { name: 'Léopard', price: '150 €', src: GALLERY_IMAGES.leopard },
    ],
  ];

  return (
    <DemoCycle indicatorColor="purple">
      {scenes.map((flashes, idx) => (
        <div key={idx} className="flex gap-2 sm:gap-3">
          {flashes.map((f, i) => (
            <div key={i} className="relative flex-1 min-w-0 rounded-xl overflow-hidden shadow-md border border-white/80 group cursor-pointer">
              <div className="h-28 sm:h-32 overflow-hidden bg-neutral-100">
                <img src={f.src} alt={f.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="bg-white px-2.5 py-2">
                <div className="text-xs font-semibold text-neutral-800 truncate">{f.name}</div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] font-bold text-purple-600">{f.price}</span>
                  <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">Dispo</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </DemoCycle>
  );
};

/* ------------------------------------------------------------------ */
/*  Mini-UI: Profil Client CRM (animé)                                 */
/* ------------------------------------------------------------------ */
const MiniClientProfile: React.FC = () => {
  const clients = [
    { letter: 'M', name: 'Marie Dupont', info: '3 rendez-vous · Dernière visite : 15 jan 2026', tags: ['Réalisme', 'Bras droit', 'Flash'], ca: '475 €', sat: '4.9 ★', status: 'Fidèle' },
    { letter: 'L', name: 'Lucas Martin', info: '5 rendez-vous · Dernière visite : 20 jan 2026', tags: ['Traditional', 'Sleeve', 'Couleur'], ca: '1 200 €', sat: '5.0 ★', status: 'VIP' },
    { letter: 'S', name: 'Sophie Dubois', info: '1 rendez-vous · Dernière visite : 18 jan 2026', tags: ['Minimaliste', 'Poignet'], ca: '180 €', sat: '4.8 ★', status: 'Nouveau' },
  ];

  return (
    <DemoCycle>
      {clients.map((c, idx) => (
        <div key={idx} className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 space-y-3 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-white text-sm font-bold shrink-0">{c.letter}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-neutral-900">{c.name}</div>
              <div className="text-xs text-neutral-500">{c.info}</div>
            </div>
            <MessageCircle className="w-4 h-4 text-neutral-400 shrink-0" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {c.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200/80 text-neutral-700">{tag}</span>
            ))}
          </div>
          <div className="flex items-center gap-4 pt-1 border-t border-neutral-100">
            <div className="flex-1">
              <div className="text-lg font-bold text-neutral-900">{c.ca}</div>
              <div className="text-[10px] text-neutral-500">CA total</div>
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-neutral-900">{c.sat}</div>
              <div className="text-[10px] text-neutral-500">Satisfaction</div>
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-emerald-600">{c.status}</div>
              <div className="text-[10px] text-neutral-500">Statut</div>
            </div>
          </div>
        </div>
      ))}
    </DemoCycle>
  );
};

/* ------------------------------------------------------------------ */
/*  Mini-UI: Timeline Automatisation (animé)                            */
/* ------------------------------------------------------------------ */
const MiniAutomationTimeline: React.FC = () => {
  const scenes = [
    [
      { icon: Send, label: 'Confirmation envoyée', time: 'Il y a 2h', done: true },
      { icon: Bell, label: 'Rappel 24h avant', time: 'Programmé demain 14h', done: false, next: true },
      { icon: FileText, label: 'Formulaire consentement', time: 'Envoi auto J-1', done: false },
    ],
    [
      { icon: Send, label: 'Confirmation envoyée', time: 'Il y a 2h', done: true },
      { icon: Bell, label: 'Rappel 24h avant', time: 'Envoyé il y a 1h', done: true },
      { icon: FileText, label: 'Formulaire consentement', time: 'Envoi auto demain', done: false, next: true },
    ],
    [
      { icon: Send, label: 'Confirmation envoyée', time: 'Il y a 2h', done: true },
      { icon: Bell, label: 'Rappel 24h avant', time: 'Envoyé il y a 1h', done: true },
      { icon: FileText, label: 'Formulaire consentement', time: 'Signé par le client', done: true },
    ],
  ];

  return (
    <DemoCycle indicatorColor="green">
      {scenes.map((steps, idx) => (
        <div key={idx} className="mt-3 space-y-0">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-3 relative">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${s.done ? 'bg-green-600 text-white' : s.next ? 'bg-green-100 text-green-700 ring-2 ring-green-300' : 'bg-neutral-100 text-neutral-400'}`}>
                  <s.icon className="w-3.5 h-3.5" />
                </div>
                {i < steps.length - 1 && <div className={`w-0.5 h-6 ${s.done ? 'bg-green-300' : 'bg-neutral-200'}`} />}
              </div>
              <div className="pb-4">
                <div className={`text-sm font-semibold ${s.done ? 'text-neutral-900' : 'text-neutral-600'}`}>{s.label}</div>
                <div className="text-[11px] text-neutral-500">{s.time}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </DemoCycle>
  );
};

/* ------------------------------------------------------------------ */
/*  Mini-UI: Score Sécurité (animé)                                    */
/* ------------------------------------------------------------------ */
const MiniSecurityScore: React.FC = () => {
  const scenes = [
    { pct: 98, dash: 97.4, offset: 5, status: 'Aucune alerte', desc: 'Toutes les protections sont actives' },
    { pct: 100, dash: 97.4, offset: 0, status: 'Parfait', desc: 'Backup effectué ce matin' },
    { pct: 98, dash: 97.4, offset: 5, status: 'SSL actif', desc: 'Chiffrement TLS 1.3' },
  ];

  return (
    <DemoCycle>
      {scenes.map((s, idx) => (
        <div key={idx} className="flex items-center gap-5 mb-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#fde8e8" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${s.dash}`} strokeDashoffset={s.offset} className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-neutral-800">{s.pct}%</span>
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-800">Score de sécurité</div>
            <div className="text-xs text-neutral-500 mt-0.5">{s.desc}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-[11px] font-medium text-green-700">{s.status}</span>
            </div>
          </div>
        </div>
      ))}
    </DemoCycle>
  );
};

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export const FeaturesBento: React.FC = () => {
  const { ref, isVisible } = useIntersectionAnimation(0.08);
  return (
    <section id="features" className={`py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-neutral-50/50 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div ref={ref} className={`max-w-7xl mx-auto animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 px-2 tracking-tight">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto px-2">
            Une plateforme complète pour gérer votre activité de tatoueur professionnel
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">

          {/* ---- 1. Réservations en ligne (2 cols, indigo) ---- */}
          <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-indigo-100/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-300 border border-indigo-100/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200 rounded-full blur-3xl opacity-30" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Réservations en ligne 24/7</h3>
                  <p className="text-neutral-700 text-sm sm:text-base max-w-sm">
                    Vos clients réservent directement en ligne. Calendrier synchronisé, notifications automatiques et rappels.
                  </p>
                </div>
              </div>
              <MiniCalendarUI />
            </div>
          </div>

          {/* ---- 2. Paiements Stripe (fond noir) ---- */}
          <div className="bg-neutral-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden group hover:shadow-xl hover:shadow-neutral-900/20 transition-all duration-300">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-1">Paiements Stripe</h3>
              <p className="text-neutral-400 text-sm mb-3">
                Encaissez les acomptes automatiquement. Fini les no-shows !
              </p>
              <MiniPaymentsUI />
            </div>
          </div>

          {/* ---- 3. Galerie Flash (violet / rose) ---- */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-300 border border-purple-100/50">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-200 rounded-full blur-3xl opacity-30" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Galerie Flash</h3>
              <p className="text-neutral-700 mb-4 text-sm">
                Publiez vos flashs avec prix. Vos clients réservent en 2 clics.
              </p>
              <MiniFlashGallery />
            </div>
          </div>

          {/* ---- 4. CRM Client (blanc) ---- */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-900/5 transition-all duration-300">
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-neutral-900" />
            </div>
            <h3 className="text-xl font-bold mb-1">CRM Client</h3>
            <p className="text-neutral-700 text-sm">
              Historique complet, notes privées, photos des tatouages précédents.
            </p>
            <MiniClientProfile />
          </div>

          {/* ---- 5. Automatisation (vert) ---- */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-green-100/50">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-1">Automatisation</h3>
            <p className="text-neutral-700 text-sm">
              Confirmations, rappels et formulaires de consentement — tout est automatique.
            </p>
            <MiniAutomationTimeline />
          </div>

          {/* ---- 6. Sécurité (2 cols, orange/rouge) ---- */}
          <div className="md:col-span-2 bg-gradient-to-r from-orange-50 to-red-50/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-orange-100/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
              <div>
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Sécurisé et Conforme</h3>
                <p className="text-neutral-700 text-sm sm:text-base mb-4">
                  Hébergement européen, RGPD compliant, backup automatique.
                  Vos données et celles de vos clients sont protégées.
                </p>
                <MiniSecurityScore />
              </div>
              <div className="space-y-3">
                {[
                  { label: 'SSL/TLS chiffrement', desc: 'Toutes vos données sont chiffrées' },
                  { label: 'Backup quotidien', desc: 'Restauration en 1 clic' },
                  { label: 'Conformité RGPD', desc: 'Export et suppression des données' },
                  { label: 'Support 7j/7', desc: 'Réponse en moins de 2h' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-neutral-100/80">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-neutral-800 block">{item.label}</span>
                      <span className="text-[11px] text-neutral-500">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
