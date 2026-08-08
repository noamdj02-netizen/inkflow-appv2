# AUDIT-LANDING — 2026-08-07

> **Mode audit uniquement** — lecture du code et des composants de la route `/` (`LandingEnhanceAI` + sous-composants lazy). Aucune modification produit.  
> Références : `CLAUDE.md`, `lib/subscriptionPlans.ts`, `lib/landingFlags.ts`, `contexts/LanguageContext.tsx`.

---

## 1. Inventaire section par section

Ordre réel dans `components/landing/LandingEnhanceAI.tsx` :

### Header — `EnhanceAINavbar`

|                        |                                                                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Que dit la section** | Logo Inkflow, nav (Démo, Fonctionnalités, Tarifs, Avis), toggle Fr/En, Connexion, Essai gratuit. Fond glass sombre `bg-black/40 backdrop-blur-md` dès le chargement. |
| **Problème adressé**   | Navigation + accès rapide signup ; lisibilité sur vidéo hero.                                                                                                        |
| **Verdict**            | **COHÉRENT** (structure) — **À RECENTRER** (liens `#avis` / `#pricing` via `LANDING_URL` Framer, voir §6).                                                           |

### Hero — `EnhanceAIHero`

|                        |                                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Que dit la section** | Badge « Fait pour les tatoueurs indépendants en France » ; titre « Les demandes Insta qui deviennent des RDV » ; copy acompte Stripe + agenda ; chips (Réservations & acomptes / CRM & galerie flash / Facturation & bilans PDF) ; CTA Essayer / Démo ; trust (1 mois essai, sans carte, annulation libre). Vidéo fond + overlay sombre. |
| **Problème adressé**   | DM Insta → RDV qualifiés ; acomptes / no-shows ; admin réduit.                                                                                                                                                                                                                                                                           |
| **Verdict**            | **COHÉRENT** avec le positionnement MVP (demandes, acomptes, agenda). Bandeau villes désactivé (`LANDING_HERO_STUDIO_MARQUEE_ENABLED = false`) — correct vu 0 studio prod.                                                                                                                                                               |

### Démo — `LandingDemoSection` (+ `DashboardDemoVideo`)

|                        |                                                                                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Que dit la section** | « Vois InkFlow en action » ; bullets créneaux/acompte, fiche client, inbox demandes ; carousel UI produit (accueil, inbox, CRM, Stripe) ; CTA démo live + créer studio. |
| **Problème adressé**   | Preuve produit avant inscription ; réduction du doute « est-ce que ça existe vraiment ».                                                                                |
| **Verdict**            | **COHÉRENT** — démo sandbox `/dashboard-demo`, pas de chiffres social proof ici.                                                                                        |

### Fonctionnalités — `EnhanceAIFeaturesDetail`

|                        |                                                                                                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Que dit la section** | 4 blocs zig-zag : (1) demande → créneau + Stripe, (2) CRM / cicatrisation / rappels, (3) paiements / no-shows, (4) vitrine + galerie flash. Captures `Mobile_Mockup_*`, assets publics. Badge décoratif « +3 RDV cette semaine » sur bloc 1. |
| **Problème adressé**   | Friction demande→RDV, CRM, acomptes, vitrine 24/7.                                                                                                                                                                                           |
| **Verdict**            | **À RECENTRER** — promesses globales (« CRM illimités », « Statistiques avancées » en bloc 1) vs paliers Solo ; badge métrique fictif ; bloc 2 en **vous** (§4).                                                                             |

### Comment ça marche — `EnhanceAIHowInkflow`

|                        |                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Que dit la section** | 3 cartes : agenda + acomptes + rappels ; CRM + notes cicatrisation ; galerie flash verrouillée après paiement.         |
| **Problème adressé**   | Compréhension rapide des piliers produit.                                                                              |
| **Verdict**            | **COHÉRENT** — aligné MVP ; « rappels automatiques » à nuancer (SMS/email selon config, pas garanti « auto » partout). |

