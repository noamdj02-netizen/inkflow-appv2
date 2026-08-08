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
    'features.section1.f3': 'Fiches clients CRM (100 en Solo)',
    'features.section1.f4': 'Inbox demandes centralisée',
    'features.section1.visualTitle': 'Évolution',
    'features.section1.v1': 'Réservations',
    'features.section1.v2': 'Acomptes',
    'features.section1.v3': 'Flash',
    'features.section2.title': 'CRM client et fidélisation en un seul endroit',
    'features.section2.desc':
      "Centralise l'historique de chaque client : rendez-vous, notes de session, préférences. Suis la cicatrisation et fidélise tes clients avec des rappels personnalisés.",
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
      'Stripe intégré de bout en bout. Envoie des liens de paiement en un clic, encaisse les acomptes avant le RDV et réduis les no-shows.',
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
    'features.section4.title': 'Vitrine en ligne et galerie flash pour vendre tes designs',
    'features.section4.desc':
      "Publie ton portfolio et tes flashs. Tes clients découvrent tes créations, réservent en ligne et paient l'acompte. Le design est bloqué automatiquement après paiement.",
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
    'how.item4.title': 'Inbox demandes unifiée',
    'how.item4.text': 'Projets custom, réservations vitrine et messages clients au même endroit.',
    'how.item5.title': 'Acomptes Stripe automatiques',
    'how.item5.text': 'Liens de paiement, relances et confirmation sans aller-retour manuel.',
    'how.item6.title': 'Vitrine et lien de réservation',
    'how.item6.text': 'Page studio personnalisable, prête à partager sur Instagram ou WhatsApp.',
    'how.item7.title': 'Messagerie clients',
    'how.item7.text': 'Échanges liés aux demandes et RDV, sans perdre le fil sur Instagram.',
    'how.item8.title': 'Pilotage financier',
    'how.item8.text': 'Revenus, acomptes encaissés et suivi du CA depuis le dashboard.',
    'how.item9.title': 'Fidélité et tampons',
    'how.item9.text': 'Cartes fidélité digitales et récompenses pour fidéliser ta clientèle.',
    // Process
    'process.title': 'Prêt en moins de 15 minutes',
    'process.subtitle': "De l'inscription au premier RDV, ça tient en un café",
    'process.step1.title': 'Crée ton compte',
    'process.step1.desc': "Inscription en 2 minutes. Aucune carte bancaire requise pour l'essai.",
    'process.step1.duration': '2 min',
    'process.step2.title': 'Configure ton studio',
    'process.step2.desc': 'Ajoute tes horaires, services, et connecte Stripe pour les paiements.',
    'process.step2.duration': '10 min',
    'process.step3.title': 'Partage ton lien',
    'process.step3.desc': 'Envoie ton lien de réservation à tes clients sur Instagram, WhatsApp...',
    'process.step3.duration': '1 min',
    'process.step4.title': 'Reçois tes réservations',
    'process.step4.desc':
      'Tes clients réservent 24/7. Tu es notifié et les acomptes arrivent automatiquement.',
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
    'pricing.soloDesc':
      'Essentiel — agenda, CRM, vitrine, acomptes Stripe et registre traçabilité légal inclus.',
    'pricing.proDesc':
      'Plafonds relevés + stats avancées, fidélité, multi-calendriers et thèmes vitrine premium.',
    'pricing.studioDesc':
      'Volumes larges, équipe avec rôles collaborateurs et accès API développeurs.',
    'pricing.start': 'Commencer',
    'pricing.included': 'Inclus :',
    'pricing.planLabel': 'Plan',
    'pricing.custom': 'Sur mesure',
    'pricing.f1': 'Réservations illimitées',
    'pricing.f2': 'Paiements Stripe + PayPal',
    'pricing.f3': 'Galerie Flash & vitrine publique',
    'pricing.f4': '100 clients CRM',
    'pricing.f5': 'Support email',
    'pricing.f6': 'Application mobile',
    'pricing.f7': 'Socle Essentiel (plafonds relevés) + multi-calendriers',
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
    'pricing.f18': 'Registre traçabilité légal',
    'pricing.f19': 'Programme fidélité',
    'pricing.f20': 'Équipe & rôles collaborateurs',
    'pricing.trial14': "1 mois d'essai gratuit",
    'pricing.cancelAnytime': 'Annulation à tout moment',
    'pricing.noCommitment': "Pas d'engagement",
    // Testimonials
    'testimonials.title': "Ce qu'en disent les tatoueurs",
    'testimonials.subtitle':
      'Acomptes, demandes Insta, agenda — ce qu’ils retiennent après quelques semaines sur InkFlow.',
    'testimonials.quote1':
      'La galerie flash m’a évité des tonnes de « t’as encore ce motif ? ». Les gens réservent quand c’est dispo, point.',
    'testimonials.name1': 'Léa',
    'testimonials.role1': 'Tatoueuse indépendante',
    'testimonials.quote2':
      'J’ai l’historique client sans fouiller trois apps. Notes de séance, paiements : tout au même endroit.',
    'testimonials.name2': 'Thomas',
    'testimonials.role2': 'Tatoueur solo',
    'testimonials.quote3':
      'C’est pensé pour un atelier, pas pour un logiciel salon. Quand je bloque, le support répond vite.',
    'testimonials.name3': 'Camille',
    'testimonials.role3': 'Tatoueuse · plan Pro',
    'testimonials.quote4':
      'Les résas qui tombent toutes seules le soir, ça m’a enlevé un paquet d’admin le dimanche.',
    'testimonials.name4': 'Maxime',
    'testimonials.role4': 'Tatoueur indépendant',
    'testimonials.quote5':
      'L’acompte Stripe avant le RDV, mes no-shows ont nettement baissé. Fini les créneaux bloqués pour rien.',
    'testimonials.name5': 'Sarah',
    'testimonials.role5': 'Tatoueuse · vitrine bookable',
    'testimonials.quote6':
      'Les demandes Insta arrivent qualifiées dans l’inbox. Je réponds entre deux clients, depuis le tel.',
    'testimonials.name6': 'Kevin',
    'testimonials.role6': 'Tatoueur · galerie flash',
    'testimonials.leaveReview': 'Laisser un avis',
    'testimonials.viewWall': 'Voir tous les avis',
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
      "Inkflow utilise Stripe Checkout. Tes clients paient l'acompte en ligne lors de la réservation, par carte et PayPal si PayPal est activé dans ton compte Stripe. Les fonds arrivent sur ton compte Stripe en quelques jours.",
    'faq.q3': 'Quelle est la différence entre Solo, Pro et Studio ?',
    'faq.a3':
      'Solo conserve tout le socle métier réservation · paiements · vitrine jusqu’aux plafonds annoncés (1 siège / 100 fiches CRM) sans encore activer multi-calendriers étendus, statistiques avancées ou thème vitrine premium. Pro élève tes plafonds (3 sièges · 300 fiches) et débloque ces trois briques. Studio reprend Pro, passe à cinq sièges, CRM sans plafond sur notre grille et uniquement alors l’accès développeurs (API InkFlow documentée).',
    'faq.q4': 'Puis-je gérer mon propre portail client ?',
    'faq.a4':
      "Oui. Chaque client dispose d'un espace personnel pour voir ses rendez-vous, ses messages et l'historique de ses tatouages. Tu contrôles les accès depuis ton dashboard.",
    'faq.q5': 'Comment est gérée la galerie flash unique ?',
    'faq.a5':
      "Publie tes flashs avec photos et prix. Une fois qu'un client paie l'acompte pour un flash, il est automatiquement bloqué et retiré de la galerie publique. Plus de double réservation.",
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
    'features.section1.f3': 'CRM client profiles (100 on Solo)',
    'features.section1.f4': 'Centralized request inbox',
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
    'how.item4.title': 'Unified request inbox',
    'how.item4.text': 'Custom projects, showcase bookings and client messages in one place.',
    'how.item5.title': 'Automatic Stripe deposits',
    'how.item5.text': 'Payment links, reminders and confirmation without manual back-and-forth.',
    'how.item6.title': 'Showcase and booking link',
    'how.item6.text': 'Customizable studio page, ready to share on Instagram or WhatsApp.',
    'how.item7.title': 'Client messaging',
    'how.item7.text':
      'Conversations tied to requests and appointments, without losing threads on Instagram.',
    'how.item8.title': 'Financial dashboard',
    'how.item8.text': 'Revenue, collected deposits and monthly tracking from one place.',
    'how.item9.title': 'Loyalty and stamp cards',
    'how.item9.text': 'Digital loyalty cards and rewards to keep clients coming back.',
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
    'pricing.soloDesc':
      'Essential — calendar, CRM, storefront, Stripe deposits and legal traceability register included.',
    'pricing.proDesc':
      'Higher limits plus advanced stats, loyalty, multi-calendars and premium storefront themes.',
    'pricing.studioDesc': 'Large volumes, team roles for collaborators and developer API access.',
    'pricing.start': 'Start',
    'pricing.included': "What's included:",
    'pricing.planLabel': 'Plan',
    'pricing.custom': 'Custom',
    'pricing.f1': 'Unlimited bookings',
    'pricing.f2': 'Stripe + PayPal payments',
    'pricing.f3': 'Flash gallery & public showcase',
    'pricing.f4': '100 CRM clients',
    'pricing.f5': 'Email support',
    'pricing.f6': 'Mobile app',
    'pricing.f7': 'Essential core (raised caps) plus multi-calendars',
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
    'pricing.f18': 'Legal traceability register',
    'pricing.f19': 'Loyalty program',
    'pricing.f20': 'Team & collaborator roles',
    'pricing.trial14': '1-month free trial',
    'pricing.cancelAnytime': 'Cancel anytime',
    'pricing.noCommitment': 'No commitment',
    'testimonials.title': 'What tattoo artists say',
    'testimonials.subtitle':
      'Deposits, Insta requests, calendar — what they notice after a few weeks on InkFlow.',
    'testimonials.quote1':
      "The flash gallery cut down the “is this still available?” DMs. People book when it's up, full stop.",
    'testimonials.name1': 'Léa',
    'testimonials.role1': 'Independent tattoo artist',
    'testimonials.quote2':
      'I stopped digging through three apps for client history. Session notes and payments live together.',
    'testimonials.name2': 'Thomas',
    'testimonials.role2': 'Solo tattoo artist',
    'testimonials.quote3':
      "Built for a shop, not salon software. When I'm stuck, support gets back fast.",
    'testimonials.name3': 'Camille',
    'testimonials.role3': 'Tattoo artist · Pro plan',
    'testimonials.quote4':
      'Evening bookings that land on their own saved me a pile of Sunday admin.',
    'testimonials.name4': 'Maxime',
    'testimonials.role4': 'Independent tattoo artist',
    'testimonials.quote5':
      'Stripe deposits before the appointment — no-shows dropped a lot. No more dead slots.',
    'testimonials.name5': 'Sarah',
    'testimonials.role5': 'Tattoo artist · bookable page',
    'testimonials.quote6':
      'Insta requests land qualified in the inbox. I reply between clients, from my phone.',
    'testimonials.name6': 'Kevin',
    'testimonials.role6': 'Tattoo artist · flash gallery',
    'testimonials.leaveReview': 'Leave a review',
    'testimonials.viewWall': 'View all reviews',
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
