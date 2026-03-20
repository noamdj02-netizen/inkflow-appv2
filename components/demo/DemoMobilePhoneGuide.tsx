import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Menu,
  CalendarCheck,
  Moon,
  Bell,
  Plus,
  Zap,
  ExternalLink,
  Inbox,
  LayoutGrid,
  Home,
  Calendar,
  Users,
  Settings,
  ChevronRight,
  Camera,
  Smartphone,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import type { Appointment } from '../../types';

export interface DemoMobilePhoneGuideProps {
  greetingName: string;
  studioLabel: string;
  /** Ex. « vendredi 20 mars » */
  dateLine: string;
  firstToday: Appointment | null;
  todayCount: number;
  unpaidCount: number;
  monthlyRevenue: number;
  pendingDeposits: number;
  clientsCount: number;
  appointmentsThisMonth: number;
  getAvatar: (name: string) => string;
}

type SectionId = 'intro' | 'header' | 'hero' | 'quick' | 'next' | 'kpi' | 'bottom';

const STEPS: { section: SectionId; title: string; body: string }[] = [
  {
    section: 'intro',
    title: 'Accueil mobile InkFlow',
    body: 'Voici le nouvel écran d’accueil tel que vos artistes le voient sur téléphone : carte du jour, actions rapides, prochain RDV et indicateurs du mois.',
  },
  {
    section: 'header',
    title: 'Menu & raccourcis',
    body: 'Le menu (☰) ouvre toute la navigation (comme sur l’app réelle). À droite : accès rapide au planning, thème clair/sombre et notifications.',
  },
  {
    section: 'hero',
    title: 'Carte du jour',
    body: 'Photo de fond personnalisable (icône appareil). La date, votre prénom et le nom du studio s’affichent en un coup d’œil. Les pastilles résument les RDV du jour et les dossiers sans acompte.',
  },
  {
    section: 'quick',
    title: 'Actions rapides',
    body: 'Créer un RDV, ouvrir la galerie flash, la vitrine publique ou la file des demandes — les gestes du quotidien restent à portée de pouce.',
  },
  {
    section: 'next',
    title: 'Prochain rendez-vous',
    body: 'Le créneau suivant est mis en avant : client, projet, durée et heure. Un tap mène au détail (comme dans le tableau de bord connecté).',
  },
  {
    section: 'kpi',
    title: 'Indicateurs « Ce mois »',
    body: 'Revenu, acomptes, clients et RDV du mois. Les tendances (ex. vs mois dernier) aident à piloter l’activité. « Widgets » personnalise la grille sur le compte réel.',
  },
  {
    section: 'bottom',
    title: 'Barre de navigation',
    body: 'Accueil, Agenda, Demandes, Clients et Réglages : même logique que l’application mobile InkFlow pour ne jamais être à plus d’un tap de l’essentiel.',
  },
];

const HERO_IMG =
  'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=900&h=600&fit=crop&q=80';

function sectionForStep(step: number): SectionId {
  return STEPS[step]?.section ?? 'intro';
}

