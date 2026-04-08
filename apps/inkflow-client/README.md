# Inkflow — app client (Expo)

Application **React Native** (Expo) pour **iOS + Android**, même backend Supabase que le site.

## Pourquoi Expo ici

- **Un seul codebase** TypeScript pour les deux stores.
- **EAS Build** produit les binaires signés (nécessaires pour App Store et Google Play).
- Aligné avec ton stack actuel (React + Supabase).

## Prérequis comptes stores

- **Apple** : compte Apple Developer (programme payant), App Store Connect.
- **Google** : compte Google Play Console (frais d’inscription une fois).
- **Expo** : compte sur [expo.dev](https://expo.dev) pour EAS.

## Navigation & auth

- **expo-router** : `app/index` (redirect), `app/login`, `app/set-password`, `app/dashboard`.
- **Lien magique** : même Edge Function que le web. Ajoute les URL de redirection Expo dans **Supabase → Auth → URL configuration** (ex. `exp://`, `inkflow://` — voir ce que renvoie le lien « Recevoir un email » en dev avec `Linking.createURL`).
- **Mot de passe** : si l’utilisateur a déjà défini un mot de passe sur le web, connexion directe dans l’app.

## Démarrage local

```bash
cd apps/inkflow-client
cp .env.example .env
# Renseigner EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY
npm run start
```

Android : émulateur ou appareil avec USB debugging.  
iOS : simulateur ou iPhone (sur **macOS** pour `npm run ios` ; sinon build cloud avec EAS).

## Builds pour les stores (EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile production
eas build --platform android --profile production
```

Soumission (après config des credentials Expo / stores) :

```bash
eas submit --platform ios
eas submit --platform android
```

Documentation : [EAS Build](https://docs.expo.dev/build/introduction/), [Submit](https://docs.expo.dev/submit/introduction/).

## Identifiants natifs

- **iOS** `bundleIdentifier` : `me.inkflow.client`
- **Android** `package` : `me.inkflow.client`

À adapter dans `app.json` si tu veux un autre identifiant (doit rester stable une fois les apps publiées).
