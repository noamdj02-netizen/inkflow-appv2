import React from 'react';
import { Calendar, CreditCard, Users, Zap, Shield, Clock, TrendingUp, Sparkles } from 'lucide-react';

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
          <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-indigo-100/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-300 border border-indigo-100/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200 rounded-full blur-3xl opacity-30" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Réservations en ligne 24/7</h3>
              <p className="text-neutral-700 mb-6 max-w-lg">
                Vos clients réservent directement en ligne, même quand vous dormez.
                Calendrier synchronisé, notifications automatiques, et rappels SMS.
              </p>
              <div className="bg-white rounded-xl p-4 inline-block shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold">15 nouvelles réservations cette semaine</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden group hover:shadow-xl hover:shadow-neutral-900/20 transition-all duration-300">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Paiements Stripe</h3>
              <p className="text-neutral-300 mb-4">
                Encaissez les acomptes automatiquement. Fini les no-shows !
              </p>
              <div className="text-3xl font-bold">€250k+</div>
              <div className="text-sm text-neutral-400">traités ce mois</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-300 border border-purple-100/50">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-200 rounded-full blur-3xl opacity-30" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Galerie Flash</h3>
              <p className="text-neutral-700 mb-4 text-sm sm:text-base">
                Publiez vos flashs avec prix. Vos clients réservent en 2 clics.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold mb-4 border border-emerald-100/80">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Exemple de galerie
              </div>
              <div className="flex gap-2 sm:gap-3">
                {[
                  { src: '/gallery/tattoo-1.png', alt: 'Tatouage iris - épaule et bras' },
                  { src: '/gallery/tattoo-2.png', alt: 'Tatouage léopard - bras' },
                  { src: '/gallery/tattoo-3.png', alt: 'Tatouage botanique - nuque' },
                ].map((img, i) => (
                  <img
                    key={i}
                    src={img.src}
                    alt={img.alt}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl shadow-md border border-white/80 hover:scale-105 transition-transform flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-900/5 transition-all duration-300">
            <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-neutral-900" />
            </div>
            <h3 className="text-xl font-bold mb-3">CRM Client</h3>
            <p className="text-neutral-700 mb-4">
              Historique complet, notes privées, photos des tatouages précédents.
            </p>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <TrendingUp className="w-4 h-4" />
              <span>+40% de clients fidélisés</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-green-100/50">
            <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Automatisation</h3>
            <p className="text-neutral-700 mb-4">
              Confirmations, rappels, et formulaires de consentement automatiques.
            </p>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="font-semibold">5h gagnées par semaine</span>
            </div>
          </div>

          <div className="md:col-span-2 bg-gradient-to-r from-orange-50 to-red-50/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-orange-100/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
              <div>
                <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Sécurisé et Conforme</h3>
                <p className="text-neutral-700 mb-4">
                  Hébergement européen, RGPD compliant, backup automatique.
                  Vos données et celles de vos clients sont protégées.
                </p>
              </div>
              <div className="space-y-3">
                {['SSL/TLS chiffrement', 'Backup quotidien', 'Conformité RGPD', 'Support 7j/7'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium">{item}</span>
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
