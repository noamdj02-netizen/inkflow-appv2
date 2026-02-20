import React from 'react';
import {
  Calendar, CreditCard, Users, Zap, Shield, Clock,
  TrendingUp, Sparkles, Check, ChevronRight, ChevronLeft,
  Send, Bell, FileText, MessageCircle,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Mini-UI: Calendrier semaine + RDV                                 */
/* ------------------------------------------------------------------ */
const MiniCalendarUI: React.FC = () => {
  const days = [
    { label: 'Lun', num: 17 },
    { label: 'Mar', num: 18, dots: 1 },
    { label: 'Mer', num: 19, dots: 2 },
    { label: 'Jeu', num: 20, active: true, dots: 3 },
    { label: 'Ven', num: 21, dots: 1 },
    { label: 'Sam', num: 22 },
    { label: 'Dim', num: 23 },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden max-w-md">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100">
        <ChevronLeft className="w-4 h-4 text-neutral-400" />
        <span className="text-xs font-semibold text-neutral-700">Février 2026</span>
        <ChevronRight className="w-4 h-4 text-neutral-400" />
      </div>
      <div className="grid grid-cols-7 gap-1 px-3 py-2.5">
        {days.map((d) => (
          <div key={d.label} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-neutral-400 font-medium">{d.label}</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                d.active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {d.num}
            </div>
            <div className="flex gap-0.5 h-1.5">
              {Array.from({ length: d.dots || 0 }).map((_, i) => (
                <div key={i} className={`w-1 h-1 rounded-full ${d.active ? 'bg-indigo-300' : 'bg-indigo-400'}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 pb-3 space-y-2">
        <div className="flex items-center gap-3 bg-indigo-50/80 rounded-lg px-3 py-2.5 border border-indigo-100/60">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">M</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-neutral-800 truncate">Marie D. — Flash rose</div>
            <div className="text-[10px] text-neutral-500">14h00 – 16h00</div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">Confirmé</span>
        </div>
        <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-neutral-100">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">L</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-neutral-800 truncate">Lucas T. — Sleeve bras</div>
            <div className="text-[10px] text-neutral-500">17h00 – 19h30</div>
          </div>
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 shrink-0">En attente</span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Mini-UI: Transactions Stripe                                       */
/* ------------------------------------------------------------------ */
const MiniPaymentsUI: React.FC = () => {
  const txns = [
    { name: 'Marie D.', amount: '+50 €', status: 'ok', time: 'il y a 2h' },
    { name: 'Lucas T.', amount: '+100 €', status: 'ok', time: 'il y a 5h' },
    { name: 'Chloé R.', amount: '+75 €', status: 'pending', time: 'hier' },
  ];

  return (
    <div className="space-y-4 mt-2">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-neutral-400">Acomptes ce mois</span>
          <span className="text-xs font-semibold text-white">4 250 €</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" style={{ width: '72%' }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-neutral-500">72% de l'objectif</span>
          <span className="text-[10px] text-neutral-500">5 900 €</span>
        </div>
      </div>
      <div className="space-y-2">
        {txns.map((t, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 border border-white/5">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {t.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-white truncate block">{t.name}</span>
            </div>
            <span className="text-xs font-bold text-emerald-400">{t.amount}</span>
            {t.status === 'ok' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Mini-UI: Galerie Flash (placeholders CSS)                          */
/* ------------------------------------------------------------------ */
const MiniFlashGallery: React.FC = () => {
  const flashes = [
    { name: 'Iris floral', price: '180 €', src: '/gallery/tattoo-1.jpg', alt: 'Tatouage iris - épaule et bras' },
    { name: 'Léopard', price: '150 €', src: '/gallery/tattoo-2.jpg', alt: 'Tatouage léopard - bras' },
    { name: 'Botanique', price: '120 €', src: '/gallery/tattoo-3.jpg', alt: 'Tatouage botanique - nuque' },
  ];

  return (
    <div className="flex gap-2 sm:gap-3">
      {flashes.map((f, i) => (
        <div
          key={i}
          className="relative flex-1 min-w-0 rounded-xl overflow-hidden shadow-md border border-white/80 hover:scale-[1.03] transition-transform group cursor-pointer"
        >
          <div className="h-28 sm:h-32 overflow-hidden bg-neutral-100">
            <img
              src={f.src}
              alt={f.alt}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
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
  );
};

/* ------------------------------------------------------------------ */
/*  Mini-UI: Profil Client CRM                                        */
/* ------------------------------------------------------------------ */
const MiniClientProfile: React.FC = () => (
  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 space-y-3 mt-2">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-white text-sm font-bold shrink-0">M</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-neutral-900">Marie Dupont</div>
        <div className="text-xs text-neutral-500">3 rendez-vous · Dernière visite : 15 jan 2026</div>
      </div>
      <MessageCircle className="w-4 h-4 text-neutral-400 shrink-0" />
    </div>
    <div className="flex gap-1.5 flex-wrap">
      {['Réalisme', 'Bras droit', 'Flash'].map((tag) => (
        <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200/80 text-neutral-700">{tag}</span>
      ))}
    </div>
    <div className="flex items-center gap-4 pt-1 border-t border-neutral-100">
      <div className="flex-1">
        <div className="text-lg font-bold text-neutral-900">475 €</div>
        <div className="text-[10px] text-neutral-500">CA total</div>
      </div>
      <div className="flex-1">
        <div className="text-lg font-bold text-neutral-900">4.9 ★</div>
        <div className="text-[10px] text-neutral-500">Satisfaction</div>
      </div>
      <div className="flex-1">
        <div className="text-lg font-bold text-emerald-600">Fidèle</div>
        <div className="text-[10px] text-neutral-500">Statut</div>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Mini-UI: Timeline Automatisation                                   */
/* ------------------------------------------------------------------ */
const MiniAutomationTimeline: React.FC = () => {
  const steps = [
    { icon: Send, label: 'Confirmation envoyée', time: 'Il y a 2h', done: true },
    { icon: Bell, label: 'Rappel 24h avant', time: 'Programmé demain 14h', done: false, next: true },
    { icon: FileText, label: 'Formulaire consentement', time: 'Envoi auto J-1', done: false },
  ];

  return (
    <div className="mt-3 space-y-0">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-3 relative">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                s.done
                  ? 'bg-green-600 text-white'
                  : s.next
                    ? 'bg-green-100 text-green-700 ring-2 ring-green-300'
                    : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
            </div>
            {i < steps.length - 1 && (
              <div className={`w-0.5 h-6 ${s.done ? 'bg-green-300' : 'bg-neutral-200'}`} />
            )}
          </div>
          <div className="pb-4">
            <div className={`text-sm font-semibold ${s.done ? 'text-neutral-900' : 'text-neutral-600'}`}>{s.label}</div>
            <div className="text-[11px] text-neutral-500">{s.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Mini-UI: Score Sécurité                                            */
/* ------------------------------------------------------------------ */
const MiniSecurityScore: React.FC = () => (
  <div className="flex items-center gap-5 mb-4">
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#fde8e8" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15.5" fill="none"
          stroke="#22c55e" strokeWidth="3" strokeLinecap="round"
          strokeDasharray="97.4" strokeDashoffset="5"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-neutral-800">98%</span>
      </div>
    </div>
    <div>
      <div className="text-sm font-bold text-neutral-800">Score de sécurité</div>
      <div className="text-xs text-neutral-500 mt-0.5">Toutes les protections sont actives</div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        <span className="text-[11px] font-medium text-green-700">Aucune alerte</span>
      </div>
    </div>
  </div>
);

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export const FeaturesBento: React.FC = () => {
  return (
    <section id="features" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-neutral-50/50">
      <div className="max-w-7xl mx-auto">
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
