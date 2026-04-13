# Playbook Cursor — InkFlow (version améliorée)

Ce document **remplace / complète** le PDF « Prompts Cursor pour l’application Ink Flow » avec des consignes **alignées sur le repo réel** (Vite + React, Supabase, Edge Functions, Stripe) et une **priorisation MVP**.

---

## Ce qui manquait dans le PDF d’origine

| Problème | Pourquoi ça limite la qualité |
|----------|-------------------------------|
| Aucun **contexte technique** (stack, chemins, RLS) | L’IA invente des patterns ou du Next.js alors que le projet est une **SPA Vite** (`App.tsx`, `lib/supabase.ts`). |
| Pas de **critères d’acceptation** | « Développe » sans fin = scope qui dérive. |
| **Mélange MVP / V2** (ex. fidélité avancée, plan 99 €) | Le [CLAUDE.md](../CLAUDE.md) exclut le plan Studio (99 €) avant la date MVP ; la fidélité est **partielle** dans l’audit ([AUDIT-DASHBOARD.md](./AUDIT-DASHBOARD.md)). |
| Pas de **sécurité / RLS / secrets** | Risque de proposer des clés côté client ou d’ignorer les policies Supabase. |
| Pas de **design system** | Incohérence UI (tokens `ink` / zinc, pas de `bg-white` sur le shell pro). |

**Règle d’usage :** colle toujours le **bloc contexte** ci‑dessous en tête de conversation, puis **un seul** prompt numéroté + critères de done.

---

## Bloc contexte — à coller avant chaque tâche

```
Tu travailles sur InkFlow (SaaS tatoueurs), repo Vite + React + TypeScript + Tailwind.
Point d’entrée routes : App.tsx. Client Supabase : lib/supabase.ts. Dashboard : components/dashboard/DashboardPro.tsx.
Données : tables inkflow_* sur Supabase — respecter RLS ; jamais SERVICE_ROLE côté navigateur (seulement VITE_SUPABASE_*).
Paiements : Edge Functions + Stripe ; secrets dans Supabase, pas en VITE_*.
UI pro : dark-first, tokens ink / zinc, zones cliquables ≥44px, lucide-react, toasts via useToast.
Ne pas introduire de plan Studio 99 € ni refonte multi-langue avant décision produit.
À la fin : résumer fichiers modifiés + comment tester manuellement + risques RLS/stripe.
```

---

## 1. CRM (clients, notes, historique)

### Prompt amélioré

```
Objectif : renforcer le CRM existant (ClientList, fiches clients, Supabase inkflow_clients / RDV).

Tâche :
- Vérifier que création/édition client, notes privées (si colonne ou table prévue), et lien avec rendez-vous sont cohérents avec le schéma actuel.
- Toute nouvelle colonne = migration Supabase + types + affichage dashboard + gestion d’erreur (toast).

Critères de done :
- [ ] Aucune régression sur liste clients et détail.
- [ ] Erreurs Supabase affichées (pas d’échec silencieux).
- [ ] RLS : un studio ne voit que ses clients (vérifier policies).

Hors scope sauf demande explicite : export massif, import Excel avancé (déjà partiellement géré ailleurs).
```

---

## 2. Fidélité (points, réductions)

### Prompt amélioré

```
Contexte produit : la fidélité peut être partiellement locale ou incomplète — lire docs/AUDIT-DASHBOARD.md avant de promettre du 100 % cloud.

Tâche :
- Si on ajoute des points : définir source de vérité (Supabase vs état local), règles idempotentes (un RDV complété = +N points une seule fois).
- UI : solde visible côté tatoueur ; pas de logique métier critique uniquement en localStorage.

Critères de done :
- [ ] Pas de double attribution de points sur refresh.
- [ ] Documenter les limites connues dans un commentaire ou doc courte si nécessaire.

Éviter : programme marketing complexe avant que le stockage soit fiable côté Supabase.
```

---

## 3. Abonnements Stripe Billing (29 / 39 / 99 €)

### Prompt amélioré

```
Le plan 99 € « Studio » est HORS scope MVP strict (voir CLAUDE.md). Se concentrer sur Solo/Pro si les Payment Links / webhooks existent déjà.

Tâche :
- Cartographier create-subscription / Payment Links / garde useSubscriptionPermissions.
- Expliciter ce que chaque plan débloque (modules, limites) dans le code ou SETTINGS, sans casser les abonnés actuels.

Critères de done :
- [ ] Stripe Live/Test : variables SITE_URL, webhooks OK.
- [ ] Annulation / échec paiement : message utilisateur clair.

Ne pas : ajouter un troisième palier complexe le jour du lancement sans test billing.
```

---

## 4. Vitrine & réservation publique

### Prompt amélioré

```
Routes : /studio/:slug, /book/:slug. Calendrier et dispos : respecter la logique existante (hooks, Edge, fuseaux).

Tâche :
- Amélioration incrémentale : dispos, acompte Stripe, messages d’erreur réseau, états de chargement.
- Ne pas dupliquer une deuxième « source de vérité » pour les créneaux sans migration.

Critères de done :
- [ ] Parcours client testé : vitrine → réservation → succès ou erreur métier lisible.
- [ ] Aucune clé secrète Stripe en frontend.

Hors scope rapide : moteur de remboursement automatique multi-scénarios sans spec métier écrite.
```

---

## 5. Notifications (email / in-app)

### Prompt amélioré

```
Emails : Resend via Edge Functions ; vérifier secrets et idempotence des envois.

Tâche :
- Lister les événements déjà branchés (RDV, booking, rappels) et combler les trous documentés (ex. rappels) plutôt que tout réécrire.
- In-app : centre de notifications existant — étendre sans casser le realtime.

Critères de done :
- [ ] Pas d’email en boucle sur webhook Stripe dupliqué.
- [ ] Logs / gestion d’erreur côté fonction.

Éviter : « système de notif robuste » vague — préférer une issue à la fois.
```

---

## 6. Portail client & découverte (carte, avis, favoris)

### Prompt amélioré

```
Découverte : pages discover/, ClientDashboard, Google Maps (VITE_GOOGLE_MAPS_* avec restrictions referrer).

Tâche :
- Carte : respecter quotas et clés ; fallback si clé absente.
- Avis : une note par RDV complété si règle métier — contrainte unique côté BDD si besoin.
- Favoris : réutiliser logique client existante (clientFavorites, etc.) si présente.

Critères de done :
- [ ] Pas d’appels Places/Maps avec clé serveur en VITE.
- [ ] Anti-abus : pas d’avis sans lien RDV (RLS ou check serveur).

Éviter : refaire TripAdvisor en une passe ; livrer un flux minimal testable.
```

---

## Checklist avant de valider une « perfection » SaaS

1. `npm run ci` vert.  
2. `npm run qa:audit-vite` + parcours P0 manuels ([MVP-STATUS-AND-AUDIT.md](./MVP-STATUS-AND-AUDIT.md) §6).  
3. Pas de promesse UI sur une feature dont les données ne sont pas persistées côté Supabase.  
4. Une phrase produit honnête sur ce qui est stable vs en bêta.

---

## Synthèse

Le PDF original est une **bonne grille d’idées** ; ce playbook ajoute **contexte repo**, **limites MVP**, **sécurité** et **definition of done** pour que Cursor (ou tout autre agent) produise des changements **reviewables** et **déployables**, pas une refonte magique.
