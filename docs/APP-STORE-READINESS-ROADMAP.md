# InkFlow — App Store Readiness & Studio OS Roadmap

Objectif : faire percevoir InkFlow comme un système d’exploitation de studio de tatouage, pas comme un simple dashboard web dans une app mobile.

## 1. Readiness App Store

### Déjà préparé

- App native Expo avec `bundleIdentifier` `me.inkflow.studio`.
- Notifications natives via `expo-notifications`.
- Deep links avec `inkflowpro://` et universal links `https://app.ink-flow.me`.
- Déclarations privacy iOS pour caméra, photothèque, micro et notifications distantes.
- WebView verrouillée sur `app.ink-flow.me`; les liens externes sortent dans le navigateur système.

### À finaliser avant soumission

- Publier les fichiers Apple/Android (sources dans [`public/.well-known/`](../public/.well-known/), guide placeholders : [`docs/WELL-KNOWN-LINKS.md`](WELL-KNOWN-LINKS.md)) :
  - `https://app.ink-flow.me/.well-known/apple-app-site-association` — injecter **`REPLACE_WITH_APPLE_TEAM_ID`** (Team ID × `me.inkflow.studio`).
  - `https://app.ink-flow.me/.well-known/assetlinks.json` — injecter **`REPLACE_WITH_SHA256_HEX_FROM_PLAY_CONSOLE`** (empreinte Play App Signing).
- Remplir App Privacy dans App Store Connect :
  - coordonnées client : nom, email, téléphone ;
  - données santé/consentement : informations sensibles, utilisées uniquement pour la prestation ;
  - achats/paiements : traités par Stripe ;
  - diagnostics/analytics : uniquement si consentement cookies/analytics.
- Valider la page Privacy Policy publique et lier l’URL dans App Store Connect.
- Tester sur build EAS réelle : notification reçue, badge, ouverture depuis push, lien `inkflowpro://appointment/{id}`.

### Tap to Pay Stripe

- **Web** : Terminal.js + lecteur Bluetooth (voir `SessionCloseoutSheet.tsx`) ; simulateur optionnel : `VITE_STRIPE_TERMINAL_SIMULATOR=true` **uniquement** avec clés Stripe **test**.
- **iPhone (Inkflow Pro)** : **`@stripe/stripe-terminal-react-native`** + écran **`inkflow-mobile/app/tap-to-pay.tsx`** + composant **`TapToPaySheet`** (`discoveryMethod: 'tapToPay'`). Edge **`stripe-terminal`** crée le PaymentIntent `card_present` côté Connect.
- **Handoff** : lien `https://app.ink-flow.me/tap-to-pay?…` → `TapToPayHandoffPage` → deep link `inkflowpro://tap-to-pay` (AASA : remplacer **`REPLACE_WITH_APPLE_TEAM_ID`** dans `public/.well-known/apple-app-site-association`).
- **Android** : pas de Tap to Pay NFC dans l’app ; lecteur physique ou lien client (message dans `TapToPaySheet`).
- Après paiement : webhook **`payment_intent.succeeded`** met à jour le solde (comportement existant).

#### Conformité Tap to Pay (Apple / Stripe)