### Processus — `ProcessSection`

|                        |                                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Que dit la section** | 4 étapes : compte 2 min → config studio + Stripe 10 min → partage lien Insta/WA → réservations auto. CTA Commencer / Démo.                                  |
| **Problème adressé**   | Onboarding ; vitrine bookable ; time-to-value.                                                                                                              |
| **Verdict**            | **COHÉRENT** — promesse « prêt en 15 min » réaliste pour un solo ; lien preview `inkflow.me/monstudio` (domaine marketing, pas `app.ink-flow.me/book/...`). |

### Tarifs — `PricingSection`

|                        |                                                                                                                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Que dit la section** | Titre différenciation tatoueur ; calculateur ROI (temps gagné, no-shows évités, multiplicateur vs 49€) ; plans Solo 29€ / Pro 49€ / Studio 99€ ; essai 1 mois, sans engagement.                                      |
| **Problème adressé**   | Objection prix vs coût no-show / temps admin.                                                                                                                                                                        |
| **Verdict**            | **À RECENTRER** — prix alignés `PLAN_CONFIG` ; calculateur présente des **résultats comme des moyennes produit** (formules hardcodées, non données réelles) ; PayPal listé sur tous les plans (conditionnel Stripe). |

### Témoignages / Social proof — `TestimonialsSection`

|                        |                                                                                                                                                                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Que dit la section** | Titre « Ils ont dit adieu à Excel » ; sous-titre **« Plus de 200 tatoueurs nous font confiance en France »** ; 6 avis nommés (Maxime R., Sarah K., …), studios + villes, notes 5★, métriques (−80% no-shows, 5h/semaine, etc.), plans « Pro » / **« Business »**.                 |
| **Problème adressé**   | Preuve sociale, réduction risque.                                                                                                                                                                                                                                                 |
| **Verdict**            | **HORS SUJET / BLOQUANT factuel** — contenu présenté comme réel alors qu’avatars = `lib/demoSandboxData`, métriques et studios non vérifiables ; compteur 200+ incompatible avec 0 studio prod déclaré. Composant `EnhanceAITestimonials.tsx` (id `#avis`) **non monté** sur `/`. |

### FAQ — `EnhanceAIFAQ` (+ schema `SEO.tsx`)

|                        |                                                                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Que dit la section** | 5 Q/R : assistant IA, Stripe/PayPal, différences plans, portail client, galerie flash unique.                                                                                                     |
| **Problème adressé**   | Objections techniques et plans.                                                                                                                                                                   |
| **Verdict**            | **À RECENTRER** — contenu globalement aligné code/plans ; registre **vous** dans réponses ; portail client = périmètre `/discover` / hub client (partiel vs « messages + historique tatouages »). |

### CTA final + Footer — `EnhanceAIFooter`

|                        |                                                                                                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Que dit la section** | CTA « Tester sur mon studio » ; champ email + lien signup (form `preventDefault` — pas d’envoi) ; colonnes Explore / Product / Gallery (liens `/vue-ensemble`, `/demandes`, etc.) ; liens RGPD/CGU/mentions légales → `ink-flow.me` ; ©2026. |
| **Problème adressé**   | Dernière conversion ; légal.                                                                                                                                                                                                                 |
| **Verdict**            | **À RECENTRER** — liens footer mélangent pages marketing internes et Framer ; pas de CGV Stripe/abonnement côté app dans le footer SPA.                                                                                                      |

### Social proof non affichée (référence)

|               |                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------- |
| **Composant** | `LandingHeroMarquee` — « Studios actifs en France » + villes ; **flag `false`**, non rendu. |
| **Verdict**   | **COHÉRENT** (désactivé) — structure conservée pour plus tard.                              |

---

## 2. Audit des affirmations (factuelles)

