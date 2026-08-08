# Universal Links & App Links (`.well-known`)

Héberger **`https://app.ink-flow.me/.well-known/*`** depuis ce dépôt : les fichiers sont dans [`public/.well-known/`](../public/.well-known/) (copiés tels quels dans `dist/` au build Vite).

## Fichiers

| Fichier                      | Usage                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `apple-app-site-association` | iOS Associated Domains — **sans extension**.                                                                |
| `assetlinks.json`            | Android Digital Asset Links (`autoVerify` dans [`inkflow-mobile/app.json`](../../inkflow-mobile/app.json)). |

## Placeholders obligatoires avant prod Apple

Le Team ID Apple n’est **pas** versionné dans le repo. Dans `apple-app-site-association`, remplace **`REPLACE_WITH_APPLE_TEAM_ID`** par le Team ID depuis [Apple Developer → Membership](https://developer.apple.com/account).

Format `appID` : **`{TEAM_ID}.me.inkflow.studio`** (voir `bundleIdentifier` Expo).

### `webcredentials`

Le bloc `webcredentials.apps` doit lister des entrées au format **`{TEAM_ID}.me.inkflow.studio`** (pas le seul numéro Team ID). Vérifie que le préfixe correspond **exactement** à ton compte — sinon modifie ou supprime le bloc `webcredentials` si tu n’utilises pas Password AutoFill lié au domaine.

Serveur :

- MIME type conseillé : **`application/json`** pour l’AASA (certains hébergeurs servent sans type — Apple peut tolérer, mais CDN/Vercel : vérifier les headers).

## Placeholders Android

Dans `assetlinks.json`, remplace **`REPLACE_WITH_SHA256_HEX_FROM_PLAY_CONSOLE`** par l’empreinte **SHA-256** du certificat **App Signing** (Google Play Console → votre app → Réglages d’application → Certification).

Ajoute plusieurs entrées dans `sha256_cert_fingerprints[]` si tu as **upload key** vs **Google Play signing** à documenter selon votre pipeline.

## Vérifications manuelles (EAS / store)

Référencées dans [`APP-STORE-READINESS-ROADMAP.md`](APP-STORE-READINESS-ROADMAP.md) :

- Build **`eas build`** (profil défini dans `inkflow-mobile/`) sur **appareil réel iOS/Android** après remplacement des placeholders.
- Ouverture depuis **Mail ou Notes** : `https://app.ink-flow.me/dashboard` → proposition d’ouvrir **Inkflow Pro** (Associated Domains + AASA corrects).
- **Android** : `adb shell dumpsys package domain-preferred-apps` pour contrôler Digital Asset Links ; ajuster fingerprints si erreur ou intent dans le navigateur au lieu de l’app.
- Ping `https://app.ink-flow.me/.well-known/apple-app-site-association` et `.well-known/assetlinks.json` après déploiement : **HTTP 200**, corps **JSON** (pas de fallback HTML SPA / 404 Vite router).

## Schéma custom

L’app tatoueur déclare `inkflowpro://` dans Expo ; les liens HTTPS universels sont complémentaires pour ouvrir l’app native depuis email / Safari.
