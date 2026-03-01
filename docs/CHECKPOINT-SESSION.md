# Checkpoint session — Récapitulatif des modifications

## ✅ Réalisé aujourd'hui

### 1. Écran Agenda (mobile)
- **Barre de dates** : jour sélectionné en cercle bleu (`bg-blue-600`), autres sans fond
- **Vue Journée** : blocs RDV avec `rounded-r-xl rounded-l-sm`, bordure gauche bleue, fond pastel
- **Vue Liste** : format "19 LUN", ligne verticale, point bleu à côté de l'heure
- **FAB** : bouton "+" bleu en bas à droite

### 2. Page Demandes — Système d'emails
- **RDV tab** : "Confirmer" → email de confirmation ; "Générer lien acompte" → email avec lien Stripe
- **RDV vitrine** : "Accepter & Demander un acompte" → email avec lien Stripe ; "Confirmer" → email de confirmation
- **Projet** : "Demander un acompte" → email avec lien Stripe
- **Historique** : "Générer lien acompte" pour RDV confirmés sans acompte payé
- **Refus** : "Refuser" (RDV, RDV vitrine, Projet) → email de refus au client (`send-booking-refusal`)

### 3. Notifications
- **Web (dashboard)** : `useNotificationSync` — Web Notifications sur nouvelles demandes / acomptes (Supabase Realtime)
- **Mobile (Expo)** : `mobile/lib/notifications.ts` + `useNotificationSync` — notifications locales avec image et son

### 4. Calendrier — Refonte style calendar.me
- **AppointmentCalendar** : vues Semaine / Jour, cartes colorées par statut, modal détail
- **AppointmentsView** : sidebar sombre en mode calendrier
- **MiniCalendar** : variante `dark` pour la sidebar

### 5. Vitrine publique
- **Couleur principale** : forcée en bleu `#2563eb` (boutons Réserver, CTA)
- **Nom du studio** : en noir dans le header

---

## 📱 Mobile (Expo) — Guide de mise en place

Le dossier `mobile/` contient des composants React Native/Expo. InkFlow (web) est en Vite, donc les notifications mobiles nécessitent un **projet Expo séparé**.

**Étapes :**
1. Créer un projet : `npx create-expo-app@latest inkflow-mobile --template tabs`
2. Copier le dossier `mobile/` (HomeScreen, AgendaScreen, lib/)
3. Installer : `npx expo install expo-notifications expo-device` et `npm install @supabase/supabase-js`
4. Configurer dans `app.config.js` ou `.env` :
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
5. Passer `studioId` à HomeScreen depuis ton auth/context

---

## 🚀 Déploiement Edge Functions

```bash
npx supabase functions deploy send-booking-confirmation --no-verify-jwt
npx supabase functions deploy send-booking-refusal --no-verify-jwt
```

---

## 📋 TODOs existants (non bloquants)

| Fichier | TODO |
|---------|------|
| `lib/dashboardWidgetOrder.ts` | Sync vers API/base de données |
| `mobile/HomeScreen.tsx` | Navigation vers l'écran correspondant (menu) |

---

## 🧪 Vérifications recommandées

1. **Emails** : tester Confirmer, Refuser, Accepter & Demander acompte
2. **Web Notifications** : autoriser dans le navigateur, vérifier sur nouvel événement
3. **Calendrier** : vues Semaine/Jour, clic RDV → modal
4. **Vitrine** : boutons Réserver bleus, nom studio noir