| Affirmation                                                        | Emplacement                     | Statut                                | Précision                                                                                  |
| ------------------------------------------------------------------ | ------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| « Fait pour les tatoueurs indépendants en France »                 | Hero badge                      | **INVÉRIFIABLE EN L'ÉTAT**            | Positionnement marketing, pas un comptage.                                                 |
| « Les demandes Insta qui deviennent des RDV »                      | Hero H1                         | **INVÉRIFIABLE EN L'ÉTAT**            | Promesse capacitaire (inbox + book existent), pas de preuve volume.                        |
| « Tu qualifies en deux clics… acompte… créneau bloqué »            | Hero                            | **INVÉRIFIABLE EN L'ÉTAT**            | Flux partiellement implémenté (qualification manuelle possible en 2 clics selon UX).       |
| « 1 mois d'essai gratuit » / « Sans carte » / « Annulation libre » | Hero trust                      | **INVÉRIFIABLE EN L'ÉTAT**            | Dépend config Stripe/trial prod (code prévoit trial ; activation fondateur requise).       |
| « Réservations & acomptes en ligne » etc. (3 chips)                | Hero i18n                       | **VÉRIFIÉ VRAI** (capacité code)      | Modules MVP présents (`PublicBookingPage`, Stripe, CRM, flash).                            |
| « +3 RDV cette semaine »                                           | `EnhanceAIFeaturesDetail` badge | **FAUX CONFIRMÉ**                     | Texte statique décoratif, aucune source data.                                              |
| « Clients CRM illimités » (feature bloc 1)                         | i18n `features.section1.f3`     | **FAUX CONFIRMÉ**                     | Solo = 100 clients (`subscriptionPlans.ts`) ; illimité seulement Studio+.                  |
| « Statistiques avancées » (feature bloc 1)                         | i18n `features.section1.f4`     | **FAUX CONFIRMÉ**                     | Réservé Pro+ (`stats_avancees`), absent Solo.                                              |
| Chiffres i18n section 3 (2 340 €, 18 acomptes, 94 %)               | `LanguageContext`               | **NON AFFICHÉS** sur landing actuelle | Restes copy ; si réutilisés = **FAUX CONFIRMÉ** sans data.                                 |
| Noms clients fictifs (Lucas M., Marie L., Emma L.)                 | i18n section 2                  | **NON AFFICHÉS**                      | —                                                                                          |
| « Plus de 200 tatoueurs nous font confiance en France »            | `TestimonialsSection`           | **FAUX CONFIRMÉ**                     | Contredit état prod (0 studio) ; aucune requête BDD dans composant.                        |
| 6 témoignages nommés + studios (Lyon, Paris, Bordeaux…)            | `TestimonialsSection`           | **FAUX CONFIRMÉ**                     | Avatars `AVATAR_M`/`AVATAR_F` demo ; textes rédigés marketing.                             |
| Notes 5 étoiles sur chaque carte                                   | Testimonials                    | **FAUX CONFIRMÉ**                     | Pas d’agrégat avis Google/App Store affiché ; étoiles décoratives.                         |
| « −80% de no-shows » (Sarah K.)                                    | Testimonial                     | **INVÉRIFIABLE EN L'ÉTAT**            | Aucune étude ; présenté comme fait client = **trompeur**.                                  |
| « 5h/semaine économisées » (Maxime R.)                             | Testimonial                     | **INVÉRIFIABLE EN L'ÉTAT**            | Idem.                                                                                      |
| « ROI dès le 1er mois » / « +40% de résas flash »                  | Testimonials                    | **INVÉRIFIABLE EN L'ÉTAT**            | Idem.                                                                                      |
| Plan « Business »                                                  | Testimonials Sarah K., Kevin D. | **FAUX CONFIRMÉ**                     | Plans code = solo / pro / studio / enterprise — pas « Business ».                          |
| Calculateur : « X no-shows évités / mois » (8% × RDV)              | `PricingSection`                | **INVÉRIFIABLE EN L'ÉTAT**            | Hypothèse 8% hardcodée, présentée sans disclaimer « simulation ».                          |
| « Inkflow vous rapporte en moyenne {roi}x son coût »               | `PricingSection`                | **FAUX CONFIRMÉ**                     | Mot « en moyenne » sans base statistique ; formule locale (`gainTemps * 20 + gainNoShow`). |
| « 1 mois d'essai gratuit » (pricing footer)                        | Pricing                         | **INVÉRIFIABLE EN L'ÉTAT**            | Clé `pricing.trial14` nom obsolete (14) ; texte affiché = 1 mois.                          |
| Prix 29 / 49 / 99 € (mensuel)                                      | Pricing                         | **VÉRIFIÉ VRAI** (code)               | Aligné `PLAN_CONFIG.priceEur`.                                                             |
| « Essai gratuit 1 mois • Pas de carte bancaire requise »           | ProcessSection                  | **INVÉRIFIABLE EN L'ÉTAT**            | Copy signup ; dépend Stripe trial prod.                                                    |
| « Clients book 24/7 » (process EN) / réservations auto (FR)        | Process i18n                    | **VÉRIFIÉ VRAI** (capacité)           | Booking public + vitrine.                                                                  |
| FAQ assistant IA                                                   | FAQ + schema SEO                | **VÉRIFIÉ VRAI** (partiel)            | `AIAssistant`, edge Gemini ; gated abonnement / auth.                                      |
| FAQ PayPal                                                         | FAQ                             | **VÉRIFIÉ VRAI** (conditionnel)       | Via Stripe Checkout si PayPal activé sur compte connecté.                                  |
| FAQ portail client complet                                         | FAQ q4                          | **INVÉRIFIABLE EN L'ÉTAT**            | Hub `/discover`, `/mon-compte` — périmètre ≠ « historique tatouages » complet partout.     |
| FAQ flash bloqué après acompte                                     | FAQ q5                          | **VÉRIFIÉ VRAI**                      | Logique flash + booking.                                                                   |
| Schema SEO `lowPrice 29` / `highPrice 99`                          | `SEO.tsx`                       | **VÉRIFIÉ VRAI**                      | Cohérent plans vendus.                                                                     |
| « Des centaines de studios » / « +1 240€… »                        | i18n `hero.social*`             | **NON AFFICHÉ**                       | Clés mortes sur hero actuel ; si réactivées = **FAUX CONFIRMÉ** sans data.                 |
| « 4.9/5 sur 200+ avis »                                            | i18n `testimonials.badge`       | **NON AFFICHÉ**                       | `TestimonialsSection` hardcode autre sous-titre.                                           |
| ©2026 InkFlow                                                      | Footer                          | **VÉRIFIÉ VRAI**                      | Date cohérente audit.                                                                      |
| Liste villes (Paris, Lyon…)                                        | `LandingHeroMarquee`            | **NON AFFICHÉ**                       | Flag off.                                                                                  |

