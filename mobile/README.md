# Écran d'accueil mobile (React Native + Expo)

Ce dossier contient un composant **HomeScreen** qui reproduit l’écran d’accueil CRM/Dashboard (design pixel-perfect décrit).

## Utilisation dans un projet Expo

1. **Créer un projet Expo** (si besoin) :
   ```bash
   npx create-expo-app@latest mon-app --template tabs
   cd mon-app
   ```

2. **Installer NativeWind (Tailwind) et les icônes** :
   ```bash
   npm install nativewind tailwindcss
   npx tailwindcss init
   npm install lucide-react-native react-native-svg
   ```
   Suivre la [doc NativeWind](https://www.nativewind.dev/) pour configurer `babel.config.js` et `tailwind.config.js`.

3. **Copier le composant** :
   - Copie `HomeScreen.tsx` dans `app/` (Expo Router) ou `screens/` selon ta structure.
   - Dans ton écran principal ou `app/index.tsx` : `import HomeScreen from './HomeScreen';` puis `<HomeScreen />`.

4. **Palette utilisée** (définie dans le fichier) :
   - Fond app : `#E8E2F6`
   - Texte principal : `#1A1035`
   - Texte secondaire : `#7A5DD8`
   - Bouton principal : `#6B38E0`
   - Cartes / barre du bas : `#FFFFFF`

Le composant utilise un mélange de `style` inline (ombres, couleurs exactes) et de `className` (NativeWind) pour le layout. Si tu n’utilises pas encore NativeWind, tu peux remplacer les `className` par des `style` équivalents (flexDirection, etc.).
