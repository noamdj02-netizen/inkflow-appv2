# Checklist Production — InkFlow

Audit appliqué et correctifs réalisés. À valider avant mise en production.

**Backups & reprise (P0.5) :** [BACKUP-RECOVERY-DR.md](BACKUP-RECOVERY-DR.md) — PITR Supabase, export hebdo hors site, test de restauration, runbook incidents.

**Monitoring (P0.6) :** [MONITORING-P0.md](MONITORING-P0.md) — Sentry prod (`VITE_SENTRY_DSN`), alertes e-mail, uptime externe, logs Vercel hebdo.

---

## 1. Nettoyage du code ✅

- **Console :** Tous les `console.log` / `console.error` / `console.warn` ont été retirés du code frontend (pas de log en production). Les Edge Functions conservent `console.error` dans les `catch` pour les logs serveur Supabase.
- **Mock data :** Les fallbacks ont été remplacés par des **tableaux vides** :
  - `useSupabaseDashboard` : plus de `MOCK_APPOINTMENTS` / `MOCK_CLIENTS` / etc. → `EMPTY_ARRAYS` (tableaux vides). Plus de branche « compte démo » avec fausses données.
  - `useIncomingBookings` : quand `!studioId` → `setBookings([])` (plus de `getDemoBookings()`).
  - `useProjectRequests` : quand `!studioId` → `setProjectRequests([])` (plus de `getDemoProjectRequests()`).
- **Empty states :** La vitrine Flash a déjà un empty state (« Aucun flash pour le moment »). Les listes vides du dashboard affichent les composants `EmptyState` existants.
- **Code mort :** Imports `demoData` supprimés des hooks de production (useSupabaseDashboard, useIncomingBookings, useProjectRequests). Le fichier `data/demoData.ts` reste disponible pour d’éventuels usages (ex. tests ou page démo).

---

## 2. Gestion des erreurs et UX ✅

- **Try/catch :** Les formulaires critiques (VitrineBookingForm, ProjectRequestForm) ont déjà `try/catch` et remontent les erreurs via `onError` ou toast.
- **Loaders :** Les boutons de soumission utilisent `isSubmitting` (react-hook-form) donc sont désactivés pendant l’envoi. La modale « Générer le lien d’acompte » affiche un spinner pendant l’appel à `createCheckoutSession`.
- **Empty state Flash :** Déjà en place dans `FlashGallery` (« Aucun flash pour le moment » + CTA « Ajouter mon premier flash »).

---

## 3. Sécurité et variables d’environnement ✅

- **Frontend :** Seules les variables **`VITE_*`** sont utilisées (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`). Aucune clé secrète (Stripe, SERVICE_ROLE, Resend) n’est exposée côté client.
- **Référence :** Voir **`docs/ENV-PRODUCTION.md`** pour la liste détaillée des variables publiques (VITE\_\*) et des secrets (Edge Functions uniquement).

---

## 4. Stripe (production) ✅

- **Webhook :** Vérification via **`Stripe.webhooks.constructEvent`** (SDK Stripe) + tolérance anti-replay. En production, **`STRIPE_WEBHOOK_SECRET`** est **obligatoire** : s’il est absent, le webhook renvoie **501** (Webhook secret not configured). Voir aussi **`docs/STRIPE-P0-PRODUCTION.md`** (go-live, portail, rejeu, TVA).
- **URLs :** `create-checkout-session` utilise **`SITE_URL`** pour `success_url` et `cancel_url` (pas de localhost). À configurer en production (ex. `https://inkflow.app`) dans les secrets des Edge Functions.

---

## 5. Build et TypeScript ✅ (partiel)

- **tsconfig :**
  - **`vite/client`** ajouté dans `types` pour que `import.meta.env` soit reconnu.
  - **`supabase/functions`** exclu du check (Deno, pas compilé par tsc).
- **Corrections effectuées :**
  - `useOptimisticMutation` / `useRealtimeSync` : plus de `React.Dispatch` → import de `Dispatch` et `SetStateAction` depuis `react`.
  - `ErrorBoundary` : typage explicite de `this` pour `props` / `state` / `setState` dans le rendu.
  - `InvoiceButton` : couleurs typées en tuple `[number, number, number]` pour les spreads `setFillColor` / `setTextColor` / `setDrawColor`.
  - `PublicStudioPagePro` : typage de `hours` (ouvertures) pour éviter `unknown`.
  - `demoData` : statut `'ACCEPTED'` remplacé par `'APPROVED'` pour correspondre à `ProjectRequestStatus`.
- **Erreurs restantes (Supabase) :** Les tables personnalisées (`inkflow_bookings`, `inkflow_messages`, `inkflow_appointments`, etc.) ne sont pas dans le type généré de la base, ce qui provoque des erreurs `never` sur les appels `.from(...).insert()`. **Recommandation :** exécuter `supabase gen types typescript --project-id <id> > types/database.ts` et utiliser ce type dans `createClient<Database>()` pour faire disparaître ces erreurs. Le build Vite peut malgré tout passer selon la config (vérifier avec `npm run build`).

---

## Actions recommandées avant la démo

1. **Variables d’environnement**  
   Renseigner en production : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, et en secrets Edge Functions : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL`.

2. **Stripe**  
   Configurer le webhook en mode Live avec l’URL de l’Edge Function `stripe-webhook` et définir `STRIPE_WEBHOOK_SECRET` dans les secrets.

3. **Build**  
   Lancer `npm run build` (ou `pnpm build`). Si des erreurs TypeScript bloquent, régénérer les types Supabase comme indiqué ci-dessus.

4. **Tests manuels**
   - Connexion → dashboard avec données vides ou réelles.
   - Création d’une réservation depuis la vitrine → apparition dans le dashboard.
   - Génération d’un lien d’acompte → copie du lien sans redirection.
   - Rafraîchissement après refus / changement de statut → état persistant.
