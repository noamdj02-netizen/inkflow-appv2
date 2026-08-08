# APP-STORE-CHECKLIST — Inkflow Pro (`me.inkflow.studio`)

Checklist **hors code** (App Store Connect + Review) pour une resoumission propre.  
Complète le travail repo déjà fait : AASA / assetlinks (étape 4), et le `PrivacyInfo.xcprivacy` (étape 5 — à valider puis ajouter).

Dernière revue code : 2026-08-05 · shell `inkflow-mobile/` (Expo WebView + Tap to Pay + Stripe Terminal).

---

## 0. Déjà fait / à déployer

| Item                                                | Statut                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| AASA Team ID `Z38CK66528.me.inkflow.studio`         | Corrigé en local — **déployer Vercel** puis `curl` les `.well-known`                       |
| `assetlinks.json` SHA256 EAS keystore               | Corrigé en local — **déployer** ; si Play App Signing : **ajouter** aussi le SHA256 Google |
| Universal Links `associatedDomains` dans `app.json` | Présent (`applinks:app.ink-flow.me`, `ink-flow.me`)                                        |
| Privacy Policy URL publique                         | Vérifier `/politique-confidentialite` (ou équivalent) et la coller dans ASC                |

---

## 1. Questionnaire App Privacy (ASC → App Privacy)

Réponses **probables** déduites du code natif + WebView `app.ink-flow.me`. Coche toi-même dans ASC ; ajuster si ta politique réelle diffère.

### Tracking

| Question                                                      | Réponse proposée | Pourquoi (code)                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L’app suit-elle les utilisateurs (ATT / tracking cross-app) ? | **Non**          | Pas d’ATT / IDFA dans `inkflow-mobile`. Pas de PostHog/Sentry natifs. La WebView charge le dashboard web qui peut avoir analytics — si PostHog/Sentry web sont actifs pour les tatoueurs connectés, déclarer **Usage Data / Diagnostics** ci-dessous, mais en général **pas** « Tracking » au sens ATT sauf si tu utilises les données pour pubs tierces. |

### Données collectées (catégories ASC)

| Catégorie ASC                                    | Collecte ?                            | Liée à l’identité ?        | Usages typiques à cocher                   | Preuve code                                                                                                  |
| ------------------------------------------------ | ------------------------------------- | -------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Coordonnées — Email**                          | Oui                                   | Oui                        | Fonctionnalité app, compte                 | Auth Supabase (`lib/supabase.ts`)                                                                            |
| **Coordonnées — Nom**                            | Oui                                   | Oui                        | Fonctionnalité app                         | Profil studio (via WebView / Supabase)                                                                       |
| **Coordonnées — Téléphone**                      | Oui (CRM clients)                     | Oui (clients du studio)    | Fonctionnalité app                         | CRM web dans WebView                                                                                         |
| **Identifiants — Identifiant utilisateur**       | Oui                                   | Oui                        | Fonctionnalité app                         | Session Supabase                                                                                             |
| **Identifiants — Identifiant appareil**          | Oui                                   | Oui (lié au compte studio) | Fonctionnalité app                         | Expo Push token → Edge `register-native-device`                                                              |
| **Informations financières — Infos de paiement** | Oui (traitement)                      | Oui                        | Fonctionnalité app ; **traité par Stripe** | Stripe Terminal / Checkout (`TapToPaySheet`, `createBalanceCheckout`) — InkFlow ne stocke pas le PAN         |
| **Localisation — Précise**                       | Oui (au moment du paiement TTP)       | Oui                        | Fonctionnalité app                         | Plugin Stripe Terminal : `locationWhenInUsePermission` dans `app.json`                                       |
| **Santé & forme**                                | Oui (données **clients** du tatoueur) | Oui                        | Fonctionnalité app                         | Formulaires santé / consentement dans le produit web (WebView) — **sensible** : rester aligné privacy policy |
| **Données d’utilisation — Interactions produit** | Possible                              | Possible                   | Analytics / amélioration produit           | Uniquement si analytics web actifs dans le dashboard chargé                                                  |
| **Diagnostics — Données de crash / perf**        | Possible                              | Possible                   | Diagnostics                                | Uniquement si Sentry (ou équivalent) tourne dans la WebView                                                  |

**Tiers** à mentionner souvent : **Stripe**, **Supabase**, **Expo (push)**, éventuellement **Vercel** / hébergeur analytics.

---

## 2. Permissions natives (`app.json`) — texte reviewer

Déclarées aujourd’hui :

