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
    // Hero
    'hero.badge': 'Nouveau',
    'hero.title': "L'outil qui aide les tatoueurs à gagner du temps",
    'hero.subtitle': "Du concept à la conversion — gérez des milliers de campagnes influenceurs avec fluidité.",
    'hero.cta1': "Télécharger l'app gratuite",
    'hero.cta2': 'Commencer gratuitement',
    'hero.social': 'Rejoignez 500+ tatoueurs',
    // Footer
    'footer.cta': "PASSONS À L'ACTION POUR VOTRE STUDIO",
    'footer.emailPlaceholder': 'Entrez votre email',
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
    'hero.badge': 'New',
    'hero.title': 'The tool that helps tattoo artists save time',
    'hero.subtitle': 'From concept to conversion — manage thousands of influencer campaigns seamlessly.',
    'hero.cta1': 'Download free app',
    'hero.cta2': 'Start for free',
    'hero.social': 'Join 500+ tattoo artists',
    'footer.cta': "LET'S TAKE ACTION FOR YOUR STUDIO",
    'footer.emailPlaceholder': 'Enter your email',
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

  const t = useCallback((key: string): string => {
    return translations[lang][key] ?? translations.fr[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
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