---

## 3. Cohérence fonctionnalités annoncées vs livrées

| Feature landing                                    | Implémentation code                                                          | Écart                                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Réservations en ligne / vitrine `/book`, `/studio` | `PublicBookingPage`, `PublicStudioPagePro`, `useBookingFlow`                 | **OK**                                                                                           |
| Acomptes Stripe                                    | Stripe Connect, checkout, webhooks, `remind-unpaid-deposits`                 | **OK**                                                                                           |
| PayPal                                             | `paypal_payments` dans plans ; Stripe Checkout                               | **OK** si activé côté Stripe                                                                     |
| CRM clients                                        | `DashboardPro` onglet clients, limites par plan                              | **OK** ; « illimités » landing = **faux** pour Solo                                              |
| Galerie flash                                      | Flash manager, vitrine                                                       | **OK**                                                                                           |
| Agenda / créneaux                                  | `AppointmentsView`, `AgendaSummaryTab`                                       | **OK**                                                                                           |
| Inbox demandes Insta                               | Demandes / projet requests                                                   | **OK** (qualification pas 100% auto Insta API)                                                   |
| Messagerie intégrée                                | `MessagingTab`, `PublicMessagePage`                                          | **OK** ; peu mise en avant sur hero actuel                                                       |
| Facturation & bilans PDF                           | `generate-payment-invoice`, `FinanceDashboard` print/PDF, dossier client PDF | **PARTIEL** — pas « bilans PDF » mensuels one-click partout ; plutôt finance + factures paiement |
| Statistiques avancées                              | `AnalyticsDashboard`, gate Pro+                                              | **OK Pro+** ; **erreur** si vendu comme inclus bloc 1 générique                                  |
| Multi-calendriers                                  | Plan Pro+                                                                    | **OK** gated                                                                                     |
| Thèmes vitrine premium                             | Plan Pro+                                                                    | **OK**                                                                                           |
| API développeurs Studio                            | Plan studio                                                                  | **OK** code ; rollout business incertain (`CLAUDE.md`)                                           |
| Assistant IA                                       | `AIAssistant`, `call-gemini`                                                 | **OK** gated                                                                                     |
| Relances acomptes non payés                        | Edge `remind-unpaid-deposits`                                                | **OK**                                                                                           |
| Rappels automatiques personnalisés                 | SMS/email automations partielles                                             | **PARTIEL** — dépend automations configurées                                                     |
| Notes cicatrisation CRM                            | Champs client / dossier                                                      | **PARTIEL** — à confirmer profondeur fiche client                                                |
| Application mobile                                 | PWA + `inkflow-mobile` shell                                                 | **OK** enveloppe ; stores = hors scope audit code                                                |
| Portail client (RDV, messages, historique)         | `/discover`, client dashboard                                                | **PARTIEL** vs promesse FAQ exhaustive                                                           |
| Fidélité tampons                                   | Edge functions MVP                                                           | **NON mentionné** landing — OK                                                                   |
| Zéro commission plateforme                         | Non claim landing ; fee optionnel Connect                                    | **Non vendu** — neutre                                                                           |
| Zero no-show (positionnement)                      | Acomptes + statut `no_show`                                                  | **Capacité OK** ; % réduction non prouvé landing                                                 |

