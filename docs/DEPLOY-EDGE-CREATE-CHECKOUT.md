# Déployer l’Edge Function `create-checkout-session`

Cette fonction permet de générer un lien de paiement Stripe (acompte) depuis le dashboard. Voici comment la mettre en place.

---

## 1. Prérequis

- **Compte Supabase** et projet créé sur [supabase.com](https://supabase.com).
- **Compte Stripe** (Dashboard sur [dashboard.stripe.com](https://dashboard.stripe.com)).
- **Supabase CLI** installée sur ta machine.

### Installer la CLI Supabase

```bash
npm install -g supabase
```

Ou avec npx (sans installation globale) :

```bash
npx supabase --version
```

---

## 2. Lier le projet Supabase

À la racine du projet InkFlow :

```bash
cd c:\Users\lanie\OneDrive\.limpc\Bureau\inkdlow
npx supabase login
npx supabase link --project-ref VOTRE_PROJECT_REF
```

`VOTRE_PROJECT_REF` se trouve dans l’URL du projet Supabase :  
`https://app.supabase.com/project/VOTRE_PROJECT_REF` (Dashboard → Settings → General → Reference ID).

---

## 3. Récupérer la clé secrète Stripe

1. Va sur [dashboard.stripe.com](https://dashboard.stripe.com).
2. **Developers** → **API keys**.
3. En **Test mode** (pour commencer) : copie la clé **Secret key** (`sk_test_...`).
4. En **Live mode** (production) : utilise la clé **Secret key** (`sk_live_...`).

Ne partage jamais cette clé et ne la mets pas dans le code front.

---

## 4. Définir les secrets de la fonction

Les Edge Functions Supabase lisent des variables d’environnement définies comme “Secrets” dans le projet.

### Option A : Depuis le Dashboard Supabase

1. Ouvre ton projet sur [app.supabase.com](https://app.supabase.com).
2. **Edge Functions** (menu gauche) → **Secrets** (ou **Project Settings** → **Edge Functions**).
3. Ajoute les secrets suivants :

| Nom                | Valeur                    | Exemple                    |
|--------------------|---------------------------|----------------------------|
| `STRIPE_SECRET_KEY`| Ta clé secrète Stripe     | `sk_test_...` ou `sk_live_...` |
| `SITE_URL`         | URL de ton site en prod   | `https://inkflow.app` ou `https://ton-domaine.vercel.app` |

Pour du dev local avec redirection Stripe vers ton front :  
`SITE_URL` = `http://localhost:5173` (ou le port de ton serveur Vite).

### Option B : En ligne de commande

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxx
npx supabase secrets set SITE_URL=https://ink-flow.me
```

Remplace `sk_live_xxxx` par ta clé secrète Stripe (Dashboard → Developers → API keys). **Ne commite jamais la clé** : exécute la commande en local uniquement.

Remplace par ta vraie clé et ta vraie URL.

---

## 5. Déployer la fonction

### Si tu as l’erreur « INACTIVE » ou « Cannot retrieve service for project »

Cela signifie que le **projet Supabase est en pause** (plan gratuit après ~7 jours sans activité).

1. Ouvre le [Dashboard Supabase](https://app.supabase.com) et sélectionne ton projet.
2. Si une bannière indique que le projet est en pause, clique sur **Restore project**.
3. Attends la fin de la restauration (quelques minutes, un email peut confirmer).
4. Relance le déploiement :  
   `npx supabase functions deploy create-checkout-session`

### Déploiement

À la racine du projet :

```bash
npx supabase functions deploy create-checkout-session
```

Tu devrais voir un message du type :  
`Deployed Function create-checkout-session on project xxxxx`.

L’URL de la fonction sera :  
`https://VOTRE_PROJECT_REF.supabase.co/functions/v1/create-checkout-session`

Le front InkFlow appelle déjà cette URL via `supabase.functions.invoke('create-checkout-session', { body: ... })` si `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont bien configurés.

---

## 6. Vérifier que ça marche

1. Ouvre le dashboard InkFlow → **Demandes**.
2. Clique sur **Générer un lien d’acompte** pour un RDV.
3. Saisis un montant (ex. 50) et clique sur **Générer le lien de paiement**.

- Si tout est bon : une URL Stripe s’affiche et tu peux **Copier le lien**.
- Si tu vois **« Lien de paiement indisponible »** : la modale affiche maintenant **l’erreur exacte** renvoyée par Supabase ou Stripe. Lis ce message pour savoir quoi corriger.

---

## 6b. Toujours en erreur ?

1. **Voir l’erreur réelle**  
   Le message dans la modale (sous le montant) vient du backend. Exemples :
   - *"Function not found"* / *"FunctionsRelayError"* → la fonction n’est pas déployée ou le projet n’est pas le bon. Déploie : `npx supabase functions deploy create-checkout-session`.
   - *"Stripe checkout failed"* / *"Invalid API Key"* → mauvaise ou absente `STRIPE_SECRET_KEY`. Vérifie les secrets dans le Dashboard Supabase puis **redéploie** la fonction (les secrets sont lus au déploiement).
   - Pas de message précis → vérifie que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans ton front pointent bien vers le projet où la fonction est déployée.

2. **Redéployer après avoir mis les secrets**  
   Après `npx supabase secrets set STRIPE_SECRET_KEY=...` et `SITE_URL=...`, redéploie pour que la fonction prenne les nouvelles valeurs :  
   `npx supabase functions deploy create-checkout-session`

3. **Vérifier dans le Dashboard Supabase**  
   Edge Functions → la fonction `create-checkout-session` doit apparaître. Clique dessus pour voir les logs en cas d’erreur au moment du clic.

---

## 7. Table `inkflow_payments` (si besoin)

La fonction enregistre chaque session dans la table `inkflow_payments`. Si elle n’existe pas encore, crée-la (migration ou SQL dans l’éditeur SQL Supabase) avec au moins :  
`id`, `studio_id`, `appointment_id`, `stripe_session_id`, `amount`, `currency`, `status`, `type`, `client_name`, `client_email`, etc.  
Référence : `docs/SUPABASE_BOOTSTRAP.sql` ou tes migrations existantes.

---

## Résumé des commandes

```bash
npx supabase login
npx supabase link --project-ref VOTRE_PROJECT_REF
npx supabase secrets set STRIPE_SECRET_KEY=sk_xxx
npx supabase secrets set SITE_URL=https://ton-site.com
npx supabase functions deploy create-checkout-session
```

Une fois ces étapes faites, la génération de lien d’acompte depuis le dashboard utilise bien l’Edge Function `create-checkout-session`.