export const DemoMobilePhoneGuide: React.FC<DemoMobilePhoneGuideProps> = ({
  greetingName,
  studioLabel,
  dateLine,
  firstToday,
  todayCount,
  unpaidCount,
  monthlyRevenue,
  pendingDeposits,
  clientsCount,
  appointmentsThisMonth,
  getAvatar,
}) => {
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<Exclude<SectionId, 'intro'>, HTMLDivElement | null>>>({});

  const activeSection = sectionForStep(step);

  const scrollToSection = useCallback((id: Exclude<SectionId, 'intro'>) => {
    const el = sectionRefs.current[id];
    const root = scrollRef.current;
    if (!el || !root) return;
    const top = el.offsetTop - root.offsetTop - 12;
    root.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (activeSection === 'intro') {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    scrollToSection(activeSection);
  }, [activeSection, scrollToSection]);

  const ring = (id: Exclude<SectionId, 'intro'>) =>
    activeSection === id
      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 rounded-2xl transition-shadow duration-300 z-[1] relative'
      : 'rounded-2xl transition-shadow duration-300';

  const fmt = (n: number) =>
    n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  const s = STEPS[step];

  return (
    <section
      id="demo-mobile-maquette"
      className="mb-8 sm:mb-10 scroll-mt-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 sm:p-6 md:p-8 shadow-sm"
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-10">
        {/* Guide */}
        <div className="flex-1 min-w-0 order-2 lg:order-1 space-y-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Smartphone className="w-5 h-5 flex-shrink-0" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-widest">Démo interactive</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Téléphone + guide — nouveau design mobile
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Faites défiler les étapes pour comprendre chaque zone de l’écran d’accueil. C’est une maquette fidèle au rendu produit ; le vrai compte offre en plus les widgets
            configurables.
          </p>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/50 p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
              Étape {step + 1} / {STEPS.length}
            </p>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">{s.title}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{s.body}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStep((x) => Math.max(0, x - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.98]"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
              Précédent
            </button>
            <button
              type="button"
              onClick={() => setStep((x) => Math.min(STEPS.length - 1, x + 1))}
              disabled={step >= STEPS.length - 1}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.98]"
            >
              Suivant
              <ChevronRight className="w-4 h-4" aria-hidden />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Aller à l’étape ${i + 1}`}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-8 bg-blue-600' : 'w-2 bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Phone */}
        <div className="flex justify-center lg:justify-end order-1 lg:order-2 flex-shrink-0">
          <div
            className={`relative w-[min(100%,340px)] transition-[box-shadow] duration-300 ${
              activeSection === 'intro' ? 'ring-4 ring-blue-500/40 rounded-[2.75rem] ring-offset-4 ring-offset-zinc-100 dark:ring-offset-zinc-900' : ''
            }`}
          >
            <div className="rounded-[2.75rem] bg-zinc-900 p-2.5 sm:p-3 shadow-2xl shadow-zinc-900/40">
              <div className="flex justify-center pt-1 pb-2">
                <div className="h-6 w-[88px] rounded-full bg-black/80" aria-hidden />
              </div>
              <div
                ref={scrollRef}
                className="relative max-h-[min(72vh,640px)] overflow-y-auto overflow-x-hidden rounded-[2rem] bg-white text-zinc-900"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {/* —— Mobile chrome —— */}
                <div
                  ref={(el) => {
                    sectionRefs.current.header = el;
                  }}
                  className={`sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-zinc-100 px-3 py-2.5 ${ring('header')}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Menu"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-center min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-white tracking-tight">
                          IF
                        </div>
                        <span className="font-bold text-sm truncate">InkFlow</span>
                      </div>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                        Accueil
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="p-2 rounded-xl text-zinc-500 min-w-[40px] min-h-[40px] flex items-center justify-center">
                        <CalendarCheck className="w-[18px] h-[18px]" />
                      </span>
                      <span className="p-2 rounded-xl text-zinc-500 min-w-[40px] min-h-[40px] flex items-center justify-center">
                        <Moon className="w-[18px] h-[18px]" />
                      </span>
                      <span className="p-2 rounded-xl text-zinc-500 relative min-w-[40px] min-h-[40px] flex items-center justify-center">
                        <Bell className="w-[18px] h-[18px]" />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-3 pb-24 pt-3 space-y-4">
                  {/* Hero */}
                  <div
                    ref={(el) => {
                      sectionRefs.current.hero = el;
                    }}
                    className={`overflow-hidden ${ring('hero')}`}
                  >
                    <div className="relative h-[168px] rounded-2xl overflow-hidden">
                      <img
                        src={HERO_IMG}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                      <button
                        type="button"
                        className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-white/20 text-white backdrop-blur-sm"
                        aria-label="Personnaliser le fond"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <p className="text-[11px] font-medium opacity-90 capitalize">{dateLine}</p>
                        <p className="text-lg font-bold leading-tight">
                          Bon après-midi, {greetingName.split(' ')[0]}
                        </p>
                        <p className="text-xs opacity-80 mt-0.5">{studioLabel}</p>
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-zinc-900 text-[11px] font-semibold shadow-sm">
                            <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
                            {todayCount} RDV aujourd&apos;hui
                          </span>
                          {unpaidCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-semibold shadow-sm">
                              <AlertCircle className="w-3.5 h-3.5 opacity-90" />
                              {unpaidCount} sans acompte
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick */}
                  <div
                    ref={(el) => {
                      sectionRefs.current.quick = el;
                    }}
                    className={`flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5 ${ring('quick')}`}
                  >
                    {[
                      { icon: Plus, label: 'Nouveau RDV', dark: true },
                      { icon: Zap, label: 'Flash' },
                      { icon: ExternalLink, label: 'Vitrine' },
                      { icon: Inbox, label: 'Demandes' },
                    ].map(({ icon: Icon, label, dark }) => (
                      <button
                        key={label}
                        type="button"
                        className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl min-w-[76px] border shadow-sm transition-transform active:scale-[0.97] ${
                          dark
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-white text-zinc-800 border-zinc-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-semibold text-center leading-tight">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Next apt */}
                  <div
                    ref={(el) => {
                      sectionRefs.current.next = el;
                    }}
                    className={ring('next')}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2 px-0.5">
                      À venir
                    </p>
                    {firstToday ? (
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-zinc-200 bg-white shadow-sm text-left"
                      >
                        <img
                          src={getAvatar(firstToday.clientName || '')}
                          alt=""
                          className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 truncate">{firstToday.clientName}</p>
                          <p className="text-xs text-zinc-500 truncate">{firstToday.service}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{firstToday.duration} min</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-sm font-bold tabular-nums text-zinc-900">{firstToday.time}</span>
                          <ChevronRight className="w-4 h-4 text-zinc-300" />
                        </div>
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
                        Aucun RDV aujourd&apos;hui dans la démo
                      </div>
                    )}
                  </div>

                  {/* KPI */}
                  <div ref={(el) => { sectionRefs.current.kpi = el; }} className={ring('kpi')}>
                    <div className="flex items-center justify-between mb-3 px-0.5">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Ce mois</p>
                        <p className="text-sm font-semibold text-zinc-900">Indicateurs clés</p>
                      </div>
                      <div className="flex gap-1">
                        <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-zinc-100 text-zinc-600 flex items-center gap-1">
                          <LayoutGrid className="w-3 h-3" /> Widgets
                        </span>
                        <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-zinc-900 text-white">
                          Tout
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-2xl border border-zinc-200 p-3 bg-zinc-50/50">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[11px] font-medium text-zinc-500">Revenu du mois</span>
                          <span className="p-1 rounded-lg bg-blue-50 text-blue-600">
                            <ChevronRight className="w-3.5 h-3.5 rotate-[-45deg]" />
                          </span>
                        </div>
                        <p className="text-lg font-bold tabular-nums">{fmt(monthlyRevenue)} €</p>
                        <p className="text-[10px] text-red-500 font-medium mt-1">↓ 42 % vs mois dernier</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 p-3 bg-zinc-50/50">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[11px] font-medium text-zinc-500">Acomptes</span>
                          <span className="p-1 rounded-lg bg-violet-50 text-violet-600">
                            <ChevronRight className="w-3.5 h-3.5 rotate-[-45deg]" />
                          </span>
                        </div>
                        <p className="text-lg font-bold tabular-nums">{fmt(pendingDeposits)} €</p>
                        <p className="text-[10px] text-violet-600 font-medium mt-1">En attente</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 p-3 bg-zinc-50/50">
                        <span className="text-[11px] font-medium text-zinc-500">Clients</span>
                        <p className="text-lg font-bold tabular-nums mt-1">{clientsCount}</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 p-3 bg-zinc-50/50">
                        <span className="text-[11px] font-medium text-zinc-500">RDV ce mois</span>
                        <p className="text-lg font-bold tabular-nums mt-1">{appointmentsThisMonth}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom nav */}
                <div
                  ref={(el) => {
                    sectionRefs.current.bottom = el;
                  }}
                  className={`sticky bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-around items-center ${ring('bottom')}`}
                >
                  {[
                    { icon: Home, label: 'Accueil', active: true },
                    { icon: Calendar, label: 'Agenda' },
                    { icon: Inbox, label: 'Demandes' },
                    { icon: Users, label: 'Clients' },
                    { icon: Settings, label: 'Réglages' },
                  ].map(({ icon: Icon, label, active }) => (
                    <div
                      key={label}
                      className={`flex flex-col items-center gap-0.5 py-2 px-1.5 min-w-[52px] rounded-xl ${
                        active ? 'text-blue-600' : 'text-zinc-400'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? '' : 'opacity-80'}`} />
                      <span className="text-[9px] font-semibold">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