---

## 4. Cohérence vocabulaire et ton

| Observation                                    | Exemples                                                                   | Sévérité copy                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Tu** dominant hero, démo, process (FR)       | « Tu qualifies », « ça tient en un café »                                  | Cohérent tatoueur→tatoueur                                     |
| **Vous** FAQ, schema SEO, section CRM features | « Centralisez l'historique », FAQ a1/a2/a4                                 | **Incohérent** avec hero                                       |
| **Vous** calculateur pricing                   | « Calculez votre retour »                                                  | Mélange tu/vous sur même page scroll                           |
| Jargon SaaS générique                          | « Statistiques avancées », « ROI », « productivité » implicite calculateur | Modéré — acceptable B2B                                        |
| Vocabulaire métier correct                     | acompte, flash, vitrine, créneau, no-shows (pricing calc), demandes        | **Bon**                                                        |
| « Excel » testimonials                         | Titre section                                                              | Métaphore OK ; studios tatoueurs peuvent ne pas utiliser Excel |
| Anglais footer                                 | Explore / Product / Gallery                                                | Ton startup US vs FR produit                                   |
| i18n EN parallel                               | Navbar toggle                                                              | Partiel ; cohérent si audience EN visée                        |

**Clés i18n mortes mais trompeuses si réutilisées** : `hero.social`, `hero.socialBadge`, `testimonials.badge` (200+ avis, 4.9/5).

---

## 5. Cohérence visuelle et charte

Référence `CLAUDE.md` : `#0d0d0d`, `#161616`, `#2a2a2a`, `#e8e3dc`, `#6b6b6b`, accent `#c9a96e`. Typo : Inter / JetBrains Mono (dashboard) ; landing utilise **Plus Jakarta Sans** (`font-hero-title`, `index.css`).

