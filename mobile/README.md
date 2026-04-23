# Écran d'accueil mobile (React Native + Expo)

Ce dossier contient un composant **HomeScreen** qui reproduit l’écran d’accueil CRM/Dashboard (design pixel-perfect décrit).

## Notifications Rich Media

Le système de notifications locales (avec son et image) est intégré. Pour l'activer :

1. **Installer les dépendances** :
   ```bash
   npx expo install expo-notifications expo-device
   ```

2. **Configuration** : Le handler est configuré automatiquement au chargement de `HomeScreen`. Les permissions sont demandées au montage.

3. **Test** : Appuyez 5 fois rapidement sur « Bonjour Noam 👋 » pour déclencher une notification de test (image + son).

4. **Utilisation programmatique** :
   ```ts
   import { sendTestNotification } from './lib/notifications';

   await sendTestNotification({
     title: 'Nouvelle demande !',
     body: 'Jeanne a réservé le Flash Floral',
     imageUrl: 'https://exemple.com/flash.jpg',
   });
   ```

5. **Sync avec dashboard / planning / calendrier** :
   - Configure `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` (mêmes valeurs que le dashboard web).
   - Installe `@supabase/supabase-js` : `npm install @supabase/supabase-js`
   - Passe `studioId` à HomeScreen : `<HomeScreen studioId={studioId} />` (depuis ton auth/context).
   - Les notifications seront déclenchées automatiquement quand une nouvelle demande ou un acompte arrive (Supabase Realtime).

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

4. **Navigation** : Branche `onNavigate` pour naviguer vers les écrans correspondants (drawer, bottom bar, boutons rapides) :
   ```tsx
   import { useRouter } from 'expo-router';
   import HomeScreen, { type HomeScreenNavId } from './HomeScreen';

   const router = useRouter();
   const handleNavigate = (screen: HomeScreenNavId) => {
     const routes: Record<HomeScreenNavId, string> = {
       overview: '/', requests: '/requests', appointments: '/appointments',
       'new-appointment': '/appointments/new', flash: '/flash', 'block-slot': '/block-slot',
       clients: '/clients', vitrine: '/vitrine', settings: '/settings', widget: '/widget',
     };
     router.push(routes[screen] ?? '/');
   };

   <HomeScreen studioId={studioId} onNavigate={handleNavigate} />
   ```

5. **Palette utilisée** (définie dans le fichier) :
   - Fond app : `#E8E2F6`
   - Texte principal : `#1A1035`
   - Texte secondaire : `#7A5DD8`
   - Bouton principal : `#6B38E0`
   - Cartes / barre du bas : `#FFFFFF`

Le composant utilise un mélange de `style` inline (ombres, couleurs exactes) et de `className` (NativeWind) pour le layout. Si tu n’utilises pas encore NativeWind, tu peux remplacer les `className` par des `style` équivalents (flexDirection, etc.).

## AgendaScreen

Composant **AgendaScreen** — écran Agenda style Calendrier Apple (design épuré, bleu + fond sombre/clair).

- **Vues** : Liste | Journée (toggle en haut)
- **Barre de dates** : ScrollView horizontale, jour sélectionné en cercle bleu
- **Vue Journée** : Colonne heures 08:00–20:00 + blocs RDV (bordure gauche bleue, fond pastel)
- **Vue Liste** : Jour à gauche (ex: "19 LUN"), ligne verticale, RDV à droite
- **FAB** : Bouton "+" bleu en bas à droite

```tsx
import AgendaScreen, { toAgendaAppointment } from './AgendaScreen';

<AgendaScreen
  appointments={appointments.map(toAgendaAppointment)}
  onAddAppointment={() => {}}
  onAppointmentPress={(apt) => {}}
/>
```
