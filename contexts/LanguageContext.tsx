import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'inkflow_lang';

export type Lang = 'fr' | 'en';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const translations: Record<Lang, Record<string, string>> = {
  fr: {
    // Nav
    'nav.overview': "Vue d'ensemble",
    'nav.requests': 'Demandes',
    'nav.appointments': 'Rendez-vous',
    'nav.flash': 'Galerie Flash',
    'nav.clients': 'Clients',
    'nav.messaging': 'Messagerie',
    'nav.portfolio': 'Portfolio',
    'nav.finance': 'Finance',
    'nav.settings': 'Paramètres',
    'nav.more': 'Plus',
    'nav.login': 'Connexion',
    'nav.demo': 'Démo',
    'nav.features': 'Fonctionnalités',
    'nav.pricing': 'Tarifs',
    'nav.reviews': 'Avis',
    'nav.trial': 'Essai gratuit',
    // Hero
    'hero.badge': 'Pour les tatoueurs',
    'hero.title': 'Organise ton studio sans te prendre la tête.',
    'hero.subtitle':
      'Réservations, messages, acomptes : un seul fil. Moins de ping-pong, plus de temps à la machine.',
    'hero.feature1': 'Réservations & acomptes en ligne',
    'hero.feature2': 'CRM clients & galerie flash',
    'hero.feature3': 'Facturation & bilans PDF',
    'hero.cta1': "Commencer l'essai gratuit",
    'hero.cta2': 'Voir la démo',
    'hero.social': "Des centaines de studios s'en servent au quotidien",
    'hero.socialBadge': '+1 240€ de revenus en moyenne par utilisateur ce mois-ci',
    'hero.avatarAlt': 'Avatar tatoueur',
    'hero.badgeNewRdv': '+1 Nouveau RDV !',
    'landing.features.title': 'Fonctionnalités clés',
    'landing.features.subtitle':
      'Agenda, CRM, paiements Stripe et vitrine — des captures réelles du produit, pas des graphiques génériques.',
    'landing.features.key1': 'Prise de rendez-vous intelligente',
    'landing.features.key2': 'Messagerie intégrée',
    'landing.features.key3': 'Portfolio & Galerie Flash',
    'landing.features.key4': 'Facturation simplifiée',
    'landing.app.title': "Téléchargez l'application gratuite",
    'landing.app.subtitle': 'Gérez votre studio partout, même hors ligne',
    'landing.app.appStore': 'App Store',
    'landing.app.googlePlay': 'Google Play',
    'footer.legal': 'Mentions légales',
    'footer.termsShort': 'CGU',
    'footer.contact': 'Contact',
    // Features detail
    'features.section1.title': 'Moins de friction entre la demande et le créneau',
    'features.section1.desc':
      "Les demandes arrivent au même endroit. Tu réponds, l'acompte part sur Stripe, le créneau se bloque. Pas besoin d'être dev.",
    'features.section1.f1': 'Réservations illimitées',
    'features.section1.f2': 'Paiements Stripe intégrés',
    'features.section1.f3': 'Clients CRM illimités',
    'features.section1.f4': 'Statistiques avancées',
    'features.section1.visualTitle': 'Évolution',
    'features.section1.v1': 'Réservations',
    'features.section1.v2': 'Acomptes',
    'features.section1.v3': 'Flash',
    'features.section2.title': 'CRM client et fidélisation en un seul endroit',
    'features.section2.desc':
      "Centralisez l'historique de chaque client : rendez-vous, notes de session, préférences. Suivez la cicatrisation et fidélisez vos clients avec des rappels personnalisés.",
    'features.section2.f1': 'Fiches clients complètes',
    'features.section2.f2': 'Notes et suivi de cicatrisation',
    'features.section2.f3': 'Rappels automatiques personnalisés',
    'features.section2.f4': 'Historique des paiements',
    'features.section2.visualTitle': 'Clients récents',
    'features.section2.v1': 'Lucas M. — 3 RDV • Prochain 14:00',
    'features.section2.v2': 'Marie L. — 1 RDV • Prochain 16:30',
    'features.section2.v3': 'Emma L. — Nouvelle demande',
    'features.section3.title': 'Paiements sécurisés et automatisation des acomptes',
    'features.section3.desc':
      'Stripe intégré de bout en bout. Envoyez des liens de paiement en un clic, encaissez les acomptes avant le RDV et réduisez les no-shows.',
    'features.section3.f1': 'Liens de paiement Stripe',
    'features.section3.f2': 'Paiements sécurisés PCI',
    'features.section3.f3': 'Confirmation automatique',
    'features.section3.f4': 'Relances acomptes non payés',
    'features.section3.visualTitle': 'Ce mois',
    'features.section3.v1': 'Revenus',
    'features.section3.v2': 'Acomptes encaissés',
    'features.section3.v3': 'Taux de conversion',
    'features.section3.val1': '2 340 €',
    'features.section3.val2': '18',
    'features.section3.val3': '94 %',
    'features.section4.title': 'Vitrine en ligne et galerie flash pour vendre vos designs',
    'features.section4.desc':
      "Publiez votre portfolio et vos flashs. Vos clients découvrent vos créations, réservent en ligne et paient l'acompte. Le design est bloqué automatiquement après paiement.",
    'features.section4.f1': 'Galerie flash avec statut',
    'features.section4.f2': 'Page vitrine personnalisable',
    'features.section4.f3': 'Blocage auto après réservation',
    'features.section4.f4': 'Acompte en ligne intégré',
    'features.section4.visualTitle': 'Galerie Flash',
    'features.section4.v1': 'Iris floral — 180 € • Disponible',
    'features.section4.v2': 'Léopard — 150 € • Réservé',
    'features.section4.v3': 'Carpe Koï — 220 € • Disponible',
    'features.file1': 'Rapport mensuel.pdf',
    'features.file2': 'Clients actifs.xls',
    'features.file3': 'Acomptes Stripe.doc',
    // How Inkflow
    'how.badge': 'Fonctionnalités',
    'how.title': "Ce qu'Inkflow fait pour toi au quotidien",
    'how.item1.title': "Gestion d'agenda fluide",
    'how.item1.text': 'Réservations, acomptes Stripe et rappels automatiques.',
    'how.item2.title': 'CRM client puissant',
    'how.item2.text': 'Profils complets, notes de session et suivi de cicatrisation.',
    'how.item3.title': 'Galerie Flash unique',
    'how.item3.text': 'Vendez vos designs exclusifs et bloquez les flashs uniques après paiement.',
    // Process
    'process.title': 'Prêt en moins de 15 minutes',
    'process.subtitle': "De l'inscription au premier RDV, ça tient en un café",
    'process.step1.title': 'Créez votre compte',
    'process.step1.desc': "Inscription en 2 minutes. Aucune carte bancaire requise pour l'essai.",
    'process.step1.duration': '2 min',
    'process.step2.title': 'Configurez votre studio',
    'process.step2.desc': 'Ajoutez vos horaires, services, et connectez Stripe pour les paiements.',
    'process.step2.duration': '10 min',
    'process.step3.title': 'Partagez votre lien',
    'process.step3.desc':
      'Envoyez votre lien de réservation à vos clients sur Instagram, WhatsApp...',
    'process.step3.duration': '1 min',
    'process.step4.title': 'Recevez vos réservations',
    'process.step4.desc':
      'Vos clients réservent 24/7. Vous êtes notifié et les acomptes arrivent automatiquement.',
    'process.step4.duration': 'Automatique',
    'process.settings': 'Paramètres',
    'process.linkCopied': 'Lien copié !',
    'process.newRdv': '+1 Nouveau RDV',
    'process.cta1': 'Commencer maintenant',
    'process.cta2': 'Voir la démo',
    'process.trial': 'Essai gratuit 1 mois • Pas de carte bancaire requise',
    'hero.trialTrust': "1 mois d'essai gratuit",
    // Pricing
    'pricing.title': 'Le logiciel résa pour tatoueurs — pas un généraliste salons',
    'pricing.subtitle':
      'Une promesse précise : demandes, créneaux, acomptes Stripe et dossier client au même endroit. Pas une usine logicielle.',
    'pricing.monthly': 'Mensuel',
    'pricing.annual': 'Annuel',
    'pricing.perMonth': '/mois',
    'pricing.billed': 'Facturé €{amount} par an',
    'pricing.mostPopular': 'Plus populaire',
    'pricing.soloDesc': 'Indépendants — même socle produit InkFlow avec plafonds légers.',
    'pricing.proDesc':
      'Petits collectifs qui dépassent 1 siège — multi-cal., stats fines & thème premium inclus.',
    'pricing.studioDesc': 'Volumes larges ou besoin réel de branchements API / intégrations.',
    'pricing.start': 'Commencer',
    'pricing.custom': 'Sur mesure',
    'pricing.f1': 'Réservations illimitées',
    'pricing.f2': 'Paiements Stripe + PayPal',
    'pricing.f3': 'Galerie Flash & vitrine publique',
    'pricing.f4': '100 clients CRM',
    'pricing.f5': 'Support email',
    'pricing.f6': 'Application mobile',
    'pricing.f7': 'Socle Solo (plafonds relevés) + multi-calendriers',
    'pricing.f8': '3 artistes inclus',
    'pricing.f9': '300 clients CRM',
    'pricing.f10': 'Multi-calendriers',
    'pricing.f11': 'Statistiques avancées',
    'pricing.f12': 'Support prioritaire',
    'pricing.f13': 'Exactement tout ce que débloque Pro aujourd’hui',
    'pricing.f14': '5 artistes inclus',
    'pricing.f15': 'Clients CRM illimités',
    'pricing.f16': 'Priorité onboarding & équipe-support élargie',
    'pricing.f17': 'Accès développeurs (API InkFlow)',
    'pricing.trial14': "1 mois d'essai gratuit",
    'pricing.cancelAnytime': 'Annulation à tout moment',
    'pricing.noCommitment': "Pas d'engagement",
    // Testimonials
    'testimonials.badge': '4.9/5 sur 200+ avis',
    'testimonials.title': 'Ils nous font confiance',
    'testimonials.subtitle': 'Ils l’utilisent pour sérieux, pas pour la déco',
    'testimonials.quote1':
      'La galerie flash m’a évité des tonnes de « t’as encore ce motif ? ». Les gens réservent quand c’est dispo, point.',
    'testimonials.quote2':
      'J’ai l’historique sans fouiller trois apps. Les notes de séance, les paiements : au même endroit.',
    'testimonials.quote3':
      'C’est pensé pour un atelier, pas pour un SaaS générique. Quand je bloque, le support répond vite.',
    'testimonials.quote4':
      'Les résas qui s’ajoutent toutes seules, ça m’a enlevé un paquet d’admin le dimanche soir.',
    'testimonials.prev': 'Témoignage précédent',
    'testimonials.next': 'Témoignage suivant',
    'testimonials.goTo': 'Aller au témoignage',
    // FAQ
    'faq.title': 'Questions & Réponses',
    'faq.q1': "Qu'est-ce que l'assistant IA Inkflow ?",
    'faq.a1':
      'Il te propose des brouillons et des créneaux quand une demande arrive. Tu relis, tu envoies. Rien ne part sans ton accord.',
    'faq.q2': 'Comment fonctionnent les paiements Stripe et PayPal ?',
    'faq.a2':
      "Inkflow utilise Stripe Checkout. Vos clients paient l'acompte en ligne lors de la réservation, par carte et PayPal si PayPal est activé dans votre compte Stripe. Les fonds arrivent sur votre compte Stripe en quelques jours.",
    'faq.q3': 'Quelle est la différence entre Solo, Pro et Studio ?',
    'faq.a3':
      'Solo conserve tout le socle métier réservation · paiements · vitrine jusqu’aux plafonds annoncés (1 siège / 100 fiches CRM) sans encore activer multi-calendriers étendus, statistiques avancées ou thème vitrine premium. Pro élève vos plafonds (3 sièges · 300 fiches) et débloque ces trois briques. Studio reprend Pro, passe à cinq sièges, CRM sans plafond sur notre grille et uniquement alors l’accès développeurs (API InkFlow documentée).',
    'faq.q4': 'Puis-je gérer mon propre portail client ?',
    'faq.a4':
      "Oui. Chaque client dispose d'un espace personnel pour voir ses rendez-vous, ses messages et l'historique de ses tatouages. Vous contrôlez les accès depuis votre dashboard.",
    'faq.q5': 'Comment est gérée la galerie flash unique ?',
    'faq.a5':
      "Publiez vos flashs avec photos et prix. Une fois qu'un client paie l'acompte pour un flash, il est automatiquement bloqué et retiré de la galerie publique. Plus de double réservation.",
    // Footer
    'footer.cta': 'Tester sur mon studio',
    'footer.emailPlaceholder': 'ton@email.fr',
    'footer.signup': 'Créer mon espace Inkflow',
    'footer.explore': 'Explore',
    'footer.product': 'Product',
    'footer.gallery': 'Gallery',
    'footer.pricing': 'Plans & Tarifs',
    'footer.flash': 'Flash',
    'footer.portfolio': 'Portfolio',
    'footer.privacy': 'Politique de confidentialité',
    'footer.terms': "Conditions d'utilisation",
    'footer.copyright': 'Tous droits réservés.',
    'footer.copyrightYear': '© 2024 InkFlow',
  },
  en: {
    'nav.overview': 'Overview',
    'nav.requests': 'Requests',
    'nav.appointments': 'Appointments',
    'nav.flash': 'Flash Gallery',
    'nav.clients': 'Clients',
    'nav.messaging': 'Messaging',
    'nav.portfolio': 'Portfolio',
    'nav.finance': 'Finance',
    'nav.settings': 'Settings',
    'nav.more': 'More',
    'nav.login': 'Login',
    'nav.demo': 'Demo',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.reviews': 'Reviews',
    'nav.trial': 'Free trial',
    'hero.badge': 'For tattoo artists',
    'hero.title': 'Run your studio without the busywork.',
    'hero.subtitle':
      'Bookings, messages, deposits: one thread. Less back-and-forth, more time at the machine.',
    'hero.feature1': 'Online bookings & deposits',
    'hero.feature2': 'Client CRM & flash gallery',
    'hero.feature3': 'Invoicing & PDF reports',
    'hero.cta1': 'Start free trial',
    'hero.cta2': 'Watch demo',
    'hero.social': 'Hundreds of studios use it day in, day out',
    'hero.socialBadge': '+1,240€ average revenue per user this month',
    'hero.avatarAlt': 'Tattoo artist avatar',
    'hero.badgeNewRdv': '+1 New Appointment!',
    'landing.features.title': 'Key features',
    'landing.features.subtitle':
      'Calendar, CRM, Stripe payments, and your public studio page — real product screens, not generic charts.',
    'landing.features.key1': 'Smart appointment booking',
    'landing.features.key2': 'Integrated messaging',
    'landing.features.key3': 'Portfolio & Flash Gallery',
    'landing.features.key4': 'Simplified billing',
    'landing.app.title': 'Download the free app',
    'landing.app.subtitle': 'Manage your studio anywhere, even offline',
    'landing.app.appStore': 'App Store',
    'landing.app.googlePlay': 'Google Play',
    'features.section1.title': 'Less friction from inquiry to time slot',
    'features.section1.desc':
      'Requests land in one place. You reply, the deposit goes through Stripe, the slot locks. No engineering degree required.',
    'features.section1.f1': 'Unlimited bookings',
    'features.section1.f2': 'Integrated Stripe payments',
    'features.section1.f3': 'Unlimited CRM clients',
    'features.section1.f4': 'Advanced statistics',
    'features.section1.visualTitle': 'Evolution',
    'features.section1.v1': 'Bookings',
    'features.section1.v2': 'Deposits',
    'features.section1.v3': 'Flash',
    'features.section2.title': 'Client CRM and loyalty in one place',
    'features.section2.desc':
      "Centralize each client's history: appointments, session notes, preferences. Track healing and retain clients with personalized reminders.",
    'features.section2.f1': 'Complete client profiles',
    'features.section2.f2': 'Notes and healing tracking',
    'features.section2.f3': 'Personalized automatic reminders',
    'features.section2.f4': 'Payment history',
    'features.section2.visualTitle': 'Recent clients',
    'features.section2.v1': 'Lucas M. — 3 appts • Next 2:00 PM',
    'features.section2.v2': 'Marie L. — 1 appt • Next 4:30 PM',
    'features.section2.v3': 'Emma L. — New request',
    'features.section3.title': 'Secure payments and deposit automation',
    'features.section3.desc':
      'Stripe integrated end-to-end. Send payment links in one click, collect deposits before appointments and reduce no-shows.',
    'features.section3.f1': 'Stripe payment links',
    'features.section3.f2': 'PCI secure payments',
    'features.section3.f3': 'Automatic confirmation',
    'features.section3.f4': 'Unpaid deposit reminders',
    'features.section3.visualTitle': 'This month',
    'features.section3.v1': 'Revenue',
    'features.section3.v2': 'Deposits collected',
    'features.section3.v3': 'Conversion rate',
    'features.section3.val1': '€2,340',
    'features.section3.val2': '18',
    'features.section3.val3': '94%',
    'features.section4.title': 'Online showcase and flash gallery to sell your designs',
    'features.section4.desc':
      'Publish your portfolio and flash designs. Clients discover your work, book online and pay the deposit. The design is automatically locked after payment.',
    'features.section4.f1': 'Flash gallery with status',
    'features.section4.f2': 'Customizable showcase page',
    'features.section4.f3': 'Auto-lock after booking',
    'features.section4.f4': 'Integrated online deposit',
    'features.section4.visualTitle': 'Flash Gallery',
    'features.section4.v1': 'Floral iris — €180 • Available',
    'features.section4.v2': 'Leopard — €150 • Booked',
    'features.section4.v3': 'Koi carp — €220 • Available',
    'features.file1': 'Monthly report.pdf',
    'features.file2': 'Active clients.xls',
    'features.file3': 'Stripe deposits.doc',
    'how.badge': 'Features',
    'how.title': 'What Inkflow does for you day to day',
    'how.item1.title': 'Smooth calendar management',
    'how.item1.text': 'Bookings, Stripe deposits and automatic reminders.',
    'how.item2.title': 'Powerful client CRM',
    'how.item2.text': 'Complete profiles, session notes and healing tracking.',
    'how.item3.title': 'Unique Flash Gallery',
    'how.item3.text': 'Sell your exclusive designs and lock unique flash after payment.',
    'process.title': 'Ready in under 15 minutes',
    'process.subtitle': 'From signup to first booking in about a coffee break',
    'process.step1.title': 'Create your account',
    'process.step1.desc': 'Sign up in 2 minutes. No credit card required for trial.',
    'process.step1.duration': '2 min',
    'process.step2.title': 'Configure your studio',
    'process.step2.desc': 'Add your hours, services, and connect Stripe for payments.',
    'process.step2.duration': '10 min',
    'process.step3.title': 'Share your link',
    'process.step3.desc': 'Send your booking link to clients on Instagram, WhatsApp...',
    'process.step3.duration': '1 min',
    'process.step4.title': 'Receive your bookings',
    'process.step4.desc': 'Clients book 24/7. You get notified and deposits arrive automatically.',
    'process.step4.duration': 'Automatic',
    'process.settings': 'Settings',
    'process.linkCopied': 'Link copied!',
    'process.newRdv': '+1 New Appointment',
    'process.cta1': 'Start now',
    'process.cta2': 'View demo',
    'process.trial': '1-month free trial • No credit card required',
    'hero.trialTrust': '1-month free trial',
    'pricing.title': 'Booking software built for tattoo studios',
    'pricing.subtitle':
      'Requests, slots, Stripe deposits, and client threads in one focused product — not generic salon software.',
    'pricing.monthly': 'Monthly',
    'pricing.annual': 'Annual',
    'pricing.perMonth': '/month',
    'pricing.billed': 'Billed €{amount}/year',
    'pricing.mostPopular': 'Most popular',
    'pricing.soloDesc': 'Independents — the same InkFlow core with softer limits.',
    'pricing.proDesc':
      'Growing teams needing multi-cal calendars, richer analytics & premium storefront themes.',
    'pricing.studioDesc':
      'High volume or legitimate need for integrations via the InkFlow developer API.',
    'pricing.start': 'Start',
    'pricing.custom': 'Custom',
    'pricing.f1': 'Unlimited bookings',
    'pricing.f2': 'Stripe + PayPal payments',
    'pricing.f3': 'Flash gallery & public showcase',
    'pricing.f4': '100 CRM clients',
    'pricing.f5': 'Email support',
    'pricing.f6': 'Mobile app',
    'pricing.f7': 'Solo core (raised caps) plus multi-calendars',
    'pricing.f8': '3 artists included',
    'pricing.f9': '300 CRM clients',
    'pricing.f10': 'Multi-calendars',
    'pricing.f11': 'Advanced statistics',
    'pricing.f12': 'Priority support',
    'pricing.f13': 'Every Pro entitlement today — before API',
    'pricing.f14': '5 artists included',
    'pricing.f15': 'Unlimited CRM clients',
    'pricing.f16': 'Priority onboarding & richer support playbook',
    'pricing.f17': 'Developer API access',
    'pricing.trial14': '1-month free trial',
    'pricing.cancelAnytime': 'Cancel anytime',
    'pricing.noCommitment': 'No commitment',
    'testimonials.badge': '4.9/5 from 200+ reviews',
    'testimonials.title': 'They trust us',
    'testimonials.subtitle': 'People who actually ship with it, not just try it once',
    'testimonials.quote1':
      "The flash gallery cut down the “is this still available?” DMs. People book when it's up, full stop.",
    'testimonials.quote2':
      'I stopped digging through three apps for history. Session notes and payments live together.',
    'testimonials.quote3':
      "Built for a shop, not a generic SaaS. When I'm stuck, support gets back fast.",
    'testimonials.quote4':
      'Bookings that fill themselves in saved me a pile of admin on Sunday nights.',
    'testimonials.prev': 'Previous testimonial',
    'testimonials.next': 'Next testimonial',
    'testimonials.goTo': 'Go to testimonial',
    'faq.title': 'Questions & Answers',
    'faq.q1': 'What is the Inkflow AI assistant?',
    'faq.a1':
      'It drafts replies and suggests slots when a request comes in. You read, tweak, send. Nothing goes out without you.',
    'faq.q2': 'How do Stripe and PayPal payments work?',
    'faq.a2':
      'Inkflow uses Stripe Checkout. Clients pay the deposit online when booking, by card and PayPal if PayPal is enabled in your Stripe account. Funds arrive in your Stripe account within days.',
    'faq.q3': 'What is the difference between Solo, Pro and Studio plans?',
    'faq.a3':
      'Solo ships the entire booking · payments · showcase stack capped at one tattoo seat and 100 CRM contacts, without unlocking InkFlow’s trio of “growth pillars” — extended multi-calendars, dashboard analytics upgrades and premium storefront themes. Pro raises you to three seats / three hundred contacts and adds those pillars. Studio keeps everything Pro offers, bumps seats to five, removes the CRM cap in our public grid, and exposes the sanctioned developer API tier for integrations.',
    'faq.q4': 'Can I manage my own client portal?',
    'faq.a4':
      'Yes. Each client has a personal space to view their appointments, messages and tattoo history. You control access from your dashboard.',
    'faq.q5': 'How is the unique flash gallery managed?',
    'faq.a5':
      'Publish your flash with photos and prices. Once a client pays the deposit for a flash, it is automatically locked and removed from the public gallery. No double booking.',
    'footer.legal': 'Legal notice',
    'footer.termsShort': 'Terms',
    'footer.contact': 'Contact',
    'footer.cta': 'Try it on my studio',
    'footer.emailPlaceholder': 'you@studio.com',
    'footer.signup': 'Create my Inkflow space',
    'footer.explore': 'Explore',
    'footer.product': 'Product',
    'footer.gallery': 'Gallery',
    'footer.pricing': 'Plans & Pricing',
    'footer.flash': 'Flash',
    'footer.portfolio': 'Portfolio',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.copyright': 'All rights reserved.',
    'footer.copyrightYear': '© 2024 InkFlow',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'fr';
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    return stored === 'en' || stored === 'fr' ? stored : 'fr';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'fr' ? 'fr-FR' : 'en';
  }, [lang]);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[lang][key] ?? translations.fr[key] ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: 'fr',
      setLang: () => {},
      t: (k: string) => k,
    };
  }
  return ctx;
};
