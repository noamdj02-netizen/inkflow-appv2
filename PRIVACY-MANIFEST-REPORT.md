# PRIVACY-MANIFEST-REPORT

> Date : 2026-08-05  
> App : **Inkflow Pro** (`inkflow-mobile/`, `me.inkflow.studio`)  
> **Pas de commit / pas de push** (en attente validation étape 1)

---

## Étape 1 — Permissions `infoPlist` (4 clés)

| Clé                                 | Statut                     | Texte final                                                                                                                                                             |
| ----------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NSCameraUsageDescription`          | **Gardée — texte modifié** | InkFlow utilise la caméra pour ajouter des photos à ton portfolio et ta vitrine, importer des flashs, et scanner les codes sur tes flacons d’encre (traçabilité stock). |
| `NSPhotoLibraryUsageDescription`    | **Gardée — texte ajusté**  | InkFlow accède à ta photothèque pour importer des références, flashs, images de vitrine, ton avatar et d’autres documents pour ton studio.                              |
| `NSPhotoLibraryAddUsageDescription` | **Retirée**                | —                                                                                                                                                                       |
| `NSMicrophoneUsageDescription`      | **Retirée**                | —                                                                                                                                                                       |

### Diff avant / après (les 4 clés)

```diff
- "NSCameraUsageDescription": "InkFlow utilise l’appareil photo pour ajouter des références, flashs et photos de séance.",
+ "NSCameraUsageDescription": "InkFlow utilise la caméra pour ajouter des photos à ton portfolio et ta vitrine, importer des flashs, et scanner les codes sur tes flacons d’encre (traçabilité stock).",

- "NSPhotoLibraryUsageDescription": "InkFlow utilise la photothèque pour importer des références client, flashs et documents de séance.",
+ "NSPhotoLibraryUsageDescription": "InkFlow accède à ta photothèque pour importer des références, flashs, images de vitrine, ton avatar et d’autres documents pour ton studio.",

- "NSPhotoLibraryAddUsageDescription": "InkFlow peut enregistrer des visuels ou documents générés pour ton studio.",
  (supprimée)

- "NSMicrophoneUsageDescription": "InkFlow peut utiliser le micro uniquement si une capture vidéo de séance est lancée depuis l’app.",
  (supprimée)
```

Fichier modifié : `inkflow-mobile/app.json`

---

## Étape 2 — Privacy manifest

### Fichiers créés / modifiés

| Fichier                                                 | Rôle                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| `inkflow-mobile/PrivacyInfo.xcprivacy`                  | Copie lisible / revue (XML plist) — **miroir** de la config |
| `inkflow-mobile/app.json` → `expo.ios.privacyManifests` | **Source de vérité build** (Expo prebuild / EAS)            |

### Contenu final (`PrivacyInfo.xcprivacy`)

- **NSPrivacyTracking** : `false`
- **NSPrivacyTrackingDomains** : `[]`
- **NSPrivacyAccessedAPITypes** : `UserDefaults` → raison `CA92.1` (session Supabase via AsyncStorage)
- **NSPrivacyCollectedDataTypes** :
  - `EmailAddress` — compte tatoueur
  - `UserID` — identifiant session Supabase
  - `DeviceID` — token push Expo (`register-native-device`)
  - `PaymentInfo` — Stripe Terminal / Checkout (traitement tiers)
  - `PreciseLocation` — Tap to Pay / Stripe Terminal (permission plugin)

Toutes : `Linked=true`, `Tracking=false`, purpose `AppFunctionality`.

### Inclusion dans le bundle iOS — comment ça marche

1. **`ios/` est gitignoré** (`inkflow-mobile/.gitignore` → `/ios`) → **EAS Build exécute `expo prebuild`** à chaque build cloud.
2. Le plugin **`@expo/config-plugins` → `withPrivacyInfo`** lit `expo.ios.privacyManifests` dans `app.json`.
3. Au prebuild, il **génère** `ios/{ProjectName}/PrivacyInfo.xcprivacy` et l’**ajoute au target Xcode** comme ressource (`addResourceFileToGroup`, `isBuildFile: true`).
4. Le fichier **`inkflow-mobile/PrivacyInfo.xcprivacy` à la racine du package n’est pas lu automatiquement** par Expo — il sert de **référence versionnée** alignée sur `privacyManifests`. **Ne pas** aussi committer un `ios/.../PrivacyInfo.xcprivacy` manuel (collision « Multiple commands produce »).

**Pas de plugin Expo supplémentaire requis** (SDK 55 inclut déjà `withPrivacyInfo`).

### Vérification locale (sans consommer quota EAS)

Tu peux lancer **localement** (je ne l’ai pas exécuté) :

```bash
cd inkflow-mobile
npx expo prebuild --platform ios --clean
# puis vérifier :
cat ios/*/PrivacyInfo.xcprivacy
grep -r PrivacyInfo.xcprivacy ios/*.xcodeproj/project.pbxproj
```

Dry-run EAS : `eas build --platform ios --profile production --local` (build complet, long) — **à lancer seulement si tu veux valider end-to-end**.

---

## Étape 3 — Vérification

| Commande                                            | Résultat                                 |
| --------------------------------------------------- | ---------------------------------------- |
| `npm run typecheck` (`inkflow-mobile/`)             | **PASS**                                 |
| `app.json` JSON valide + `privacyManifests` présent | **OK**                                   |
| Lint dédié `inkflow-mobile`                         | Pas de script `lint` dans `package.json` |

---

## Étape 4 — Prochaine build EAS

Avant `eas build --platform ios --profile production` :

1. **Valider ce diff** et committer quand tu es prêt.
2. **Déployer Vercel** si pas fait (AASA / assetlinks déjà corrigés en local).
3. Lancer build EAS — le manifest sera généré automatiquement au prebuild.
4. **App Store Connect** : remplir le questionnaire App Privacy (voir `APP-STORE-CHECKLIST.md`) — le plist ≠ le questionnaire ASC.
5. Après soumission : surveiller l’email Apple « missing API reasons » — copier d’éventuels codes manquants des deps (Stripe Terminal n’a pas de PrivacyInfo dans node_modules) dans `privacyManifests`.

Rien d’autre côté repo pour le manifest si tu build via EAS sans dossier `ios/` commité.

---

## Fichiers touchés (non commités)

- `inkflow-mobile/app.json` (infoPlist + `privacyManifests`)
- `inkflow-mobile/PrivacyInfo.xcprivacy` (nouveau)
- `PRIVACY-MANIFEST-REPORT.md` (ce fichier)
