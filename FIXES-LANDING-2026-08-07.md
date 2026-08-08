# FIXES-LANDING — 2026-08-07

> Passe **copy-only** — corrections BLOQUANTES de l’audit `AUDIT-LANDING-2026-08-07.md`.  
> Aucune logique, style ou structure de composant modifiée (hors contenu texte / données affichées).

---

## 1. « Plus de 200 tatoueurs nous font confiance »

|             |                                                                                                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fichier** | `components/landing/TestimonialsSection.tsx`                                                                                                                                                                           |
| **Avant**   | Sous-titre : « Plus de 200 tatoueurs nous font confiance en France »                                                                                                                                                   |
| **Après**   | Titre : « Bientôt : retours de nos premiers studios » + sous-titre : « Les avis authentiques de tatoueurs qui utilisent InkFlow au quotidien seront publiés ici dès les premiers mois. Tu fais partie des premiers ? » |

**Note :** Le hero (`EnhanceAIHero`) n’affichait déjà pas ce chiffre — badge inchangé : « Fait pour les tatoueurs indépendants en France ».

---

## 2. Six témoignages nommés fictifs

|             |                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fichier** | `components/landing/TestimonialsSection.tsx`                                                                                                                              |
| **Avant**   | 6 cartes (Maxime R., Sarah K., Thomas B., Léa M., Kevin D., Camille L.) avec studios, villes, métriques (−80 % no-shows, 5 h/semaine, +40 % flash…) et plans Pro/Business |
| **Après**   | Tableau `TESTIMONIALS` vidé (`[]`) — aucune carte fictive rendue ; message honnête dans l’en-tête de section (cf. point 1)                                                |

**Note :** Le carrousel (flèches, structure) est conservé tel quel ; il n’affiche plus de contenu tant qu’il n’y a pas de vrais avis.

---

## 3. Badge « +3 RDV cette semaine »

|             |                                                                      |
| ----------- | -------------------------------------------------------------------- |
| **Fichier** | `components/landing/EnhanceAIFeaturesDetail.tsx`                     |
| **Avant**   | « +3 RDV cette semaine » (métrique fictive)                          |
| **Après**   | « Semaine · mois · jour » (libellé UI factuel, sans chiffre inventé) |

**Note :** Suppression complète du bloc flottant = changement de structure JSX — hors scope copy-only. La métrique mensongère est retirée.

---

## 4. Bloc features — CRM illimités / Statistiques avancées

|                |                                       |
| -------------- | ------------------------------------- |
| **Fichier**    | `contexts/LanguageContext.tsx`        |
| **Clé**        | `features.section1.f3`                |
| **Avant (FR)** | « Clients CRM illimités »             |
| **Après (FR)** | « Fiches clients CRM (100 en Solo) »  |
| **Avant (EN)** | « Unlimited CRM clients »             |
| **Après (EN)** | « CRM client profiles (100 on Solo) » |
| **Clé**        | `features.section1.f4`                |
| **Avant (FR)** | « Statistiques avancées »             |
| **Après (FR)** | « Inbox demandes centralisée »        |
| **Avant (EN)** | « Advanced statistics »               |
| **Après (EN)** | « Centralized request inbox »         |

**Note :** « Statistiques avancées » et « Clients CRM illimités » restent affichés **uniquement** sur les cartes tarifs Pro/Studio via `pricing.f11` et `pricing.f15` — conformes à `lib/subscriptionPlans.ts`.

---

## 5. Calculateur ROI — « en moyenne X× »

|             |                                 |
| ----------- | ------------------------------- |
| **Fichier** | `components/PricingSection.tsx` |

| Élément            | Avant                                                      | Après                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Titre calculateur  | « Calculez votre retour sur investissement »               | « Estimez votre retour sur investissement (simulation) »                                                                                                     |
| Carte no-shows     | « No-shows évités »                                        | « No-shows évités (estimés) »                                                                                                                                |
| Carte ROI          | « Retour sur investissement »                              | « Estimation ROI »                                                                                                                                           |
| Phrase de synthèse | « …Inkflow vous rapporte **en moyenne** {roi}x son coût. » | « …cette **simulation** estime un retour d’environ {roi}x le prix de l’abonnement — selon tes curseurs, **pas une moyenne mesurée** chez nos utilisateurs. » |

---

## 6. Plan « Business » dans avis / FAQ

|             |                                                                  |
| ----------- | ---------------------------------------------------------------- |
| **Fichier** | `components/landing/TestimonialsSection.tsx`                     |
| **Avant**   | Plans « Business » sur 2 cartes témoignages (Sarah K., Kevin D.) |
| **Après**   | Section témoignages vidée — plus aucune mention « Business »     |

|             |                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------- |
| **Fichier** | `components/landing/EnhanceAIFAQ.tsx` + `contexts/LanguageContext.tsx` (`faq.q3` / `faq.a3`) |
| **Constat** | FAQ déjà limitée à Solo / Pro / Studio — **aucune modification nécessaire**                  |

---

## Fichiers modifiés

- `components/landing/TestimonialsSection.tsx`
- `components/landing/EnhanceAIFeaturesDetail.tsx`
- `components/PricingSection.tsx`
- `contexts/LanguageContext.tsx`

## Non traité (passe IMPORTANT / MINEUR ultérieure)

- Lien nav `#avis` cassé
- Lien Tarifs → domaine Framer
- Harmonisation tu/vous
- Footer email non fonctionnel
- Clés i18n mortes (`hero.social`, `testimonials.badge` « 4.9/5 sur 200+ avis »)
- Charte visuelle footer / emerald vs ocre

---

_Généré le 2026-08-07._