| Clé                                         | Texte actuel (résumé)                                | OK pour un reviewer ?                           | Action                                                                                                                                                                                                                     |
| ------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NSCameraUsageDescription`                  | Photos références / flashs / séance                  | **Risqué**                                      | Aucun usage caméra natif trouvé dans `inkflow-mobile/` (hors ce que Stripe/WebView pourrait ouvrir). Soit **prouver** un chemin caméra, soit **retirer** la clé avant soumission pour éviter « permission non justifiée ». |
| `NSPhotoLibraryUsageDescription`            | Import références / flashs / docs                    | **Risqué**                                      | Idem — surtout via WebView `<input type=file>` ; le prompt iOS natif photo library n’est pas forcément déclenché. Clarifier ou retirer.                                                                                    |
| `NSPhotoLibraryAddUsageDescription`         | Enregistrer visuels                                  | **Risqué**                                      | Idem                                                                                                                                                                                                                       |
| `NSMicrophoneUsageDescription`              | « uniquement si capture vidéo de séance »            | **Risqué**                                      | Aucune capture vidéo native trouvée. Fort candidat au **retrait**.                                                                                                                                                         |
| Localisation (plugin Stripe)                | « position pour sécuriser les paiements Tap to Pay » | **Bon**                                         | Aligné Stripe / Apple Tap to Pay                                                                                                                                                                                           |
| `UIBackgroundModes` → `remote-notification` | —                                                    | **Bon**                                         | Push Expo utilisés (`WebAppShell`, `expo-notifications`)                                                                                                                                                                   |
| `ITSAppUsesNonExemptEncryption` = false     | —                                                    | **OK** si tu restes en exemption standard HTTPS | Vérifier questionnaire export compliance ASC                                                                                                                                                                               |

---

## 3. Note aux reviewers (brouillon à coller dans ASC)

> Inkflow Pro is a business tool for professional tattoo artists (France/EU) to manage their studio: calendar, client CRM, booking deposits, and in-person payments.
>
> **Account**: use the demo / review credentials we provide in this notes field (email + password). The app loads our production web dashboard inside a WebView restricted to `app.ink-flow.me`.
>
> **Tap to Pay on iPhone**: available on a physical iPhone with a development/production build that includes the Stripe Terminal native module (not Expo Go). Flow: open an appointment balance → Tap to Pay sheet → customer taps iPhone → payment processed via Stripe Connect. Location access is requested only to satisfy Stripe Terminal / Tap to Pay requirements.
>
> **Push notifications**: optional; used for new bookings and studio alerts. Universal Links: `https://app.ink-flow.me/...` should open the app when installed.
>
> We do not sell user data. Client health/consent forms are collected for the tattoo service under the artist’s responsibility; see our Privacy Policy: https://app.ink-flow.me/politique-confidentialite

_(Complète avec un vrai compte reviewer + MDP avant soumission.)_

---

## 4. Tap to Pay / paiements — points Review fréquents

- [ ] Entitlements Apple **Tap to Pay on iPhone** provisionnés (profils + contact `ttpoientitlements@apple.com` si bloqué — voir `docs/APP-STORE-READINESS-ROADMAP.md`)
- [ ] Vidéo / captures du flux TTP (connexion → conditions Stripe si demandées → tap → « Traitement… » → succès/échec)
- [ ] Compte Stripe Connect de review en état « charges enabled » (ou mode test documenté)
- [ ] Expliquer qu’Android n’a pas le NFC TTP dans cette app (lecteur / lien client)
- [ ] Ne pas soumettre une build **Expo Go** / simulateur-only comme binaire Review

---

## 5. Screenshots & métadonnées ASC

Voir aussi `docs/APP-STORE-SCREENSHOTS-EXPORT.md` (cible **1284×2778**).

- [ ] Jeu **iPhone 6,5"** (obligatoire) — 5 frames Figma documentées
- [ ] Autres tailles si ASC les exige encore pour ton compte (ex. 6,7" / iPad si `supportsTablet: true`)
- [ ] Description FR + sous-titre + mots-clés
- [ ] Catégorie (ex. Business / Productivity)
- [ ] Âge / contenu : pas de UGC public grand public ; CRM pro — choisir rating cohérent
- [ ] Copyright, support URL (`ink-flow.me` / aide), marketing URL

---

## 6. Build & soumission technique

- [ ] `eas build --platform ios --profile production` (credentials default **2kRxHSvyMC** — éviter le 2ᵉ keystore `nFaMs5sE1o` sauf intention)
- [ ] Inclure **PrivacyInfo** (fichier +/ou `ios.privacyManifests` dans `app.json` — après validation étape 5)
- [ ] `eas submit` avec `ascAppId` `6764879264` / Team `Z38CK66528`
- [ ] Tester sur device : login, push, deep link `inkflowpro://tap-to-pay`, Universal Link `/dashboard`
- [ ] Après deploy Vercel : valider AASA  
       `curl -sI https://app.ink-flow.me/.well-known/apple-app-site-association`  
       (Content-Type JSON, pas HTML)

---

## 7. Hors scope cette checklist (rappel)

- App **cliente** `me.inkflow.client` (`apps/inkflow-client/`) = soumission **séparée**
- Remplir Privacy Nutrition Labels ≠ seulement le fichier `PrivacyInfo.xcprivacy` (les deux sont requis / complémentaires)
