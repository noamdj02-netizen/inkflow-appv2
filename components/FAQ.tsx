import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "Comment fonctionne l'essai gratuit ?",
    answer:
      "Vous pouvez tester InkFlow pendant 14 jours sans engagement. Aucune carte bancaire n'est requise pour commencer. À la fin de l'essai, vous choisissez le plan qui vous convient.",
  },
  {
    question: 'Puis-je connecter mon compte Stripe existant ?',
    answer:
      "Oui, InkFlow s'intègre directement avec Stripe Connect. Connectez votre compte en quelques clics et encaissez les acomptes en ligne. Les fonds vont sur votre compte selon les délais Stripe.",
  },
  {
    question: 'Mes clients peuvent-ils réserver en dehors de mes horaires ?',
    answer:
      "Ils choisissent un créneau parmi ceux que vous ouvrez (page /book, vitrine, demandes). Vous gardez le contrôle : horaires, jours off, politique d'acompte et confirmation du RDV côté studio.",
  },
  {
    question: 'Comment fonctionne la galerie Flash ?',
    answer:
      "Publiez vos flashs avec photos et prix. Vos clients les consultent, réservent un créneau et payent l'acompte si vous l'activez. Vous suivez tout depuis le dashboard (Demandes, RDV, clients).",
  },
  {
    question: 'Où vont les données de mes clients (RGPD) ?',
    answer:
      "Hébergement sur infrastructure européenne (Supabase) avec accès chiffré. Vous pouvez exiger consentement, questionnaire santé et messages conformément à votre politique. Nous n'utilisons pas Google Analytics par défaut sur l'app — les stats produit passent par des outils activés seulement avec votre accord cookies.",
  },
  {
    question: 'Comment contacter le support ?',
    answer:
      "Depuis l'app, lien Aide, mail support@ink-flow.me, ou le bouton Contact dans le menu. Pour un bug, précisez votre navigateur, l'URL et une capture d'écran si possible.",
  },
  {
    question: 'Puis-je annuler mon abonnement ?',
    answer:
      "Oui, sans engagement de durée. Annulation depuis les paramètres. Vos données restent exportables : nous recommandons d'exporter le CRM avant la fin de période.",
  },
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 px-2 tracking-tight">
            Questions fréquentes
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 px-2">
            Tout ce que vous devez savoir sur InkFlow
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-neutral-200/80 rounded-2xl overflow-hidden hover:border-neutral-300 transition-colors duration-200"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left min-h-[44px]"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
              >
                <span className="font-semibold text-neutral-900 dark:text-[var(--text-primary)]">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-neutral-500 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-5 pt-0">
                  <p className="text-neutral-600 dark:text-[var(--text-secondary)] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
