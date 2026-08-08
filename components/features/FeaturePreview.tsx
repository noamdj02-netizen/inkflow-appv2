import React from 'react';
import {
  MessageSquare,
  Calendar,
  Image,
  Users,
  Mail,
  Briefcase,
  DollarSign,
  Settings,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { DashboardDemo } from './DashboardDemo';
import { getAvatarPlaceholder } from '../../lib/avatar-placeholders';

interface FeaturePreviewProps {
  slug: string;
}

/** Mini previews du dashboard — morceaux réalistes pour chaque page fonctionnalité */
export const FeaturePreview: React.FC<FeaturePreviewProps> = ({ slug }) => {
  if (slug === 'vue-ensemble') {
    return <DashboardDemo />;
  }

  if (slug === 'demandes') {
    return (
      <div className="rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xl bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-neutral-900">Demandes en attente</span>
        </div>
        <div className="space-y-3">
          {[
            {
              name: 'Emma L.',
              service: 'Mandala dos',
              date: '8 mars',
              status: 'Nouvelle',
              avatar: getAvatarPlaceholder(0),
            },
            {
              name: 'Thomas D.',
              service: 'Carpe Koï',
              date: '9 mars',
              status: 'Nouvelle',
              avatar: getAvatarPlaceholder(1),
            },
          ].map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100"
            >
              <img
                src={r.avatar}
                alt={r.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 text-sm">{r.name}</p>
                <p className="text-xs text-neutral-500">
                  {r.service} • {r.date}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                {r.status}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">
            Accepter
          </button>
          <button className="flex-1 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-semibold">
            Refuser
          </button>
        </div>
      </div>
    );
  }

  if (slug === 'rendez-vous') {
    return (
      <div className="rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xl bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-neutral-900">Agenda</span>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, index) => (
            <div
              key={`${d}-${index}`}
              className="text-center text-xs font-semibold text-neutral-500 py-1"
            >
              {d}
            </div>
          ))}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((d) => (
            <div
              key={d}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm font-semibold ${
                d === 5 ? 'bg-blue-600 text-white' : 'bg-neutral-50 text-neutral-600'
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold">11:00 — Lucas M. (Carpe Koï)</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-sm">14:00 — Marie L. (Mandala)</span>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'galerie-flash') {
    const flashItems = [
      { name: 'Iris floral', price: '180€', status: 'Disponible', src: '/gallery/iris-floral.png' },
      { name: 'Léopard', price: '150€', status: 'Réservé', src: '/gallery/leopard.png' },
      { name: 'Carpe Koï', price: '220€', status: 'Disponible', src: '/gallery/carpe-koi.png' },
    ];
    return (
      <div className="rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xl bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-neutral-900">Galerie Flash</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {flashItems.map((f, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-neutral-200/80">
              <div className="aspect-square overflow-hidden bg-neutral-100">
                <img
                  src={f.src}
                  alt={f.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-2 bg-white">
                <p className="text-xs font-semibold text-neutral-900 truncate">{f.name}</p>
                <div className="flex justify-between items-center mt-0.5">
                  <span className="text-xs font-bold text-amber-600">{f.price}</span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      f.status === 'Réservé'
                        ? 'bg-neutral-200 text-neutral-600'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slug === 'clients') {
    return (
      <div className="rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xl bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-neutral-900">Clients</span>
        </div>
        <div className="space-y-3">
          {[
            {
              name: 'Lucas M.',
              info: '3 RDV • Prochain 14:00',
              status: 'Payé',
              avatar: getAvatarPlaceholder(2),
            },
            {
              name: 'Marie L.',
              info: '1 RDV • Prochain 16:30',
              status: 'En attente',
              avatar: getAvatarPlaceholder(3),
            },
          ].map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100"
            >
              <img
                src={c.avatar}
                alt={c.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900">{c.name}</p>
                <p className="text-xs text-neutral-500">{c.info}</p>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  c.status === 'Payé'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slug === 'messagerie') {
    return (
      <div className="rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xl bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-neutral-900">Messagerie</span>
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <img
              src={getAvatarPlaceholder(0)}
              alt="Client"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 bg-neutral-100 rounded-2xl rounded-tl-none px-3 py-2">
              <p className="text-sm text-neutral-700">
                Bonjour, je voudrais réserver le flash Iris pour samedi.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <div className="flex-1 max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-tr-none px-3 py-2 text-right">
              <p className="text-sm">Parfait ! Samedi 14h vous convient ?</p>
            </div>
            <img
              src={getAvatarPlaceholder(1)}
              alt="Artiste"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'portfolio') {
    const portfolioImages = [
      '/gallery/iris-floral.png',
      '/gallery/leopard.png',
      '/gallery/botanique.png',
      '/gallery/mandala.png',
      '/gallery/marguerite.png',
      '/gallery/carpe-koi.png',
    ];
    return (
      <div className="rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xl bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-neutral-900">Portfolio</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {portfolioImages.map((src, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-neutral-100">
              <img
                src={src}
                alt={`Tatouage ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slug === 'finance') {
    return (
      <div className="rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xl bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-neutral-900">Revenus</span>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-xs font-semibold text-neutral-500 uppercase">Ce mois</p>
            <p className="text-2xl font-bold text-amber-600">2 340€</p>
            <p className="text-sm text-emerald-600 flex items-center gap-1 mt-1">
              <span>↑</span> +18% vs mois dernier
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
              <p className="text-xs text-neutral-500">Aujourd&apos;hui</p>
              <p className="font-bold text-neutral-900">450€</p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
              <p className="text-xs text-neutral-500">Cette semaine</p>
              <p className="font-bold text-neutral-900">1 120€</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'parametres') {
    return (
      <div className="rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xl bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-neutral-900">Paramètres</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            <span className="text-sm font-medium text-neutral-700">Horaires</span>
            <span className="text-xs text-neutral-500">Lun-Ven 10h-19h</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            <span className="text-sm font-medium text-neutral-700">Stripe</span>
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" /> Connecté
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-neutral-700">Services</span>
            <span className="text-xs text-neutral-500">3 configurés</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
