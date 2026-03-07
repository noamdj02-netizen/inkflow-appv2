import React from 'react';
import {
  Menu,
  Moon,
  Bell,
  Plus,
  Inbox,
  Image,
  LayoutGrid,
  Calendar,
  ChevronRight,
  LayoutDashboard,
  User,
} from 'lucide-react';
import { getAvatarPlaceholder } from '../../lib/avatar-placeholders';

/** Réplique exacte du dashboard hero en mode démo pour la landing */
export const DashboardDemo: React.FC = () => {
  const upcoming = [
    { name: 'Jeanne Martin', status: 'EN ATTENTE', date: '8 mars' },
    { name: 'Noam Brochet', status: 'CONFIRMÉ', date: '9 mars' },
    { name: 'Noam Brochet', status: 'CONFIRMÉ', date: '9 mars' },
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xl bg-white max-w-[360px] mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <button className="p-2 -ml-2 rounded-lg hover:bg-neutral-50 text-neutral-600">
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg hover:bg-neutral-50 text-neutral-600">
            <Moon className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button className="relative p-2 rounded-lg hover:bg-neutral-50 text-neutral-600">
            <Bell className="w-5 h-5" strokeWidth={1.5} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
          </button>
          <img
            src={getAvatarPlaceholder(0)}
            alt="Profil"
            className="w-8 h-8 rounded-full object-cover ml-1"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        <p className="text-[13px] font-medium text-neutral-500 mb-1">jeu. 5 mars</p>
        <h2 className="text-2xl font-bold text-neutral-900 mb-1">Bonjour Noam 👋</h2>
        <p className="text-base font-medium text-neutral-500 mb-4">Comment puis-je vous aider aujourd&apos;hui ?</p>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold">
            <Plus className="w-4 h-4" strokeWidth={2} /> Nouveau RDV
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 text-sm font-medium hover:bg-neutral-50">
            <Inbox className="w-4 h-4" strokeWidth={1.5} /> Demandes
            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold">1</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 text-sm font-medium hover:bg-neutral-50">
            <Image className="w-4 h-4" strokeWidth={1.5} /> Ma vitrine
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 text-sm font-medium hover:bg-neutral-50">
            <LayoutGrid className="w-4 h-4" strokeWidth={1.5} /> + Widget
          </button>
        </div>

        {/* Info card */}
        <div className="flex items-center justify-between p-4 mb-4 rounded-xl bg-neutral-50 border border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-200 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-neutral-600" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-neutral-700">14 RDV sans acompte payé</span>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
        </div>

        {/* Mes Rendez-vous */}
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <span className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900">
              <Calendar className="w-5 h-5 text-neutral-500" strokeWidth={1.5} /> Mes Rendez-vous
            </span>
            <button className="p-1.5 rounded-lg hover:bg-neutral-50 text-neutral-500">
              <Plus className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white text-[11px] font-bold">AUJOURD&apos;HUI</span>
              <span className="text-[13px] text-neutral-500">• 0 RDV</span>
            </div>
            <p className="text-sm text-neutral-500 mb-4">Aucun RDV aujourd&apos;hui</p>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-md bg-neutral-200 text-neutral-600 text-[11px] font-bold">À VENIR</span>
              <span className="text-[13px] text-neutral-500">• 29 RDV</span>
            </div>
            <div className="space-y-2">
              {upcoming.map((apt, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-neutral-900">{apt.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      apt.status === 'CONFIRMÉ' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {apt.status}
                    </span>
                    <span className="text-xs font-medium text-neutral-500">{apt.date}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
              <Plus className="w-4 h-4" strokeWidth={2} /> Ajouter un RDV
            </button>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-around py-2 px-4 bg-white border-t border-neutral-200">
        <button className="flex flex-col items-center gap-0.5 text-blue-600">
          <LayoutDashboard className="w-6 h-6" strokeWidth={2} />
          <span className="text-[11px] font-semibold">Accueil</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-neutral-400">
          <Calendar className="w-6 h-6" strokeWidth={1.5} />
          <span className="text-[11px] font-medium">Agenda</span>
        </button>
        <button className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-neutral-900 text-white shadow-lg">
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
        <button className="relative flex flex-col items-center gap-0.5 text-neutral-400">
          <Inbox className="w-6 h-6" strokeWidth={1.5} />
          <span className="absolute -top-0.5 right-1/2 translate-x-3 w-2 h-2 rounded-full bg-blue-600" />
          <span className="text-[11px] font-medium">Demandes</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-neutral-400">
          <User className="w-6 h-6" strokeWidth={1.5} />
          <span className="text-[11px] font-medium">Profil</span>
        </button>
      </div>
    </div>
  );
};