- **Entitlements** : deux profils Apple (dev + publication) pour Tap to Pay on iPhone ; prise de contact Apple **`ttpoientitlements@apple.com`** si délai côté Stripe / provisioning.
- **App Review** : enregistrements d’écran montrant parcours complet (connexion, conditions si demandées, tap, écran de traitement, succès ou échec clair). Toolkit marketing Apple : Team ID **`Y28TH9SHX7`** (ressources officielles).
- **Comportement dans l’app** (`TapToPaySheet`) : callbacks Terminal pour **progression des mises à jour lecteur** et **acceptation des conditions** ; libellé explicite **« Traitement du paiement… »** après le tap, avant le résultat ; messages d’erreur FR pour les codes Tap to Pay (`lib/stripeTerminalTapToPayErrors.ts`).
- **France / Cartes Bancaires** : Edge **`stripe-terminal`** — pour les studios FR (pays `FR` / France, ou SIRET sans pays), le PaymentIntent inclut `payment_method_options.card_present.routing.requested_priority=domestic` (réseau domestique sur cartes co-marquées, voir API Stripe).
- **Warm-up** : le guide Apple recommande d’initialiser le flux tôt ; ici l’initialisation Terminal se fait à l’ouverture de l’encaissement (pas forcément au cold start) — à documenter si Apple exige un warm-up plus agressif.
- **Références** : [Stripe — Tap to Pay on iPhone](https://stripe.com/docs/terminal/payments/setup-reader/tap-to-pay) et guide PDF Stripe / Apple (mise à jour lecteur, UX, marchands).

## 2. Screenshot Story App Store

Chaque screenshot doit raconter un bénéfice métier clair.

1. **Aujourd’hui en studio**
   - Montrer le Today / Session Cockpit.
   - Copy : “Ta journée, tes séances et tes paiements en un écran.”

2. **Réservation + acompte**
   - Montrer une demande entrante et l’état d’acompte.
   - Copy : “Moins d’allers-retours, plus de rendez-vous confirmés.”

3. **Consentement + santé**
   - Montrer les statuts consentement signé / questionnaire santé présent.
   - Copy : “Les infos sensibles prêtes avant de tatouer.”

4. **Clôture de séance**
   - Montrer solde Stripe / Terminal + bouton stock & aiguilles.
   - Copy : “Encaisse, trace, clôture.”

5. **Fidélité client**
   - Montrer Wallet / carte fidélité / aftercare.
   - Copy : “Fais revenir les bons clients.”

6. **Pilotage finance & stock**
   - Montrer rentabilité séance, alertes stock, prochaine commande.
   - Copy : “Vois ce qui rapporte et ce qu’il faut racheter.”

## 3. Today / Session Cockpit

Le cockpit est le point d’entrée quotidien. Il doit concentrer :

- RDV du jour, prochain client, statut et service.
- Consentement signé ou manquant.
- Snapshot santé présent ou manquant.
- Acompte payé, solde restant, Stripe Connect prêt.
- Accès clôture de séance.
- Accès stock & traçabilité pour aiguilles, encres, consommables.

Extensions prioritaires :

- Ajouter un statut “prêt à tatouer” quand consentement + santé + acompte sont OK.
- Ajouter une action “demander consentement” qui ouvre le thread client avec le preset.
- Ajouter un coût consommables estimé par taille/type de tattoo.
- Ajouter une checklist post-session : photo, aftercare envoyé, avis demandé, fidélité créditée.

## 4. Aftercare + Wallet

Boucle de rétention à construire après le cockpit :

- J+0 : fiche aftercare envoyée automatiquement après clôture.
- J+3 : check cicatrisation court avec réponse client.
- J+14 : rappel retouche / conseil cicatrisation.
- J+30 : demande d’avis + invitation nouveau projet.
- Wallet : carte fidélité, points ou tampons, pass Apple Wallet / Google Wallet.

Signal produit attendu : le client ne voit pas seulement une facture, il voit un suivi pro.

## 5. Finance + Stock Intelligence

À connecter aux données existantes :

- Solde restant par RDV et relance automatique avant/après séance.
- Rentabilité séance = prix - estimation consommables - frais Stripe.
- Stock bas par consommable avec seuil studio.
- Suggestion de réassort basée sur RDV à venir et usage moyen.
- Vue “à commander cette semaine” avec fournisseur, prix et lien catalogue.

Première version simple : une carte dans le cockpit avec “marge estimée” et “stock critique”.

## 6. Growth Loop

Automatisations à forte perception App Store :

- Referral après client satisfait : lien parrainage envoyé à J+30.
- Attribution Instagram : tagger les demandes venant du lien bio ou stories.
- Review request : demander Google/App Store uniquement après RDV terminé et client satisfait.
- Portfolio loop : proposer de publier une photo anonymisée après consentement.
- Push “nouvelle demande” et “client répond” avec deep link direct dans la conversation.

## 7. Critères De Release

- Le build mobile ouvre le cockpit en moins de 3 secondes sur réseau normal.
- Tous les liens entrants restent dans le domaine autorisé ou s’ouvrent hors app.
- Les données santé/consentement ne sont jamais affichées dans notifications push.
- Un tatoueur peut terminer une séance depuis mobile en moins de 4 actions.
- Les screenshots App Store montrent de vraies données démo, pas des écrans vides.