| Zone                              | Constat                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Hero                              | Fond vidéo + overlay noir — **écart** vs charte ink claire historique ; cohérent choix récent cinématique. |
| Sections `#f6f5f2` + zinc         | **Écart** vs tokens ink sombre ; cohérence **interne landing** forte.                                      |
| Accent emerald landing            | **Écart** vs accent ocre `#c9a96e` unique charte historique.                                               |
| Footer `bg-blue-900`              | **Écart majeur** — palette blue/navy, pas ink/zinc/ocre.                                                   |
| Pricing `neutral-*`, toggles blue | **Écart** vs zinc/emerald reste landing.                                                                   |
| Typo titres                       | Plus Jakarta (`font-hero-title`) partout sections récentes — **cohérent landing**.                         |
| JetBrains Mono                    | Uniquement `EnhanceAIHowInkflow` numéros `01/02/03` — **usage minimal**.                                   |
| Inter                             | Body text Tailwind default / zinc — aligné app dashboard light.                                            |

Pas de rupture mobile détectée dans structure ; hero vidéo → poster mobile (`HeroBackgroundVideo`) conforme contraintes data.

---

## 6. Parcours de conversion

### Hiérarchie CTA

| Section       | CTA principal                          | CTA secondaire          | Commentaire                                         |
| ------------- | -------------------------------------- | ----------------------- | --------------------------------------------------- |
| Header        | Essai gratuit                          | Connexion               | Clair                                               |
| Hero          | Essayer gratuitement (blanc)           | Voir démo               | Clair                                               |
| Démo          | Lancer démo live                       | Créer mon studio        | **Compétition** modérée (2 CTAs égaux visuellement) |
| Features      | Aucun CTA inline                       | —                       | Gap conversion mid-funnel                           |
| How / Process | Commencer                              | Voir démo               | Répétition pattern OK                               |
| Pricing       | Commencer (×3 plans) + calculateur CTA | —                       | **4+ CTAs** ; calculateur ajoute bruit              |
| Testimonials  | Aucun                                  | —                       | Gap                                                 |
| FAQ           | Aucun                                  | —                       | Gap                                                 |
| Footer        | Créer mon espace                       | Email (non fonctionnel) | CTA signup OK ; email **friction morte**            |

**CTA principal global** : `/signup` — cohérent.

### Frictions

1. **Nav « Avis » → `#avis`** : ancre sur `EnhanceAITestimonials` (non monté) ; section active = `TestimonialsSection` **sans `id="avis"`** → lien cassé sur `app.ink-flow.me/`.
2. **Nav « Tarifs »** : `LANDING_PRICING_URL = https://ink-flow.me/#pricing` — depuis SPA app, quitte le domaine app vers Framer (pricing local = `#pricing` sur même page).
3. **Calculateur ROI** : répond partiellement à « combien coûte un no-show » mais affiche « en moyenne Xx » sans disclaimer simulation.
4. **Essai sans carte** vs tunnel signup réel : à valider manuellement Stripe (hors code landing).
5. **Footer liens** `/vue-ensemble`, `/demandes` : routes marketing internes — risque 404 si non routées dans `App.tsx`.
6. **Légal** : liens présents (confidentialité, CGU, mentions) → domaine **Framer** `ink-flow.me`, pas pages hébergées dans ce repo SPA.

### Mentions légales / RGPD

- Footer : Politique confidentialité, CGU, Mentions légales → **présents** (URLs Framer).
- Pas de lien cookies / DPA visible footer SPA.
- Formulaire email footer : **ne soumet rien** (`preventDefault`).

---

## 7. Verdict final priorisé

| Élément                                                                              | Sévérité      | Section              | Correctif proposé                                                                                                    |
| ------------------------------------------------------------------------------------ | ------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| « Plus de 200 tatoueurs nous font confiance »                                        | **BLOQUANT**  | Témoignages          | Retirer ou remplacer par formulation honeste (beta / early access) jusqu’à data réelle.                              |
| 6 témoignages nommés + métriques (−80% no-shows, 5h/sem…) présentés comme avis réels | **BLOQUANT**  | Témoignages          | Remplacer par études de cas vérifiables, avis fondateur beta, ou section « Ce qu’on construit » sans noms/métriques. |
| Badge « +3 RDV cette semaine »                                                       | **BLOQUANT**  | Features             | Supprimer ou sourcer depuis analytics agrégées anonymisées.                                                          |
| « Clients CRM illimités » + « Statistiques avancées » (bloc 1 tous publics)          | **BLOQUANT**  | Features             | Aligner sur paliers Solo/Pro ou qualifier « selon plan ».                                                            |
| « Inkflow vous rapporte **en moyenne** {roi}x » (calculateur)                        | **BLOQUANT**  | Pricing              | Renommer en « simulation » / « exemple » ; retirer « en moyenne ».                                                   |
| Plan tarifaire « Business » dans témoignages                                         | **BLOQUANT**  | Témoignages          | Corriger en Solo/Pro/Studio ou retirer label.                                                                        |
| Lien nav `#avis` cassé                                                               | **IMPORTANT** | Header + Témoignages | Ajouter `id="avis"` sur `TestimonialsSection` ou pointer ancre correcte.                                             |
| Lien Tarifs → `ink-flow.me/#pricing` depuis app                                      | **IMPORTANT** | Header               | Utiliser `/#pricing` relatif sur SPA app.                                                                            |
| FAQ / features section 2 en **vous** vs hero **tu**                                  | **IMPORTANT** | FAQ, Features        | Harmoniser registre tutoiement produit.                                                                              |
| Footer email non fonctionnel                                                         | **IMPORTANT** | Footer               | Brancher Resend/liste ou retirer le champ.                                                                           |
| Promesse « Facturation & bilans PDF » (chip hero)                                    | **IMPORTANT** | Hero                 | Nuancer (« factures & reçus PDF ») ou compléter produit bilans.                                                      |
| Témoignaires + social proof sans disclaimer « exemples »                             | **IMPORTANT** | Témoignages          | Mention légale « illustrations » si conservés temporairement.                                                        |
| Footer palette blue-900 vs charte ink/ocre                                           | **MINEUR**    | Footer, Pricing      | Rapprocher zinc/ink ou documenter double charte landing.                                                             |
| Accent emerald vs ocre `#c9a96e`                                                     | **MINEUR**    | Global landing       | Décision brand : garder emerald landing ou rapprocher cuivre.                                                        |
| Clés i18n mortes (`hero.social`, 200+ avis 4.9/5)                                    | **MINEUR**    | i18n                 | Purger ou flag pour éviter régression future.                                                                        |
| CTAs répétés sans CTA features/testimonials                                          | **MINEUR**    | Parcours             | Ajouter un CTA unique milieu de page si taux conversion faible.                                                      |
| Liens footer Explore vers routes incertaines                                         | **MINEUR**    | Footer               | Vérifier routes `App.tsx` ou retirer.                                                                                |
| Légal hébergé Framer vs app                                                          | **MINEUR**    | Footer               | OK si Framer canonique ; sinon dupliquer pages légales sur app.                                                      |

---

## Synthèse exécutive

La landing **Vite `/`** (`LandingEnhanceAI`) est **structurellement alignée** avec le MVP InkFlow (demandes, acomptes, agenda, vitrine, flash, CRM). Le hero et la démo sont **honestes** depuis retrait du social proof studios/villes.

Le risque majeur est la section **Témoignages** + certaines **micro-copy chiffrées** (200+ tatoueurs, métriques individuelles, ROI « en moyenne », +3 RDV) : **affirmations vérifiables fausses ou non sourcées** alors que la base prod est vide.

Priorité absolue avant acquisition payante : **nettoyer toute social proof fictive**, **corriger les promesses features non universelles (Solo)**, **fixer ancres nav**, **harmoniser tu/vous**.

---

_Audit généré le 2026-08-07 — commit de référence workspace local, sans exécution BDD prod._
